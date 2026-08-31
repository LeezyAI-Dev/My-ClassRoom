import React, { useEffect, useRef, useState } from "react";
import { useAuth } from "../context/AuthContext";

// ───────────────────────────────────────────────────────────
// Configuration des matières + coefficients (directives Chris)
// ───────────────────────────────────────────────────────────
const GENERALES = [
  { key: "math", label: "Mathématiques", coef: 2 },
  { key: "francais", label: "Français", coef: 2 },
  { key: "cmc", label: "CMC", coef: 1 },
  { key: "legislation", label: "Législation", coef: 1 },
  { key: "edhc", label: "EDHC", coef: 2 },
  { key: "pchimie", label: "P.Chimie", coef: 2 },
  { key: "eps", label: "EPS", coef: 1 },
  { key: "anglais", label: "Anglais", coef: 2 },
  { key: "conduite", label: "Conduite", coef: 1 },
];

const TECHNIQUES = [
  { key: "photogravure", label: "Photogravure", coef: 4 },
  { key: "impression", label: "Impression", coef: 4 },
  { key: "pao", label: "P.A.O", coef: 4 },
  { key: "faconnage", label: "Façonnage", coef: 1 },
  { key: "fabrication", label: "Fabrication", coef: 3 },
  { key: "maquette", label: "Maquette", coef: 2 },
];

const ALL_SUBJECTS = [...GENERALES, ...TECHNIQUES];
const EMPTY_NOTES = {};
const EMPTY_ALL_NOTES = { 1: {}, 2: {} };

function storageKey(username) {
  return `myclassroom_average_${username || "guest"}`;
}

function loadStoredNotes(username) {
  try {
    const raw = localStorage.getItem(storageKey(username));
    if (!raw) return { 1: {}, 2: {} };
    const parsed = JSON.parse(raw);
    return { 1: parsed[1] || {}, 2: parsed[2] || {} };
  } catch {
    return { 1: {}, 2: {} };
  }
}

// ───────────────────────────────────────────────────────────
// Icônes
// ───────────────────────────────────────────────────────────
function BackIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path
        d="M15 5L8 12L15 19"
        stroke="white"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ResetIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path
        d="M4 4v5h5"
        stroke="white"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M4.6 13a8 8 0 1 0 2.3-7.5L4 9"
        stroke="white"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// ───────────────────────────────────────────────────────────
// Une ligne matière : nom + badge coefficient à gauche,
// champ de note à droite. Pleine largeur => le nom ne coupe jamais.
// ───────────────────────────────────────────────────────────
function SubjectRow({ subject, value, onChange, isLast }) {
  const handleChange = (e) => {
    let raw = e.target.value.replace(",", ".");
    if (raw === "") {
      onChange(subject.key, "");
      return;
    }
    if (!/^\d{0,2}(\.\d{0,2})?$/.test(raw)) return;
    const num = Number(raw);
    if (Number.isNaN(num)) return;
    if (num > 20) return;
    onChange(subject.key, raw);
  };

  const filled = value !== "" && value !== undefined && value !== null;

  return (
    <div
      className={`flex items-center justify-between gap-3 py-3 px-1 ${
        isLast ? "" : "border-b border-slate-100"
      }`}
    >
      <div className="flex items-center gap-2.5 min-w-0 flex-1">
        <span
          className="w-7 h-7 shrink-0 rounded-lg bg-[#141414] text-white text-[11px] font-bold flex items-center justify-center"
          title={`Coefficient ${subject.coef}`}
        >
          {subject.coef}
        </span>
        <span className="text-[14px] sm:text-[15px] font-semibold text-[#1c1c1c] leading-tight">
          {subject.label}
        </span>
      </div>

      <input
        type="text"
        inputMode="decimal"
        value={value === undefined ? "" : value}
        onChange={handleChange}
        placeholder="—"
        className={`w-16 h-11 shrink-0 rounded-xl border-2 text-center font-bold text-[#141414] outline-none transition-colors ${
          filled
            ? "border-sky-400 bg-sky-50"
            : "border-slate-200 bg-slate-50 focus:border-slate-400"
        }`}
      />
    </div>
  );
}

