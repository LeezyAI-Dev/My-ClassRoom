import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { fetchStudents, deleteStudent } from "../api";
import AuroraBackground from "../components/ui/AuroraBackground";
import PageHeader from "../components/ui/PageHeader";
import { ConfirmDialog } from "../components/ui/BottomNav";
import { ChecklistIcon, TrashIcon } from "../components/ui/Icons";

// Les dates de la base sont en UTC ("2026-10-18 14:32:10") : on les convertit à l'affichage.
function formatDate(utcString) {
  if (!utcString) return "—";
  const d = new Date(utcString.replace(" ", "T") + "Z");
  if (isNaN(d.getTime())) return utcString;
  return d.toLocaleString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function Checklist() {
  const auth = useAuth();
  const token = auth.token || localStorage.getItem("mc_token");

  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Élève en cours de confirmation de suppression (null = fenêtre fermée)
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  useEffect(() => {
    let cancelled = false;
    fetchStudents(token)
      .then((data) => {
        if (cancelled) return;
        setStudents(data.students || []);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  const total = students.length;

  const closeConfirm = () => {
    if (deleting) return;
    setToDelete(null);
    setDeleteError("");
  };

  const confirmDelete = async () => {
    if (!toDelete) return;
    setDeleting(true);
    setDeleteError("");
    try {
      await deleteStudent(token, toDelete.id);
      setStudents((list) => list.filter((s) => s.id !== toDelete.id));
      setToDelete(null);
    } catch (err) {
      setDeleteError(err.message);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="relative isolate min-h-screen bg-ink">
      <AuroraBackground />
      <PageHeader
        title="Checklist"
        subtitle="Élèves inscrits"
        icon={<ChecklistIcon size={24} />}
        tone="green"
        right={<span className="pill shrink-0">Développeur</span>}
      />

      <main className="pb-nav mx-auto max-w-md px-5">
        {loading && (
          <p className="text-sm text-white/65">
            Chargement… (le serveur peut mettre jusqu'à 1 minute à se réveiller)
          </p>
        )}

        {error && (
          <p role="alert" className="rounded-2xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
            {error}
          </p>
        )}

        {!loading && !error && (
          <>
            <div className="card mb-4 flex items-center justify-between px-5 py-4">
              <span className="text-sm font-semibold text-white/70">Total d'élèves</span>
              <span className="text-2xl font-extrabold text-white">{total}</span>
            </div>

            {students.length === 0 ? (
              <p className="mt-8 text-center text-sm text-white/60">Aucun élève inscrit pour le moment.</p>
            ) : (
              <ul className="space-y-2.5">
                {students.map((s, i) => (
                  <li key={s.id} className="card flex items-center justify-between gap-3 py-3 pl-4 pr-3">
                    <div className="min-w-0">
                      <p className="truncate font-bold text-white">
                        <span className="mr-2 font-semibold text-white/50">{total - i}.</span>
                        {s.username}
                      </p>
                      <p className="mt-0.5 text-xs text-white/65">Inscrit le {formatDate(s.created_at)}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      {s.suspended && (
                        <span className="rounded-full border border-red-400/40 bg-red-500/15 px-2.5 py-1 text-[11px] font-bold uppercase text-red-200">
                          Suspendu
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          setDeleteError("");
                          setToDelete(s);
                        }}
                        aria-label={`Supprimer ${s.username}`}
                        className="flex h-11 w-11 items-center justify-center rounded-full border border-red-400/25 bg-red-500/10 text-red-300 transition active:bg-red-500/25 motion-reduce:transition-none"
                      >
                        <TrashIcon size={20} />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </main>

      {/* Confirmation de suppression */}
      {toDelete && (
        <ConfirmDialog
          title="Supprimer ce compte ?"
          cancelLabel="Annuler"
          confirmLabel={deleting ? "Suppression…" : "Supprimer"}
          busy={deleting}
          onCancel={closeConfirm}
          onConfirm={confirmDelete}
        >
          <p className="mb-2 break-all font-bold text-white">{toDelete.username}</p>
          <p className="mb-4 text-sm text-white/65">
            Action irréversible. Ses publications, commentaires, likes et vues dans EYES seront aussi supprimés.
            L'élève devra se réinscrire.
          </p>
          {deleteError && (
            <p role="alert" className="mb-3 rounded-xl border border-red-500/30 bg-red-500/10 p-2 text-xs text-red-200">
              {deleteError}
            </p>
          )}
        </ConfirmDialog>
      )}
    </div>
  );
}
