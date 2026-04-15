import jwt from "jsonwebtoken";

export function signAdminToken() {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is not set");
  const expiresIn = process.env.ADMIN_JWT_EXPIRES_IN || "8h";
  return jwt.sign({ adm: true, sub: "safar-admin" }, secret, { expiresIn });
}
