import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export function ProfilePage() {
  const { user, loading, logout } = useAuth();

  if (loading) {
    return <div className="p-8 text-zinc-500">Loading…</div>;
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-md p-8">
        <p className="text-zinc-400">You are not signed in.</p>
        <Link to="/login" className="mt-4 inline-block text-accent hover:underline">
          Sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-10">
      <Link to="/" className="text-sm text-zinc-500 hover:text-white">
        ← Home
      </Link>
      <h1 className="mt-4 text-2xl font-bold text-white">Profile</h1>
      <p className="mt-1 text-zinc-500">{user.email}</p>
      {user.displayName && (
        <p className="text-sm text-zinc-400">{user.displayName}</p>
      )}

      <section className="mt-8 rounded-2xl border border-white/10 bg-surface-card p-5">
        <h2 className="text-sm font-semibold text-zinc-300">Stats</h2>
        <ul className="mt-3 space-y-2 text-sm text-zinc-400">
          <li>Monuments visited: {user.stats?.monumentsVisited ?? 0}</li>
          <li>QR scans: {user.stats?.totalScans ?? 0}</li>
        </ul>
      </section>

      <section className="mt-6 rounded-2xl border border-white/10 bg-surface-card p-5">
        <h2 className="text-sm font-semibold text-zinc-300">Visited monuments</h2>
        {user.visitedMonuments?.length ? (
          <ul className="mt-3 list-inside list-disc text-sm text-zinc-400">
            {user.visitedMonuments.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-zinc-600">None yet.</p>
        )}
      </section>

      <section className="mt-6 rounded-2xl border border-white/10 bg-surface-card p-5">
        <h2 className="text-sm font-semibold text-zinc-300">Scanned checkpoints</h2>
        {user.scannedQrPoints?.length ? (
          <ul className="mt-3 space-y-1 text-xs text-zinc-500">
            {user.scannedQrPoints.map((k) => (
              <li key={k}>{k}</li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-zinc-600">None yet.</p>
        )}
      </section>

      <button
        type="button"
        onClick={logout}
        className="mt-8 rounded-xl border border-white/10 px-4 py-2 text-sm text-zinc-400 hover:bg-white/5"
      >
        Sign out
      </button>
    </div>
  );
}
