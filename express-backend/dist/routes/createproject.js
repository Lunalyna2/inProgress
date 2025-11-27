"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const shared_1 = require("../shared");
const pool_1 = __importDefault(require("../pool"));
const projectRoutes = (0, express_1.Router)();
// Create Project Route
projectRoutes.post("/create", shared_1.authMiddleware, async (req, res) => {
    const creatorId = req.userId;
    const initialCollege = "";
    const initialStatus = "ongoing";
    const { title, description, roles } = req.body;
    if (!creatorId) {
        return res
            .status(403)
            .json({ message: "Authorization required to create a project." });
    }
    if (!title || !description || !roles || !Array.isArray(roles)) {
        return res
            .status(400)
            .json({
            error: "Missing or invalid project data (title, description, or roles).",
        });
    }
    const client = await pool_1.default.connect();
    try {
        await client.query("BEGIN");
        // Insert Project Details
        const projectInsertQuery = `INSERT INTO projects(title, description, creator_id, college, status) VALUES($1, $2, $3, $4, $5) RETURNING id, created_at`;
        const projectResult = await client.query(projectInsertQuery, [
            title,
            description,
            creatorId,
            initialCollege,
            initialStatus,
        ]);
        const newProjectId = projectResult.rows[0].id;
        // Insert Creator as Initial Collaborator
        const collaboratorInsertQuery = `INSERT INTO project_collaborators(project_id, user_id) VALUES($1, $2)`;
        await client.query(collaboratorInsertQuery, [newProjectId, creatorId]);
        // Insert Roles with count
        if (roles.length > 0) {
            let paramIndex = 1;
            const roleValues = roles
                .map(() => {
                const v1 = paramIndex++;
                const v2 = paramIndex++;
                const v3 = paramIndex++;
                return `($${v1}, $${v2}, $${v3})`;
            })
                .join(", ");
            const roleInsertQuery = `INSERT INTO project_roles(project_id, role_name, count) VALUES ${roleValues}`;
            const roleParams = roles.flatMap((role) => [
                newProjectId,
                role.name,
                role.count,
            ]);
            await client.query(roleInsertQuery, roleParams);
        }
        await client.query("COMMIT");
        res.status(201).json({
            message: "Project created successfully",
            projectId: newProjectId,
            createdAt: projectResult.rows[0].created_at,
        });
    }
    catch (error) {
        await client.query("ROLLBACK");
        console.error("Database Error during project creation:", error);
        res
            .status(500)
            .json({ error: "Failed to create project due to a server error." });
    }
    finally {
        client.release();
    }
});
// Fetch Project by ID Route
projectRoutes.get("/:projectId", shared_1.authMiddleware, async (req, res) => {
    const { projectId } = req.params;
    try {
        // Fetch project details
        const projectQuery = `SELECT p.id, p.title, p.description, p.creator_id, p.college, p.status, u.username as creator_username FROM projects p JOIN users u ON p.creator_id = u.id WHERE p.id = $1`;
        const projectResult = await pool_1.default.query(projectQuery, [projectId]);
        if (projectResult.rows.length === 0) {
            return res.status(404).json({ message: "Project not found." });
        }
        const project = projectResult.rows[0];
        // Fetch project roles with count
        const rolesQuery = `SELECT id, role_name, count FROM project_roles WHERE project_id = $1`;
        const rolesResult = await pool_1.default.query(rolesQuery, [projectId]);
        project.roles = rolesResult.rows;
        // Fetch Collaborators 
        const collaboratorsQuery = `SELECT pc.user_id as userId, u.username FROM project_collaborators pc JOIN users u ON pc.user_id = u.id WHERE pc.project_id = $1`;
        const collabsResult = await pool_1.default.query(collaboratorsQuery, [projectId]);
        project.collaborators = collabsResult.rows;
        res.status(200).json(project);
    }
    catch (error) {
        console.error("Error fetching project:", error);
        res.status(500).json({ error: "Failed to fetch project details." });
    }
});
// Update Project Route
projectRoutes.put("/:projectId", shared_1.authMiddleware, async (req, res) => {
    const { projectId } = req.params;
    const userId = req.userId;
    const { title, description, college, newRoles, removedRoleIds, collaboratorsToAdd, collaboratorsToRemove, status, } = req.body;
    if (!userId) {
        return res.status(403).json({ message: "Authorization failed." });
    }
    const client = await pool_1.default.connect();
    try {
        await client.query("BEGIN");
        // Check if the user is the creator 
        const checkCreator = await client.query("SELECT creator_id FROM projects WHERE id = $1", [projectId]);
        if (checkCreator.rows.length === 0 ||
            checkCreator.rows[0].creator_id !== userId) {
            await client.query("ROLLBACK");
            return res
                .status(403)
                .json({ message: "You are not authorized to edit this project." });
        }
        // Update Project Details
        const updateProjectQuery = `UPDATE projects SET title = $1, description = $2, college = $3, status = $4, updated_at = CURRENT_TIMESTAMP WHERE id = $5`;
        await client.query(updateProjectQuery, [
            title,
            description,
            college,
            status,
            projectId,
        ]);
        // Delete Removed Collaborators 
        if (collaboratorsToRemove && collaboratorsToRemove.length > 0) {
            const numericUserIds = collaboratorsToRemove.map(id => {
                if (typeof id === 'string') {
                    return parseInt(id);
                }
                return id;
            }).filter(id => !isNaN(id));
            if (numericUserIds.length === 0) {
                console.log("No valid user IDs found for removal.");
            }
            else {
                const userPlaceholders = numericUserIds.map((_, i) => `$${i + 2}`).join(",");
                const deleteCollaboratorsQuery = `DELETE FROM project_collaborators WHERE project_id = $1 AND user_id IN (${userPlaceholders})`;
                const deleteParams = [
                    parseInt(projectId),
                    ...numericUserIds
                ];
                const deleteResult = await client.query(deleteCollaboratorsQuery, deleteParams);
                console.log(`Deleted ${deleteResult.rowCount} collaborator rows for project ${projectId}.`);
            }
        }
        // Insert New Collaborators
        if (collaboratorsToAdd && collaboratorsToAdd.length > 0) {
            let paramIndex = 1;
            const collabValues = collaboratorsToAdd
                .map(() => {
                const v1 = paramIndex++;
                const v2 = paramIndex++;
                return `($${v1}, $${v2})`;
            })
                .join(", ");
            const insertCollaboratorsQuery = `INSERT INTO project_collaborators(project_id, user_id) VALUES ${collabValues} ON CONFLICT DO NOTHING`;
            const collabParams = collaboratorsToAdd.flatMap((userId) => [
                parseInt(projectId),
                userId,
            ]);
            await client.query(insertCollaboratorsQuery, collabParams);
        }
        // Delete Removed Roles 
        if (removedRoleIds && removedRoleIds.length > 0) {
            const placeholders = removedRoleIds.map((_, i) => `$${i + 1}`).join(",");
            const deleteRolesQuery = `DELETE FROM project_roles WHERE id IN (${placeholders}) AND project_id = $${removedRoleIds.length + 1}`;
            await client.query(deleteRolesQuery, [...removedRoleIds, parseInt(projectId)]);
        }
        // Insert New Roles with count
        if (newRoles && newRoles.length > 0) {
            let paramIndex = 1;
            const roleValues = newRoles
                .map(() => {
                const v1 = paramIndex++;
                const v2 = paramIndex++;
                const v3 = paramIndex++;
                return `($${v1}, $${v2}, $${v3})`;
            })
                .join(", ");
            const roleInsertQuery = `INSERT INTO project_roles(project_id, role_name, count) VALUES ${roleValues}`;
            const roleParams = newRoles.flatMap((role) => [
                parseInt(projectId),
                role.name,
                role.count,
            ]);
            await client.query(roleInsertQuery, roleParams);
        }
        await client.query("COMMIT");
        res.status(200).json({ message: "Project updated successfully" });
    }
    catch (error) {
        await client.query("ROLLBACK");
        console.error("Database Error during project update:", error);
        res
            .status(500)
            .json({ error: "Failed to update project due to a server error." });
    }
    finally {
        client.release();
    }
});
exports.default = projectRoutes;
