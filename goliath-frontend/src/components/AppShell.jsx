// C'est le cadre commun à toutes mes pages une fois connecté : ma
// barre "plumage" signature en haut, le bandeau hors-ligne s'il y a
// lieu, l'en-tête avec le titre de la page, le contenu, puis ma
// navigation en bas.

import { Link } from "react-router-dom";
import { Settings } from "lucide-react";
import OfflineBanner from "./OfflineBanner";
import BottomNav from "./BottomNav";
import { useAuth } from "../context/AuthContext";

export default function AppShell({ titre, actions, children }) {
  const { nom, deconnexion } = useAuth();

  return (
    <div className="min-h-screen flex flex-col pb-20">
      <div className="bande-plumage" aria-hidden="true" />
      <OfflineBanner />

      <header className="px-4 pt-4 pb-3 flex items-center justify-between gap-3">
        <div>
          <Link to="/" className="text-xs uppercase tracking-widest text-mais-dark font-semibold">
            GOLIATH
          </Link>
          <h1 className="font-display text-2xl font-semibold text-pintade leading-tight">{titre}</h1>
        </div>
        <div className="flex items-center gap-2">
          {actions}
          <Link to="/parametres" className="text-pintade-light hover:text-pintade" title="Mes paramètres" aria-label="Mes paramètres">
            <Settings size={20} strokeWidth={2} />
          </Link>
          {nom && (
            <button
              onClick={deconnexion}
              className="text-xs text-pintade-light hover:text-rouille px-2 py-1"
              title="Je me déconnecte"
            >
              Déconnexion
            </button>
          )}
        </div>
      </header>

      <main className="flex-1 px-4 pb-6">{children}</main>

      <BottomNav />
    </div>
  );
}
