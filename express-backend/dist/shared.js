"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = exports.JWT_SECRET = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
exports.JWT_SECRET = process.env.JWT_SECRET || "gkes9Vwl5lJlO3w";
const authMiddleware = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ message: "Access denied. No token provided." });
    }
    const token = authHeader.split(" ")[1];
    if (!token || token === "undefined" || token.toLowerCase() === "null") {
        return res.status(401).json({ message: "Access denied. No token provided." });
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, exports.JWT_SECRET);
        req.userId = decoded.id;
        req.username = decoded.username;
        req.email = decoded.email;
        next();
    }
    catch (err) {
        console.error("JWT verification failed:", err);
        return res.status(403).json({ message: "Invalid token." });
    }
};
exports.authMiddleware = authMiddleware;
