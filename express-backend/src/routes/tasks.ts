import { Router } from "express";
import pool from "../pool";
import { AuthenticatedRequest } from "../server";

const router = Router();

// get all tasks for a project
router.get("/:projectId", async (req: AuthenticatedRequest, res) => {
  const { projectId } = req.params;

  try {
    const result = await pool.query(
      `SELECT id, label, done, created_at, status
       FROM project_tasks
       WHERE project_id = $1
       ORDER BY id ASC`,
      [projectId]
    );

    const tasks = result.rows.map((t) => ({
      id: t.id,
      label: t.label,
      done: t.done,
      status: t.status,
      createdAt: t.created_at,
    }));

    res.json(tasks);
  } catch (err) {
    console.error("GET tasks error:", err);
    res.status(500).json({ message: "Failed to fetch tasks." });
  }
});


// add new task
router.post("/:projectId", async (req: AuthenticatedRequest, res) => {
  const { projectId } = req.params;
  const { label } = req.body;

 

  try {
    const result = await pool.query(
      `INSERT INTO project_tasks (project_id, label, done, status)
       VALUES ($1, $2, false, 'to-do')
       RETURNING id, label, done, created_at`,
      [projectId, label]
    );

    const t = result.rows[0];

    res.json({
      id: t.id,
      label: t.label,
      done: t.done,
      status: t.status,
      createdAt: t.created_at,
    });
  } catch (err) {
    console.error("ADD task error:", err);
    res.status(500).json({ message: "Failed to add task." });
  }
});


// toggle task done status
router.put("/:taskId/toggle", async (req: AuthenticatedRequest, res) => {
  const { taskId } = req.params;
  const { newStatus } = req.body;

  try {
    const result = await pool.query(
      `UPDATE project_tasks
       SET status = $1
       WHERE id = $2
       RETURNING id, label, status, created_at`,
      [newStatus, taskId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Task not found." });
    }

    const t = result.rows[0];

    res.json({
      id: t.id,
      label: t.label,
      done: t.done,
      status: t.status,
      createdAt: t.created_at
    });
  } catch (err) {
    console.error("TOGGLE task error:", err);
    res.status(500).json({ message: "Failed to update task." });
  }
});

export default router;
