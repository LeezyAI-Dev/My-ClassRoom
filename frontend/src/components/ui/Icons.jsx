import React from "react";

// Jeu d'icônes unique de l'application : contour 1.8, extrémités arrondies, couleur = currentColor.
// Les icônes posées à côté d'un texte sont décoratives (aria-hidden) ; un bouton qui ne contient
// qu'une icône doit avoir un aria-label.
function Svg({ size = 22, children, ...rest }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      {children}
    </svg>
  );
}

export const CapIcon = (p) => (
  <Svg {...p}>
    <path d="M2 9.5 12 5l10 4.5L12 14 2 9.5z" />
    <path d="M6 11.7V16c0 1.4 2.7 3 6 3s6-1.6 6-3v-4.3" />
    <path d="M22 9.5V15" />
  </Svg>
);

export const BookIcon = (p) => (
  <Svg {...p}>
    <path d="M6 3.5h11a1.5 1.5 0 0 1 1.5 1.5v14A1.5 1.5 0 0 1 17 20.5H7.5A2.5 2.5 0 0 1 5 18V5a1.5 1.5 0 0 1 1-1.5z" />
    <path d="M5 18a2.5 2.5 0 0 1 2.5-2.5h11" />
    <path d="M10 8.5h4" />
  </Svg>
);

export const DocIcon = (p) => (
  <Svg {...p}>
    <path d="M7 3h7l4.5 4.5V20a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z" />
    <path d="M14 3v4.5h4.5" />
    <path d="M9.5 12.5h5M9.5 16h5" />
  </Svg>
);

export const CalcIcon = (p) => (
  <Svg {...p}>
    <rect x="5" y="2.8" width="14" height="18.4" rx="2.6" />
    <path d="M8.5 7.5h7M8.5 11.5h7M8.5 15.5h3.5" />
  </Svg>
);

export const EyeIcon = ({ filled = false, ...p }) => (
  <Svg {...p}>
    <path d="M2 12s3.6-6.5 10-6.5S22 12 22 12s-3.6 6.5-10 6.5S2 12 2 12z" />
    <circle cx="12" cy="12" r="3" fill={filled ? "currentColor" : "none"} />
  </Svg>
);

export const ChecklistIcon = (p) => (
  <Svg {...p}>
    <rect x="5" y="4" width="14" height="17" rx="2.6" />
    <path d="M9 4V3h6v1" />
    <path d="m9 13.2 2.1 2.1 3.9-4.2" />
  </Svg>
);

export const CalendarIcon = (p) => (
  <Svg {...p}>
    <rect x="3.5" y="5" width="17" height="15.5" rx="2.6" />
    <path d="M3.5 10h17M8 3v4M16 3v4" />
  </Svg>
);

export const UserIcon = (p) => (
  <Svg {...p}>
    <circle cx="12" cy="8" r="3.8" />
    <path d="M4.5 20.5c.6-3.9 3.6-6 7.5-6s6.9 2.1 7.5 6" />
  </Svg>
);

export const ChevronLeftIcon = (p) => (
  <Svg {...p} strokeWidth="2.2">
    <path d="m14.5 5.5-6.5 6.5 6.5 6.5" />
  </Svg>
);

export const ChevronRightIcon = (p) => (
  <Svg {...p} strokeWidth="2.2">
    <path d="m9.5 5.5 6.5 6.5-6.5 6.5" />
  </Svg>
);

export const HomeIcon = (p) => (
  <Svg {...p}>
    <path d="M3.5 11 12 3.8 20.5 11" />
    <path d="M5.5 9.8V19a1 1 0 0 0 1 1H10v-5h4v5h3.5a1 1 0 0 0 1-1V9.8" />
  </Svg>
);

export const LogoutIcon = (p) => (
  <Svg {...p}>
    <path d="M10 4H6.5A1.5 1.5 0 0 0 5 5.5v13A1.5 1.5 0 0 0 6.5 20H10" />
    <path d="M14 8l4 4-4 4M18 12H9.5" />
  </Svg>
);

export const PlusIcon = (p) => (
  <Svg {...p} strokeWidth="2.2">
    <path d="M12 5v14M5 12h14" />
  </Svg>
);

export const TrashIcon = (p) => (
  <Svg {...p}>
    <path d="M4 7h16M9.5 7V4.5h5V7M6.5 7l.9 12.5a1 1 0 0 0 1 .9h7.2a1 1 0 0 0 1-.9L17.5 7M10 11v5.5M14 11v5.5" />
  </Svg>
);

export const CloseIcon = (p) => (
  <Svg {...p} strokeWidth="2.2">
    <path d="M6 6l12 12M18 6 6 18" />
  </Svg>
);

export const ResetIcon = (p) => (
  <Svg {...p}>
    <path d="M4 12a8 8 0 1 0 2.6-5.9" />
    <path d="M4 4.5V8.5h4" />
  </Svg>
);

export const ChatIcon = (p) => (
  <Svg {...p}>
    <path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12Z" />
  </Svg>
);

export const SendIcon = (p) => (
  <Svg {...p}>
    <path d="M22 2 11 13" />
    <path d="M22 2 15 22l-4-9-9-4 20-7Z" />
  </Svg>
);

export const SparkIcon = (p) => (
  <Svg {...p}>
    <path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9L12 3Z" />
  </Svg>
);
