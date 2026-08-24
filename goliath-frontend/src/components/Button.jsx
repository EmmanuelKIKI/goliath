// Mon bouton standard, avec quelques variantes. Je garde des zones
// tactiles généreuses (py-3) parce que je m'en sers surtout au champ,
// avec les doigts, pas avec une souris précise.

export default function Button({ children, variant = "primaire", type = "button", className = "", ...props }) {
  const variantes = {
    primaire: "bg-indigo text-sable hover:bg-indigo-dark",
    secondaire: "bg-transparent border border-pintade/20 text-pintade hover:bg-sable-deep",
    danger: "bg-rouille text-sable hover:bg-rouille-light",
    discret: "bg-transparent text-indigo hover:underline px-0",
  };

  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${variantes[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
