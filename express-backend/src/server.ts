import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

import pool from "./pool"; 
import profileRoutes from "./routes/flipbookProfile";
import authForgotRoutes from "./routes/authForgot";
import collaboratorRoutes from "./routes/collaborators";
import forumUpvoteRoutes from "./routes/forumUpvote";
import projectRoutes from "./routes/createproject";
import commentsRoutes from "./routes/comments"; 
import { AuthenticatedRequest, authMiddleware, JWT_SECRET } from "./shared";
import { validatePassword } from "./validatePassword";
import tasksRoutes from "./routes/tasks";

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
app.use("/api/collaborators", collaboratorRoutes);
app.use("/api/forum-upvotes", forumUpvoteRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api", authForgotRoutes);
app.use("/api/tasks", authMiddleware, tasksRoutes);


// signup and login validation
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
  
  if (!data.fullName?.trim()) errors.fullName = "Full name is required.";
  if (!data.username?.trim()) errors.username = "Username is required.";
  if (!data.cpuEmail?.trim()) errors.cpuEmail = "CPU email is required.";
  if (!data.password?.trim()) errors.password = "Password is required.";
  if (!data.rePassword?.trim()) errors.rePassword = "Re-enter password is required.";
  
  if (data.cpuEmail?.trim() && !data.cpuEmail.trim().endsWith("@cpu.edu.ph")) {
    errors.cpuEmail = "Must use CPU email address!";
  }
  
  if (data.password !== data.rePassword && data.rePassword?.trim()) {
    errors.rePassword = "Passwords do not match!";
  }

  return { isValid: Object.keys(errors).length === 0, errors };
};

// signup
app.post("/api/signup", async (req, res) => {
  try {  // 
    const data: SignUpFormData = req.body;
    const { isValid, errors } = validateSignUpData(data);

    if (!isValid) {
      return res.status(400).json({ message: "Validation failed.", errors });
    }

    const { fullName, cpuEmail, username, password } = data;
    
    const passwordError = validatePassword(password);
    if (passwordError) {
      return res.status(400).json({
        message: "Weak password",
        errors: { password: passwordError }
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await pool.query(
      `INSERT INTO users (fullname, username, email, password)
       VALUES ($1, $2, $3, $4)
       RETURNING id, username, email, fullname`,
      [fullName.trim(), username.trim(), cpuEmail.trim(), hashedPassword]
    );
    
    const createdUser = result.rows[0];
    const token = jwt.sign(
      {
        id: createdUser.id,
        username: createdUser.username,
        email: createdUser.email,
      },
      JWT_SECRET!,
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
      return res.status(409).json({ 
        message: "User already exists",
        errors: { 
          cpuEmail: "Email already exists",
          username: "Username already exists"
        }
      });
    }
    res.status(500).json({ message: "Server error during sign-up." });
  }
});
  
//login
app.post("/api/login", async (req, res) => {
  try {
    const { identifier, password } = req.body;
    
    if (!identifier?.trim() || !password?.trim()) {
      return res.status(400).json({ message: "Username/email and password required" });
    }

    const userResult = await pool.query(
      `SELECT id, username, email, fullname, password 
       FROM users 
       WHERE LOWER(email) = LOWER($1) OR LOWER(username) = LOWER($1)`,
      [identifier.trim()]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({ message: "Invalid credentials." });
    }

    const user = userResult.rows[0];
    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.status(401).json({ message: "Invalid credentials." });
    }

       if (user.logged_in === true) {
      return res.status(403).json({
        message: "This account is already logged in on another device.",
      });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, email: user.email },
      process.env.JWT_SECRET || "fallback-secret",
      { expiresIn: "1d" }
    );

    console.log("✅ Login SUCCESS:", user.username);
    
    res.status(200).json({
      message: "Login successful!",
      token,
      user: { id: user.id, username: user.username, email: user.email, fullname: user.fullname },
    });
  } catch (error: any) {
    console.error("❌ Login ERROR:", error);
    res.status(500).json({ message: "Server error during login." });
  }
});

// logout
app.post("/api/logout", async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ message: "Missing userId" });
    }

    await pool.query(
      "UPDATE users SET logged_in = FALSE WHERE id = $1",
      [userId]
    );

    return res.json({ message: "Logged out successfully" });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({ message: "Server error during logout" });
  }
});

app.get(
  "/api/projects/:projectId/comments",
  authMiddleware,
  async (req: AuthenticatedRequest, res) => {
    const projectId = Number(req.params.projectId);
    if (isNaN(projectId))
      return res.status(400).json({ message: "Invalid project ID." });

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
      if (error instanceof Error)
        console.error("Error fetching comments:", error.message);
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
      return res
        .status(400)
        .json({ message: "Missing comment text or user info" });
    }

    try {
      const projectCheck = await pool.query(
        "SELECT id FROM projects WHERE id = $1",
        [projectId]
      );
      if (projectCheck.rowCount === 0)
        return res.status(404).json({ message: "Project not found" });

      const result = await pool.query(
        `INSERT INTO comments (project_id, user_id, username, text)
         VALUES ($1, $2, $3, $4)
         RETURNING id, project_id, user_id, username, text, created_at, updated_at`,
        [projectId, userId, username, text]
      );
      res.status(201).json(result.rows[0]);
    } catch (error: unknown) {
      if (error instanceof Error)
        console.error("Error adding comment:", error.message);
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

    if (isNaN(commentId) || !text)
      return res
        .status(400)
        .json({ message: "Invalid comment ID or missing text" });

    try {
      const result = await pool.query(
        `UPDATE comments
         SET text = $1, updated_at = NOW()
         WHERE id = $2 AND user_id = $3
         RETURNING id, text, updated_at`,
        [text, commentId, userId]
      );

      if (result.rowCount === 0)
        return res
          .status(403)
          .json({ message: "Not authorized or comment not found" });
      res.json(result.rows[0]);
    } catch (error: unknown) {
      if (error instanceof Error)
        console.error("Error editing comment:", error.message);
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

    if (isNaN(commentId))
      return res.status(400).json({ message: "Invalid comment ID." });

    try {
      const result = await pool.query(
        "DELETE FROM comments WHERE id = $1 AND user_id = $2",
        [commentId, userId]
      );
      if (result.rowCount === 0)
        return res
          .status(403)
          .json({ message: "Not authorized or comment not found" });
      res.status(204).send();
    } catch (error: unknown) {
      if (error instanceof Error)
        console.error("Error deleting comment:", error.message);
      res.status(500).json({ message: "Failed to delete comment" });
    }
  }
);


app.use("/api", commentsRoutes); 



app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
export { AuthenticatedRequest };

