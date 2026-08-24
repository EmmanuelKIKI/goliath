// Je m'en sers pour afficher mes indicateurs clés sur le tableau de
// bord : un gros chiffre lisible de loin, avec son libellé et une
// couleur qui indique si c'est plutôt positif, neutre ou alarmant.

export default function StatTile({ label, valeur, couleur = "pintade", sousTexte }) {
  const couleursTexte = {
    pintade: "text-pintade",
    indigo: "text-indigo",
    feuille: "text-feuille",
    rouille: "text-rouille",
    mais: "text-mais-dark",
  };

  return (
    <div className="bg-sable-soft rounded-carte shadow-carte p-4 flex flex-col gap-1">
      <span className="text-xs uppercase tracking-wide text-pintade-light font-medium">{label}</span>
      <span className={`font-display chiffre text-3xl font-semibold ${couleursTexte[couleur]}`}>
        {valeur}
      </span>
      {sousTexte && <span className="text-xs text-pintade-light">{sousTexte}</span>}
    </div>
  );
}
