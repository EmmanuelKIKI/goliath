// Mon indicateur de chargement, simple et discret. Je l'affiche
// pendant que j'attends une réponse de mon API.

export default function Spinner({ className = "" }) {
  return (
    <div className={`flex items-center justify-center py-10 ${className}`}>
      <div
        className="w-6 h-6 border-2 border-indigo/30 border-t-indigo rounded-full animate-spin"
        role="status"
        aria-label="Chargement en cours"
      />
    </div>
  );
}
