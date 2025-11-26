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

app.use("/profile", authMiddleware, profileRoutes);
app.use("/api", authForgotRoutes);
app.use("/api/collaborators", collaboratorRoutes);
app.use("/api/forum-upvotes", forumUpvoteRoutes);
app.use("/api/projects", projectRoutes);

// Test DB connection
pool
  .connect()
  .then(() => console.log("✅ Connected to PostgreSQL"))
  .catch((err: string) => console.error("❌ DB connection error ", err));

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

  // Check if forms are filled out
  if (!fullName) errors.fullName = "Full name is required.";
  if (!username) errors.username = "Username is required.";
  if (!cpuEmail) errors.cpuEmail = "CPU email is required.";
  if (!password) errors.password = "Password is required.";
  if (!rePassword) errors.rePassword = "Re-enter password is required.";

  // Validate Password Match
  if (cpuEmail && !cpuEmail.endsWith("@cpu.edu.ph")) {
    errors.cpuEmail = "Must use CPU email address!";
  }

  if (password && rePassword && password !== rePassword) {
    errors.rePassword = "Passwords does not match!";
  }

  return { isValid: Object.keys(errors).length === 0, errors };
};

// Validate for Login
const validateLoginData = (
  data: Pick<SignUpFormData, "cpuEmail" | "password">
): ValidationResult => {
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
      errors,
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

    // Check for PostgreSQL's unique violation error code (23505)
    if (error.code === "23505") {
      return res
        .status(409)
        .json({ message: "User with this email already exists" });
    }
    res.status(500).json({ message: "Server error during sign-up." });
  }
});

// Login Route
app.post("/api/login", async (req: Request, res: Response) => {
  const data: Pick<SignUpFormData, "cpuEmail" | "password"> = req.body;
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
        message: "Invalid Credentials.",
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
      { expiresIn: "1d" }
    );

    res.status(200).json({
      message: "Login successful!",
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("❌ Error during login:", error);
    res.status(500).json({ message: "Server error during login." });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
