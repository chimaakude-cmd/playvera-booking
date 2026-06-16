"use client";

import {
  bookingStructureDescriptions,
  bookingStructureLabels,
} from "@/lib/attendee-criteria";
import { BookingStructureType } from "@/lib/sessions";
import { WizardFormData } from "@/lib/session-wizard";
import { StepSection } from "./shared";

type BookingStructureStepProps = {
  data: WizardFormData;
  onChange: (updates: Partial<WizardFormData>) => void;
};

const options: BookingStructureType[] = [
  "individual",
  "block",
  "subscription",
];

export function BookingStructureStep({
  data,
  onChange,
}: BookingStructureStepProps) {
  return (
    <StepSection
      title="What type of bookings are you creating?"
      description="Choose the booking model that matches how parents will book this activity."
    >
      <div className="grid gap-4 lg:grid-cols-3">
        {options.map((option) => {
          const selected = data.bookingStructure === option;
          const isSubscription = option === "subscription";

          return (
            <button
              key={option}
              type="button"
              onClick={() => onChange({ bookingStructure: option })}
              className={`rounded-2xl border p-5 text-left transition-colors ${
                selected
                  ? "border-pink-500 bg-pink-50 ring-1 ring-pink-500"
                  : "border-zinc-200 bg-white hover:border-zinc-300 hover:bg-zinc-50"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <p className="font-semibold text-zinc-900">
                  {bookingStructureLabels[option]}
                </p>
                {isSubscription ? (
                  <span className="rounded-full bg-zinc-900 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
                    Soon
                  </span>
                ) : null}
              </div>
              <p className="mt-2 text-sm leading-6 text-zinc-500">
                {bookingStructureDescriptions[option]}
              </p>
            </button>
          );
        })}
      </div>
    </StepSection>
  );
}
