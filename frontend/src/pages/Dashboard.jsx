import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { fetchSchedule, fetchSubjects, fetchStudents } from "../api";
import BannerCarousel from "../components/BannerCarousel";
import BannerManager from "../components/BannerManager";
import AuroraBackground from "../components/ui/AuroraBackground";
import BottomNav from "../components/ui/BottomNav";
import GradientButton from "../components/ui/GradientButton";
import { TILE, BAR } from "../components/ui/theme";
import {
  CapIcon,
  BookIcon,
  DocIcon,
  CalcIcon,
  EyeIcon,
  ChecklistIcon,
  ProfileIcon,
} from "../components/ui/icons";

// Nom de la classe affiché en grand sur l'Accueil.
const CLASS_NAME = "2BT/A";

const ROLE_LABEL = { developer: "Développeur", student: "Élève" };

// "value" = Date.prototype.getDay() (1 = lundi ... 6 = samedi).
const WEEK = [
  { value: 1, short: "Lun", long: "lundi" },
  { value: 2, short: "Mar", long: "mardi" },
  { value: 3, short: "Mer", long: "mercredi" },
  { value: 4, short: "Jeu", long: "jeudi" },
  { value: 5, short: "Ven", long: "vendredi" },
  { value: 6, short: "Sam", long: "samedi" },
];
const BAR_TONES = [BAR.violet, BAR.fuchsia, BAR.violet, BAR.blue, BAR.violet, BAR.fuchsia];

const fmtHour = (hhmm) => String(hhmm).replace(":", "H"); // "07:30" -> "07H30"

// Chiffres de l'Accueil, lus dans l'API (jamais de valeur inventée : null tant qu'on ne sait pas).
function useHomeStats(token, isDeveloper) {
  const [slots, setSlots] = useState(null);
  const [subjectCount, setSubjectCount] = useState(null);
  const [studentCount, setStudentCount] = useState(null);

  useEffect(() => {
    let cancelled = false;

    fetchSchedule()
      .then((data) => !cancelled && setSlots(data.slots || []))
      .catch(() => !cancelled && setSlots([]));

    fetchSubjects()
      .then((data) => {
        if (cancelled) return;
        setSubjectCount((data.generale?.length || 0) + (data.technique?.length || 0));
      })
      .catch(() => {});

    if (isDeveloper && token) {
      fetchStudents(token)
        .then((data) => {
          if (cancelled) return;
          setStudentCount(data.total ?? data.students?.length ?? 0);
        })
        .catch(() => {});
    }

    return () => {
      cancelled = true;
    };
  }, [token, isDeveloper]);

  return { slots, subjectCount, studentCount };
}

// Résumé de l'emploi du temps : nombre de cours par jour, plage d'horaires, plage de jours.
function summarizeSchedule(slots) {
  const perDay = WEEK.map((d) => (slots || []).filter((s) => Number(s.day_of_week) === d.value).length);
  const max = Math.max(0, ...perDay);
  const hasSlots = max > 0;

  let hours = "";
  let days = "";
  if (hasSlots) {
    const starts = slots.map((s) => s.start_time).filter(Boolean).sort();
    const ends = slots.map((s) => s.end_time).filter(Boolean).sort();
    if (starts.length && ends.length) hours = `${fmtHour(starts[0])} – ${fmtHour(ends[ends.length - 1])}`;
    const used = WEEK.filter((_, i) => perDay[i] > 0);
    days = `${used[0].short} à ${used[used.length - 1].short}`;
  }
  return { perDay, max, hasSlots, hours, days };
}

// --- Carte de l'emploi du temps (barres = nombre de cours par jour) ---

