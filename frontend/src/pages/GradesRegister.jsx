import React, { useEffect, useRef, useState } from "react";
import { useAuth } from "../context/AuthContext";
import {
  fetchSubjects,
  fetchGradeCounts,
  fetchSubjectGrades,
  createGrade,
  updateGrade,
  deleteGrade,
  fetchGradePhotoBlob,
} from "../api";
import AuroraBackground from "../components/ui/AuroraBackground";
import GradientButton from "../components/ui/GradientButton";
import PageHeader from "../components/ui/PageHeader";
import { ConfirmDialog } from "../components/ui/BottomNav";
import { DocIcon } from "../components/ui/Icons";

// --- Icônes ---

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

function PlusIcon({ size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round">
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

function PencilIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 20h4L19 9a2.1 2.1 0 0 0-4-4L4 16v4z" />
      <path d="M13.5 6.5l4 4" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 7h16M10 11v6M14 11v6" />
      <path d="M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3" />
    </svg>
  );
}

function CameraIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 8h3l1.6-2.4h6.8L17 8h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z" />
      <circle cx="12" cy="13" r="3.6" />
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
  generale: {
    title: "Matières générales",
    gradient: "",
    iconBg: "linear-gradient(135deg, #a78bfa, #6d28d9)",
    accent: "text-violet-300",
    bar: "bg-violet-300",
  },
  technique: {
    title: "Matières techniques",
    gradient: "",
    iconBg: "linear-gradient(135deg, #f0abfc, #a21caf)",
    accent: "text-fuchsia-300",
    bar: "bg-fuchsia-300",
  },
};

// --- Utilitaires ---

function formatScore(n) {
  return String(Math.round(Number(n) * 100) / 100).replace(".", ",");
}

function formatDate(sqlUtc) {
  if (!sqlUtc) return "";
  const d = new Date(sqlUtc.replace(" ", "T") + "Z"); // SQLite stocke en UTC
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
}

function parseScoreInput(text, scale) {
  const t = text.trim().replace(",", ".");
  if (!/^\d+(\.\d{1,2})?$/.test(t)) return null;
  const n = Number(t);
  return n <= scale ? n : null;
}

// Réduit la photo (côté appareil) avant l'envoi : ~200-400 Ko au lieu de plusieurs Mo.
function compressImage(file, maxSide = 1400, quality = 0.75) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      const ratio = Math.min(1, maxSide / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * ratio);
      canvas.height = Math.round(img.height * ratio);
      const ctx = canvas.getContext("2d");
      ctx.fillStyle = "#ffffff"; // fond blanc pour les PNG transparents
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(
        (blob) =>
          blob
            ? resolve(new File([blob], "copie.jpg", { type: "image/jpeg" }))
            : reject(new Error("Impossible de préparer la photo.")),
        "image/jpeg",
        quality
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Impossible de lire cette image. Essaie une photo JPG ou PNG."));
    };
    img.src = url;
  });
}

