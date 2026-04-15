import { validateAdminLogin } from "../utils/adminCredentials.js";
import { signAdminToken } from "../utils/adminToken.js";

export async function adminLogin(req, res) {
  const { adminId, adminPassword } = req.body || {};
  const gate = validateAdminLogin(adminId, adminPassword);
  if (!gate.ok) {
    if (gate.reason === "disabled") {
      return res.status(503).json({
        error: "Admin login is not configured. Set ADMIN_ID and ADMIN_PASSWORD.",
      });
    }
    return res.status(401).json({ error: "Invalid admin ID or password" });
  }
  try {
    const token = signAdminToken();
    return res.json({ token, tokenType: "Bearer" });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Could not issue token" });
  }
}
