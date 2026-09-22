// src/services/indexedDb.js
// Toute écriture passe d'abord par ici. En ligne, elle est aussi envoyée
// immédiatement à Supabase (voir api.js) ; hors ligne, elle reste en local
// jusqu'au retour de connexion. Je ne fais jamais de calcul "officiel" ici
// (effectif théorique, KPI...) — uniquement du stockage et une estimation
// d'affichage provisoire clairement indiquée comme telle par l'appelant.

import { openDB } from "idb";

export const DB_NAME = "goliath-db";
export const DB_VERSION = 1;

// Une table locale par table serveur (miroir), plus deux stores techniques :
// sync_queue (file d'opérations en attente) et conflicts (éléments dont la
// synchronisation a détecté un conflit et attend un choix manuel).
export const TABLES = [
  "buildings",
  "lots",
  "daily_records",
  "feed_records",
  "feed_purchases",
  "water_records",
  "health_records",
  "treatments",
  "vaccinations",
  "vitamins",
  "weight_records",
  "hygiene_checklist",
  "egg_records",
  "incidents",
  "ai_analyses",
  "farm_settings",
];

let dbPromise;

export function getDb() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        for (const table of TABLES) {
          if (!db.objectStoreNames.contains(table)) {
            db.createObjectStore(table, { keyPath: "id" });
          }
        }
        if (!db.objectStoreNames.contains("sync_queue")) {
          const queueStore = db.createObjectStore("sync_queue", {
            keyPath: "queue_id",
            autoIncrement: true,
          });
          queueStore.createIndex("status", "status");
          queueStore.createIndex("created_at", "created_at");
        }
        if (!db.objectStoreNames.contains("conflicts")) {
          db.createObjectStore("conflicts", { keyPath: "queue_id" });
        }
      },
    });
  }
  return dbPromise;
}

export async function getAllLocal(table) {
  const db = await getDb();
  return db.getAll(table);
}

export async function getByIdLocal(table, id) {
  const db = await getDb();
  return db.get(table, id);
}

export async function putLocal(table, record) {
  const db = await getDb();
  return db.put(table, record);
}

export async function deleteLocal(table, id) {
  const db = await getDb();
  return db.delete(table, id);
}

// Ajoute une opération à la file de synchronisation. Chaque opération porte
// déjà l'UUID définitif de l'enregistrement (généré côté client dès sa
// création), jamais un ID temporaire — un rejeu ne peut donc jamais créer
// de doublon.
export async function enqueueSyncOp({ table, type, recordId, payload, baseUpdatedAt }) {
  const db = await getDb();
  return db.add("sync_queue", {
    table,
    type, // "insert" | "update" | "delete"
    record_id: recordId,
    payload,
    base_updated_at: baseUpdatedAt ?? null,
    created_at: new Date().toISOString(),
    status: "en_attente", // "en_attente" | "traitee" | "conflit"
  });
}

export async function getPendingSyncOps() {
  const db = await getDb();
  const tx = db.transaction("sync_queue", "readonly");
  const index = tx.store.index("status");
  const ops = await index.getAll("en_attente");
  await tx.done;
  // FIFO strict : je rejoue toujours dans l'ordre de création.
  return ops.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
}

export async function markSyncOpDone(queueId) {
  const db = await getDb();
  await db.delete("sync_queue", queueId);
}

export async function markSyncOpConflict(queueId, serverRecord) {
  const db = await getDb();
  const op = await db.get("sync_queue", queueId);
  if (!op) return;
  op.status = "conflit";
  await db.put("sync_queue", op);
  await db.put("conflicts", { queue_id: queueId, operation: op, server_record: serverRecord });
}

export async function getConflicts() {
  const db = await getDb();
  return db.getAll("conflicts");
}

export async function resolveConflictKeepLocal(queueId) {
  const db = await getDb();
  const conflict = await db.get("conflicts", queueId);
  if (!conflict) return;
  const op = await db.get("sync_queue", queueId);
  if (op) {
    op.status = "en_attente";
    // Je force la valeur de référence à celle du serveur pour que la
    // prochaine tentative passe la vérification de conflit.
    op.base_updated_at = conflict.server_record?.updated_at ?? op.base_updated_at;
    await db.put("sync_queue", op);
  }
  await db.delete("conflicts", queueId);
}

export async function resolveConflictKeepServer(table, queueId) {
  const db = await getDb();
  const conflict = await db.get("conflicts", queueId);
  if (!conflict) return;
  if (conflict.server_record) {
    await db.put(table, conflict.server_record);
  }
  await db.delete("sync_queue", queueId);
  await db.delete("conflicts", queueId);
}

export async function countPendingSyncOps() {
  const ops = await getPendingSyncOps();
  return ops.length;
}
