"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const pool_1 = __importDefault(require("../pool"));
const router = (0, express_1.Router)();
// Middleware to verify JWT
const auth = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader)
        return res.status(401).json({ error: "No token provided" });
    const token = authHeader.split(" ")[1];
    try {
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    }
    catch (err) {
        return res.status(401).json({ error: "Invalid token" });
    }
};
/* ----------------------------------------------------
   GET /api/collaborators/pending
   Fetch pending collaborator requests for projects owned by the user
---------------------------------------------------- */
router.get("/pending/:projectId", auth, async (req, res) => {
    try {
        const userId = req.user.id;
        const projectId = req.params.projectId;
        const query = `
      SELECT pc.id, u.fullname, up.skill, up.avatar, p.title AS project_title
      FROM project_collaborators pc
      JOIN users u ON u.id = pc.user_id
      LEFT JOIN userprofile up ON up.user_id = u.id
      JOIN projects p ON p.id = pc.project_id
      WHERE p.creator_id = $1 AND pc.status = 'pending' AND p.id = $2
    `;
        const result = await pool_1.default.query(query, [userId, projectId]);
        const collaborators = result.rows.map((row) => ({
            id: row.id.toString(),
            name: row.fullname,
            skills: row.skill ? row.skill.split(",") : [],
            avatarUrl: row.avatar || null,
            approved: false,
            role: undefined,
            decline: false,
            project: row.project_title,
        }));
        return res.json(collaborators);
    }
    catch (err) {
        console.error("Error fetching collaborators:", err);
        return res.status(500).json({ error: "Server error" });
    }
});
/* ----------------------------------------------------
   POST /api/collaborators/:id/accept
---------------------------------------------------- */
router.post("/:id/accept", auth, async (req, res) => {
    try {
        const collabId = req.params.id;
        const userId = req.user.id;
        const result = await pool_1.default.query(`UPDATE project_collaborators pc
       SET status='accepted'
       FROM projects p
       WHERE pc.id=$1 AND pc.project_id = p.id AND p.creator_id=$2
       RETURNING pc.id, pc.user_id`, [collabId, userId]);
        if (result.rowCount === 0) {
            return res.status(404).json({ error: "Collaborator not found or not authorized" });
        }
        // Fetch collaborator details for frontend update
        const collabUser = await pool_1.default.query(`SELECT u.fullname, up.skill, up.avatar
       FROM users u
       LEFT JOIN userprofile up ON up.user_id = u.id
       WHERE u.id = $1`, [result.rows[0].user_id]);
        const row = collabUser.rows[0];
        const collaborator = {
            id: collabId,
            name: row.fullname,
            skills: row.skill ? row.skill.split(",") : [],
            avatarUrl: row.avatar || null,
            approved: true,
            role: "collaborator",
            decline: false,
        };
        return res.json(collaborator);
    }
    catch (err) {
        console.error("Accept collaborator error:", err);
        return res.status(500).json({ error: "Server error" });
    }
});
/* ----------------------------------------------------
   POST /api/collaborators/:id/decline
---------------------------------------------------- */
router.post("/:id/decline", auth, async (req, res) => {
    try {
        const collabId = req.params.id;
        const userId = req.user.id;
        const result = await pool_1.default.query(`UPDATE project_collaborators pc
       SET status='declined'
       FROM projects p
       WHERE pc.id=$1 AND pc.project_id = p.id AND p.creator_id=$2
       RETURNING pc.id`, [collabId, userId]);
        if (result.rowCount === 0) {
            return res.status(404).json({ error: "Collaborator not found or not authorized" });
        }
        return res.json({ id: collabId, message: "Collaborator declined" });
    }
    catch (err) {
        console.error("Decline collaborator error:", err);
        return res.status(500).json({ error: "Server error" });
    }
});
exports.default = router;
