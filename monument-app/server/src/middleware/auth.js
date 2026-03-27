import jwt from "jsonwebtoken";
import { User } from "../models/User.js";

/**
 * Requires Authorization: Bearer <token>. Attaches req.user (minimal payload).
 */
export async function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) {
    return res.status(401).json({ error: "Authentication required" });
  }
  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) throw new Error("JWT_SECRET missing");
    const payload = jwt.verify(token, secret);
    const user = await User.findById(payload.sub).select("-passwordHash");
    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }
    req.user = user;
    req.auth = { sub: payload.sub };
    next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

/**
 * Optional auth: sets req.user if valid token present.
 */
export async function optionalAuth(req, res, next) {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) {
    req.user = null;
    return next();
  }
  try {
    const secret = process.env.JWT_SECRET;
    const payload = jwt.verify(token, secret);
    req.user = await User.findById(payload.sub).select("-passwordHash");
  } catch {
    req.user = null;
  }
  next();
}
