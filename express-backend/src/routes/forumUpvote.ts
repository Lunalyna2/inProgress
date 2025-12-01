import { Router, Response } from "express";
import pool from "../pool";
import { authMiddleware, AuthenticatedRequest } from "../shared";

const router = Router();

// response format 
interface UpvoteResponse {
  success: boolean;
  projectId: number;
  upvotes: number;
  hasUpvoted: boolean;
}

// return current upvote count
router.get(
  "/:projectId/upvotes",
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response<UpvoteResponse | { success: false; error: string }>) => {
    const projectId = Number(req.params.projectId);
    const userId = req.userId;

    if (!projectId || isNaN(projectId)) {
      return res.status(400).json({ success: false, error: "Invalid project ID" });
    }

    try {
      const result = await pool.query(
        `SELECT 
           p.upvote_count,
           EXISTS (
             SELECT 1 FROM project_upvote 
             WHERE project_id = $1 AND user_id = $2
           ) AS has_upvoted
         FROM projects p 
         WHERE p.id = $1`,
        [projectId, userId ?? null]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ success: false, error: "Project not found" });
      }

      const { upvote_count, has_upvoted } = result.rows[0];

      res.json({
        success: true,
        projectId,
        upvotes: Number(upvote_count),
        hasUpvoted: Boolean(has_upvoted),
      });
    } catch (err) {
      console.error("Error fetching upvote status:", err);
      res.status(500).json({ success: false, error: "Internal server error" });
    }
  }
);

// add upvote for a project
router.post(
  "/:projectId/upvotes",
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response<UpvoteResponse | { success: false; error: string }>) => {
    const projectId = Number(req.params.projectId);
    const userId = req.userId!;

    if (!projectId || isNaN(projectId)) {
      return res.status(400).json({ success: false, error: "Invalid project ID" });
    }

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const insertRes = await client.query(
        `INSERT INTO project_upvote (project_id, user_id)
         VALUES ($1, $2)
         ON CONFLICT (user_id, project_id) DO NOTHING
         RETURNING project_id`,
        [projectId, userId]
      );

      const wasInserted = insertRes.rowCount === 1;

      if (wasInserted) {
        await client.query(
          `UPDATE projects 
           SET upvote_count = upvote_count + 1 
           WHERE id = $1`,
          [projectId]
        );
      }

      // Get fresh count while still in transaction
      const countRes = await client.query(
        "SELECT upvote_count FROM projects WHERE id = $1",
        [projectId]
      );
      const updatedCount = Number(countRes.rows[0].upvote_count);

      await client.query("COMMIT");

      res.json({
        success: true,
        projectId,
        upvotes: updatedCount,
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

// remove upvote - when clicked again by user
router.delete(
  "/:projectId/upvotes",
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response<UpvoteResponse | { success: false; error: string }>) => {
    const projectId = Number(req.params.projectId);
    const userId = req.userId!;

    if (!projectId || isNaN(projectId)) {
      return res.status(400).json({ success: false, error: "Invalid project ID" });
    }

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const deleteRes = await client.query(
        `DELETE FROM project_upvote 
         WHERE project_id = $1 AND user_id = $2
         RETURNING project_id`,
        [projectId, userId]
      );

      const wasDeleted = deleteRes.rowCount === 1;

      if (wasDeleted) {
        await client.query(
          `UPDATE projects 
           SET upvote_count = GREATEST(upvote_count - 1, 0)
           WHERE id = $1`,
          [projectId]
        );
      }

      // Get fresh count before releasing client
      const countRes = await client.query(
        "SELECT upvote_count FROM projects WHERE id = $1",
        [projectId]
      );
      const updatedCount = countRes.rows.length > 0 ? Number(countRes.rows[0].upvote_count) : 0;

      await client.query("COMMIT");

      res.json({
        success: true,
        projectId,
        upvotes: updatedCount,
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
