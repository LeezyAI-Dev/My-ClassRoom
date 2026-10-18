import React from "react";
import { ChevronLeftIcon, HomeIcon, LogoutIcon } from "./icons";

// Barre du bas du nouveau design : retour | Accueil | déconnexion.
// - onBack absent -> le bouton retour est grisé et désactivé (ex. déjà sur l'Accueil).
// - onHome / onLogout absents -> le bouton correspondant n'est pas affiché.
// Les boutons font 48 px (zone d'appui confortable) et la barre respecte la zone sûre du bas d'écran.
const ROUND =
  "mc-focus shrink-0 w-12 h-12 rounded-full bg-white/[0.08] text-white flex items-center justify-center transition-colors duration-150 active:bg-white/20 disabled:opacity-35 disabled:pointer-events-none";

export default function BottomNav({ onBack, onHome, onLogout, homeActive = false }) {
  return (
    <nav
      aria-label="Navigation principale"
      className="shrink-0 px-5 pt-2 pb-[max(1rem,env(safe-area-inset-bottom))]"
    >
      <div className="mx-auto max-w-md rounded-[32px] border border-white/10 bg-night-card/95 p-2.5 flex items-center justify-between gap-2">
        <button type="button" onClick={onBack} disabled={!onBack} aria-label="Retour" className={ROUND}>
          <ChevronLeftIcon size={22} />
        </button>

        {onHome && (
          <button
            type="button"
            onClick={onHome}
            aria-label="Accueil"
            aria-current={homeActive ? "page" : undefined}
            className="mc-focus h-12 px-6 rounded-full text-white font-bold text-[16px] flex items-center justify-center gap-2.5 bg-gradient-to-r from-brand-violet to-brand-fuchsia shadow-[0_8px_24px_-8px_rgba(217,70,239,0.8)] transition-[filter] duration-150 active:brightness-110"
          >
            <HomeIcon size={22} />
            <span>Accueil</span>
          </button>
        )}

        {onLogout ? (
          <button type="button" onClick={onLogout} aria-label="Se déconnecter" className={ROUND}>
            <LogoutIcon size={22} />
          </button>
        ) : (
          <span className="w-12 h-12 shrink-0" aria-hidden="true" />
        )}
      </div>
    </nav>
  );
}
