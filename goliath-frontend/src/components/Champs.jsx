// Je regroupe ici mes champs de formulaire standards pour garder un
// style cohérent partout dans l'app, sans répéter les mêmes classes
// Tailwind dans chaque page.

export function Champ({ label, children, obligatoire }) {
  return (
    <label className="block mb-4">
      <span className="block text-sm font-medium text-pintade mb-1.5">
        {label} {obligatoire && <span className="text-rouille">*</span>}
      </span>
      {children}
    </label>
  );
}

const classesChamp =
  "w-full px-3 py-2.5 rounded-lg border border-pintade/15 bg-sable-soft text-pintade placeholder:text-pintade-light/60 focus:border-indigo outline-none";

export function ChampTexte(props) {
  return <input className={classesChamp} {...props} />;
}

export function ChampNombre(props) {
  return <input type="number" className={classesChamp} {...props} />;
}

export function ChampDate(props) {
  return <input type="date" className={classesChamp} {...props} />;
}

export function ChampSelect({ children, ...props }) {
  return (
    <select className={classesChamp} {...props}>
      {children}
    </select>
  );
}

export function ChampTexteLong(props) {
  return <textarea className={`${classesChamp} min-h-[80px]`} {...props} />;
}
