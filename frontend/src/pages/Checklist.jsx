import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { fetchStudents, deleteStudent } from "../api";

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

function TrashIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path
        d="M4 7h16M9 7V4.5h6V7M6.5 7l1 13h9l1-13M10 11v6M14 11v6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function Checklist({ onBack }) {
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
    <div className="min-h-screen bg-[#060b1c] px-5 pt-9 pb-8">
      <div className="max-w-md mx-auto">
        <button
          onClick={onBack}
          className="text-sky-400 text-sm font-bold mb-5 active:opacity-70 transition"
        >
          ← Retour
        </button>

        <h1
          className="text-white text-[1.5rem] uppercase leading-tight"
          style={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 800 }}
        >
          Checklist
        </h1>
        <p className="text-white/50 text-sm mt-1 mb-5">Élèves inscrits</p>

        {loading && (
          <p className="text-white/50 text-sm">
            Chargement… (le serveur peut mettre jusqu'à 1 minute à se réveiller)
          </p>
        )}

        {error && (
          <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded-xl p-3">
            {error}
          </p>
        )}

        {!loading && !error && (
          <>
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 mb-4 flex items-center justify-between">
              <span className="text-white/60 text-sm font-semibold">Total d'élèves</span>
              <span className="text-white text-xl font-extrabold">{total}</span>
            </div>

            {students.length === 0 ? (
              <p className="text-white/40 text-sm text-center mt-8">
                Aucun élève inscrit pour le moment.
              </p>
            ) : (
              <ul className="space-y-2">
                {students.map((s, i) => (
                  <li
                    key={s.id}
                    className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <p className="text-white font-bold truncate">
                        <span className="text-white/30 font-semibold mr-2">{total - i}.</span>
                        {s.username}
                      </p>
                      <p className="text-white/40 text-xs mt-0.5">
                        Inscrit le {formatDate(s.created_at)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {s.suspended && (
                        <span className="text-[10px] font-bold uppercase text-red-300 bg-red-500/15 border border-red-500/30 rounded-full px-2 py-1">
                          Suspendu
                        </span>
                      )}
                      <button
                        onClick={() => {
                          setDeleteError("");
                          setToDelete(s);
                        }}
                        aria-label={`Supprimer ${s.username}`}
                        className="w-9 h-9 rounded-full flex items-center justify-center text-red-400 bg-red-500/10 border border-red-500/20 active:opacity-70 transition"
                      >
                        <TrashIcon />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </div>

      {/* Confirmation de suppression */}
      {toDelete && (
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-8"
          onClick={closeConfirm}
        >
          <div
            className="bg-[#0b1230] border border-white/10 rounded-[24px] p-6 max-w-xs w-full text-center shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="font-extrabold text-white text-lg mb-1">Supprimer ce compte ?</p>
            <p className="text-white font-bold mb-2 break-all">{toDelete.username}</p>
            <p className="text-sm text-white/50 mb-4">
              Action irréversible. Ses publications, commentaires, likes et vues dans EYES seront
              aussi supprimés. L'élève devra se réinscrire.
            </p>

            {deleteError && (
              <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/30 rounded-xl p-2 mb-3">
                {deleteError}
              </p>
            )}

            <div className="flex gap-3">
              <button
                onClick={closeConfirm}
                disabled={deleting}
                className="flex-1 py-2.5 rounded-xl bg-white/10 font-bold text-white active:opacity-70 transition disabled:opacity-40"
              >
                Annuler
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleting}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-red-500 to-rose-600 text-white font-bold active:opacity-70 transition disabled:opacity-60"
              >
                {deleting ? "Suppression…" : "Supprimer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
