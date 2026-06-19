"use client";

import {
  AGE_OPTIONS,
  AttendeeCriteriaType,
  KEY_STAGES,
  SCHOOL_YEARS,
  formatAttendeePreview,
} from "@/lib/attendee-criteria";
import { WizardFormData } from "@/lib/session-wizard";
import { MainImageUpload } from "./MainImageUpload";
import { SessionImageGallery } from "./SessionImageGallery";
import {
  getSupabaseStorageSetupMessage,
  shouldShowStorageSetupNotice,
} from "@/lib/image-storage";
import {
  StepSection,
  WizardField,
  wizardInputClassName,
  wizardLabelClassName,
  wizardTextareaClassName,
} from "./shared";

type SessionDetailsStepProps = {
  data: WizardFormData;
  onChange: (updates: Partial<WizardFormData>) => void;
};

const criteriaOptions: Array<{ value: AttendeeCriteriaType; label: string }> = [
  { value: "age", label: "Age based" },
  { value: "school_year", label: "School year" },
  { value: "key_stage", label: "Key stage" },
];

export function SessionDetailsStep({ data, onChange }: SessionDetailsStepProps) {
  function updateAttendee(updates: Partial<WizardFormData["attendeeCriteria"]>) {
    onChange({
      attendeeCriteria: {
        ...data.attendeeCriteria,
        ...updates,
      },
    });
  }

  return (
    <StepSection
      title="Session details"
      description="Describe your session and define who can attend."
    >
      <WizardField label="Session name" htmlFor="session-name">
        <input
          id="session-name"
          value={data.sessionTitle}
          onChange={(event) => onChange({ sessionTitle: event.target.value })}
          placeholder="e.g. Tuesday Football Skills"
          className={wizardInputClassName}
        />
      </WizardField>

      <WizardField label="Session description" htmlFor="session-description">
        <textarea
          id="session-description"
          value={data.description}
          onChange={(event) => onChange({ description: event.target.value })}
          placeholder="Describe the session, coaching style, and what children will learn."
          className={wizardTextareaClassName}
        />
      </WizardField>

      <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 sm:p-5">
        <p className="text-sm font-semibold text-zinc-900">Who can attend?</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {criteriaOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => updateAttendee({ type: option.value })}
              className={`rounded-xl border px-4 py-3 text-sm font-medium transition-colors ${
                data.attendeeCriteria.type === option.value
                  ? "border-pink-500 bg-pink-50 text-pink-700"
                  : "border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-100"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>

        {data.attendeeCriteria.type === "age" ? (
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <WizardField label="From age" htmlFor="age-from">
              <select
                id="age-from"
                value={data.attendeeCriteria.ageFrom}
                onChange={(event) =>
                  updateAttendee({ ageFrom: Number(event.target.value) })
                }
                className={wizardInputClassName}
              >
                {AGE_OPTIONS.map((age) => (
                  <option key={age} value={age}>
                    {age} years
                  </option>
                ))}
              </select>
            </WizardField>
            <WizardField label="To age" htmlFor="age-to">
              <select
                id="age-to"
                value={data.attendeeCriteria.ageTo}
                onChange={(event) =>
                  updateAttendee({ ageTo: Number(event.target.value) })
                }
                className={wizardInputClassName}
              >
                {AGE_OPTIONS.map((age) => (
                  <option key={age} value={age}>
                    {age} years
                  </option>
                ))}
              </select>
            </WizardField>
          </div>
        ) : null}

        {data.attendeeCriteria.type === "school_year" ? (
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <WizardField label="From school year" htmlFor="school-from">
              <select
                id="school-from"
                value={data.attendeeCriteria.schoolYearFrom}
                onChange={(event) =>
                  updateAttendee({ schoolYearFrom: event.target.value })
                }
                className={wizardInputClassName}
              >
                {SCHOOL_YEARS.map((year) => (
                  <option key={year.value} value={year.value}>
                    {year.label}
                  </option>
                ))}
              </select>
            </WizardField>
            <WizardField label="To school year" htmlFor="school-to">
              <select
                id="school-to"
                value={data.attendeeCriteria.schoolYearTo}
                onChange={(event) =>
                  updateAttendee({ schoolYearTo: event.target.value })
                }
                className={wizardInputClassName}
              >
                {SCHOOL_YEARS.map((year) => (
                  <option key={year.value} value={year.value}>
                    {year.label}
                  </option>
                ))}
              </select>
            </WizardField>
          </div>
        ) : null}

        {data.attendeeCriteria.type === "key_stage" ? (
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <WizardField label="From key stage" htmlFor="ks-from">
              <select
                id="ks-from"
                value={data.attendeeCriteria.keyStageFrom}
                onChange={(event) =>
                  updateAttendee({ keyStageFrom: event.target.value })
                }
                className={wizardInputClassName}
              >
                {KEY_STAGES.map((stage) => (
                  <option key={stage.value} value={stage.value}>
                    {stage.label}
                  </option>
                ))}
              </select>
            </WizardField>
            <WizardField label="To key stage" htmlFor="ks-to">
              <select
                id="ks-to"
                value={data.attendeeCriteria.keyStageTo}
                onChange={(event) =>
                  updateAttendee({ keyStageTo: event.target.value })
                }
                className={wizardInputClassName}
              >
                {KEY_STAGES.map((stage) => (
                  <option key={stage.value} value={stage.value}>
                    {stage.label}
                  </option>
                ))}
              </select>
            </WizardField>
          </div>
        ) : null}

        <div className="mt-4 rounded-xl border border-pink-200 bg-pink-50 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-pink-700">
            Preview
          </p>
          <p className="mt-1 text-sm font-medium text-pink-900">
            {formatAttendeePreview(data.attendeeCriteria)}
          </p>
        </div>
      </div>

      <WizardField
        label="Main session image"
        htmlFor="main-image"
        hint="Required. JPG, PNG, or WebP up to 10MB."
      >
        {shouldShowStorageSetupNotice() ? (
          <p className="mb-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-900">
            {getSupabaseStorageSetupMessage()} Images will be saved locally in
            your browser until Storage is ready.
          </p>
        ) : null}
        <MainImageUpload
          imageId={data.mainImage}
          onChange={(mainImage) => onChange({ mainImage })}
        />
      </WizardField>

      <div className="space-y-2">
        <p className={wizardLabelClassName}>Gallery (up to 5 extra images)</p>
        <SessionImageGallery
          imageIds={data.extraImages}
          onChange={(extraImages) => onChange({ extraImages })}
        />
      </div>

      <WizardField label="What children should bring" htmlFor="parents-bring">
        <textarea
          id="parents-bring"
          value={data.parentsBring}
          onChange={(event) => onChange({ parentsBring: event.target.value })}
          placeholder="e.g. Water bottle, trainers, shin pads"
          className={wizardTextareaClassName}
        />
      </WizardField>

      <WizardField label="What the club provides" htmlFor="club-provides">
        <textarea
          id="club-provides"
          value={data.clubProvides}
          onChange={(event) => onChange({ clubProvides: event.target.value })}
          placeholder="e.g. Equipment, bibs, qualified coaches"
          className={wizardTextareaClassName}
        />
      </WizardField>
    </StepSection>
  );
}
