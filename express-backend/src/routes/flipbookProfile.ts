import { Router } from "express";
import pool from "../pool";
import type { Request, Response } from "express";

const router = Router();

router.get("/:userId", async (req: Request, res: Response) => {
  try {
    const userId = req.params.userId;

    if (!userId || isNaN(Number(userId))) { 
      return res.status(400).json({ message: "Invalid user ID" });
    }

    const userResult = await pool.query(
      "SELECT fullname FROM users WHERE id = $1",
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const profileResult = await pool.query(
      `SELECT 
          avatar,
          description,
          course,
          contact_no AS "contactNo",
          skill
        FROM userprofile 
        WHERE user_id = $1`,
      [userId]
    );

    const profile = profileResult.rows[0] || {}; 
    res.json({
      name: userResult.rows[0].fullname,
      ...profile,
    });
  } catch (error: any) {
    console.error("Error loading profile:", error);
    res.status(500).json({
      message: "Error loading profile",
      error: error.message,
    });
  }
});

router.put("/:userId", async (req: Request, res: Response) => {
  try {
    const userId = req.params.userId;

    if (!userId || isNaN(Number(userId))) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    const { avatar, description, course, contact_no, skill } = req.body as {
      avatar?: string;
      description?: string;
      course?: string;
      contact_no?: string;
      skill?: string;
    };

    const check = await pool.query(
      "SELECT id FROM userprofile WHERE user_id = $1",
      [userId]
    );

    if (check.rows.length === 0) {
      await pool.query(
        `INSERT INTO userprofile 
            (user_id, avatar, description, course, contact_no, skill, updated_at) 
          VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
        [
          userId,
          avatar || null,
          description || null,
          course || null,
          contact_no || null,
          skill || null,
        ]
      );
    } else {
      await pool.query(
        `UPDATE userprofile
         SET avatar = $1,
             description = $2,
             course = $3,
             contact_no = $4,
             skill = $5,
             updated_at = NOW()
         WHERE user_id = $6`,
        [
          avatar || null,
          description || null,
          course || null,
          contact_no || null,
          skill || null,
          userId,
        ]
      );
    }

    res.json({ message: "Profile updated successfully" });
  } catch (error: any) {
    console.error("Error updating profile:", error);
    res.status(500).json({
      message: "Failed to update profile",
      error: error.message,
    });
  }
});

export default router;
