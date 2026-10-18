import React from "react";
import { APP_NAME, CLASS_NAME } from "../config";
import AuroraBackground from "../components/ui/AuroraBackground";
import IconTile from "../components/ui/IconTile";
import { CapIcon, ChevronRightIcon } from "../components/ui/Icons";

function StarGlyph() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 3l2.6 5.6 6.1.7-4.5 4.2 1.2 6L12 16.5 6.6 19.5l1.2-6L3.3 9.3l6.1-.7L12 3z" />
    </svg>
  );
}

function CodeGlyph() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M9 7 4 12l5 5M15 7l5 5-5 5" />
    </svg>
  );
}

function RoleCard({ icon, tone, label, hint, onClick, disabled = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`card-press flex min-h-[76px] w-full items-center gap-4 p-4 text-left ${
        disabled ? "pointer-events-none opacity-60" : ""
      }`}
    >
      <IconTile tone={tone}>{icon}</IconTile>
      <span className="min-w-0 flex-1">
        <span className="block text-base font-bold text-white">{label}</span>
        <span className="mt-0.5 block text-[13px] text-white/65">{hint}</span>
      </span>
      {!disabled && <ChevronRightIcon size={18} className="shrink-0 text-white/50" />}
    </button>
  );
}

export default function WhoAreYou({ onSelectDeveloper, onSelectStudent }) {
  return (
    <div className="relative isolate flex min-h-screen flex-col bg-ink">
      <AuroraBackground />

      <header className="pt-safe flex items-center gap-3 px-5">
        <IconTile tone="violet" size="sm" glow>
          <CapIcon size={22} />
        </IconTile>
        <p className="text-lg font-extrabold text-white">{APP_NAME}</p>
      </header>

      <main className="pb-safe mx-auto flex w-full max-w-sm flex-1 flex-col px-5">
        <section className="px-2 pb-8 pt-12 text-center">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-lavender">Bienvenue</p>
          <h1 className="bg-title-gradient bg-clip-text text-[2.75rem] font-extrabold leading-none tracking-tight text-transparent">
            {CLASS_NAME}
          </h1>
          <p className="mt-4 text-lg font-semibold text-white">Vous êtes&nbsp;?</p>
        </section>

        <div className="space-y-3">
          <RoleCard
            tone="orchid"
            icon={<StarGlyph />}
            label="Délégué(e)"
            hint="Bientôt disponible"
            disabled
          />
          <RoleCard
            tone="green"
            icon={<CapIcon size={22} />}
            label="Élève"
            hint="Consulter mon espace de cours"
            onClick={onSelectStudent}
          />
          <RoleCard
            tone="blue"
            icon={<CodeGlyph />}
            label="Développeur"
            hint="Gérer les contenus de l'établissement"
            onClick={onSelectDeveloper}
          />
        </div>
      </main>
    </div>
  );
}
