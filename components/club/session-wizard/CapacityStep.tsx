"use client";

import { CapacityApplyScope } from "@/lib/sessions";
import {
  applyCapacityWithScope,
  formatSessionDateLabel,
  formatSessionTimeLabel,
  getActiveWizardDates,
  WizardFormData,
} from "@/lib/session-wizard";
import {
  QuantityControl,
  StepSection,
  StepperButton,
  WizardField,
  wizardLabelClassName,
} from "./shared";

type CapacityStepProps = {
  data: WizardFormData;
  onChange: (updates: Partial<WizardFormData>) => void;
};

const scopeOptions: Array<{ value: CapacityApplyScope; label: string }> = [
  { value: "this_session", label: "This session" },
  { value: "future_sessions", label: "Future sessions" },
  { value: "entire_block", label: "Entire block" },
];

export function CapacityStep({ data, onChange }: CapacityStepProps) {
  const activeDates = getActiveWizardDates(data);
  const selectedDateId =
    data.selectedCapacityDateId ?? activeDates[0]?.id ?? null;

  function updateDates(dates: WizardFormData["schedule"]["dates"]) {
    onChange({ schedule: { ...data.schedule, dates } });
  }

  function updateDefaultCapacity(capacity: number) {
    onChange({ defaultCapacity: capacity });
  }

  function applyDefaultToAllDates() {
    updateDates(
      applyCapacityWithScope(activeDates, null, data.defaultCapacity, "entire_block"),
    );
  }

  function updateSelectedCapacity(capacity: number) {
    if (!selectedDateId) {
      return;
    }

    updateDates(
      applyCapacityWithScope(
        data.schedule.dates,
        selectedDateId,
        capacity,
        data.capacityApplyScope,
      ),
    );
  }

  return (
    <StepSection
      title="Capacity"
      description="Set default places and adjust capacity for individual sessions or groups of dates."
    >
      <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <WizardField
            label="Default capacity for all sessions"
            htmlFor="default-capacity"
          >
            <QuantityControl
              label="default capacity"
              value={data.defaultCapacity}
              onChange={updateDefaultCapacity}
            />
          </WizardField>
          <StepperButton onClick={applyDefaultToAllDates}>
            Update all sessions
          </StepperButton>
        </div>
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white p-4 sm:p-5">
        <p className={wizardLabelClassName}>Apply capacity changes to</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {scopeOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange({ capacityApplyScope: option.value })}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                data.capacityApplyScope === option.value
                  ? "bg-pink-600 text-white"
                  : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white">
        <div className="border-b border-zinc-200 px-4 py-3 sm:px-5">
          <h3 className="text-sm font-semibold text-zinc-900">
            Capacity per session date
          </h3>
        </div>

        {activeDates.length === 0 ? (
          <div className="px-4 py-10 text-center text-sm text-zinc-500">
            Add dates in the schedule step to configure capacity.
          </div>
        ) : (
          <ul className="divide-y divide-zinc-100">
            {activeDates.map((date) => {
              const selected = selectedDateId === date.id;

              return (
                <li
                  key={date.id}
                  className={`flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5 ${
                    selected ? "bg-pink-50/40" : ""
                  }`}
                >
                  <button
                    type="button"
                    onClick={() =>
                      onChange({ selectedCapacityDateId: date.id })
                    }
                    className="text-left"
                  >
                    <p className="font-medium text-zinc-900">
                      {formatSessionDateLabel(date.date)}
                    </p>
                    <p className="mt-1 text-sm text-zinc-500">
                      {formatSessionTimeLabel(date.startTime, date.endTime)}
                    </p>
                  </button>

                  <QuantityControl
                    label={`capacity for ${date.date}`}
                    value={date.capacity}
                    onChange={(capacity) => {
                      onChange({ selectedCapacityDateId: date.id });
                      updateDates(
                        applyCapacityWithScope(
                          data.schedule.dates,
                          date.id,
                          capacity,
                          data.capacityApplyScope,
                        ),
                      );
                    }}
                  />
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </StepSection>
  );
}
