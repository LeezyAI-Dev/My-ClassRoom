import React, { useEffect, useRef, useState } from "react";
import { useAuth } from "../context/AuthContext";

// ───────────────────────────────────────────────────────────
// Configuration des matières + coefficients (directives Chris)
// ───────────────────────────────────────────────────────────
const GENERALE_LEFT = [
  { key: "math", label: "MATHEMATIQUES", coef: 2 },
  { key: "francais", label: "FRANÇAIS", coef: 2 },
  { key: "cmc", label: "CMC", coef: 1 },
  { key: "legislation", label: "LEGISLATION", coef: 1 },
  { key: "edhc", label: "EDHC", coef: 2 },
];
const GENERALE_RIGHT = [
  { key: "pchimie", label: "P.CHIMIE", coef: 2 },
  { key: "eps", label: "EPS", coef: 1 },
  { key: "anglais", label: "ANGLAIS", coef: 2 },
  { key: "conduite", label: "CONDUITE", coef: 1 },
];

const TECHNIQUE_LEFT = [
  { key: "photogravure", label: "PHOTOGRAVURE", coef: 4 },
  { key: "impression", label: "IMPRESSION", coef: 4 },
  { key: "pao", label: "P.A.O", coef: 4 },
];
const TECHNIQUE_RIGHT = [
  { key: "faconnage", label: "FAÇONNAGE", coef: 1 },
  { key: "fabrication", label: "FABRICATION", coef: 3 },
  { key: "maquette", label: "MAQUETTE", coef: 2 },
];

const ALL_SUBJECTS = [...GENERALE_LEFT, ...GENERALE_RIGHT, ...TECHNIQUE_LEFT, ...TECHNIQUE_RIGHT];

const EMPTY_NOTES = {};

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
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
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

function ChevronIcon({ flipped }) {
  return (
    <svg
      width="26"
      height="26"
      viewBox="0 0 24 24"
      fill="none"
      style={{ transform: flipped ? "rotate(180deg)" : "none", transition: "transform 250ms ease" }}
    >
      <path
        d="M9 5l6 7-6 7"
        stroke="white"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M4 5l6 7-6 7"
        stroke="white"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.55"
      />
    </svg>
  );
}

// ───────────────────────────────────────────────────────────
// Une ligne matière : pastille coef · pilule nom · cercle note
// ───────────────────────────────────────────────────────────
function SubjectRow({ subject, value, onChange }) {
  const handleChange = (e) => {
    let raw = e.target.value.replace(",", ".");
    if (raw === "") {
      onChange(subject.key, "");
      return;
    }
    const num = Number(raw);
    if (Number.isNaN(num)) return;
    const clamped = Math.max(0, Math.min(20, num));
    onChange(subject.key, raw.endsWith(".") ? raw : clamped);
  };

  const filled = value !== "" && value !== undefined && value !== null;

  return (
    <div className="flex items-center gap-2.5">
      <div
        className="w-8 h-8 shrink-0 rounded-full bg-[#141414] flex items-center justify-center"
        title={`Coefficient ${subject.coef}`}
      >
        <span className="text-white text-[11px] font-extrabold">{subject.coef}</span>
      </div>

      <div className="flex-1 min-w-0 h-11 rounded-full border-[2.5px] border-[#141414] flex items-center px-4">
        <span className="text-[11px] sm:text-xs font-bold text-[#141414] truncate uppercase tracking-wide">
          {subject.label}
        </span>
      </div>

      <div
        className={`w-11 h-11 shrink-0 rounded-full border-[2.5px] flex items-center justify-center transition-colors ${
          filled ? "border-sky-500 bg-sky-50" : "border-[#141414] bg-white"
        }`}
      >
        <input
          type="text"
          inputMode="decimal"
          value={value === undefined ? "" : value}
          onChange={handleChange}
          placeholder="—"
          className="w-full h-full text-center bg-transparent outline-none text-sm font-bold text-[#141414] placeholder:text-slate-300"
        />
      </div>
    </div>
  );
}

