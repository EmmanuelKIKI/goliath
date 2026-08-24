// Ma fenêtre modale générique, utilisée pour tous mes formulaires de
// création/édition (nouvelle bande, nouveau mouvement de stock...).
// Je la garde volontairement simple : un fond assombri, une carte
// centrée, et un bouton de fermeture toujours accessible.

export default function Modal({ titre, ouvert, onFermer, children }) {
  if (!ouvert) return null;

  return (
    <div
      className="fixed inset-0 bg-pintade/40 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onFermer}
    >
      <div
        className="bg-sable-soft rounded-t-2xl sm:rounded-carte shadow-carte w-full sm:max-w-md max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-pintade/10 sticky top-0 bg-sable-soft">
          <h2 className="font-display text-lg font-semibold">{titre}</h2>
          <button
            onClick={onFermer}
            aria-label="Fermer"
            className="text-pintade-light hover:text-pintade text-2xl leading-none px-2"
          >
            ×
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}
