// src/services/backupExport.js
// Export CSV (consultation seulement) + export/import JSON complet (pensé
// pour une restauration). L'export et l'import JSON appellent les
// fonctions SQL du backend (export_full_backup / import_full_backup) en
// RPC direct — ce n'est que du CRUD élargi, pas une Edge Function.

import { supabase } from "./supabaseClient.js";

function downloadBlob(content, filename, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportRecordsToCsv(records, columns, filename) {
  const header = columns.map((c) => c.label).join(";");
  const rows = records.map((record) =>
    columns.map((c) => csvEscape(record[c.key] ?? "")).join(";"),
  );
  const csv = [header, ...rows].join("\n");
  downloadBlob(csv, filename, "text/csv;charset=utf-8;");
}

function csvEscape(value) {
  const str = String(value);
  if (str.includes(";") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export async function exportFullBackupJson() {
  const { data, error } = await supabase.rpc("export_full_backup");
  if (error) throw error;

  const filename = `goliath-sauvegarde-${new Date().toISOString().slice(0, 10)}.json`;
  downloadBlob(JSON.stringify(data, null, 2), filename, "application/json");
  return data;
}

// Import "tout ou rien" : la fonction SQL elle-même refuse toute
// application partielle en cas d'erreur de structure ou de version.
export async function importFullBackupJson(file) {
  const text = await file.text();
  let payload;
  try {
    payload = JSON.parse(text);
  } catch {
    throw new Error("Le fichier n'est pas un JSON valide.");
  }

  const { data, error } = await supabase.rpc("import_full_backup", { p_payload: payload });
  if (error) throw error;
  return data;
}