function ScheduleCard({ slots, onOpen }) {
  const { perDay, max, hasSlots, hours, days } = useMemo(() => summarizeSchedule(slots), [slots]);
  const today = new Date().getDay();

  const meta = hasSlots ? [hours, days].filter(Boolean).join(" · ") : slots === null ? "" : "Aucun cours pour l'instant";
  const label =
    "Emploi du temps" +
    (meta ? `, ${meta}` : "") +
    (hasSlots
      ? ". " + WEEK.map((d, i) => `${d.long} : ${perDay[i]} cours`).join(", ")
      : "");

  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={label}
      className="mc-card mc-focus relative w-full px-4 pt-4 pb-3 text-left transition-colors duration-150 active:bg-white/[0.06]"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
        <span className="text-[16px] font-bold text-white">Emploi du temps</span>
        {meta && <span className="text-[12px] font-medium text-white/65">{meta}</span>}
      </div>

      <div aria-hidden="true" className="mt-4 flex items-end gap-2 h-[68px]">
        {WEEK.map((d, i) => {
          const pct = perDay[i] === 0 ? 16 : 38 + (62 * perDay[i]) / (max || 1);
          return (
            <div key={d.value} className="flex-1 h-full flex items-end">
              <div
                className={`w-full rounded-lg transition-[height] duration-500 motion-reduce:transition-none ${
                  today === d.value ? "ring-2 ring-white/60" : ""
                } ${perDay[i] === 0 ? "opacity-40" : ""}`}
                style={{ height: `${pct}%`, background: BAR_TONES[i] }}
              />
            </div>
          );
        })}
      </div>

      <div aria-hidden="true" className="mt-2 flex gap-2">
        {WEEK.map((d) => (
          <span
            key={d.value}
            className={`flex-1 text-center text-[12px] ${
              today === d.value ? "font-bold text-white" : "font-medium text-white/65"
            }`}
          >
            {d.short}
          </span>
        ))}
      </div>
    </button>
  );
}

// --- Carte de menu : pastille d'icône colorée + titre + sous-titre ---

function MenuCard({ icon, tone, title, subtitle, onClick, featured = false, badge, className = "" }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`mc-card mc-focus min-h-[72px] px-3 py-3 flex items-center gap-2.5 text-left transition-colors duration-150 active:bg-white/[0.07] ${
        featured ? "border-brand-violet/45 bg-gradient-to-br from-brand-violet/[0.16] to-night-card/90" : ""
      } ${className}`}
    >
      <span
        className="w-9 h-9 shrink-0 rounded-xl flex items-center justify-center text-white shadow-lg"
        style={{ background: TILE[tone] }}
      >
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[15px] font-bold leading-tight text-white">{title}</span>
        {subtitle && <span className="block mt-0.5 text-[13px] leading-snug text-white/65">{subtitle}</span>}
      </span>
      {badge && (
        <span className="shrink-0 rounded-full border border-white/20 bg-white/[0.06] px-2.5 py-1 text-[11px] font-medium text-white/85">
          {badge}
        </span>
      )}
    </button>
  );
}

