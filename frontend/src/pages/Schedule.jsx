import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import {
  fetchSchedule,
  fetchSubjects,
  createScheduleSlot,
  updateScheduleSlot,
  deleteScheduleSlot,
} from "../api";

const DAYS = [
  { value: 1, label: "Lundi" },
  { value: 2, label: "Mardi" },
  { value: 3, label: "Mercredi" },
  { value: 4, label: "Jeudi" },
  { value: 5, label: "Vendredi" },
  { value: 6, label: "Samedi" },
];

const DAY_START_MIN = 8 * 60; // 08:00
const DAY_END_MIN = 17 * 60; // 17:00
const HOUR_MARKS = Array.from({ length: 10 }, (_, i) => 8 + i); // 08..17

const EMPTY_FORM = {
  id: null,
  day_of_week: 1,
  start_time: "08:00",
  end_time: "09:00",
  subject_id: "",
  room: "",
  teacher: "",
};

// Palette cyclique pour distinguer les matières visuellement (comme sur un vrai emploi du temps).
const COLOR_PALETTE = [
  { bar: "bg-blue-500", border: "border-blue-500", bg: "bg-blue-50", text: "text-blue-800" },
  { bar: "bg-emerald-500", border: "border-emerald-500", bg: "bg-emerald-50", text: "text-emerald-800" },
  { bar: "bg-amber-500", border: "border-amber-500", bg: "bg-amber-50", text: "text-amber-800" },
  { bar: "bg-rose-500", border: "border-rose-500", bg: "bg-rose-50", text: "text-rose-800" },
  { bar: "bg-violet-500", border: "border-violet-500", bg: "bg-violet-50", text: "text-violet-800" },
  { bar: "bg-cyan-500", border: "border-cyan-500", bg: "bg-cyan-50", text: "text-cyan-800" },
  { bar: "bg-orange-500", border: "border-orange-500", bg: "bg-orange-50", text: "text-orange-800" },
  { bar: "bg-teal-500", border: "border-teal-500", bg: "bg-teal-50", text: "text-teal-800" },
];

function colorForSubject(subjectId) {
  if (!subjectId) return { bar: "bg-slate-400", border: "border-slate-400", bg: "bg-slate-50", text: "text-slate-600" };
  return COLOR_PALETTE[subjectId % COLOR_PALETTE.length];
}

