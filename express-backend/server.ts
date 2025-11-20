const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
import pool from "./pool";
import profileRoutes from "./flipbookProfile";


type Request = import("express").Request;
type Response = import("express").Response;


dotenv.config()

const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'gkes9Vwl5lJlO3w';
const app = express()

// Middleware
app.use(express.json());
app.use(cors())

app.use("/profile", profileRoutes)



// Test DB connection
pool.connect()
    .then(() => console.log("✅ Connected to PostgreSQL"))
    .catch((err: string) => console.error("❌ DB connection error ", err))


// Interfaces
interface SignUpFormData {
    fullName: string;
    username: string;
    cpuEmail: string;
    password: string;
    rePassword: string;
}

interface ValidationResult {
    isValid: boolean;
    errors: Record<string, string>
}

interface ResetPasswordBody {
    resetToken: string;
    newPassword: string;
    rePassword: string;
}

interface CreateProjectRequestBody {
    title: string;
    description: string;
    roles: string[];
}

// Interface for requests that have been processed by the auth middleware
interface AuthenticatedRequest extends Request {
    userId?: number;
    username?: string;
    email?: string;
}

// --- Nodemailer Transporter ---
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,

  },
});

// --- AUTHENTICATION MIDDLEWARE ---
const authMiddleware = (req: AuthenticatedRequest, res: Response, next: () => void) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Access denied. No token provided.' });
    }

    const token = authHeader.split(' ')[1];

    try {
        // Verify the token
        const decoded = jwt.verify(token, JWT_SECRET) as { id: number; username: string; email: string };
        
        // Attach user info to the request object
        req.userId = decoded.id;
        req.username = decoded.username;
        req.email = decoded.email;
        
        next(); // Proceed to the route handler
    } catch (ex) {
        console.error("JWT verification error:", ex);
        res.status(403).json({ message: 'Invalid token.' });
    }
};


// Validation for Signup
const validateSignUpData = (data: SignUpFormData): ValidationResult => {
    const errors: Record<string, string> = {};
    const { fullName, username, cpuEmail, password, rePassword } = data;

    
    // Check if forms are filled out
    if (!fullName) errors.fullName = "Full name is required.";
    if (!username) errors.username = "Username is required."
    if (!cpuEmail) errors.cpuEmail = "CPU email is required."
    if (!password) errors.password = "Password is required."
    if (!rePassword) errors.rePassword = "Re-enter password is required."

    // Validate Password Match
    if (cpuEmail && !cpuEmail.endsWith("@cpu.edu.ph")) {
        errors.cpuEmail = "Must use CPU email address!";
    }

    if (password && rePassword && password !== rePassword) {
        errors.rePassword = "Passwords does not match!"
    }

    return {isValid: Object.keys(errors).length === 0, errors}
}

// Validate for Login
const validateLoginData = (data: Pick<SignUpFormData, 'cpuEmail' | 'password'>): ValidationResult => {
    const { cpuEmail, password } = data;
    const errors: Record<string, string> = {};

    if (!cpuEmail) errors.cpuEmail = "Email is required";
    if (!password) errors.password = "Password is required";

    return {
        isValid: Object.keys(errors).length === 0,
        errors,
    };
};

// Signup Route
app.post("/api/signup", async (req: Request, res: Response) => {
    // Explicitly type req.body to SignUpFormData
    const data: SignUpFormData = req.body;
    const { isValid, errors } = validateSignUpData(data);

    if (!isValid) {
        return res.status(400).json({
            message: "Validation failed.",
            errors
        });
    }

    try {
        const { fullName, cpuEmail, username, password } = data;
        const hashedPassword = await bcrypt.hash(password, 10);

        const result = await pool.query(
            `INSERT INTO users (fullname, username, email, password) 
            VALUES ($1, $2, $3, $4) 
            RETURNING id, username, email, fullname`,
            [fullName, username, cpuEmail, hashedPassword]
        );

        res.status(201).json({
            message: 'Sign-up successful!',
            user: {
                id: result.rows[0].id,
                username: result.rows[0].username,
                email: result.rows[0].email,
                fullname: result.rows[0].fullname
            }
        });
    } catch (error: any) {
        console.error('❌ Error signing up:', error);

        // Check for PostgreSQL's unique violation error code (23505)
        if (error.code === '23505') {
            return res.status(409).json({ message: 'User with this email already exists' });
        }
        res.status(500).json({ message: 'Server error during sign-up.' });
    }
});


// Login Route
app.post('/api/login', async (req: Request, res: Response) => {
    // Explicitly type req.body
    const data: Pick<SignUpFormData, 'cpuEmail' | 'password'> = req.body;
    const { isValid, errors } = validateLoginData(data);

    if (!isValid) {
        return res.status(400).json({
            message: "Validation failed.",
            errors,
        });
    }

    const { cpuEmail, password } = data;

    try {
        const userResult = await pool.query(
            "SELECT id, username, email, password FROM users WHERE email = $1",
            [cpuEmail]
        );

        if (userResult.rows.length === 0) {
            return res.status(401).json({
                message: "Invalid Credentials."
            });
        }

        const user = userResult.rows[0];
        const hashedPassword = user.password;

        const passwordMatch = await bcrypt.compare(password, hashedPassword);

        if (!passwordMatch) {
            return res.status(401).json({ message: "Invalid Credentials." });
        }

        const token = jwt.sign(
            { id: user.id, username: user.username, email: user.email },
            JWT_SECRET,
            { expiresIn: '1d' }
        );

        res.status(200).json({
            message: "Login successful!",
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email
            }
        });
    } catch(error) {
        console.error('❌ Error during login:', error);
        res.status(500).json({ message: 'Server error during login.' });
    }
});


