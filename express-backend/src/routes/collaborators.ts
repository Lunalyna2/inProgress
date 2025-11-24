import { Router, Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import pool from "../pool";

const router = Router();

// Extend Request type to include user
interface AuthRequest extends Request {
  user?: { id: string };
}

// Middleware to verify JWT
const auth = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader)
    return res.status(401).json({ error: "No token provided" });

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: string };
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid token" });
  }
};

/* ----------------------------------------------------
   GET /api/collaborators/pending
---------------------------------------------------- */
router.get(
  "/pending",
  auth,
  async (req: AuthRequest, res: Response): Promise<Response> => {
    try {
      const userId = req.user!.id;

      const query = `
        SELECT 
          pc.id,
          u.username AS name,
          u.skills
        FROM project_collaborators pc
        JOIN users u ON u.id = pc.user_id
        WHERE pc.owner_id = $1 AND pc.status = 'pending'
      `;

      const result = await pool.query(query, [userId]);

      const collaborators = result.rows.map((row) => ({
        id: row.id,
        name: row.name,
        skills: row.skills || [],
      }));

      return res.json(collaborators);
    } catch (err) {
      console.error("Error fetching collaborators:", err);
      return res.status(500).json({ error: "Server error" });
    }
  }
);

/* ----------------------------------------------------
   POST /api/collaborators/:id/accept
---------------------------------------------------- */
router.post(
  "/:id/accept",
  auth,
  async (req: AuthRequest, res: Response): Promise<Response> => {
    try {
      const collabId = req.params.id;

      const result = await pool.query(
        `UPDATE project_collaborators 
         SET status='accepted'
         WHERE id=$1 
         RETURNING id`,
        [collabId]
      );

      if (result.rowCount === 0) {
        return res.status(404).json({ error: "Collaborator not found" });
      }

      return res.json({ message: "Collaborator accepted" });
    } catch (err) {
      console.error("Accept collaborator error:", err);
      return res.status(500).json({ error: "Server error" });
    }
  }
);

/* ----------------------------------------------------
   POST /api/collaborators/:id/decline
---------------------------------------------------- */
router.post(
  "/:id/decline",
  auth,
  async (req: AuthRequest, res: Response): Promise<Response> => {
    try {
      const collabId = req.params.id;

      const result = await pool.query(
        `UPDATE project_collaborators
         SET status='declined'
         WHERE id=$1 
         RETURNING id`,
        [collabId]
      );

      if (result.rowCount === 0) {
        return res.status(404).json({ error: "Collaborator not found" });
      }

      return res.json({ message: "Collaborator declined" });
    } catch (err) {
      console.error("Decline collaborator error:", err);
      return res.status(500).json({ error: "Server error" });
    }
  }
);

export default router;
