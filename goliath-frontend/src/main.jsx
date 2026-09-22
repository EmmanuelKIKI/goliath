// src/main.jsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import "./styles/index.css";
import { startAutoSync } from "./services/syncQueue.js";

// Mode sombre : je respecte le choix mémorisé au démarrage.
if (localStorage.getItem("goliath-dark-mode") === "1") {
  document.documentElement.classList.add("dark");
}

// Service worker : app shell en cache pour un chargement hors connexion.
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/service-worker.js").catch((err) => {
      console.error("Échec de l'enregistrement du service worker.", err);
    });
  });
}

// File de synchronisation : rejeu automatique au retour de connexion.
startAutoSync();

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
);