//forgot password route
import crypto from "crypto";

app.post("/api/forgot-password", async (req: Request, res: Response) => {
    const { cpuEmail }: { cpuEmail: string } = req.body;

    if (!cpuEmail) {
        return res.status(400).json({ message: "Email is required." });
    }

    try {
        // Check if user exists
        const userResult = await pool.query(
            "SELECT id FROM users WHERE email = $1",
            [cpuEmail]
        );

        if (userResult.rows.length === 0) {
            return res.status(404).json({ message: "User not found." });
        }

        const userId = userResult.rows[0].id;

        // Generate secure reset token
        const resetToken = require("crypto").randomBytes(32).toString("hex");
        const expires = new Date(Date.now() + 1000 * 60 * 60); // 1 hour

        // Store token and expiry in DB
        await pool.query(
            "UPDATE users SET reset_token = $1, reset_token_expires = $2 WHERE id = $3",
            [resetToken, expires, userId]
        );

        // Construct reset link
        const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

        // Send email via Nodemailer
        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: cpuEmail,
            subject: "Reset Your Password",
            html: `
                <p>You requested a password reset.</p>
                <p>Click <a href="${resetLink}">here</a> to reset your password.</p>
                <p>This link expires in 1 hour.</p>
            `
        });

        res.status(200).json({
            message: "Password reset link sent via email."
        });
    } catch (error) {
        console.error("❌ Error in forgot-password:", error);
        res.status(500).json({ message: "Server error during password reset." });
    }
});

// Reset Password Route
app.post("/api/reset-password", async (req: Request, res: Response) => {
    const data: ResetPasswordBody = req.body;
    const { resetToken, newPassword, rePassword } = data;

    if (!resetToken || !newPassword || !rePassword) {
        return res.status(400).json({ message: "All fields are required." });
    }

    if (newPassword !== rePassword) {
        return res.status(400).json({ message: "Passwords do not match." });
    }

    try {
        // Find user with matching token that has not expired
        const userResult = await pool.query(
            "SELECT id FROM users WHERE reset_token = $1 AND reset_token_expires > NOW()",
            [resetToken]
        );

        if (userResult.rows.length === 0) {
            return res.status(400).json({ message: "Invalid or expired reset token." });
        }

        const userId = userResult.rows[0].id;

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update password and remove token
        await pool.query(
            "UPDATE users SET password = $1, reset_token = NULL, reset_token_expires = NULL WHERE id = $2",
            [hashedPassword, userId]
        );

        res.status(200).json({ message: "Password has been reset successfully." });
    } catch (error) {
        console.error("❌ Error in reset-password:", error);
        res.status(500).json({ message: "Server error during password reset." });
    }
});

// Create Project Route
app.post(
    '/api/projects/create',
    authMiddleware, // Ensure the user is authenticated
    async (req: AuthenticatedRequest, res: Response) => {
        const creatorId = req.userId; 
        const { title, description, roles } = req.body as CreateProjectRequestBody;

        if (!creatorId) {
            // This case should ideally be caught by authMiddleware, but it's a safety check
            return res.status(403).json({ message: 'Authorization required to create a project.' });
        }

        // Basic input validation
        if (!title || !description || !roles || !Array.isArray(roles)) {
            return res.status(400).json({ error: 'Missing or invalid project data (title, description, or roles).' });
        }

        const client = await pool.connect();

        try {
            // 1. Start a transaction (to ensure data consistency)
            await client.query('BEGIN');

            // 2. Insert the new project, linking it to the creator ID
            const projectInsertQuery = `
                INSERT INTO projects(title, description, creator_id) 
                VALUES($1, $2, $3) 
                RETURNING id, created_at
            `;
            const projectResult = await client.query(projectInsertQuery, [title, description, creatorId]);
            const newProjectId = projectResult.rows[0].id; 
            
            // 3. Insert the roles (if any)
            if (roles.length > 0) {
                // Prepare values for bulk insertion: ($1, $2), ($3, $4), ...
                // The parameters for the query are flattened: [project_id, role1, project_id, role2, ...]
                const roleValues = roles
                    .map((_, index) => `($${index * 2 + 1}, $${index * 2 + 2})`)
                    .join(', ');
                
                const roleInsertQuery = `
                    INSERT INTO project_roles(project_id, role_name)
                    VALUES ${roleValues}
                `;
                
                // Prepare parameters
                const roleParams: (string | number)[] = roles.flatMap(role => [newProjectId, role]);

                await client.query(roleInsertQuery, roleParams);
            }

            // 4. Commit the transaction
            await client.query('COMMIT');

            // Success response
            res.status(201).json({ 
                message: 'Project created successfully', 
                projectId: newProjectId,
                createdAt: projectResult.rows[0].created_at
            });

        } catch (error) {
            // If any error occurs, rollback the transaction
            await client.query('ROLLBACK');
            console.error('❌ Database Error during project creation:', error);
            res.status(500).json({ error: 'Failed to create project due to a server error.' });
        } finally {
            // Release the client back to the pool
            client.release();
        }
    }
);

// Start the server
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
})