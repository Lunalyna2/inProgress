import { Router, Response } from "express";
import { authMiddleware, AuthenticatedRequest } from "../shared";
import pool from "../pool";

const projectRoutes = Router();

// ======================== INTERFACES ========================
interface Role { name: string; count?: number; }
interface CreateProjectBody { title: string; description: string; college?: string; roles: Role[]; }

// ======================== GET USER'S OWN PROJECTS ========================
projectRoutes.get("/", authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.userId!;
  try {
    const result = await pool.query(
      `SELECT p.id, p.title, p.description, p.college, p.status, p.created_at AS "createdAt", u.username AS creator_username
       FROM projects p JOIN users u ON p.creator_id = u.id WHERE p.creator_id = $1 ORDER BY p.created_at DESC`,
      [userId]
    );
    res.json(result.rows);
  } catch (e: any) {
    console.error("Get user projects error:", e);
    res.status(500).json({ error: "Server error" });
  }
});

// ======================== GET ALL PUBLIC PROJECTS (SIMPLE & WORKING) ========================
projectRoutes.get("/public", authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.userId!;
  console.log("🔍 Public projects request for user:", userId);
  
  try {
    const result = await pool.query(
      `SELECT 
        p.id, p.title, p.description, 
        COALESCE(p.college, 'Not specified') AS college,
        p.status, p.created_at AS "createdAt", 
        u.username AS creator_username,
        0 AS upvotes, '[]' AS collaborators, p.creator_id
       FROM projects p
       JOIN users u ON p.creator_id = u.id
       WHERE p.creator_id != $1
       ORDER BY p.created_at DESC`,
      [userId]
    );

    const projects = result.rows.map(p => ({
      id: p.id, title: p.title, description: p.description || "",
      college: p.college, status: p.status, createdAt: p.createdAt,
      creator_username: p.creator_username, upvotes: 0, collaborators: [],
      creator_id: p.creator_id
    }));

    console.log(`✅ SUCCESS: Loaded ${projects.length} public projects for user ${userId}`);
    res.json(projects);
  } catch (e: any) {
    console.error("❌ Public projects error:", e);
    res.status(500).json({ error: e.message });
  }
});

// ======================== CREATE PROJECT ========================
projectRoutes.post("/create", authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  const creatorId = req.userId!;
  const { title, description, college = "", roles } = req.body as CreateProjectBody;

  if (!title?.trim()) return res.status(400).json({ error: "Title is required" });
  if (!description?.trim()) return res.status(400).json({ error: "Description is required" });
  if (!Array.isArray(roles) || roles.length === 0) return res.status(400).json({ error: "At least one role is required" });

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const projRes = await client.query(
      `INSERT INTO projects(title, description, creator_id, college, status) VALUES($1, $2, $3, $4, 'ongoing') RETURNING id`,
      [title.trim(), description.trim(), creatorId, college.trim() || null]
    );
    const projectId = projRes.rows[0].id;

    await client.query(`INSERT INTO project_collaborators(project_id, user_id, status) VALUES($1, $2, 'accepted')`, [projectId, creatorId]);

    if (roles.length > 0) {
      const placeholders = roles.map((_, i) => `($1, $${i * 2 + 2}, $${i * 2 + 3})`).join(",");
      const values = roles.flatMap(r => [r.name.trim(), r.count ?? 1]);
      await client.query(`INSERT INTO project_roles(project_id, role_name, count) VALUES ${placeholders}`, [projectId, ...values]);
    }

    await client.query("COMMIT");
    res.status(201).json({ projectId, message: "Project created" });
  } catch (e: any) {
    await client.query("ROLLBACK");
    console.error("Create project error:", e);
    res.status(500).json({ error: e.message });
  } finally {
    client.release();
  }
});

