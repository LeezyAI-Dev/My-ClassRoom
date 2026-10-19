import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { fetchSchedule, fetchStudents, fetchSubjects } from "../api";
import { APP_NAME, CLASS_NAME, CLASS_TAGLINE } from "../config";
import BannerCarousel from "../components/BannerCarousel";
import BannerManager from "../components/BannerManager";
import AuroraBackground from "../components/ui/AuroraBackground";
import IconTile from "../components/ui/IconTile";
import {
  BookIcon,
  CalcIcon,
  CapIcon,
  ChecklistIcon,
  DocIcon,
  EyeIcon,
  UserIcon,
} from "../components/ui/Icons";

const ROLE_LABEL = {
  developer: "Développeur",
  student: "Élève",
};

// Jours affichés dans la carte « Emploi du temps » (valeurs = Date.getDay()).
const WEEK = [
  { value: 1, short: "Lun", long: "Lundi" },
  { value: 2, short: "Mar", long: "Mardi" },
  { value: 3, short: "Mer", long: "Mercredi" },
  { value: 4, short: "Jeu", long: "Jeudi" },
  { value: 5, short: "Ven", long: "Vendredi" },
  { value: 6, short: "Sam", long: "Samedi" },
];

// Couleur de chaque barre, comme sur la maquette (alternance violet / magenta / bleu).
const BAR_GRADIENTS = [
  "linear-gradient(180deg, #a35cf0 0%, #6b34c9 100%)",
  "linear-gradient(180deg, #e04bf0 0%, #a02bc4 100%)",
  "linear-gradient(180deg, #a35cf0 0%, #6b34c9 100%)",
  "linear-gradient(180deg, #5fa8ff 0%, #3a74e6 100%)",
  "linear-gradient(180deg, #a35cf0 0%, #6b34c9 100%)",
  "linear-gradient(180deg, #e04bf0 0%, #a02bc4 100%)",
];

const BAR_MAX_PX = 104;
const BAR_MIN_PX = 20;

function toMinutes(hhmm) {
  const [h, m] = String(hhmm).split(":").map(Number);
  return h * 60 + (m || 0);
}

function formatHour(minutes) {
  const h = String(Math.floor(minutes / 60)).padStart(2, "0");
  const m = String(minutes % 60).padStart(2, "0");
  return `${h}H${m}`;
}

// Résume l'emploi du temps réel : minutes de cours par jour, plage horaire, jours couverts.
function summarizeSchedule(slots) {
  const perDay = WEEK.map((d) => ({
    ...d,
    minutes: slots
      .filter((s) => s.day_of_week === d.value)
      .reduce((sum, s) => sum + Math.max(0, toMinutes(s.end_time) - toMinutes(s.start_time)), 0),
  }));

  if (slots.length === 0) return { perDay, label: "Aucun cours pour l'instant" };

  const start = Math.min(...slots.map((s) => toMinutes(s.start_time)));
  const end = Math.max(...slots.map((s) => toMinutes(s.end_time)));
  const days = perDay.filter((d) => d.minutes > 0);
  const range =
    days.length > 1 ? `${days[0].short} à ${days[days.length - 1].short}` : days[0]?.short || "";

  return { perDay, label: `${formatHour(start)} – ${formatHour(end)}${range ? ` · ${range}` : ""}` };
}