// Image protégée par le jeton : chargée en blob, et seulement quand elle approche de l'écran.
function AuthImage({ token, gradeId, version, onOpen }) {
  const holderRef = useRef(null);
  const [visible, setVisible] = useState(false);
  const [src, setSrc] = useState(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const el = holderRef.current;
    if (!el || visible) return undefined;
    if (!("IntersectionObserver" in window)) {
      setVisible(true);
      return undefined;
    }
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setVisible(true);
          obs.disconnect();
        }
      },
      { rootMargin: "250px" }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [visible]);

  useEffect(() => {
    if (!visible) return undefined;
    let cancelled = false;
    let objectUrl = null;
    setSrc(null);
    setFailed(false);
    fetchGradePhotoBlob(token, gradeId)
      .then((blob) => {
        if (cancelled) return;
        objectUrl = URL.createObjectURL(blob);
        setSrc(objectUrl);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [visible, token, gradeId, version]);

  return (
    <div ref={holderRef} className="rounded-2xl overflow-hidden bg-white/5 border border-white/10 min-h-[120px] flex items-center justify-center">
      {src && (
        <button type="button" onClick={() => onOpen(src)} className="block w-full" aria-label="Agrandir la photo">
          <img src={src} alt="Copie" className="w-full h-auto block" />
        </button>
      )}
      {!src && !failed && <span className="text-xs text-white/55">Chargement de la photo...</span>}
      {failed && <span className="text-xs text-red-300">Photo indisponible.</span>}
    </div>
  );
}

function Header({ title, subtitle, onBack, right }) {
  // Sans `onBack` (liste des matières), c'est la tuile d'icône qui s'affiche ; le retour
  // vers l'accueil est assuré par la barre du bas.
  return (
    <PageHeader
      title={title}
      subtitle={subtitle}
      onBack={onBack}
      right={right}
      icon={<DocIcon size={24} />}
      tone="orchid"
    />
  );
}

// --- Questionnaire : 1) la note et le barème, 2) la photo de la copie ---

function GradeForm({ token, subject, grade, onCancel, onSaved }) {
  const isEdit = Boolean(grade);
  const [step, setStep] = useState(1);
  const [scoreText, setScoreText] = useState(isEdit ? formatScore(grade.score) : "");
  const [scale, setScale] = useState(isEdit ? grade.scale : 20);
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [removeExisting, setRemoveExisting] = useState(false);
  const [preparing, setPreparing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [zoomSrc, setZoomSrc] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return undefined;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const goToStep2 = () => {
    if (parseScoreInput(scoreText, scale) === null) {
      setError(`Entre une note valide entre 0 et ${scale} (exemple : 14 ou 14,5).`);
      return;
    }
    setError("");
    setStep(2);
  };

  const handlePick = async (e) => {
    const picked = e.target.files && e.target.files[0];
    e.target.value = ""; // permet de re-choisir la même photo
    if (!picked) return;
    setError("");
    setPreparing(true);
    try {
      setFile(await compressImage(picked));
      setRemoveExisting(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setPreparing(false);
    }
  };

  const handleSave = async () => {
    const parsed = parseScoreInput(scoreText, scale);
    if (parsed === null) {
      setStep(1);
      setError(`Entre une note valide entre 0 et ${scale}.`);
      return;
    }
    setSaving(true);
    setError("");
    try {
      const payload = { score: parsed, scale, file, removePhoto: removeExisting && !file };
      if (isEdit) await updateGrade(token, grade.id, payload);
      else await createGrade(token, subject.id, payload);
      onSaved();
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  };

  const showExistingPhoto = isEdit && grade.has_photo && !removeExisting && !file;
  const hasAnyPhoto = Boolean(file) || showExistingPhoto;

  return (
    <div className="relative isolate min-h-screen bg-ink">
      <AuroraBackground />
      <Header
        title={isEdit ? "Modifier la note" : "Nouvelle note"}
        subtitle={subject.name}
        onBack={step === 2 ? () => { setError(""); setStep(1); } : onCancel}
      />

      <main className="max-w-md mx-auto px-5 pb-nav">
        <div className="flex gap-1.5 mb-6">
          <span className="h-1 flex-1 rounded-full bg-violet-300" />
          <span className={`h-1 flex-1 rounded-full ${step === 2 ? "bg-violet-300" : "bg-white/15"}`} />
        </div>

        {step === 1 && (
          <section>
            <p className="text-white font-extrabold text-lg mb-4">
              1. J'ai eu :
            </p>
            <input
              type="text"
              inputMode="decimal"
              value={scoreText}
              onChange={(e) => setScoreText(e.target.value)}
              placeholder="Ta note"
              autoFocus
              className="w-full bg-white/5 border border-white/15 rounded-2xl px-5 py-4 text-white text-3xl font-extrabold placeholder-white/25 focus:outline-none focus:border-violet-300"
            />

            <p className="text-sm text-white/60 mt-5 mb-2">Cette note est sur combien ?</p>
            <div className="seg">
              {[20, 10].map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setScale(value)}
                  className={`seg-item ${scale === value ? "seg-item-on" : ""}`}
                >
                  Sur {value}
                </button>
              ))}
            </div>

            {error && (
              <div role="alert" className="mt-4 text-sm text-red-200 bg-red-500/10 border border-red-500/30 rounded-2xl px-4 py-3">
                {error}
              </div>
            )}

            <GradientButton tone="violet" full className="mt-6" onClick={goToStep2}>
              Suivant
            </GradientButton>
          </section>
        )}

        {step === 2 && (
          <section>
            <p className="text-white font-extrabold text-lg mb-1">
              2. Photo de la copie
            </p>
            <p className="text-sm text-white/60 mb-4">
              Note : {formatScore(parseScoreInput(scoreText, scale) ?? 0)}/{scale}. La photo est facultative.
            </p>

            <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePick} className="hidden" />

            {hasAnyPhoto ? (
              <div className="space-y-3">
                {file && previewUrl && (
                  <button type="button" onClick={() => setZoomSrc(previewUrl)} className="block w-full rounded-2xl overflow-hidden border border-white/10">
                    <img src={previewUrl} alt="Aperçu de la copie" className="w-full h-auto block" />
                  </button>
                )}
                {showExistingPhoto && (
                  <AuthImage token={token} gradeId={grade.id} version={grade.updated_at} onOpen={setZoomSrc} />
                )}
                <div className="flex gap-3">
                  <GradientButton
                    tone="blue"
                    look="glass"
                    size="sm"
                    className="flex-1"
                    onClick={() => fileInputRef.current && fileInputRef.current.click()}
                    disabled={preparing}
                  >
                    {preparing ? "Préparation..." : "Changer la photo"}
                  </GradientButton>
                  <GradientButton
                    tone="orange"
                    look="danger"
                    size="sm"
                    className="flex-1"
                    onClick={() => {
                      setFile(null);
                      setRemoveExisting(true);
                    }}
                  >
                    Retirer la photo
                  </GradientButton>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current && fileInputRef.current.click()}
                disabled={preparing}
                className="w-full rounded-2xl border-2 border-dashed border-white/20 py-12 flex flex-col items-center gap-3 active:opacity-70 transition disabled:opacity-50"
              >
                <span className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #a78bfa, #c026d3)" }}>
                  <CameraIcon />
                </span>
                <span className="text-white font-semibold text-sm">
                  {preparing ? "Préparation de la photo..." : "Prendre ou choisir une photo"}
                </span>
              </button>
            )}

            {error && (
              <div role="alert" className="mt-4 text-sm text-red-200 bg-red-500/10 border border-red-500/30 rounded-2xl px-4 py-3">
                {error}
              </div>
            )}

            <GradientButton tone="violet" full className="mt-6" onClick={handleSave} disabled={saving || preparing}>
              {saving ? "Enregistrement..." : "Enregistrer la note"}
            </GradientButton>
          </section>
        )}
      </main>

      {zoomSrc && <Lightbox src={zoomSrc} onClose={() => setZoomSrc(null)} />}
    </div>
  );
}

