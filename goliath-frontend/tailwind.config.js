// Je définis ici toute mon identité visuelle : ma palette "terre et
// plumage", mes polices, et quelques ombres/rayons cohérents avec le
// reste de l'app. Je centralise tout ici pour ne jamais avoir à écrire
// un code couleur en dur dans un composant.

/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        // Sable : mon fond principal, un beige chaud tirant vers le khaki,
        // pensé pour rester lisible en plein soleil sur le terrain.
        sable: {
          DEFAULT: "#F1ECDD",
          soft: "#F8F5EC",
          deep: "#E4DCC5",
        },
        // Nuit Pintade : mon encre principale, un vert-noir profond
        // (couleur du plumage de pintade), utilisé pour le texte et
        // la navigation plutôt qu'un noir pur.
        pintade: {
          DEFAULT: "#1F2A24",
          light: "#37473D",
        },
        // Indigo Basse-cour : ma couleur d'action principale.
        indigo: {
          DEFAULT: "#35618C",
          light: "#4C7CAD",
          dark: "#254564",
        },
        // Maïs : ma couleur d'accent, utilisée pour les mises en avant
        // et les éléments positifs secondaires.
        mais: {
          DEFAULT: "#D9A441",
          light: "#EABD6B",
          dark: "#B5842D",
        },
        // Feuille : réservée aux indicateurs positifs (marge saine,
        // effectif stable).
        feuille: {
          DEFAULT: "#4C7A5E",
          light: "#6B9C7C",
        },
        // Rouille : réservée STRICTEMENT aux alertes critiques
        // (mortalité, stock épuisé, vaccination en retard).
        rouille: {
          DEFAULT: "#B44324",
          light: "#D3623F",
        },
      },
      fontFamily: {
        // Display : pour mes titres et mes gros chiffres de tableau de bord.
        display: ["'Space Grotesk'", "sans-serif"],
        // Corps : pour tout le texte courant, lisible même en petit sur mobile.
        sans: ["'Inter'", "sans-serif"],
        // Données : pour mes chiffres tabulaires (montants, quantités),
        // pour que mes colonnes de chiffres s'alignent parfaitement.
        mono: ["'IBM Plex Mono'", "monospace"],
      },
      boxShadow: {
        carte: "0 1px 2px rgba(31, 42, 36, 0.06), 0 2px 8px rgba(31, 42, 36, 0.06)",
      },
      borderRadius: {
        carte: "14px",
      },
    },
  },
  plugins: [],
};
