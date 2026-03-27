import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";

/**
 * Minimal admin UI: list monuments (requires authenticated user).
 * In production, restrict to admin role on the server.
 */
export function AdminPage() {
  const { user, loading } = useAuth();
  const [items, setItems] = useState([]);
  const [err, setErr] = useState(null);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      try {
        const data = await api.adminListMonuments();
        if (!cancelled) setItems(data.monuments || []);
      } catch (e) {
        if (!cancelled) setErr(e.message);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  if (loading) return <div className="p-8 text-zinc-500">Loading…</div>;
  if (!user) {
    return (
      <div className="p-8">
        <p className="text-zinc-400">Sign in to access admin.</p>
        <Link to="/login" className="text-accent">
          Login
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <Link to="/" className="text-sm text-zinc-500 hover:text-white">
        ← Home
      </Link>
      <h1 className="mt-4 text-2xl font-bold text-white">Admin — Monuments</h1>
      <p className="mt-1 text-sm text-zinc-500">
        Edit payloads via API or MongoDB directly; this view lists records for quick checks.
      </p>
      {err && <p className="mt-4 text-red-400">{err}</p>}
      <ul className="mt-6 space-y-3">
        {items.map((m) => (
          <li
            key={m._id || m.slug}
            className="rounded-xl border border-white/10 bg-surface-card p-4 text-sm"
          >
            <p className="font-semibold text-white">{m.name}</p>
            <p className="text-zinc-500">{m.slug}</p>
            <p className="mt-1 text-zinc-600">
              QR points: {m.qrPoints?.length ?? 0} · Published:{" "}
              {m.isPublished ? "yes" : "no"}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
