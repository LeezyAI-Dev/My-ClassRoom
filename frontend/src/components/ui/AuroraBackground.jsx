import React from "react";

// Fond commun à toutes les pages, d'après la maquette : noir profond, avec un « dôme » violet
// en haut (grand cercle dont on voit l'arc) et une lueur diffuse. Uniquement des dégradés
// (aucun flou coûteux) : fluide même sur un Android modeste.
//
// Utilisation : <AuroraBackground /> en 1er enfant d'une page dont la racine est
// <div className="relative isolate min-h-screen bg-ink"> : le fond reste derrière le contenu.
export default function AuroraBackground() {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-ink">
      {/* Lueur violette du haut */}
      <div
        className="absolute inset-x-0 top-0 h-[70vh]"
        style={{
          background:
            "radial-gradient(120% 80% at 50% 0%, rgba(124,58,237,0.42) 0%, rgba(88,28,160,0.22) 45%, rgba(7,5,13,0) 100%)",
        }}
      />

      {/* Dôme : grand cercle, seul son arc inférieur est visible */}
      <div
        className="absolute left-1/2 h-[600px] w-[600px] -translate-x-1/2 rounded-full border border-violet-300/20"
        style={{
          top: "-340px",
          background:
            "radial-gradient(circle at 50% 0%, rgba(150,70,230,0.5) 0%, rgba(110,45,190,0.28) 55%, rgba(60,20,110,0.12) 100%)",
        }}
      />

      {/* Fondu vers le noir en bas, pour que la barre de navigation reste lisible */}
      <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-ink to-transparent" />
    </div>
  );
}
