// src/hooks/useSyncStatus.js
// Nombre d'opérations en attente + statut "synchronisation en cours",
// pour affichage dans le bandeau hors connexion.

import { useEffect, useState, useCallback } from "react";
import { countPendingSyncOps, getConflicts } from "../services/indexedDb.js";
import { onSyncStatusChange } from "../services/syncQueue.js";

export function useSyncStatus() {
  const [pendingCount, setPendingCount] = useState(0);
  const [conflictCount, setConflictCount] = useState(0);
  const [syncing, setSyncing] = useState(false);

  const refresh = useCallback(async () => {
    const [pending, conflicts] = await Promise.all([countPendingSyncOps(), getConflicts()]);
    setPendingCount(pending);
    setConflictCount(conflicts.length);
  }, []);

  useEffect(() => {
    refresh();
    const unsubscribe = onSyncStatusChange(({ syncing: isSyncing }) => {
      setSyncing(isSyncing);
      if (!isSyncing) refresh();
    });
    const interval = window.setInterval(refresh, 10000);
    return () => {
      unsubscribe();
      window.clearInterval(interval);
    };
  }, [refresh]);

  return { pendingCount, conflictCount, syncing, refresh };
}