export default function Dashboard({ onNavigate, onLogout }) {
  const { token, user, isDeveloper } = useAuth();
  const { slots, subjectCount, studentCount } = useHomeStats(token, isDeveloper);
  const [profileOpen, setProfileOpen] = useState(false);
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);

  // Échap ferme le menu profil et la fenêtre de déconnexion.
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") {
        setProfileOpen(false);
        setLogoutConfirmOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const roleLabel = ROLE_LABEL[user?.role] || user?.role;

  return (
    <div className="relative isolate h-[100dvh] bg-night flex flex-col">
      <AuroraBackground />

      <main className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden overscroll-contain px-5 pt-[max(1.25rem,env(safe-area-inset-top))] pb-6">
        <div className="mx-auto max-w-md">
          {/* En-tête : logo + nom, rôle, profil */}
          <header className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 flex-1 items-center gap-2.5">
              <span
                className="w-9 h-9 shrink-0 rounded-xl flex items-center justify-center text-white shadow-[0_6px_20px_-6px_rgba(168,85,247,0.9)]"
                style={{ background: TILE.violet }}
              >
                <CapIcon size={20} />
              </span>
              <span className="min-w-0 truncate text-[16px] font-bold tracking-tight text-white">My ClassRoom</span>
            </div>

            <div className="relative flex shrink-0 items-center gap-2">
              {roleLabel && (
                <span className="rounded-full border border-white/20 bg-white/[0.06] px-3 py-1.5 text-[12px] font-medium text-white/90">
                  {roleLabel}
                </span>
              )}
              <button
                type="button"
                onClick={() => setProfileOpen((open) => !open)}
                aria-label="Profil"
                aria-expanded={profileOpen}
                className="mc-focus w-11 h-11 rounded-full border border-white/15 bg-white/[0.06] text-white flex items-center justify-center transition-colors duration-150 active:bg-white/15"
              >
                <ProfileIcon size={22} />
              </button>

              {profileOpen && (
                <>
                  {/* Zone invisible : un appui en dehors du menu le ferme */}
                  <button
                    type="button"
                    aria-label="Fermer le menu"
                    tabIndex={-1}
                    className="fixed inset-0 z-10 cursor-default"
                    onClick={() => setProfileOpen(false)}
                  />
                  <div className="absolute right-0 top-full z-20 mt-2 w-56 rounded-2xl border border-white/10 bg-night-raised p-4 shadow-2xl">
                    <p className="truncate text-sm font-bold text-white">{user?.username}</p>
                    <p className="mb-3 text-xs text-white/65">Compte {roleLabel?.toLowerCase()}</p>
                    <button
                      type="button"
                      onClick={onLogout}
                      className="mc-focus w-full rounded-lg py-2 text-left text-sm font-semibold text-red-300 active:text-red-200"
                    >
                      Se déconnecter
                    </button>
                  </div>
                </>
              )}
            </div>
          </header>

          {/* Titre */}
          <div className="mt-6 text-center">
            <h1 className="bg-gradient-to-b from-white to-brand-lavender bg-clip-text text-[42px] font-extrabold leading-none tracking-tight text-transparent">
              {CLASS_NAME}
            </h1>
            <p className="mx-auto mt-3 max-w-[18rem] text-[16px] leading-snug text-brand-lavender/90">
              Cours, emploi du temps, notes et publications de la classe.
            </p>
          </div>

          <div className="mt-5 space-y-3">
            {/* Bannière : images du développeur en boucle (disparaît s'il n'y en a aucune) */}
            <BannerCarousel />

            <div className="relative">
              <ScheduleCard slots={slots} onOpen={() => onNavigate("schedule")} />
              {/* Arc lumineux de la maquette : dépasse de la carte sur les côtés, sans bloquer les appuis */}
              <span
                aria-hidden="true"
                className="pointer-events-none absolute left-1/2 bottom-[calc(100%-62px)] aspect-square w-[157%] -translate-x-1/2 rounded-full border border-brand-lavender/25"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <MenuCard
                icon={<BookIcon size={20} />}
                tone="violet"
                title="Matières"
                subtitle={subjectCount !== null ? `${subjectCount} matières` : "Cours et ressources"}
                onClick={() => onNavigate("subjects")}
              />
              <MenuCard
                icon={<DocIcon size={20} />}
                tone="rose"
                title="Registre de notes"
                subtitle="Privé"
                featured
                onClick={() => onNavigate("grades")}
              />
              <MenuCard
                icon={<CalcIcon size={20} />}
                tone="blue"
                title="Moyenne"
                subtitle="Calculateur"
                onClick={() => onNavigate("average")}
              />
              <MenuCard
                icon={<EyeIcon size={20} />}
                tone="orange"
                title="Eyes"
                subtitle="Fil de la classe"
                onClick={() => onNavigate("eyes")}
              />
            </div>

            {/* Checklist : visible uniquement dans le compte développeur */}
            {isDeveloper && (
              <MenuCard
                icon={<ChecklistIcon size={20} />}
                tone="green"
                title="Checklist"
                subtitle={studentCount !== null ? `Liste des élèves · ${studentCount} inscrits` : "Liste des élèves"}
                badge="Développeur"
                onClick={() => onNavigate("checklist")}
                className="w-full"
              />
            )}

            {isDeveloper && <BannerManager />}
          </div>
        </div>
      </main>

      <BottomNav homeActive onHome={() => onNavigate("dashboard")} onLogout={() => setLogoutConfirmOpen(true)} />

      {/* Confirmation de déconnexion */}
      {logoutConfirmOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 px-8"
          onClick={() => setLogoutConfirmOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="logout-title"
            className="w-full max-w-xs rounded-[28px] border border-white/10 bg-night-raised p-6 text-center shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <p id="logout-title" className="mb-1 text-lg font-extrabold text-white">
              Se déconnecter ?
            </p>
            <p className="mb-5 text-sm text-white/65">Tu devras te reconnecter pour accéder à ton compte.</p>
            <div className="flex gap-3">
              <GradientButton tone="blue" look="glass" size="sm" className="flex-1" onClick={() => setLogoutConfirmOpen(false)}>
                Annuler
              </GradientButton>
              <GradientButton tone="orange" look="danger" size="sm" className="flex-1" onClick={onLogout}>
                Déconnexion
              </GradientButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
