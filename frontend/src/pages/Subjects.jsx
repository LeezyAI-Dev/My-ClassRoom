import React, { useEffect, useState } from "react";
import { fetchSubjects } from "../api";
import SubjectResourcePanel from "../components/SubjectResourcePanel";
import AuroraBackground from "../components/ui/AuroraBackground";
import GradientButton from "../components/ui/GradientButton";

function BackArrowIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
      <path
        d="M11 5 L4 12 L11 19 M4 12 H16 A5 5 0 0 1 21 17 V18"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 6l6 6-6 6" />
    </svg>
  );
}

const GROUP_STYLE = {
  generale: { gradient: "", iconBg: "linear-gradient(135deg, #a78bfa, #6d28d9)" },
  technique: { gradient: "", iconBg: "linear-gradient(135deg, #f0abfc, #a21caf)" },
};

function SubjectCard({ subject, group, onSelect }) {
  const style = GROUP_STYLE[group];
  const initial = subject.name.trim().charAt(0).toUpperCase();

  return (
    <button
      onClick={() => onSelect(subject)}
      className={`w-full flex items-center gap-4 rounded-2xl px-4 py-3.5 text-left border border-white/10 active:scale-[0.98] transition-transform bg-white/[0.05] backdrop-blur-xl hover:bg-white/[0.08]`}
    >
      <span
        className="w-11 h-11 rounded-xl flex items-center justify-center font-bold text-base text-white shrink-0 shadow-md"
        style={{ background: style.iconBg }}
      >
        {initial}
      </span>
      <span className="flex-1 font-semibold text-white text-[15px]">{subject.name}</span>
      <ChevronRightIcon />
    </button>
  );
}

export default function Subjects({ onBack }) {
  const [data, setData] = useState({ generale: [], technique: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tab, setTab] = useState("generale"); // "generale" | "technique"
  const [selectedSubject, setSelectedSubject] = useState(null);

  useEffect(() => {
    fetchSubjects()
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const subjects = data[tab] || [];

  return (
    <div className="relative isolate min-h-screen bg-black">
      <AuroraBackground />
      {/* Header */}
      <header className="px-6 pt-9 pb-6 flex items-center gap-4">
        <GradientButton tone="blue" size="sm" icon={<BackArrowIcon />} label="Retour" onClick={onBack} />
        <h1
          className="text-white font-extrabold text-2xl"
          style={{ fontFamily: "'Baloo 2', sans-serif" }}
        >
          Matières
        </h1>
      </header>

      <main className="max-w-md mx-auto px-6 pb-10">
        {/* Toggle Générales / Techniques */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-full p-1 flex mb-6">
          <button
            onClick={() => setTab("generale")}
            className={`flex-1 py-2.5 rounded-full text-sm font-semibold transition ${
              tab === "generale"
                ? "bg-white text-black shadow-[0_0_16px_-2px_rgba(255,255,255,0.35)]"
                : "text-white/50"
            }`}
          >
            Générales
          </button>
          <button
            onClick={() => setTab("technique")}
            className={`flex-1 py-2.5 rounded-full text-sm font-semibold transition ${
              tab === "technique"
                ? "bg-white text-black shadow-[0_0_16px_-2px_rgba(255,255,255,0.35)]"
                : "text-white/50"
            }`}
          >
            Techniques
          </button>
        </div>

        {loading && <p className="text-sm text-white/40 text-center py-10">Chargement...</p>}
        {error && (
          <div className="text-sm text-red-300 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3">
            {error}
          </div>
        )}

        {!loading && !error && (
          <div className="space-y-2.5">
            {subjects.length === 0 && (
              <p className="text-sm text-white/40 text-center py-10">Aucune matière ici.</p>
            )}
            {subjects.map((subject) => (
              <SubjectCard
                key={subject.id}
                subject={subject}
                group={tab}
                onSelect={setSelectedSubject}
              />
            ))}
          </div>
        )}
      </main>

      {selectedSubject && (
        <SubjectResourcePanel subject={selectedSubject} onClose={() => setSelectedSubject(null)} />
      )}
    </div>
  );
}
