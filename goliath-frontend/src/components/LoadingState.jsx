// src/components/LoadingState.jsx
import { Loader2 } from "lucide-react";

export default function LoadingState({ label = "Chargement…" }) {
  return (
    <div className="flex items-center justify-center gap-2 py-12 text-muted text-sm">
      <Loader2 size={18} className="animate-spin" />
      <span>{label}</span>
    </div>
  );
}
