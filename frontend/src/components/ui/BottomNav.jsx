import React, { useEffect, useRef, useState } from "react";
import { ChevronLeftIcon, HomeIcon, LogoutIcon } from "./Icons";

// Barre de navigation flottante de la maquette : [retour] [Accueil] [déconnexion].
// Tous les boutons font au moins 44 px et sont séparés de 8 px (confort au pouce).
export default function BottomNav({ onBack, onHome, onLogout, canGoBack = true }) {
  const [confirmOpen, setConfirmOpen] = useState(false);

  return (
    <>
      <nav
        aria-label="Navigation principale"
        className="fixed inset-x-0 bottom-0 z-40 px-4"
        style={{ paddingBottom: "calc(1rem + env(safe-area-inset-bottom, 0px))" }}
      >
        {/* viewTransitionName : la barre reste en place pendant le balayement des écrans. Le nom est posé sur
            l'élément en verre lui-même (et non sur <nav>), sinon le navigateur n'applique plus le flou. */}
        <div
          className="mx-auto flex max-w-md items-center justify-center gap-2 glass-nav rounded-full p-2"
          style={{ viewTransitionName: "bottom-nav" }}
        >
          <button
            type="button"
            onClick={onBack}
            disabled={!canGoBack}
            aria-label="Retour"
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/[0.09] text-white transition active:bg-white/20 disabled:opacity-40 motion-reduce:transition-none"
          >
            <ChevronLeftIcon size={22} />
          </button>

          <button
            type="button"
            onClick={onHome}
            aria-label="Accueil"
            aria-current="page"
            className="flex h-12 items-center gap-2 rounded-full bg-brand-gradient px-6 text-[15px] font-bold text-white shadow-glow transition active:brightness-110 motion-reduce:transition-none"
          >
            <HomeIcon size={22} />
            Accueil
          </button>

          <button
            type="button"
            onClick={() => setConfirmOpen(true)}
            aria-label="Se déconnecter"
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/[0.09] text-white transition active:bg-white/20 motion-reduce:transition-none"
          >
            <LogoutIcon size={22} />
          </button>
        </div>
      </nav>

      {confirmOpen && (
        <ConfirmDialog
          title="Se déconnecter ?"
          message="Tu devras te reconnecter pour accéder à ton compte."
          cancelLabel="Annuler"
          confirmLabel="Déconnexion"
          onCancel={() => setConfirmOpen(false)}
          onConfirm={() => {
            setConfirmOpen(false);
            onLogout();
          }}
        />
      )}
    </>
  );
}

// Fenêtre de confirmation commune (déconnexion, suppression…).
export function ConfirmDialog({ title, message, cancelLabel = "Annuler", confirmLabel, onCancel, onConfirm, danger = true, busy = false, children }) {
  const cancelRef = useRef(null);

  // Le focus démarre sur « Annuler » (action la moins risquée), une seule fois à l'ouverture.
  // Échap ferme la fenêtre ; on lit toujours les dernières valeurs via une référence.
  const latest = useRef({ onCancel, busy });
  latest.current = { onCancel, busy };

  useEffect(() => {
    cancelRef.current?.focus();
    const onKey = (e) => {
      if (e.key === "Escape" && !latest.current.busy) latest.current.onCancel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div
      className="dialog-overlay fixed inset-0 z-50 flex items-center justify-center bg-black/55 px-6 backdrop-blur-md"
      onClick={() => !busy && onCancel()}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        className="dialog-panel glass-panel w-full max-w-xs rounded-3xl p-6 text-center"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="confirm-title" className="mb-1 text-lg font-extrabold text-white">
          {title}
        </h2>
        {message && <p className="mb-5 text-sm text-white/65">{message}</p>}
        {children}
        <div className="flex gap-3">
          <button ref={cancelRef} type="button" onClick={onCancel} disabled={busy} className="btn-ghost flex-1 px-4">
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className={`${danger ? "btn-danger" : "btn-primary"} flex-1 px-4`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
