// Plutôt que de laisser une liste vide sans explication, j'affiche ici
// un message clair sur ce qu'il n'y a pas encore, et une action pour
// combler ce vide directement.

export default function EmptyState({ titre, description, action }) {
  return (
    <div className="text-center py-12 px-4">
      <p className="font-display text-lg text-pintade mb-1">{titre}</p>
      {description && <p className="text-sm text-pintade-light mb-4">{description}</p>}
      {action}
    </div>
  );
}