function toMinutes(hhmm) {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
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
      className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-sm"
    >
      <h3 className="text-sm font-semibold text-slate-800">
        {form.id ? "Modifier le cours" : "Ajouter un cours"}
      </h3>

      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {error}
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs text-slate-500 mb-1">Jour</label>
          <select
            value={form.day_of_week}
            onChange={(e) => setForm({ ...form, day_of_week: Number(e.target.value) })}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
          >
            {DAYS.map((d) => (
              <option key={d.value} value={d.value}>
                {d.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs text-slate-500 mb-1">Matière</label>
          <select
            value={form.subject_id}
            onChange={(e) => setForm({ ...form, subject_id: e.target.value })}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
          >
            <option value="">— Aucune —</option>
            {allSubjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs text-slate-500 mb-1">Heure de début</label>
          <input
            type="time"
            value={form.start_time}
            onChange={(e) => setForm({ ...form, start_time: e.target.value })}
            min="08:00"
            max="17:00"
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="block text-xs text-slate-500 mb-1">Heure de fin</label>
          <input
            type="time"
            value={form.end_time}
            onChange={(e) => setForm({ ...form, end_time: e.target.value })}
            min="08:00"
            max="17:00"
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="block text-xs text-slate-500 mb-1">Salle (optionnel)</label>
          <input
            type="text"
            value={form.room}
            onChange={(e) => setForm({ ...form, room: e.target.value })}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="block text-xs text-slate-500 mb-1">Professeur (optionnel)</label>
          <input
            type="text"
            value={form.teacher}
            onChange={(e) => setForm({ ...form, teacher: e.target.value })}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
          />
        </div>
      </div>

      <div className="flex gap-2 justify-end pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm rounded-lg text-slate-600 hover:bg-slate-100"
        >
          Annuler
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="px-4 py-2 text-sm rounded-lg bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-60"
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
// temps papier / CDI.
// ───────────────────────────────────────────
function WeekView({ slots, isDeveloper, onSlotClick, onAddClick }) {
  const STEP = 30; // minutes
  const rowCount = (DAY_END_MIN - DAY_START_MIN) / STEP;
  const rows = Array.from({ length: rowCount }, (_, i) => DAY_START_MIN + i * STEP);

  const slotsByDay = (dayValue) => slots.filter((s) => s.day_of_week === dayValue);
  const rowStartFor = (minutes) => Math.round((minutes - DAY_START_MIN) / STEP) + 2; // +2 : ligne 1 = en-tête

  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden overflow-x-auto shadow-sm">
      <div
        className="grid min-w-[760px]"
        style={{
          gridTemplateColumns: "68px repeat(6, 1fr)",
          gridTemplateRows: `44px repeat(${rowCount}, 32px)`,
        }}
      >
        {/* Coin haut-gauche */}
        <div className="bg-[#141414]" style={{ gridColumn: 1, gridRow: 1 }} />

        {/* En-têtes des jours */}
        {DAYS.map((day, i) => (
          <div
            key={day.value}
            className="bg-[#141414] border-l border-white/10 flex flex-col items-center justify-center"
            style={{ gridColumn: i + 2, gridRow: 1 }}
          >
            <p className="text-white text-[11px] font-extrabold uppercase tracking-wide">
              {day.label}
            </p>
            {isDeveloper && (
              <button
                onClick={() => onAddClick(day.value)}
                className="text-[9px] text-sky-400 hover:text-sky-300 leading-none mt-0.5"
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
            className="bg-slate-50 border-b border-r border-slate-200 flex items-start justify-end pr-2 pt-0.5"
            style={{ gridColumn: 1, gridRow: i + 2 }}
          >
            {min % 60 === 0 && (
              <span className="text-[10px] font-bold text-slate-400">
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
              className="border-b border-r border-slate-100 last:border-r-0"
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
                  isDeveloper ? "cursor-pointer hover:brightness-95" : "cursor-default"
                }`}
                style={{ gridColumn: di + 2, gridRow: `${rowStart} / span ${rowSpan}` }}
              >
                <p className={`text-[10px] font-bold leading-tight truncate ${color.text}`}>
                  {slot.subject_name || "—"}
                </p>
                {rowSpan > 1 && (
                  <p className="text-[9px] text-slate-500 leading-tight truncate">
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

  return (
    <div className="max-w-xl mx-auto">
      {/* Navigation jour */}
      <div className="flex items-center justify-between mb-5 px-1">
        <button
          onClick={goPrev}
          aria-label="Jour précédent"
          className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 hover:bg-slate-200 active:opacity-70 transition"
        >
          ←
        </button>
        <div className="text-center">
          <p className="text-[10px] font-extrabold uppercase tracking-widest text-sky-500 mb-0.5">
            Emploi du temps
          </p>
          <p className="text-lg font-extrabold text-slate-800">{day.label}</p>
        </div>
        <button
          onClick={goNext}
          aria-label="Jour suivant"
          className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 hover:bg-slate-200 active:opacity-70 transition"
        >
          →
        </button>
      </div>

      {isDeveloper && (
        <button
          onClick={() => onAddClick(day.value)}
          className="w-full mb-4 text-xs font-semibold text-slate-500 border-2 border-dashed border-slate-200 rounded-xl py-2.5 hover:border-slate-300 hover:text-slate-700 transition"
        >
          + Ajouter un cours ce jour
        </button>
      )}

      {daySlots.length === 0 && (
        <p className="text-sm text-slate-300 italic text-center py-14">Aucun cours ce jour</p>
      )}

      {/* Liste des cours, façon cartes d'appli */}
      <div className="space-y-3">
        {daySlots.map((slot) => {
          const color = colorForSubject(slot.subject_id);
          const initials = getInitials(slot.subject_name);
          return (
            <button
              key={slot.id}
              onClick={() => isDeveloper && onSlotClick(slot)}
              disabled={!isDeveloper}
              className={`w-full flex items-center gap-3 bg-white rounded-2xl border border-slate-100 shadow-sm px-4 py-3.5 text-left transition ${
                isDeveloper
                  ? "cursor-pointer hover:shadow-md hover:border-slate-200"
                  : "cursor-default"
              }`}
            >
              <div
                className={`w-11 h-11 shrink-0 rounded-xl flex items-center justify-center ${color.bar}`}
              >
                <span className="text-white text-sm font-extrabold">{initials}</span>
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-[15px] font-bold text-slate-800 truncate">
                  {slot.subject_name || "—"}
                </p>
                {slot.teacher ? (
                  <p className="text-xs text-slate-400 truncate">{slot.teacher}</p>
                ) : (
                  <p className="text-xs text-slate-300 italic">Professeur non renseigné</p>
                )}
              </div>

              <div className="text-right shrink-0">
                <p className="text-xs font-bold text-slate-700">{slot.start_time}</p>
                <p className="text-[10px] text-slate-400">{slot.end_time}</p>
                {slot.room && (
                  <span className="inline-block mt-1 text-[10px] font-semibold text-slate-500 bg-slate-100 rounded-full px-2 py-0.5">
                    Salle {slot.room}
                  </span>
                )}
              </div>
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
  const [dayIndex, setDayIndex] = useState(0);

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
    <div className="min-h-screen bg-slate-50">
      <header className="bg-[#141414] px-5 pt-9 pb-5 flex items-center gap-4">
        <button
          onClick={onBack}
          aria-label="Retour"
          className="w-10 h-10 rounded-full border-2 border-white flex items-center justify-center active:opacity-70 transition shrink-0"
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
          <p className="text-white/40 text-xs font-medium mt-0.5">08h00 — 17h00</p>
        </div>
      </header>

      <div className="bg-white px-4 sm:px-6 pt-4 pb-3 border-b border-slate-100">
        <div className="max-w-xl mx-auto flex bg-slate-100 rounded-xl p-1">
          <button
            onClick={() => setView("day")}
            className={`flex-1 py-2.5 rounded-lg text-sm font-extrabold uppercase tracking-wide transition-colors ${
              view === "day" ? "bg-[#141414] text-white shadow" : "text-slate-500"
            }`}
          >
            Vue Jour
          </button>
          <button
            onClick={() => setView("week")}
            className={`flex-1 py-2.5 rounded-lg text-sm font-extrabold uppercase tracking-wide transition-colors ${
              view === "week" ? "bg-[#141414] text-white shadow" : "text-slate-500"
            }`}
          >
            Vue Semaine
          </button>
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-6 py-8 space-y-6">
        {loading && <p className="text-sm text-slate-500">Chargement...</p>}
        {error && (
          <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {error}
          </div>
        )}

        {!loading && !error && (
          <>
            {!isDeveloper && (
              <p className="text-xs text-slate-400">
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
                    className="text-xs text-red-500 hover:underline"
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
