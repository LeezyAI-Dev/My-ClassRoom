import React from "react";

// Les 4 points qui se remplissent au fur et à mesure de la saisie.
export function PinDots({ count, total = 4 }) {
  return (
    <div
      role="img"
      aria-label={`${count} chiffre${count > 1 ? "s" : ""} saisi${count > 1 ? "s" : ""} sur ${total}`}
      className="flex items-center justify-center gap-4"
    >
      {Array.from({ length: total }).map((_, i) => (
        <span
          key={i}
          className={`h-4 w-4 rounded-full border-2 transition-all motion-reduce:transition-none ${
            i < count ? "border-violet-300 bg-violet-300 shadow-glow-sm" : "border-white/40"
          }`}
        />
      ))}
    </div>
  );
}

function BackspaceIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M9 5h10a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H9l-6-7 6-7z" />
      <path d="m12.5 10 4 4m0-4-4 4" />
    </svg>
  );
}

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "del"];

// Clavier numérique à l'écran (évite d'ouvrir le clavier du téléphone).
export default function PinPad({ onDigit, onDelete, disabled }) {
  return (
    <div className="mx-auto grid max-w-[18rem] grid-cols-3 gap-4">
      {KEYS.map((k, i) => {
        if (k === "") return <span key={i} />;
        if (k === "del") {
          return (
            <button
              key={i}
              type="button"
              onClick={onDelete}
              disabled={disabled}
              aria-label="Effacer le dernier chiffre"
              className="flex h-16 items-center justify-center rounded-full text-white/80 transition active:bg-white/10 disabled:opacity-40 motion-reduce:transition-none"
            >
              <BackspaceIcon />
            </button>
          );
        }
        return (
          <button
            key={i}
            type="button"
            onClick={() => onDigit(k)}
            disabled={disabled}
            className="h-16 rounded-full border border-white/10 bg-white/[0.07] text-2xl font-bold text-white transition active:bg-violet-400/30 disabled:opacity-40 motion-reduce:transition-none"
          >
            {k}
          </button>
        );
      })}
    </div>
  );
}
