// src/components/AlertBanner.jsx
// Alertes de gestion uniquement (section 11 du prompt frontend), jamais
// présentées comme des diagnostics vétérinaires. Le calcul du seuil vient
// du backend (farm_settings + KPI) ; ce composant ne fait qu'afficher.

import { AlertTriangle } from "lucide-react";

export default function AlertBanner({ messages }) {
  if (!messages || messages.length === 0) return null;

  return (
    <div className="space-y-2">
      {messages.map((msg, i) => (
        <div
          key={i}
          className="flex items-start gap-2 rounded-md border border-warning/30 bg-warning/10 px-3 py-2 text-sm text-ink"
        >
          <AlertTriangle size={16} className="mt-0.5 shrink-0 text-warning" />
          <span>{msg}</span>
        </div>
      ))}
    </div>
  );
}
