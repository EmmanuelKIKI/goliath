// src/services/syncQueue.js
// Rejoue la file de synchronisation au retour de connexion, dans l'ordre de
// création (FIFO). Chaque opération est envoyée une seule fois puis
// retirée de la file avant de passer à la suivante — un retry après
// coupure ne renvoie donc jamais une opération déjà confirmée par le
// serveur. Un conflit (base_updated_at obsolète) n'écrase jamais
// silencieusement : l'élément passe dans la vue "conflit à résoudre".

import { supabase } from "./supabaseClient.js";
import {
  getPendingSyncOps,
  markSyncOpDone,
  markSyncOpConflict,
  putLocal,
  deleteLocal,
} from "./indexedDb.js";

let isSyncing = false;
const listeners = new Set();

export function onSyncStatusChange(callback) {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

function notify(status) {
  for (const cb of listeners) cb(status);
}

async function applyInsert(op) {
  // upsert avec ignoreDuplicates garantit l'idempotence : si cet UUID a
  // déjà été inséré lors d'une tentative précédente interrompue, ce rejeu
  // ne crée jamais de doublon.
  const { data, error } = await supabase
    .from(op.table)
    .upsert(op.payload, { onConflict: "id", ignoreDuplicates: true })
    .select()
    .maybeSingle();

  if (error) throw error;

  if (data) {
    await putLocal(op.table, data);
  } else {
    // Déjà présent (rejeu) : je relis la version serveur pour rafraîchir
    // mon cache local avec la réponse faisant foi.
    const { data: existing } = await supabase
      .from(op.table)
      .select("*")
      .eq("id", op.record_id)
      .maybeSingle();
    if (existing) await putLocal(op.table, existing);
  }
}

async function applyUpdate(op) {
  let query = supabase.from(op.table).update(op.payload).eq("id", op.record_id);

  if (op.base_updated_at) {
    query = query.eq("updated_at", op.base_updated_at);
  }

  const { data, error } = await query.select();
  if (error) throw error;

  if (data && data.length > 0) {
    await putLocal(op.table, data[0]);
    return { status: "ok" };
  }

  // Rien n'a été mis à jour : soit la ligne a disparu, soit updated_at a
  // changé depuis (conflit réel) — jamais un écrasement silencieux.
  const { data: serverRecord } = await supabase
    .from(op.table)
    .select("*")
    .eq("id", op.record_id)
    .maybeSingle();

  return { status: "conflict", serverRecord: serverRecord ?? null };
}

async function applyDelete(op) {
  const { error } = await supabase.from(op.table).delete().eq("id", op.record_id);
  if (error) throw error;
  // Une suppression rejouée sur une ligne déjà supprimée est un succès
  // silencieux (idempotence), pas une erreur.
  await deleteLocal(op.table, op.record_id);
}

export async function replaySyncQueue() {
  if (isSyncing) return;
  if (!navigator.onLine) return;

  isSyncing = true;
  notify({ syncing: true });

  try {
    const pending = await getPendingSyncOps();

    for (const op of pending) {
      try {
        if (op.type === "insert") {
          await applyInsert(op);
        } else if (op.type === "update") {
          const result = await applyUpdate(op);
          if (result.status === "conflict") {
            await markSyncOpConflict(op.queue_id, result.serverRecord);
            continue; // je passe à l'opération suivante, sans bloquer la file
          }
        } else if (op.type === "delete") {
          await applyDelete(op);
        }
        await markSyncOpDone(op.queue_id);
      } catch (err) {
        // Une erreur réseau au milieu de la file arrête le rejeu : les
        // opérations restantes demeurent "en_attente" et seront reprises
        // au prochain passage, sans jamais être renvoyées en double.
        console.error("Échec de synchronisation, opération conservée dans la file.", err);
        break;
      }
    }
  } finally {
    isSyncing = false;
    notify({ syncing: false });
  }
}

let pingIntervalId;

export function startAutoSync() {
  window.addEventListener("online", replaySyncQueue);
  // Un simple retour de navigator.onLine peut être trompeur (portail
  // captif, etc.) : j'ajoute un ping léger périodique.
  pingIntervalId = window.setInterval(() => {
    if (navigator.onLine) replaySyncQueue();
  }, 30000);
  // Tentative immédiate au démarrage si déjà en ligne.
  if (navigator.onLine) replaySyncQueue();
}

export function stopAutoSync() {
  window.removeEventListener("online", replaySyncQueue);
  if (pingIntervalId) window.clearInterval(pingIntervalId);
}
