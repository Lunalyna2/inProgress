import { Router, Response } from "express";
import { authMiddleware, AuthenticatedRequest } from "../shared";
import pool from "../pool";

const projectRoutes = Router();

// ======================== INTERFACES ========================
interface Role {
  name: string;
  count?: number;
}
interface CreateProjectBody {
  title: string;
  description: string;
  college?: string;
  roles: Role[];
}
interface UpdateProjectBody {
  title?: string;
  description?: string;
  college?: string;
  newRoles?: Role[];
  removedRoleIds?: number[];
  collaboratorsToAdd?: { userId: number; roleId?: number }[];
  collaboratorsToRemove?: number[];
  status?: "ongoing" | "done";
}
interface TaskBody {
  title: string;
  assignedTo?: number | null;
  dueDate?: string | null;
  priority?: "high" | "medium" | "low";
}


// ======================== GET ALL USER'S PROJECTS ========================
projectRoutes.get(
  "/",
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.userId!;
    const client = await pool.connect();
    try {
      const result = await client.query(
        `SELECT 
           p.id,
           p.title,
           p.description,
           p.college,
           p.status,
           p.created_at AS "createdAt",
           u.username AS creator_username
         FROM projects p
         JOIN users u ON p.creator_id = u.id
         WHERE p.creator_id = $1
         ORDER BY p.created_at DESC`,
        [userId]
      );
      res.json(result.rows);
    } catch (e: any) {
      console.error("Get user projects error:", e);
      res.status(500).json({ error: "Server error" });
    } finally {
      client.release();
    }
  }
);

// ======================== CREATE PROJECT ========================
projectRoutes.post(
  "/create",
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response) => {
    const creatorId = req.userId!;
    const { title, description, college = "", roles } = req.body as CreateProjectBody;

    // ---- VALIDATION ----
    if (!title?.trim()) return res.status(400).json({ error: "Title is required" });
    if (!description?.trim()) return res.status(400).json({ error: "Description is required" });
    if (!Array.isArray(roles) || roles.length === 0)
      return res.status(400).json({ error: "At least one role is required" });

    for (const r of roles) {
      if (!r.name?.trim()) return res.status(400).json({ error: "Role name is required" });
      const count = r.count ?? 1;
      if (!Number.isInteger(count) || count < 1)
        return res.status(400).json({ error: "Role count must be >= 1" });
    }

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // Insert project
      const projRes = await client.query(
        `INSERT INTO projects(title, description, creator_id, college, status)
         VALUES($1, $2, $3, $4, 'ongoing') RETURNING id`,
        [title.trim(), description.trim(), creatorId, college.trim()]
      );
      const projectId = projRes.rows[0].id;

      // Creator as accepted collaborator
      await client.query(
        `INSERT INTO project_collaborators(project_id, user_id, status)
         VALUES($1, $2, 'accepted')`,
        [projectId, creatorId]
      );

      // Insert roles with count
      if (roles.length > 0) {
        const placeholders = roles
          .map((_, i) => `($1, $${i * 2 + 2}, $${i * 2 + 3})`)
          .join(",");
        const values = roles.flatMap((r) => [r.name.trim(), r.count ?? 1]);
        await client.query(
          `INSERT INTO project_roles(project_id, role_name, count)
           VALUES ${placeholders}`,
          [projectId, ...values]
        );
      }

      await client.query("COMMIT");
      res.status(201).json({ projectId, message: "Project created" });
    } catch (e: any) {
      await client.query("ROLLBACK");
      console.error("Create project error:", e);
      res.status(500).json({ error: e.message || "Server error" });
    } finally {
      client.release();
    }
  }
);

// ======================== GET PROJECT ========================
projectRoutes.get(
  "/:projectId",
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response) => {
    const { projectId } = req.params;
    const client = await pool.connect();
    try {
      // Project basics
      const projRes = await client.query(
        `SELECT p.*, u.username AS creator_username
         FROM projects p
         JOIN users u ON p.creator_id = u.id
         WHERE p.id = $1`,
        [projectId]
      );
      if (!projRes.rows.length) return res.status(404).json({ message: "Project not found" });
      const project = projRes.rows[0];

      // Roles + filled count
      const roleRes = await client.query(
        `SELECT pr.id, pr.role_name, pr.count,
                COALESCE(COUNT(pc.id), 0) AS filled
         FROM project_roles pr
         LEFT JOIN project_collaborators pc
           ON pc.role_id = pr.id AND pc.status = 'accepted'
         WHERE pr.project_id = $1
         GROUP BY pr.id`,
        [projectId]
      );
      project.roles = roleRes.rows.map((r: any) => ({
        id: r.id,
        roleName: r.role_name,
        count: Number(r.count),
        filled: Number(r.filled),
      }));

      // Collaborators
      const collabRes = await client.query(
        `SELECT pc.user_id AS "userId", u.username,
                pr.role_name AS role
         FROM project_collaborators pc
         JOIN users u ON pc.user_id = u.id
         LEFT JOIN project_roles pr ON pc.role_id = pr.id
         WHERE pc.project_id = $1 AND pc.status = 'accepted'`,
        [projectId]
      );
      project.collaborators = collabRes.rows;

      // Tasks - now with correct columns
      const taskRes = await client.query(
        `SELECT 
           id, 
           title, 
           assigned_to AS "assignedTo",
           due_date AS "dueDate",
           priority,
           status,
           created_at
         FROM project_tasks
         WHERE project_id = $1
         ORDER BY created_at DESC`,
        [projectId]
      );
      project.tasks = taskRes.rows.map((t: any) => ({
        id: t.id,
        title: t.title,
        assignedTo: t.assignedTo ? String(t.assignedTo) : null,
        dueDate: t.dueDate,
        priority: t.priority || "medium",
        status: t.status || "unassigned",
      }));

      res.json(project);
    } catch (e: any) {
      console.error("Get project error:", e);
      res.status(500).json({ error: e.message || "Server error" });
    } finally {
      client.release();
    }
  }
);

