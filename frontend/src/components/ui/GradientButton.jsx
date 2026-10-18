import React from "react";

// Bouton inspiré du "Gradient Menu" : au repos il est blanc ; au survol (ordinateur) ou à
// l'appui (téléphone) un dégradé coloré apparaît avec une lueur dessous.
//
// Deux formes, choisies automatiquement :
//  - sans enfants  -> bouton rond avec une icône. Sur ordinateur, il s'étend en pilule et
//                     affiche son `label` au survol. Sur téléphone (pas de survol), seul l'appui
//                     colore le bouton : l'étirement est réservé aux appareils qui ont une souris.
//  - avec enfants  -> bouton pilule avec du texte (actions principales, fenêtres de confirmation).
//
// Props : tone (violet | blue | orange | green | pink), look (solid | glass | danger, pilule
// seulement), size (sm | md), full, icon, label, ariaLabel, onClick, disabled, type, className.

export const TONES = {
  violet: ["#a955ff", "#ea51ff"],
  blue: ["#56CCF2", "#2F80ED"],
  orange: ["#FF9966", "#FF5E62"],
  green: ["#80FF72", "#7EE8FA"],
  pink: ["#ffa9c6", "#f434e2"],
};

// Les classes sont écrites en entier (Tailwind ne détecte pas les noms assemblés).
const FILL =
  "absolute inset-0 rounded-full bg-[linear-gradient(45deg,var(--gf),var(--gt))] opacity-0 transition-opacity duration-500 motion-reduce:transition-none [@media(hover:hover)]:group-hover:opacity-100 group-active:opacity-100";
const FILL_ON =
  "absolute inset-0 rounded-full bg-[linear-gradient(45deg,var(--gf),var(--gt))] opacity-100";
const GLOW =
  "absolute top-[8px] inset-x-0 h-full rounded-full bg-[linear-gradient(45deg,var(--gf),var(--gt))] blur-[15px] opacity-0 -z-10 transition-opacity duration-500 motion-reduce:transition-none [@media(hover:hover)]:group-hover:opacity-50 group-active:opacity-50";
const FOCUS =
  "outline-none focus-visible:ring-2 focus-visible:ring-white/70 disabled:opacity-50 disabled:pointer-events-none";

const ICON_SIZE = { sm: "w-11 h-11", md: "w-12 h-12" };
const PILL_SIZE = { sm: "h-11 px-4 text-sm", md: "h-12 px-6 text-sm" };

const LOOK = {
  solid: "text-white shadow-glow-sm",
  glass: "bg-white/10 backdrop-blur-xl border border-white/15 text-white",
  danger: "bg-red-500/15 border border-red-400/30 text-red-200",
};
const LOOK_TEXT = {
  solid: "",
  glass: "",
  danger: "[@media(hover:hover)]:group-hover:text-white group-active:text-white",
};

export default function GradientButton({
  icon,
  label,
  tone = "violet",
  look = "solid",
  size = "md",
  full = false,
  onClick,
  disabled = false,
  type = "button",
  ariaLabel,
  className = "",
  children,
}) {
  const [from, to] = TONES[tone] || TONES.violet;
  const vars = { "--gf": from, "--gt": to };
  const isPill = children !== undefined && children !== null;

  if (!isPill) {
    return (
      <button
        type={type}
        onClick={onClick}
        disabled={disabled}
        aria-label={ariaLabel || label}
        style={vars}
        className={`group relative shrink-0 ${ICON_SIZE[size] || ICON_SIZE.md} rounded-full bg-white/[0.09] border border-white/15 flex items-center justify-center transition-all duration-500 motion-reduce:transition-none ${
          label ? "[@media(hover:hover)]:hover:w-[150px]" : ""
        } ${FOCUS} ${className}`}
      >
        <span className={FILL} />
        <span className={GLOW} />

        <span
          className={`relative z-10 flex items-center justify-center text-white transition-all duration-500 motion-reduce:transition-none [@media(hover:hover)]:group-hover:text-white group-active:text-white ${
            label ? "[@media(hover:hover)]:group-hover:scale-0" : ""
          }`}
        >
          {icon}
        </span>

        {label && (
          <span className="absolute z-10 pointer-events-none whitespace-nowrap text-white uppercase tracking-wide text-xs font-bold scale-0 transition-all duration-500 delay-150 motion-reduce:transition-none [@media(hover:hover)]:group-hover:scale-100">
            {label}
          </span>
        )}
      </button>
    );
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      style={vars}
      className={`group relative rounded-full font-bold flex items-center justify-center gap-2 transition-all duration-500 motion-reduce:transition-none ${
        PILL_SIZE[size] || PILL_SIZE.md
      } ${LOOK[look] || LOOK.solid} ${full ? "w-full" : ""} ${FOCUS} ${className}`}
    >
      <span className={look === "solid" ? FILL_ON : FILL} />
      <span className={GLOW} />
      <span
        className={`relative z-10 flex items-center justify-center gap-2 transition-colors duration-500 motion-reduce:transition-none ${
          LOOK_TEXT[look] || ""
        }`}
      >
        {icon}
        {children}
      </span>
    </button>
  );
}
