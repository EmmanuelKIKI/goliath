// src/pages/ferme/Purchases.jsx — Achats et coûts d'aliment
import { useEffect, useState } from "react";
import { Plus, Trash2, ShoppingCart } from "lucide-react";
import { listRecords, createRecord, deleteRecord, fetchFarmSettings } from "../../services/api.js";
import { TextField, NumberField, DateField, SelectField, TextAreaField } from "../../components/FormField.jsx";
import { formatDate, formatCurrency } from "../../utils/format.js";
import ConfirmDialog from "../../components/ConfirmDialog.jsx";
import EmptyState from "../../components/EmptyState.jsx";
import LoadingState from "../../components/LoadingState.jsx";
import { useToast } from "../../hooks/useToast.jsx";

const emptyForm = {
  feed_type: "",
  quantity_kg: "",
  unit_price: "",
  purchase_date: "",
  supplier: "",
  building_id: "",
  observation: "",
};

export default function Purchases() {
  const { showToast } = useToast();
  const [purchases, setPurchases] = useState([]);
  const [buildings, setBuildings] = useState([]);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyForm);
  const [showForm, setShowForm] = useState(false);
  const [toDelete, setToDelete] = useState(null);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    const [{ data: purchaseList }, { data: buildingList }, farmSettings] = await Promise.all([
      listRecords("feed_purchases", { orderBy: { column: "purchase_date", ascending: false } }),
      listRecords("buildings", { orderBy: { column: "name" } }),
      fetchFarmSettings(),
    ]);
    setPurchases(purchaseList);
    setBuildings(buildingList);
    setSettings(farmSettings);
    setLoading(false);
  }

  function openCreate() {
    setForm(emptyForm);
    setShowForm(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    await createRecord("feed_purchases", {
      feed_type: form.feed_type,
      quantity_kg: Number(form.quantity_kg),
      unit_price: Number(form.unit_price),
      purchase_date: form.purchase_date,
      supplier: form.supplier || null,
      building_id: form.building_id || null,
      observation: form.observation || null,
    });
    showToast("Achat enregistré.");
    setShowForm(false);
    load();
  }

  async function confirmDelete() {
    await deleteRecord("feed_purchases", toDelete.id);
    showToast("Achat supprimé.");
    setToDelete(null);
    load();
  }

  if (loading) return <LoadingState />;

  return (
    <div className="space-y-4">
      <button onClick={openCreate} className="flex items-center gap-2 rounded-md bg-forest px-4 py-2.5 text-sm font-semibold text-white">
        <Plus size={16} /> Nouvel achat
      </button>

      {purchases.length === 0 ? (
        <EmptyState icon={ShoppingCart} title="Aucun achat enregistré" description="Enregistre tes achats d'aliment pour alimenter le coût d'aliment par sujet." />
      ) : (
        <ul className="space-y-2">
          {purchases.map((p) => (
            <li key={p.id} className="flex items-center justify-between rounded-md bg-white border border-black/5 px-4 py-3">
              <div>
                <p className="text-sm font-medium text-ink">{formatDate(p.purchase_date)} · {p.feed_type}</p>
                <p className="text-xs text-muted">{p.quantity_kg} kg · {formatCurrency(p.total_cost, settings?.currency)}{p.supplier ? ` · ${p.supplier}` : ""}</p>
              </div>
              <button onClick={() => setToDelete(p)} className="p-2 text-muted hover:text-danger"><Trash2 size={16} /></button>
            </li>
          ))}
        </ul>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/40 px-4 overflow-y-auto py-6">
          <form onSubmit={handleSubmit} className="w-full max-w-sm rounded-lg bg-white p-5 space-y-4">
            <h2 className="text-base font-semibold text-ink">Nouvel achat</h2>
            <TextField id="p-type" label="Type d'aliment" value={form.feed_type} onChange={(v) => setForm({ ...form, feed_type: v })} required />
            <NumberField id="p-qty" label="Quantité (kg)" value={form.quantity_kg} onChange={(v) => setForm({ ...form, quantity_kg: v })} required />
            <NumberField id="p-price" label="Prix unitaire" value={form.unit_price} onChange={(v) => setForm({ ...form, unit_price: v })} required suffix={settings?.currency} />
            <DateField id="p-date" label="Date d'achat" value={form.purchase_date} onChange={(v) => setForm({ ...form, purchase_date: v })} required />
            <TextField id="p-supplier" label="Fournisseur" value={form.supplier} onChange={(v) => setForm({ ...form, supplier: v })} />
            <SelectField id="p-building" label="Bâtiment de stockage" value={form.building_id} onChange={(v) => setForm({ ...form, building_id: v })} options={buildings.map((b) => ({ value: b.id, label: b.name }))} placeholder="Non affecté" />
            <TextAreaField id="p-obs" label="Observation" value={form.observation} onChange={(v) => setForm({ ...form, observation: v })} />
            <div className="flex justify-end gap-3">
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-muted">Annuler</button>
              <button type="submit" className="rounded-md bg-forest px-4 py-2 text-sm font-medium text-white">Enregistrer</button>
            </div>
          </form>
        </div>
      )}

      <ConfirmDialog open={!!toDelete} title="Supprimer cet achat ?" confirmLabel="Supprimer" danger onConfirm={confirmDelete} onCancel={() => setToDelete(null)} />
    </div>
  );
}
