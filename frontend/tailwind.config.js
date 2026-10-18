/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          '"Plus Jakarta Sans"',
          "system-ui",
          "-apple-system",
          '"Segoe UI"',
          "Roboto",
          "sans-serif",
        ],
      },
      colors: {
        // Jetons du nouveau design (maquette "Accueil")
        night: {
          DEFAULT: "#08050e", // fond de l'application
          card: "#14111b", // surface des cartes
          raised: "#1c1826", // surface surélevée (boutons ronds, fenêtres)
        },
        brand: {
          violet: "#a855f7",
          fuchsia: "#d946ef",
          lavender: "#c4b5fd",
        },
      },
    },
  },
  plugins: [],
};
