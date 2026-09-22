// src/components/OfflineBanner.jsx
// États visibles : hors connexion, synchronisation en cours, conflits à
// résoudre (section 18 du prompt frontend).

import { WifiOff, RefreshCw, AlertTriangle } from "lucide-react";
import { Link } from "react-router-dom";
import { useOnlineStatus } from "../hooks/useOnlineStatus.js";
import { useSyncStatus } from "../hooks/useSyncStatus.js";

export default function OfflineBanner() {
  const online = useOnlineStatus();
  const { pendingCount, conflictCount, syncing } = useSyncStatus();

  if (online && pendingCount === 0 && conflictCount === 0 && !syncing) return null;

  return (
    <div className="w-full">
      {!online && (
        <div className="flex items-center gap-2 bg-ink text-white text-sm px-4 py-2">
          <WifiOff size={16} />
          <span>Hors connexion — tes saisies sont enregistrées localement.</span>
        </div>
      )}
      {online && syncing && (
        <div className="flex items-center gap-2 bg-forest text-white text-sm px-4 py-2">
          <RefreshCw size={16} className="animate-spin" />
          <span>Synchronisation en cours…</span>
        </div>
      )}
      {online && !syncing && pendingCount > 0 && (
        <div className="flex items-center gap-2 bg-warning text-white text-sm px-4 py-2">
          <RefreshCw size={16} />
          <span>{pendingCount} opération(s) en attente de synchronisation.</span>
        </div>
      )}
      {conflictCount > 0 && (
        <Link
          to="/parametres/conflits"
          className="flex items-center gap-2 bg-danger text-white text-sm px-4 py-2"
        >
          <AlertTriangle size={16} />
          <span>{conflictCount} conflit(s) à résoudre — appuie ici.</span>
        </Link>
      )}
    </div>
  );
}
