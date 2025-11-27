import express from "express";
import pool from "../pool"; // your PostgreSQL pool
import { authMiddleware, AuthenticatedRequest } from "../shared";

const router = express.Router();

/**
 * GET all comments for a project
 * GET /api/projects/:projectId/comments
 */
router.get("/projects/:projectId/comments", authMiddleware, async (req: AuthenticatedRequest, res) => {
  const projectId = Number(req.params.projectId);
  if (isNaN(projectId)) return res.status(400).json({ message: "Invalid project ID" });

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
  } catch (err) {
    console.error("Error fetching comments:", err);
    res.status(500).json({ message: "Failed to fetch comments" });
  }
});

/**
 * POST a new comment to a project
 * POST /api/projects/:projectId/comments
 */
router.post("/projects/:projectId/comments", authMiddleware, async (req: AuthenticatedRequest, res) => {
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
  } catch (err) {
    console.error("Error adding comment:", err);
    res.status(500).json({ message: "Failed to add comment" });
  }
});

/**
 * PUT (edit) a comment
 * PUT /api/comments/:id
 */
router.put("/comments/:id", authMiddleware, async (req: AuthenticatedRequest, res) => {
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
  } catch (err) {
    console.error("Error editing comment:", err);
    res.status(500).json({ message: "Failed to edit comment" });
  }
});

/**
 * DELETE a comment
 * DELETE /api/comments/:id
 */
router.delete("/comments/:id", authMiddleware, async (req: AuthenticatedRequest, res) => {
  const commentId = Number(req.params.id);
  const userId = req.userId;

  if (isNaN(commentId)) return res.status(400).json({ message: "Invalid comment ID" });

  try {
    const result = await pool.query(
      "DELETE FROM comments WHERE id = $1 AND user_id = $2",
      [commentId, userId]
    );
    if (result.rowCount === 0) return res.status(403).json({ message: "Not authorized or comment not found" });
    res.status(204).send();
  } catch (err) {
    console.error("Error deleting comment:", err);
    res.status(500).json({ message: "Failed to delete comment" });
  }
});

export default router;
