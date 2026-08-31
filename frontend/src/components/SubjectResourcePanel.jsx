import React, { useEffect, useState } from "react";
import {
  fetchSubjectResources,
  uploadPdfResource,
  addLinkResource,
  deleteResource,
} from "../api";
import { useAuth } from "../context/AuthContext";

// --- Icônes ---

function CloseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2.4" strokeLinecap="round">
      <line x1="6" y1="6" x2="18" y2="18" />
      <line x1="18" y1="6" x2="6" y2="18" />
    </svg>
  );
}

function PdfIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2">
      <path d="M7 3h7l5 5v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z" />
      <path d="M14 3v5h5" />
    </svg>
  );
}

function LinkIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round">
      <path d="M9 15l6-6" />
      <path d="M11 6l1-1a4 4 0 0 1 6 6l-1 1" />
      <path d="M13 18l-1 1a4 4 0 0 1-6-6l1-1" />
    </svg>
  );
}

function ExternalIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 17L17 7" />
      <path d="M9 7h8v8" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 7h16" />
      <path d="M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
      <path d="M6 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13" />
    </svg>
  );
}

const RESOURCE_ICON = { pdf: PdfIcon, link: LinkIcon };

export default function SubjectResourcePanel({ subject, onClose }) {
  const { token, isDeveloper } = useAuth();

  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [addMode, setAddMode] = useState("pdf"); // "pdf" | "link"
  const [linkTitle, setLinkTitle] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [pdfTitle, setPdfTitle] = useState("");
  const [pdfFile, setPdfFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const loadResources = (showSpinner = true) => {
    if (showSpinner) {
      setLoading(true);
      setLoadError("");
    }
    fetchSubjectResources(subject.id)
      .then((data) => setResources(data.resources))
      .catch((err) => {
        if (showSpinner) setLoadError(err.message);
      })
      .finally(() => {
        if (showSpinner) setLoading(false);
      });
  };

  useEffect(() => {
    loadResources();
    const interval = setInterval(() => loadResources(false), 5000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subject.id]);

  const handleAddLink = async (e) => {
    e.preventDefault();
    setFormError("");
    if (!linkTitle.trim() || !linkUrl.trim()) {
      setFormError("Titre et lien sont requis.");
      return;
    }
    setSubmitting(true);
    try {
      await addLinkResource(token, subject.id, { title: linkTitle.trim(), url: linkUrl.trim() });
      setLinkTitle("");
      setLinkUrl("");
      loadResources();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUploadPdf = async (e) => {
    e.preventDefault();
    setFormError("");
    if (!pdfFile) {
      setFormError("Choisissez un fichier PDF.");
      return;
    }
    if (pdfFile.type !== "application/pdf") {
      setFormError("Le fichier doit être un PDF.");
      return;
    }
    setSubmitting(true);
    try {
      await uploadPdfResource(token, subject.id, { title: pdfTitle.trim(), file: pdfFile });
      setPdfTitle("");
      setPdfFile(null);
      const fileInput = document.getElementById(`pdf-input-${subject.id}`);
      if (fileInput) fileInput.value = "";
      loadResources();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (resourceId) => {
    if (!window.confirm("Supprimer cette ressource ?")) return;
    try {
      await deleteResource(token, resourceId);
      loadResources();
    } catch (err) {
      setLoadError(err.message);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 sm:p-6"
      onClick={onClose}
    >
      <div
        className="bg-white w-full sm:max-w-md sm:rounded-3xl rounded-t-3xl max-h-[88vh] flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between px-6 pt-6 pb-4 border-b border-slate-100">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-0.5">
              Ressources
            </p>
            <h3 className="text-lg font-bold text-slate-900">{subject.name}</h3>
          </div>
          <button
            onClick={onClose}
            aria-label="Fermer"
            className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition shrink-0"
          >
            <CloseIcon />
          </button>
        </div>

        {/* Contenu scrollable */}
        <div className="overflow-y-auto px-6 py-5 flex-1">
          {loading && <p className="text-sm text-slate-400">Chargement...</p>}
          {loadError && <p className="text-sm text-red-600">{loadError}</p>}

          {!loading && !loadError && (
            <ul className="space-y-2.5">
              {resources.length === 0 && (
                <li className="text-sm text-slate-400 text-center py-8">
                  Aucune ressource pour le moment.
                </li>
              )}
              {resources.map((r) => {
                const Icon = RESOURCE_ICON[r.type];
                const href = r.url.startsWith("http")
                  ? r.url
                  : `${import.meta.env.VITE_API_URL?.replace("/api", "") || ""}${r.url}`;
                return (
                  <li
                    key={r.id}
                    className="flex items-center gap-3 bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 hover:border-slate-200 transition"
                  >
                    <span className="w-9 h-9 rounded-xl bg-white border border-slate-100 flex items-center justify-center shrink-0">
                      <Icon />
                    </span>
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 min-w-0 flex items-center gap-2 text-sm font-medium text-slate-700 hover:text-slate-900"
                    >
                      <span className="truncate">{r.title}</span>
                      <ExternalIcon />
                    </a>
                    {isDeveloper && (
                      <button
                        onClick={() => handleDelete(r.id)}
                        aria-label="Supprimer"
                        className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-red-50 transition shrink-0"
                      >
                        <TrashIcon />
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          )}

          {isDeveloper && (
            <div className="mt-6 pt-5 border-t border-slate-100">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-3">
                Ajouter une ressource
              </p>

              <div className="bg-slate-100 rounded-full p-1 flex mb-4">
                <button
                  type="button"
                  onClick={() => setAddMode("pdf")}
                  className={`flex-1 py-2 rounded-full text-xs font-semibold transition ${
                    addMode === "pdf" ? "bg-white shadow-sm text-slate-900" : "text-slate-500"
                  }`}
                >
                  PDF
                </button>
                <button
                  type="button"
                  onClick={() => setAddMode("link")}
                  className={`flex-1 py-2 rounded-full text-xs font-semibold transition ${
                    addMode === "link" ? "bg-white shadow-sm text-slate-900" : "text-slate-500"
                  }`}
                >
                  Lien
                </button>
              </div>

              {addMode === "pdf" ? (
                <form onSubmit={handleUploadPdf} className="space-y-2.5">
                  <input
                    type="text"
                    placeholder="Titre (optionnel)"
                    value={pdfTitle}
                    onChange={(e) => setPdfTitle(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-slate-400 transition"
                  />
                  <label
                    htmlFor={`pdf-input-${subject.id}`}
                    className="flex items-center justify-center gap-2 w-full border border-dashed border-slate-300 rounded-xl px-3.5 py-4 text-sm text-slate-500 cursor-pointer hover:border-slate-400 hover:bg-slate-50 transition"
                  >
                    {pdfFile ? pdfFile.name : "Choisir un fichier PDF (20 Mo max)"}
                  </label>
                  <input
                    id={`pdf-input-${subject.id}`}
                    type="file"
                    accept="application/pdf"
                    onChange={(e) => setPdfFile(e.target.files?.[0] || null)}
                    className="hidden"
                  />
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-2.5 rounded-xl bg-[#141414] text-white text-sm font-semibold hover:bg-black transition disabled:opacity-60"
                  >
                    {submitting ? "Envoi..." : "Envoyer le PDF"}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleAddLink} className="space-y-2.5">
                  <input
                    type="text"
                    placeholder="Titre"
                    value={linkTitle}
                    onChange={(e) => setLinkTitle(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-slate-400 transition"
                  />
                  <input
                    type="url"
                    placeholder="https://..."
                    value={linkUrl}
                    onChange={(e) => setLinkUrl(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-slate-400 transition"
                  />
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-2.5 rounded-xl bg-[#141414] text-white text-sm font-semibold hover:bg-black transition disabled:opacity-60"
                  >
                    {submitting ? "Ajout..." : "Ajouter le lien"}
                  </button>
                </form>
              )}

              {formError && <p className="text-xs text-red-600 mt-2">{formError}</p>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