// ======================== UPDATE PROJECT ========================
projectRoutes.put(
  "/:projectId",
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response) => {
    const { projectId } = req.params;
    const userId = req.userId!;
    const {
      title,
      description,
      college,
      newRoles = [],
      removedRoleIds = [],
      collaboratorsToAdd = [],
      collaboratorsToRemove = [],
      status,
    } = req.body as UpdateProjectBody;

    // Basic validation
    if (title !== undefined && !title.trim())
      return res.status(400).json({ error: "Title cannot be empty" });
    if (description !== undefined && !description.trim())
      return res.status(400).json({ error: "Description cannot be empty" });

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // Must be creator
      const creatorRes = await client.query(
        `SELECT creator_id FROM projects WHERE id = $1`,
        [projectId]
      );
      if (!creatorRes.rows.length || creatorRes.rows[0].creator_id !== userId) {
        await client.query("ROLLBACK");
        return res.status(403).json({ message: "Only creator can edit" });
      }

      // Update project fields
      await client.query(
        `UPDATE projects
         SET title = COALESCE($1, title),
             description = COALESCE($2, description),
             college = COALESCE($3, college),
             status = COALESCE($4, status),
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $5`,
        [title?.trim(), description?.trim(), college?.trim(), status, projectId]
      );

      // Remove roles
      if (removedRoleIds.length > 0) {
        await client.query(
          `DELETE FROM project_roles WHERE id = ANY($1) AND project_id = $2`,
          [removedRoleIds, projectId]
        );
      }

      // Add new roles
      if (newRoles.length > 0) {
        const placeholders = newRoles
          .map((_, i) => `($1, $${i * 2 + 2}, $${i * 2 + 3})`)
          .join(",");
        const values = newRoles.flatMap((r) => [r.name.trim(), r.count ?? 1]);
        await client.query(
          `INSERT INTO project_roles(project_id, role_name, count)
           VALUES ${placeholders}`,
          [projectId, ...values]
        );
      }

      // Remove collaborators
      if (collaboratorsToRemove.length > 0) {
        await client.query(
          `DELETE FROM project_collaborators
           WHERE project_id = $1 AND user_id = ANY($2)`,
          [projectId, collaboratorsToRemove]
        );
      }

      // Add collaborators
      if (collaboratorsToAdd.length > 0) {
        const placeholders = collaboratorsToAdd
          .map((_, i) => `($1, $${i * 2 + 2}, $${i * 2 + 3}, 'accepted')`)
          .join(",");
        const values = collaboratorsToAdd.flatMap((c) => [c.userId, c.roleId ?? null]);
        await client.query(
          `INSERT INTO project_collaborators(project_id, user_id, role_id, status)
           VALUES ${placeholders}
           ON CONFLICT (project_id, user_id) DO UPDATE SET role_id = EXCLUDED.role_id, status = EXCLUDED.status`,
          [projectId, ...values]
        );
      }

      await client.query("COMMIT");
      res.json({ message: "Project updated" });
    } catch (e: any) {
      await client.query("ROLLBACK");
      console.error("Update project error:", e);
      res.status(500).json({ error: e.message || "Server error" });
    } finally {
      client.release();
    }
  }
);

// ======================== ADD TASK ========================
projectRoutes.post(
  "/:projectId/tasks",
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response) => {
    const { projectId } = req.params;
    const { title, assignedTo, dueDate, priority = "medium" } = req.body;

    if (!title?.trim()) return res.status(400).json({ error: "Task title is required" });

    const client = await pool.connect();
    try {
      const result = await client.query(
        `INSERT INTO project_tasks(
           project_id, title, assigned_to, due_date, priority, status
         ) VALUES($1, $2, $3, $4, $5, 'unassigned')
         RETURNING id`,
        [projectId, title.trim(), assignedTo || null, dueDate || null, priority]
      );

      res.status(201).json({ id: result.rows[0].id, message: "Task added" });
    } catch (e: any) {
      console.error("Add task error:", e);
      res.status(500).json({ error: e.message || "Server error" });
    } finally {
      client.release();
    }
  }
);

// ======================== ACCEPT / DECLINE JOIN REQUEST ========================
projectRoutes.put(
  "/:projectId/collaborators/:userId",
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response) => {
    const { projectId, userId } = req.params;
    const { action } = req.body; // 'accept' or 'decline'

    if (!["accept", "decline"].includes(action))
      return res.status(400).json({ error: "Action must be 'accept' or 'decline'" });

    const client = await pool.connect();
    try {
      if (action === "accept") {
        await client.query(
          `UPDATE project_collaborators
           SET status = 'accepted'
           WHERE project_id = $1 AND user_id = $2 AND status = 'pending'`,
          [projectId, userId]
        );
      } else {
        await client.query(
          `DELETE FROM project_collaborators
           WHERE project_id = $1 AND user_id = $2 AND status = 'pending'`,
          [projectId, userId]
        );
      }
      res.json({ message: action === "accept" ? "Collaborator accepted" : "Request declined" });
    } catch (e: any) {
      res.status(500).json({ error: e.message || "Server error" });
    } finally {
      client.release();
    }
  }
);

export default projectRoutes;