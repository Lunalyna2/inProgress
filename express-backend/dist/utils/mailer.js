"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/utils/mailer.ts
const nodemailer_1 = __importDefault(require("nodemailer"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
let transporter = null;
if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    transporter = nodemailer_1.default.createTransport({
        host: "smtp.gmail.com",
        port: 587,
        secure: false,
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
    });
    console.log("✅ Mailer configured (Gmail SMTP).");
}
else {
    console.warn("⚠️ Mailer NOT configured. Set EMAIL_USER / EMAIL_PASS in .env");
}
exports.default = transporter;
