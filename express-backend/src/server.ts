const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
import pool from "./pool";
import profileRoutes from "./flipbookProfile";
import authForgotRoutes from "./routes/authForgot";
import collaboratorRoutes from "./routes/collaborators";
import forumUpvoteRoutes from "./routes/forumUpvote";
import projectRoutes from "./routes/createproject";
import { AuthenticatedRequest, authMiddleware, JWT_SECRET } from "./shared";

type Request = import("express").Request;
type Response = import("express").Response;

dotenv.config();

const PORT = process.env.PORT || 5000;
const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// --- ROUTES ---
app.use("/profile", authMiddleware, profileRoutes);
app.use("/api", authForgotRoutes);
app.use("/api/collaborators", collaboratorRoutes);
app.use("/api/forum-upvotes", forumUpvoteRoutes);
app.use("/api/projects", projectRoutes);

// --- COMMENTS ROUTES ---
app.get("/api/projects/:projectId/comments", authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
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
});

app.post("/api/projects/:projectId/comments", authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
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
});

app.put("/api/comments/:id", authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
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
});

app.delete("/api/comments/:id", authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
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
});

// --- USER ROUTES & VALIDATIONS ---
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

interface ResetPasswordBody {
  resetToken: string;
  newPassword: string;
  rePassword: string;
}

// Validation for Signup
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
app.post("/api/signup", async (req: Request, res: Response) => {
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

    res.status(201).json({
      message: "Sign-up successful!",
      user: {
        id: result.rows[0].id,
        username: result.rows[0].username,
        email: result.rows[0].email,
        fullname: result.rows[0].fullname,
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
app.post("/api/login", async (req: Request, res: Response) => {
  const data: Pick<SignUpFormData, "cpuEmail" | "password"> = req.body;
  const { isValid, errors } = validateLoginData(data);
  if (!isValid) return res.status(400).json({ message: "Validation failed.", errors });

  const { cpuEmail, password } = data;

  try {
    const userResult = await pool.query(
      "SELECT id, username, email, password FROM users WHERE email = $1",
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
      user: { id: user.id, username: user.username, email: user.email },
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
