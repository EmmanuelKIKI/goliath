// src/pages/Statistics.jsx — Statistiques et indicateurs (section 10)
// Les graphiques lisent des données brutes (lecture directe, protégée par
// RLS) ; la section "Indicateurs" lit exclusivement les KPI calculés côté
// serveur (get_lot_kpis) — le frontend n'y recalcule jamais une formule.

import { useEffect, useMemo, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { supabase } from "../services/supabaseClient.js";
import { fetchLots, fetchLotKpis, fetchFarmSettings } from "../services/api.js";
import { formatDate, formatPercent, formatNumber, formatCurrency, todayIso } from "../utils/format.js";
import { SelectField, DateField } from "../components/FormField.jsx";
import KpiCard from "../components/KpiCard.jsx";
import LoadingState from "../components/LoadingState.jsx";

const PERIODS = [
  { value: "7", label: "7 jours" },
  { value: "30", label: "30 jours" },
  { value: "custom", label: "Personnalisée" },
];

export default function Statistics() {
  const [lots, setLots] = useState([]);
  const [settings, setSettings] = useState(null);
  const [lotId, setLotId] = useState("");
  const [period, setPeriod] = useState("30");
  const [customDebut, setCustomDebut] = useState("");
  const [customFin, setCustomFin] = useState(todayIso());
  const [chartData, setChartData] = useState([]);
  const [kpis, setKpis] = useState(null);
  const [loading, setLoading] = useState(true);

  const [dateDebut, dateFin] = useMemo(() => {
    if (period === "custom") return [customDebut, customFin];
    const fin = todayIso();
    const debut = new Date(Date.now() - Number(period) * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    return [debut, fin];
  }, [period, customDebut, customFin]);

  useEffect(() => {
    (async () => {
      const [{ data: lotList }, farmSettings] = await Promise.all([fetchLots({ onlyActive: true }), fetchFarmSettings()]);
      setLots(lotList);
      setSettings(farmSettings);
      if (lotList.length > 0) setLotId(lotList[0].id);
    })();
  }, []);

  useEffect(() => {
    if (!lotId || !dateDebut || !dateFin) return;
    (async () => {
      setLoading(true);
      const { data: daily } = await supabase
        .from("daily_records")
        .select("record_date, actual_count, deaths")
        .eq("lot_id", lotId)
        .gte("record_date", dateDebut)
        .lte("record_date", dateFin)
        .order("record_date", { ascending: true });

      setChartData(
        (daily ?? []).map((d) => ({
          date: formatDate(d.record_date),
          effectif: d.actual_count,
          mortalite: d.deaths,
        })),
      );

      try {
        const { data } = await fetchLotKpis(lotId, dateDebut, dateFin);
        setKpis(data);
      } catch (err) {
        console.error(err);
        setKpis(null);
      }
      setLoading(false);
    })();
  }, [lotId, dateDebut, dateFin]);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-xl font-bold text-ink">Statistiques</h1>
        <p className="text-sm text-muted">Évolution du lot et indicateurs de performance.</p>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <SelectField id="stats-lot" label="Lot" value={lotId} onChange={setLotId} options={lots.map((l) => ({ value: l.id, label: l.name }))} />
        <SelectField id="stats-period" label="Période" value={period} onChange={setPeriod} options={PERIODS} />
        {period === "custom" && (
          <>
            <DateField id="stats-debut" label="Depuis" value={customDebut} onChange={setCustomDebut} />
            <DateField id="stats-fin" label="Jusqu'à" value={customFin} onChange={setCustomFin} />
          </>
        )}
      </div>

      {loading ? (
        <LoadingState />
      ) : (
        <>
          <section className="rounded-lg bg-white border border-black/5 p-4">
            <h2 className="text-sm font-semibold text-forest mb-3">Effectif</h2>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={chartData}>
                <CartesianGrid stroke="#E5E7EB" strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Line type="monotone" dataKey="effectif" stroke="#166534" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </section>

          <section className="rounded-lg bg-white border border-black/5 p-4">
            <h2 className="text-sm font-semibold text-forest mb-3">Mortalité</h2>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={chartData}>
                <CartesianGrid stroke="#E5E7EB" strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Line type="monotone" dataKey="mortalite" stroke="#DC2626" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </section>

          <section className="rounded-lg bg-white border border-black/5 p-4">
            <h2 className="text-sm font-semibold text-forest mb-3">Indicateurs</h2>
            {kpis ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <KpiCard label="Taux de mortalité" value={formatPercent(kpis.taux_mortalite)} />
                <KpiCard label="Taux de survie" value={formatPercent(kpis.taux_survie)} />
                <KpiCard label="Aliment / sujet" value={kpis.conso_aliment_par_sujet ? `${formatNumber(kpis.conso_aliment_par_sujet)} kg` : "—"} />
                <KpiCard label="Eau / sujet" value={kpis.conso_eau_par_sujet ? `${formatNumber(kpis.conso_eau_par_sujet)} L` : "—"} />
                {settings?.egg_tracking_enabled && (
                  <KpiCard label="Taux de ponte" value={formatPercent(kpis.taux_ponte)} />
                )}
                <KpiCard label="Coût aliment / sujet" value={kpis.cout_aliment_par_sujet ? formatCurrency(kpis.cout_aliment_par_sujet, settings?.currency) : "—"} />
                <KpiCard label="Résolution incidents" value={formatPercent(kpis.taux_resolution_incidents)} />
                <KpiCard label="Écart moyen d'effectif" value={kpis.ecart_moyen_effectif !== null ? formatNumber(kpis.ecart_moyen_effectif) : "—"} />
                {/* FCR affiché uniquement si le backend renvoie une valeur non nulle (au moins deux pesées) */}
                {kpis.fcr !== null && kpis.fcr !== undefined && (
                  <KpiCard label="FCR (indice de conversion)" value={formatNumber(kpis.fcr, 2)} hint="Basé sur au moins deux pesées" />
                )}
              </div>
            ) : (
              <p className="text-sm text-muted">
                {navigator.onLine ? "Aucune donnée sur cette période." : "Indisponible hors connexion."}
              </p>
            )}
            {(!kpis || kpis.fcr === null || kpis.fcr === undefined) && (
              <p className="mt-3 text-xs text-muted">
                Le FCR ne s'affiche que dès qu'au moins deux pesées existent pour ce lot sur la période — sans ça, seule la consommation par sujet est indiquée, pour ne pas donner l'impression d'un indice de conversion précis.
              </p>
            )}
          </section>
        </>
      )}
    </div>
  );
}
