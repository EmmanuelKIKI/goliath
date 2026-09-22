// src/pages/DailyTracking.jsx — Suivi du jour (section 8 du prompt frontend)
// L'effectif théorique et l'écart affichés viennent toujours du serveur
// (trigger SQL sur daily_records) : je ne les recalcule jamais ici, je les
// relis après enregistrement. Chaque ligne créée reçoit son UUID définitif
// immédiatement, y compris hors connexion.

import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "../services/supabaseClient.js";
import {
  fetchLots,
  fetchDailyRecordByDate,
  fetchSubRecords,
  createRecord,
  updateRecord,
  fetchFarmSettings,
} from "../services/api.js";
import { todayIso } from "../utils/format.js";
import { useToast } from "../hooks/useToast.jsx";
import {
  FormSection,
  NumberField,
  TextField,
  TextAreaField,
  SelectField,
  DateField,
  CheckboxField,
} from "../components/FormField.jsx";
import DynamicList from "../components/DynamicList.jsx";
import LoadingState from "../components/LoadingState.jsx";
import { Save } from "lucide-react";

const SEVERITES = [
  { value: "faible", label: "Faible" },
  { value: "moyenne", label: "Moyenne" },
  { value: "grave", label: "Grave" },
];

function emptyEffectif() {
  return { starting_count: "", entries: 0, deaths: 0, exits: 0, actual_count: "" };
}

