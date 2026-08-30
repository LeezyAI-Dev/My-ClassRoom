import React, { useEffect, useState } from "react";
import { fetchSubjects } from "../api";
import SubjectResourcePanel from "../components/SubjectResourcePanel";

function SubjectGroup({ title, subjects, accent, selectedId, onSelect }) {
  return (
    <div>
      <h3 className="text-sm uppercase tracking-wide text-slate-400 mb-3">{title}</h3>
      <div className="grid gap-2 sm:grid-cols-2">
        {subjects.map((subject) => (
          <div key={subject.id} className={subject.id === selectedId ? "sm:col-span-2" : ""}>
            <button
              onClick={() => onSelect(subject.id === selectedId ? null : subject.id)}
              className={`w-full flex items-center gap-3 bg-white border rounded-lg px-4 py-3 text-left transition ${
                subject.id === selectedId
                  ? "border-slate-400 shadow-sm"
                  : "border-slate-200 hover:border-slate-300"
              } ${accent}`}
            >
              <span className="w-2 h-2 rounded-full bg-current opacity-70" />
              <span className="text-sm font-medium text-slate-800">{subject.name}</span>
            </button>

            {subject.id === selectedId && (
              <SubjectResourcePanel subject={subject} onClose={() => onSelect(null)} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Subjects({ onBack }) {
  const [data, setData] = useState({ generale: [], technique: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedId, setSelectedId] = useState(null);

  useEffect(() => {
    fetchSubjects()
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center gap-4">
        <button onClick={onBack} className="text-sm text-slate-500 hover:text-slate-800">
          ← Retour
        </button>
        <h1 className="text-lg font-semibold text-slate-800">Matières</h1>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-10 space-y-10">
        {loading && <p className="text-sm text-slate-500">Chargement...</p>}
        {error && (
          <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {error}
          </div>
        )}

        {!loading && !error && (
          <>
            <p className="text-xs text-slate-400 -mt-6">
              Cliquez sur une matière pour voir ses ressources (PDF, liens).
            </p>
            <SubjectGroup
              title="Matières générales"
              subjects={data.generale}
              accent="text-blue-600"
              selectedId={selectedId}
              onSelect={setSelectedId}
            />
            <SubjectGroup
              title="Matières techniques"
              subjects={data.technique}
              accent="text-amber-600"
              selectedId={selectedId}
              onSelect={setSelectedId}
            />
          </>
        )}
      </main>
    </div>
  );
}
