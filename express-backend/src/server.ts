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
import tasksRoutes from "./routes/tasks";

import { AuthenticatedRequest, authMiddleware } from "./shared";
import { validatePassword } from "./validatePassword";

dotenv.config();

const PORT = process.env.PORT || 5000;
const FRONTEND_URL = [process.env.FRONTEND_URL, "http://localhost:3000"];
const JWT_SECRET = process.env.JWT_SECRET || "fallback-secret";

const app = express();

app.use(express.json());

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
app.use("/api/projects", forumUpvoteRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api", authForgotRoutes);
app.use("/api/tasks", authMiddleware, tasksRoutes);



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
  if (!data.rePassword?.trim())
    errors.rePassword = "Re-enter password is required.";

  if (data.cpuEmail && !data.cpuEmail.endsWith("@cpu.edu.ph")) {
    errors.cpuEmail = "Must use CPU email address!";
  }

  if (data.password !== data.rePassword && data.rePassword.trim()) {
    errors.rePassword = "Passwords do not match!";
  }

  return { isValid: Object.keys(errors).length === 0, errors };
};


app.post("/api/signup", async (req, res) => {
  try {
    const data: SignUpFormData = req.body;
    const { isValid, errors } = validateSignUpData(data);

    if (!isValid) {
      return res.status(400).json({ message: "Validation failed.", errors });
    }

    const loggedInCheck = await pool.query(
      "SELECT id FROM users WHERE logged_in = TRUE"
    );

    if (loggedInCheck.rows.length > 0) {
      return res.status(403).json({
        message: "Another user is currently logged in. Signup not allowed.",
      });
    }

    const { fullName, cpuEmail, username, password } = data;

    const passwordError = validatePassword(password);
    if (passwordError) {
      return res
        .status(400)
        .json({ message: "Weak password", errors: { password: passwordError } });
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
    console.error("❌ SIGNUP ERROR:", error);

    if (error.code === "23505") {
      return res.status(409).json({
        message: "User already exists",
        errors: {
          cpuEmail: "Email already exists",
          username: "Username already exists",
        },
      });
    }

    res.status(500).json({ message: "Server error during sign-up." });
  }
});


app.post("/api/login", async (req, res) => {
  try {
    const { identifier, password } = req.body;

    if (!identifier?.trim() || !password?.trim()) {
      return res
        .status(400)
        .json({ message: "Username/email and password required" });
    }

    const activeUser = await pool.query(
      `SELECT id FROM users WHERE logged_in = TRUE`
    );

    if (activeUser.rows.length > 0) {
      return res.status(403).json({
        message:
          "Another user is currently logged in. Please wait until they log out.",
      });
    }

    const userResult = await pool.query(
      `SELECT id, username, email, fullname, password
       FROM users
       WHERE LOWER(email) = LOWER($1) 
       OR LOWER(username) = LOWER($1)`,
      [identifier.trim()]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({ message: "Invalid credentials." });
    }

    const user = userResult.rows[0];

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch)
      return res.status(401).json({ message: "Invalid credentials." });

    await pool.query("UPDATE users SET logged_in = TRUE WHERE id = $1", [
      user.id,
    ]);

    const token = jwt.sign(
      { id: user.id, username: user.username, email: user.email },
      JWT_SECRET,
      { expiresIn: "1d" }
    );

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
  } catch (error) {
    console.error("❌ LOGIN ERROR:", error);
    res.status(500).json({ message: "Server error during login." });
  }
});


app.post("/api/logout", async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId)
      return res.status(400).json({ message: "Missing userId for logout" });

    await pool.query("UPDATE users SET logged_in = FALSE WHERE id = $1", [
      userId,
    ]);

    res.json({ message: "Logged out successfully" });
  } catch (error) {
    console.error("❌ LOGOUT ERROR:", error);
    res.status(500).json({ message: "Server error during logout" });
  }
});



app.use("/api", commentsRoutes);


app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

export { AuthenticatedRequest };
