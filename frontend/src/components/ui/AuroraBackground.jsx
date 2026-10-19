import React from "react";

// Fond commun à toutes les pages, d'après la maquette : noir profond, avec un « dôme » violet
// en haut (grand cercle dont on voit l'arc) et une lueur diffuse.
// Trois grosses « lueurs » de couleur (rose, bleu, violet) sont posées plus bas : les cartes en
// verre les laissent traverser en les floutant, ce qui donne l'effet iPhone quand on fait défiler.
// Uniquement des dégradés (aucun flou coûteux dans le fond lui-même).
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

      {/* Lueurs de couleur que le verre laisse deviner */}
      <div
        className="absolute -left-28 top-[34%] h-80 w-80 rounded-full"
        style={{ background: "radial-gradient(circle, rgba(236,72,153,0.42) 0%, rgba(236,72,153,0) 68%)" }}
      />
      <div
        className="absolute -right-32 top-[54%] h-96 w-96 rounded-full"
        style={{ background: "radial-gradient(circle, rgba(59,130,246,0.38) 0%, rgba(59,130,246,0) 68%)" }}
      />
      <div
        className="absolute -left-16 bottom-[-6%] h-80 w-80 rounded-full"
        style={{ background: "radial-gradient(circle, rgba(168,85,247,0.4) 0%, rgba(168,85,247,0) 68%)" }}
      />
    </div>
  );
}
