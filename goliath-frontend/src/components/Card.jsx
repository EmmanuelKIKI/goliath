// Ma carte de base, utilisée partout dans l'app. J'accepte une couleur
// d'accent optionnelle pour la fine bordure gauche, qui me sert à
// coder visuellement le module concerné (santé, stock, finance...).

export default function Card({ children, accent, className = "" }) {
  const couleursAccent = {
    indigo: "border-l-indigo",
    mais: "border-l-mais",
    feuille: "border-l-feuille",
    rouille: "border-l-rouille",
  };

  return (
    <div
      className={`bg-sable-soft rounded-carte shadow-carte p-4 ${
        accent ? `border-l-4 ${couleursAccent[accent]}` : ""
      } ${className}`}
    >
      {children}
    </div>
  );
}
