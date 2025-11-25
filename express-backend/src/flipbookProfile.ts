import { Router } from "express";
import pool from "./pool";

const router = Router();

// Get user profile
router.get("/:userId", async (req, res) => {
    try {
        const userId = req.params.userId;

        // Get user name from users table
        const userResult = await pool.query(
            "SELECT fullname FROM users WHERE id = $1", [userId]
        );

        if (userResult.rows.length === 0) {
            return res.status(404).json({message: "User not found"})
        }

        // Get profile info from userprofile table
        const profileResult = await pool.query(
            "SELECT avatar, description, course, contact_no AS \"contactNo\", skill FROM userprofile WHERE user_id = $1", [userId]
        );

        const profile = profileResult.rows[0]  || {};

        res.json({
            name: userResult.rows[0].fullname,
            ...profile
        });
    } catch(error) {
        console.error(error);
        res.status(500).json({message: "Error loading profile"});
    }
});

// PUT update user profile
router.put("/:userId", async (req, res) => {
    try {
        const userId = req.params.userId;
        const { avatar, description, course, contactNo, skill} = req.body;

        // Check if profile exists
        const check = await pool.query(
            "SELECT id FROM userprofile WHERE user_id = $1",
            [userId]
        );

        if (check.rows.length === 0) {
            // Insert new profile
            await pool.query(
                `INSERT INTO userprofile (user_id, avatar, description, course, contact_no, skill) VALUES ($1, $2, $3, $4, $5, $6)`,
                [userId, avatar, description, course, contactNo, skill]
            );
        } else {
            // Update existing profile
            await pool.query(
                `UPDATE userprofile
                SET avatar = $1, description = $2, course = $3, contact_no = $4, skill = $5, updated_at = NOW()
                WHERE user_id = $6`,
                [avatar, description, course, contactNo, skill, userId]
            );
        }

        res.json({message: "Profile updated"});
    } catch(error) {
        console.error(error)
        res.status(500).json({message: "Error updating profile"});
    }
})

export default router;