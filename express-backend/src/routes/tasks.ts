import { Router } from "express";
import pool from "../pool";
import { AuthenticatedRequest } from "../server";

const router = Router();

interface Task {
  id?: number;
  title: string;
  status?: "pending" | "in-progress" | "done";
  assignedTo?: string;
  dueDate?: string;
  priority?: "low" | "medium" | "high";
}

router.put("/:projectId", async (req: AuthenticatedRequest, res) => {
  const { projectId } = req.params;
  const { task } = req.body as { task: Task };

  if (!task || !task.title) {
    return res.status(400).json({ message: "Task title is required" });
  }

  try {
    const result = await pool.query(`SELECT tasks FROM projects WHERE id = $1`, [projectId]);
    if (result.rows.length === 0) return res.status(404).json({ message: "Project not found" });

    const tasks: Task[] = result.rows[0].tasks || [];

    if (task.id) {
      const index = tasks.findIndex((t) => t.id === task.id);
      if (index === -1) return res.status(404).json({ message: "Task not found" });
      tasks[index] = { ...tasks[index], ...task };
    } else {
      task.id = Date.now(); 
      tasks.push(task);
    }

    await pool.query(
      `UPDATE projects SET tasks = $1, updated_at = NOW() WHERE id = $2`,
      [JSON.stringify(tasks), projectId]
    );

    res.json({ message: "Tasks updated", tasks });
  } catch (err: any) {
    console.error("❌ Failed to update tasks:", err.message);
    res.status(500).json({ message: "Failed to update tasks" });
  }
});

router.get("/:projectId", async (req, res) => {
  const { projectId } = req.params;
  try {
    const result = await pool.query(`SELECT tasks FROM projects WHERE id = $1`, [projectId]);
    if (result.rows.length === 0) return res.status(404).json({ message: "Project not found" });

    const tasks: Task[] = result.rows[0].tasks || [];
    res.json(tasks);
  } catch (err: any) {
    console.error("❌ Failed to fetch tasks:", err.message);
    res.status(500).json({ message: "Failed to fetch tasks" });
  }
});

export default router;