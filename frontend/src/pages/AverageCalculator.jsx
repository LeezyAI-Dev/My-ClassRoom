import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import AuroraBackground from "../components/ui/AuroraBackground";
import PageHeader from "../components/ui/PageHeader";
import { CalcIcon, ResetIcon } from "../components/ui/Icons";

// ───────────────────────────────────────────────────────────
// Matières + coefficients
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

// Nouvelle clé de stockage (v2) : le calculateur repart de zéro. Les anciennes notes
// « semestre 1 / semestre 2 » (clé sans v2) restent sur le téléphone mais ne sont plus lues.
function storageKey(username) {
  return `myclassroom_average_v2_${username || "guest"}`;
}

function loadStoredNotes(username) {
  try {
    const raw = localStorage.getItem(storageKey(username));
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

// ───────────────────────────────────────────────────────────
// Une ligne matière : badge coefficient + nom à gauche, champ de note à droite
// ───────────────────────────────────────────────────────────
function SubjectRow({ subject, value, onChange, isLast }) {
  const handleChange = (e) => {
    const raw = e.target.value.replace(",", ".");
    if (raw === "") {
      onChange(subject.key, "");
      return;
    }
    if (!/^\d{0,2}(\.\d{0,2})?$/.test(raw)) return;
    const num = Number(raw);
    if (Number.isNaN(num) || num > 20) return;
    onChange(subject.key, raw);
  };

  const filled = value !== "" && value !== undefined && value !== null;

  return (
    <div
      className={`flex items-center justify-between gap-3 py-3 px-1 ${
        isLast ? "" : "border-b border-white/10"
      }`}
    >
      <div className="flex min-w-0 flex-1 items-center gap-2.5">
        <span
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-brand-gradient text-[11px] font-bold text-white"
          title={`Coefficient ${subject.coef}`}
          aria-label={`Coefficient ${subject.coef}`}
        >
          {subject.coef}
        </span>
        <span className="text-[15px] font-semibold leading-tight text-white">{subject.label}</span>
      </div>

      <input
        type="text"
        inputMode="decimal"
        value={value === undefined ? "" : value}
        onChange={handleChange}
        placeholder="—"
        aria-label={`Note de ${subject.label} sur 20`}
        className={`h-12 w-16 shrink-0 rounded-xl border-2 text-center font-bold text-white outline-none transition-colors ${
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
    <section className="mb-5">
      <div className="mb-2 flex items-center gap-2 px-1">
        <span className={`h-4 w-1.5 rounded-full ${accent}`} aria-hidden="true" />
        <h2 className="text-[13px] font-extrabold uppercase tracking-wide text-white/70">{title}</h2>
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
    </section>
  );
}

// ───────────────────────────────────────────────────────────
// Page : un seul calculateur de moyenne
// ───────────────────────────────────────────────────────────
export default function AverageCalculator() {
  const { user } = useAuth();
  const username = user?.username;

  const [notes, setNotes] = useState(() => loadStoredNotes(username));

  useEffect(() => {
    try {
      localStorage.setItem(storageKey(username), JSON.stringify(notes));
    } catch {
      /* stockage indisponible : on ignore silencieusement */
    }
  }, [notes, username]);

  const handleChangeNote = (key, value) => {
    setNotes((prev) => ({ ...prev, [key]: value }));
  };

  // Remet toutes les notes à zéro, après confirmation.
  const handleReset = () => {
    if (Object.keys(notes).length === 0) return;
    if (!window.confirm("Réinitialiser toutes les notes ? Cette action est irréversible.")) return;
    setNotes({});
  };

  // Moyenne pondérée : somme(note × coefficient) / somme(coefficients des matières remplies)
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
  const average = totalCoef > 0 ? total / totalCoef : null;

  return (
    <div className="relative isolate min-h-screen bg-ink">
      <AuroraBackground />
      <PageHeader
        title="Calculateur de moyenne"
        subtitle="Moyenne sur 20"
        icon={<CalcIcon size={24} />}
        tone="blue"
        right={
          <button
            type="button"
            onClick={handleReset}
            aria-label="Réinitialiser toutes les notes"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/[0.08] text-white transition active:bg-white/20 motion-reduce:transition-none"
          >
            <ResetIcon size={20} />
          </button>
        }
      />

      <main className="pb-nav mx-auto max-w-xl px-5 pt-1">
        <SectionCard
          title="Matières générales"
          accent="bg-violet-400"
          subjects={GENERALES}
          notes={notes}
          onChangeNote={handleChangeNote}
        />
        <SectionCard
          title="Matières techniques"
          accent="bg-fuchsia-400"
          subjects={TECHNIQUES}
          notes={notes}
          onChangeNote={handleChangeNote}
        />

        <div
          role="status"
          aria-live="polite"
          className="flex items-center justify-between rounded-3xl border border-white/10 bg-gradient-to-br from-[#7c3aed] to-[#2a0d5c] px-6 py-6 shadow-glow"
        >
          <div>
            <p className="mb-1 text-[11px] font-bold uppercase tracking-widest text-white/70">Moyenne générale</p>
            <p className="text-lg font-extrabold uppercase text-white">Sur 20 points</p>
          </div>
          <span className="text-3xl font-extrabold text-white">{average !== null ? average.toFixed(2) : "—"}</span>
        </div>
      </main>
    </div>
  );
}
