import React, { useState } from "react";
import { pinStorage } from "../utils/pinStorage";
import { loginStudent, loginDeveloper } from "../api";

export default function PinLock({ onUnlock, onLogout }) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [showForgot, setShowForgot] = useState(false);
  const [password, setPassword] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const username = pinStorage.getUsername();
  const role = pinStorage.getRole();

  const handleDigit = (d) => {
    if (pin.length < 4) {
      const newPin = pin + d;
      setPin(newPin);
      setError("");
      if (newPin.length === 4) {
        setTimeout(() => tryUnlock(newPin), 100);
      }
    }
  };

  const tryUnlock = (codeToTest) => {
    const ok = onUnlock(codeToTest);
    if (!ok) {
      setError("Code incorrect");
      setPin("");
    }
  };

  const handleDelete = () => setPin(p => p.slice(0, -1));

  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    if (!password) return;
    setForgotLoading(true);
    setError("");
    try {
      // On reverifie le mot de passe avec l'API
      if (role === "student") {
        await loginStudent({ username, password });
      } else {
        await loginDeveloper({ username, password });
      }
      // Si ok, on efface le PIN et on laisse le AuthContext gérer le setup
      pinStorage.clearPin();
      window.location.reload();
    } catch (err) {
      setError(err.message || "Mot de passe incorrect");
    } finally {
      setForgotLoading(false);
    }
  };

  if (showForgot) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex flex-col items-center justify-center px-6 text-white">
        <div className="w-full max-w-sm">
          <h1 className="text-xl font-bold text-center mb-2">Code PIN oublié ?</h1>
          <p className="text-white/60 text-center text-sm mb-6">Entre ton mot de passe pour réinitialiser ton PIN</p>
          <p className="text-white/40 text-center text-xs mb-4">Compte: {username}</p>
          <form onSubmit={handleForgotSubmit} className="space-y-4">
            <input type="password" placeholder="Ton mot de passe" value={password} onChange={e => setPassword(e.target.value)} className="w-full px-4 py-4 rounded-xl bg-white/10 border border-white/10 text-white outline-none focus:border-white/30" />
            {error && <p className="text-red-400 text-sm text-center">{error}</p>}
            <button disabled={forgotLoading} className="w-full py-4 rounded-full bg-white text-black font-bold disabled:opacity-50">
              {forgotLoading ? "Vérification..." : "Réinitialiser le PIN"}
            </button>
            <button type="button" onClick={() => setShowForgot(false)} className="w-full py-3 text-white/60 text-sm">Retour</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex flex-col items-center justify-center px-6 text-white">
      <div className="w-full max-w-sm">
        <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-6 text-2xl">🔒</div>
        <h1 className="text-2xl font-bold text-center mb-1">Bon retour !</h1>
        <p className="text-white/60 text-center text-sm mb-8">{username}</p>

        <div className="flex justify-center gap-4 mb-4">
          {[0,1,2,3].map(i => (
            <div key={i} className={`w-14 h-14 rounded-xl border-2 flex items-center justify-center text-xl font-bold transition-all ${pin[i] ? 'bg-white text-black border-white' : 'border-white/20'}`}>
              {pin[i] ? "•" : ""}
            </div>
          ))}
        </div>

        {error && <p className="text-red-400 text-center text-sm mb-4 animate-pulse">{error}</p>}

        <div className="grid grid-cols-3 gap-4 mb-6 mt-6">
          {[1,2,3,4,5,6,7,8,9].map(n => (
            <button key={n} onClick={() => handleDigit(String(n))} className="h-16 rounded-full bg-white/10 hover:bg-white/20 text-xl font-semibold active:scale-95 transition">{n}</button>
          ))}
          <div />
          <button onClick={() => handleDigit("0")} className="h-16 rounded-full bg-white/10 hover:bg-white/20 text-xl font-semibold">0</button>
          <button onClick={handleDelete} className="h-16 rounded-full bg-white/5 text-white/70">⌫</button>
        </div>

        <button onClick={() => setShowForgot(true)} className="w-full text-white/50 text-sm underline">Code PIN oublié ?</button>
        <button onClick={onLogout} className="w-full mt-4 text-white/30 text-xs">Se déconnecter avec mot de passe</button>
      </div>
    </div>
  );
}
