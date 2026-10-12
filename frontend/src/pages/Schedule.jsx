import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
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
const HOUR_MARKS = Array.from({ length: 10 }, (_, i) => 7 + i); // 07..16

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
  { border: "border-sky-400", bg: "bg-sky-500/10", text: "text-sky-300", solid: "bg-gradient-to-br from-[#1660e0] to-[#05122c]" },
  { border: "border-emerald-400", bg: "bg-emerald-500/10", text: "text-emerald-300", solid: "bg-gradient-to-br from-[#0e8f6b] to-[#04211b]" },
  { border: "border-amber-400", bg: "bg-amber-500/10", text: "text-amber-300", solid: "bg-gradient-to-br from-[#f2960c] to-[#3a1503]" },
  { border: "border-rose-400", bg: "bg-rose-500/10", text: "text-rose-300", solid: "bg-gradient-to-br from-[#e11d48] to-[#33040f]" },
  { border: "border-violet-400", bg: "bg-violet-500/10", text: "text-violet-300", solid: "bg-gradient-to-br from-[#6d28d9] to-[#1b0a35]" },
  { border: "border-cyan-400", bg: "bg-cyan-500/10", text: "text-cyan-300", solid: "bg-gradient-to-br from-[#0f8f9d] to-[#052226]" },
  { border: "border-orange-400", bg: "bg-orange-500/10", text: "text-orange-300", solid: "bg-gradient-to-br from-[#f2b705] to-[#3a2400]" },
  { border: "border-fuchsia-400", bg: "bg-fuchsia-500/10", text: "text-fuchsia-300", solid: "bg-gradient-to-br from-[#a21caf] to-[#230a2e]" },
];

