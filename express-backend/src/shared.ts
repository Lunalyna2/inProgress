type Request = import("express").Request;
type Response = import("express").Response;
const jwt = require("jsonwebtoken");

export const JWT_SECRET = "gkes9Vwl5lJlO3w"; 

// Interface for requests that have been processed by the auth middleware
export interface AuthenticatedRequest extends Request {
  userId?: number;
  username?: string;
  email?: string;
}

// --- AUTHENTICATION MIDDLEWARE ---
export const authMiddleware = (
  req: AuthenticatedRequest,
  res: Response,
  next: () => void
) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res
      .status(401)
      .json({ message: "Access denied. No token provided." });
  }

  const token = authHeader.split(" ")[1];
  if (!token || token.toLowerCase() === "null") {
    console.error("Token is null or empty after Bearer split.");
    return res
      .status(401)
      .json({ message: "Access denied. No token provided." });
  }

  console.log("Token received:", token);

  try {
    // Verify the token
    const decoded = jwt.verify(token, JWT_SECRET) as {
      id: number;
      username: string;
      email: string;
    };

    // Attach user info to the request object
    req.userId = decoded.id;
    req.username = decoded.username;
    req.email = decoded.email;

    next(); 
  } catch (ex) {
    const errorMessage =
      ex instanceof Error ? ex.message : "Unknown JWT verification error";

    console.error("JWT verification error (details):", errorMessage);
    return res.status(403).json({ message: "Invalid token." });
  }
};