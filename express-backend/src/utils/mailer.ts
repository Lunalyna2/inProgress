// src/utils/mailer.ts
import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";
import dotenv from "dotenv";
dotenv.config();

let transporter: Transporter | null = null;

if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
    });
    console.log("✅ Mailer configured (Gmail SMTP).");
} else {
    console.warn("⚠️ Mailer NOT configured. Set EMAIL_USER / EMAIL_PASS in .env");
}

export default transporter;
