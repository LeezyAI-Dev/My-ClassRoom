import React, { useEffect, useState } from "react";
import {
  fetchSubjectResources,
  uploadPdfResource,
  addLinkResource,
  deleteResource,
} from "../api";
import { useAuth } from "../context/AuthContext";

const TYPE_ICON = { pdf: "📄", link: "🔗" };

export default function SubjectResourcePanel({ subject, onClose }) {
  const { token, isDeveloper } = useAuth();

  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [linkTitle, setLinkTitle] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [pdfTitle, setPdfTitle] = useState("");
  const [pdfFile, setPdfFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  // showSpinner=false : rafraîchissement silencieux (polling), sans faire clignoter la liste.
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

    // Nouvelles ressources (PDF/liens) ajoutées par le développeur visibles automatiquement,
    // sans que l'élève ait besoin de recharger la page.
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
      await uploadPdfResource(token, subject.id, {
        title: pdfTitle.trim(),
        file: pdfFile,
      });
      setPdfTitle("");
      setPdfFile(null);
      // Réinitialise le champ file (React ne peut pas contrôler sa valeur directement).
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
    <div className="border border-slate-200 rounded-lg bg-white p-4 mt-2 space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-slate-800">{subject.name} — Ressources</h4>
        <button onClick={onClose} className="text-xs text-slate-400 hover:text-slate-700">
          Fermer
        </button>
      </div>

      {loading && <p className="text-xs text-slate-400">Chargement...</p>}
      {loadError && <p className="text-xs text-red-600">{loadError}</p>}

      {!loading && !loadError && (
        <ul className="space-y-2">
          {resources.length === 0 && (
            <li className="text-xs text-slate-400">Aucune ressource pour le moment.</li>
          )}
          {resources.map((r) => (
            <li
              key={r.id}
              className="flex items-center justify-between gap-2 text-sm bg-slate-50 border border-slate-200 rounded-md px-3 py-2"
            >
              <a
                href={r.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-slate-700 hover:text-slate-900 truncate"
              >
                <span aria-hidden="true">{TYPE_ICON[r.type]}</span>
                <span className="truncate">{r.title}</span>
              </a>
              {isDeveloper && (
                <button
                  onClick={() => handleDelete(r.id)}
                  className="text-xs text-red-500 hover:text-red-700 shrink-0"
                >
                  Supprimer
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      {isDeveloper && (
        <div className="grid gap-4 sm:grid-cols-2 pt-3 border-t border-slate-100">
          <form onSubmit={handleUploadPdf} className="space-y-2">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
              Ajouter un PDF
            </p>
            <input
              type="text"
              placeholder="Titre (optionnel)"
              value={pdfTitle}
              onChange={(e) => setPdfTitle(e.target.value)}
              className="w-full border border-slate-300 rounded-md px-2 py-1.5 text-xs"
            />
            <input
              id={`pdf-input-${subject.id}`}
              type="file"
              accept="application/pdf"
              onChange={(e) => setPdfFile(e.target.files?.[0] || null)}
              className="w-full text-xs"
            />
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-1.5 rounded-md bg-slate-900 text-white text-xs font-medium hover:bg-slate-800 disabled:opacity-60"
            >
              Envoyer le PDF
            </button>
          </form>

          <form onSubmit={handleAddLink} className="space-y-2">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
              Ajouter un lien
            </p>
            <input
              type="text"
              placeholder="Titre"
              value={linkTitle}
              onChange={(e) => setLinkTitle(e.target.value)}
              className="w-full border border-slate-300 rounded-md px-2 py-1.5 text-xs"
            />
            <input
              type="url"
              placeholder="https://..."
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              className="w-full border border-slate-300 rounded-md px-2 py-1.5 text-xs"
            />
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-1.5 rounded-md bg-slate-900 text-white text-xs font-medium hover:bg-slate-800 disabled:opacity-60"
            >
              Ajouter le lien
            </button>
          </form>
        </div>
      )}

      {formError && <p className="text-xs text-red-600">{formError}</p>}
    </div>
  );
}
