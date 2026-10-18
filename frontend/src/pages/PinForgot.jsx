import React, { useState } from "react";
import { loginStudent } from "../api";
import { useAuth } from "../context/AuthContext";

// "Code PIN oublié ?" : on vérifie le mot de passe d'inscription (via la connexion normale),
// puis l'appli enchaîne sur la création d'un nouveau PIN.
export default function PinForgot({ username, onBack, onVerified }) {
  const { login } = useAuth();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!password || busy) return;
    setBusy(true);
    setError("");
    try {
      const data = await loginStudent({ username, password });
      login(data.token, data.student, "student");
      onVerified();
    } catch (err) {
      setError(!err.status ? "Connexion impossible. Vérifie ta connexion internet et réessaie." : err.message);
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#060b1c] px-6 pt-12 pb-8 relative overflow-hidden">
      <div className="pointer-events-none absolute -top-32 -right-24 w-72 h-72 rounded-full bg-blue-600/25 blur-3xl" />

      <div className="relative max-w-sm mx-auto">
        <button
          type="button"
          onClick={onBack}
          disabled={busy}
          className="text-sky-400 text-sm font-bold mb-8 active:opacity-70 transition disabled:opacity-40"
        >
          ← Retour
        </button>

        <h1
          className="text-white text-2xl uppercase"
          style={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 800 }}
        >
          Code PIN oublié
        </h1>
        <p className="text-white/50 text-sm mt-2 mb-6">
          Entre le mot de passe de ton inscription pour choisir un nouveau code PIN.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-white/50 text-xs font-semibold mb-1.5">Identifiant</label>
            <div className="w-full rounded-xl bg-white/[0.04] border border-white/10 px-4 py-3 text-white/70 font-bold">
              {username}
            </div>
          </div>

          <div>
            <label className="block text-white/50 text-xs font-semibold mb-1.5">Mot de passe</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              autoFocus
              className="w-full rounded-xl bg-white/[0.06] border border-white/15 px-4 py-3 text-white outline-none focus:border-sky-400"
            />
          </div>

          {error && (
            <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded-xl p-3">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={busy || !password}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 text-white font-bold active:opacity-80 transition disabled:opacity-50"
          >
            {busy ? "Vérification…" : "Continuer"}
          </button>
        </form>
      </div>
    </div>
  );
}
