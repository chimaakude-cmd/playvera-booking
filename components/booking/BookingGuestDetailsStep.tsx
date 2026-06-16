"use client";

import { useState } from "react";
import type { BookingDetailsForm } from "@/lib/booking-flow/types";
import {
  BookingDetailsFields,
  validateBookingDetails,
} from "./BookingDetailsFields";

type BookingGuestDetailsStepProps = {
  details: BookingDetailsForm;
  onChange: (details: BookingDetailsForm) => void;
  onContinue: () => void;
  onBack: () => void;
};

export function BookingGuestDetailsStep({
  details,
  onChange,
  onContinue,
  onBack,
}: BookingGuestDetailsStepProps) {
  const [errors, setErrors] = useState<
    Partial<Record<keyof BookingDetailsForm, string>>
  >({});
  const [formError, setFormError] = useState("");

  function updateField(field: keyof BookingDetailsForm, value: string) {
    onChange({ ...details, [field]: value });
    setErrors((current) => ({ ...current, [field]: undefined }));
    setFormError("");
  }

  function handleContinue() {
    const nextErrors = validateBookingDetails(details);
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      setFormError("Please complete all required fields.");
      return;
    }
    onContinue();
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-[#0F172A]">Child & emergency details</h2>
        <p className="mt-1 text-sm text-slate-600">
          Enter your details as a guest — no account required.
        </p>
      </div>

      <BookingDetailsFields
        details={details}
        errors={errors}
        onChange={updateField}
        showParentFields
      />

      {formError ? (
        <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {formError}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-3 pt-2">
        <button
          type="button"
          onClick={onBack}
          className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700"
        >
          Back
        </button>
        <button
          type="button"
          onClick={handleContinue}
          className="rounded-xl bg-[#2563EB] px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
        >
          Continue
        </button>
      </div>
    </div>
  );
}
