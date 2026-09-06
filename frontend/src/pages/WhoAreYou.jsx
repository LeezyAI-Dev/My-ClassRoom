import React from "react";

// --- Icônes ---

function ProfileGlyph() {
  return (
    <svg width="30" height="30" viewBox="0 0 24 24" fill="white">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4.4 3.6-7 8-7s8 2.6 8 7v1H4v-1z" />
    </svg>
  );
}

function StarIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
      <path d="M12 2 14.7 8.6 22 9.3 16.5 14 18.2 21 12 17.3 5.8 21 7.5 14 2 9.3 9.3 8.6 12 2z" />
    </svg>
  );
}

function CapGlyph() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
      <path d="M12 3 1 8l11 5 9-4.1V17h2V8L12 3z" />
      <path d="M5 10.5V15c0 1.7 3.1 4 7 4s7-2.3 7-4v-4.5l-7 3.2-7-3.2z" opacity="0.9" />
    </svg>
  );
}

function CodeGlyph() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path
        d="M9 8 4 12l5 4M15 8l5 4-5 4"
        stroke="white"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
      <path
        d="M5 12h14M13 6l6 6-6 6"
        stroke="white"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function RoleTile({ icon, label, hint, onClick, gradient, iconBg, glow }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-4 rounded-[22px] px-5 py-4 border border-white/10 active:scale-[0.98] transition-transform bg-gradient-to-br ${gradient} ${glow}`}
    >
      <div
        className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-lg"
        style={{ background: iconBg }}
      >
        {icon}
      </div>
      <div className="flex-1 min-w-0 text-left">
        <p
          className="text-white font-extrabold text-[15px] uppercase tracking-wide"
          style={{ fontFamily: "'Baloo 2', sans-serif" }}
        >
          {label}
        </p>
        <p className="text-white/50 text-xs mt-0.5">{hint}</p>
      </div>
      <span className="w-8 h-8 rounded-full bg-black/30 flex items-center justify-center shrink-0">
        <ArrowIcon />
      </span>
    </button>
  );
}

export default function WhoAreYou({ onSelectDeveloper, onSelectStudent }) {
  return (
    <div className="min-h-screen bg-[#060b1c] flex flex-col relative overflow-hidden">
      {/* Halo décoratif en fond */}
      <div className="pointer-events-none absolute -top-32 -right-24 w-72 h-72 rounded-full bg-blue-600/25 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 -left-24 w-72 h-72 rounded-full bg-sky-500/10 blur-3xl" />

      {/* En-tête */}
      <div className="px-6 pt-12 pb-6 relative">
        <p className="text-sky-400 text-xs font-extrabold uppercase tracking-[0.2em] mb-1.5">
          Bienvenue
        </p>
        <h1
          className="text-white text-4xl tracking-wide"
          style={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 800 }}
        >
          My ClassRoom
        </h1>
      </div>

      {/* Contenu */}
      <div className="relative flex-1 flex flex-col items-center px-6 pt-6 pb-12">
        {/* Avatar */}
        <div className="w-28 h-28 rounded-full flex items-center justify-center bg-gradient-to-br from-[#1660e0] to-[#05122c] border border-white/10 shadow-[0_0_36px_-4px_rgba(37,120,255,0.55)] mb-8">
          <ProfileGlyph />
        </div>

        <p className="text-white text-2xl font-semibold mb-8">vous êtes&nbsp;?</p>

        {/* Cases de rôle */}
        <div className="w-full max-w-sm space-y-4">
          <RoleTile
            icon={<StarIcon />}
            label="Délégué(e)"
            hint="Bientôt disponible"
            onClick={() => {}}
            gradient="from-[#6d28d9] to-[#1b0a35]"
            iconBg="linear-gradient(135deg, #c4b5fd, #6d28d9)"
            glow="shadow-[0_0_24px_-6px_rgba(147,51,234,0.4)]"
          />
          <RoleTile
            icon={<CapGlyph />}
            label="Élève"
            hint="Consulter mon espace de cours"
            onClick={onSelectStudent}
            gradient="from-[#0e8f6b] to-[#04211b]"
            iconBg="linear-gradient(135deg, #34d399, #047857)"
            glow="shadow-[0_0_24px_-4px_rgba(16,185,129,0.5)]"
          />
          <RoleTile
            icon={<CodeGlyph />}
            label="Développeur"
            hint="Gérer les contenus de l'établissement"
            onClick={onSelectDeveloper}
            gradient="from-[#1660e0] to-[#05122c]"
            iconBg="linear-gradient(135deg, #4da3ff, #1454d8)"
            glow="shadow-[0_0_24px_-4px_rgba(37,120,255,0.55)]"
          />
        </div>
      </div>
    </div>
  );
}
