import { Router, Response } from "express";
import { authMiddleware, AuthenticatedRequest } from "../shared";
import pool from "../pool";

const projectRoutes = Router();

// Interfaces
interface Role {
  name: string;
  count: number;
}

interface RoleWithId extends Role {
  id: number;
}

interface CreateProjectRequestBody {
  title: string;
  description: string;
  roles: Role[];
}

interface UpdateProjectRequestBody {
  title: string;
  description: string;
  college: string;
  newRoles: Role[];
  removedRoleIds: number[];
  updatedRoles: RoleWithId[];
  collaboratorsToAdd: number[];
  collaboratorsToRemove: number[];
  status: "ongoing" | "done";
}

// CREATE PROJECT
projectRoutes.post("/create", authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  const creatorId = req.userId;
  const { title, description, roles } = req.body as CreateProjectRequestBody;

  if (!creatorId) return res.status(403).json({ message: "Authorization required." });
  if (!title || !description || !roles || !Array.isArray(roles)) return res.status(400).json({ error: "Invalid project data." });

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const projectResult = await client.query(
      `INSERT INTO projects(title, description, creator_id, college, status)
       VALUES($1, $2, $3, '', 'ongoing') RETURNING id, created_at`,
      [title, description, creatorId]
    );

    const newProjectId = projectResult.rows[0].id;

    await client.query(`INSERT INTO project_collaborators(project_id, user_id) VALUES($1, $2)`, [newProjectId, creatorId]);

    if (roles.length > 0) {
      const roleValues = roles.map((_, i) => `($${i * 3 + 1}, $${i * 3 + 2}, $${i * 3 + 3})`).join(", ");
      const roleParams: (string | number)[] = [];
      roles.forEach(role => roleParams.push(newProjectId, role.name, role.count));
      await client.query(`INSERT INTO project_roles(project_id, role_name, count) VALUES ${roleValues}`, roleParams);
    }

    await client.query("COMMIT");
    res.status(201).json({ message: "Project created successfully", projectId: newProjectId });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Database Error during project creation:", error);
    res.status(500).json({ error: "Failed to create project." });
  } finally {
    client.release();
  }
});

// GET ALL PROJECTS
projectRoutes.get("/all", authMiddleware, async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT p.id, p.title, p.description, p.status, u.username AS creator_username
       FROM projects p
       JOIN users u ON p.creator_id = u.id
       ORDER BY p.created_at DESC`
    );
    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Error fetching all projects:", error);
    res.status(500).json({ error: "Failed to fetch projects." });
  }
});

// GET CREATED PROJECTS
projectRoutes.get("/created", authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.userId;
  if (!userId) return res.status(403).json({ message: "Unauthorized" });

  try {
    const result = await pool.query(
      `SELECT p.id, p.title, p.description, p.status, u.username AS creator_username
       FROM projects p
       JOIN users u ON p.creator_id = u.id
       WHERE p.creator_id = $1
       ORDER BY p.created_at DESC`,
      [userId]
    );
    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Error fetching created projects:", error);
    res.status(500).json({ error: "Failed to fetch created projects." });
  }
});

// GET JOINED PROJECTS
projectRoutes.get("/joined", authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.userId;
  if (!userId) return res.status(403).json({ message: "Unauthorized" });

  try {
    const result = await pool.query(
      `SELECT p.id, p.title, p.description, p.status, u.username AS creator_username
       FROM projects p
       JOIN project_collaborators pc ON pc.project_id = p.id
       JOIN users u ON p.creator_id = u.id
       WHERE pc.user_id = $1
       ORDER BY p.created_at DESC`,
      [userId]
    );
    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Error fetching joined projects:", error);
    res.status(500).json({ error: "Failed to fetch joined projects." });
  }
});

// GET SINGLE PROJECT
projectRoutes.get("/:projectId", authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  const { projectId } = req.params;
  try {
    const projectResult = await pool.query(
      `SELECT p.id, p.title, p.description, p.creator_id, p.college, p.status, u.username AS creator_username
       FROM projects p
       JOIN users u ON p.creator_id = u.id
       WHERE p.id = $1`,
      [projectId]
    );

    if (projectResult.rows.length === 0) return res.status(404).json({ message: "Project not found." });

    const project = projectResult.rows[0];

    const rolesResult = await pool.query(`SELECT id, role_name, count FROM project_roles WHERE project_id = $1`, [projectId]);
    project.roles = rolesResult.rows;

    const collabsResult = await pool.query(
      `SELECT pc.user_id AS userId, u.username
       FROM project_collaborators pc
       JOIN users u ON pc.user_id = u.id
       WHERE pc.project_id = $1`,
      [projectId]
    );
    project.collaborators = collabsResult.rows;

    res.status(200).json(project);
  } catch (error) {
    console.error("Error fetching project:", error);
    res.status(500).json({ error: "Failed to fetch project details." });
  }
});

// GET PICKED PROJECTS (TOP 10 BY UPVOTES)
projectRoutes.get("/picked", authMiddleware, async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const result = await pool.query(`
      SELECT p.id, p.title, p.description, p.status, u.username AS creator_username
      FROM projects p
      JOIN users u ON p.creator_id = u.id
      ORDER BY p.upvote_count DESC
      LIMIT 10
    `);
    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Error fetching picked projects:", error);
    res.status(500).json({ error: "Failed to fetch picked projects." });
  }
});

// GET UPVOTE STATUS
projectRoutes.get("/:projectId/upvote-status", authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  const { projectId } = req.params;
  const userId = req.userId;
  if (!userId) return res.status(403).json({ message: "Unauthorized" });

  try {
    const result = await pool.query(
      `SELECT COUNT(*) AS upvotes,
              EXISTS(SELECT 1 FROM project_upvotes WHERE project_id = $1 AND user_id = $2) AS has_upvoted
       FROM project_upvotes
       WHERE project_id = $1`,
      [projectId, userId]
    );

    res.status(200).json({
      upvotes: parseInt(result.rows[0].upvotes, 10),
      hasUpvoted: result.rows[0].has_upvoted,
    });
  } catch (error) {
    console.error("Error fetching upvote status:", error);
    res.status(500).json({ error: "Failed to fetch upvote status." });
  }
});

export default projectRoutes;
