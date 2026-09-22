// src/layouts/navConfig.js
import {
  LayoutDashboard,
  ClipboardList,
  History,
  BarChart3,
  Stethoscope,
  Warehouse,
  Settings,
} from "lucide-react";

export const NAV_ITEMS = [
  { to: "/tableau-de-bord", label: "Tableau de bord", icon: LayoutDashboard },
  { to: "/suivi-du-jour", label: "Suivi du jour", icon: ClipboardList },
  { to: "/historique", label: "Historique", icon: History },
  { to: "/statistiques", label: "Statistiques", icon: BarChart3 },
  { to: "/assistant-sante", label: "Assistant santé", icon: Stethoscope },
  { to: "/ma-ferme", label: "Ma ferme", icon: Warehouse },
  { to: "/parametres", label: "Paramètres", icon: Settings },
];

// Sur mobile, la barre inférieure ne peut raisonnablement afficher que 5
// entrées : je garde les parcours les plus fréquents, "Ma ferme" et
// "Paramètres" restent accessibles depuis le tableau de bord et le menu.
export const MOBILE_NAV_ITEMS = NAV_ITEMS.filter((item) =>
  ["/tableau-de-bord", "/suivi-du-jour", "/historique", "/statistiques", "/assistant-sante"].includes(
    item.to,
  ),
);
