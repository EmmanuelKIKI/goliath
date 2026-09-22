// src/utils/format.js
// Petits formateurs d'affichage. Aucun calcul "officiel" ici — l'âge d'un
// lot est une simple conversion de dates pour l'affichage, jamais un
// indicateur métier recalculé (ça, c'est le rôle du backend).

export function formatDate(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function formatDateTime(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatCurrency(value, currency = "XOF") {
  if (value === null || value === undefined) return "—";
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatNumber(value, decimals = 1) {
  if (value === null || value === undefined) return "—";
  return new Intl.NumberFormat("fr-FR", {
    maximumFractionDigits: decimals,
  }).format(value);
}

export function formatPercent(value, decimals = 1) {
  if (value === null || value === undefined) return "—";
  return `${formatNumber(value, decimals)} %`;
}

// Âge du lot en semaines et jours, calculé automatiquement — jamais saisi
// manuellement (section 12 du prompt frontend).
export function formatLotAge(entryDate) {
  if (!entryDate) return "—";
  const days = Math.floor((Date.now() - new Date(entryDate).getTime()) / (1000 * 60 * 60 * 24));
  if (days < 0) return "pas encore entré";
  const weeks = Math.floor(days / 7);
  const remainingDays = days % 7;
  return `${weeks} sem. ${remainingDays} j`;
}

export function todayIso() {
  return new Date().toISOString().slice(0, 10);
}