function colorForSubject(subjectId) {
  if (!subjectId) return { border: "border-white/20", bg: "bg-white/5", text: "text-white/50", solid: "bg-white/5" };
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
      className="bg-[#0b1230] border border-white/10 rounded-2xl p-5 space-y-4"
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
          <label className="block text-xs text-white/50 mb-1">Jour</label>
          <select
            value={form.day_of_week}
            onChange={(e) => setForm({ ...form, day_of_week: Number(e.target.value) })}
            className="w-full bg-white/5 border border-white/15 text-white rounded-lg px-3 py-2 text-sm outline-none focus:border-sky-400"
          >
            {DAYS.map((d) => (
              <option key={d.value} value={d.value} className="bg-[#0b1230]">
                {d.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs text-white/50 mb-1">Matière</label>
          <select
            value={form.subject_id}
            onChange={(e) => setForm({ ...form, subject_id: e.target.value })}
            className="w-full bg-white/5 border border-white/15 text-white rounded-lg px-3 py-2 text-sm outline-none focus:border-sky-400"
          >
            <option value="" className="bg-[#0b1230]">— Aucune —</option>
            {allSubjects.map((s) => (
              <option key={s.id} value={s.id} className="bg-[#0b1230]">
                {s.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs text-white/50 mb-1">Heure de début</label>
          <input
            type="time"
            value={form.start_time}
            onChange={(e) => setForm({ ...form, start_time: e.target.value })}
            min="07:30"
            max="16:30"
            className="w-full bg-white/5 border border-white/15 text-white rounded-lg px-3 py-2 text-sm outline-none focus:border-sky-400 [color-scheme:dark]"
          />
        </div>

        <div>
          <label className="block text-xs text-white/50 mb-1">Heure de fin</label>
          <input
            type="time"
            value={form.end_time}
            onChange={(e) => setForm({ ...form, end_time: e.target.value })}
            min="07:30"
            max="16:30"
            className="w-full bg-white/5 border border-white/15 text-white rounded-lg px-3 py-2 text-sm outline-none focus:border-sky-400 [color-scheme:dark]"
          />
        </div>

        <div>
          <label className="block text-xs text-white/50 mb-1">Salle (optionnel)</label>
          <input
            type="text"
            value={form.room}
            onChange={(e) => setForm({ ...form, room: e.target.value })}
            className="w-full bg-white/5 border border-white/15 text-white rounded-lg px-3 py-2 text-sm outline-none focus:border-sky-400"
          />
        </div>

        <div>
          <label className="block text-xs text-white/50 mb-1">Professeur (optionnel)</label>
          <input
            type="text"
            value={form.teacher}
            onChange={(e) => setForm({ ...form, teacher: e.target.value })}
            className="w-full bg-white/5 border border-white/15 text-white rounded-lg px-3 py-2 text-sm outline-none focus:border-sky-400"
          />
        </div>
      </div>

      <div className="flex gap-2 justify-end pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm rounded-lg text-white/60 hover:bg-white/10 transition"
        >
          Annuler
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="px-4 py-2 text-sm rounded-lg bg-gradient-to-r from-sky-500 to-blue-600 text-white hover:brightness-110 transition disabled:opacity-60"
        >
          {submitting ? "Enregistrement..." : form.id ? "Enregistrer" : "Ajouter"}
        </button>
      </div>
    </form>
  );
}

// ───────────────────────────────────────────
// VUE SEMAINE — vrai tableau grille (jours en colonnes, créneaux de 30 min
// en lignes), cellules colorées par matière, à la manière d'un emploi du
// temps papier / CDI, adapté au thème sombre.
// ───────────────────────────────────────────
function WeekView({ slots, isDeveloper, onSlotClick, onAddClick }) {
  const STEP = 30; // minutes
  const rowCount = (DAY_END_MIN - DAY_START_MIN) / STEP;
  const rows = Array.from({ length: rowCount }, (_, i) => DAY_START_MIN + i * STEP);

  const slotsByDay = (dayValue) => slots.filter((s) => s.day_of_week === dayValue);
  const rowStartFor = (minutes) => Math.round((minutes - DAY_START_MIN) / STEP) + 2; // +2 : ligne 1 = en-tête

  return (
    <div className="bg-[#0b1230] border border-white/10 rounded-2xl overflow-hidden overflow-x-auto">
      <div
        className="grid"
        style={{
          gridTemplateColumns: `68px repeat(${DAYS.length}, 1fr)`,
          gridTemplateRows: `44px repeat(${rowCount}, 32px)`,
          minWidth: `${68 + DAYS.length * 110}px`,
        }}
      >
        {/* Coin haut-gauche */}
        <div className="bg-gradient-to-br from-[#1660e0] to-[#05122c]" style={{ gridColumn: 1, gridRow: 1 }} />

        {/* En-têtes des jours */}
        {DAYS.map((day, i) => (
          <div
            key={day.value}
            className="bg-gradient-to-br from-[#1660e0] to-[#05122c] border-l border-white/10 flex flex-col items-center justify-center"
            style={{ gridColumn: i + 2, gridRow: 1 }}
          >
            <p className="text-white text-[11px] font-extrabold uppercase tracking-wide">
              {day.label}
            </p>
            {isDeveloper && (
              <button
                onClick={() => onAddClick(day.value)}
                className="text-[9px] text-sky-300 hover:text-sky-200 leading-none mt-0.5"
              >
                + cours
              </button>
            )}
          </div>
        ))}

        {/* Colonne des heures */}
        {rows.map((min, i) => (
          <div
            key={min}
            className="bg-white/[0.03] border-b border-r border-white/10 flex items-start justify-end pr-2 pt-0.5"
            style={{ gridColumn: 1, gridRow: i + 2 }}
          >
            {min % 60 === 0 && (
              <span className="text-[10px] font-bold text-white/40">
                {String(Math.floor(min / 60)).padStart(2, "0")}h
              </span>
            )}
          </div>
        ))}

        {/* Quadrillage de fond (une cellule par jour x créneau) */}
        {DAYS.map((day, di) =>
          rows.map((min, ri) => (
            <div
              key={`${day.value}-${min}`}
              className="border-b border-r border-white/5 last:border-r-0"
              style={{ gridColumn: di + 2, gridRow: ri + 2 }}
            />
          ))
        )}

        {/* Cours, positionnés et étirés sur leur durée réelle */}
        {DAYS.map((day, di) =>
          slotsByDay(day.value).map((slot) => {
            const start = toMinutes(slot.start_time);
            const end = toMinutes(slot.end_time);
            const rowStart = rowStartFor(start);
            const rowSpan = Math.max(1, Math.round((end - start) / STEP));
            const color = colorForSubject(slot.subject_id);

            return (
              <button
                key={slot.id}
                onClick={() => isDeveloper && onSlotClick(slot)}
                disabled={!isDeveloper}
                className={`m-[2px] rounded-lg ${color.bg} border-l-[3px] ${color.border} px-1.5 py-1 overflow-hidden text-left flex flex-col justify-center ${
                  isDeveloper ? "cursor-pointer hover:brightness-125" : "cursor-default"
                }`}
                style={{ gridColumn: di + 2, gridRow: `${rowStart} / span ${rowSpan}` }}
              >
                <p className={`text-[10px] font-bold leading-tight truncate ${color.text}`}>
                  {slot.subject_name || "—"}
                </p>
                {rowSpan > 1 && (
                  <p className="text-[9px] text-white/40 leading-tight truncate">
                    {slot.room ? `Salle ${slot.room}` : `${slot.start_time}-${slot.end_time}`}
                  </p>
                )}
              </button>
            );
          })
        )}
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
          className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white hover:bg-white/10 active:opacity-70 transition"
        >
          ←
        </button>
        <div className="text-center">
          <p className="text-[10px] font-extrabold uppercase tracking-widest text-sky-400 mb-0.5">
            Emploi du temps
          </p>
          <p className="text-lg font-extrabold text-white">{day.label}</p>
        </div>
        <button
          onClick={goNext}
          aria-label="Jour suivant"
          className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white hover:bg-white/10 active:opacity-70 transition"
        >
          →
        </button>
      </div>

      {isDeveloper && (
        <button
          onClick={() => onAddClick(day.value)}
          className="w-full mb-4 text-xs font-semibold text-white/60 border-2 border-dashed border-white/15 rounded-xl py-2.5 hover:border-sky-400 hover:text-white transition"
        >
          + Ajouter un cours ce jour
        </button>
      )}

      {daySlots.length === 0 && (
        <p className="text-sm text-white/30 italic text-center py-14">Aucun cours ce jour</p>
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
              className: isNext ? "text-sky-300" : "text-white/50",
              pulse: false,
            };
          } else if (state === "past") {
            liveStatus = {
              text: "Cours terminé",
              className: "text-white/25 italic",
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
                    <p className="text-xs text-white/40 truncate">{slot.teacher}</p>
                  ) : (
                    <p className="text-xs text-white/25 italic">Professeur non renseigné</p>
                  )}
                </div>

                <div className="text-right shrink-0">
                  <p className="text-xs font-bold text-white/80">{slot.start_time}</p>
                  <p className="text-[10px] text-white/40">{slot.end_time}</p>
                  {slot.room && (
                    <span className="inline-block mt-1 text-[10px] font-semibold text-sky-300 bg-sky-500/10 rounded-full px-2 py-0.5">
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
    <div className="min-h-screen bg-[#060b1c]">
      <header className="px-5 pt-9 pb-5 flex items-center gap-4">
        <button
          onClick={onBack}
          aria-label="Retour"
          className="w-10 h-10 rounded-full border-2 border-white/30 flex items-center justify-center active:opacity-70 transition shrink-0"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path
              d="M15 5L8 12L15 19"
              stroke="white"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
        <div>
          <h1
            className="text-white text-[1.3rem] sm:text-[1.5rem]"
            style={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 800 }}
          >
            Emploi du t<span className="text-sky-400">em</span>ps
          </h1>
          <p className="text-white/40 text-xs font-medium mt-0.5">07h30 — 16h30</p>
        </div>
      </header>

      <div className="px-4 sm:px-6 pb-3">
        <div className="max-w-xl mx-auto flex bg-white/5 border border-white/10 rounded-xl p-1">
          <button
            onClick={() => setView("day")}
            className={`flex-1 py-2.5 rounded-lg text-sm font-extrabold uppercase tracking-wide transition-colors ${
              view === "day"
                ? "bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-[0_0_16px_-2px_rgba(56,189,248,0.6)]"
                : "text-white/50"
            }`}
          >
            Vue Jour
          </button>
          <button
            onClick={() => setView("week")}
            className={`flex-1 py-2.5 rounded-lg text-sm font-extrabold uppercase tracking-wide transition-colors ${
              view === "week"
                ? "bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-[0_0_16px_-2px_rgba(56,189,248,0.6)]"
                : "text-white/50"
            }`}
          >
            Vue Semaine
          </button>
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-6 pb-10 space-y-6">
        {loading && <p className="text-sm text-white/50">Chargement...</p>}
        {error && (
          <div className="text-sm text-red-300 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">
            {error}
          </div>
        )}

        {!loading && !error && (
          <>
            {!isDeveloper && (
              <p className="text-xs text-white/40">
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
                    className="text-xs text-red-400 hover:underline"
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
