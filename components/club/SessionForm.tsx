"use client";

import { FormEvent, useState } from "react";
import { PLATFORM_FEE_PERCENT, resolvePlatformFeePercent } from "@/lib/payments";
import { SessionInput } from "@/lib/sessions";

export const inputClassName =
  "rounded-lg border border-zinc-200 px-4 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-200";

export const labelClassName = "text-sm font-medium text-zinc-700";

type FormState = {
  sessionTitle: string;
  activityType: string;
  location: string;
  day: string;
  startTime: string;
  endTime: string;
  price: string;
  capacity: string;
  ageRange: string;
  providerStripeAccountId: string;
};

type SessionFormProps = {
  initialValues?: SessionInput;
  submitLabel: string;
  onSubmit: (data: SessionInput) => void;
};

const emptyFormState: FormState = {
  sessionTitle: "",
  activityType: "",
  location: "",
  day: "",
  startTime: "",
  endTime: "",
  price: "",
  capacity: "",
  ageRange: "",
  providerStripeAccountId: "",
};

function toFormState(values?: SessionInput): FormState {
  if (!values) {
    return emptyFormState;
  }

  return {
    sessionTitle: values.sessionTitle,
    activityType: values.activityType,
    location: values.location,
    day: values.day,
    startTime: values.startTime,
    endTime: values.endTime,
    price: String(values.price),
    capacity: String(values.capacity),
    ageRange: values.ageRange,
    providerStripeAccountId: values.providerStripeAccountId ?? "",
  };
}

export function SessionForm({
  initialValues,
  submitLabel,
  onSubmit,
}: SessionFormProps) {
  const [form, setForm] = useState<FormState>(() => toFormState(initialValues));
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>(
    {},
  );
  const [formError, setFormError] = useState("");

  function updateField(field: keyof FormState, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    setFormError("");
  }

  function validate(): Partial<Record<keyof FormState, string>> {
    const nextErrors: Partial<Record<keyof FormState, string>> = {};

    (Object.keys(form) as Array<keyof FormState>).forEach((field) => {
      if (field === "providerStripeAccountId") {
        return;
      }

      if (!form[field].trim()) {
        nextErrors[field] = "This field is required";
      }
    });

    if (form.price.trim() && Number.isNaN(Number(form.price))) {
      nextErrors.price = "Enter a valid price";
    }

    if (form.capacity.trim() && Number.isNaN(Number(form.capacity))) {
      nextErrors.capacity = "Enter a valid capacity";
    }

    return nextErrors;
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextErrors = validate();
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      setFormError("Please fill in all required fields.");
      return;
    }

    onSubmit({
      sessionTitle: form.sessionTitle.trim(),
      activityType: form.activityType,
      location: form.location.trim(),
      day: form.day,
      startTime: form.startTime,
      endTime: form.endTime,
      price: Number(form.price),
      capacity: Number(form.capacity),
      ageRange: form.ageRange.trim(),
      providerStripeAccountId: form.providerStripeAccountId.trim(),
      platformFeePercent: resolvePlatformFeePercent(),
    });
  }

  function fieldClassName(field: keyof FormState) {
    return errors[field]
      ? `${inputClassName} border-red-300 focus:border-red-400 focus:ring-red-100`
      : inputClassName;
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8"
    >
      {formError ? (
        <p className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {formError}
        </p>
      ) : null}

      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="session-title" className={labelClassName}>
            Session title
          </label>
          <input
            id="session-title"
            name="sessionTitle"
            type="text"
            value={form.sessionTitle}
            onChange={(event) =>
              updateField("sessionTitle", event.target.value)
            }
            placeholder="e.g. Football Club"
            className={fieldClassName("sessionTitle")}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="activity-type" className={labelClassName}>
            Activity type
          </label>
          <select
            id="activity-type"
            name="activityType"
            value={form.activityType}
            onChange={(event) =>
              updateField("activityType", event.target.value)
            }
            className={`${fieldClassName("activityType")} bg-white`}
          >
            <option value="">Select activity</option>
            <option value="sports">Sports</option>
            <option value="arts">Arts &amp; Crafts</option>
            <option value="music">Music</option>
            <option value="camps">Camps</option>
            <option value="stem">STEM</option>
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="location" className={labelClassName}>
            Location
          </label>
          <input
            id="location"
            name="location"
            type="text"
            value={form.location}
            onChange={(event) => updateField("location", event.target.value)}
            placeholder="Venue or address"
            className={fieldClassName("location")}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="day" className={labelClassName}>
            Day
          </label>
          <select
            id="day"
            name="day"
            value={form.day}
            onChange={(event) => updateField("day", event.target.value)}
            className={`${fieldClassName("day")} bg-white`}
          >
            <option value="">Select day</option>
            <option value="monday">Monday</option>
            <option value="tuesday">Tuesday</option>
            <option value="wednesday">Wednesday</option>
            <option value="thursday">Thursday</option>
            <option value="friday">Friday</option>
            <option value="saturday">Saturday</option>
            <option value="sunday">Sunday</option>
          </select>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="start-time" className={labelClassName}>
              Start time
            </label>
            <input
              id="start-time"
              name="startTime"
              type="time"
              value={form.startTime}
              onChange={(event) =>
                updateField("startTime", event.target.value)
              }
              className={fieldClassName("startTime")}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="end-time" className={labelClassName}>
              End time
            </label>
            <input
              id="end-time"
              name="endTime"
              type="time"
              value={form.endTime}
              onChange={(event) => updateField("endTime", event.target.value)}
              className={fieldClassName("endTime")}
            />
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="price" className={labelClassName}>
              Price
            </label>
            <input
              id="price"
              name="price"
              type="number"
              min={0}
              step="0.01"
              value={form.price}
              onChange={(event) => updateField("price", event.target.value)}
              placeholder="£"
              className={fieldClassName("price")}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="capacity" className={labelClassName}>
              Capacity
            </label>
            <input
              id="capacity"
              name="capacity"
              type="number"
              min={1}
              value={form.capacity}
              onChange={(event) =>
                updateField("capacity", event.target.value)
              }
              placeholder="Max participants"
              className={fieldClassName("capacity")}
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="age-range" className={labelClassName}>
            Age range
          </label>
          <input
            id="age-range"
            name="ageRange"
            type="text"
            value={form.ageRange}
            onChange={(event) => updateField("ageRange", event.target.value)}
            placeholder="e.g. 5–11 years"
            className={fieldClassName("ageRange")}
          />
        </div>

        <div className="flex flex-col gap-1.5 border-t border-zinc-100 pt-5">
          <p className="text-sm font-medium text-zinc-900">
            Stripe Connect (optional)
          </p>
          <p className="text-sm text-zinc-500">
            Link a provider Stripe account ID for future payouts. Payments are
            not live yet.
          </p>
          <label htmlFor="stripe-account-id" className={labelClassName}>
            Provider Stripe account ID
          </label>
          <input
            id="stripe-account-id"
            name="providerStripeAccountId"
            type="text"
            value={form.providerStripeAccountId}
            onChange={(event) =>
              updateField("providerStripeAccountId", event.target.value)
            }
            placeholder="acct_..."
            className={inputClassName}
          />
          <p className="text-xs text-zinc-400">
            Platform fee: {resolvePlatformFeePercent()}%
          </p>
        </div>
      </div>

      <button
        type="submit"
        className="mt-8 w-full rounded-lg bg-black px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-zinc-800 sm:w-auto"
      >
        {submitLabel}
      </button>
    </form>
  );
}
