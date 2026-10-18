import React from "react";

// Fond commun à toutes les pages (maquette "Accueil") : noir violacé, grand halo violet en haut,
// grain très léger.
// Utilisation : mettre <AuroraBackground /> en 1er enfant d'une page dont la racine est
// <div className="relative isolate min-h-screen bg-night"> : le fond reste derrière le contenu.
// Uniquement des dégradés CSS (pas de flou ni d'animation) : léger même sur un Android modeste.
const NOISE =
  "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")";

export default function AuroraBackground() {
  return (
    <div aria-hidden="true" className="fixed inset-0 -z-10 overflow-hidden pointer-events-none bg-night">
      {/* Grand halo violet du haut, qui s'éteint vers le noir */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(130% 52% at 50% 0%, rgba(168,85,247,0.42) 0%, rgba(109,40,217,0.26) 40%, rgba(8,5,14,0) 72%)",
        }}
      />
      {/* Reflet fuchsia au centre du halo */}
      <div
        className="absolute inset-x-0 top-0 h-[46%]"
        style={{
          background: "radial-gradient(55% 70% at 50% 18%, rgba(217,70,239,0.16), rgba(217,70,239,0) 70%)",
        }}
      />
      {/* Grain */}
      <div
        className="absolute inset-0 opacity-[0.03] mix-blend-soft-light"
        style={{ backgroundImage: NOISE, backgroundSize: "200px 200px" }}
      />
    </div>
  );
}
