"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const pool_1 = __importDefault(require("./pool"));
const router = (0, express_1.Router)();
// =============================
// GET USER PROFILE
// =============================
router.get("/:userId", async (req, res) => {
    try {
        const userId = req.params.userId;
        // Validate userId is a number
        if (!userId || isNaN(Number(userId))) {
            return res.status(400).json({ message: "Invalid user ID" });
        }
        // Get user's full name
        const userResult = await pool_1.default.query("SELECT fullname FROM users WHERE id = $1", [userId]);
        if (userResult.rows.length === 0) {
            return res.status(404).json({ message: "User not found" });
        }
        // Get profile data (may not exist yet)
        const profileResult = await pool_1.default.query(`SELECT 
          avatar,
          description,
          course,
          contact_no AS "contactNo",
          skill
       FROM userprofile 
       WHERE user_id = $1`, [userId]);
        const profile = profileResult.rows[0] || {};
        res.json({
            name: userResult.rows[0].fullname,
            ...profile,
        });
    }
    catch (error) {
        console.error("Error loading profile:", error);
        res.status(500).json({
            message: "Error loading profile",
            error: error.message
        });
    }
});
router.put("/:userId", async (req, res) => {
    try {
        const userId = req.params.userId;
        if (!userId || isNaN(Number(userId))) {
            return res.status(400).json({ message: "Invalid user ID" });
        }
        const { avatar, description, course, contact_no, skill, } = req.body;
        const check = await pool_1.default.query("SELECT id FROM userprofile WHERE user_id = $1", [userId]);
        if (check.rows.length === 0) {
            // INSERT — fixed: no created_at!
            await pool_1.default.query(`INSERT INTO userprofile 
           (user_id, avatar, description, course, contact_no, skill, updated_at) 
         VALUES ($1, $2, $3, $4, $5, $6, NOW())`, [userId, avatar || null, description || null, course || null, contact_no || null, skill || null]);
        }
        else {
            // UPDATE — unchanged
            await pool_1.default.query(`UPDATE userprofile
         SET avatar = $1,
             description = $2,
             course = $3,
             contact_no = $4,
             skill = $5,
             updated_at = NOW()
         WHERE user_id = $6`, [avatar || null, description || null, course || null, contact_no || null, skill || null, userId]);
        }
        res.json({ message: "Profile updated successfully" });
    }
    catch (error) {
        console.error("Error updating profile:", error);
        res.status(500).json({
            message: "Failed to update profile",
            error: error.message,
        });
    }
});
exports.default = router;
