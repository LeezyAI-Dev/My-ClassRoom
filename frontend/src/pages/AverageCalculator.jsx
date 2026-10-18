import React, { useEffect, useRef, useState } from "react";
import { useAuth } from "../context/AuthContext";
import AuroraBackground from "../components/ui/AuroraBackground";
import PageHeader from "../components/ui/PageHeader";
import { CalcIcon, ResetIcon } from "../components/ui/Icons";

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
        isLast ? "" : "border-b border-white/10"
      }`}
    >
      <div className="flex items-center gap-2.5 min-w-0 flex-1">
        <span
          className="w-7 h-7 shrink-0 rounded-lg bg-brand-gradient text-white text-[11px] font-bold flex items-center justify-center"
          title={`Coefficient ${subject.coef}`}
        >
          {subject.coef}
        </span>
        <span className="text-[14px] sm:text-[15px] font-semibold text-white leading-tight">
          {subject.label}
        </span>
      </div>

      <input
        type="text"
        inputMode="decimal"
        value={value === undefined ? "" : value}
        onChange={handleChange}
        placeholder="—"
        aria-label={`Note de ${subject.label}`}
        className={`w-16 h-12 shrink-0 rounded-xl border-2 text-center font-bold text-white outline-none transition-colors ${
          filled
            ? "border-violet-400 bg-violet-500/20"
            : "border-white/15 bg-white/[0.06] focus:border-violet-400"
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
        <h3 className="text-[13px] font-extrabold uppercase tracking-wide text-white/70">
          {title}
        </h3>
      </div>
      <div className="card px-4">
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
    <div className="w-full h-full overflow-y-auto px-5 pt-2 pb-nav">
      <div className="max-w-xl mx-auto">
        <SectionCard
          title="Matières générales"
          accent="bg-violet-400"
          subjects={GENERALES}
          notes={notes}
          onChangeNote={onChangeNote}
        />
        <SectionCard
          title="Matières techniques"
          accent="bg-fuchsia-400"
          subjects={TECHNIQUES}
          notes={notes}
          onChangeNote={onChangeNote}
        />

        <div className="bg-gradient-to-br from-[#7c3aed] to-[#2a0d5c] border border-white/10 rounded-2xl px-6 py-6 flex items-center justify-between shadow-glow-sm">
          <div>
            <p
              className="text-white/60 text-[11px] font-bold uppercase tracking-widest mb-1"
            >
              Moyenne générale
            </p>
            <h2
              className="text-white text-lg font-extrabold uppercase"
            >
              Sur 20 points
            </h2>
          </div>
          <span
            className="text-3xl font-extrabold text-white"
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
    <div className="relative isolate min-h-screen bg-ink flex flex-col">
      <AuroraBackground />
      <PageHeader
        title="Moyenne"
        subtitle="Calculateur sur 20"
        icon={<CalcIcon size={24} />}
        tone="blue"
        right={
          <button
            type="button"
            onClick={handleResetAll}
            aria-label="Réinitialiser toutes les notes"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/[0.08] text-white transition active:bg-white/20 motion-reduce:transition-none"
          >
            <ResetIcon size={20} />
          </button>
        }
      />

      {/* Sélecteur de semestre (toujours visible) */}
      <div className="px-5 pb-3 shrink-0">
        <div className="seg mx-auto max-w-xl" role="tablist" aria-label="Semestre">
          <button
            type="button"
            role="tab"
            aria-selected={semester === 1}
            onClick={() => goTo(1)}
            className={`seg-item ${semester === 1 ? "seg-item-on" : ""}`}
          >
            Semestre 1
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={semester === 2}
            onClick={() => goTo(2)}
            className={`seg-item ${semester === 2 ? "seg-item-on" : ""}`}
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
