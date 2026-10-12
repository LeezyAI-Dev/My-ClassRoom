import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { fetchStudents, suspendStudent, unsuspendStudent } from "../api";

function PresenceDot({ isOnline }) {
  return (
    <span className="relative flex h-3 w-3">
      {isOnline && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>}
      <span className={`relative inline-flex rounded-full h-3 w-3 ${isOnline ? "bg-green-500 shadow-[0_0_8px_#22c55e]" : "bg-red-500"}`}></span>
    </span>
  );
}

export default function Checklist({ onBack }) {
  const { token } = useAuth();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const data = await fetchStudents(token);
      // Calcule isOnline côté front: si last_seen < 2 minutes = en ligne
      const now = Date.now();
      const enriched = data.students.map(s => {
        const lastSeenTime = s.last_seen ? new Date(s.last_seen).getTime() : 0;
        const isOnline = now - lastSeenTime < 120000; // 2 min
        return { ...s, isOnline };
      });
      setStudents(enriched);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const interval = setInterval(load, 5000); // refresh voyant toutes les 5s
    return () => clearInterval(interval);
  }, []);

  const handleToggle = async (s) => {
    try {
      if (s.suspended) await unsuspendStudent(token, s.id);
      else await suspendStudent(token, s.id);
      load();
    } catch (e) {
      alert(e.message);
    }
  };

  if (loading) return <div className="min-h-screen bg-[#060b1c] text-white flex items-center justify-center">Chargement checklist...</div>;

  return (
    <div className="min-h-screen bg-[#060b1c] text-white flex flex-col">
      <header className="px-6 pt-8 pb-4 flex items-center gap-4">
        <button onClick={onBack} className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">←</button>
        <div>
          <h1 className="text-2xl font-extrabold uppercase" style={{fontFamily:"'Baloo 2', sans-serif"}}>CHECKLIST</h1>
          <p className="text-xs text-white/50">{students.length} élèves inscrits • DEV ONLY</p>
        </div>
      </header>

      <div className="px-5 pb-10 space-y-3 max-w-md mx-auto w-full">
        {students.map((s) => (
          <div key={s.id} className={`p-4 rounded-2xl border flex items-center justify-between ${s.suspended ? "bg-red-900/20 border-red-500/30" : "bg-white/[0.06] border-white/10"}`}>
            <div className="flex items-center gap-3 min-w-0">
              <PresenceDot isOnline={s.isOnline && !s.suspended} />
              <div className="min-w-0">
                <p className="font-bold truncate">{s.username}</p>
                <p className="text-[11px] text-white/50 truncate">
                  {s.suspended ? "COMPTE DESACTIVE" : s.isOnline ? "En ligne maintenant" : s.last_seen ? `Hors ligne • vu ${new Date(s.last_seen).toLocaleTimeString()}` : "Jamais connecté"}
                </p>
              </div>
            </div>
            <button
              onClick={() => handleToggle(s)}
              className={`ml-3 px-3 py-2 rounded-xl text-xs font-extrabold uppercase ${s.suspended ? "bg-green-600" : "bg-red-600"}`}
            >
              {s.suspended ? "Réactiver" : "Désactiver"}
            </button>
          </div>
        ))}
        {students.length === 0 && <p className="text-center text-white/40 mt-10">Aucun élève inscrit</p>}
      </div>
    </div>
  );
}
