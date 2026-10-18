import React from "react";
import IconTile from "./IconTile";
import { ChevronLeftIcon } from "./Icons";

// En-tête des pages intérieures : tuile d'icône + titre + sous-titre.
// `onBack` est facultatif : il sert uniquement aux écrans imbriqués (ex. une matière du registre
// de notes). Le retour vers l'accueil est assuré par la barre du bas (BottomNav).
export default function PageHeader({ title, subtitle, icon, tone = "violet", onBack, right }) {
  return (
    <header className="pt-safe flex items-center gap-3 px-5 pb-5">
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          aria-label="Retour"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/[0.08] text-white transition active:bg-white/20 motion-reduce:transition-none"
        >
          <ChevronLeftIcon size={22} />
        </button>
      )}
      {icon && !onBack && (
        <IconTile tone={tone} glow>
          {icon}
        </IconTile>
      )}
      <div className="min-w-0 flex-1">
        <h1 className="truncate text-2xl font-extrabold leading-tight text-white">{title}</h1>
        {subtitle && <p className="truncate text-sm text-lavender">{subtitle}</p>}
      </div>
      {right}
    </header>
  );
}
