import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import pool from "./pool";
import profileRoutes from "./flipbookProfile";
import authForgotRoutes from "./routes/authForgot";
import collaboratorRoutes from "./routes/collaborators";
import forumUpvoteRoutes from "./routes/forumUpvote";
import projectRoutes from "./routes/createproject";
import { AuthenticatedRequest, authMiddleware, JWT_SECRET } from "./shared";


dotenv.config();
const PORT = process.env.PORT || 5000;
const app = express();

const allowedOrigins = [
  "http://localhost:3000",
  "https://inprogress-4l7v.onrender.com",
];

// Middleware
app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (mobile apps, curl)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      } else {
        return callback(new Error("CORS blocked"));
      }
    },
    credentials: true,
  })
);

// ROUTES
app.use("/profile", authMiddleware, profileRoutes);
app.use("/api", authForgotRoutes);
app.use("/api/collaborators", collaboratorRoutes);
app.use("/api/forum-upvotes", forumUpvoteRoutes);
app.use("/api/projects", projectRoutes);

// COMMENTS routes
app.get(
  "/api/projects/:projectId/comments",
  authMiddleware,
  async (req: AuthenticatedRequest, res) => {
    const projectId = Number(req.params.projectId);
    if (isNaN(projectId)) return res.status(400).json({ message: "Invalid project ID." });
    try {
      const result = await pool.query(
        `SELECT c.id, c.project_id, c.user_id, c.username, c.text, c.created_at, c.updated_at, up.avatar
         FROM comments c
         LEFT JOIN userprofile up ON c.user_id = up.user_id
         WHERE c.project_id = $1
         ORDER BY c.created_at ASC`,
        [projectId]
      );
      res.json(result.rows);
    } catch (error: unknown) {
      if (error instanceof Error) console.error("Error fetching comments:", error.message);
      res.status(500).json({ message: "Failed to fetch comments" });
    }
  }
);

app.post(
  "/api/projects/:projectId/comments",
  authMiddleware,
  async (req: AuthenticatedRequest, res) => {
    const projectId = Number(req.params.projectId);
    const { text } = req.body;
    const userId = req.userId;
    const username = req.username;
    if (!text || !userId || !username) {
      return res.status(400).json({ message: "Missing comment text or user info" });
    }
    try {
      const projectCheck = await pool.query("SELECT id FROM projects WHERE id = $1", [projectId]);
      if (projectCheck.rowCount === 0) return res.status(404).json({ message: "Project not found" });
      const result = await pool.query(
        `INSERT INTO comments (project_id, user_id, username, text)
         VALUES ($1, $2, $3, $4)
         RETURNING id, project_id, user_id, username, text, created_at, updated_at`,
        [projectId, userId, username, text]
      );
      res.status(201).json(result.rows[0]);
    } catch (error: unknown) {
      if (error instanceof Error) console.error("Error adding comment:", error.message);
      res.status(500).json({ message: "Failed to add comment" });
    }
  }
);

app.put(
  "/api/comments/:id",
  authMiddleware,
  async (req: AuthenticatedRequest, res) => {
    const commentId = Number(req.params.id);
    const { text } = req.body;
    const userId = req.userId;
    if (isNaN(commentId) || !text) return res.status(400).json({ message: "Invalid comment ID or missing text" });
    try {
      const result = await pool.query(
        `UPDATE comments
         SET text = $1, updated_at = NOW()
         WHERE id = $2 AND user_id = $3
         RETURNING id, text, updated_at`,
        [text, commentId, userId]
      );
      if (result.rowCount === 0) return res.status(403).json({ message: "Not authorized or comment not found" });
      res.json(result.rows[0]);
    } catch (error: unknown) {
      if (error instanceof Error) console.error("Error editing comment:", error.message);
      res.status(500).json({ message: "Failed to edit comment" });
    }
  }
);

app.delete(
  "/api/comments/:id",
  authMiddleware,
  async (req: AuthenticatedRequest, res) => {
    const commentId = Number(req.params.id);
    const userId = req.userId;
    if (isNaN(commentId)) return res.status(400).json({ message: "Invalid comment ID." });
    try {
      const result = await pool.query("DELETE FROM comments WHERE id = $1 AND user_id = $2", [commentId, userId]);
      if (result.rowCount === 0) return res.status(403).json({ message: "Not authorized or comment not found" });
      res.status(204).send();
    } catch (error: unknown) {
      if (error instanceof Error) console.error("Error deleting comment:", error.message);
      res.status(500).json({ message: "Failed to delete comment" });
    }
  }
);

// -----------------
// SIGNUP & LOGIN (FIXED)
// -----------------
interface SignUpFormData {
  fullName: string;
  username: string;
  cpuEmail: string;
  password: string;
  rePassword: string;
}

interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

const validateSignUpData = (data: SignUpFormData): ValidationResult => {
  const errors: Record<string, string> = {};
  const { fullName, username, cpuEmail, password, rePassword } = data;
  
  if (!fullName.trim()) errors.fullName = "Full name is required.";
  if (!username.trim()) errors.username = "Username is required.";
  if (!cpuEmail.trim()) errors.cpuEmail = "CPU email is required.";
  if (!password) errors.password = "Password is required.";
  if (!rePassword) errors.rePassword = "Re-enter password is required.";
  
  if (cpuEmail && !cpuEmail.trim().endsWith("@cpu.edu.ph")) {
    errors.cpuEmail = "Must use CPU email address!";
  }
  
  if (password && rePassword && password !== rePassword) {
    errors.rePassword = "Passwords do not match!";
  }
  
  return { isValid: Object.keys(errors).length === 0, errors };
};

const validateLoginData = (data: { cpuEmail: string; password: string }): ValidationResult => {
  const { cpuEmail, password } = data;
  const errors: Record<string, string> = {};
  
  if (!cpuEmail.trim()) errors.cpuEmail = "Email is required";
  if (!password) errors.password = "Password is required";
  
  return { isValid: Object.keys(errors).length === 0, errors };
};

// --- SIGNUP ---
app.post("/api/signup", async (req, res) => {
  const data: SignUpFormData = req.body;
  const { isValid, errors } = validateSignUpData(data);
  
  if (!isValid) return res.status(400).json({ message: "Validation failed.", errors });
  
  try {
    const { fullName, cpuEmail, username, password } = data;
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const result = await pool.query(
      `INSERT INTO users (fullname, username, email, password)
       VALUES ($1, $2, $3, $4)
       RETURNING id, username, email, fullname`,
      [fullName.trim(), username.trim(), cpuEmail.trim(), hashedPassword]
    );
    
    const createdUser = result.rows[0];
    const token = jwt.sign(
      { id: createdUser.id, username: createdUser.username, email: createdUser.email },
      JWT_SECRET,
      { expiresIn: "1d" }
    );
    
    res.status(201).json({
      message: "Sign-up successful!",
      token,
      user: {
        id: createdUser.id,
        username: createdUser.username,
        email: createdUser.email,
        fullname: createdUser.fullname,
      },
    });
  } catch (error: any) {
    console.error("❌ Error signing up:", error);
    if (error.code === "23505") {
      return res.status(409).json({ message: "User with this email already exists" });
    }
    res.status(500).json({ message: "Server error during sign-up." });
  }
});

// --- LOGIN (FIXED WITH DEBUG) ---
app.post("/api/login", async (req, res) => {
  const data = req.body;
  
  // 🔍 DEBUG LOGS
  console.log("🔍 === LOGIN ATTEMPT ===");
  console.log("🔍 Received body:", data);
  console.log("🔍 cpuEmail:", data.cpuEmail);
  console.log("🔍 password length:", data.password?.length || 0);
  
  const { isValid, errors } = validateLoginData(data);
  if (!isValid) {
    console.log("🔍 Validation failed:", errors);
    return res.status(400).json({ message: "Validation failed.", errors });
  }
  
  const { cpuEmail, password } = data;
  
  try {
    // 🔍 CASE-INSENSITIVE EMAIL LOOKUP
    const userResult = await pool.query(
      `SELECT id, username, email, fullname, password 
       FROM users 
       WHERE LOWER(email) = LOWER($1)`,
      [cpuEmail]
    );
    
    console.log("🔍 DB Query - Rows found:", userResult.rows.length);
    console.log("🔍 DB Query - First row email:", userResult.rows[0]?.email);
    
    if (userResult.rows.length === 0) {
      console.log("🔍 ❌ No user found for email:", cpuEmail);
      return res.status(401).json({ message: "Invalid Credentials." });
    }
    
    const user = userResult.rows[0];
    const passwordMatch = await bcrypt.compare(password, user.password);
    
    console.log("🔍 Password match:", passwordMatch);
    
    if (!passwordMatch) {
      console.log("🔍 ❌ Password mismatch");
      return res.status(401).json({ message: "Invalid Credentials." });
    }
    
    const token = jwt.sign(
      { id: user.id, username: user.username, email: user.email }, 
      JWT_SECRET, 
      { expiresIn: "1d" }
    );
    
    console.log("✅ LOGIN SUCCESSFUL for user:", user.username);
    console.log("🔍 === LOGIN END ===\n");
    
    res.status(200).json({
      message: "Login successful!",
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        fullname: user.fullname,
      },
    });
  } catch (error: unknown) {
    console.error("❌ Error during login:", error);
    res.status(500).json({ message: "Server error during login." });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});