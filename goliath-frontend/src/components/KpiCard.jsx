// src/components/KpiCard.jsx
// Toute valeur affichée ici vient d'une vue/fonction SQL du backend — je
// n'y recalcule jamais une formule officielle.

export default function KpiCard({ label, value, hint, tone = "default" }) {
  const toneClass = {
    default: "text-ink",
    warning: "text-warning",
    danger: "text-danger",
  }[tone];

  return (
    <div className="rounded-md border border-black/5 bg-white p-4">
      <p className="text-xs text-muted">{label}</p>
      <p className={`mt-1 text-2xl font-semibold ${toneClass}`}>
        {value === null || value === undefined ? "—" : value}
      </p>
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </div>
  );
}
