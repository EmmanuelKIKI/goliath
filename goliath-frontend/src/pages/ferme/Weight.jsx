// src/pages/ferme/Weight.jsx — Suivi du poids (alimente le FCR réel)
import { useEffect, useState } from "react";
import { Plus, Trash2, Scale } from "lucide-react";
import { listRecords, createRecord, deleteRecord, fetchLots } from "../../services/api.js";
import { TextField, NumberField, DateField, SelectField, TextAreaField } from "../../components/FormField.jsx";
import { formatDate } from "../../utils/format.js";
import ConfirmDialog from "../../components/ConfirmDialog.jsx";
import EmptyState from "../../components/EmptyState.jsx";
import LoadingState from "../../components/LoadingState.jsx";
import { useToast } from "../../hooks/useToast.jsx";

const emptyForm = {
  lot_id: "",
  weigh_date: "",
  average_weight_g: "",
  sample_size: "",
  min_weight_g: "",
  max_weight_g: "",
  sampling_method: "",
  observation: "",
};

export default function Weight() {
  const { showToast } = useToast();
  const [lots, setLots] = useState([]);
  const [weights, setWeights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyForm);
  const [showForm, setShowForm] = useState(false);
  const [toDelete, setToDelete] = useState(null);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    const [{ data: lotList }, { data: weightList }] = await Promise.all([
      fetchLots(),
      listRecords("weight_records", { orderBy: { column: "weigh_date", ascending: false } }),
    ]);
    setLots(lotList);
    setWeights(weightList);
    setLoading(false);
  }

  function openCreate() {
    setForm({ ...emptyForm, lot_id: lots[0]?.id ?? "" });
    setShowForm(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    await createRecord("weight_records", {
      lot_id: form.lot_id,
      weigh_date: form.weigh_date,
      average_weight_g: Number(form.average_weight_g),
      sample_size: Number(form.sample_size),
      min_weight_g: form.min_weight_g === "" ? null : Number(form.min_weight_g),
      max_weight_g: form.max_weight_g === "" ? null : Number(form.max_weight_g),
      sampling_method: form.sampling_method || null,
      observation: form.observation || null,
    });
    showToast("Pesée enregistrée.");
    setShowForm(false);
    load();
  }

  async function confirmDelete() {
    await deleteRecord("weight_records", toDelete.id);
    showToast("Pesée supprimée.");
    setToDelete(null);
    load();
  }

  if (loading) return <LoadingState />;

  return (
    <div className="space-y-4">
      <button onClick={openCreate} className="flex items-center gap-2 rounded-md bg-forest px-4 py-2.5 text-sm font-semibold text-white">
        <Plus size={16} /> Nouvelle pesée
      </button>

      {weights.length === 0 ? (
        <EmptyState icon={Scale} title="Aucune pesée enregistrée" description="Le FCR réel s'affiche dans les Statistiques dès qu'au moins deux pesées existent pour un lot." />
      ) : (
        <ul className="space-y-2">
          {weights.map((w) => (
            <li key={w.id} className="flex items-center justify-between rounded-md bg-white border border-black/5 px-4 py-3">
              <div>
                <p className="text-sm font-medium text-ink">{formatDate(w.weigh_date)} · {w.average_weight_g} g en moyenne</p>
                <p className="text-xs text-muted">{w.sample_size} sujets pesés{w.sampling_method ? ` · ${w.sampling_method}` : ""}</p>
              </div>
              <button onClick={() => setToDelete(w)} className="p-2 text-muted hover:text-danger"><Trash2 size={16} /></button>
            </li>
          ))}
        </ul>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/40 px-4 overflow-y-auto py-6">
          <form onSubmit={handleSubmit} className="w-full max-w-sm rounded-lg bg-white p-5 space-y-4">
            <h2 className="text-base font-semibold text-ink">Nouvelle pesée</h2>
            <SelectField id="w-lot" label="Lot" value={form.lot_id} onChange={(v) => setForm({ ...form, lot_id: v })} options={lots.map((l) => ({ value: l.id, label: l.name }))} required />
            <DateField id="w-date" label="Date de pesée" value={form.weigh_date} onChange={(v) => setForm({ ...form, weigh_date: v })} required />
            <NumberField id="w-avg" label="Poids moyen (g)" value={form.average_weight_g} onChange={(v) => setForm({ ...form, average_weight_g: v })} required />
            <NumberField id="w-sample" label="Nombre de sujets pesés" value={form.sample_size} onChange={(v) => setForm({ ...form, sample_size: v })} required />
            <NumberField id="w-min" label="Poids minimum (g)" value={form.min_weight_g} onChange={(v) => setForm({ ...form, min_weight_g: v })} />
            <NumberField id="w-max" label="Poids maximum (g)" value={form.max_weight_g} onChange={(v) => setForm({ ...form, max_weight_g: v })} />
            <TextField id="w-method" label="Méthode d'échantillonnage" value={form.sampling_method} onChange={(v) => setForm({ ...form, sampling_method: v })} />
            <TextAreaField id="w-obs" label="Observation" value={form.observation} onChange={(v) => setForm({ ...form, observation: v })} />
            <div className="flex justify-end gap-3">
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-muted">Annuler</button>
              <button type="submit" className="rounded-md bg-forest px-4 py-2 text-sm font-medium text-white">Enregistrer</button>
            </div>
          </form>
        </div>
      )}

      <ConfirmDialog open={!!toDelete} title="Supprimer cette pesée ?" confirmLabel="Supprimer" danger onConfirm={confirmDelete} onCancel={() => setToDelete(null)} />
    </div>
  );
}
