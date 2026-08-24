// Ma navigation principale, en bas de l'écran façon app mobile,
// puisque j'utilise GOLIATH surtout depuis mon téléphone, au champ,
// avec le pouce. Je garde 5 entrées maximum pour que ça reste
// confortable à toucher.

import { NavLink } from "react-router-dom";
import { House, Bird, Package, Wallet, ListChecks } from "lucide-react";

// Je garde mes icônes en SVG (via lucide-react) plutôt qu'en émojis :
// elles restent nettes à toutes les tailles d'écran et gardent un
// rendu identique sur tous les appareils.
const ONGLETS = [
  { chemin: "/", label: "Accueil", Icone: House },
  { chemin: "/bandes", label: "Bandes", Icone: Bird },
  { chemin: "/stocks", label: "Stocks", Icone: Package },
  { chemin: "/finances", label: "Finances", Icone: Wallet },
  { chemin: "/taches", label: "Tâches", Icone: ListChecks },
];

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-sable-soft border-t border-pintade/10 z-40 pb-[env(safe-area-inset-bottom)]">
      <ul className="flex justify-around">
        {ONGLETS.map((onglet) => (
          <li key={onglet.chemin} className="flex-1">
            <NavLink
              to={onglet.chemin}
              end={onglet.chemin === "/"}
              className={({ isActive }) =>
                `flex flex-col items-center gap-0.5 py-2.5 text-xs font-medium transition-colors ${
                  isActive ? "text-indigo" : "text-pintade-light"
                }`
              }
            >
              <onglet.Icone size={20} strokeWidth={2} aria-hidden="true" />
              {onglet.label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
