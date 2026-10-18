import React from "react";

// Les 4 points qui se remplissent au fur et à mesure de la saisie.
export function PinDots({ count, total = 4 }) {
  return (
    <div className="flex items-center justify-center gap-4">
      {Array.from({ length: total }).map((_, i) => (
        <span
          key={i}
          className={`w-4 h-4 rounded-full border-2 transition-all ${
            i < count
              ? "bg-sky-400 border-sky-400 shadow-[0_0_12px_rgba(56,189,248,0.7)]"
              : "border-white/30"
          }`}
        />
      ))}
    </div>
  );
}

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "del"];

// Clavier numérique à l'écran (évite d'ouvrir le clavier du téléphone).
export default function PinPad({ onDigit, onDelete, disabled }) {
  return (
    <div className="grid grid-cols-3 gap-4 max-w-[17rem] mx-auto">
      {KEYS.map((k, i) => {
        if (k === "") return <span key={i} />;
        if (k === "del") {
          return (
            <button
              key={i}
              type="button"
              onClick={onDelete}
              disabled={disabled}
              aria-label="Effacer"
              className="h-16 rounded-full text-white/70 text-2xl active:bg-white/10 transition disabled:opacity-40"
            >
              ⌫
            </button>
          );
        }
        return (
          <button
            key={i}
            type="button"
            onClick={() => onDigit(k)}
            disabled={disabled}
            className="h-16 rounded-full bg-white/[0.06] border border-white/10 text-white text-2xl font-bold active:bg-white/20 transition disabled:opacity-40"
          >
            {k}
          </button>
        );
      })}
    </div>
  );
}
