import React, { useEffect, useState } from "react";
import { fetchSubjects } from "../api";
import SubjectResourcePanel from "../components/SubjectResourcePanel";

function BackArrowIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
      <path
        d="M11 5 L4 12 L11 19 M4 12 H16 A5 5 0 0 1 21 17 V18"
        stroke="#ffffff"
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
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 6l6 6-6 6" />
    </svg>
  );
}

const GROUP_STYLE = {
  generale: { bg: "bg-blue-50", text: "text-blue-600" },
  technique: { bg: "bg-amber-50", text: "text-amber-600" },
};

function SubjectCard({ subject, group, onSelect }) {
  const style = GROUP_STYLE[group];
  const initial = subject.name.trim().charAt(0).toUpperCase();

  return (
    <button
      onClick={() => onSelect(subject)}
      className="w-full flex items-center gap-4 bg-white border border-slate-200 rounded-2xl px-4 py-3.5 text-left hover:border-slate-300 hover:shadow-sm transition"
    >
      <span
        className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold text-base shrink-0 ${style.bg} ${style.text}`}
      >
        {initial}
      </span>
      <span className="flex-1 font-semibold text-slate-800 text-[15px]">{subject.name}</span>
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
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-[#141414] px-6 pt-8 pb-7 flex items-center gap-4">
        <button onClick={onBack} aria-label="Retour" className="active:opacity-70 transition">
          <BackArrowIcon />
        </button>
        <h1
          className="text-white font-extrabold text-2xl"
          style={{ fontFamily: "'Baloo 2', sans-serif" }}
        >
          Matières
        </h1>
      </header>

      <main className="max-w-md mx-auto px-6 py-7">
        {/* Toggle Générales / Techniques */}
        <div className="bg-slate-200/70 rounded-full p-1 flex mb-6">
          <button
            onClick={() => setTab("generale")}
            className={`flex-1 py-2.5 rounded-full text-sm font-semibold transition ${
              tab === "generale" ? "bg-white shadow-sm text-slate-900" : "text-slate-500"
            }`}
          >
            Générales
          </button>
          <button
            onClick={() => setTab("technique")}
            className={`flex-1 py-2.5 rounded-full text-sm font-semibold transition ${
              tab === "technique" ? "bg-white shadow-sm text-slate-900" : "text-slate-500"
            }`}
          >
            Techniques
          </button>
        </div>

        {loading && <p className="text-sm text-slate-400 text-center py-10">Chargement...</p>}
        {error && (
          <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
            {error}
          </div>
        )}

        {!loading && !error && (
          <div className="space-y-2.5">
            {subjects.length === 0 && (
              <p className="text-sm text-slate-400 text-center py-10">Aucune matière ici.</p>
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
