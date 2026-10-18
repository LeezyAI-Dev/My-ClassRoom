import React from "react";

// Tuiles d'icône en dégradé (accueil, en-têtes de page). Les couleurs viennent de la maquette.
export const TILE_TONES = {
  violet: "linear-gradient(135deg, #c15cff 0%, #8e3bea 100%)",
  orchid: "linear-gradient(135deg, #f3b4f7 0%, #b43fd6 100%)",
  blue: "linear-gradient(135deg, #62adff 0%, #2f6be4 100%)",
  orange: "linear-gradient(135deg, #ff9d5c 0%, #ff4f5e 100%)",
  green: "linear-gradient(135deg, #46e08f 0%, #20c1d8 100%)",
};

const SIZES = {
  sm: "h-10 w-10 rounded-xl",
  md: "h-12 w-12 rounded-2xl",
};

export default function IconTile({ tone = "violet", size = "md", glow = false, children, className = "" }) {
  return (
    <span
      aria-hidden="true"
      className={`flex shrink-0 items-center justify-center text-white ${SIZES[size] || SIZES.md} ${
        glow ? "shadow-glow" : ""
      } ${className}`}
      style={{ background: TILE_TONES[tone] || TILE_TONES.violet }}
    >
      {children}
    </span>
  );
}
