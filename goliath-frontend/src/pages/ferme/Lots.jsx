// src/pages/ferme/Lots.jsx
import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Bird } from "lucide-react";
import { listRecords, createRecord, updateRecord, deleteRecord } from "../../services/api.js";
import { TextField, NumberField, DateField, SelectField } from "../../components/FormField.jsx";
import { formatLotAge } from "../../utils/format.js";
import ConfirmDialog from "../../components/ConfirmDialog.jsx";
import EmptyState from "../../components/EmptyState.jsx";
import LoadingState from "../../components/LoadingState.jsx";
import { useToast } from "../../hooks/useToast.jsx";

const STATUTS = [
  { value: "actif", label: "Actif" },
  { value: "clos", label: "Clos" },
  { value: "suspendu", label: "Suspendu" },
];

const emptyForm = {
  building_id: "",
  name: "",
  species: "",
  breed: "",
  entry_date: "",
  initial_count: "",
  housing_type: "",
  status: "actif",
};

export default function Lots() {
  const { showToast } = useToast();
  const [lots, setLots] = useState([]);
  const [buildings, setBuildings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [showForm, setShowForm] = useState(false);
  const [toDelete, setToDelete] = useState(null);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    const [{ data: lotList }, { data: buildingList }] = await Promise.all([
      listRecords("lots", { orderBy: { column: "name" } }),
      listRecords("buildings", { orderBy: { column: "name" } }),
    ]);
    setLots(lotList);
    setBuildings(buildingList);
    setLoading(false);
  }

  function openCreate() {
    setEditing(null);
    setForm({ ...emptyForm, building_id: buildings[0]?.id ?? "" });
    setShowForm(true);
  }

  function openEdit(lot) {
    setEditing(lot);
    setForm({
      building_id: lot.building_id,
      name: lot.name,
      species: lot.species,
      breed: lot.breed ?? "",
      entry_date: lot.entry_date,
      initial_count: lot.initial_count,
      housing_type: lot.housing_type ?? "",
      status: lot.status,
    });
    setShowForm(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const payload = { ...form, initial_count: Number(form.initial_count) || 0, breed: form.breed || null, housing_type: form.housing_type || null };
    if (editing) {
      await updateRecord("lots", editing.id, payload, editing.updated_at);
      showToast("Lot mis à jour.");
    } else {
      await createRecord("lots", payload);
      showToast("Lot créé.");
    }
    setShowForm(false);
    load();
  }

  async function confirmDelete() {
    await deleteRecord("lots", toDelete.id);
    showToast("Lot supprimé.");
    setToDelete(null);
    load();
  }

  if (loading) return <LoadingState />;

  if (buildings.length === 0) {
    return (
      <EmptyState
        icon={Bird}
        title="Crée d'abord un bâtiment"
        description="Un lot doit toujours être rattaché à un bâtiment existant."
      />
    );
  }

  return (
    <div className="space-y-4">
      <button onClick={openCreate} className="flex items-center gap-2 rounded-md bg-forest px-4 py-2.5 text-sm font-semibold text-white">
        <Plus size={16} /> Nouveau lot
      </button>

      {lots.length === 0 ? (
        <EmptyState icon={Bird} title="Aucun lot" description="Crée ton premier lot pour commencer le suivi quotidien." />
      ) : (
        <ul className="space-y-2">
          {lots.map((lot) => (
            <li key={lot.id} className="flex items-center justify-between rounded-md bg-white border border-black/5 px-4 py-3">
              <div>
                <p className="text-sm font-medium text-ink">{lot.name} · {lot.species}</p>
                <p className="text-xs text-muted">
                  {buildings.find((b) => b.id === lot.building_id)?.name} · âge {formatLotAge(lot.entry_date)} · {lot.status}
                </p>
              </div>
              <div className="flex gap-1">
                <button onClick={() => openEdit(lot)} className="p-2 text-muted hover:text-forest"><Pencil size={16} /></button>
                <button onClick={() => setToDelete(lot)} className="p-2 text-muted hover:text-danger"><Trash2 size={16} /></button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/40 px-4 overflow-y-auto py-6">
          <form onSubmit={handleSubmit} className="w-full max-w-sm rounded-lg bg-white p-5 space-y-4">
            <h2 className="text-base font-semibold text-ink">{editing ? "Modifier le lot" : "Nouveau lot"}</h2>
            <SelectField id="l-building" label="Bâtiment" value={form.building_id} onChange={(v) => setForm({ ...form, building_id: v })} options={buildings.map((b) => ({ value: b.id, label: b.name }))} required />
            <TextField id="l-name" label="Nom du lot" value={form.name} onChange={(v) => setForm({ ...form, name: v })} required />
            <TextField id="l-species" label="Espèce" value={form.species} onChange={(v) => setForm({ ...form, species: v })} required />
            <TextField id="l-breed" label="Souche" value={form.breed} onChange={(v) => setForm({ ...form, breed: v })} />
            <DateField id="l-entry" label="Date d'entrée" value={form.entry_date} onChange={(v) => setForm({ ...form, entry_date: v })} required />
            <NumberField id="l-count" label="Effectif initial" value={form.initial_count} onChange={(v) => setForm({ ...form, initial_count: v })} required />
            <TextField id="l-housing" label="Type d'élevage" value={form.housing_type} onChange={(v) => setForm({ ...form, housing_type: v })} />
            <SelectField id="l-status" label="Statut" value={form.status} onChange={(v) => setForm({ ...form, status: v })} options={STATUTS} />
            <div className="flex justify-end gap-3">
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-muted">Annuler</button>
              <button type="submit" className="rounded-md bg-forest px-4 py-2 text-sm font-medium text-white">Enregistrer</button>
            </div>
          </form>
        </div>
      )}

      <ConfirmDialog
        open={!!toDelete}
        title="Supprimer ce lot ?"
        description="Tout l'historique lié à ce lot sera aussi supprimé."
        confirmLabel="Supprimer"
        danger
        onConfirm={confirmDelete}
        onCancel={() => setToDelete(null)}
      />
    </div>
  );
}
