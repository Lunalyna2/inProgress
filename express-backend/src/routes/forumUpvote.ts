import { Router, Response } from "express";
import pool from "../pool";
import { authMiddleware, AuthenticatedRequest } from "../shared";

const router = Router();

interface UpvoteResponse {
  success: boolean;
  projectId: number;
  upvotes: number;
  hasUpvoted: boolean;
}

// GET upvote count and user's upvote status
router.get(
  "/:projectId/upvotes",
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response<UpvoteResponse | { success: false; error: string }>) => {
    const projectId = Number(req.params.projectId);
    const userId = req.userId;

    if (!projectId || isNaN(projectId)) {
      return res.status(400).json({ success: false, error: "Invalid project ID" });
    }

    if (!userId) {
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }

    try {
      const projectResult = await pool.query<{ upvote_count: number }>(
        "SELECT upvote_count FROM projects WHERE id = $1",
        [projectId]
      );

      if (!projectResult.rows.length) {
        return res.status(404).json({ success: false, error: "Project not found" });
      }

      const checkUserResult = await pool.query<{ exists: boolean }>(
        "SELECT EXISTS(SELECT 1 FROM project_upvote WHERE project_id = $1 AND user_id = $2) AS exists",
        [projectId, userId]
      );

      const hasUpvoted = checkUserResult.rows[0]?.exists ?? false;

      res.json({
        success: true,
        projectId,
        upvotes: Number(projectResult.rows[0].upvote_count),
        hasUpvoted,
      });
    } catch (err) {
      console.error("Error fetching upvote status:", err);
      res.status(500).json({ success: false, error: "Internal server error" });
    }
  }
);

// POST add upvote
router.post(
  "/:projectId/upvotes",
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response<UpvoteResponse | { success: false; error: string }>) => {
    const projectId = Number(req.params.projectId);
    const userId = req.userId;

    if (!projectId || isNaN(projectId)) {
      return res.status(400).json({ success: false, error: "Invalid project ID" });
    }

    if (!userId) {
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const insertResult = await client.query(
        `INSERT INTO project_upvote (project_id, user_id)
         VALUES ($1, $2)
         ON CONFLICT (project_id, user_id) DO NOTHING
         RETURNING project_id`,
        [projectId, userId]
      );

      if (insertResult.rowCount === 1) {
        await client.query(
          "UPDATE projects SET upvote_count = upvote_count + 1 WHERE id = $1",
          [projectId]
        );
      }

      const countResult = await client.query<{ upvote_count: number }>(
        "SELECT upvote_count FROM projects WHERE id = $1",
        [projectId]
      );

      await client.query("COMMIT");

      res.json({
        success: true,
        projectId,
        upvotes: Number(countResult.rows[0].upvote_count),
        hasUpvoted: true,
      });
    } catch (err) {
      await client.query("ROLLBACK");
      console.error("Error adding upvote:", err);
      res.status(500).json({ success: false, error: "Failed to upvote" });
    } finally {
      client.release();
    }
  }
);

// DELETE remove upvote
router.delete(
  "/:projectId/upvotes",
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response<UpvoteResponse | { success: false; error: string }>) => {
    const projectId = Number(req.params.projectId);
    const userId = req.userId;

    if (!projectId || isNaN(projectId)) {
      return res.status(400).json({ success: false, error: "Invalid project ID" });
    }

    if (!userId) {
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const deleteResult = await client.query(
        `DELETE FROM project_upvote
         WHERE project_id = $1 AND user_id = $2
         RETURNING project_id`,
        [projectId, userId]
      );

      if (deleteResult.rowCount === 1) {
        await client.query(
          "UPDATE projects SET upvote_count = GREATEST(upvote_count - 1, 0) WHERE id = $1",
          [projectId]
        );
      }

      const countResult = await client.query<{ upvote_count: number }>(
        "SELECT upvote_count FROM projects WHERE id = $1",
        [projectId]
      );

      await client.query("COMMIT");

      res.json({
        success: true,
        projectId,
        upvotes: countResult.rows.length ? Number(countResult.rows[0].upvote_count) : 0,
        hasUpvoted: false,
      });
    } catch (err) {
      await client.query("ROLLBACK");
      console.error("Error removing upvote:", err);
      res.status(500).json({ success: false, error: "Failed to remove upvote" });
    } finally {
      client.release();
    }
  }
);

export default router;