function formatHoursSpoken(minutes) {
  if (minutes <= 0) return "aucun cours";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h > 0 ? `${h} h` : ""}${m > 0 ? ` ${m} min` : ""}`.trim() + " de cours";
}

// --- Carte « Emploi du temps » : barres proportionnelles aux heures de cours de chaque jour ---

function ScheduleCard({ summary, onOpen }) {
  const today = new Date().getDay();
  const maxMinutes = Math.max(...summary.perDay.map((d) => d.minutes), 0);

  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={`Emploi du temps, ${summary.label}. Ouvrir`}
      className="card-press w-full p-5 text-left"
    >
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-[15px] font-bold text-white">Emploi du temps</h2>
        <p className="truncate text-xs text-white/70">{summary.label}</p>
      </div>

      <div className="mt-4 grid grid-cols-6 gap-2.5" role="img" aria-label="Heures de cours par jour">
        {summary.perDay.map((d, i) => {
          const height =
            maxMinutes > 0 && d.minutes > 0
              ? Math.max(BAR_MIN_PX, Math.round((d.minutes / maxMinutes) * BAR_MAX_PX))
              : BAR_MIN_PX;
          const isToday = d.value === today;

          return (
            <div key={d.value} className="flex flex-col items-center gap-2" title={`${d.long} : ${formatHoursSpoken(d.minutes)}`}>
              <div className="flex h-[104px] w-full items-end">
                <div
                  className={`w-full rounded-xl ${d.minutes === 0 ? "opacity-30" : ""}`}
                  style={{ height, background: BAR_GRADIENTS[i] }}
                />
              </div>
              <span className={`text-xs ${isToday ? "font-bold text-white" : "text-white/65"}`}>{d.short}</span>
            </div>
          );
        })}
      </div>
    </button>
  );
}

// --- Carte de menu : tuile d'icône + titre + sous-titre ---

function MenuCard({ icon, tone, title, subtitle, onClick, accent = false, className = "", right }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`${accent ? "card-accent" : "card-press"} flex min-h-[76px] items-center gap-3 p-3.5 text-left transition duration-150 active:scale-[0.985] motion-reduce:transition-none ${className}`}
    >
      <IconTile tone={tone}>{icon}</IconTile>
      <span className="min-w-0 flex-1">
        <span className="block text-[15px] font-bold leading-tight text-white">{title}</span>
        <span className="mt-0.5 block text-[13px] leading-tight text-white/65">{subtitle}</span>
      </span>
      {right}
    </button>
  );
}

export default function Dashboard({ onNavigate, onLogout }) {
  const { user, token, isDeveloper } = useAuth();
  const [profileOpen, setProfileOpen] = useState(false);
  const [bannerOpen, setBannerOpen] = useState(false);

  const [summary, setSummary] = useState(() => summarizeSchedule([]));
  const [subjectCount, setSubjectCount] = useState(null);
  const [studentCount, setStudentCount] = useState(null);

  // Les chiffres de l'accueil viennent des vraies données. Un échec n'est pas bloquant :
  // la carte garde simplement son texte par défaut.
  useEffect(() => {
    let cancelled = false;

    fetchSchedule()
      .then((data) => !cancelled && setSummary(summarizeSchedule(data.slots || [])))
      .catch(() => {});

    fetchSubjects()
      .then((data) => {
        if (!cancelled) setSubjectCount((data.generale?.length || 0) + (data.technique?.length || 0));
      })
      .catch(() => {});

    if (isDeveloper) {
      fetchStudents(token)
        .then((data) => !cancelled && setStudentCount((data.students || []).length))
        .catch(() => {});
    }

    return () => {
      cancelled = true;
    };
  }, [isDeveloper, token]);

  const roleLabel = ROLE_LABEL[user?.role] || user?.role;

  return (
    <div className="relative isolate min-h-screen bg-ink">
      <AuroraBackground />

      {/* En-tête : logo, nom de l'appli, rôle, profil */}
      <header className="pt-safe flex items-center gap-3 px-5">
        <IconTile tone="violet" size="sm" glow>
          <CapIcon size={22} />
        </IconTile>
        <p className="min-w-0 flex-1 truncate text-lg font-extrabold text-white">{APP_NAME}</p>

        <span className="pill">{roleLabel}</span>

        <div className="relative">
          <button
            type="button"
            onClick={() => setProfileOpen((open) => !open)}
            aria-label="Profil"
            aria-expanded={profileOpen}
            aria-haspopup="menu"
            className="flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-white/[0.06] text-white transition active:bg-white/15 motion-reduce:transition-none"
          >
            <UserIcon size={22} />
          </button>

          {profileOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setProfileOpen(false)} aria-hidden="true" />
              <div
                role="menu"
                className="absolute right-0 z-20 mt-2 w-56 glass-panel rounded-2xl p-4"
              >
                <p className="truncate text-sm font-bold text-white">{user?.username}</p>
                <p className="mb-3 text-xs text-white/65">Compte {roleLabel?.toLowerCase()}</p>
                <button
                  type="button"
                  role="menuitem"
                  onClick={onLogout}
                  className="flex min-h-[44px] w-full items-center text-left text-sm font-semibold text-red-300 active:text-red-200"
                >
                  Se déconnecter
                </button>
              </div>
            </>
          )}
        </div>
      </header>

      <main className="pb-nav px-5">
        {/* Titre : nom de la classe */}
        <section className="px-2 pb-7 pt-9 text-center">
          <h1 className="bg-title-gradient bg-clip-text text-[2.75rem] font-extrabold leading-none tracking-tight text-transparent">
            {CLASS_NAME}
          </h1>
          <p className="mx-auto mt-4 max-w-[17rem] text-[15px] leading-snug text-lavender">{CLASS_TAGLINE}</p>
        </section>

        <div className="mx-auto max-w-md space-y-3">
          {/* Bannière du développeur (n'apparaît que s'il y a des images) */}
          <BannerCarousel />

          <ScheduleCard summary={summary} onOpen={() => onNavigate("schedule")} />

          <div className="grid grid-cols-2 gap-3">
            <MenuCard
              tone="violet"
              icon={<BookIcon size={22} />}
              title="Matières"
              subtitle={subjectCount === null ? "Cours et ressources" : `${subjectCount} matières`}
              onClick={() => onNavigate("subjects")}
            />
            <MenuCard
              accent
              tone="orchid"
              icon={<DocIcon size={22} />}
              title="Registre de notes"
              subtitle="Privé"
              onClick={() => onNavigate("grades")}
            />
            <MenuCard
              tone="blue"
              icon={<CalcIcon size={22} />}
              title="Moyenne"
              subtitle="Calculateur"
              onClick={() => onNavigate("average")}
            />
            <MenuCard
              tone="orange"
              icon={<EyeIcon size={22} />}
              title="Eyes"
              subtitle="Fil de la classe"
              onClick={() => onNavigate("eyes")}
            />
          </div>

          {isDeveloper && (
            <>
              <MenuCard
                className="w-full"
                tone="green"
                icon={<ChecklistIcon size={22} />}
                title="Checklist"
                subtitle={
                  studentCount === null
                    ? "Liste des élèves"
                    : `Liste des élèves · ${studentCount} inscrit${studentCount > 1 ? "s" : ""}`
                }
                onClick={() => onNavigate("checklist")}
                right={<span className="pill shrink-0">Développeur</span>}
              />

              {/* Gestion de la bannière : repliée par défaut pour garder l'accueil épuré */}
              <button
                type="button"
                onClick={() => setBannerOpen((open) => !open)}
                aria-expanded={bannerOpen}
                className="flex min-h-[48px] w-full items-center justify-between rounded-2xl px-4 text-sm font-semibold text-white/70 transition active:bg-white/[0.06] motion-reduce:transition-none"
              >
                Bannière d'accueil
                <span className="text-xs font-medium text-violet-300">{bannerOpen ? "Masquer" : "Gérer"}</span>
              </button>
              {bannerOpen && <BannerManager />}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
