import React, { useEffect, useState } from "react";
import { fetchSubjects } from "../api";
import SubjectResourcePanel from "../components/SubjectResourcePanel";
import AuroraBackground from "../components/ui/AuroraBackground";
import IconTile from "../components/ui/IconTile";
import PageHeader from "../components/ui/PageHeader";
import { BookIcon, ChevronRightIcon } from "../components/ui/Icons";

// Teinte de la pastille selon le groupe de matières.
const GROUP_TONE = { generale: "violet", technique: "orchid" };

function SubjectCard({ subject, group, onSelect }) {
  const initial = subject.name.trim().charAt(0).toUpperCase();

  return (
    <button
      type="button"
      onClick={() => onSelect(subject)}
      className="card-press flex min-h-[64px] w-full items-center gap-4 px-4 py-3 text-left"
    >
      <IconTile tone={GROUP_TONE[group]} size="sm">
        <span className="text-base font-bold">{initial}</span>
      </IconTile>
      <span className="flex-1 text-[15px] font-semibold text-white">{subject.name}</span>
      <ChevronRightIcon size={18} className="text-white/50" />
    </button>
  );
}

export default function Subjects() {
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
  const total = (data.generale?.length || 0) + (data.technique?.length || 0);

  return (
    <div className="relative isolate min-h-screen bg-ink">
      <AuroraBackground />
      <PageHeader
        title="Matières"
        subtitle={loading ? "Chargement…" : `${total} matières`}
        icon={<BookIcon size={24} />}
        tone="violet"
      />

      <main className="pb-nav mx-auto max-w-md px-5">
        {/* Bascule Générales / Techniques */}
        <div className="seg mb-5" role="tablist" aria-label="Type de matières">
          <button
            type="button"
            role="tab"
            aria-selected={tab === "generale"}
            onClick={() => setTab("generale")}
            className={`seg-item ${tab === "generale" ? "seg-item-on" : ""}`}
          >
            Générales
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === "technique"}
            onClick={() => setTab("technique")}
            className={`seg-item ${tab === "technique" ? "seg-item-on" : ""}`}
          >
            Techniques
          </button>
        </div>

        {loading && <p className="py-10 text-center text-sm text-white/60">Chargement…</p>}
        {error && (
          <div role="alert" className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        )}

        {!loading && !error && (
          <div className="space-y-2.5">
            {subjects.length === 0 && <p className="py-10 text-center text-sm text-white/60">Aucune matière ici.</p>}
            {subjects.map((subject) => (
              <SubjectCard key={subject.id} subject={subject} group={tab} onSelect={setSelectedSubject} />
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
