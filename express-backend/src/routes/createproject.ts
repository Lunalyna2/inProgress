import { Router, Response } from "express";
import { authMiddleware, AuthenticatedRequest } from "../shared";
import pool from "../pool";

const projectRoutes = Router();

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

projectRoutes.post("/create", authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  const creatorId = req.userId;
  const { title, description, roles } = req.body as CreateProjectRequestBody;
  if (!creatorId) return res.status(403).json({ message: "Authorization required." });
  if (!title || !description || !Array.isArray(roles)) return res.status(400).json({ error: "Invalid project data." });

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const projectResult = await client.query(
      `INSERT INTO projects(title, description, creator_id, college, status)
       VALUES($1, $2, $3, '', 'ongoing') RETURNING id`,
      [title, description, creatorId]
    );

    const newProjectId = projectResult.rows[0].id;

    await client.query(
      `INSERT INTO project_collaborators(project_id, user_id) VALUES($1, $2)`,
      [newProjectId, creatorId]
    );

    if (roles.length > 0) {
      const roleValues = roles.map((_, i) => `($${i * 3 + 1}, $${i * 3 + 2}, $${i * 3 + 3})`).join(", ");
      const roleParams: (string | number)[] = [];
      roles.forEach(role => roleParams.push(newProjectId, role.name, role.count));
      await client.query(
        `INSERT INTO project_roles(project_id, role_name, count) VALUES ${roleValues}`,
        roleParams
      );
    }

    await client.query("COMMIT");
    res.status(201).json({ message: "Project created successfully", projectId: newProjectId });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error(error);
    res.status(500).json({ error: "Failed to create project." });
  } finally {
    client.release();
  }
});

projectRoutes.get("/picked", authMiddleware, async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const result = await pool.query(`
      SELECT p.id, p.title, p.description, p.status, u.username AS creator_username
      FROM projects p
      JOIN users u ON p.creator_id = u.id
      ORDER BY p.created_at DESC
    `);
    res.status(200).json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch projects." });
  }
});

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
    console.error(error);
    res.status(500).json({ error: "Failed to fetch created projects." });
  }
});

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
    console.error(error);
    res.status(500).json({ error: "Failed to fetch joined projects." });
  }
});

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
    const rolesResult = await pool.query(`SELECT id, role_name AS name, count FROM project_roles WHERE project_id = $1`, [projectId]);
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
    console.error(error);
    res.status(500).json({ error: "Failed to fetch project details." });
  }
});

projectRoutes.put("/:projectId", authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  const { projectId } = req.params;
  const userId = req.userId;
  const {
    title,
    description,
    college,
    newRoles,
    removedRoleIds,
    updatedRoles,
    collaboratorsToAdd,
    collaboratorsToRemove,
    status,
  } = req.body as UpdateProjectRequestBody;

  if (!userId) return res.status(403).json({ message: "Authorization failed." });

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const checkCreator = await client.query("SELECT creator_id FROM projects WHERE id = $1", [projectId]);
    if (checkCreator.rows.length === 0 || checkCreator.rows[0].creator_id !== userId) {
      await client.query("ROLLBACK");
      return res.status(403).json({ message: "Not authorized." });
    }

    await client.query(
      `UPDATE projects
       SET title=$1, description=$2, college=$3, status=$4, updated_at=CURRENT_TIMESTAMP
       WHERE id=$5`,
      [title, description, college, status, projectId]
    );

    if (collaboratorsToRemove?.length) {
      const placeholders = collaboratorsToRemove.map((_, i) => `$${i + 2}`).join(",");
      await client.query(
        `DELETE FROM project_collaborators WHERE project_id=$1 AND user_id IN (${placeholders})`,
        [parseInt(projectId), ...collaboratorsToRemove]
      );
    }

    if (removedRoleIds?.length) {
      const placeholders = removedRoleIds.map((_, i) => `$${i + 1}`).join(",");
      await client.query(
        `DELETE FROM project_roles WHERE id IN (${placeholders}) AND project_id=$${removedRoleIds.length + 1}`,
        [...removedRoleIds, parseInt(projectId)]
      );
    }

    if (updatedRoles?.length) {
      await Promise.all(updatedRoles.map(role =>
        client.query(
          `UPDATE project_roles SET role_name=$1, count=$2 WHERE id=$3 AND project_id=$4`,
          [role.name, role.count, role.id, projectId]
        )
      ));
    }

    if (newRoles?.length) {
      const validRoles = newRoles.filter(r => r.name?.trim());
      if (validRoles.length) {
        const values = validRoles.map((_, i) => `($${i*3+1}, $${i*3+2}, $${i*3+3})`).join(",");
        const params: (string | number)[] = [];
        validRoles.forEach(r => params.push(parseInt(projectId), r.name.trim(), r.count));
        await client.query(`INSERT INTO project_roles(project_id, role_name, count) VALUES ${values}`, params);
      }
    }

    await client.query("COMMIT");
    res.status(200).json({ message: "Project updated successfully" });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error(error);
    res.status(500).json({ error: "Failed to update project." });
  } finally {
    client.release();
  }
});

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
    console.error(error);
    res.status(500).json({ error: "Failed to fetch upvote status." });
  }
});

export default projectRoutes;