function SectionCard({ title, accent, subjects, notes, onChangeNote }) {
  return (
    <div className="mb-5">
      <div className="flex items-center gap-2 mb-2 px-1">
        <span className={`w-1.5 h-4 rounded-full ${accent}`} />
        <h3 className="text-[13px] font-extrabold uppercase tracking-wide text-slate-500">
          {title}
        </h3>
      </div>
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm px-4">
        {subjects.map((s, i) => (
          <SubjectRow
            key={s.key}
            subject={s}
            value={notes[s.key]}
            onChange={onChangeNote}
            isLast={i === subjects.length - 1}
          />
        ))}
      </div>
    </div>
  );
}

// ───────────────────────────────────────────────────────────
// Contenu d'un semestre
// ───────────────────────────────────────────────────────────
function SemesterPanel({ notes, onChangeNote, average }) {
  return (
    <div className="w-full h-full overflow-y-auto px-4 sm:px-6 pt-4 pb-8">
      <div className="max-w-xl mx-auto">
        <SectionCard
          title="Matières générales"
          accent="bg-sky-400"
          subjects={GENERALES}
          notes={notes}
          onChangeNote={onChangeNote}
        />
        <SectionCard
          title="Matières techniques"
          accent="bg-[#141414]"
          subjects={TECHNIQUES}
          notes={notes}
          onChangeNote={onChangeNote}
        />

        <div className="bg-[#141414] rounded-2xl px-6 py-6 flex items-center justify-between">
          <div>
            <p
              className="text-white/50 text-[11px] font-bold uppercase tracking-widest mb-1"
            >
              Moyenne générale
            </p>
            <h2
              className="text-white text-lg font-extrabold uppercase"
              style={{ fontFamily: "'Baloo 2', sans-serif" }}
            >
              Sur 20 points
            </h2>
          </div>
          <span
            className="text-3xl font-extrabold text-sky-400"
            style={{ fontFamily: "'Baloo 2', sans-serif" }}
          >
            {average !== null ? average.toFixed(2) : "—"}
          </span>
        </div>
      </div>
    </div>
  );
}

