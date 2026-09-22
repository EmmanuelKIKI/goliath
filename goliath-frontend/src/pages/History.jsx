// src/pages/History.jsx — Historique et filtres (section 9 du prompt frontend)
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, Pencil, Trash2 } from "lucide-react";
import { supabase } from "../services/supabaseClient.js";
import { fetchLots, deleteRecord } from "../services/api.js";
import { exportRecordsToCsv } from "../services/backupExport.js";
import { formatDate, formatNumber } from "../utils/format.js";
import { Download } from "lucide-react";
import { SelectField, DateField } from "../components/FormField.jsx";
import ConfirmDialog from "../components/ConfirmDialog.jsx";
import LoadingState from "../components/LoadingState.jsx";
import EmptyState from "../components/EmptyState.jsx";
import { useToast } from "../hooks/useToast.jsx";
import { History as HistoryIcon } from "lucide-react";

export default function History() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [lots, setLots] = useState([]);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toDelete, setToDelete] = useState(null);

  const [filters, setFilters] = useState({
    lotId: "",
    dateDebut: "",
    dateFin: "",
    onlyMortality: false,
    onlyIncidents: false,
  });

  useEffect(() => {
    fetchLots().then(({ data }) => setLots(data));
  }, []);

  useEffect(() => {
    loadRecords();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  async function loadRecords() {
    setLoading(true);
    let query = supabase
      .from("daily_records")
      .select("*, lots(name)")
      .order("record_date", { ascending: false })
      .limit(100);

    if (filters.lotId) query = query.eq("lot_id", filters.lotId);
    if (filters.dateDebut) query = query.gte("record_date", filters.dateDebut);
    if (filters.dateFin) query = query.lte("record_date", filters.dateFin);
    if (filters.onlyMortality) query = query.gt("deaths", 0);

    const { data, error } = await query;
    if (!error) setRecords(data ?? []);
    setLoading(false);
  }

  async function confirmDelete() {
    if (!toDelete) return;
    await deleteRecord("daily_records", toDelete.id);
    showToast("Suivi supprimé.");
    setToDelete(null);
    loadRecords();
  }

  return (
    <div className="space-y-5">
      <header className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-ink">Historique</h1>
          <p className="text-sm text-muted">Retrouve et modifie tes suivis précédents.</p>
        </div>
        {records.length > 0 && (
          <button
            onClick={() =>
              exportRecordsToCsv(
                records,
                [
                  { key: "record_date", label: "Date" },
                  { key: "actual_count", label: "Effectif réel" },
                  { key: "theoretical_count", label: "Effectif théorique" },
                  { key: "count_difference", label: "Écart" },
                  { key: "deaths", label: "Morts" },
                  { key: "observation", label: "Observation" },
                ],
                `goliath-historique-${new Date().toISOString().slice(0, 10)}.csv`,
              )
            }
            className="flex items-center gap-2 rounded-md border border-black/10 px-3 py-2 text-sm font-medium text-ink shrink-0"
          >
            <Download size={16} /> Export CSV
          </button>
        )}
      </header>

      <section className="rounded-lg bg-white border border-black/5 p-4 grid grid-cols-2 md:grid-cols-4 gap-3">
        <SelectField
          id="filter-lot"
          label="Lot"
          value={filters.lotId}
          onChange={(v) => setFilters({ ...filters, lotId: v })}
          options={lots.map((l) => ({ value: l.id, label: l.name }))}
          placeholder="Tous les lots"
        />
        <DateField id="filter-debut" label="Depuis" value={filters.dateDebut} onChange={(v) => setFilters({ ...filters, dateDebut: v })} />
        <DateField id="filter-fin" label="Jusqu'à" value={filters.dateFin} onChange={(v) => setFilters({ ...filters, dateFin: v })} />
        <label className="flex items-center gap-2 text-sm text-ink mt-6">
          <input
            type="checkbox"
            checked={filters.onlyMortality}
            onChange={(e) => setFilters({ ...filters, onlyMortality: e.target.checked })}
            className="h-4 w-4 rounded border-black/20 text-forest"
          />
          Avec mortalité
        </label>
      </section>

      {loading ? (
        <LoadingState />
      ) : records.length === 0 ? (
        <EmptyState icon={HistoryIcon} title="Aucun suivi trouvé" description="Ajuste les filtres ou crée ton premier suivi du jour." />
      ) : (
        <ul className="space-y-2">
          {records.map((r) => (
            <li key={r.id} className="flex items-center justify-between rounded-md bg-white border border-black/5 px-4 py-3">
              <div>
                <p className="text-sm font-medium text-ink">
                  {formatDate(r.record_date)} · {r.lots?.name}
                </p>
                <p className="text-xs text-muted">
                  Effectif réel {formatNumber(r.actual_count, 0)} · écart {r.count_difference} · morts {r.deaths}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => navigate(`/suivi-du-jour?lot=${r.lot_id}&date=${r.record_date}`)}
                  aria-label="Voir / modifier"
                  className="p-2 text-muted hover:text-forest"
                >
                  <Pencil size={16} />
                </button>
                <button
                  onClick={() => setToDelete(r)}
                  aria-label="Supprimer"
                  className="p-2 text-muted hover:text-danger"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <ConfirmDialog
        open={!!toDelete}
        title="Supprimer ce suivi ?"
        description="Cette action est définitive."
        confirmLabel="Supprimer"
        danger
        onConfirm={confirmDelete}
        onCancel={() => setToDelete(null)}
      />
    </div>
  );
}