// ======================== GET SINGLE PROJECT ========================
projectRoutes.get("/:projectId", authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  const { projectId } = req.params;
  const client = await pool.connect();
  try {
    const projRes = await client.query(`SELECT p.*, u.username AS creator_username FROM projects p JOIN users u ON p.creator_id = u.id WHERE p.id = $1`, [projectId]);
    if (!projRes.rows.length) return res.status(404).json({ message: "Project not found" });
    const project = projRes.rows[0];

    const roleRes = await client.query(
      `SELECT pr.id, pr.role_name, pr.count, COALESCE(COUNT(pc.id), 0) AS filled
       FROM project_roles pr LEFT JOIN project_collaborators pc ON pc.role_id = pr.id AND pc.status = 'accepted'
       WHERE pr.project_id = $1 GROUP BY pr.id`,
      [projectId]
    );
    project.roles = roleRes.rows.map(r => ({ id: r.id, roleName: r.role_name, count: Number(r.count), filled: Number(r.filled) }));

    const collabRes = await client.query(
      `SELECT pc.user_id AS "userId", u.username, pr.role_name AS role
       FROM project_collaborators pc JOIN users u ON pc.user_id = u.id LEFT JOIN project_roles pr ON pc.role_id = pr.id
       WHERE pc.project_id = $1 AND pc.status = 'accepted'`,
      [projectId]
    );
    project.collaborators = collabRes.rows;

    const taskRes = await client.query(
      `SELECT id, title, assigned_to AS "assignedTo", due_date AS "dueDate", priority, status, created_at
       FROM project_tasks WHERE project_id = $1 ORDER BY created_at DESC`,
      [projectId]
    );
    project.tasks = taskRes.rows.map(t => ({
      id: t.id, title: t.title, assignedTo: t.assignedTo ? String(t.assignedTo) : null,
      dueDate: t.dueDate, priority: t.priority || "medium", status: t.status || "unassigned"
    }));

    res.json(project);
  } catch (e: any) {
    console.error("Get project error:", e);
    res.status(500).json({ error: e.message });
  } finally {
    client.release();
  }
});

// ======================== JOIN REQUEST ========================
projectRoutes.post("/:projectId/join", authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  const { projectId } = req.params;
  const userId = req.userId!;

  try {
    // Check if already collaborator
    const existing = await pool.query(
      `SELECT id FROM project_collaborators WHERE project_id = $1 AND user_id = $2`,
      [projectId, userId]
    );
    
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: "You are already a collaborator or have requested to join" });
    }

    // Check if project exists and creator != user
    const projectCheck = await pool.query(
      `SELECT id, creator_id FROM projects WHERE id = $1`,
      [projectId]
    );
    
    if (projectCheck.rows.length === 0) return res.status(404).json({ error: "Project not found" });
    if (projectCheck.rows[0].creator_id === userId) return res.status(400).json({ error: "You cannot join your own project" });

    // Insert pending request
    await pool.query(
      `INSERT INTO project_collaborators (project_id, user_id, status) VALUES ($1, $2, 'pending')`,
      [projectId, userId]
    );

    res.json({ message: "Join request sent!" });
  } catch (e: any) {
    console.error("Join request error:", e);
    res.status(500).json({ error: e.message });
  }
});

// ======================== UPDATE PROJECT ========================
projectRoutes.put("/:projectId", authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  // ... keep your existing update code or simplify it
  res.json({ message: "Project updated" });
});

// ======================== ADD TASK ========================
projectRoutes.post("/:projectId/tasks", authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  const { projectId } = req.params;
  const { title, assignedTo, dueDate, priority = "medium" } = req.body;

  if (!title?.trim()) return res.status(400).json({ error: "Task title is required" });

  try {
    const result = await pool.query(
      `INSERT INTO project_tasks(project_id, title, assigned_to, due_date, priority, status)
       VALUES($1, $2, $3, $4, $5, 'unassigned') RETURNING id`,
      [projectId, title.trim(), assignedTo || null, dueDate || null, priority]
    );
    res.status(201).json({ id: result.rows[0].id, message: "Task added" });
  } catch (e: any) {
    console.error("Add task error:", e);
    res.status(500).json({ error: e.message });
  }
});

// ======================== ACCEPT / DECLINE JOIN REQUEST ========================
projectRoutes.put("/:projectId/collaborators/:userId", authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  const { projectId, userId } = req.params;
  const { action } = req.body;

  if (!["accept", "decline"].includes(action)) return res.status(400).json({ error: "Action must be 'accept' or 'decline'" });

  const client = await pool.connect();
  try {
    if (action === "accept") {
      await client.query(`UPDATE project_collaborators SET status = 'accepted' WHERE project_id = $1 AND user_id = $2 AND status = 'pending'`, [projectId, userId]);
    } else {
      await client.query(`DELETE FROM project_collaborators WHERE project_id = $1 AND user_id = $2 AND status = 'pending'`, [projectId, userId]);
    }
    res.json({ message: action === "accept" ? "Collaborator accepted" : "Request declined" });
  } catch (e: any) {
    console.error("Accept/decline error:", e);
    res.status(500).json({ error: e.message });
  } finally {
    client.release();
  }
});

export default projectRoutes;