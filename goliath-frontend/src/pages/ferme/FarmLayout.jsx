// src/pages/ferme/FarmLayout.jsx — "Ma ferme" (section 12 du prompt frontend)
import { NavLink, Outlet } from "react-router-dom";

const TABS = [
  { to: "/ma-ferme/batiments", label: "Bâtiments" },
  { to: "/ma-ferme/lots", label: "Lots" },
  { to: "/ma-ferme/poids", label: "Poids" },
  { to: "/ma-ferme/achats", label: "Achats" },
];

export default function FarmLayout() {
  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-xl font-bold text-ink">Ma ferme</h1>
        <p className="text-sm text-muted">Bâtiments, lots, suivi du poids et achats d'aliment.</p>
      </header>

      <nav className="flex gap-1 border-b border-black/10">
        {TABS.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            className={({ isActive }) =>
              `px-3 py-2.5 text-sm font-medium border-b-2 -mb-px ${
                isActive ? "border-forest text-forest" : "border-transparent text-muted"
              }`
            }
          >
            {tab.label}
          </NavLink>
        ))}
      </nav>

      <Outlet />
    </div>
  );
}
