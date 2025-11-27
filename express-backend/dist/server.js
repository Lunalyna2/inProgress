"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/server.ts
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const pool_1 = __importDefault(require("./pool")); // keep your pool.ts as-is
const flipbookProfile_1 = __importDefault(require("./flipbookProfile"));
const authForgot_1 = __importDefault(require("./routes/authForgot"));
const collaborators_1 = __importDefault(require("./routes/collaborators"));
const forumUpvote_1 = __importDefault(require("./routes/forumUpvote"));
const createproject_1 = __importDefault(require("./routes/createproject"));
const shared_1 = require("./shared");
dotenv_1.default.config();
const PORT = process.env.PORT || 5000;
const app = (0, express_1.default)();
// Middleware
app.use(express_1.default.json());
// Allow React dev server origin. Set credentials true if you later use cookies.
app.use((0, cors_1.default)({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
}));
// -----------------
// ROUTES
// -----------------
// Protect profile route with authMiddleware
app.use("/profile", shared_1.authMiddleware, flipbookProfile_1.default);
app.use("/api", authForgot_1.default);
app.use("/api/collaborators", collaborators_1.default);
app.use("/api/forum-upvotes", forumUpvote_1.default);
app.use("/api/projects", createproject_1.default);
// -----------------
// COMMENTS routes (unchanged logic but typed)
// -----------------
app.get("/api/projects/:projectId/comments", shared_1.authMiddleware, async (req, res) => {
    const projectId = Number(req.params.projectId);
    if (isNaN(projectId))
        return res.status(400).json({ message: "Invalid project ID." });
    try {
        const result = await pool_1.default.query(`SELECT c.id, c.project_id, c.user_id, c.username, c.text, c.created_at, c.updated_at, up.avatar
         FROM comments c
         LEFT JOIN userprofile up ON c.user_id = up.user_id
         WHERE c.project_id = $1
         ORDER BY c.created_at ASC`, [projectId]);
        res.json(result.rows);
    }
    catch (error) {
        if (error instanceof Error)
            console.error("Error fetching comments:", error.message);
        res.status(500).json({ message: "Failed to fetch comments" });
    }
});
app.post("/api/projects/:projectId/comments", shared_1.authMiddleware, async (req, res) => {
    const projectId = Number(req.params.projectId);
    const { text } = req.body;
    const userId = req.userId;
    const username = req.username;
    if (!text || !userId || !username) {
        return res.status(400).json({ message: "Missing comment text or user info" });
    }
    try {
        const projectCheck = await pool_1.default.query("SELECT id FROM projects WHERE id = $1", [projectId]);
        if (projectCheck.rowCount === 0)
            return res.status(404).json({ message: "Project not found" });
        const result = await pool_1.default.query(`INSERT INTO comments (project_id, user_id, username, text)
         VALUES ($1, $2, $3, $4)
         RETURNING id, project_id, user_id, username, text, created_at, updated_at`, [projectId, userId, username, text]);
        res.status(201).json(result.rows[0]);
    }
    catch (error) {
        if (error instanceof Error)
            console.error("Error adding comment:", error.message);
        res.status(500).json({ message: "Failed to add comment" });
    }
});
app.put("/api/comments/:id", shared_1.authMiddleware, async (req, res) => {
    const commentId = Number(req.params.id);
    const { text } = req.body;
    const userId = req.userId;
    if (isNaN(commentId) || !text)
        return res.status(400).json({ message: "Invalid comment ID or missing text" });
    try {
        const result = await pool_1.default.query(`UPDATE comments
         SET text = $1, updated_at = NOW()
         WHERE id = $2 AND user_id = $3
         RETURNING id, text, updated_at`, [text, commentId, userId]);
        if (result.rowCount === 0)
            return res.status(403).json({ message: "Not authorized or comment not found" });
        res.json(result.rows[0]);
    }
    catch (error) {
        if (error instanceof Error)
            console.error("Error editing comment:", error.message);
        res.status(500).json({ message: "Failed to edit comment" });
    }
});
app.delete("/api/comments/:id", shared_1.authMiddleware, async (req, res) => {
    const commentId = Number(req.params.id);
    const userId = req.userId;
    if (isNaN(commentId))
        return res.status(400).json({ message: "Invalid comment ID." });
    try {
        const result = await pool_1.default.query("DELETE FROM comments WHERE id = $1 AND user_id = $2", [commentId, userId]);
        if (result.rowCount === 0)
            return res.status(403).json({ message: "Not authorized or comment not found" });
        res.status(204).send();
    }
    catch (error) {
        if (error instanceof Error)
            console.error("Error deleting comment:", error.message);
        res.status(500).json({ message: "Failed to delete comment" });
    }
});
const validateSignUpData = (data) => {
    const errors = {};
    const { fullName, username, cpuEmail, password, rePassword } = data;
    if (!fullName)
        errors.fullName = "Full name is required.";
    if (!username)
        errors.username = "Username is required.";
    if (!cpuEmail)
        errors.cpuEmail = "CPU email is required.";
    if (!password)
        errors.password = "Password is required.";
    if (!rePassword)
        errors.rePassword = "Re-enter password is required.";
    if (cpuEmail && !cpuEmail.endsWith("@cpu.edu.ph")) {
        errors.cpuEmail = "Must use CPU email address!";
    }
    if (password && rePassword && password !== rePassword) {
        errors.rePassword = "Passwords do not match!";
    }
    return { isValid: Object.keys(errors).length === 0, errors };
};
const validateLoginData = (data) => {
    const { cpuEmail, password } = data;
    const errors = {};
    if (!cpuEmail)
        errors.cpuEmail = "Email is required";
    if (!password)
        errors.password = "Password is required";
    return { isValid: Object.keys(errors).length === 0, errors };
};
// --- SIGNUP (now returns token) ---
app.post("/api/signup", async (req, res) => {
    const data = req.body;
    const { isValid, errors } = validateSignUpData(data);
    if (!isValid)
        return res.status(400).json({ message: "Validation failed.", errors });
    try {
        const { fullName, cpuEmail, username, password } = data;
        const hashedPassword = await bcrypt_1.default.hash(password, 10);
        const result = await pool_1.default.query(`INSERT INTO users (fullname, username, email, password) 
       VALUES ($1, $2, $3, $4) 
       RETURNING id, username, email, fullname`, [fullName, username, cpuEmail, hashedPassword]);
        const createdUser = result.rows[0];
        const token = jsonwebtoken_1.default.sign({ id: createdUser.id, username: createdUser.username, email: createdUser.email }, shared_1.JWT_SECRET, { expiresIn: "1d" });
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
    }
    catch (error) {
        console.error("❌ Error signing up:", error);
        if (error.code === "23505") {
            return res.status(409).json({ message: "User with this email already exists" });
        }
        res.status(500).json({ message: "Server error during sign-up." });
    }
});
// --- LOGIN ---
app.post("/api/login", async (req, res) => {
    const data = req.body;
    const { isValid, errors } = validateLoginData(data);
    if (!isValid)
        return res.status(400).json({ message: "Validation failed.", errors });
    const { cpuEmail, password } = data;
    try {
        const userResult = await pool_1.default.query("SELECT id, username, email, fullname, password FROM users WHERE email = $1", [cpuEmail]);
        if (userResult.rows.length === 0)
            return res.status(401).json({ message: "Invalid Credentials." });
        const user = userResult.rows[0];
        const passwordMatch = await bcrypt_1.default.compare(password, user.password);
        if (!passwordMatch)
            return res.status(401).json({ message: "Invalid Credentials." });
        const token = jsonwebtoken_1.default.sign({ id: user.id, username: user.username, email: user.email }, shared_1.JWT_SECRET, {
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
    }
    catch (error) {
        if (error instanceof Error)
            console.error("❌ Error during login:", error.message);
        res.status(500).json({ message: "Server error during login." });
    }
});
// Start the server
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});
