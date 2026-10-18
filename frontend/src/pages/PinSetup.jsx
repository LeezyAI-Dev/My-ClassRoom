import React, { useState } from "react";
import PinPad, { PinDots } from "../components/PinPad";
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
    <div className="min-h-screen bg-[#060b1c] flex flex-col items-center px-6 pt-16 pb-8 relative overflow-hidden">
      <div className="pointer-events-none absolute -top-32 -right-24 w-72 h-72 rounded-full bg-blue-600/25 blur-3xl" />

      <p className="text-sky-400 text-xs font-extrabold uppercase tracking-[0.2em] mb-1.5 relative">
        Sécurité
      </p>
      <h1
        className="text-white text-2xl uppercase text-center relative"
        style={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 800 }}
      >
        {first === null ? "Crée ton code PIN" : "Confirme ton code PIN"}
      </h1>
      <p className="text-white/50 text-sm mt-2 mb-8 text-center max-w-xs relative">
        {first === null
          ? "4 chiffres. Il te sera demandé à chaque ouverture de l'application."
          : "Saisis une deuxième fois le même code."}
      </p>

      <div className="relative mb-4">
        <PinDots count={pin.length} />
      </div>

      <p className="relative min-h-[2.5rem] text-center text-sm text-red-400 max-w-xs mb-4">
        {busy ? <span className="text-white/50">Enregistrement…</span> : error}
      </p>

      <div className="relative w-full">
        <PinPad onDigit={handleDigit} onDelete={handleDelete} disabled={busy} />
      </div>

      <div className="relative mt-auto pt-8">
        <button
          type="button"
          onClick={onCancel}
          disabled={busy}
          className="text-white/40 text-xs active:opacity-70 transition disabled:opacity-40"
        >
          Annuler et se déconnecter
        </button>
      </div>
    </div>
  );
}
