import React, { useState } from "react";
import PinPad, { PinDots } from "../components/PinPad";
import AuroraBackground from "../components/ui/AuroraBackground";
import { setStudentPin } from "../api";
import { useAuth } from "../context/AuthContext";
import { saveDevice } from "../deviceStore";

// Création du code PIN, juste après une connexion par mot de passe (1re connexion,
// nouveau téléphone, ou "Code PIN oublié ?"). Deux étapes : saisie, puis confirmation.
export default function PinSetup({ onDone, onCancel }) {
  const { token, user } = useAuth();
  const [first, setFirst] = useState(null); // null = étape 1, sinon le PIN à confirmer
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const save = async (value) => {
    setBusy(true);
    setError("");
    try {
      const data = await setStudentPin(token, value);
      saveDevice(data.deviceToken, user.username);
      onDone();
    } catch (err) {
      setError(!err.status ? "Connexion impossible. Vérifie ta connexion internet et réessaie." : err.message);
      setFirst(null);
      setPin("");
      setBusy(false);
    }
  };

  const handleDigit = (d) => {
    if (busy || pin.length >= 4) return;
    const next = pin + d;
    setPin(next);
    if (next.length < 4) return;

    if (first === null) {
      // fin de l'étape 1 : on passe à la confirmation
      setTimeout(() => {
        setFirst(next);
        setPin("");
        setError("");
      }, 150);
    } else if (next !== first) {
      setError("Les deux codes ne correspondent pas. Recommence.");
      setTimeout(() => {
        setFirst(null);
        setPin("");
      }, 300);
    } else {
      save(next);
    }
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
        Sécurité
      </p>
      <h1
        className="text-white text-2xl font-extrabold text-center relative"
      >
        {first === null ? "Crée ton code PIN" : "Confirme ton code PIN"}
      </h1>
      <p className="text-white/70 text-sm mt-2 mb-8 text-center max-w-xs relative">
        {first === null
          ? "4 chiffres. Il te sera demandé à chaque ouverture de l'application."
          : "Saisis une deuxième fois le même code."}
      </p>

      <div className="relative mb-4">
        <PinDots count={pin.length} />
      </div>

      <p role="alert" aria-live="polite" className="relative min-h-[2.5rem] text-center text-sm text-red-300 max-w-xs mb-4">
        {busy ? <span className="text-white/70">Enregistrement…</span> : error}
      </p>

      <div className="relative w-full">
        <PinPad onDigit={handleDigit} onDelete={handleDelete} disabled={busy} />
      </div>

      <div className="relative mt-auto pt-8">
        <button
          type="button"
          onClick={onCancel}
          disabled={busy}
          className="min-h-[44px] px-3 text-white/65 text-sm active:opacity-70 transition disabled:opacity-40"
        >
          Annuler et se déconnecter
        </button>
      </div>
    </div>
  );
}
