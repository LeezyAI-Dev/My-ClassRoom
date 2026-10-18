import React, { useState } from "react";
import { loginStudent } from "../api";
import { useAuth } from "../context/AuthContext";
import AuroraBackground from "../components/ui/AuroraBackground";
import { ChevronLeftIcon } from "../components/ui/Icons";

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
    <div className="relative isolate min-h-screen bg-ink">
      <AuroraBackground />

      <header className="pt-safe flex items-center gap-3 px-5 pb-2">
        <button
          type="button"
          onClick={onBack}
          disabled={busy}
          aria-label="Retour"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/[0.08] text-white transition active:bg-white/20 disabled:opacity-40 motion-reduce:transition-none"
        >
          <ChevronLeftIcon size={22} />
        </button>
        <h1 className="text-xl font-extrabold text-white">Code PIN oublié</h1>
      </header>

      <main className="pb-safe mx-auto max-w-sm px-5 pt-6">
        <p className="mb-6 text-sm text-white/70">
          Entre le mot de passe de ton inscription pour choisir un nouveau code PIN.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <p className="mb-1.5 text-xs font-semibold text-white/75">Identifiant</p>
            <div className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3.5 font-bold text-white/80">
              {username}
            </div>
          </div>

          <div>
            <label htmlFor="forgot-password" className="mb-1.5 block text-xs font-semibold text-white/75">
              Mot de passe
            </label>
            <input
              id="forgot-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              autoFocus
              className="field min-h-[52px]"
            />
          </div>

          {error && (
            <p role="alert" className="rounded-2xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
              {error}
            </p>
          )}

          <button type="submit" disabled={busy || !password} className="btn-primary w-full">
            {busy ? "Vérification…" : "Continuer"}
          </button>
        </form>
      </main>
    </div>
  );
}
