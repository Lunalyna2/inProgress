"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const pool_1 = __importDefault(require("../pool"));
const router = (0, express_1.Router)();
// return current upvote count
router.get("/:projectId", async (req, res) => {
    const { projectId } = req.params;
    try {
        const result = await pool_1.default.query("SELECT COUNT(*) AS upvotes FROM project_upvotes WHERE project_id = $1", [projectId]);
        res.json({
            projectId,
            upvotes: parseInt(result.rows[0].upvotes, 10),
        });
    }
    catch (err) {
        console.error("Error fetching upvotes:", err);
        res.status(500).json({ error: "Internal server error" });
    }
});
// add upvote for a project
router.post("/:projectId", async (req, res) => {
    const { projectId } = req.params;
    const { userId } = req.body;
    if (!userId) {
        return res.status(400).json({ error: "Missing userId" });
    }
    try {
        await pool_1.default.query(`INSERT INTO project_upvotes (project_id, user_id)
       VALUES ($1, $2)
       ON CONFLICT (project_id, user_id) DO NOTHING`, [projectId, userId]);
        const updated = await pool_1.default.query("SELECT COUNT(*) AS upvotes FROM project_upvotes WHERE project_id = $1", [projectId]);
        res.json({
            success: true,
            projectId,
            upvotes: parseInt(updated.rows[0].upvotes, 10),
        });
    }
    catch (err) {
        console.error("Error adding upvote:", err);
        res.status(500).json({ error: "Internal server error" });
    }
});
exports.default = router;
