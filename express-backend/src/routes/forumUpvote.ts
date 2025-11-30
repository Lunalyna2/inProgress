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
  async (req: AuthenticatedRequest, res: Response) => {
    const { projectId } = req.params;
    const userId = req.userId;

    try {
      const countResult = await pool.query(
        "SELECT upvote_count FROM projects WHERE id = $1",
        [projectId]
      );
      const upvotes = Number(countResult.rows[0]?.upvote_count ?? 0);

      let hasUpvoted = false;
      if (userId) {
        const check = await pool.query(
          "SELECT EXISTS (SELECT 1 FROM project_upvote WHERE project_id = $1 AND user_id = $2) AS voted",
          [projectId, userId]
        );
        hasUpvoted = check.rows[0].voted;
      }

      const response: UpvoteResponse = {
        success: true,
        projectId: Number(projectId),
        upvotes,
        hasUpvoted,
      };
      res.json(response);
    } catch (err) {
      console.error("Error fetching upvotes:", err);
      res.status(500).json({ success: false, error: "Internal server error" });
    }
  }
);

// add upvote for a project
router.post(
  "/:projectId/upvotes",
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response) => {
    const { projectId } = req.params;
    const userId = req.userId;
    if (!userId)
      return res.status(403).json({ success: false, error: "Unauthorized" });

    try {
      // Insert upvote (ignore duplicates)
      await pool.query(
        `INSERT INTO project_upvote (project_id, user_id)
         VALUES ($1, $2)
         ON CONFLICT (project_id, user_id) DO NOTHING`,
        [projectId, userId]
      );

      // Recalculate and update cached count
      await pool.query(
        `UPDATE projects
         SET upvote_count = (SELECT COUNT(*) FROM project_upvote WHERE project_id = $1)
         WHERE id = $1`,
        [projectId]
      );

      const updated = await pool.query(
        "SELECT upvote_count FROM projects WHERE id = $1",
        [projectId]
      );
      const upvotes = Number(updated.rows[0]?.upvote_count ?? 0);

      const response: UpvoteResponse = {
        success: true,
        projectId: Number(projectId),
        upvotes,
        hasUpvoted: true,
      };
      res.json(response);
    } catch (err) {
      console.error("Error adding upvote:", err);
      res.status(500).json({ success: false, error: "Internal server error" });
    }
  }
);

// remove upvote - when clicked again by user
router.delete(
  "/:projectId/upvotes",
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response) => {
    const { projectId } = req.params;
    const userId = req.userId;
    if (!userId)
      return res.status(403).json({ success: false, error: "Unauthorized" });

    try {
      await pool.query(
        "DELETE FROM project_upvote WHERE project_id = $1 AND user_id = $2",
        [projectId, userId]
      );
      
      await pool.query(
        `UPDATE projects
         SET upvote_count = (SELECT COUNT(*) FROM project_upvote WHERE project_id = $1)
         WHERE id = $1`,
        [projectId]
      );

      const updated = await pool.query(
        "SELECT upvote_count FROM projects WHERE id = $1",
        [projectId]
      );
      const upvotes = Number(updated.rows[0]?.upvote_count ?? 0);

      const response: UpvoteResponse = {
        success: true,
        projectId: Number(projectId),
        upvotes,
        hasUpvoted: false,
      };
      res.json(response);
    } catch (err) {
      console.error("Error removing upvote:", err);
      res.status(500).json({ success: false, error: "Internal server error" });
    }
  }
);

export default router;
