// Je regroupe ici mes fonctions de formatage pour ne pas répéter la
// même logique dans chaque page. J'affiche mes montants en francs CFA,
// la monnaie que j'utilise réellement pour mon élevage.

export function formaterMontant(montant) {
  if (montant === null || montant === undefined) return "—";
  return new Intl.NumberFormat("fr-FR", {
    maximumFractionDigits: 0,
  }).format(montant) + " FCFA";
}

export function formaterDate(date) {
  if (!date) return "—";
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

export function formaterDateCourte(date) {
  if (!date) return "—";
  return new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "2-digit" }).format(new Date(date));
}

// Je convertis une date en format "YYYY-MM-DD" pour mes champs
// <input type="date">, qui n'acceptent que ce format précis.
export function versInputDate(date) {
  if (!date) return "";
  return new Date(date).toISOString().split("T")[0];
}