// ───────────────────────────────────────────────────────────
// Page principale
// ───────────────────────────────────────────────────────────
export default function AverageCalculator({ onBack }) {
  const { user } = useAuth();
  const username = user?.username;

  const [semester, setSemester] = useState(1);
  const [notesByS, setNotesByS] = useState(() => loadStoredNotes(username));

  // Drag / swipe
  const [dragOffset, setDragOffset] = useState(0);
  const [dragging, setDragging] = useState(false);
  const touchStartX = useRef(null);
  const trackWidth = useRef(0);
  const containerRef = useRef(null);

  useEffect(() => {
    try {
      localStorage.setItem(storageKey(username), JSON.stringify(notesByS));
    } catch {
      /* stockage indisponible : on ignore silencieusement */
    }
  }, [notesByS, username]);

  const handleChangeNote = (key, value) => {
    setNotesByS((prev) => ({
      ...prev,
      [semester]: { ...prev[semester], [key]: value },
    }));
  };

  // Remet toutes les notes (semestre 1 ET semestre 2) à zéro, après confirmation.
  const handleResetAll = () => {
    const hasAnyNote =
      Object.keys(notesByS[1] || {}).length > 0 || Object.keys(notesByS[2] || {}).length > 0;
    if (!hasAnyNote) return;

    if (!window.confirm("Réinitialiser toutes les notes des deux semestres ? Cette action est irréversible.")) {
      return;
    }
    setNotesByS(EMPTY_ALL_NOTES);
  };

  const computeAverage = (notes) => {
    let total = 0;
    let totalCoef = 0;
    ALL_SUBJECTS.forEach((s) => {
      const raw = notes[s.key];
      if (raw === "" || raw === undefined || raw === null) return;
      const num = Number(raw);
      if (Number.isNaN(num)) return;
      total += num * s.coef;
      totalCoef += s.coef;
    });
    return totalCoef > 0 ? total / totalCoef : null;
  };

  const average1 = computeAverage(notesByS[1] || EMPTY_NOTES);
  const average2 = computeAverage(notesByS[2] || EMPTY_NOTES);

  const goTo = (target) => setSemester(target);

  // ── Swipe tactile ──
  const onTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
    trackWidth.current = containerRef.current?.offsetWidth || 1;
    setDragging(true);
  };

  const onTouchMove = (e) => {
    if (touchStartX.current === null) return;
    const delta = e.touches[0].clientX - touchStartX.current;
    if (semester === 1 && delta > 0) {
      setDragOffset(delta * 0.35);
    } else if (semester === 2 && delta < 0) {
      setDragOffset(delta * 0.35);
    } else {
      setDragOffset(delta);
    }
  };

  const onTouchEnd = () => {
    const threshold = trackWidth.current * 0.18;
    if (dragOffset < -threshold && semester === 1) {
      goTo(2);
    } else if (dragOffset > threshold && semester === 2) {
      goTo(1);
    }
    setDragOffset(0);
    setDragging(false);
    touchStartX.current = null;
  };

  const baseTranslate = semester === 1 ? 0 : -50;
  const dragPct = trackWidth.current ? (dragOffset / trackWidth.current) * 100 : 0;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="bg-[#141414] px-5 pt-9 pb-5 flex items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-4 min-w-0">
          <button
            onClick={onBack}
            aria-label="Retour"
            className="w-10 h-10 rounded-full border-2 border-white flex items-center justify-center active:opacity-70 transition shrink-0"
          >
            <BackIcon />
          </button>
          <h1
            className="text-white text-[1.15rem] sm:text-[1.5rem] truncate"
            style={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 800 }}
          >
            Calculateur de m<span className="text-sky-400">oy</span>enne
          </h1>
        </div>

        <button
          onClick={handleResetAll}
          aria-label="Réinitialiser toutes les notes"
          title="Réinitialiser toutes les notes"
          className="w-10 h-10 rounded-full border-2 border-white flex items-center justify-center active:opacity-70 transition shrink-0"
        >
          <ResetIcon />
        </button>
      </header>

      {/* Sélecteur de semestre (segmented control, toujours visible) */}
      <div className="bg-white px-4 sm:px-6 pt-4 pb-3 shrink-0 border-b border-slate-100">
        <div className="max-w-xl mx-auto flex bg-slate-100 rounded-xl p-1">
          <button
            onClick={() => goTo(1)}
            className={`flex-1 py-2.5 rounded-lg text-sm font-extrabold uppercase tracking-wide transition-colors ${
              semester === 1 ? "bg-[#141414] text-white shadow" : "text-slate-500"
            }`}
          >
            Semestre 1
          </button>
          <button
            onClick={() => goTo(2)}
            className={`flex-1 py-2.5 rounded-lg text-sm font-extrabold uppercase tracking-wide transition-colors ${
              semester === 2 ? "bg-[#141414] text-white shadow" : "text-slate-500"
            }`}
          >
            Semestre 2
          </button>
        </div>
      </div>

      {/* Zone swipeable */}
      <div
        ref={containerRef}
        className="flex-1 relative overflow-hidden"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <div
          className="flex h-full"
          style={{
            width: "200%",
            transform: `translateX(${baseTranslate + dragPct}%)`,
            transition: dragging ? "none" : "transform 320ms cubic-bezier(0.22, 1, 0.36, 1)",
          }}
        >
          <div className="w-1/2 h-full">
            <SemesterPanel
              notes={notesByS[1] || EMPTY_NOTES}
              onChangeNote={handleChangeNote}
              average={average1}
            />
          </div>
          <div className="w-1/2 h-full">
            <SemesterPanel
              notes={notesByS[2] || EMPTY_NOTES}
              onChangeNote={handleChangeNote}
              average={average2}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
