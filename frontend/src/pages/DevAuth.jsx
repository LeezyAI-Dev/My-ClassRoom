import React, { useState } from "react";
import { registerDeveloper, loginDeveloper } from "../api";
import { useAuth } from "../context/AuthContext";

export default function DevAuth({ onBack, onLoginSuccess }) {
  const [mode, setMode] = useState("login"); // "login" | "register"
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();

  const resetMessages = () => {
    setError("");
    setInfo("");
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    resetMessages();
    setLoading(true);
    try {
      const data = await loginDeveloper({ username, password });
      login(data.token, data.developer);
      onLoginSuccess();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    resetMessages();
    setLoading(true);
    try {
      await registerDeveloper({ username, password, confirmPassword });
      setInfo("Compte créé avec succès. Vous pouvez maintenant vous connecter.");
      setMode("login");
      setPassword("");
      setConfirmPassword("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <button
          onClick={onBack}
          className="text-sm text-slate-500 hover:text-slate-800 mb-4"
        >
          ← Retour
        </button>

        <h2 className="text-xl font-semibold text-slate-800 mb-1">Compte développeur</h2>
        <p className="text-sm text-slate-500 mb-6">
          {mode === "login" ? "Connectez-vous à votre compte." : "Créez votre compte développeur."}
        </p>

        <div className="flex mb-6 rounded-lg bg-slate-100 p-1">
          <button
            className={`flex-1 py-2 text-sm rounded-md transition ${
              mode === "login" ? "bg-white shadow text-slate-900 font-medium" : "text-slate-500"
            }`}
            onClick={() => {
              setMode("login");
              resetMessages();
            }}
          >
            Connexion
          </button>
          <button
            className={`flex-1 py-2 text-sm rounded-md transition ${
              mode === "register" ? "bg-white shadow text-slate-900 font-medium" : "text-slate-500"
            }`}
            onClick={() => {
              setMode("register");
              resetMessages();
            }}
          >
            Inscription
          </button>
        </div>

        {error && (
          <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {error}
          </div>
        )}
        {info && (
          <div className="mb-4 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
            {info}
          </div>
        )}

        <form onSubmit={mode === "login" ? handleLogin : handleRegister} className="space-y-4">
          <div>
            <label className="block text-sm text-slate-600 mb-1">Identifiant</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-800"
            />
          </div>

          <div>
            <label className="block text-sm text-slate-600 mb-1">Mot de passe</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-800"
            />
          </div>

          {mode === "register" && (
            <div>
              <label className="block text-sm text-slate-600 mb-1">Confirmer le mot de passe</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={8}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-800"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-lg bg-slate-900 text-white text-sm font-medium hover:bg-slate-800 transition disabled:opacity-60"
          >
            {loading
              ? "Veuillez patienter..."
              : mode === "login"
              ? "Se connecter"
              : "S'inscrire"}
          </button>
        </form>
      </div>
    </div>
  );
}
