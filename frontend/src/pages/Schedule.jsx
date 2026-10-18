import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import AuroraBackground from "../components/ui/AuroraBackground";
import PageHeader from "../components/ui/PageHeader";
import { CalendarIcon, ChevronLeftIcon, ChevronRightIcon } from "../components/ui/Icons";
import {
  fetchSchedule,
  fetchSubjects,
  createScheduleSlot,
  updateScheduleSlot,
  deleteScheduleSlot,
} from "../api";

// L'ordre d'affichage suit la convention française (Lundi en premier), mais chaque
// "value" correspond exactement à Date.prototype.getDay() (0 = Dimanche ... 6 = Samedi),
// pour que la détection "isToday" fonctionne bien tous les jours de la semaine, dimanche inclus.
const DAYS = [
  { value: 1, label: "Lundi" },
  { value: 2, label: "Mardi" },
  { value: 3, label: "Mercredi" },
  { value: 4, label: "Jeudi" },
  { value: 5, label: "Vendredi" },
  { value: 6, label: "Samedi" },
  { value: 0, label: "Dimanche" },
];

const DAY_START_MIN = 7 * 60 + 30; // 07:30
const DAY_END_MIN = 16 * 60 + 30; // 16:30

const EMPTY_FORM = {
  id: null,
  day_of_week: 1,
  start_time: "07:30",
  end_time: "08:30",
  subject_id: "",
  room: "",
  teacher: "",
};

// Palette cyclique pour distinguer les matières visuellement (fond dégradé sombre
// + accent vif, cohérente avec le thème général de l'application).
const COLOR_PALETTE = [
  { border: "border-blue-400", bg: "bg-blue-500/10", text: "text-blue-300", solid: "bg-gradient-to-br from-[#2f6be4] to-[#0c1f4d]" },
  { border: "border-emerald-400", bg: "bg-emerald-500/10", text: "text-emerald-300", solid: "bg-gradient-to-br from-[#0e8f6b] to-[#04211b]" },
  { border: "border-amber-400", bg: "bg-amber-500/10", text: "text-amber-300", solid: "bg-gradient-to-br from-[#f2960c] to-[#3a1503]" },
  { border: "border-rose-400", bg: "bg-rose-500/10", text: "text-rose-300", solid: "bg-gradient-to-br from-[#e11d48] to-[#33040f]" },
  { border: "border-violet-400", bg: "bg-violet-500/10", text: "text-violet-300", solid: "bg-gradient-to-br from-[#6d28d9] to-[#1b0a35]" },
  { border: "border-cyan-400", bg: "bg-cyan-500/10", text: "text-cyan-300", solid: "bg-gradient-to-br from-[#0f8f9d] to-[#052226]" },
  { border: "border-orange-400", bg: "bg-orange-500/10", text: "text-orange-300", solid: "bg-gradient-to-br from-[#f2b705] to-[#3a2400]" },
  { border: "border-fuchsia-400", bg: "bg-fuchsia-500/10", text: "text-fuchsia-300", solid: "bg-gradient-to-br from-[#a21caf] to-[#230a2e]" },
];

function colorForSubject(subjectId) {
  if (!subjectId) return { border: "border-white/20", bg: "bg-white/5", text: "text-white/60", solid: "bg-white/5" };
  return COLOR_PALETTE[subjectId % COLOR_PALETTE.length];
}

