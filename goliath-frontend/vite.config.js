// Ma configuration Vite. C'est ici que je transforme mon app React en
// vraie PWA installable, avec un service worker qui met en cache mon
// interface et mes dernières données consultées, pour pouvoir au moins
// consulter mes infos même si le réseau coupe en pleine ferme.

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["icons/icon-192.png", "icons/icon-512.png"],
      manifest: {
        name: "GOLIATH — Gestion d'élevage",
        short_name: "GOLIATH",
        description: "Je gère mon élevage de poulets Goliath depuis mon téléphone.",
        theme_color: "#1F2A24",
        background_color: "#F1ECDD",
        display: "standalone",
        orientation: "portrait",
        start_url: "/",
        scope: "/",
        icons: [
          { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
          { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
      workbox: {
        // Je mets en cache l'app shell (JS, CSS, HTML) automatiquement.
        globPatterns: ["**/*.{js,css,html,svg,png,ico}"],
        // Pour mes appels API (GET uniquement), je sers d'abord le réseau,
        // et si je suis hors-ligne, je retombe sur la dernière réponse
        // que j'ai en cache. Ça me permet de consulter mes bandes, mes
        // stocks, etc. même sans connexion, même si je ne peux pas les
        // modifier hors-ligne.
        runtimeCaching: [
          {
            urlPattern: ({ url, request }) =>
              request.method === "GET" && url.pathname.startsWith("/") && url.port === "4000",
            handler: "NetworkFirst",
            options: {
              cacheName: "goliath-api-cache",
              networkTimeoutSeconds: 4,
              expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 * 7 },
            },
          },
        ],
      },
    }),
  ],
  server: {
    port: 5173,
  },
});
