// src/pages/Login.jsx — écran du code d'accès (section 3 du prompt frontend)
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, Sprout } from "lucide-react";
import { useAuth } from "../hooks/useAuth.jsx";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(code);
      navigate("/tableau-de-bord", { replace: true });
    } catch (err) {
      setError(err.message || "Code d'accès incorrect.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface px-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="h-14 w-14 rounded-lg bg-forest flex items-center justify-center mb-4">
            <Sprout className="text-white" size={26} />
          </div>
          <h1 className="text-xl font-extrabold text-ink tracking-tight">GOLIATH</h1>
          <p className="text-sm text-muted">Ma Ferme Avicole</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 rounded-lg bg-white p-6 border border-black/5">
          <div>
            <label htmlFor="code" className="block text-sm font-medium text-ink mb-1">
              Code d'accès
            </label>
            <input
              id="code"
              type="password"
              inputMode="numeric"
              autoFocus
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full rounded-md border border-black/10 px-3 py-3 text-center text-lg tracking-widest focus:outline-none focus:ring-2 focus:ring-forest/40 focus:border-forest"
              placeholder="••••••"
            />
          </div>

          {error && <p className="text-sm text-danger">{error}</p>}

          <button
            type="submit"
            disabled={loading || !code}
            className="w-full flex items-center justify-center gap-2 rounded-md bg-forest py-3 text-sm font-semibold text-white disabled:opacity-50"
          >
            {loading && <Loader2 size={16} className="animate-spin" />}
            Entrer
          </button>
        </form>
      </div>
    </div>
  );
}
