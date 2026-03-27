const API_BASE = "";

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
    const msg = data.error || data.message || res.statusText;
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

  /** Admin */
  adminListMonuments: () => request("/api/admin/monuments"),
};
