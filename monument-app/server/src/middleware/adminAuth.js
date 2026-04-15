import jwt from "jsonwebtoken";

/**
 * Requires Bearer JWT issued by POST /api/admin/auth/login (payload.adm === true).
 */
export function requireAdminAuth(req, res, next) {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) {
    return res.status(401).json({ error: "Admin authentication required" });
  }
  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) throw new Error("JWT_SECRET missing");
    const payload = jwt.verify(token, secret);
    if (!payload?.adm) {
      return res.status(401).json({ error: "Invalid admin token" });
    }
    req.admin = { sub: payload.sub };
    next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired admin token" });
  }
}
