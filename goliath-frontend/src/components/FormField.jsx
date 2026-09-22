// src/components/FormField.jsx
// Champs réutilisables pour tous les formulaires de saisie. Labels
// explicites, bon contraste, tailles tactiles confortables (section 18).

export function FieldLabel({ children, htmlFor }) {
  return (
    <label htmlFor={htmlFor} className="block text-sm font-medium text-ink mb-1">
      {children}
    </label>
  );
}

const baseInputClass =
  "w-full rounded-md border border-black/10 bg-white px-3 py-2.5 text-sm text-ink placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-forest/40 focus:border-forest";

export function NumberField({ id, label, value, onChange, min = 0, required, suffix }) {
  return (
    <div>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <div className="relative">
        <input
          id={id}
          type="number"
          inputMode="decimal"
          min={min}
          required={required}
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value === "" ? "" : Number(e.target.value))}
          className={baseInputClass}
        />
        {suffix && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted">
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
}

export function TextField({ id, label, value, onChange, required, placeholder, type = "text" }) {
  return (
    <div>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <input
        id={id}
        type={type}
        required={required}
        placeholder={placeholder}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        className={baseInputClass}
      />
    </div>
  );
}

export function DateField({ id, label, value, onChange, required }) {
  return (
    <div>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <input
        id={id}
        type="date"
        required={required}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        className={baseInputClass}
      />
    </div>
  );
}

export function TextAreaField({ id, label, value, onChange, rows = 3, placeholder }) {
  return (
    <div>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <textarea
        id={id}
        rows={rows}
        placeholder={placeholder}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        className={baseInputClass}
      />
    </div>
  );
}

export function SelectField({ id, label, value, onChange, options, required, placeholder }) {
  return (
    <div>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <select
        id={id}
        required={required}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        className={baseInputClass}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export function CheckboxField({ id, label, checked, onChange }) {
  return (
    <label htmlFor={id} className="flex items-center gap-2.5 text-sm text-ink py-1.5">
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-5 w-5 rounded border-black/20 text-forest focus:ring-forest/40"
      />
      {label}
    </label>
  );
}

export function FormSection({ title, children }) {
  return (
    <section className="rounded-lg bg-white border border-black/5 p-4 space-y-4">
      <h3 className="text-sm font-semibold text-forest">{title}</h3>
      {children}
    </section>
  );
}
