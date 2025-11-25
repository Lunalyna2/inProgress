import { Router, Request, Response } from "express";
import pool from "../pool"; // PostgreSQL connection pool

const router = Router();

//return current upvote count for a project
router.get("/:projectId", async (req: Request, res: Response) => {
  const { projectId } = req.params;
  try {
    const result = await pool.query(
      "SELECT COUNT(*) AS upvotes FROM project_upvotes WHERE project_id = $1",
      [projectId]
    );
    res.json({ projectId, upvotes: parseInt(result.rows[0].upvotes, 10) });
  } catch (err) {
    console.error("Error fetching upvotes:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// add upvote for the project by user
router.post("/:projectId", async (req: Request, res: Response) => {
  const { projectId } = req.params;
  const { userId } = req.body; // 🔑 comes from frontend/localStorage

  if (!userId) {
    return res.status(400).json({ error: "Missing userId" });
  }

  try {
    // Insert upvote, ignore if already exists
    await pool.query(
      `INSERT INTO project_upvotes (project_id, user_id)
       VALUES ($1, $2)
       ON CONFLICT (project_id, user_id) DO NOTHING`,
      [projectId, userId]
    );

    // Return updated count
    const result = await pool.query(
      "SELECT COUNT(*) AS upvotes FROM project_upvotes WHERE project_id = $1",
      [projectId]
    );
    res.json({
      success: true,
      projectId,
      upvotes: parseInt(result.rows[0].upvotes, 10),
    });
  } catch (err) {
    console.error("Error adding upvote:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
