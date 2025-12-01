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

// CREATE PROJECT
projectRoutes.post(
  "/create",
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response) => {
    const creatorId = req.userId;
    const initialCollege = "";
    const initialStatus = "ongoing";

    const { title, description, roles } = req.body as CreateProjectRequestBody;

    if (!creatorId) {
      return res
        .status(403)
        .json({ message: "Authorization required to create a project." });
    }

    if (!title || !description || !roles || !Array.isArray(roles)) {
      return res.status(400).json({
        error: "Missing or invalid project data (title, description, or roles).",
      });
    }

    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      const projectInsertQuery = `
        INSERT INTO projects(title, description, creator_id, college, status)
        VALUES($1, $2, $3, $4, $5)
        RETURNING id, created_at
      `;
      const projectResult = await client.query(projectInsertQuery, [
        title,
        description,
        creatorId,
        initialCollege,
        initialStatus,
      ]);
      const newProjectId = projectResult.rows[0].id;

      // Add creator as initial collaborator
      await client.query(
        `INSERT INTO project_collaborators(project_id, user_id) VALUES($1, $2)`,
        [newProjectId, creatorId]
      );

      // Add roles
      if (roles.length > 0) {
        const roleValues = roles.map(
          (_, i) => `($${i * 3 + 1}, $${i * 3 + 2}, $${i * 3 + 3})`
        ).join(", ");
        const roleParams: (string | number)[] = [];
        roles.forEach((role) => {
          roleParams.push(newProjectId, role.name, role.count);
        });
        const roleInsertQuery = `
          INSERT INTO project_roles(project_id, role_name, count)
          VALUES ${roleValues}
        `;
        await client.query(roleInsertQuery, roleParams);
      }

      await client.query("COMMIT");
      res.status(201).json({
        message: "Project created successfully",
        projectId: newProjectId,
        createdAt: projectResult.rows[0].created_at,
      });
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("Database Error during project creation:", error);
      res
        .status(500)
        .json({ error: "Failed to create project due to a server error." });
    } finally {
      client.release();
    }
  }
);

// GET ALL PROJECTS (for project cards)
projectRoutes.get(
  "/all",
  authMiddleware,
  async (_req: AuthenticatedRequest, res: Response) => {
    try {
      const projectsQuery = `
        SELECT p.id, p.title, p.description, p.status, u.username AS creator_username
        FROM projects p
        JOIN users u ON p.creator_id = u.id
        ORDER BY p.created_at DESC
      `;
      const result = await pool.query(projectsQuery);
      res.status(200).json(result.rows);
    } catch (error) {
      console.error("Error fetching all projects:", error);
      res.status(500).json({ error: "Failed to fetch projects." });
    }
  }
);

// GET PROJECTS CREATED BY THE LOGGED-IN USER
projectRoutes.get(
  "/created",
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.userId;
    if (!userId) return res.status(403).json({ message: "Unauthorized" });

    try {
      const query = `
        SELECT p.id, p.title, p.description, p.status, u.username AS creator_username
        FROM projects p
        JOIN users u ON p.creator_id = u.id
        WHERE p.creator_id = $1
        ORDER BY p.created_at DESC
      `;
      const result = await pool.query(query, [userId]);
      res.status(200).json(result.rows);
    } catch (error) {
      console.error("Error fetching created projects:", error);
      res.status(500).json({ error: "Failed to fetch created projects." });
    }
  }
);

projectRoutes.get(
  "/joined",
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.userId;
    if (!userId) return res.status(403).json({ message: "Unauthorized" });

    try {
      const query = `
        SELECT p.id, p.title, p.description, p.status, u.username AS creator_username
        FROM projects p
        JOIN project_collaborators pc ON pc.project_id = p.id
        JOIN users u ON p.creator_id = u.id
        WHERE pc.user_id = $1
        ORDER BY p.created_at DESC
      `;
      const result = await pool.query(query, [userId]);
      res.status(200).json(result.rows);
    } catch (error) {
      console.error("Error fetching joined projects:", error);
      res.status(500).json({ error: "Failed to fetch joined projects." });
    }
  }
);

// GET PROJECT BY ID
projectRoutes.get(
  "/:projectId",
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response) => {
    const { projectId } = req.params;
    try {
      const projectQuery = `
        SELECT p.id, p.title, p.description, p.creator_id, p.college, p.status,
               u.username AS creator_username
        FROM projects p
        JOIN users u ON p.creator_id = u.id
        WHERE p.id = $1
      `;
      const projectResult = await pool.query(projectQuery, [projectId]);

      if (projectResult.rows.length === 0) {
        return res.status(404).json({ message: "Project not found." });
      }
      const project = projectResult.rows[0];

      // Roles
      const rolesResult = await pool.query(
        `SELECT id, role_name, count FROM project_roles WHERE project_id = $1`,
        [projectId]
      );
      project.roles = rolesResult.rows;

      // Collaborators
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
  }
);

// UPDATE PROJECT
projectRoutes.put(
  "/:projectId",
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response) => {
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

      // Check if user is creator
      const checkCreator = await client.query(
        "SELECT creator_id FROM projects WHERE id = $1",
        [projectId]
      );
      if (checkCreator.rows.length === 0 || checkCreator.rows[0].creator_id !== userId) {
        await client.query("ROLLBACK");
        return res.status(403).json({ message: "Not authorized." });
      }

      // Update project
      await client.query(
        `UPDATE projects
         SET title=$1, description=$2, college=$3, status=$4, updated_at=CURRENT_TIMESTAMP
         WHERE id=$5`,
        [title, description, college, status, projectId]
      );

      // Remove collaborators
      if (collaboratorsToRemove && collaboratorsToRemove.length > 0) {
        const userPlaceholders = collaboratorsToRemove.map((_, i) => `$${i + 2}`).join(",");
        const deleteQuery = `DELETE FROM project_collaborators WHERE project_id=$1 AND user_id IN (${userPlaceholders})`;
        await client.query(deleteQuery, [parseInt(projectId), ...collaboratorsToRemove]);
      }

      // Remove roles
      if (removedRoleIds && removedRoleIds.length > 0) {
        const placeholders = removedRoleIds.map((_, i) => `$${i + 1}`).join(",");
        await client.query(
          `DELETE FROM project_roles WHERE id IN (${placeholders}) AND project_id=$${removedRoleIds.length + 1}`,
          [...removedRoleIds, parseInt(projectId)]
        );
      }

      // Update roles
      if (updatedRoles && updatedRoles.length > 0) {
        const updatePromises = updatedRoles.map((role) =>
          client.query(
            `UPDATE project_roles SET role_name=$1, count=$2 WHERE id=$3 AND project_id=$4`,
            [role.name, role.count, role.id, projectId]
          )
        );
        await Promise.all(updatePromises);
      }

      // Add new roles
      if (newRoles && newRoles.length > 0) {
        const validRoles = newRoles.filter(r => r.name && r.name.trim() !== "");
        if (validRoles.length > 0) {
          const values = validRoles.map((_, i) => `($${i*3+1}, $${i*3+2}, $${i*3+3})`).join(",");
          const params: (string | number)[] = [];
          validRoles.forEach(r => params.push(parseInt(projectId), r.name.trim(), r.count));
          await client.query(
            `INSERT INTO project_roles(project_id, role_name, count) VALUES ${values}`,
            params
          );
        }
      }

      await client.query("COMMIT");
      res.status(200).json({ message: "Project updated successfully" });
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("Error updating project:", error);
      res.status(500).json({ error: "Failed to update project." });
    } finally {
      client.release();
    }
  }
);

export default projectRoutes;
