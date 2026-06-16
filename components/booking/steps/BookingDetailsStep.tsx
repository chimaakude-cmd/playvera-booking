"use client";

import { useEffect, useState } from "react";
import { BookingQuestionsForm } from "@/components/booking/BookingQuestionsForm";
import type { BookingQuestionConfig } from "@/lib/booking-questions";
import { getChildren } from "@/lib/children";
import { childProfileToDetails } from "@/lib/booking-flow/sync-child";
import { getParentProfile } from "@/lib/parent-profile";
import { readAuthSession } from "@/lib/auth/session";
import type { BookingDetailsForm } from "@/lib/booking-flow/types";
import { getSessionSpecificQuestions } from "@/lib/booking-flow/questions";

const inputClassName =
  "rounded-lg border border-zinc-200 px-4 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-200";

const labelClassName = "text-sm font-medium text-zinc-700";

type BookingDetailsStepProps = {
  details: BookingDetailsForm;
  allQuestions: BookingQuestionConfig[];
  questionValues: Record<string, string | boolean>;
  questionErrors: Record<string, string>;
  detailErrors: Partial<Record<keyof BookingDetailsForm, string>>;
  onDetailsChange: (details: BookingDetailsForm) => void;
  onQuestionChange: (key: string, value: string | boolean) => void;
};

export function BookingDetailsStep({
  details,
  allQuestions,
  questionValues,
  questionErrors,
  detailErrors,
  onDetailsChange,
  onQuestionChange,
}: BookingDetailsStepProps) {
  const [children] = useState(() => getChildren());
  const session = readAuthSession();
  const isParent = session?.role === "parent";
  const detailQuestions = allQuestions.filter((q) =>
    [
      "medical_conditions",
      "allergies",
      "medication",
      "emergency_contact_name",
      "emergency_contact_number",
      "photo_consent_session",
      "photo_consent_marketing",
      "collection_authorised",
    ].includes(q.key),
  );
  const sessionQuestions = getSessionSpecificQuestions(allQuestions);

  useEffect(() => {
    if (!isParent) {
      return;
    }
    const profile = getParentProfile();
    if (details.parentName) {
      return;
    }
    onDetailsChange({
      ...details,
      parentName: profile.fullName || session?.name || "",
      email: profile.email || session?.email || "",
      emergencyContactName:
        details.emergencyContactName || profile.emergencyContact || "",
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- prefill once for logged-in parents
  }, [isParent]);

  function updateField(field: keyof BookingDetailsForm, value: string) {
    onDetailsChange({ ...details, [field]: value });
  }

  function selectChild(childId: string) {
    const child = children.find((item) => item.id === childId);
    if (!child) {
      return;
    }
    const profile = getParentProfile();
    onDetailsChange(
      childProfileToDetails(
        child,
        profile.fullName || session?.name || "",
        profile.email || session?.email || "",
      ),
    );
  }

  function fieldClass(field: keyof BookingDetailsForm) {
    return detailErrors[field]
      ? `${inputClassName} border-red-300 focus:border-red-400 focus:ring-red-100`
      : inputClassName;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-zinc-900">Booking details</h2>
        <p className="mt-1 text-sm text-zinc-500">
          Child information, emergency contacts, medical details, and permissions.
        </p>
      </div>

      {isParent && children.length > 0 ? (
        <div className="flex flex-col gap-1.5">
          <label htmlFor="child-select" className={labelClassName}>
            Select child
          </label>
          <select
            id="child-select"
            value={details.childId ?? ""}
            onChange={(event) => selectChild(event.target.value)}
            className={inputClassName}
          >
            <option value="">Enter details manually</option>
            {children.map((child) => (
              <option key={child.id} value={child.id}>
                {child.fullName}
              </option>
            ))}
          </select>
        </div>
      ) : null}

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <label htmlFor="parent-name" className={labelClassName}>
            Parent name
          </label>
          <input
            id="parent-name"
            value={details.parentName}
            onChange={(event) => updateField("parentName", event.target.value)}
            className={fieldClass("parentName")}
          />
        </div>
        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <label htmlFor="email" className={labelClassName}>
            Email
          </label>
          <input
            id="email"
            type="email"
            value={details.email}
            onChange={(event) => updateField("email", event.target.value)}
            className={fieldClass("email")}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="child-name" className={labelClassName}>
            Child name
          </label>
          <input
            id="child-name"
            value={details.childName}
            onChange={(event) => updateField("childName", event.target.value)}
            className={fieldClass("childName")}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="child-age" className={labelClassName}>
            Child age
          </label>
          <input
            id="child-age"
            type="number"
            min={0}
            max={18}
            value={details.childAge}
            onChange={(event) => updateField("childAge", event.target.value)}
            className={fieldClass("childAge")}
          />
        </div>
      </div>

      {detailQuestions.length > 0 ? (
        <BookingQuestionsForm
          questions={detailQuestions}
          values={questionValues}
          errors={questionErrors}
          onChange={onQuestionChange}
        />
      ) : (
        <div className="grid gap-5">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="medical" className={labelClassName}>
              Medical conditions
            </label>
            <textarea
              id="medical"
              rows={2}
              value={details.medicalConditions}
              onChange={(event) =>
                updateField("medicalConditions", event.target.value)
              }
              className={inputClassName}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="allergies" className={labelClassName}>
              Allergies
            </label>
            <textarea
              id="allergies"
              rows={2}
              value={details.allergies}
              onChange={(event) => updateField("allergies", event.target.value)}
              className={inputClassName}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="medication" className={labelClassName}>
              Medication
            </label>
            <textarea
              id="medication"
              rows={2}
              value={details.medicationRequired}
              onChange={(event) =>
                updateField("medicationRequired", event.target.value)
              }
              className={inputClassName}
            />
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="ec-name" className={labelClassName}>
                Emergency contact name
              </label>
              <input
                id="ec-name"
                value={details.emergencyContactName}
                onChange={(event) =>
                  updateField("emergencyContactName", event.target.value)
                }
                className={fieldClass("emergencyContactName")}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="ec-phone" className={labelClassName}>
                Emergency contact phone
              </label>
              <input
                id="ec-phone"
                value={details.emergencyContactPhone}
                onChange={(event) =>
                  updateField("emergencyContactPhone", event.target.value)
                }
                className={fieldClass("emergencyContactPhone")}
              />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="collection" className={labelClassName}>
              Authorised collection person
            </label>
            <input
              id="collection"
              value={details.authorizedCollectionPerson}
              onChange={(event) =>
                updateField("authorizedCollectionPerson", event.target.value)
              }
              className={inputClassName}
            />
          </div>
        </div>
      )}

      {sessionQuestions.length > 0 ? (
        <div>
          <h3 className="mb-3 text-sm font-semibold text-zinc-900">
            Session-specific questions
          </h3>
          <BookingQuestionsForm
            questions={sessionQuestions}
            values={questionValues}
            errors={questionErrors}
            onChange={onQuestionChange}
          />
        </div>
      ) : null}
    </div>
  );
}