function toMinutes(hhmm) {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

// Formate un nombre de secondes en compte à rebours lisible ("1h 05min 32s", "12min 04s", "8s").
function formatCountdown(totalSeconds) {
  const safe = Math.max(0, totalSeconds);
  const h = Math.floor(safe / 3600);
  const m = Math.floor((safe % 3600) / 60);
  const s = Math.floor(safe % 60);
  const pad = (n) => String(n).padStart(2, "0");
  if (h > 0) return `${h}h ${pad(m)}min ${pad(s)}s`;
  if (m > 0) return `${m}min ${pad(s)}s`;
  return `${s}s`;
}

// Initiales affichées dans le badge coloré de la vue jour (ex. "Mathématiques" -> "MA").
function getInitials(name) {
  if (!name) return "—";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

function SlotForm({ form, setForm, subjects, onSubmit, onCancel, submitting, error }) {
  const allSubjects = [...subjects.generale, ...subjects.technique];

  return (
    <form
      onSubmit={onSubmit}
      className="bg-surface border border-white/10 rounded-3xl p-5 space-y-4"
    >
      <h3 className="text-sm font-semibold text-white">
        {form.id ? "Modifier le cours" : "Ajouter un cours"}
      </h3>

      {error && (
        <div className="text-sm text-red-300 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">
          {error}
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-white/70 mb-1.5">Jour</label>
          <select
            value={form.day_of_week}
            onChange={(e) => setForm({ ...form, day_of_week: Number(e.target.value) })}
            className="field"
          >
            {DAYS.map((d) => (
              <option key={d.value} value={d.value} className="bg-surface">
                {d.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-white/70 mb-1.5">Matière</label>
          <select
            value={form.subject_id}
            onChange={(e) => setForm({ ...form, subject_id: e.target.value })}
            className="field"
          >
            <option value="" className="bg-surface">— Aucune —</option>
            {allSubjects.map((s) => (
              <option key={s.id} value={s.id} className="bg-surface">
                {s.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-white/70 mb-1.5">Heure de début</label>
          <input
            type="time"
            value={form.start_time}
            onChange={(e) => setForm({ ...form, start_time: e.target.value })}
            min="07:30"
            max="16:30"
            className="field"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-white/70 mb-1.5">Heure de fin</label>
          <input
            type="time"
            value={form.end_time}
            onChange={(e) => setForm({ ...form, end_time: e.target.value })}
            min="07:30"
            max="16:30"
            className="field"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-white/70 mb-1.5">Salle (optionnel)</label>
          <input
            type="text"
            value={form.room}
            onChange={(e) => setForm({ ...form, room: e.target.value })}
            className="field"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-white/70 mb-1.5">Professeur (optionnel)</label>
          <input
            type="text"
            value={form.teacher}
            onChange={(e) => setForm({ ...form, teacher: e.target.value })}
            className="field"
          />
        </div>
      </div>

      <div className="flex gap-2 justify-end pt-2">
        <button type="button" onClick={onCancel} className="btn-ghost">Annuler</button>
        <button type="submit" disabled={submitting} className="btn-primary">
          {submitting ? "Enregistrement..." : form.id ? "Enregistrer" : "Ajouter"}
        </button>
      </div>
    </form>
  );
}

// ───────────────────────────────────────────
// VUE SEMAINE — grille horaire 07h30 → 16h30.
// Chaque cours est placé par pourcentage dans sa colonne (jamais en dehors de la grille,
// donc plus de chevauchement avec l'en-tête), les cours simultanés se partagent la largeur,
// la colonne des heures et l'en-tête restent visibles quand on fait défiler.
// ───────────────────────────────────────────
const STEP = 30; // minutes par ligne
const ROW_PX = 36; // hauteur d'une demi-heure
const TOTAL_MIN = DAY_END_MIN - DAY_START_MIN;
const BODY_PX = (TOTAL_MIN / STEP) * ROW_PX;
const TIME_COL_PX = 52;
const DAY_COL_MIN_PX = 112;

const yFor = (minutes) => ((minutes - DAY_START_MIN) / TOTAL_MIN) * BODY_PX;
const clampMin = (m) => Math.max(DAY_START_MIN, Math.min(m, DAY_END_MIN));

function formatHourLabel(minutes) {
  const h = String(Math.floor(minutes / 60)).padStart(2, "0");
  const m = minutes % 60;
  return m === 0 ? `${h}h` : `${h}h${String(m).padStart(2, "0")}`;
}

// Place les cours d'une journée : bornes ramenées dans la grille, et "voies" côte à côte
// pour les cours qui se chevauchent.
function layoutDay(daySlots) {
  const items = daySlots.map((slot) => {
    let s = clampMin(toMinutes(slot.start_time));
    let e = clampMin(toMinutes(slot.end_time));
    if (e - s < 15) {
      e = Math.min(DAY_END_MIN, s + STEP);
      if (e - s < 15) s = e - STEP;
    }
    return { slot, s, e, lane: 0, lanes: 1 };
  });
  items.sort((a, b) => a.s - b.s || a.e - b.e);

  let cluster = [];
  let clusterEnd = -1;
  let laneEnds = [];
  const flush = () => {
    const lanes = cluster.reduce((m, i) => Math.max(m, i.lane + 1), 1);
    cluster.forEach((i) => {
      i.lanes = lanes;
    });
    cluster = [];
    laneEnds = [];
  };

  for (const it of items) {
    if (it.s >= clusterEnd) {
      flush();
      clusterEnd = -1;
    }
    let lane = laneEnds.findIndex((end) => end <= it.s);
    if (lane === -1) {
      lane = laneEnds.length;
      laneEnds.push(it.e);
    } else {
      laneEnds[lane] = it.e;
    }
    it.lane = lane;
    cluster.push(it);
    clusterEnd = Math.max(clusterEnd, it.e);
  }
  flush();
  return items;
}

function WeekView({ slots, isDeveloper, onSlotClick, onAddClick }) {
  // Horloge à la minute : sert au repère "maintenant" dans la colonne du jour.
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);
  const todayValue = now.getDay();
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const showNowLine = nowMin >= DAY_START_MIN && nowMin <= DAY_END_MIN;

  // Lundi → Samedi ; le dimanche n'apparaît que s'il contient des cours.
  const days = DAYS.filter((d) => d.value !== 0 || slots.some((s) => s.day_of_week === 0));

  const lines = [];
  for (let m = DAY_START_MIN; m <= DAY_END_MIN; m += STEP) lines.push(m);

  return (
    <div>
      <p className="mb-2 px-1 text-xs text-white/65 sm:hidden">Fais glisser le tableau pour voir tous les jours.</p>

      <div className="overflow-hidden rounded-3xl border border-white/10 bg-[#120d1d]/80">
        <div className="overflow-x-auto">
          <div style={{ minWidth: TIME_COL_PX + days.length * DAY_COL_MIN_PX }}>
            {/* En-tête : jours */}
            <div className="flex border-b border-white/10 bg-white/[0.04]">
              <div className="sticky left-0 z-30 shrink-0 bg-[#1a1328]" style={{ width: TIME_COL_PX }} aria-hidden="true" />
              {days.map((day) => {
                const isToday = day.value === todayValue;
                const label = (
                  <>
                    <span
                      className={`rounded-full px-3 py-1 text-[11px] font-extrabold uppercase tracking-wide ${
                        isToday ? "bg-brand-gradient text-white shadow-glow-sm" : "text-white/80"
                      }`}
                    >
                      {day.label}
                    </span>
                    {isDeveloper && <span className="mt-1 text-[11px] font-semibold text-violet-300">+ cours</span>}
                  </>
                );
                const cls =
                  "flex min-h-[56px] flex-1 flex-col items-center justify-center border-l border-white/[0.06] py-2";
                return isDeveloper ? (
                  <button
                    key={day.value}
                    type="button"
                    onClick={() => onAddClick(day.value)}
                    aria-label={`Ajouter un cours le ${day.label}`}
                    className={`${cls} transition active:bg-white/10`}
                    style={{ minWidth: DAY_COL_MIN_PX }}
                  >
                    {label}
                  </button>
                ) : (
                  <div key={day.value} className={cls} style={{ minWidth: DAY_COL_MIN_PX }}>
                    {label}
                  </div>
                );
              })}
            </div>

            {/* Corps : heures + colonnes des jours */}
            <div className="relative flex" style={{ height: BODY_PX }}>
              {/* Lignes horaires (trait plein à chaque heure, léger à la demi-heure) */}
              <div className="pointer-events-none absolute inset-0" aria-hidden="true">
                {lines.map((m) => (
                  <div
                    key={m}
                    className={`absolute inset-x-0 border-t ${m % 60 === 0 ? "border-white/[0.12]" : "border-white/[0.05]"}`}
                    style={{ top: yFor(m) }}
                  />
                ))}
              </div>

              {/* Colonne des heures */}
              <div
                className="sticky left-0 z-20 shrink-0 border-r border-white/10 bg-[#1a1328]"
                style={{ width: TIME_COL_PX }}
                aria-hidden="true"
              >
                {lines
                  .filter((m) => m % 60 === 0 || m === DAY_START_MIN || m === DAY_END_MIN)
                  .map((m) => (
                    <span
                      key={m}
                      className="absolute right-2 text-[11px] font-semibold text-white/65"
                      style={{
                        top: yFor(m),
                        transform: m === DAY_START_MIN ? "translateY(4px)" : m === DAY_END_MIN ? "translateY(-110%)" : "translateY(-50%)",
                      }}
                    >
                      {formatHourLabel(m)}
                    </span>
                  ))}
              </div>

              {/* Colonnes des jours */}
              {days.map((day) => {
                const isToday = day.value === todayValue;
                const items = layoutDay(slots.filter((s) => s.day_of_week === day.value));

                return (
                  <div
                    key={day.value}
                    className={`relative flex-1 border-l border-white/[0.06] ${isToday ? "bg-violet-500/[0.07]" : ""}`}
                    style={{ minWidth: DAY_COL_MIN_PX }}
                  >
                    {items.map(({ slot, s, e, lane, lanes }) => {
                      const color = colorForSubject(slot.subject_id);
                      const top = yFor(s);
                      const height = yFor(e) - top;
                      const widthPct = 100 / lanes;
                      const name = slot.subject_name || "Cours";
                      const clickable = isDeveloper;

                      return (
                        <button
                          key={slot.id}
                          type="button"
                          onClick={() => clickable && onSlotClick(slot)}
                          disabled={!clickable}
                          aria-label={`${name}, de ${slot.start_time} à ${slot.end_time}${slot.room ? `, salle ${slot.room}` : ""}`}
                          className={`absolute z-10 flex flex-col overflow-hidden rounded-xl border-l-[3px] px-2 py-1.5 text-left ${color.border} ${color.bg} ${
                            clickable ? "cursor-pointer transition active:brightness-125" : "cursor-default"
                          }`}
                          style={{
                            top: top + 2,
                            height: height - 4,
                            left: `calc(${lane * widthPct}% + 3px)`,
                            width: `calc(${widthPct}% - 6px)`,
                          }}
                        >
                          <span className={`line-clamp-2 text-[12px] font-bold leading-tight ${color.text}`}>{name}</span>
                          {height >= 64 && slot.room && (
                            <span className="mt-0.5 truncate text-[11px] leading-tight text-white/70">Salle {slot.room}</span>
                          )}
                          {height >= 100 && (
                            <span className="mt-auto text-[11px] font-medium leading-tight text-white/60">
                              {slot.start_time} – {slot.end_time}
                            </span>
                          )}
                        </button>
                      );
                    })}

                    {/* Repère de l'heure actuelle */}
                    {isToday && showNowLine && (
                      <div
                        className="pointer-events-none absolute inset-x-0 z-20 h-0.5 bg-fuchsia-400"
                        style={{ top: yFor(nowMin) }}
                        aria-hidden="true"
                      >
                        <span className="absolute -left-1 -top-[3px] h-2 w-2 rounded-full bg-fuchsia-400" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ───────────────────────────────────────────
// VUE JOUR — timeline verticale avec navigation ← →
// ───────────────────────────────────────────
function DayView({ slots, dayIndex, setDayIndex, isDeveloper, onSlotClick, onAddClick }) {
  const day = DAYS[dayIndex];
  const daySlots = slots
    .filter((s) => s.day_of_week === day.value)
    .sort((a, b) => a.start_time.localeCompare(b.start_time));

  const goPrev = () => setDayIndex((i) => (i - 1 + DAYS.length) % DAYS.length);
  const goNext = () => setDayIndex((i) => (i + 1) % DAYS.length);

  // Horloge en direct : recalcule le statut de chaque cours (à venir / en cours /
  // terminé) chaque seconde, uniquement pour le jour correspondant à aujourd'hui.
  // Purement dérivé des données (aucun état à gérer côté dev) : autant de fois qu'il
  // ajoute, modifie ou supprime des cours, le statut se recalcule tout seul.
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const isToday = day.value === now.getDay();
  const nowSeconds = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();

  const slotInfos = daySlots.map((slot) => {
    const startSec = toMinutes(slot.start_time) * 60;
    const endSec = toMinutes(slot.end_time) * 60;
    let state = "other-day";
    if (isToday) {
      if (nowSeconds >= startSec && nowSeconds < endSec) state = "ongoing";
      else if (nowSeconds >= endSec) state = "past";
      else state = "upcoming";
    }
    return { slot, startSec, endSec, state };
  });

  const hasOngoing = slotInfos.some((si) => si.state === "ongoing");
  const nextUpcomingIndex = isToday ? slotInfos.findIndex((si) => si.state === "upcoming") : -1;

  return (
    <div className="max-w-xl mx-auto">
      {/* Navigation jour */}
      <div className="flex items-center justify-between mb-5 px-1">
        <button
          onClick={goPrev}
          aria-label="Jour précédent"
          className="w-11 h-11 rounded-full bg-white/[0.08] border border-white/15 flex items-center justify-center text-white active:bg-white/20 transition"
        >
          <ChevronLeftIcon size={20} />
        </button>
        <div className="text-center">
          <p className="text-[10px] font-extrabold uppercase tracking-widest text-violet-300 mb-0.5">
            Emploi du temps
          </p>
          <p className="text-lg font-extrabold text-white">{day.label}</p>
        </div>
        <button
          onClick={goNext}
          aria-label="Jour suivant"
          className="w-11 h-11 rounded-full bg-white/[0.08] border border-white/15 flex items-center justify-center text-white active:bg-white/20 transition"
        >
          <ChevronRightIcon size={20} />
        </button>
      </div>

      {isDeveloper && (
        <button
          onClick={() => onAddClick(day.value)}
          className="w-full mb-4 text-xs font-semibold text-white/60 border-2 border-dashed border-white/15 rounded-xl py-2.5 hover:border-violet-400 hover:text-white transition"
        >
          + Ajouter un cours ce jour
        </button>
      )}

      {daySlots.length === 0 && (
        <p className="text-sm text-white/50 italic text-center py-14">Aucun cours ce jour</p>
      )}

      {/* Liste des cours, façon cartes d'appli en dégradé */}
      <div className="space-y-3">
        {slotInfos.map(({ slot, startSec, state }, i) => {
          const color = colorForSubject(slot.subject_id);
          const initials = getInitials(slot.subject_name);
          const subjectLabel = slot.subject_name || "—";
          const teacherPart = slot.teacher ? ` avec ${slot.teacher}` : "";

          // Ligne de statut en direct (uniquement pour le jour correspondant à
          // aujourd'hui) : à venir avec compte à rebours, en cours (figé), ou terminé.
          let liveStatus = null;
          if (state === "ongoing") {
            liveStatus = {
              text: `Vous êtes actuellement en cours de ${subjectLabel}${teacherPart}`,
              className: "text-emerald-300",
              pulse: true,
            };
          } else if (state === "upcoming") {
            const isNext = i === nextUpcomingIndex && hasOngoing;
            const prefix = isNext ? "Prochain cours" : "Cours";
            liveStatus = {
              text: `${prefix} de ${subjectLabel}${teacherPart} dans ${formatCountdown(startSec - nowSeconds)}`,
              className: isNext ? "text-violet-300" : "text-white/60",
              pulse: false,
            };
          } else if (state === "past") {
            liveStatus = {
              text: "Cours terminé",
              className: "text-white/50 italic",
              pulse: false,
            };
          }

          return (
            <button
              key={slot.id}
              onClick={() => isDeveloper && onSlotClick(slot)}
              disabled={!isDeveloper}
              className={`w-full flex flex-col gap-2 bg-white/5 rounded-2xl border border-white/10 px-4 py-3.5 text-left transition ${
                isDeveloper
                  ? "cursor-pointer hover:border-white/20 hover:bg-white/[0.08]"
                  : "cursor-default"
              } ${state === "ongoing" ? "border-emerald-400/40 bg-emerald-500/[0.06]" : ""}`}
            >
              <div className="w-full flex items-center gap-3">
                <div
                  className={`w-11 h-11 shrink-0 rounded-xl flex items-center justify-center ${color.solid} border border-white/10`}
                >
                  <span className="text-white text-sm font-extrabold">{initials}</span>
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-[15px] font-bold text-white truncate">{subjectLabel}</p>
                  {slot.teacher ? (
                    <p className="text-xs text-white/55 truncate">{slot.teacher}</p>
                  ) : (
                    <p className="text-xs text-white/50 italic">Professeur non renseigné</p>
                  )}
                </div>

                <div className="text-right shrink-0">
                  <p className="text-xs font-bold text-white/80">{slot.start_time}</p>
                  <p className="text-[10px] text-white/55">{slot.end_time}</p>
                  {slot.room && (
                    <span className="inline-block mt-1 text-[10px] font-semibold text-violet-300 bg-violet-500/15 rounded-full px-2 py-0.5">
                      Salle {slot.room}
                    </span>
                  )}
                </div>
              </div>

              {liveStatus && (
                <div className="w-full pt-2 border-t border-white/10 flex items-center gap-1.5">
                  {liveStatus.pulse && (
                    <span className="relative flex w-1.5 h-1.5 shrink-0">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex rounded-full w-1.5 h-1.5 bg-emerald-400" />
                    </span>
                  )}
                  <p className={`text-xs font-semibold truncate ${liveStatus.className}`}>
                    {liveStatus.text}
                  </p>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function Schedule({ onBack }) {
  const { token, isDeveloper } = useAuth();

  const [slots, setSlots] = useState([]);
  const [subjects, setSubjects] = useState({ generale: [], technique: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [view, setView] = useState("day"); // "day" | "week"
  // Ouvre la vue jour directement sur "aujourd'hui" (au lieu de toujours démarrer sur
  // Lundi), pour que le compte à rebours soit visible dès l'arrivée sur l'écran.
  const [dayIndex, setDayIndex] = useState(() => {
    const todayValue = new Date().getDay(); // 0=Dimanche ... 6=Samedi
    const idx = DAYS.findIndex((d) => d.value === todayValue);
    return idx === -1 ? 0 : idx;
  });

  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // showSpinner=false : rafraîchissement silencieux en arrière-plan (utilisé par le polling),
  // pour que la vue de l'élève se mette à jour au fur et à mesure des modifications du
  // développeur sans clignoter ni perdre sa position.
  const loadData = (showSpinner = true) => {
    if (showSpinner) setLoading(true);
    Promise.all([fetchSchedule(), fetchSubjects()])
      .then(([scheduleData, subjectsData]) => {
        setSlots(scheduleData.slots);
        setSubjects(subjectsData);
      })
      .catch((err) => {
        if (showSpinner) setError(err.message);
      })
      .finally(() => {
        if (showSpinner) setLoading(false);
      });
  };

  useEffect(() => {
    loadData();

    // Rafraîchissement automatique : l'élève (et le développeur) voient les changements
    // au fur et à mesure, sans avoir à recharger la page. On ne rafraîchit pas pendant
    // qu'un formulaire d'édition est ouvert, pour ne pas gêner une saisie en cours.
    const interval = setInterval(() => {
      if (!formOpen) loadData(false);
    }, 5000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formOpen]);

  const openCreateForm = (dayValue) => {
    setForm({ ...EMPTY_FORM, day_of_week: dayValue });
    setFormError("");
    setFormOpen(true);
  };

  const openEditForm = (slot) => {
    setForm({
      id: slot.id,
      day_of_week: slot.day_of_week,
      start_time: slot.start_time,
      end_time: slot.end_time,
      subject_id: slot.subject_id || "",
      room: slot.room || "",
      teacher: slot.teacher || "",
    });
    setFormError("");
    setFormOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");
    setSubmitting(true);
    const payload = {
      day_of_week: form.day_of_week,
      start_time: form.start_time,
      end_time: form.end_time,
      subject_id: form.subject_id ? Number(form.subject_id) : null,
      room: form.room,
      teacher: form.teacher,
    };

    try {
      if (form.id) {
        await updateScheduleSlot(token, form.id, payload);
      } else {
        await createScheduleSlot(token, payload);
      }
      setFormOpen(false);
      setForm(EMPTY_FORM);
      loadData();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteFromForm = async () => {
    if (!form.id) return;
    if (!window.confirm("Supprimer ce cours ?")) return;
    try {
      await deleteScheduleSlot(token, form.id);
      setFormOpen(false);
      setForm(EMPTY_FORM);
      loadData();
    } catch (err) {
      setFormError(err.message);
    }
  };

  return (
    <div className="relative isolate min-h-screen bg-ink">
      <AuroraBackground />
      <PageHeader
        title="Emploi du temps"
        subtitle="07h30 — 16h30"
        icon={<CalendarIcon size={24} />}
        tone="blue"
      />

      <div className="px-5 pb-4">
        <div className="seg mx-auto max-w-xl" role="tablist" aria-label="Affichage">
          <button
            type="button"
            role="tab"
            aria-selected={view === "day"}
            onClick={() => setView("day")}
            className={`seg-item ${view === "day" ? "seg-item-on" : ""}`}
          >
            Jour
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={view === "week"}
            onClick={() => setView("week")}
            className={`seg-item ${view === "week" ? "seg-item-on" : ""}`}
          >
            Semaine
          </button>
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-5 pb-nav space-y-6">
        {loading && <p className="text-sm text-white/60">Chargement...</p>}
        {error && (
          <div className="text-sm text-red-300 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">
            {error}
          </div>
        )}

        {!loading && !error && (
          <>
            {!isDeveloper && (
              <p className="text-xs text-white/55">
                Consultation seule. La modification est réservée au compte développeur.
              </p>
            )}

            {formOpen && (
              <div className="space-y-2">
                <SlotForm
                  form={form}
                  setForm={setForm}
                  subjects={subjects}
                  onSubmit={handleSubmit}
                  onCancel={() => setFormOpen(false)}
                  submitting={submitting}
                  error={formError}
                />
                {form.id && (
                  <button
                    onClick={handleDeleteFromForm}
                    className="min-h-[44px] text-sm font-semibold text-red-300 underline-offset-2 hover:underline"
                  >
                    Supprimer ce cours
                  </button>
                )}
              </div>
            )}

            {view === "day" ? (
              <DayView
                slots={slots}
                dayIndex={dayIndex}
                setDayIndex={setDayIndex}
                isDeveloper={isDeveloper}
                onSlotClick={openEditForm}
                onAddClick={openCreateForm}
              />
            ) : (
              <WeekView
                slots={slots}
                isDeveloper={isDeveloper}
                onSlotClick={openEditForm}
                onAddClick={openCreateForm}
              />
            )}
          </>
        )}
      </main>
    </div>
  );
}
