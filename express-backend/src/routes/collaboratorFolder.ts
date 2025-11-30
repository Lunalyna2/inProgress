import { Router, Response } from "express";
import pool from "../pool";
import { authMiddleware, AuthenticatedRequest } from "../shared";

const router = Router();


  //  1) APPLY TO JOIN PROJECT

router.post(
  "/:projectId/apply",
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.userId!;
      const { projectId } = req.params;
      const { role } = req.body;

      // Check if project exists
      const p = await pool.query(`SELECT id FROM projects WHERE id = $1`, [
        projectId,
      ]);
      if (p.rows.length === 0)
        return res.status(404).json({ error: "Project not found" });

      // Check if already a collaborator or pending
      const existing = await pool.query(
        `SELECT status FROM project_collaborators
         WHERE project_id = $1 AND user_id = $2`,
        [projectId, userId]
      );

      if (existing.rows.length > 0) {
        const s = existing.rows[0].status;

        if (s === "accepted")
          return res
            .status(400)
            .json({ error: "You are already a collaborator." });

        if (s === "pending")
          return res.status(400).json({
            error: "You already have a pending request.",
          });
      }

      // Insert new pending application
      await pool.query(
        `INSERT INTO project_collaborators (project_id, user_id, role, status)
         VALUES ($1, $2, $3, 'pending')`,
        [projectId, userId, role]
      );

      return res.json({
        message: "Application submitted successfully.",
      });
    } catch (err) {
      console.error("Apply error:", err);
      return res.status(500).json({ error: "Server error" });
    }
  }
);


  //  2) CANCEL MY APPLICATION

router.delete(
  "/:projectId/cancel",
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.userId!;
      const { projectId } = req.params;

      const result = await pool.query(
        `DELETE FROM project_collaborators
         WHERE project_id = $1 AND user_id = $2 AND status = 'pending'
         RETURNING id`,
        [projectId, userId]
      );

      if (result.rows.length === 0) {
        return res.status(400).json({
          error: "No pending application found to cancel.",
        });
      }

      return res.json({ message: "Application cancelled." });
    } catch (err) {
      console.error("Cancel error:", err);
      return res.status(500).json({ error: "Server error" });
    }
  }
);


  //  3) CLAIM TASK

router.post(
  "/tasks/:taskId/claim",
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.userId!;
      const { taskId } = req.params;

      // Check task exists
      const task = await pool.query(
        `SELECT project_id, user_id FROM project_tasks WHERE id = $1`,
        [taskId]
      );

      if (task.rows.length === 0)
        return res.status(404).json({ error: "Task not found." });

      const { project_id, user_id } = task.rows[0];

      // Task already assigned
      if (user_id)
        return res
          .status(400)
          .json({ error: "Task is already assigned to someone." });

      // Must be a collaborator
      const collab = await pool.query(
        `SELECT status FROM project_collaborators
         WHERE project_id = $1 AND user_id = $2`,
        [project_id, userId]
      );

      if (
        collab.rows.length === 0 ||
        collab.rows[0].status !== "accepted"
      ) {
        return res.status(403).json({
          error: "Only collaborators can claim tasks.",
        });
      }

      await pool.query(
        `UPDATE project_tasks SET user_id = $1 WHERE id = $2`,
        [userId, taskId]
      );

      return res.json({ message: "Task claimed successfully." });
    } catch (err) {
      console.error("Claim task error:", err);
      return res.status(500).json({ error: "Server error" });
    }
  }
);


  //  4) UPDATE TASK STATUS

router.patch(
  "/tasks/:taskId/status",
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.userId!;
      const { taskId } = req.params;
      const { status } = req.body;

      const validStatuses = ["assigned", "in-progress", "completed"];
      if (!validStatuses.includes(status))
        return res.status(400).json({ error: "Invalid status" });

      // Check task
      const task = await pool.query(
        `SELECT user_id FROM project_tasks WHERE id = $1`,
        [taskId]
      );

      if (task.rows.length === 0)
        return res.status(404).json({ error: "Task not found." });

      // Must be assigned to this user
      if (task.rows[0].user_id !== userId)
        return res.status(403).json({
          error: "You can only modify your own tasks.",
        });

      // Apply update
      await pool.query(
        `UPDATE project_tasks SET done = $1 WHERE id = $2`,
        [status === "completed", taskId]
      );

      return res.json({ message: "Task updated." });
    } catch (err) {
      console.error("Update task error:", err);
      return res.status(500).json({ error: "Server error" });
    }
  }
);

export default router;
