"use client";

import { ReactNode } from "react";

export const wizardInputClassName =
  "w-full rounded-lg border border-zinc-200 bg-white px-4 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-200";

export const wizardLabelClassName = "text-sm font-medium text-zinc-700";

export const wizardTextareaClassName =
  "min-h-[96px] w-full rounded-lg border border-zinc-200 bg-white px-4 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-200";

type FieldProps = {
  label: string;
  htmlFor: string;
  error?: string;
  children: ReactNode;
  hint?: string;
};

export function WizardField({ label, htmlFor, error, children, hint }: FieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className={wizardLabelClassName}>
        {label}
      </label>
      {children}
      {hint ? <p className="text-xs text-zinc-500">{hint}</p> : null}
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
    </div>
  );
}

type StepSectionProps = {
  title: string;
  description: string;
  children: ReactNode;
};

export function StepSection({ title, description, children }: StepSectionProps) {
  return (
    <section className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-zinc-900">{title}</h2>
        <p className="mt-1 text-sm text-zinc-500">{description}</p>
      </div>
      {children}
    </section>
  );
}

export function StepperButton({
  children,
  variant = "secondary",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary";
}) {
  const className =
    variant === "primary"
      ? "rounded-lg px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:opacity-90 disabled:cursor-not-allowed disabled:bg-zinc-300"
      : "rounded-lg border border-zinc-200 bg-white px-5 py-2.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 disabled:cursor-not-allowed disabled:text-zinc-400";

  return (
    <button
      type="button"
      className={className}
      style={
        variant === "primary" && !props.disabled
          ? { backgroundColor: "#F87128" }
          : undefined
      }
      {...props}
    >
      {children}
    </button>
  );
}

export function QuantityControl({
  value,
  onChange,
  min = 1,
  label,
}: {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  label: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="sr-only">{label}</span>
      <button
        type="button"
        aria-label={`Decrease ${label}`}
        onClick={() => onChange(Math.max(min, value - 1))}
        className="flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-200 bg-white text-lg font-semibold text-zinc-700 transition-colors hover:bg-zinc-50"
      >
        −
      </button>
      <span className="min-w-10 text-center text-sm font-semibold text-zinc-900">
        {value}
      </span>
      <button
        type="button"
        aria-label={`Increase ${label}`}
        onClick={() => onChange(value + 1)}
        className="flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-200 bg-white text-lg font-semibold text-zinc-700 transition-colors hover:bg-zinc-50"
      >
        +
      </button>
    </div>
  );
}