export default function DailyTracking() {
  const { showToast } = useToast();
  const [searchParams] = useSearchParams();
  const [lots, setLots] = useState([]);
  const [settings, setSettings] = useState(null);
  const [lotId, setLotId] = useState(searchParams.get("lot") ?? "");
  const [date, setDate] = useState(searchParams.get("date") ?? todayIso());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedInfo, setSavedInfo] = useState(null);

  const [dailyRecord, setDailyRecord] = useState(null);
  const [effectif, setEffectif] = useState(emptyEffectif());
  const [feedEntries, setFeedEntries] = useState([]);
  const [water, setWater] = useState({
    available_quantity: "",
    added_quantity: "",
    estimated_consumption: "",
    remaining_quantity: "",
    water_remark: "",
  });
  const [health, setHealth] = useState({ sick_count: 0, symptoms: "", duration: "", observation: "" });
  const [treatments, setTreatments] = useState([]);
  const [vaccinations, setVaccinations] = useState([]);
  const [vitamins, setVitamins] = useState([]);
  const [hygiene, setHygiene] = useState([]);
  const [newTaskName, setNewTaskName] = useState("");
  const [eggs, setEggs] = useState({
    matin: { good_eggs: 0, broken_eggs: 0, dirty_eggs: 0 },
    soir: { good_eggs: 0, broken_eggs: 0, dirty_eggs: 0 },
  });
  const [incidents, setIncidents] = useState([]);
  const [observation, setObservation] = useState("");
  const [aFaireDemain, setAFaireDemain] = useState("");

  useEffect(() => {
    (async () => {
      const [{ data: lotList }, farmSettings] = await Promise.all([
        fetchLots({ onlyActive: true }),
        fetchFarmSettings(),
      ]);
      setLots(lotList);
      setSettings(farmSettings);
      if (lotList.length > 0 && !searchParams.get("lot")) setLotId(lotList[0].id);
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    if (!lotId || !date) return;
    (async () => {
      setLoading(true);
      const existing = await fetchDailyRecordByDate(lotId, date);
      setDailyRecord(existing);

      if (existing) {
        setEffectif({
          starting_count: existing.starting_count,
          entries: existing.entries,
          deaths: existing.deaths,
          exits: existing.exits,
          actual_count: existing.actual_count,
        });
        const [feed, waterList, healthList, treat, hyg, eggList] = await Promise.all([
          fetchSubRecords("feed_records", existing.id),
          fetchSubRecords("water_records", existing.id),
          fetchSubRecords("health_records", existing.id),
          fetchSubRecords("treatments", existing.id),
          fetchSubRecords("hygiene_checklist", existing.id),
          fetchSubRecords("egg_records", existing.id),
        ]);
        setFeedEntries(feed.data);
        if (waterList.data[0]) setWater(waterList.data[0]);
        if (healthList.data[0]) setHealth(healthList.data[0]);
        setTreatments(treat.data);
        setHygiene(hyg.data);
        const nextEggs = { matin: { good_eggs: 0, broken_eggs: 0, dirty_eggs: 0 }, soir: { good_eggs: 0, broken_eggs: 0, dirty_eggs: 0 } };
        for (const e of eggList.data) nextEggs[e.period] = e;
        setEggs(nextEggs);
      } else {
        // Effectif de départ pré-rempli avec l'effectif réel de la veille,
        // pour éviter une ressaisie — reste modifiable.
        const { data: previous } = await supabase
          .from("daily_records")
          .select("actual_count")
          .eq("lot_id", lotId)
          .lt("record_date", date)
          .order("record_date", { ascending: false })
          .limit(1)
          .maybeSingle();
        setEffectif({ ...emptyEffectif(), starting_count: previous?.actual_count ?? "" });
        setFeedEntries([]);
        setWater({ available_quantity: "", added_quantity: "", estimated_consumption: "", remaining_quantity: "", water_remark: "" });
        setHealth({ sick_count: 0, symptoms: "", duration: "", observation: "" });
        setTreatments([]);
        setHygiene([]);
        setEggs({ matin: { good_eggs: 0, broken_eggs: 0, dirty_eggs: 0 }, soir: { good_eggs: 0, broken_eggs: 0, dirty_eggs: 0 } });
      }

      const [vacc, vit, inc] = await Promise.all([
        supabase.from("vaccinations").select("*").eq("lot_id", lotId).eq("vaccination_date", date),
        supabase.from("vitamins").select("*").eq("lot_id", lotId).eq("vitamin_date", date),
        supabase.from("incidents").select("*").eq("lot_id", lotId).eq("incident_date", date),
      ]);
      setVaccinations(vacc.data ?? []);
      setVitamins(vit.data ?? []);
      setIncidents(inc.data ?? []);
      setObservation(existing?.observation?.split("\n---\nÀ faire demain : ")[0] ?? "");
      setAFaireDemain(existing?.observation?.split("\n---\nÀ faire demain : ")[1] ?? "");

      setLoading(false);
    })();
  }, [lotId, date]);

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const combinedObservation = aFaireDemain
        ? `${observation}\n---\nÀ faire demain : ${aFaireDemain}`
        : observation;

      const dailyPayload = {
        lot_id: lotId,
        record_date: date,
        starting_count: Number(effectif.starting_count) || 0,
        entries: Number(effectif.entries) || 0,
        deaths: Number(effectif.deaths) || 0,
        exits: Number(effectif.exits) || 0,
        actual_count: Number(effectif.actual_count) || 0,
        observation: combinedObservation || null,
      };

      let savedDaily;
      if (dailyRecord) {
        const result = await updateRecord("daily_records", dailyRecord.id, dailyPayload, dailyRecord.updated_at);
        if (result.conflict) {
          showToast("Conflit détecté sur ce suivi : une version plus récente existe côté serveur.", "error");
          setSaving(false);
          return;
        }
        savedDaily = result.data;
      } else {
        const result = await createRecord("daily_records", dailyPayload);
        savedDaily = result.data;
      }
      setDailyRecord(savedDaily);

      await Promise.all([
        ...feedEntries.map((f) => saveLinked("feed_records", { ...f, daily_record_id: savedDaily.id })),
        water.available_quantity !== "" || water.added_quantity !== ""
          ? saveLinked("water_records", { ...water, daily_record_id: savedDaily.id })
          : null,
        health.sick_count > 0 || health.symptoms
          ? saveLinked("health_records", { ...health, daily_record_id: savedDaily.id, lot_id: lotId })
          : null,
        ...treatments.map((t) => saveLinked("treatments", { ...t, daily_record_id: savedDaily.id, lot_id: lotId, treatment_date: date })),
        ...vaccinations.map((v) => saveLinked("vaccinations", { ...v, lot_id: lotId, vaccination_date: date })),
        ...vitamins.map((v) => saveLinked("vitamins", { ...v, lot_id: lotId, vitamin_date: date })),
        ...hygiene.map((h) => saveLinked("hygiene_checklist", { ...h, daily_record_id: savedDaily.id })),
        ...incidents.map((i) => saveLinked("incidents", { ...i, lot_id: lotId, incident_date: date })),
        ...Object.entries(eggs)
          .filter(([, v]) => (v.good_eggs || 0) + (v.broken_eggs || 0) + (v.dirty_eggs || 0) > 0)
          .map(([period, v]) => saveLinked("egg_records", { ...v, daily_record_id: savedDaily.id, period })),
      ]);

      setSavedInfo(savedDaily);
      showToast("Suivi enregistré avec succès.");
    } catch (err) {
      console.error(err);
      showToast("Échec de l'enregistrement. Réessaie.", "error");
    } finally {
      setSaving(false);
    }
  }

  async function saveLinked(table, record) {
    if (record.id) {
      return updateRecord(table, record.id, record, record.updated_at);
    }
    return createRecord(table, { ...record, id: crypto.randomUUID() });
  }

  if (loading && lots.length === 0) return <LoadingState label="Chargement…" />;

  return (
    <form onSubmit={handleSubmit} className="space-y-5 pb-10">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-ink">Suivi du jour</h1>
          <p className="text-sm text-muted">Renseigne les informations du lot pour la date choisie.</p>
        </div>
        <button
          type="submit"
          disabled={saving || !lotId}
          className="flex items-center gap-2 rounded-md bg-forest px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
        >
          <Save size={16} />
          Enregistrer le suivi
        </button>
      </header>

      <div className="grid grid-cols-2 gap-3">
        <SelectField
          id="lot"
          label="Lot"
          value={lotId}
          onChange={setLotId}
          options={lots.map((l) => ({ value: l.id, label: l.name }))}
        />
        <DateField id="date" label="Date" value={date} onChange={setDate} />
      </div>

      {savedInfo && (
        <div className="rounded-md bg-forest/10 border border-forest/20 px-3 py-2 text-sm text-forest">
          Effectif théorique : {savedInfo.theoretical_count} · Écart : {savedInfo.count_difference}
        </div>
      )}

      <FormSection title="Effectif">
        <div className="grid grid-cols-2 gap-3">
          <NumberField id="starting_count" label="Effectif début" value={effectif.starting_count} onChange={(v) => setEffectif({ ...effectif, starting_count: v })} />
          <NumberField id="entries" label="Entrées" value={effectif.entries} onChange={(v) => setEffectif({ ...effectif, entries: v })} />
          <NumberField id="deaths" label="Morts" value={effectif.deaths} onChange={(v) => setEffectif({ ...effectif, deaths: v })} />
          <NumberField id="exits" label="Sorties" value={effectif.exits} onChange={(v) => setEffectif({ ...effectif, exits: v })} />
          <NumberField id="actual_count" label="Effectif réel" value={effectif.actual_count} onChange={(v) => setEffectif({ ...effectif, actual_count: v })} />
        </div>
      </FormSection>

      <FormSection title="Aliment">
        <DynamicList
          items={feedEntries}
          onAdd={(item) => setFeedEntries([...feedEntries, item])}
          onRemove={(id) => setFeedEntries(feedEntries.filter((f) => f.id !== id))}
          newItem={{ feed_type: "", stock_start: 0, quantity_received: 0, quantity_distributed: 0, actual_stock: 0 }}
          addLabel="Ajouter un type d'aliment"
          renderItem={(item, index) => (
            <>
              <div className="col-span-2">
                <TextField id={`feed-type-${item.id}`} label="Type d'aliment" value={item.feed_type} onChange={(v) => updateFeedEntry(feedEntries, setFeedEntries, item.id, "feed_type", v)} />
              </div>
              <NumberField id={`feed-start-${item.id}`} label="Stock début (kg)" value={item.stock_start} onChange={(v) => updateFeedEntry(feedEntries, setFeedEntries, item.id, "stock_start", v)} />
              <NumberField id={`feed-recu-${item.id}`} label="Reçu (kg)" value={item.quantity_received} onChange={(v) => updateFeedEntry(feedEntries, setFeedEntries, item.id, "quantity_received", v)} />
              <NumberField id={`feed-dist-${item.id}`} label="Distribué (kg)" value={item.quantity_distributed} onChange={(v) => updateFeedEntry(feedEntries, setFeedEntries, item.id, "quantity_distributed", v)} />
              <NumberField id={`feed-reel-${item.id}`} label="Stock réel (kg)" value={item.actual_stock} onChange={(v) => updateFeedEntry(feedEntries, setFeedEntries, item.id, "actual_stock", v)} />
            </>
          )}
        />
      </FormSection>

      <FormSection title="Eau">
        <div className="grid grid-cols-2 gap-3">
          <NumberField id="water-dispo" label="Disponible (L)" value={water.available_quantity} onChange={(v) => setWater({ ...water, available_quantity: v })} />
          <NumberField id="water-add" label="Ajoutée (L)" value={water.added_quantity} onChange={(v) => setWater({ ...water, added_quantity: v })} />
          <NumberField id="water-est" label="Consommation estimée (L)" value={water.estimated_consumption} onChange={(v) => setWater({ ...water, estimated_consumption: v })} />
          <NumberField id="water-rest" label="Restante (L)" value={water.remaining_quantity} onChange={(v) => setWater({ ...water, remaining_quantity: v })} />
        </div>
        <TextAreaField id="water-remark" label="Observation (fuite, abreuvoirs...)" value={water.water_remark} onChange={(v) => setWater({ ...water, water_remark: v })} />
      </FormSection>

      <FormSection title="Santé">
        <div className="grid grid-cols-2 gap-3">
          <NumberField id="sick" label="Sujets malades" value={health.sick_count} onChange={(v) => setHealth({ ...health, sick_count: v })} />
          <TextField id="duration" label="Durée observée" value={health.duration} onChange={(v) => setHealth({ ...health, duration: v })} />
        </div>
        <TextAreaField id="symptoms" label="Symptômes observés (jamais un diagnostic)" value={health.symptoms} onChange={(v) => setHealth({ ...health, symptoms: v })} />
        <TextAreaField id="health-obs" label="Observation" value={health.observation} onChange={(v) => setHealth({ ...health, observation: v })} />
      </FormSection>

      <FormSection title="Traitements">
        <DynamicList
          items={treatments}
          onAdd={(item) => setTreatments([...treatments, item])}
          onRemove={(id) => setTreatments(treatments.filter((t) => t.id !== id))}
          newItem={{ product: "", subjects_count: 0, dose: "", observation: "" }}
          addLabel="Ajouter un traitement"
          renderItem={(item) => (
            <>
              <TextField id={`treat-prod-${item.id}`} label="Produit" value={item.product} onChange={(v) => updateListItem(treatments, setTreatments, item.id, "product", v)} />
              <NumberField id={`treat-count-${item.id}`} label="Sujets concernés" value={item.subjects_count} onChange={(v) => updateListItem(treatments, setTreatments, item.id, "subjects_count", v)} />
              <TextField id={`treat-dose-${item.id}`} label="Dose" value={item.dose} onChange={(v) => updateListItem(treatments, setTreatments, item.id, "dose", v)} />
              <TextField id={`treat-obs-${item.id}`} label="Observation" value={item.observation} onChange={(v) => updateListItem(treatments, setTreatments, item.id, "observation", v)} />
            </>
          )}
        />
      </FormSection>

      <FormSection title="Vaccinations">
        <DynamicList
          items={vaccinations}
          onAdd={(item) => setVaccinations([...vaccinations, item])}
          onRemove={(id) => setVaccinations(vaccinations.filter((v) => v.id !== id))}
          newItem={{ vaccine_name: "", subjects_count: 0, observation: "" }}
          addLabel="Ajouter une vaccination"
          renderItem={(item) => (
            <>
              <TextField id={`vacc-name-${item.id}`} label="Vaccin" value={item.vaccine_name} onChange={(v) => updateListItem(vaccinations, setVaccinations, item.id, "vaccine_name", v)} />
              <NumberField id={`vacc-count-${item.id}`} label="Sujets concernés" value={item.subjects_count} onChange={(v) => updateListItem(vaccinations, setVaccinations, item.id, "subjects_count", v)} />
            </>
          )}
        />
      </FormSection>

      <FormSection title="Vitamines">
        <DynamicList
          items={vitamins}
          onAdd={(item) => setVitamins([...vitamins, item])}
          onRemove={(id) => setVitamins(vitamins.filter((v) => v.id !== id))}
          newItem={{ product: "", observation: "" }}
          addLabel="Ajouter une vitamine"
          renderItem={(item) => (
            <>
              <TextField id={`vit-prod-${item.id}`} label="Produit" value={item.product} onChange={(v) => updateListItem(vitamins, setVitamins, item.id, "product", v)} />
              <TextField id={`vit-obs-${item.id}`} label="Observation" value={item.observation} onChange={(v) => updateListItem(vitamins, setVitamins, item.id, "observation", v)} />
            </>
          )}
        />
      </FormSection>

      <FormSection title="Nettoyage et hygiène">
        <p className="text-xs text-muted">{hygiene.filter((h) => h.is_done).length} / {hygiene.length} tâches faites</p>
        <div>
          {hygiene.map((task) => (
            <CheckboxField
              key={task.id}
              id={`hyg-${task.id}`}
              label={task.task_name}
              checked={task.is_done}
              onChange={(v) => updateListItem(hygiene, setHygiene, task.id, "is_done", v)}
            />
          ))}
        </div>
        <div className="flex gap-2">
          <input
            value={newTaskName}
            onChange={(e) => setNewTaskName(e.target.value)}
            placeholder="Nouvelle tâche (ex. désinfection des abreuvoirs)"
            className="flex-1 rounded-md border border-black/10 px-3 py-2 text-sm"
          />
          <button
            type="button"
            onClick={() => {
              if (!newTaskName.trim()) return;
              setHygiene([...hygiene, { id: crypto.randomUUID(), task_name: newTaskName, is_done: false }]);
              setNewTaskName("");
            }}
            className="rounded-md bg-forest px-3 text-sm font-medium text-white"
          >
            Ajouter
          </button>
        </div>
      </FormSection>

      {settings?.egg_tracking_enabled && (
        <FormSection title="Œufs">
          {["matin", "soir"].map((period) => (
            <div key={period}>
              <p className="text-xs font-medium text-muted capitalize mb-2">{period}</p>
              <div className="grid grid-cols-3 gap-3">
                <NumberField id={`eggs-${period}-good`} label="Bons" value={eggs[period].good_eggs} onChange={(v) => setEggs({ ...eggs, [period]: { ...eggs[period], good_eggs: v } })} />
                <NumberField id={`eggs-${period}-broken`} label="Cassés" value={eggs[period].broken_eggs} onChange={(v) => setEggs({ ...eggs, [period]: { ...eggs[period], broken_eggs: v } })} />
                <NumberField id={`eggs-${period}-dirty`} label="Sales" value={eggs[period].dirty_eggs} onChange={(v) => setEggs({ ...eggs, [period]: { ...eggs[period], dirty_eggs: v } })} />
              </div>
            </div>
          ))}
        </FormSection>
      )}

      <FormSection title="Incidents">
        <DynamicList
          items={incidents}
          onAdd={(item) => setIncidents([...incidents, item])}
          onRemove={(id) => setIncidents(incidents.filter((i) => i.id !== id))}
          newItem={{ type: "", description: "", action_taken: "", severity: "faible", resolved: false }}
          addLabel="Ajouter un incident"
          renderItem={(item) => (
            <>
              <TextField id={`inc-type-${item.id}`} label="Type" value={item.type} onChange={(v) => updateListItem(incidents, setIncidents, item.id, "type", v)} />
              <SelectField id={`inc-sev-${item.id}`} label="Gravité" value={item.severity} onChange={(v) => updateListItem(incidents, setIncidents, item.id, "severity", v)} options={SEVERITES} />
              <div className="col-span-2">
                <TextAreaField id={`inc-desc-${item.id}`} label="Description" value={item.description} onChange={(v) => updateListItem(incidents, setIncidents, item.id, "description", v)} />
              </div>
              <div className="col-span-2">
                <TextField id={`inc-action-${item.id}`} label="Action prise" value={item.action_taken} onChange={(v) => updateListItem(incidents, setIncidents, item.id, "action_taken", v)} />
              </div>
              <div className="col-span-2">
                <CheckboxField id={`inc-resolved-${item.id}`} label="Résolu" checked={item.resolved} onChange={(v) => updateListItem(incidents, setIncidents, item.id, "resolved", v)} />
              </div>
            </>
          )}
        />
      </FormSection>

      <FormSection title="Observations">
        <TextAreaField id="observation" label="Observations libres" value={observation} onChange={setObservation} rows={3} />
        <TextAreaField id="a-faire-demain" label="À faire demain" value={aFaireDemain} onChange={setAFaireDemain} rows={2} />
      </FormSection>

      <button
        type="submit"
        disabled={saving || !lotId}
        className="w-full flex items-center justify-center gap-2 rounded-md bg-forest py-3 text-sm font-semibold text-white disabled:opacity-50"
      >
        <Save size={16} />
        Enregistrer le suivi
      </button>
    </form>
  );
}

function updateListItem(list, setList, id, field, value) {
  setList(list.map((item) => (item.id === id ? { ...item, [field]: value } : item)));
}

function updateFeedEntry(list, setList, id, field, value) {
  updateListItem(list, setList, id, field, value);
}
