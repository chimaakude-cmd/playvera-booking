"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getChildren, type ChildProfile } from "@/lib/children";
import { getParentProfile } from "@/lib/parent-profile";
import { getCurrentUser } from "@/lib/auth";
import {
  childProfileToDetails,
  syncDetailsToChildProfile,
} from "@/lib/booking-flow/sync-child";
import type { BookingDetailsForm } from "@/lib/booking-flow/types";
import {
  BookingDetailsFields,
  validateBookingDetails,
} from "./BookingDetailsFields";

type BookingLoggedInDetailsStepProps = {
  details: BookingDetailsForm;
  onChange: (details: BookingDetailsForm) => void;
  onContinue: () => void;
  onBack: () => void;
};

export function BookingLoggedInDetailsStep({
  details,
  onChange,
  onContinue,
  onBack,
}: BookingLoggedInDetailsStepProps) {
  const [children, setChildren] = useState<ChildProfile[]>([]);
  const [errors, setErrors] = useState<
    Partial<Record<keyof BookingDetailsForm, string>>
  >({});
  const [formError, setFormError] = useState("");

  useEffect(() => {
    setChildren(getChildren());
    const user = getCurrentUser();
    const profile = getParentProfile();
    if (!details.parentName && user) {
      onChange({
        ...details,
        parentName: profile.fullName || user.name,
        email: profile.email || user.email,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- init parent fields once
  }, []);

  function handleChildSelect(childId: string) {
    const child = children.find((item) => item.id === childId);
    if (!child) {
      return;
    }
    const user = getCurrentUser();
    const profile = getParentProfile();
    onChange(
      childProfileToDetails(
        child,
        profile.fullName || user?.name || "",
        profile.email || user?.email || "",
      ),
    );
    setErrors({});
    setFormError("");
  }

  function updateField(field: keyof BookingDetailsForm, value: string) {
    onChange({ ...details, [field]: value });
    setErrors((current) => ({ ...current, [field]: undefined }));
    setFormError("");
  }

  function handleContinue() {
    const nextErrors = validateBookingDetails(details, {
      requireParentFields: false,
    });
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      setFormError("Please complete all required fields.");
      return;
    }

    if (details.childId) {
      syncDetailsToChildProfile(details.childId, details);
    }

    onContinue();
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-[#0F172A]">Select child</h2>
        <p className="mt-1 text-sm text-slate-600">
          Choose a saved profile and review medical and emergency details.
        </p>
      </div>

      {children.length > 0 ? (
        <label className="block">
          <span className="text-sm font-medium text-slate-700">Saved child</span>
          <select
            value={details.childId ?? ""}
            onChange={(e) => handleChildSelect(e.target.value)}
            className="mt-1.5 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm"
          >
            <option value="">Select a child…</option>
            {children.map((child) => (
              <option key={child.id} value={child.id}>
                {child.fullName}
              </option>
            ))}
          </select>
        </label>
      ) : (
        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-5 text-sm text-slate-600">
          No saved children yet.{" "}
          <Link href="/parent/children" className="font-semibold text-[#2563EB]">
            Add a child profile
          </Link>{" "}
          or enter details below.
        </div>
      )}

      <BookingDetailsFields
        details={details}
        errors={errors}
        onChange={updateField}
        showParentFields={false}
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
