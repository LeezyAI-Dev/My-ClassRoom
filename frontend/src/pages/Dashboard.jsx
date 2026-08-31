import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import BannerCarousel from "../components/BannerCarousel";
import BannerManager from "../components/BannerManager";

const ROLE_LABEL = {
  developer: "développeur",
  student: "élève",
};

// --- Icônes du menu (SVG en ligne, pas de dépendance externe) ---

function ProfileIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4.4 3.6-7 8-7s8 2.6 8 7v1H4v-1z" />
    </svg>
  );
}

function SubjectsIcon() {
  return (
    <svg width="76" height="76" viewBox="0 0 100 100" fill="none">
      <path d="M50 6 L90 26 L50 46 L10 26 Z" fill="#1e3a8a" />
      <path d="M50 46 L10 26 V36 L50 56 L90 36 V26 Z" fill="#28407a" />
      <line x1="82" y1="30" x2="82" y2="48" stroke="#1e3a8a" strokeWidth="3" strokeLinecap="round" />
      <rect x="14" y="30" width="72" height="48" rx="8" fill="#dbeafe" stroke="#1e293b" strokeWidth="3.5" />
      <rect x="24" y="48" width="16" height="16" rx="3" fill="#f87171" />
      <rect x="46" y="47" width="32" height="5.5" rx="2.75" fill="#38bdf8" />
      <rect x="46" y="59" width="32" height="5.5" rx="2.75" fill="#38bdf8" />
      <rect x="38" y="78" width="24" height="6" rx="2" fill="#1e293b" />
      <rect x="44" y="72" width="12" height="8" fill="#334155" />
    </svg>
  );
}

function ScheduleIcon() {
  return (
    <svg width="76" height="76" viewBox="0 0 100 100" fill="none">
      <rect x="16" y="14" width="6" height="18" rx="3" fill="#64748b" />
      <rect x="78" y="14" width="6" height="18" rx="3" fill="#64748b" />
      <rect x="12" y="20" width="76" height="70" rx="9" fill="white" stroke="#1c1c1c" strokeWidth="3.5" />
      <path d="M12 29a9 9 0 0 1 9-9h58a9 9 0 0 1 9 9v11H12z" fill="#38bdf8" />
      {[0, 1, 2].map((row) =>
        [0, 1, 2].map((col) => (
          <rect
            key={`${row}-${col}`}
            x={22 + col * 20}
            y={50 + row * 12}
            width="15"
            height="7"
            rx="2"
            fill="#334155"
          />
        ))
      )}
    </svg>
  );
}

function CalculatorIcon() {
  return (
    <svg width="76" height="76" viewBox="0 0 100 100" fill="none">
      <rect x="18" y="6" width="64" height="88" rx="11" fill="#bfdbfe" stroke="#1c1c1c" strokeWidth="3.5" />
      <rect x="26" y="16" width="48" height="20" rx="4" fill="#fbbf24" />
      <text x="64" y="32" fontSize="15" fontWeight="700" fill="#1c1c1c">
        0
      </text>
      {[0, 1, 2].map((row) =>
        [0, 1, 2].map((col) => {
          const isConfirm = col === 2 && row === 2;
          return (
            <rect
              key={`${row}-${col}`}
              x={27 + col * 16}
              y={44 + row * 15}
              width="12.5"
              height="11"
              rx="3"
              fill={isConfirm ? "#ef4444" : "#3b82f6"}
            />
          );
        })
      )}
    </svg>
  );
}

function EyesIcon() {
  return (
    <svg width="76" height="76" viewBox="0 0 100 100" fill="none">
      <rect x="6" y="6" width="88" height="88" rx="22" fill="#1c1c1c" />
      <path
        d="M14 50C14 50 27 27 50 27C73 27 86 50 86 50C86 50 73 73 50 73C27 73 14 50 14 50Z"
        stroke="white"
        strokeWidth="5.5"
        strokeLinejoin="round"
      />
      <circle cx="50" cy="50" r="14" fill="#38bdf8" stroke="white" strokeWidth="4" />
      <circle cx="55" cy="45" r="4" fill="white" />
    </svg>
  );
}

// Carré noir "figurant" — fonctionnalité future, non cliquable.
function FutureSlot() {
  return <div className="w-full aspect-square rounded-[28px] bg-[#1c1c1c]" aria-hidden="true" />;
}

function MenuCard({ icon, label, onClick }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex flex-col items-center gap-3 active:opacity-70 transition"
    >
      {icon}
      <span className="text-black font-extrabold text-lg leading-tight text-center uppercase tracking-wide">
        {label}
      </span>
    </button>
  );
}

export default function Dashboard({ onNavigate, onLogout }) {
  const { user, isDeveloper, isStudent } = useAuth();
  const [profileOpen, setProfileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <header className="bg-[#141414] px-6 pt-9 pb-8">
        <div className="flex items-start justify-between">
          <h1
            className="text-white leading-[0.92] text-[1.9rem]"
            style={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 800 }}
          >
            <span className="block">MY CLASS</span>
            <span className="block">
              R<span className="text-sky-400">OO</span>M
            </span>
          </h1>

          <div className="relative">
            <button
              onClick={() => setProfileOpen((open) => !open)}
              aria-label="Profil"
              className="w-11 h-11 rounded-full border-2 border-white flex items-center justify-center active:opacity-70 transition"
            >
              <ProfileIcon />
            </button>

            {profileOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-slate-200 p-4 z-20">
                <p className="text-sm font-semibold text-slate-800">{user?.username}</p>
                <p className="text-xs text-slate-500 mb-3">
                  Compte {ROLE_LABEL[user?.role] || user?.role}
                </p>
                <button
                  onClick={onLogout}
                  className="w-full text-left text-sm font-medium text-red-600 hover:text-red-700"
                >
                  Se déconnecter
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <BannerCarousel />

      <main className="flex-1 px-6 pt-10 pb-8">
        {isDeveloper && (
          <div className="max-w-md mx-auto mb-8">
            <BannerManager />
          </div>
        )}

        {isStudent && (
          <p className="max-w-md mx-auto text-xs text-slate-400 mb-6 text-center">
            Espace élève : consultation seule. Le contenu se met à jour automatiquement au fur
            et à mesure des modifications du développeur.
          </p>
        )}

        <div className="max-w-md mx-auto grid grid-cols-2 gap-x-8 gap-y-12">
          <MenuCard icon={<SubjectsIcon />} label="Matières" onClick={() => onNavigate("subjects")} />
          <MenuCard
            icon={<ScheduleIcon />}
            label="Emploi du temps"
            onClick={() => onNavigate("schedule")}
          />
          <MenuCard
            icon={<CalculatorIcon />}
            label="Calculateur de moyenne"
            onClick={() => onNavigate("average")}
          />
          <MenuCard icon={<EyesIcon />} label="Eyes" onClick={() => onNavigate("eyes")} />
          <FutureSlot />
          <FutureSlot />
        </div>
      </main>

      {/* Vague de pied de page, cohérente avec l'écran "Vous êtes ?" */}
      <svg viewBox="0 0 1440 100" preserveAspectRatio="none" style={{ height: "70px", width: "100%" }}>
        <path
          d="M0,30 C190,92 390,47 660,65 C960,85 1160,25 1440,90 L1440,100 L0,100 Z"
          fill="#141414"
        />
      </svg>
    </div>
  );
}
