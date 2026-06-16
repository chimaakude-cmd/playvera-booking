"use client";

import type { BookingDetailsForm } from "@/lib/booking-flow/types";

const inputClassName =
  "w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-[#0F172A] placeholder:text-slate-400 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100";

const labelClassName = "text-sm font-medium text-slate-700";

type FieldProps = {
  id: string;
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
};

function Field({ id, label, required, error, children }: FieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className={labelClassName}>
        {label}
        {required ? <span className="text-rose-500"> *</span> : null}
      </label>
      {children}
      {error ? <p className="text-xs text-rose-600">{error}</p> : null}
    </div>
  );
}

type BookingDetailsFieldsProps = {
  details: BookingDetailsForm;
  errors: Partial<Record<keyof BookingDetailsForm, string>>;
  onChange: (field: keyof BookingDetailsForm, value: string) => void;
  showParentFields?: boolean;
};

export function BookingDetailsFields({
  details,
  errors,
  onChange,
  showParentFields = true,
}: BookingDetailsFieldsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {showParentFields ? (
        <>
          <Field
            id="parent-name"
            label="Parent name"
            required
            error={errors.parentName}
          >
            <input
              id="parent-name"
              value={details.parentName}
              onChange={(e) => onChange("parentName", e.target.value)}
              className={inputClassName}
            />
          </Field>
          <Field id="email" label="Email" required error={errors.email}>
            <input
              id="email"
              type="email"
              value={details.email}
              onChange={(e) => onChange("email", e.target.value)}
              className={inputClassName}
            />
          </Field>
        </>
      ) : null}

      <Field
        id="child-name"
        label="Child name"
        required
        error={errors.childName}
      >
        <input
          id="child-name"
          value={details.childName}
          onChange={(e) => onChange("childName", e.target.value)}
          className={inputClassName}
        />
      </Field>

      <Field id="child-age" label="Child age" required error={errors.childAge}>
        <input
          id="child-age"
          type="number"
          min={0}
          max={18}
          value={details.childAge}
          onChange={(e) => onChange("childAge", e.target.value)}
          className={inputClassName}
        />
      </Field>

      <div className="sm:col-span-2">
        <Field
          id="medical-conditions"
          label="Medical conditions"
          required
          error={errors.medicalConditions}
        >
          <textarea
            id="medical-conditions"
            rows={2}
            value={details.medicalConditions}
            onChange={(e) => onChange("medicalConditions", e.target.value)}
            placeholder="None if not applicable"
            className={inputClassName}
          />
        </Field>
      </div>

      <div className="sm:col-span-2">
        <Field id="allergies" label="Allergies" required error={errors.allergies}>
          <textarea
            id="allergies"
            rows={2}
            value={details.allergies}
            onChange={(e) => onChange("allergies", e.target.value)}
            placeholder="None if not applicable"
            className={inputClassName}
          />
        </Field>
      </div>

      <Field
        id="medication"
        label="Medication required during session?"
        required
        error={errors.medicationRequired}
      >
        <select
          id="medication"
          value={details.medicationRequired}
          onChange={(e) => onChange("medicationRequired", e.target.value)}
          className={inputClassName}
        >
          <option value="">Select…</option>
          <option value="yes">Yes</option>
          <option value="no">No</option>
        </select>
      </Field>

      <Field
        id="emergency-name"
        label="Emergency contact name"
        required
        error={errors.emergencyContactName}
      >
        <input
          id="emergency-name"
          value={details.emergencyContactName}
          onChange={(e) => onChange("emergencyContactName", e.target.value)}
          className={inputClassName}
        />
      </Field>

      <Field
        id="emergency-phone"
        label="Emergency contact number"
        required
        error={errors.emergencyContactPhone}
      >
        <input
          id="emergency-phone"
          type="tel"
          value={details.emergencyContactPhone}
          onChange={(e) => onChange("emergencyContactPhone", e.target.value)}
          className={inputClassName}
        />
      </Field>

      <Field
        id="photo-consent"
        label="Photo / video consent for this session"
        required
        error={errors.photoConsentSession}
      >
        <select
          id="photo-consent"
          value={details.photoConsentSession}
          onChange={(e) => onChange("photoConsentSession", e.target.value)}
          className={inputClassName}
        >
          <option value="">Select…</option>
          <option value="yes">Yes</option>
          <option value="no">No</option>
        </select>
      </Field>

      <Field
        id="photo-marketing"
        label="Photo / video consent for marketing"
        error={errors.photoConsentMarketing}
      >
        <select
          id="photo-marketing"
          value={details.photoConsentMarketing}
          onChange={(e) => onChange("photoConsentMarketing", e.target.value)}
          className={inputClassName}
        >
          <option value="">Select…</option>
          <option value="yes">Yes</option>
          <option value="no">No</option>
        </select>
      </Field>

      <div className="sm:col-span-2">
        <Field
          id="collection-person"
          label="Authorised collection person"
          required
          error={errors.authorizedCollectionPerson}
        >
          <input
            id="collection-person"
            value={details.authorizedCollectionPerson}
            onChange={(e) =>
              onChange("authorizedCollectionPerson", e.target.value)
            }
            className={inputClassName}
          />
        </Field>
      </div>
    </div>
  );
}

export function validateBookingDetails(
  details: BookingDetailsForm,
  options: { requireParentFields?: boolean } = {},
): Partial<Record<keyof BookingDetailsForm, string>> {
  const errors: Partial<Record<keyof BookingDetailsForm, string>> = {};
  const requireParent = options.requireParentFields !== false;

  if (requireParent && !details.parentName.trim()) {
    errors.parentName = "Required";
  }
  if (requireParent && !details.email.trim()) {
    errors.email = "Required";
  }
  if (!details.childName.trim()) {
    errors.childName = "Required";
  }
  if (!details.childAge.trim() || Number.isNaN(Number(details.childAge))) {
    errors.childAge = "Enter a valid age";
  }
  if (!details.medicalConditions.trim()) {
    errors.medicalConditions = "Required — enter None if not applicable";
  }
  if (!details.allergies.trim()) {
    errors.allergies = "Required — enter None if not applicable";
  }
  if (!details.medicationRequired) {
    errors.medicationRequired = "Required";
  }
  if (!details.emergencyContactName.trim()) {
    errors.emergencyContactName = "Required";
  }
  if (!details.emergencyContactPhone.trim()) {
    errors.emergencyContactPhone = "Required";
  }
  if (!details.photoConsentSession) {
    errors.photoConsentSession = "Required";
  }
  if (!details.authorizedCollectionPerson.trim()) {
    errors.authorizedCollectionPerson = "Required";
  }

  return errors;
}
