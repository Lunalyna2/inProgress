// src/routes/authForgot.ts
import { Router } from "express";
import crypto from "crypto";
import transporter from "../utils/mailer";
import pool from "../pool";
const router = Router();

const FRONTEND_URL = process.env.FRONTEND_URL;

router.post("/forgot-password", async (req, res) => {
    try {
    const { cpuEmail } = req.body as { cpuEmail?: string };
    if (!cpuEmail) return res.status(400).json({ message: "Email is required." });

    const userResult = await pool.query("SELECT id FROM users WHERE email = $1", [cpuEmail]);
    if (userResult.rows.length === 0) {
      // don't reveal whether user exists — but for dev you may want 404
        return res.status(404).json({ message: "User not found." });
    }

    const userId = userResult.rows[0].id;
    const resetToken = crypto.randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 1000 * 60 * 60); // 1 hour

    await pool.query(
        "UPDATE users SET reset_token = $1, reset_token_expires = $2 WHERE id = $3",
        [resetToken, expires, userId]
    );

    const resetLink = `${FRONTEND_URL}/reset-password?token=${resetToken}`;

    const BRAND_COLOR = '#007bff';
    const FONT_FAMILY = 'Arial, sans-serif';
    const FOOTER_COLOR = '#6c757d';

    const mailOptions = {
        from: process.env.EMAIL_USER || "no-reply@inProgress.com", 
        to: cpuEmail,
        subject: "inProgress: Password Reset Request",
        html: `
        <table width="100%" bgcolor="#f4f4f4" border="0" cellpadding="0" cellspacing="0" style="font-family: ${FONT_FAMILY};">
            <tr>
                <td align="center" style="padding: 20px 0;">
                    <!-- Main Content Container -->
                    <table width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1);" border="0" cellpadding="0" cellspacing="0">
                        
                        <!-- Header/Logo Area -->
                        <tr>
                            <td align="center" style="background-color: ${BRAND_COLOR}; padding: 30px 20px; color: #ffffff;">
                                <h1 style="margin: 0; font-size: 24px;">inProgress</h1>
                            </td>
                        </tr>

                        <!-- Body Content -->
                        <tr>
                            <td style="padding: 30px 20px; color: #333333; line-height: 1.6;">
                                <h2 style="font-size: 20px; margin-top: 0; margin-bottom: 20px;">Password Reset Request</h2>
                                
                                <p style="margin-bottom: 20px;">
                                    Hello, you recently requested a password reset for your **inProgress** account.
                                    To complete the process, please click the secure button below.
                                </p>

                                <!-- Call-to-Action Button (The link is wrapped in a table cell for full email client compatibility) -->
                                <table border="0" cellspacing="0" cellpadding="0" style="width: 100%; margin-bottom: 30px;">
                                    <tr>
                                        <td align="center" style="padding: 10px 0;">
                                            <a href="${resetLink}" target="_blank" style=" 
                                                background-color: ${BRAND_COLOR};
                                                border: 1px solid ${BRAND_COLOR};
                                                color: #ffffff;
                                                text-decoration: none;
                                                padding: 12px 25px;
                                                border-radius: 5px;
                                                display: inline-block;
                                                font-weight: bold;
                                                font-size: 16px;
                                            ">
                                                Reset My Password
                                            </a>
                                        </td>
                                    </tr>
                                </table>

                                <p style="margin-bottom: 20px;">
                                    For security, this link will expire in **1 hour**. If you did not request this, please ignore this email.
                                </p>

                                <p style="font-size: 12px; color: ${FOOTER_COLOR}; margin-top: 30px; border-top: 1px solid #eeeeee; padding-top: 15px;">
                                    If the button above doesn't work, you can copy and paste this link into your browser: <br>
                                    <a href="${resetLink}" target="_blank" style="color: ${BRAND_COLOR}; word-break: break-all;">${resetLink}</a>
                                </p>
                            </td>
                        </tr>

                        <!-- Footer -->
                        <tr>
                            <td align="center" style="background-color: #e9ecef; padding: 20px 20px; font-size: 12px; color: ${FOOTER_COLOR}; border-radius: 0 0 8px 8px;">
                                <p style="margin: 0;">&copy; ${new Date().getFullYear()} inProgress by pending...</p>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
        `,
    };

    if (!transporter) {
        console.warn("No transporter configured; skipping sendMail.");
    } else {
      // send and log info
        const info = await transporter.sendMail(mailOptions);
        console.log("Reset email sent:", info.response || info);
    }

    // dev convenience: return token & link in response (remove in production)
    const resp: any = { message: "Password reset link sent (if configured)." };
    if (process.env.NODE_ENV !== "production") {
        resp.resetToken = resetToken;
        resp.resetLink = resetLink;
    }

    return res.status(200).json(resp);
    } catch (err) {
    console.error("Error in forgot-password route:", err);
    return res.status(500).json({ message: "Server error during password reset." });
    }
});

router.post("/reset-password/:token", async (req, res) => {
    try {
    const { token } = req.params;
    const { newPassword, rePassword } = req.body as { newPassword?: string; rePassword?: string };

    if (!token) return res.status(400).json({ message: "Token required." });
    if (!newPassword || !rePassword) return res.status(400).json({ message: "Both password fields required." });
    if (newPassword !== rePassword) return res.status(400).json({ message: "Passwords do not match." });

    const userResult = await pool.query(
        "SELECT id FROM users WHERE reset_token = $1 AND reset_token_expires > NOW()",
        [token]
    );

    if (userResult.rows.length === 0) return res.status(400).json({ message: "Invalid or expired token." });

    const userId = userResult.rows[0].id;
    const hashed = await require("bcrypt").hash(newPassword, 10);

    await pool.query(
        "UPDATE users SET password = $1, reset_token = NULL, reset_token_expires = NULL WHERE id = $2",
        [hashed, userId]
    );

    return res.status(200).json({ message: "Password has been reset successfully." });
    } catch (err) {
    console.error("Error in reset-password route:", err);
    return res.status(500).json({ message: "Server error." });
    }
});

export default router;
