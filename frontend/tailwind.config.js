/** @type {import('tailwindcss').Config} */
// Jetons de design de My ClassRoom (nouvelle maquette : fond noir/violet, cartes en verre).
// Toujours utiliser ces noms (bg-ink, bg-surface, text-lavender, bg-brand-gradient, shadow-glow…)
// plutôt que des valeurs hexadécimales dans les pages.
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#07050d", // fond de l'application
        surface: {
          DEFAULT: "#15101f", // fenêtres et panneaux pleins
          raised: "#1d1730",
        },
        lavender: "#cdbfe8", // texte secondaire teinté violet
        brand: {
          DEFAULT: "#a955ff",
          pink: "#ea51ff",
        },
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', "system-ui", "-apple-system", '"Segoe UI"', "Roboto", "sans-serif"],
      },
      backgroundImage: {
        "brand-gradient": "linear-gradient(135deg, #a955ff 0%, #ea51ff 100%)",
        "title-gradient": "linear-gradient(180deg, #ffffff 25%, #c9b3ff 100%)",
      },
      boxShadow: {
        glow: "0 0 22px -4px rgba(169, 85, 255, 0.55)",
        "glow-sm": "0 0 14px -4px rgba(169, 85, 255, 0.5)",
      },
    },
  },
  plugins: [],
};
