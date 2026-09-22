// src/services/api.js
// Couche unique d'accès aux données. Le CRUD passe toujours en direct par
// supabase-js (jamais d'Edge Function pour ça), protégé par RLS. Hors
// connexion, l'écriture est d'abord posée dans IndexedDB puis ajoutée à la
// file de synchronisation ; elle apparaît immédiatement depuis le cache
// local. Aucun calcul "officiel" n'est fait ici : effectif théorique,
// écarts et KPI viennent toujours du serveur.

import { supabase } from "./supabaseClient.js";
import { getAllLocal, getByIdLocal, putLocal, deleteLocal, enqueueSyncOp } from "./indexedDb.js";
import { replaySyncQueue } from "./syncQueue.js";

function isOnline() {
  return navigator.onLine;
}

// ----------------------------------------------------------------------------
// CRUD générique
// ----------------------------------------------------------------------------

export async function listRecords(table, { filters = [], orderBy } = {}) {
  if (isOnline()) {
    try {
      let query = supabase.from(table).select("*");
      for (const [column, op, value] of filters) {
        query = query[op](column, value);
      }
      if (orderBy) query = query.order(orderBy.column, { ascending: orderBy.ascending ?? true });

      const { data, error } = await query;
      if (error) throw error;

      // Je rafraîchis le cache local avec la réponse serveur, qui fait foi.
      for (const record of data) await putLocal(table, record);
      return { data, fromCache: false };
    } catch (err) {
      console.warn(`listRecords(${table}) en ligne a échoué, repli sur le cache local.`, err);
    }
  }

  const local = await getAllLocal(table);
  return { data: local, fromCache: true };
}

export async function getRecord(table, id) {
  if (isOnline()) {
    try {
      const { data, error } = await supabase.from(table).select("*").eq("id", id).maybeSingle();
      if (error) throw error;
      if (data) await putLocal(table, data);
      return { data, fromCache: false };
    } catch (err) {
      console.warn(`getRecord(${table}, ${id}) en ligne a échoué, repli sur le cache local.`, err);
    }
  }
  const local = await getByIdLocal(table, id);
  return { data: local ?? null, fromCache: true };
}

// Crée un enregistrement. L'UUID est toujours généré côté client, dès la
// création, même hors connexion — jamais un ID temporaire remplacé plus
// tard (garantie d'idempotence, section 15 du prompt frontend).
export async function createRecord(table, payload) {
  const record = { id: payload.id ?? crypto.randomUUID(), ...payload };
  record.id = payload.id ?? record.id;

  await putLocal(table, record);

  if (isOnline()) {
    try {
      const { data, error } = await supabase.from(table).insert(record).select().single();
      if (error) throw error;
      await putLocal(table, data);
      return { data, offline: false };
    } catch (err) {
      console.warn(`createRecord(${table}) en ligne a échoué, mise en file hors ligne.`, err);
    }
  }

  await enqueueSyncOp({ table, type: "insert", recordId: record.id, payload: record });
  return { data: record, offline: true };
}

// Met à jour un enregistrement. baseUpdatedAt est la valeur connue au
// moment de la modification locale, utilisée pour détecter un conflit lors
// d'une synchronisation différée.
export async function updateRecord(table, id, changes, baseUpdatedAt) {
  const existing = (await getByIdLocal(table, id)) ?? {};
  const merged = { ...existing, ...changes, id };
  await putLocal(table, merged);

  if (isOnline()) {
    try {
      let query = supabase.from(table).update(changes).eq("id", id);
      if (baseUpdatedAt) query = query.eq("updated_at", baseUpdatedAt);
      const { data, error } = await query.select();
      if (error) throw error;

      if (data && data.length > 0) {
        await putLocal(table, data[0]);
        return { data: data[0], offline: false, conflict: false };
      }

      // updated_at ne correspondait plus : conflit détecté immédiatement,
      // pas besoin d'attendre un passage hors ligne pour le signaler.
      const { data: serverRecord } = await supabase.from(table).select("*").eq("id", id).maybeSingle();
      return { data: serverRecord, offline: false, conflict: true };
    } catch (err) {
      console.warn(`updateRecord(${table}, ${id}) en ligne a échoué, mise en file hors ligne.`, err);
    }
  }

  await enqueueSyncOp({ table, type: "update", recordId: id, payload: changes, baseUpdatedAt });
  return { data: merged, offline: true, conflict: false };
}

export async function deleteRecord(table, id) {
  await deleteLocal(table, id);

  if (isOnline()) {
    try {
      const { error } = await supabase.from(table).delete().eq("id", id);
      if (error) throw error;
      return { offline: false };
    } catch (err) {
      console.warn(`deleteRecord(${table}, ${id}) en ligne a échoué, mise en file hors ligne.`, err);
    }
  }

  await enqueueSyncOp({ table, type: "delete", recordId: id });
  return { offline: true };
}

// ----------------------------------------------------------------------------
// Lectures composées
// ----------------------------------------------------------------------------

export async function fetchBuildings() {
  return listRecords("buildings", { orderBy: { column: "name" } });
}

export async function fetchLots({ onlyActive = false } = {}) {
  const filters = onlyActive ? [["status", "eq", "actif"]] : [];
  return listRecords("lots", { filters, orderBy: { column: "name" } });
}

export async function fetchFarmSettings() {
  const { data } = await listRecords("farm_settings");
  return data?.[0] ?? null;
}

// Les KPI viennent toujours d'une fonction SQL côté serveur (get_lot_kpis) :
// le frontend ne recalcule jamais une formule officielle. Cette lecture
// nécessite une connexion ; hors ligne, l'appelant doit afficher un état
// "indisponible hors connexion" plutôt qu'une estimation.
export async function fetchLotKpis(lotId, dateDebut, dateFin) {
  if (!isOnline()) return { data: null, offline: true };
  const { data, error } = await supabase.rpc("get_lot_kpis", {
    p_lot_id: lotId,
    p_date_debut: dateDebut,
    p_date_fin: dateFin,
  });
  if (error) throw error;
  return { data, offline: false };
}

export async function fetchDailyRecordByDate(lotId, date) {
  if (isOnline()) {
    try {
      const { data, error } = await supabase
        .from("daily_records")
        .select("*")
        .eq("lot_id", lotId)
        .eq("record_date", date)
        .maybeSingle();
      if (error) throw error;
      if (data) await putLocal("daily_records", data);
      return data;
    } catch (err) {
      console.warn("fetchDailyRecordByDate en ligne a échoué, repli local.", err);
    }
  }
  const all = await getAllLocal("daily_records");
  return all.find((r) => r.lot_id === lotId && r.record_date === date) ?? null;
}

export async function fetchSubRecords(table, dailyRecordId) {
  return listRecords(table, { filters: [["daily_record_id", "eq", dailyRecordId]] });
}

export { replaySyncQueue };