// ───────────────────────────────────────────────────────────
// Contenu d'un semestre (2 blocs de matières + moyenne)
// ───────────────────────────────────────────────────────────
function SemesterPanel({ notes, onChangeNote, average }) {
  return (
    <div className="w-full h-full overflow-y-auto px-5 pt-6 pb-6">
      <div className="rounded-[28px] border-[2.5px] border-[#141414] px-5 py-6 mb-6">
        <div className="grid grid-cols-2 gap-x-5 gap-y-4">
          <div className="space-y-4">
            {GENERALE_LEFT.map((s) => (
              <SubjectRow key={s.key} subject={s} value={notes[s.key]} onChange={onChangeNote} />
            ))}
          </div>
          <div className="space-y-4">
            {GENERALE_RIGHT.map((s) => (
              <SubjectRow key={s.key} subject={s} value={notes[s.key]} onChange={onChangeNote} />
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-[28px] border-[2.5px] border-[#141414] px-5 py-6 mb-6">
        <div className="grid grid-cols-2 gap-x-5 gap-y-4">
          <div className="space-y-4">
            {TECHNIQUE_LEFT.map((s) => (
              <SubjectRow key={s.key} subject={s} value={notes[s.key]} onChange={onChangeNote} />
            ))}
          </div>
          <div className="space-y-4">
            {TECHNIQUE_RIGHT.map((s) => (
              <SubjectRow key={s.key} subject={s} value={notes[s.key]} onChange={onChangeNote} />
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-[28px] border-[2.5px] border-[#141414] px-6 py-6 flex items-center justify-between">
        <h2
          className="text-2xl font-extrabold text-[#141414] uppercase"
          style={{ fontFamily: "'Baloo 2', sans-serif" }}
        >
          Moyenne :
        </h2>
        <span
          className="text-2xl font-extrabold text-sky-500"
          style={{ fontFamily: "'Baloo 2', sans-serif" }}
        >
          {average !== null ? `${average.toFixed(2)} / 20` : ""}
        </span>
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

  const goTo = (target) => {
    setSemester(target);
  };

  const toggleSemester = () => goTo(semester === 1 ? 2 : 1);

  // ── Swipe tactile ──
  const onTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
    trackWidth.current = containerRef.current?.offsetWidth || 1;
    setDragging(true);
  };

  const onTouchMove = (e) => {
    if (touchStartX.current === null) return;
    const delta = e.touches[0].clientX - touchStartX.current;
    // Empêche de "tirer" au-delà des bords (semestre 1 -> gauche, semestre 2 -> droite)
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
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <header className="bg-[#141414] px-5 pt-9 pb-6 flex items-center gap-4">
        <button
          onClick={onBack}
          aria-label="Retour"
          className="w-10 h-10 rounded-full border-2 border-white flex items-center justify-center active:opacity-70 transition shrink-0"
        >
          <BackIcon />
        </button>
        <h1
          className="text-white leading-[0.92] text-[1.5rem]"
          style={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 800 }}
        >
          <span className="block">CALCULATEUR DE</span>
          <span className="block">
            M<span className="text-sky-400">OY</span>ENNE
          </span>
        </h1>
      </header>

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

      {/* Barre du bas : indicateur + navigation semestre */}
      <div className="bg-[#141414] px-6 py-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => semester === 2 && toggleSemester()}
            className={`text-white font-extrabold text-lg tracking-wide transition-opacity ${
              semester === 1 ? "opacity-100" : "opacity-40"
            }`}
            style={{ fontFamily: "'Baloo 2', sans-serif" }}
          >
            SEMESTRE 1
          </button>
          <span className="text-white/30">/</span>
          <button
            onClick={() => semester === 1 && toggleSemester()}
            className={`text-white font-extrabold text-lg tracking-wide transition-opacity ${
              semester === 2 ? "opacity-100" : "opacity-40"
            }`}
            style={{ fontFamily: "'Baloo 2', sans-serif" }}
          >
            SEMESTRE 2
          </button>
        </div>

        <button
          onClick={toggleSemester}
          aria-label="Changer de semestre"
          className="w-14 h-14 rounded-full bg-[#1c1c1c] border-2 border-white/20 flex items-center justify-center active:opacity-70 transition shrink-0"
        >
          <ChevronIcon flipped={semester === 2} />
        </button>
      </div>
    </div>
  );
}
