// src/pages/Dashboard.jsx — Tableau de bord (section 7 du prompt frontend)
// L'état de la ferme en quelques secondes : effectif actuel, mortalité du
// jour, sujets malades, stock d'aliment, consommation d'eau estimée, et un
// bandeau de KPI clés issus des vues du backend. Les alertes comparent des
// champs déjà calculés côté serveur (count_difference, deaths, stock
// actuel) à mes seuils de paramètres — je ne recalcule jamais une formule
// officielle ici, seulement une comparaison d'affichage.

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../services/supabaseClient.js";
import { fetchLots, fetchFarmSettings, fetchLotKpis } from "../services/api.js";
import { todayIso, formatNumber, formatPercent, formatCurrency } from "../utils/format.js";
import KpiCard from "../components/KpiCard.jsx";
import AlertBanner from "../components/AlertBanner.jsx";
import LoadingState from "../components/LoadingState.jsx";
import EmptyState from "../components/EmptyState.jsx";
import { SelectField } from "../components/FormField.jsx";
import { Warehouse } from "lucide-react";

export default function Dashboard() {
  const [lots, setLots] = useState([]);
  const [settings, setSettings] = useState(null);
  const [selectedLotId, setSelectedLotId] = useState("");
  const [todaySummary, setTodaySummary] = useState(null);
  const [kpis, setKpis] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [{ data: lotList }, farmSettings] = await Promise.all([
        fetchLots({ onlyActive: true }),
        fetchFarmSettings(),
      ]);
      setLots(lotList);
      setSettings(farmSettings);
      if (lotList.length > 0) setSelectedLotId(lotList[0].id);
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    if (!navigator.onLine) return;
    (async () => {
      const today = todayIso();

      const { data: dailyToday } = await supabase
        .from("daily_records")
        .select("id, lot_id, actual_count, deaths, count_difference")
        .eq("record_date", today);

      const dailyIds = (dailyToday ?? []).map((d) => d.id);

      const [{ data: feedToday }, { data: waterToday }, { data: healthToday }] = await Promise.all([
        dailyIds.length
          ? supabase.from("feed_records").select("actual_stock, stock_difference").in("daily_record_id", dailyIds)
          : Promise.resolve({ data: [] }),
        dailyIds.length
          ? supabase.from("water_records").select("estimated_consumption").in("daily_record_id", dailyIds)
          : Promise.resolve({ data: [] }),
        dailyIds.length
          ? supabase.from("health_records").select("sick_count").in("daily_record_id", dailyIds)
          : Promise.resolve({ data: [] }),
      ]);

      setTodaySummary({
        effectifActuel: (dailyToday ?? []).reduce((sum, d) => sum + (d.actual_count ?? 0), 0),
        mortaliteJour: (dailyToday ?? []).reduce((sum, d) => sum + (d.deaths ?? 0), 0),
        ecartMax: (dailyToday ?? []).reduce(
          (max, d) => Math.max(max, Math.abs(d.count_difference ?? 0)),
          0,
        ),
        stockAliment: (feedToday ?? []).reduce((sum, f) => sum + Number(f.actual_stock ?? 0), 0),
        stockEcart: (feedToday ?? []).reduce((sum, f) => sum + Number(f.stock_difference ?? 0), 0),
        eauEstimee: (waterToday ?? []).reduce((sum, w) => sum + Number(w.estimated_consumption ?? 0), 0),
        sujetsMalades: (healthToday ?? []).reduce((sum, h) => sum + (h.sick_count ?? 0), 0),
      });
    })();
  }, [lots]);

  useEffect(() => {
    if (!selectedLotId || !navigator.onLine) return;
    (async () => {
      const today = todayIso();
      const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
      try {
        const { data } = await fetchLotKpis(selectedLotId, monthAgo, today);
        setKpis(data);
      } catch (err) {
        console.error("Impossible de charger les KPI.", err);
      }
    })();
  }, [selectedLotId]);

  const alerts = useMemo(() => {
    if (!todaySummary || !settings) return [];
    const messages = [];
    if (todaySummary.ecartMax > 0) {
      messages.push("L'effectif réel ne correspond pas à l'effectif théorique. Vérification nécessaire.");
    }
    if (settings.mortality_alert_threshold && kpis?.taux_mortalite > settings.mortality_alert_threshold) {
      messages.push("Mortalité inhabituelle à vérifier.");
    }
    if (settings.feed_alert_threshold && todaySummary.stockAliment < settings.feed_alert_threshold) {
      messages.push("Stock d'aliment faible.");
    }
    if (todaySummary.stockEcart < 0) {
      messages.push("Vérifier l'approvisionnement en eau.");
    }
    return messages;
  }, [todaySummary, settings, kpis]);

  if (loading) return <LoadingState label="Chargement du tableau de bord…" />;

  if (lots.length === 0) {
    return (
      <EmptyState
        icon={Warehouse}
        title="Aucun lot actif pour l'instant"
        description="Crée un bâtiment puis un lot depuis « Ma ferme » pour commencer ton suivi quotidien."
      />
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-ink">Tableau de bord</h1>
          <p className="text-sm text-muted">{new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}</p>
        </div>
      </header>

      <AlertBanner messages={alerts} />

      <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard label="Effectif actuel" value={todaySummary ? formatNumber(todaySummary.effectifActuel, 0) : "—"} />
        <KpiCard
          label="Mortalité du jour"
          value={todaySummary ? formatNumber(todaySummary.mortaliteJour, 0) : "—"}
          tone={todaySummary?.mortaliteJour > 0 ? "warning" : "default"}
        />
        <KpiCard label="Sujets malades" value={todaySummary ? formatNumber(todaySummary.sujetsMalades, 0) : "—"} />
        <KpiCard
          label="Stock d'aliment"
          value={todaySummary ? `${formatNumber(todaySummary.stockAliment, 1)} kg` : "—"}
        />
        <KpiCard
          label="Eau consommée (estimée)"
          value={todaySummary ? `${formatNumber(todaySummary.eauEstimee, 1)} L` : "—"}
        />
      </section>

      <section className="rounded-lg bg-white border border-black/5 p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-forest">Indicateurs clés (30 derniers jours)</h2>
          <div className="w-48">
            <SelectField
              id="dashboard-lot"
              label=""
              value={selectedLotId}
              onChange={setSelectedLotId}
              options={lots.map((l) => ({ value: l.id, label: l.name }))}
            />
          </div>
        </div>
        {kpis ? (
          <div className="grid grid-cols-2 gap-3">
            <KpiCard label="Taux de mortalité" value={formatPercent(kpis.taux_mortalite)} />
            <KpiCard
              label="Coût d'aliment par sujet"
              value={kpis.cout_aliment_par_sujet ? formatCurrency(kpis.cout_aliment_par_sujet, settings?.currency) : "—"}
            />
          </div>
        ) : (
          <p className="text-sm text-muted">
            {navigator.onLine ? "Aucune donnée sur cette période." : "Indisponible hors connexion."}
          </p>
        )}
      </section>
    </div>
  );
}
