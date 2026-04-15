import crypto from "crypto";

export function timingSafeEqualStr(a, b) {
  const bufA = Buffer.from(String(a ?? ""), "utf8");
  const bufB = Buffer.from(String(b ?? ""), "utf8");
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

/**
 * Admin dashboard login. Non-production defaults: admin / admin if env unset.
 * Production requires ADMIN_ID and ADMIN_PASSWORD.
 */
export function getAdminCredentials() {
  const isProd = process.env.NODE_ENV === "production";
  const id = process.env.ADMIN_ID ?? (!isProd ? "admin" : "");
  const password = process.env.ADMIN_PASSWORD ?? (!isProd ? "admin" : "");
  return { id, password, configured: Boolean(id && password) };
}

export function validateAdminLogin(adminId, adminPassword) {
  const { id, password, configured } = getAdminCredentials();
  if (!configured) return { ok: false, reason: "disabled" };
  if (!timingSafeEqualStr(adminId, id) || !timingSafeEqualStr(adminPassword, password)) {
    return { ok: false, reason: "invalid" };
  }
  return { ok: true };
}
