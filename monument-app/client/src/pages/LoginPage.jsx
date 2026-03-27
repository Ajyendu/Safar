import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export function LoginPage() {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (mode === "login") {
        await login(email, password);
      } else {
        await register(email, password, displayName);
      }
      navigate("/profile");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4 py-12">
      <Link to="/" className="mb-6 text-sm text-zinc-500 hover:text-white">
        ← Back
      </Link>
      <h1 className="text-2xl font-bold text-white">
        {mode === "login" ? "Sign in" : "Create account"}
      </h1>
      <form onSubmit={submit} className="mt-8 space-y-4">
        {mode === "register" && (
          <label className="block text-sm">
            <span className="text-zinc-500">Display name</span>
            <input
              className="mt-1 w-full rounded-xl border border-white/10 bg-surface-elevated px-3 py-2 text-white"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
            />
          </label>
        )}
        <label className="block text-sm">
          <span className="text-zinc-500">Email</span>
          <input
            type="email"
            required
            className="mt-1 w-full rounded-xl border border-white/10 bg-surface-elevated px-3 py-2 text-white"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>
        <label className="block text-sm">
          <span className="text-zinc-500">Password (min 8 chars)</span>
          <input
            type="password"
            required
            minLength={8}
            className="mt-1 w-full rounded-xl border border-white/10 bg-surface-elevated px-3 py-2 text-white"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
        {error && <p className="text-sm text-red-400">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-accent py-3 font-semibold text-white hover:bg-blue-500 disabled:opacity-50"
        >
          {loading ? "…" : mode === "login" ? "Sign in" : "Register"}
        </button>
      </form>
      <button
        type="button"
        onClick={() => {
          setMode(mode === "login" ? "register" : "login");
          setError(null);
        }}
        className="mt-4 text-center text-sm text-zinc-500 hover:text-zinc-300"
      >
        {mode === "login" ? "Need an account? Register" : "Have an account? Sign in"}
      </button>
    </div>
  );
}
