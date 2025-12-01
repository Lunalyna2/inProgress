import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

export const JWT_SECRET = process.env.JWT_SECRET || "fallback-secret";

interface JWTPayload {
  id: number;
  username: string;
  email: string;
  iat?: number;
  exp?: number;
}

export interface AuthenticatedRequest extends Request {
  userId?: number;
  username?: string;
  email?: string;
}

export const authMiddleware = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Access denied. No token provided." });
  }

  const token = authHeader.split(" ")[1];

  if (!token || token === "undefined" || token.toLowerCase() === "null") {
    return res.status(401).json({ message: "Access denied. No token provided." });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;

    req.userId = decoded.id;
    req.username = decoded.username;
    req.email = decoded.email;
    next();
  } catch (err) {
    console.error("JWT verification failed:", err);
    return res.status(403).json({ message: "Invalid token." });
  }
};