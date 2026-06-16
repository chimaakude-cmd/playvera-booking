import type { ReactNode } from "react";

const inputClassName =
  "w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-100";

const textareaClassName = `${inputClassName} min-h-[112px] resize-y`;

export function ProfileSection({
  id,
  title,
  description,
  children,
}: {
  id: string;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      className="scroll-mt-24 rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-sm sm:p-6"
    >
      <div className="mb-5 border-b border-zinc-100 pb-4">
        <h2 className="text-lg font-semibold text-zinc-900">{title}</h2>
        <p className="mt-1 text-sm text-zinc-500">{description}</p>
      </div>
      <div className="space-y-5">{children}</div>
    </section>
  );
}

export function ProfileField({
  label,
  htmlFor,
  hint,
  children,
}: {
  label: string;
  htmlFor?: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label
        htmlFor={htmlFor}
        className="mb-1.5 block text-sm font-medium text-zinc-800"
      >
        {label}
      </label>
      {children}
      {hint ? <p className="mt-1.5 text-xs text-zinc-500">{hint}</p> : null}
    </div>
  );
}

export function ProfileTextInput({
  id,
  value,
  onChange,
  placeholder,
  type = "text",
  disabled = false,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  disabled?: boolean;
}) {
  return (
    <input
      id={id}
      type={type}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      className={`${inputClassName}${disabled ? " cursor-not-allowed bg-zinc-100 text-zinc-500" : ""}`}
    />
  );
}

export function ProfileTextarea({
  id,
  value,
  onChange,
  placeholder,
  rows = 4,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <textarea
      id={id}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      rows={rows}
      className={textareaClassName}
    />
  );
}

export function ProfileSelect({
  id,
  value,
  onChange,
  options,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <select
      id={id}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className={inputClassName}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

export function ProfileToggle({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-4 rounded-xl border border-zinc-200 bg-zinc-50/60 px-4 py-3">
      <span>
        <span className="block text-sm font-medium text-zinc-900">{label}</span>
        <span className="mt-1 block text-xs text-zinc-500">{description}</span>
      </span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-1 h-4 w-4 rounded border-zinc-300 text-teal-600 focus:ring-teal-500"
      />
    </label>
  );
}

export function ProfileChipGroup({
  options,
  selected,
  onToggle,
}: {
  options: readonly string[];
  selected: string[];
  onToggle: (value: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => {
        const active = selected.includes(option);

        return (
          <button
            key={option}
            type="button"
            onClick={() => onToggle(option)}
            className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
              active
                ? "bg-teal-600 text-white"
                : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
            }`}
          >
            {option}
          </button>
        );
      })}
    </div>
  );
}

export function ProfileImagePlaceholder({
  label,
  hint,
  aspect = "square",
}: {
  label: string;
  hint: string;
  aspect?: "square" | "banner";
}) {
  return (
    <div
      className={`flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-300 bg-zinc-50/80 text-center ${
        aspect === "banner" ? "min-h-36 px-6" : "aspect-square max-w-40 px-4"
      }`}
    >
      <span className="text-2xl text-zinc-300">＋</span>
      <p className="mt-2 text-sm font-medium text-zinc-700">{label}</p>
      <p className="mt-1 text-xs text-zinc-500">{hint}</p>
    </div>
  );
}

export { inputClassName, textareaClassName };
