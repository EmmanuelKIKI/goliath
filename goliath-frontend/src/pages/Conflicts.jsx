// src/pages/Conflicts.jsx
// Vue dédiée où je choisis manuellement quelle version garder en cas de
// conflit (base_updated_at obsolète) — jamais un écrasement silencieux.

import { useEffect, useState } from "react";
import { getConflicts, resolveConflictKeepLocal, resolveConflictKeepServer } from "../services/indexedDb.js";
import { replaySyncQueue } from "../services/syncQueue.js";
import EmptyState from "../components/EmptyState.jsx";
import { CheckCircle2, AlertTriangle } from "lucide-react";
import { useToast } from "../hooks/useToast.jsx";

export default function Conflicts() {
  const { showToast } = useToast();
  const [conflicts, setConflicts] = useState([]);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setConflicts(await getConflicts());
  }

  async function keepLocal(conflict) {
    await resolveConflictKeepLocal(conflict.queue_id);
    await replaySyncQueue();
    showToast("Ma version locale sera renvoyée au serveur.");
    load();
  }

  async function keepServer(conflict) {
    await resolveConflictKeepServer(conflict.operation.table, conflict.queue_id);
    showToast("La version du serveur a été conservée.");
    load();
  }

  if (conflicts.length === 0) {
    return (
      <EmptyState
        icon={CheckCircle2}
        title="Aucun conflit en attente"
        description="Toutes tes modifications sont synchronisées."
      />
    );
  }

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-xl font-bold text-ink">Conflits à résoudre</h1>
        <p className="text-sm text-muted">
          Ces éléments ont changé côté serveur pendant que tu les modifiais localement. Choisis quelle version garder.
        </p>
      </header>

      <ul className="space-y-3">
        {conflicts.map((c) => (
          <li key={c.queue_id} className="rounded-md bg-white border border-danger/30 p-4 space-y-3">
            <div className="flex items-center gap-2 text-sm text-danger">
              <AlertTriangle size={16} />
              {c.operation.table} · {c.operation.record_id}
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="rounded-md bg-surface p-2">
                <p className="font-medium text-ink mb-1">Ma version locale</p>
                <pre className="whitespace-pre-wrap">{JSON.stringify(c.operation.payload, null, 2)}</pre>
              </div>
              <div className="rounded-md bg-surface p-2">
                <p className="font-medium text-ink mb-1">Version du serveur</p>
                <pre className="whitespace-pre-wrap">{JSON.stringify(c.server_record, null, 2)}</pre>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => keepLocal(c)} className="rounded-md bg-forest px-3 py-2 text-xs font-medium text-white">
                Garder ma version
              </button>
              <button onClick={() => keepServer(c)} className="rounded-md border border-black/10 px-3 py-2 text-xs font-medium text-ink">
                Garder la version du serveur
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
