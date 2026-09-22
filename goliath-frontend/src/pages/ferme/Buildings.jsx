// src/pages/ferme/Buildings.jsx
import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Warehouse } from "lucide-react";
import { listRecords, createRecord, updateRecord, deleteRecord } from "../../services/api.js";
import { TextField, TextAreaField, NumberField } from "../../components/FormField.jsx";
import ConfirmDialog from "../../components/ConfirmDialog.jsx";
import EmptyState from "../../components/EmptyState.jsx";
import LoadingState from "../../components/LoadingState.jsx";
import { useToast } from "../../hooks/useToast.jsx";

const emptyForm = { name: "", capacity: "", description: "" };

export default function Buildings() {
  const { showToast } = useToast();
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
    const { data } = await listRecords("buildings", { orderBy: { column: "name" } });
    setBuildings(data);
    setLoading(false);
  }

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setShowForm(true);
  }

  function openEdit(building) {
    setEditing(building);
    setForm({ name: building.name, capacity: building.capacity ?? "", description: building.description ?? "" });
    setShowForm(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const payload = { name: form.name, capacity: form.capacity === "" ? null : Number(form.capacity), description: form.description || null };
    if (editing) {
      await updateRecord("buildings", editing.id, payload, editing.updated_at);
      showToast("Bâtiment mis à jour.");
    } else {
      await createRecord("buildings", payload);
      showToast("Bâtiment créé.");
    }
    setShowForm(false);
    load();
  }

  async function confirmDelete() {
    await deleteRecord("buildings", toDelete.id);
    showToast("Bâtiment supprimé.");
    setToDelete(null);
    load();
  }

  if (loading) return <LoadingState />;

  return (
    <div className="space-y-4">
      <button onClick={openCreate} className="flex items-center gap-2 rounded-md bg-forest px-4 py-2.5 text-sm font-semibold text-white">
        <Plus size={16} /> Nouveau bâtiment
      </button>

      {buildings.length === 0 ? (
        <EmptyState icon={Warehouse} title="Aucun bâtiment" description="Crée ton premier bâtiment pour pouvoir y rattacher des lots." />
      ) : (
        <ul className="space-y-2">
          {buildings.map((b) => (
            <li key={b.id} className="flex items-center justify-between rounded-md bg-white border border-black/5 px-4 py-3">
              <div>
                <p className="text-sm font-medium text-ink">{b.name}</p>
                <p className="text-xs text-muted">{b.capacity ? `Capacité : ${b.capacity}` : "Capacité non renseignée"}</p>
              </div>
              <div className="flex gap-1">
                <button onClick={() => openEdit(b)} className="p-2 text-muted hover:text-forest"><Pencil size={16} /></button>
                <button onClick={() => setToDelete(b)} className="p-2 text-muted hover:text-danger"><Trash2 size={16} /></button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/40 px-4">
          <form onSubmit={handleSubmit} className="w-full max-w-sm rounded-lg bg-white p-5 space-y-4">
            <h2 className="text-base font-semibold text-ink">{editing ? "Modifier le bâtiment" : "Nouveau bâtiment"}</h2>
            <TextField id="b-name" label="Nom" value={form.name} onChange={(v) => setForm({ ...form, name: v })} required />
            <NumberField id="b-capacity" label="Capacité" value={form.capacity} onChange={(v) => setForm({ ...form, capacity: v })} />
            <TextAreaField id="b-desc" label="Description" value={form.description} onChange={(v) => setForm({ ...form, description: v })} />
            <div className="flex justify-end gap-3">
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-muted">Annuler</button>
              <button type="submit" className="rounded-md bg-forest px-4 py-2 text-sm font-medium text-white">Enregistrer</button>
            </div>
          </form>
        </div>
      )}

      <ConfirmDialog
        open={!!toDelete}
        title="Supprimer ce bâtiment ?"
        description="Impossible si des lots y sont encore rattachés."
        confirmLabel="Supprimer"
        danger
        onConfirm={confirmDelete}
        onCancel={() => setToDelete(null)}
      />
    </div>
  );
}
