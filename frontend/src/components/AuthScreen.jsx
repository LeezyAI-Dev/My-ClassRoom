import React, { useState } from "react";
import AuroraBackground from "./ui/AuroraBackground";
import { ChevronLeftIcon, EyeIcon, UserIcon } from "./ui/Icons";

function LockIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="5" y="10.5" width="14" height="10" rx="2.4" />
      <path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="8.5" />
      <path d="m8.5 12.2 2.4 2.4 4.6-5" />
    </svg>
  );
}

// Œil barré : mot de passe masqué.
function EyeOffIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2M6.6 6.6C3.6 8.4 2 12 2 12s3.5 6.5 10 6.5c1.1 0 2.1-.15 3-.42M10.6 5.2A10 10 0 0 1 12 5.5c6.5 0 10 6.5 10 6.5a15 15 0 0 1-3.2 4" />
      <path d="M3 3l18 18" />
    </svg>
  );
}

// Champ avec libellé visible, icône et (en option) bouton « afficher le mot de passe ».
function Field({ id, label, icon, type = "text", value, onChange, autoComplete, minLength, shown, onToggle }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-xs font-semibold text-white/75">
        {label}
      </label>
      <div className="flex items-center gap-3 rounded-2xl border border-white/15 bg-white/[0.06] pl-4 pr-1 transition focus-within:border-violet-400 focus-within:bg-white/[0.08]">
        <span className="shrink-0 text-violet-300">{icon}</span>
        <input
          id={id}
          type={onToggle ? (shown ? "text" : "password") : type}
          value={value}
          onChange={onChange}
          required
          minLength={minLength}
          autoComplete={autoComplete}
          autoCapitalize="none"
          spellCheck={false}
          className="min-h-[52px] flex-1 bg-transparent text-[15px] text-white outline-none"
        />
        {onToggle && (
          <button
            type="button"
            onClick={onToggle}
            aria-label={shown ? "Masquer le mot de passe" : "Afficher le mot de passe"}
            aria-pressed={shown}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-white/70 active:bg-white/10"
          >
            {shown ? <EyeOffIcon /> : <EyeIcon size={20} />}
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * Écran de connexion / inscription, réutilisé pour le compte développeur ET le compte élève.
 * Toute la logique (appels API, gestion du token) est passée en props par le parent
 * (DevAuth / StudentAuth) : la mise en page ne fait aucune hypothèse sur « qui » se connecte.
 */
export default function AuthScreen({
  title, // ex : "DÉVELOPPEUR" ou "ÉLÈVE"
  onBack,
  onSubmitLogin, // ({ username, password }) => Promise
  onSubmitRegister, // ({ username, password, confirmPassword }) => Promise
}) {
  const [mode, setMode] = useState("login"); // "login" | "register"
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);

  const switchMode = (next) => {
    setMode(next);
    setError("");
    setInfo("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setInfo("");
    setLoading(true);
    try {
      if (mode === "login") {
        await onSubmitLogin({ username, password });
        // La navigation vers le tableau de bord est gérée par le parent.
      } else {
        await onSubmitRegister({ username, password, confirmPassword });
        setInfo("Compte créé avec succès. Vous pouvez maintenant vous connecter.");
        switchMode("login");
        setPassword("");
        setConfirmPassword("");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative isolate flex min-h-screen flex-col bg-ink">
      <AuroraBackground />

      <header className="pt-safe flex items-center gap-3 px-5 pb-2">
        <button
          type="button"
          onClick={onBack}
          aria-label="Retour"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/[0.08] text-white transition active:bg-white/20 motion-reduce:transition-none"
        >
          <ChevronLeftIcon size={22} />
        </button>
        <h1 className="text-xl font-extrabold tracking-wide text-white">{title}</h1>
      </header>

      <main className="pb-safe mx-auto w-full max-w-sm flex-1 px-5 pt-8">
        {/* Bascule Connexion / Inscription */}
        <div className="seg mb-6" role="tablist" aria-label="Mode">
          <button
            type="button"
            role="tab"
            aria-selected={mode === "login"}
            onClick={() => switchMode("login")}
            className={`seg-item ${mode === "login" ? "seg-item-on" : ""}`}
          >
            Connexion
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === "register"}
            onClick={() => switchMode("register")}
            className={`seg-item ${mode === "register" ? "seg-item-on" : ""}`}
          >
            Inscription
          </button>
        </div>

        {error && (
          <div role="alert" className="mb-4 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        )}
        {info && (
          <div role="status" className="mb-4 rounded-2xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
            {info}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Field
            id="auth-username"
            label="Identifiant"
            icon={<UserIcon size={20} />}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
          />

          <Field
            id="auth-password"
            label="Mot de passe"
            icon={<LockIcon />}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            minLength={8}
            shown={showPassword}
            onToggle={() => setShowPassword((v) => !v)}
          />

          {mode === "register" && (
            <Field
              id="auth-confirm"
              label="Confirmer le mot de passe"
              icon={<CheckIcon />}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
              minLength={8}
              shown={showConfirmPassword}
              onToggle={() => setShowConfirmPassword((v) => !v)}
            />
          )}

          {mode === "register" && (
            <p className="-mt-1 text-xs text-white/65">8 caractères minimum.</p>
          )}

          <button type="submit" disabled={loading} className="btn-primary mt-2 w-full">
            {loading ? "Veuillez patienter…" : mode === "login" ? "Se connecter" : "S'inscrire"}
          </button>
        </form>
      </main>
    </div>
  );
}
