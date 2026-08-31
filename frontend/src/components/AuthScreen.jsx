import React, { useState } from "react";

// --- Petites icônes SVG en ligne (pas de dépendance externe) ---

function BackArrowIcon() {
  return (
    <svg width="34" height="34" viewBox="0 0 24 24" fill="none">
      <path
        d="M11 5 L4 12 L11 19 M4 12 H16 A5 5 0 0 1 21 17 V18"
        stroke="#141414"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

function IdIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="#141414">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4.4 3.6-7 8-7s8 2.6 8 7v1H4v-1z" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="#141414">
      <path d="M6 10V8a6 6 0 1 1 12 0v2h1a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-9a1 1 0 0 1 1-1h1zm2 0h8V8a4 4 0 1 0-8 0v2z" />
      <circle cx="12" cy="15" r="1.6" fill="#fff" />
      <rect x="11.1" y="15.5" width="1.8" height="3" fill="#fff" />
    </svg>
  );
}

function ThumbsUpIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="#141414">
      <path d="M2 21h3V10H2v11zM22 12a2 2 0 0 0-2-2h-5.6l.8-3.9.03-.4a1.5 1.5 0 0 0-.44-1.06L13.7 3 8 8.7A2 2 0 0 0 7.4 10.1V19a2 2 0 0 0 2 2h7a2 2 0 0 0 1.84-1.21l3-7A2 2 0 0 0 22 12z" />
    </svg>
  );
}

/**
 * Écran visuel de connexion / inscription, réutilisé pour le compte
 * développeur ET le compte élève. Toute la logique (appels API, gestion
 * du token) est passée en props par le composant parent (DevAuth / StudentAuth) :
 * la mise en page ne fait aucune hypothèse sur "qui" se connecte.
 */
export default function AuthScreen({
  title, // ex: "DÉVELOPPEUR" ou "ÉLÈVE"
  onBack,
  onSubmitLogin, // ({ username, password }) => Promise
  onSubmitRegister, // ({ username, password, confirmPassword }) => Promise
}) {
  const [mode, setMode] = useState("login"); // "login" | "register"
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
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
    <div className="min-h-screen bg-white flex flex-col px-6 pt-8 pb-10">
      {/* Retour */}
      <button
        onClick={onBack}
        aria-label="Retour"
        className="self-start mb-2 -ml-1 p-1 active:opacity-60 transition"
      >
        <BackArrowIcon />
      </button>

      {/* Titre */}
      <h1 className="text-center text-[#141414] font-extrabold text-3xl tracking-wide mb-8 mt-2">
        {title}
      </h1>

      {/* Toggle Connexion / Inscription */}
      <div className="w-full max-w-sm mx-auto bg-[#141414] rounded-full p-1 flex mb-8">
        <button
          type="button"
          onClick={() => switchMode("login")}
          className={`flex-1 py-3.5 rounded-full text-white font-bold tracking-wide text-sm transition ${
            mode === "login" ? "border-2 border-white" : "border-2 border-transparent"
          }`}
        >
          CONNEXION
        </button>
        <button
          type="button"
          onClick={() => switchMode("register")}
          className={`flex-1 py-3.5 rounded-full text-white font-bold tracking-wide text-sm transition ${
            mode === "register" ? "border-2 border-white" : "border-2 border-transparent"
          }`}
        >
          INSCRIPTION
        </button>
      </div>

      {error && (
        <div className="w-full max-w-sm mx-auto mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-2.5">
          {error}
        </div>
      )}
      {info && (
        <div className="w-full max-w-sm mx-auto mb-4 text-sm text-green-700 bg-green-50 border border-green-200 rounded-xl px-4 py-2.5">
          {info}
        </div>
      )}

      <form onSubmit={handleSubmit} className="w-full max-w-sm mx-auto flex flex-col gap-5">
        {/* Identifiant */}
        <label className="flex items-center gap-3 border border-[#141414]/70 rounded-full px-5 py-4">
          <IdIcon />
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            placeholder="Identifiant"
            className="flex-1 bg-transparent outline-none text-[#141414] placeholder:text-slate-400"
          />
        </label>

        {/* Mot de passe */}
        <label className="flex items-center gap-3 border border-[#141414]/70 rounded-full px-5 py-4">
          <LockIcon />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            placeholder="Mot de passe"
            className="flex-1 bg-transparent outline-none text-[#141414] placeholder:text-slate-400"
          />
        </label>

        {/* Confirmation (inscription uniquement) */}
        {mode === "register" && (
          <label className="flex items-center gap-3 border border-[#141414]/70 rounded-full px-5 py-4">
            <ThumbsUpIcon />
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={8}
              placeholder="Confirmer le mot de passe"
              className="flex-1 bg-transparent outline-none text-[#141414] placeholder:text-slate-400"
            />
          </label>
        )}

        <button
          type="submit"
          disabled={loading}
          className="mt-2 w-full max-w-[220px] mx-auto py-4 rounded-full bg-[#141414] text-white font-bold tracking-wide text-sm hover:bg-black transition disabled:opacity-60"
        >
          {loading
            ? "Veuillez patienter..."
            : mode === "login"
            ? "SE CONNECTER"
            : "S'INSCRIRE"}
        </button>
      </form>
    </div>
  );
}
