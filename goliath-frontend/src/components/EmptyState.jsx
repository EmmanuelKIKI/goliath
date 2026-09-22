// src/components/EmptyState.jsx
// Un écran vide est une invitation à agir, pas juste un constat.

export default function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-md border border-dashed border-black/10 bg-white px-6 py-12 text-center">
      {Icon && <Icon size={28} className="text-muted" />}
      <p className="font-medium text-ink">{title}</p>
      {description && <p className="text-sm text-muted max-w-xs">{description}</p>}
      {action}
    </div>
  );
}
