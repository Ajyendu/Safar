/** When unset, requests use same origin (Vite dev proxy forwards /api → backend). Set for static hosts, e.g. http://127.0.0.1:5001 */
const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "";

async function request(path, options = {}) {
  const headers = { "Content-Type": "application/json", ...options.headers };
  const token = localStorage.getItem("token");
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    let msg = data.error || data.message;
    if (!msg && Array.isArray(data.errors) && data.errors.length > 0) {
      const first = data.errors[0];
      msg = typeof first === "string" ? first : first.msg || first.message;
    }
    if (!msg) msg = res.statusText;
    throw new Error(msg);
  }
  return data;
}

export const api = {
  health: () => request("/api/health"),

  register: (body) =>
    request("/api/auth/register", { method: "POST", body: JSON.stringify(body) }),

  login: (body) =>
    request("/api/auth/login", { method: "POST", body: JSON.stringify(body) }),

  requestOtp: (body) =>
    request("/api/auth/otp/request", { method: "POST", body: JSON.stringify(body) }),

  verifyOtp: (body) =>
    request("/api/auth/otp/verify", { method: "POST", body: JSON.stringify(body) }),

  googleAuth: (body) =>
    request("/api/auth/google", { method: "POST", body: JSON.stringify(body) }),

  me: () => request("/api/auth/me"),

  listMonuments: () => request("/api/monuments"),

  getMonument: (slug) => request(`/api/monuments/${encodeURIComponent(slug)}`),

  getNavigation: (slug, from, to) =>
    request(
      `/api/monuments/${encodeURIComponent(slug)}/navigation?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`
    ),

  verifyQr: (qrId, monumentSlug) =>
    request("/api/qr/verify", {
      method: "POST",
      body: JSON.stringify({ qrId, monumentSlug }),
    }),

  recordVisit: (slug) =>
    request("/api/qr/visit", {
      method: "POST",
      body: JSON.stringify({ slug }),
    }),
};
