// src/components/DynamicList.jsx
// Petit utilitaire partagé par les sections du Suivi du jour qui acceptent
// plusieurs entrées (traitements, vaccinations, vitamines, incidents...).
// Chaque nouvelle ligne reçoit immédiatement son UUID définitif — jamais un
// ID temporaire remplacé plus tard.

import { Plus, Trash2 } from "lucide-react";

export default function DynamicList({ items, onAdd, onRemove, newItem, addLabel, renderItem }) {
  return (
    <div className="space-y-3">
      {items.map((item, index) => (
        <div key={item.id} className="relative rounded-md border border-black/10 p-3 pr-10">
          <button
            type="button"
            onClick={() => onRemove(item.id)}
            aria-label="Supprimer cette ligne"
            className="absolute top-3 right-3 text-muted hover:text-danger"
          >
            <Trash2 size={16} />
          </button>
          <div className="grid grid-cols-2 gap-3">{renderItem(item, index)}</div>
        </div>
      ))}
      <button
        type="button"
        onClick={() => onAdd({ id: crypto.randomUUID(), ...newItem })}
        className="flex items-center gap-1.5 text-sm font-medium text-forest"
      >
        <Plus size={16} />
        {addLabel}
      </button>
    </div>
  );
}
