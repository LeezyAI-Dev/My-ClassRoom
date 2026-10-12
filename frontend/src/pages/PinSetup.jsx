import React, { useState } from "react";

export default function PinSetup({ onComplete, onCancel }) {
  const [pin, setPin] = useState("");
  const [confirm, setConfirm] = useState("");
  const [step, setStep] = useState(1);
  const [error, setError] = useState("");

  const handleDigit = (d, isConfirm) => {
    if (isConfirm) {
      if (confirm.length < 4) setConfirm(c => c + d);
    } else {
      if (pin.length < 4) setPin(p => p + d);
    }
  };

  const handleDelete = (isConfirm) => {
    if (isConfirm) setConfirm(c => c.slice(0, -1));
    else setPin(p => p.slice(0, -1));
  };

  const handleContinue = () => {
    if (pin.length !== 4) {
      setError("Le code doit avoir 4 chiffres");
      return;
    }
    setError("");
    setStep(2);
  };

  const handleValidate = () => {
    if (confirm !== pin) {
      setError("Les codes ne correspondent pas");
      setConfirm("");
      return;
    }
    onComplete(pin);
  };

  const currentValue = step === 1 ? pin : confirm;
  const isConfirmStep = step === 2;

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex flex-col items-center justify-center px-6 text-white">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-bold text-center mb-2">
          {step === 1 ? "Crée ton code PIN" : "Confirme ton code"}
        </h1>
        <p className="text-white/60 text-center text-sm mb-8">
          {step === 1 ? "4 chiffres pour te connecter plus vite" : "Retape le même code"}
        </p>

        <div className="flex justify-center gap-4 mb-8">
          {[0,1,2,3].map(i => (
            <div key={i} className={`w-14 h-14 rounded-xl border-2 flex items-center justify-center text-xl font-bold transition-all ${currentValue[i] ? 'bg-white text-black border-white' : 'border-white/20'}`}>
              {currentValue[i] ? "•" : ""}
            </div>
          ))}
        </div>

        {error && <p className="text-red-400 text-center text-sm mb-4">{error}</p>}

        <div className="grid grid-cols-3 gap-4 mb-6">
          {[1,2,3,4,5,6,7,8,9].map(n => (
            <button key={n} onClick={() => handleDigit(String(n), isConfirmStep)} className="h-16 rounded-full bg-white/10 hover:bg-white/20 text-xl font-semibold active:scale-95 transition">
              {n}
            </button>
          ))}
          <button onClick={() => handleDelete(isConfirmStep)} className="h-16 rounded-full bg-white/5 text-white/70">⌫</button>
          <button onClick={() => handleDigit("0", isConfirmStep)} className="h-16 rounded-full bg-white/10 hover:bg-white/20 text-xl font-semibold">0</button>
          <div />
        </div>

        {step === 1 ? (
          <button disabled={pin.length !== 4} onClick={handleContinue} className="w-full py-4 rounded-full bg-white text-black font-bold disabled:opacity-30">Continuer</button>
        ) : (
          <div className="flex gap-3">
            <button onClick={() => { setStep(1); setConfirm(""); }} className="flex-1 py-4 rounded-full bg-white/10 font-bold">Retour</button>
            <button disabled={confirm.length !== 4} onClick={handleValidate} className="flex-1 py-4 rounded-full bg-white text-black font-bold disabled:opacity-30">Valider</button>
          </div>
        )}

        {onCancel && <button onClick={onCancel} className="w-full mt-4 text-white/50 text-sm">Passer pour l'instant</button>}
      </div>
    </div>
  );
}