function Lightbox({ src, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-3" onClick={onClose}>
      <button
        type="button"
        onClick={onClose}
        aria-label="Fermer"
        className="absolute top-5 right-5 w-10 h-10 rounded-full bg-white/15 text-white text-xl font-bold flex items-center justify-center"
      >
        ×
      </button>
      <img src={src} alt="Copie en grand" className="max-w-full max-h-full object-contain" onClick={(e) => e.stopPropagation()} />
    </div>
  );
}

// --- Page principale ---

export default function GradesRegister({ onBack }) {
  const { token } = useAuth();

  const [subjects, setSubjects] = useState({ generale: [], technique: [] });
  const [counts, setCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [screen, setScreen] = useState("list"); // "list" | "subject" | "form"
  const [current, setCurrent] = useState(null);
  const [editing, setEditing] = useState(null);
  const [formOrigin, setFormOrigin] = useState("list");

  const [grades, setGrades] = useState([]);
  const [gradesLoading, setGradesLoading] = useState(false);
  const [gradesError, setGradesError] = useState("");

  const [zoomSrc, setZoomSrc] = useState(null);
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const loadCounts = () =>
    fetchGradeCounts(token)
      .then((d) => setCounts(d.counts || {}))
      .catch(() => {});

  useEffect(() => {
    Promise.all([fetchSubjects(), fetchGradeCounts(token)])
      .then(([subjectsData, countsData]) => {
        setSubjects(subjectsData);
        setCounts(countsData.counts || {});
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [token]);

  const loadGrades = (subject) => {
    setGradesLoading(true);
    setGradesError("");
    return fetchSubjectGrades(token, subject.id)
      .then((d) => setGrades(d.grades))
      .catch((err) => setGradesError(err.message))
      .finally(() => setGradesLoading(false));
  };

  const openSubject = (subject) => {
    setCurrent(subject);
    setGrades([]);
    setScreen("subject");
    loadGrades(subject);
  };

  const goList = () => {
    setScreen("list");
    setCurrent(null);
    loadCounts();
  };

  const startAdd = (subject, origin) => {
    setCurrent(subject);
    setEditing(null);
    setFormOrigin(origin);
    setScreen("form");
  };

  const startEdit = (grade) => {
    setEditing(grade);
    setFormOrigin("subject");
    setScreen("form");
  };

  const handleSaved = () => {
    setEditing(null);
    setScreen("subject");
    loadGrades(current);
  };

  const handleFormCancel = () => {
    setEditing(null);
    if (formOrigin === "subject") setScreen("subject");
    else goList();
  };

  const confirmDelete = async () => {
    setDeleting(true);
    try {
      await deleteGrade(token, toDelete.id);
      setToDelete(null);
      await loadGrades(current);
    } catch (err) {
      setGradesError(err.message);
      setToDelete(null);
    } finally {
      setDeleting(false);
    }
  };

  // --- Écran : questionnaire ---
  if (screen === "form" && current) {
    return (
      <GradeForm
        key={editing ? `edit-${editing.id}` : "new"}
        token={token}
        subject={current}
        grade={editing}
        onCancel={handleFormCancel}
        onSaved={handleSaved}
      />
    );
  }

  // --- Écran : les notes d'une matière ---
  if (screen === "subject" && current) {
    return (
      <div className="relative isolate min-h-screen bg-ink">
      <AuroraBackground />
        <Header
          title={current.name}
          subtitle="Mes notes"
          onBack={goList}
          right={
            <GradientButton tone="violet" icon={<PlusIcon />} label="Ajouter" ariaLabel="Ajouter une note" onClick={() => startAdd(current, "subject")} />
          }
        />

        <main className="max-w-md mx-auto px-5 pb-nav space-y-5">
          {gradesLoading && <p className="text-sm text-white/55 text-center py-10">Chargement...</p>}
          {gradesError && (
            <div role="alert" className="text-sm text-red-200 bg-red-500/10 border border-red-500/30 rounded-2xl px-4 py-3">
              {gradesError}
            </div>
          )}

          {!gradesLoading && !gradesError && grades.length === 0 && (
            <div className="text-center py-12">
              <p className="text-white/70 font-semibold mb-1">Aucune note en {current.name} pour l'instant.</p>
              <p className="text-sm text-white/55">Ajoute ta première note avec le bouton +.</p>
            </div>
          )}

          {grades.map((g) => (
            <article key={g.id} className="card p-4">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <p className="text-sm text-white/60">J'ai eu</p>
                  <p className="text-white font-extrabold text-3xl leading-none mt-1">
                    {formatScore(g.score)}
                    <span className="text-white/60 text-xl">/{g.scale}</span>
                  </p>
                  <p className="text-xs text-white/50 mt-1.5">{formatDate(g.created_at)}</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <GradientButton tone="green" size="sm" icon={<PencilIcon />} label="Modifier" onClick={() => startEdit(g)} />
                  <GradientButton tone="orange" size="sm" icon={<TrashIcon />} label="Supprimer" onClick={() => setToDelete(g)} />
                </div>
              </div>
              {g.has_photo && <AuthImage token={token} gradeId={g.id} version={g.updated_at} onOpen={setZoomSrc} />}
            </article>
          ))}

          {!gradesLoading && grades.length > 0 && (
            <button
              onClick={() => startAdd(current, "subject")}
              className="w-full py-4 rounded-2xl border-2 border-dashed border-white/20 text-white/70 font-semibold flex items-center justify-center gap-2 active:opacity-70 transition"
            >
              <PlusIcon size={18} /> Ajouter une nouvelle note
            </button>
          )}
        </main>

        {zoomSrc && <Lightbox src={zoomSrc} onClose={() => setZoomSrc(null)} />}

        {toDelete && (
          <ConfirmDialog
            title="Supprimer cette note ?"
            message={`${formatScore(toDelete.score)}/${toDelete.scale} en ${current.name}, avec sa photo. Cette action est définitive.`}
            confirmLabel={deleting ? "…" : "Supprimer"}
            busy={deleting}
            onCancel={() => setToDelete(null)}
            onConfirm={confirmDelete}
          />
        )}
      </div>
    );
  }

  // --- Écran : liste des matières (2 sections) ---
  return (
    <div className="relative isolate min-h-screen bg-ink">
      <AuroraBackground />
      <Header title="Registre de notes" subtitle="Privé : toi seul vois tes notes" />

      <main className="max-w-md mx-auto px-5 pb-nav">
        {loading && <p className="text-sm text-white/55 text-center py-10">Chargement...</p>}
        {error && (
          <div role="alert" className="text-sm text-red-200 bg-red-500/10 border border-red-500/30 rounded-2xl px-4 py-3">
            {error}
          </div>
        )}

        {!loading && !error &&
          ["generale", "technique"].map((group) => {
            const style = GROUP_STYLE[group];
            return (
              <section key={group} className="mb-8">
                <div className="mb-3">
                  <h2 className={`font-extrabold text-lg ${style.accent}`}>
                    {style.title}
                  </h2>
                  <div className={`w-8 h-1 rounded-full mt-1 ${style.bar}`} />
                </div>

                <div className="space-y-2.5">
                  {(subjects[group] || []).map((subject) => {
                    const n = counts[subject.id] || 0;
                    return (
                      <div
                        key={subject.id}
                        className="card flex items-center gap-2 pr-3"
                      >
                        <button
                          onClick={() => openSubject(subject)}
                          className="flex-1 min-w-0 flex items-center gap-4 pl-4 py-3.5 text-left active:opacity-70 transition"
                        >
                          <span
                            className="w-11 h-11 rounded-xl flex items-center justify-center font-bold text-base text-white shrink-0 shadow-md"
                            style={{ background: style.iconBg }}
                          >
                            {subject.name.trim().charAt(0).toUpperCase()}
                          </span>
                          <span className="flex-1 min-w-0">
                            <span className="block font-semibold text-white text-[15px] truncate">{subject.name}</span>
                            <span className="block text-xs text-white/60">
                              {n === 0 ? "Aucune note" : `${n} note${n > 1 ? "s" : ""}`}
                            </span>
                          </span>
                          <ChevronRightIcon />
                        </button>
                        <GradientButton
                          tone="violet"
                          size="sm"
                          icon={<PlusIcon size={20} />}
                          label="Ajouter"
                          ariaLabel={`Ajouter une note en ${subject.name}`}
                          onClick={() => startAdd(subject, "list")}
                        />
                      </div>
                    );
                  })}
                </div>
              </section>
            );
          })}
      </main>
    </div>
  );
}
