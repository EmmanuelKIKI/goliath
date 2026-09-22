// src/layouts/Sidebar.jsx — navigation ordinateur (section 6 : "Ordinateur : sidebar")
import { NavLink } from "react-router-dom";
import { LogOut } from "lucide-react";
import { NAV_ITEMS } from "./navConfig.js";
import { useAuth } from "../hooks/useAuth.jsx";

export default function Sidebar() {
  const { logout } = useAuth();

  return (
    <aside className="hidden md:flex md:w-60 md:flex-col md:border-r md:border-black/5 md:bg-white md:py-6">
      <div className="px-6 pb-6">
        <p className="text-lg font-extrabold text-forest tracking-tight">GOLIATH</p>
        <p className="text-xs text-muted">Ma Ferme Avicole</p>
      </div>

      <nav className="flex-1 space-y-1 px-3">
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive ? "bg-forest text-white" : "text-ink hover:bg-surface"
              }`
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="px-3 pt-4 border-t border-black/5">
        <button
          onClick={logout}
          className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-muted hover:bg-surface"
        >
          <LogOut size={18} />
          Se déconnecter
        </button>
      </div>
    </aside>
  );
}
