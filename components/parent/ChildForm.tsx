"use client";

import { FormEvent, useState } from "react";
import {
  inputClassName,
  labelClassName,
} from "@/components/club/SessionForm";
import { ChildInput } from "@/lib/children";

type ChildFormProps = {
  initialValues?: ChildInput;
  submitLabel: string;
  onSubmit: (data: ChildInput) => void;
  onCancel?: () => void;
};

const emptyValues: ChildInput = {
  fullName: "",
  dateOfBirth: "",
  medicalConditions: "",
  senNeeds: "",
  allergies: "",
  emergencyContactName: "",
  emergencyContactPhone: "",
};

export function ChildForm({
  initialValues,
  submitLabel,
  onSubmit,
  onCancel,
}: ChildFormProps) {
  const [form, setForm] = useState<ChildInput>(initialValues ?? emptyValues);
  const [formError, setFormError] = useState("");

  function updateField(field: keyof ChildInput, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
    setFormError("");
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!form.fullName.trim() || !form.dateOfBirth) {
      setFormError("Child full name and date of birth are required.");
      return;
    }

    onSubmit({
      fullName: form.fullName.trim(),
      dateOfBirth: form.dateOfBirth,
      medicalConditions: form.medicalConditions.trim(),
      senNeeds: form.senNeeds.trim(),
      allergies: form.allergies.trim(),
      emergencyContactName: form.emergencyContactName.trim(),
      emergencyContactPhone: form.emergencyContactPhone.trim(),
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm"
    >
      {formError ? (
        <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {formError}
        </p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <label htmlFor="full-name" className={labelClassName}>
            Child full name
          </label>
          <input
            id="full-name"
            value={form.fullName}
            onChange={(event) => updateField("fullName", event.target.value)}
            className={inputClassName}
            placeholder="Full name"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="date-of-birth" className={labelClassName}>
            Date of birth
          </label>
          <input
            id="date-of-birth"
            type="date"
            value={form.dateOfBirth}
            onChange={(event) =>
              updateField("dateOfBirth", event.target.value)
            }
            className={inputClassName}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className={labelClassName}>Age</label>
          <p className="rounded-lg border border-zinc-100 bg-zinc-50 px-4 py-2.5 text-sm text-zinc-600">
            {form.dateOfBirth
              ? `${calculateDisplayAge(form.dateOfBirth)} years`
              : "Calculated automatically"}
          </p>
        </div>

        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <label htmlFor="medical-conditions" className={labelClassName}>
            Medical conditions
          </label>
          <textarea
            id="medical-conditions"
            value={form.medicalConditions}
            onChange={(event) =>
              updateField("medicalConditions", event.target.value)
            }
            rows={2}
            className={inputClassName}
            placeholder="Any medical conditions"
          />
        </div>

        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <label htmlFor="sen-needs" className={labelClassName}>
            SEN / additional needs
          </label>
          <textarea
            id="sen-needs"
            value={form.senNeeds}
            onChange={(event) => updateField("senNeeds", event.target.value)}
            rows={2}
            className={inputClassName}
            placeholder="Special educational or additional needs"
          />
        </div>

        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <label htmlFor="allergies" className={labelClassName}>
            Allergies
          </label>
          <textarea
            id="allergies"
            value={form.allergies}
            onChange={(event) => updateField("allergies", event.target.value)}
            rows={2}
            className={inputClassName}
            placeholder="Known allergies"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="emergency-name" className={labelClassName}>
            Emergency contact name
          </label>
          <input
            id="emergency-name"
            value={form.emergencyContactName}
            onChange={(event) =>
              updateField("emergencyContactName", event.target.value)
            }
            className={inputClassName}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="emergency-phone" className={labelClassName}>
            Emergency contact phone
          </label>
          <input
            id="emergency-phone"
            type="tel"
            value={form.emergencyContactPhone}
            onChange={(event) =>
              updateField("emergencyContactPhone", event.target.value)
            }
            className={inputClassName}
          />
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <button
          type="submit"
          className="rounded-lg bg-black px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-zinc-800"
        >
          {submitLabel}
        </button>
        {onCancel ? (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-zinc-200 px-5 py-2.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50"
          >
            Cancel
          </button>
        ) : null}
      </div>
    </form>
  );
}

function calculateDisplayAge(dateOfBirth: string): number {
  const birth = new Date(dateOfBirth);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age -= 1;
  }

  return Math.max(0, age);
}
