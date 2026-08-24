// Un petit badge coloré que j'utilise pour afficher des statuts
// partout dans l'app (statut d'une bande, d'une tâche, d'une vente...).

const STYLES = {
  neutre: "bg-sable-deep text-pintade",
  indigo: "bg-indigo/10 text-indigo-dark",
  mais: "bg-mais/20 text-mais-dark",
  feuille: "bg-feuille/15 text-feuille",
  rouille: "bg-rouille/15 text-rouille",
};

export default function Badge({ children, tone = "neutre" }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${STYLES[tone]}`}>
      {children}
    </span>
  );
}
