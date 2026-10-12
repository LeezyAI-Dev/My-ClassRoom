import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";

const GENERALES = [
  { id: 1, name: "Mathématiques", category: "generale" },
  { id: 2, name: "Français", category: "generale" },
  { id: 3, name: "CMC", category: "generale" },
  { id: 4, name: "Législation", category: "generale" },
  { id: 5, name: "EDHC", category: "generale" },
  { id: 6, name: "Physique Chimie", category: "generale" },
  { id: 7, name: "EPS", category: "generale" },
  { id: 8, name: "Anglais", category: "generale" },
];
const TECHNIQUES = [
  { id: 101, name: "Photogravure", category: "technique" },
  { id: 102, name: "Impression", category: "technique" },
  { id: 103, name: "P.A.O", category: "technique" },
  { id: 104, name: "Façonnage", category: "technique" },
  { id: 105, name: "Fabrication", category: "technique" },
  { id: 106, name: "Maquette", category: "technique" },
];

export default function RegistreNotes({ onBack }) {
  const { user } = useAuth();
  const storageKey = `registre_notes_${user?.username || "anonymous"}`;
  const getGrades = () => { try { return JSON.parse(localStorage.getItem(storageKey) || "[]"); } catch { return []; } };
  const saveGrades = (g) => localStorage.setItem(storageKey, JSON.stringify(g));

  const [grades, setGrades] = useState(getGrades());
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({ date_received: "", note_value: "", photoPreview: null });
  const [error, setError] = useState("");

  useEffect(() => { setGrades(getGrades()); }, []);

  const getGradeForSubject = (id) => grades.find(g => g.subject_id === id);

  const handleOpen = (subject) => {
    if (getGradeForSubject(subject.id)) return;
    setSelected(subject);
    setForm({ date_received: "", note_value: "", photoPreview: null });
    setError("");
  };

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const r = new FileReader();
    r.onload = (ev) => setForm(f => ({ ...f, photoPreview: ev.target.result }));
    r.readAsDataURL(file);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.date_received || !form.note_value) { setError("Date et note obligatoires"); return; }
    if (!String(form.note_value).includes("/")) { setError("Format invalide, ex: 14/20"); return; }
    const newGrade = {
      id: Date.now(),
      subject_id: selected.id,
      subject_name: selected.name,
      date_received: form.date_received,
      note_value: form.note_value,
      photo_url: form.photoPreview || null,
      created_at: new Date().toISOString(),
    };
    const updated = [...grades, newGrade];
    saveGrades(updated);
    setGrades(updated);
    setSelected(null);
  };

  const handleDelete = (grade) => {
    if (!window.confirm(`Supprimer ${grade.subject_name} ?`)) return;
    const updated = grades.filter(g => g.id !== grade.id);
    saveGrades(updated);
    setGrades(updated);
  };

  const Card = ({ subject }) => {
    const g = getGradeForSubject(subject.id);
    return (
      <button onClick={() => handleOpen(subject)} disabled={!!g}
        className={`text-left w-full rounded-[18px] p-4 border transition ${g ? "bg-white/[0.06] border-white/10 cursor-not-allowed" : "bg-gradient-to-br from-[#0e1a3a] to-[#060b1c] border-white/10 hover:border-sky-400/50"}`}>
        <p className="text-white font-bold text-[13px] uppercase">{subject.name}</p>
        {g ? (
          <div className="mt-3 space-y-1.5">
            <div className="flex items-center gap-2 text-[11px]"><span className="text-white/40">Reçue le :</span><span className="text-white font-semibold">{g.date_received}</span><span className="ml-auto text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">Verrouillée</span></div>
            <p className="text-sky-300 font-extrabold text-[16px]">{g.note_value}</p>
            {g.photo_url && <img src={g.photo_url} alt="copie" className="mt-2 w-full h-28 object-cover rounded-lg border border-white/10" />}
          </div>
        ) : <p className="mt-2 text-[11px] text-white/40">Clique pour ajouter ta note</p>}
      </button>
    );
  };

  return (
    <div className="min-h-screen bg-[#060b1c] flex flex-col">
      <header className="px-6 pt-8 pb-4 flex items-center gap-3">
        <button onClick={onBack} className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-white">←</button>
        <div><h1 className="text-white font-extrabold text-[18px] uppercase">Registre de notes</h1><p className="text-white/40 text-[11px]">Date et note verrouillées après validation • 100% offline</p></div>
      </header>

      <main className="flex-1 px-5 pb-8 max-w-md mx-auto w-full">
        {error && <div className="mb-4 text-xs text-red-300 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">{error}</div>}

        <section className="mb-8">
          <h2 className="text-sky-400 font-extrabold uppercase text-[13px] mb-3">Matières Techniques</h2>
          <div className="grid grid-cols-1 gap-3">
            {TECHNIQUES.map(s => <div key={s.id} className="relative"><Card subject={s} />{getGradeForSubject(s.id) && <button onClick={() => handleDelete(getGradeForSubject(s.id))} className="absolute top-2 right-2 text-[10px] text-white/30 hover:text-red-300">Suppr.</button>}</div>)}
          </div>
        </section>

        <section>
          <h2 className="text-violet-400 font-extrabold uppercase text-[13px] mb-3">Matières Générales</h2>
          <div className="grid grid-cols-1 gap-3">
            {GENERALES.map(s => <div key={s.id} className="relative"><Card subject={s} />{getGradeForSubject(s.id) && <button onClick={() => handleDelete(getGradeForSubject(s.id))} className="absolute top-2 right-2 text-[10px] text-white/30 hover:text-red-300">Suppr.</button>}</div>)}
          </div>
        </section>
      </main>

      {selected && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 px-6" onClick={() => setSelected(null)}>
          <div className="bg-[#0b1230] border border-white/15 rounded-[24px] p-6 w-full max-w-sm" onClick={e=>e.stopPropagation()}>
            <h3 className="text-white font-extrabold uppercase text-[14px] mb-1">{selected.name}</h3>
            <p className="text-white/40 text-[11px] mb-5">Une fois validé, tu ne pourras plus modifier.</p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div><label className="text-[11px] text-white/60 uppercase font-bold">1. J'ai reçu ma note le :</label><input type="date" value={form.date_received} onChange={e=>setForm({...form, date_received: e.target.value})} className="mt-1 w-full rounded-xl bg-white/[0.06] border border-white/10 px-3 py-2.5 text-sm text-white outline-none focus:border-sky-400" /></div>
              <div><label className="text-[11px] text-white/60 uppercase font-bold">2. J'ai eu :</label><input type="text" placeholder="ex: 14/20" value={form.note_value} onChange={e=>setForm({...form, note_value: e.target.value})} className="mt-1 w-full rounded-xl bg-white/[0.06] border border-white/10 px-3 py-2.5 text-sm text-white outline-none focus:border-sky-400" /><p className="text-[10px] text-white/30 mt-1">Utilise / pour indiquer sur combien</p></div>
              <div><label className="text-[11px] text-white/60 uppercase font-bold">3. Photo (facultatif)</label><input type="file" accept="image/*" onChange={handleFile} className="mt-1 w-full text-xs text-white/60 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-white/10 file:text-white" />{form.photoPreview && <img src={form.photoPreview} alt="preview" className="mt-2 w-full h-32 object-cover rounded-lg border border-white/10" />}</div>
              {error && <div className="text-xs text-red-300 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</div>}
              <div className="flex gap-3 pt-2"><button type="button" onClick={()=>setSelected(null)} className="flex-1 py-2.5 rounded-xl bg-white/10 text-white font-bold text-sm">Annuler</button><button type="submit" className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 text-white font-bold text-sm">Valider & Verrouiller</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
