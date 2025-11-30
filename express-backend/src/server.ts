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
import commentsRoutes from "./routes/comments"; 
import { AuthenticatedRequest, authMiddleware, JWT_SECRET } from "./shared";

dotenv.config();

const PORT = process.env.PORT || 5000;
const app = express();

app.use(express.json());
app.use(
  cors({
    origin: "http://localhost:3000",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

app.use("/profile", authMiddleware, profileRoutes);
app.use("/api", authForgotRoutes);
app.use("/api/collaborators", collaboratorRoutes);
app.use("/api/forum-upvotes", forumUpvoteRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api", commentsRoutes); 

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

  if (!fullName) errors.fullName = "Full name is required.";
  if (!username) errors.username = "Username is required.";
  if (!cpuEmail) errors.cpuEmail = "CPU email is required.";
  if (!password) errors.password = "Password is required.";
  if (!rePassword) errors.rePassword = "Re-enter password is required.";

  if (cpuEmail && !cpuEmail.endsWith("@cpu.edu.ph")) {
    errors.cpuEmail = "Must use CPU email address!";
  }

  if (password && rePassword && password !== rePassword) {
    errors.rePassword = "Passwords do not match!";
  }

  return { isValid: Object.keys(errors).length === 0, errors };
};

const validateLoginData = (data: Pick<SignUpFormData, "cpuEmail" | "password">): ValidationResult => {
  const { cpuEmail, password } = data;
  const errors: Record<string, string> = {};

  if (!cpuEmail) errors.cpuEmail = "Email is required";
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
      [fullName, username, cpuEmail, hashedPassword]
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

// --- LOGIN ---
app.post("/api/login", async (req, res) => {
  const data: Pick<SignUpFormData, "cpuEmail" | "password"> = req.body;
  const { isValid, errors } = validateLoginData(data);
  if (!isValid) return res.status(400).json({ message: "Validation failed.", errors });

  const { cpuEmail, password } = data;

  try {
    const userResult = await pool.query(
      "SELECT id, username, email, fullname, password FROM users WHERE email = $1",
      [cpuEmail]
    );

    if (userResult.rows.length === 0) return res.status(401).json({ message: "Invalid Credentials." });

    const user = userResult.rows[0];
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) return res.status(401).json({ message: "Invalid Credentials." });

    const token = jwt.sign({ id: user.id, username: user.username, email: user.email }, JWT_SECRET, {
      expiresIn: "1d",
    });

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
    if (error instanceof Error) console.error("❌ Error during login:", error.message);
    res.status(500).json({ message: "Server error during login." });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
