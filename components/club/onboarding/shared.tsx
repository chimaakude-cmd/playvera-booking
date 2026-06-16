"use client";

import { ReactNode } from "react";

export const onboardingInputClassName =
  "w-full rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-100";

export const onboardingLabelClassName = "text-sm font-medium text-zinc-700";

export const onboardingTextareaClassName =
  "min-h-[96px] w-full rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-100";

type FieldProps = {
  label: string;
  htmlFor: string;
  error?: string;
  children: ReactNode;
  hint?: string;
  required?: boolean;
};

export function OnboardingField({
  label,
  htmlFor,
  error,
  children,
  hint,
  required,
}: FieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className={onboardingLabelClassName}>
        {label}
        {required ? <span className="text-rose-500"> *</span> : null}
      </label>
      {children}
      {hint ? <p className="text-xs text-zinc-500">{hint}</p> : null}
      {error ? <p className="text-xs text-rose-600">{error}</p> : null}
    </div>
  );
}

type CheckboxGroupProps<T extends string> = {
  label: string;
  options: readonly T[] | T[];
  selected: T[];
  onChange: (selected: T[]) => void;
  columns?: 2 | 3;
};

export function OnboardingCheckboxGroup<T extends string>({
  label,
  options,
  selected,
  onChange,
  columns = 2,
}: CheckboxGroupProps<T>) {
  function toggle(option: T) {
    if (selected.includes(option)) {
      onChange(selected.filter((item) => item !== option));
    } else {
      onChange([...selected, option]);
    }
  }

  return (
    <fieldset>
      <legend className={`${onboardingLabelClassName} mb-2`}>{label}</legend>
      <div
        className={`grid gap-2 ${columns === 3 ? "sm:grid-cols-3" : "sm:grid-cols-2"}`}
      >
        {options.map((option) => {
          const checked = selected.includes(option);
          return (
            <label
              key={option}
              className={`flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2.5 text-sm transition-colors ${
                checked
                  ? "border-teal-300 bg-teal-50 text-teal-900"
                  : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300"
              }`}
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={() => toggle(option)}
                className="h-4 w-4 rounded border-zinc-300 text-teal-600 focus:ring-teal-500"
              />
              {option}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

type ImageUploadProps = {
  label: string;
  value: string | null;
  onChange: (dataUrl: string | null) => void;
  compact?: boolean;
};

export function OnboardingImageUpload({
  label,
  value,
  onChange,
  compact = false,
}: ImageUploadProps) {
  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      onChange(typeof reader.result === "string" ? reader.result : null);
    };
    reader.readAsDataURL(file);
  }

  return (
    <div className="space-y-2">
      <span className={onboardingLabelClassName}>{label}</span>
      <div
        className={`relative overflow-hidden rounded-2xl border-2 border-dashed ${
          value ? "border-teal-300 bg-teal-50/30" : "border-zinc-200 bg-zinc-50"
        } ${compact ? "min-h-[120px]" : "min-h-[160px]"}`}
      >
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={value}
            alt={`${label} preview`}
            className={`w-full object-cover ${compact ? "h-[120px]" : "h-[160px]"}`}
          />
        ) : (
          <div className="flex h-full min-h-[inherit] flex-col items-center justify-center px-4 py-6 text-center text-zinc-500">
            <span className="text-2xl">↑</span>
            <span className="mt-2 text-sm font-medium">Upload {label.toLowerCase()}</span>
            <span className="mt-1 text-xs text-zinc-400">PNG or JPG, max 2MB recommended</span>
          </div>
        )}
        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="absolute inset-0 cursor-pointer opacity-0"
          aria-label={`Upload ${label}`}
        />
      </div>
      {value ? (
        <button
          type="button"
          onClick={() => onChange(null)}
          className="text-xs font-medium text-rose-600 hover:text-rose-800"
        >
          Remove image
        </button>
      ) : null}
    </div>
  );
}

export function OnboardingInfoBox({
  children,
  variant = "info",
}: {
  children: ReactNode;
  variant?: "info" | "warning" | "success";
}) {
  const styles = {
    info: "border-teal-200 bg-teal-50 text-teal-900",
    warning: "border-amber-200 bg-amber-50 text-amber-900",
    success: "border-emerald-200 bg-emerald-50 text-emerald-900",
  };

  return (
    <div className={`rounded-xl border px-4 py-3 text-sm leading-relaxed ${styles[variant]}`}>
      {children}
    </div>
  );
}

export function OnboardingStepIntro({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="mb-6">
      <h2 className="text-lg font-semibold text-zinc-900">{title}</h2>
      <p className="mt-1 text-sm leading-relaxed text-zinc-500">{description}</p>
    </div>
  );
}
