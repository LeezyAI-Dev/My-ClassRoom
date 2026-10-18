import React, { useState } from "react";
import PinPad, { PinDots } from "../components/PinPad";
import { loginStudentWithPin } from "../api";
import { getDevice, clearDevice } from "../deviceStore";

// Écran affiché à chaque ouverture de l'appli quand le téléphone connaît déjà l'élève.
export default function PinLock({ username, onSuccess, onForgot, onSwitchAccount, onDeviceInvalid }) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (value) => {
    setBusy(true);
    setError("");
    try {
      const device = getDevice();
      const data = await loginStudentWithPin(device ? device.token : "", value);
      onSuccess(data);
    } catch (err) {
      if (err.code === "DEVICE_INVALID") {
        clearDevice();
        onDeviceInvalid();
        return;
      }
      if (!err.status) {
        setError("Connexion impossible. Vérifie ta connexion internet et réessaie.");
      } else {
        setError(err.message);
      }
      setPin("");
      setBusy(false);
    }
  };

  const handleDigit = (d) => {
    if (busy || pin.length >= 4) return;
    const next = pin + d;
    setPin(next);
    if (next.length === 4) submit(next);
  };

  const handleDelete = () => {
    if (busy) return;
    setPin((p) => p.slice(0, -1));
  };

  return (
    <div className="min-h-screen bg-[#060b1c] flex flex-col items-center px-6 pt-16 pb-8 relative overflow-hidden">
      <div className="pointer-events-none absolute -top-32 -right-24 w-72 h-72 rounded-full bg-blue-600/25 blur-3xl" />

      <p className="text-sky-400 text-xs font-extrabold uppercase tracking-[0.2em] mb-1.5 relative">
        My ClassRoom
      </p>
      <h1
        className="text-white text-2xl uppercase text-center relative"
        style={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 800 }}
      >
        Bonjour, {username}
      </h1>
      <p className="text-white/50 text-sm mt-2 mb-8 relative">Entre ton code PIN</p>

      <div className="relative mb-4">
        <PinDots count={pin.length} />
      </div>

      <p className="relative min-h-[2.5rem] text-center text-sm text-red-400 max-w-xs mb-4">
        {busy ? (
          <span className="text-white/50">Vérification… (le serveur peut mettre jusqu'à 1 minute à se réveiller)</span>
        ) : (
          error
        )}
      </p>

      <div className="relative w-full">
        <PinPad onDigit={handleDigit} onDelete={handleDelete} disabled={busy} />
      </div>

      <div className="relative mt-auto pt-8 flex flex-col items-center gap-3">
        <button
          type="button"
          onClick={onForgot}
          disabled={busy}
          className="text-sky-400 text-sm font-bold active:opacity-70 transition disabled:opacity-40"
        >
          Code PIN oublié ?
        </button>
        <button
          type="button"
          onClick={onSwitchAccount}
          disabled={busy}
          className="text-white/40 text-xs active:opacity-70 transition disabled:opacity-40"
        >
          Pas toi ? Changer de compte
        </button>
      </div>
    </div>
  );
}
