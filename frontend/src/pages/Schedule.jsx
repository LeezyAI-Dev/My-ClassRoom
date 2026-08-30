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
// VUE SEMAINE — grille avec jours en colonnes, horaires en lignes
// ───────────────────────────────────────────
function WeekView({ slots, isDeveloper, onSlotClick, onAddClick }) {
  const totalMinutes = DAY_END_MIN - DAY_START_MIN;

  const slotsByDay = (dayValue) => slots.filter((s) => s.day_of_week === dayValue);

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden overflow-x-auto">
      <div className="grid min-w-[720px]" style={{ gridTemplateColumns: "56px repeat(6, 1fr)" }}>
        {/* En-tête */}
        <div className="border-b border-r border-slate-200 bg-slate-50" />
        {DAYS.map((day) => (
          <div
            key={day.value}
            className="border-b border-r border-slate-200 bg-slate-50 px-2 py-2 text-center"
          >
            <p className="text-xs font-semibold text-slate-700">{day.label}</p>
            {isDeveloper && (
              <button
                onClick={() => onAddClick(day.value)}
                className="text-[10px] text-slate-400 hover:text-slate-800 mt-0.5"
              >
                + cours
              </button>
            )}
          </div>
        ))}

        {/* Colonne des heures */}
        <div className="relative border-r border-slate-200" style={{ height: "600px" }}>
          {HOUR_MARKS.map((h) => {
            const topPct = ((h * 60 - DAY_START_MIN) / totalMinutes) * 100;
            return (
              <div
                key={h}
                className="absolute -translate-y-1/2 text-[10px] text-slate-400 pr-1 w-full text-right"
                style={{ top: `${topPct}%` }}
              >
                {String(h).padStart(2, "0")}:00
              </div>
            );
          })}
        </div>

        {/* Colonnes des jours */}
        {DAYS.map((day) => (
          <div
            key={day.value}
            className="relative border-r border-slate-200"
            style={{ height: "600px" }}
          >
            {HOUR_MARKS.map((h) => {
              const topPct = ((h * 60 - DAY_START_MIN) / totalMinutes) * 100;
              return (
                <div
                  key={h}
                  className="absolute w-full border-t border-slate-100"
                  style={{ top: `${topPct}%` }}
                />
              );
            })}

            {slotsByDay(day.value).map((slot) => {
              const start = toMinutes(slot.start_time);
              const end = toMinutes(slot.end_time);
              const top = ((start - DAY_START_MIN) / totalMinutes) * 100;
              const height = ((end - start) / totalMinutes) * 100;
              const color = colorForSubject(slot.subject_id);

              return (
                <button
                  key={slot.id}
                  onClick={() => isDeveloper && onSlotClick(slot)}
                  className={`absolute left-0.5 right-0.5 ${color.bg} border-l-4 ${color.border} rounded-md px-1.5 py-1 overflow-hidden text-left ${
                    isDeveloper ? "cursor-pointer hover:brightness-95" : "cursor-default"
                  }`}
                  style={{ top: `${top}%`, height: `${height}%`, minHeight: "18px" }}
                  disabled={!isDeveloper}
                >
                  <p className={`text-[10px] font-semibold leading-tight ${color.text}`}>
                    {slot.subject_name || "—"}
                  </p>
                  <p className="text-[9px] text-slate-500 leading-tight">
                    {slot.start_time}-{slot.end_time}
                  </p>
                  {slot.room && (
                    <p className="text-[9px] text-slate-400 leading-tight">{slot.room}</p>
                  )}
                </button>
              );
            })}
          </div>
        ))}
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
    <div className="bg-white border border-slate-200 rounded-xl p-4 max-w-xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <button onClick={goPrev} className="text-slate-400 hover:text-slate-800 px-2">
          ←
        </button>
        <p className="text-sm font-semibold text-slate-800">{day.label}</p>
        <button onClick={goNext} className="text-slate-400 hover:text-slate-800 px-2">
          →
        </button>
      </div>

      {isDeveloper && (
        <button
          onClick={() => onAddClick(day.value)}
          className="w-full mb-4 text-xs text-slate-500 border border-dashed border-slate-300 rounded-lg py-2 hover:border-slate-400 hover:text-slate-800"
        >
          + Ajouter un cours ce jour
        </button>
      )}

      {daySlots.length === 0 && (
        <p className="text-sm text-slate-300 italic text-center py-6">Aucun cours ce jour</p>
      )}

      <div className="space-y-3">
        {daySlots.map((slot) => {
          const color = colorForSubject(slot.subject_id);
          return (
            <div key={slot.id} className="flex gap-3">
              <div className="w-14 shrink-0 text-right">
                <p className="text-xs font-medium text-slate-700">{slot.start_time}</p>
                <p className="text-[10px] text-slate-400">{slot.end_time}</p>
              </div>
              <div className={`w-1 rounded-full ${color.bar}`} />
              <button
                onClick={() => isDeveloper && onSlotClick(slot)}
                disabled={!isDeveloper}
                className={`flex-1 text-left ${color.bg} rounded-lg px-3 py-2 ${
                  isDeveloper ? "cursor-pointer hover:brightness-95" : "cursor-default"
                }`}
              >
                <p className={`text-sm font-semibold ${color.text}`}>
                  {slot.subject_name || "—"}
                </p>
                {slot.teacher && <p className="text-xs text-slate-500">{slot.teacher}</p>}
                {slot.room && <p className="text-xs text-slate-400">Salle {slot.room}</p>}
              </button>
            </div>
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
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="text-sm text-slate-500 hover:text-slate-800">
            ← Retour
          </button>
          <div>
            <h1 className="text-lg font-semibold text-slate-800">Emploi du temps</h1>
            <p className="text-xs text-slate-500">08:00 — 17:00</p>
          </div>
        </div>

        <div className="flex bg-slate-100 rounded-lg p-1">
          <button
            onClick={() => setView("day")}
            className={`px-3 py-1.5 text-xs rounded-md transition ${
              view === "day" ? "bg-white shadow text-slate-900 font-medium" : "text-slate-500"
            }`}
          >
            Vue Jour
          </button>
          <button
            onClick={() => setView("week")}
            className={`px-3 py-1.5 text-xs rounded-md transition ${
              view === "week" ? "bg-white shadow text-slate-900 font-medium" : "text-slate-500"
            }`}
          >
            Vue Semaine
          </button>
        </div>
      </header>

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
