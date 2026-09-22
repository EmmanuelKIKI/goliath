// src/pages/Settings.jsx — Paramètres (section 13 du prompt frontend)
import { useEffect, useState } from "react";
import { Moon, Sun, Download, Upload, AlertTriangle } from "lucide-react";
import { Link } from "react-router-dom";
import { fetchFarmSettings, updateRecord } from "../services/api.js";
import { TextField, NumberField, CheckboxField, SelectField } from "../components/FormField.jsx";
import { exportFullBackupJson, importFullBackupJson } from "../services/backupExport.js";
import { useToast } from "../hooks/useToast.jsx";
import { useSyncStatus } from "../hooks/useSyncStatus.js";
import LoadingState from "../components/LoadingState.jsx";

const CURRENCIES = [
  { value: "XOF", label: "FCFA (XOF)" },
  { value: "EUR", label: "Euro (EUR)" },
  { value: "USD", label: "Dollar (USD)" },
];

export default function Settings() {
  const { showToast } = useToast();
  const { conflictCount } = useSyncStatus();
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(document.documentElement.classList.contains("dark"));
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    fetchFarmSettings().then((s) => {
      setSettings(s);
      setLoading(false);
    });
  }, []);

  function toggleDarkMode() {
    const next = !darkMode;
    setDarkMode(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("goliath-dark-mode", next ? "1" : "0");
  }

  async function save(field, value) {
    const updated = { ...settings, [field]: value };
    setSettings(updated);
    await updateRecord("farm_settings", settings.id, { [field]: value }, settings.updated_at);
  }

  async function handleExport() {
    try {
      await exportFullBackupJson();
      showToast("Sauvegarde JSON téléchargée.");
    } catch (err) {
      showToast("Échec de l'export.", "error");
    }
  }

  async function handleImport(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    try {
      await importFullBackupJson(file);
      showToast("Sauvegarde restaurée avec succès.");
    } catch (err) {
      showToast(err.message || "Échec de l'import — rien n'a été modifié.", "error");
    } finally {
      setImporting(false);
      e.target.value = "";
    }
  }

  if (loading || !settings) return <LoadingState />;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-xl font-bold text-ink">Paramètres</h1>
      </header>

      {conflictCount > 0 && (
        <Link
          to="/parametres/conflits"
          className="flex items-center gap-2 rounded-md bg-danger/10 border border-danger/30 px-4 py-3 text-sm text-danger"
        >
          <AlertTriangle size={16} />
          {conflictCount} conflit(s) de synchronisation à résoudre
        </Link>
      )}

      <section className="rounded-lg bg-white border border-black/5 p-4 space-y-4">
        <h2 className="text-sm font-semibold text-forest">Ma ferme</h2>
        <TextField id="s-name" label="Nom de la ferme" value={settings.farm_name} onChange={(v) => save("farm_name", v)} />
        <SelectField id="s-currency" label="Devise" value={settings.currency} onChange={(v) => save("currency", v)} options={CURRENCIES} />
        <NumberField id="s-feed" label="Seuil d'alerte aliment (kg)" value={settings.feed_alert_threshold ?? ""} onChange={(v) => save("feed_alert_threshold", v === "" ? null : v)} />
        <NumberField id="s-mortality" label="Seuil d'alerte mortalité (%)" value={settings.mortality_alert_threshold ?? ""} onChange={(v) => save("mortality_alert_threshold", v === "" ? null : v)} />
        <CheckboxField id="s-eggs" label="Activer le suivi des œufs" checked={settings.egg_tracking_enabled} onChange={(v) => save("egg_tracking_enabled", v)} />
      </section>

      <section className="rounded-lg bg-white border border-black/5 p-4 space-y-3">
        <h2 className="text-sm font-semibold text-forest">Apparence</h2>
        <button onClick={toggleDarkMode} className="flex items-center gap-2 text-sm text-ink">
          {darkMode ? <Sun size={16} /> : <Moon size={16} />}
          {darkMode ? "Passer en mode clair" : "Passer en mode sombre"}
        </button>
      </section>

      <section className="rounded-lg bg-white border border-black/5 p-4 space-y-3">
        <h2 className="text-sm font-semibold text-forest">Sauvegarde</h2>
        <button onClick={handleExport} className="flex items-center gap-2 rounded-md bg-forest px-4 py-2.5 text-sm font-semibold text-white">
          <Download size={16} /> Exporter (JSON complet)
        </button>
        <label className="flex items-center gap-2 rounded-md border border-black/10 px-4 py-2.5 text-sm font-medium text-ink cursor-pointer w-fit">
          <Upload size={16} /> {importing ? "Import en cours…" : "Importer une sauvegarde JSON"}
          <input type="file" accept="application/json" className="hidden" onChange={handleImport} disabled={importing} />
        </label>
        <p className="text-xs text-muted">L'import remplace toutes les données actuelles — tout ou rien, en cas d'erreur rien n'est modifié.</p>
      </section>

      <section className="rounded-lg bg-white border border-black/5 p-4 space-y-2">
        <h2 className="text-sm font-semibold text-forest">Code d'accès</h2>
        <p className="text-sm text-muted">
          La modification du code d'accès depuis l'application nécessite une fonction serveur dédiée qui
          n'existe pas encore côté backend (seules auth-login et les fonctions Gemini sont exposées). En
          attendant, je change APP_ACCESS_CODE_HASH via <code>supabase secrets set</code>.
        </p>
      </section>
    </div>
  );
}
