import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Je garde une configuration Vite minimale : pas de dépendance lourde
// inutile (section 19 du prompt), le service worker et le manifest sont
// gérés à la main, pas via un plugin PWA supplémentaire.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
  },
  build: {
    outDir: "dist",
    sourcemap: false,
  },
});
