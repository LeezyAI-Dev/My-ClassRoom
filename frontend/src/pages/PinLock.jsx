import React, { useState } from "react";
import PinPad, { PinDots } from "../components/PinPad";
import AuroraBackground from "../components/ui/AuroraBackground";
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
    <div className="relative isolate flex min-h-screen flex-col items-center bg-ink px-6 pt-safe pb-safe">
      <AuroraBackground />
      <div className="h-10" />

      <p className="text-lavender text-xs font-bold uppercase tracking-[0.2em] mb-2 relative">
        My ClassRoom
      </p>
      <h1
        className="text-white text-2xl font-extrabold text-center relative"
      >
        Bonjour, {username}
      </h1>
      <p className="text-white/70 text-sm mt-2 mb-8 relative">Entre ton code PIN</p>

      <div className="relative mb-4">
        <PinDots count={pin.length} />
      </div>

      <p role="alert" aria-live="polite" className="relative min-h-[2.5rem] text-center text-sm text-red-300 max-w-xs mb-4">
        {busy ? (
          <span className="text-white/70">Vérification… (le serveur peut mettre jusqu'à 1 minute à se réveiller)</span>
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
          className="min-h-[44px] px-3 text-violet-300 text-sm font-bold active:opacity-70 transition disabled:opacity-40"
        >
          Code PIN oublié ?
        </button>
        <button
          type="button"
          onClick={onSwitchAccount}
          disabled={busy}
          className="min-h-[44px] px-3 text-white/65 text-sm active:opacity-70 transition disabled:opacity-40"
        >
          Pas toi ? Changer de compte
        </button>
      </div>
    </div>
  );
}
