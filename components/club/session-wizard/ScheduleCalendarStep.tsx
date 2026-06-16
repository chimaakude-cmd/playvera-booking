"use client";

import { useMemo, useState } from "react";
import { SessionDateSlot, ScheduleMode } from "@/lib/sessions";
import {
  addSingleDateToSchedule,
  formatDateKey,
  formatSessionDateLabel,
  formatSessionTimeLabel,
  generateBlockSchedule,
  generateRepeatSchedule,
  getCalendarCells,
  isScheduleDateBlocked,
  WizardFormData,
} from "@/lib/session-wizard";
import {
  StepSection,
  StepperButton,
  WizardField,
  wizardInputClassName,
  wizardLabelClassName,
} from "./shared";

type ScheduleCalendarStepProps = {
  data: WizardFormData;
  onChange: (updates: Partial<WizardFormData>) => void;
};

type PlannerMode = "add" | "off_days" | "exceptions";

const modeOptions: Array<{ value: ScheduleMode; label: string }> = [
  { value: "single_dates", label: "Single dates" },
  { value: "repeat", label: "Repeat schedule" },
  { value: "block", label: "Block schedule" },
];

const dayOptions = [
  { value: "monday", label: "Monday" },
  { value: "tuesday", label: "Tuesday" },
  { value: "wednesday", label: "Wednesday" },
  { value: "thursday", label: "Thursday" },
  { value: "friday", label: "Friday" },
  { value: "saturday", label: "Saturday" },
  { value: "sunday", label: "Sunday" },
];

function toggleDateInList(dates: string[], date: string): string[] {
  return dates.includes(date)
    ? dates.filter((item) => item !== date)
    : [...dates, date].sort();
}

export function ScheduleCalendarStep({
  data,
  onChange,
}: ScheduleCalendarStepProps) {
  const [anchorDate, setAnchorDate] = useState(formatDateKey(new Date()));
  const [plannerMode, setPlannerMode] = useState<PlannerMode>("add");
  const [editingSlot, setEditingSlot] = useState<SessionDateSlot | null>(null);

  const schedule = data.schedule;
  const activeDates = data.schedule.dates.filter((date) => !date.cancelled);

  const datesByDay = useMemo(() => {
    const map = new Map<string, SessionDateSlot[]>();
    activeDates.forEach((date) => {
      const existing = map.get(date.date) ?? [];
      map.set(date.date, [...existing, date]);
    });
    return map;
  }, [activeDates]);

  const calendarCells = useMemo(
    () => getCalendarCells(anchorDate, schedule.calendarView),
    [anchorDate, schedule.calendarView],
  );

  function updateSchedule(updates: Partial<WizardFormData["schedule"]>) {
    onChange({ schedule: { ...schedule, ...updates } });
  }

  function shiftAnchor(direction: -1 | 1) {
    const current = new Date(`${anchorDate}T12:00:00`);
    if (schedule.calendarView === "week") {
      current.setDate(current.getDate() + direction * 7);
    } else {
      current.setMonth(current.getMonth() + direction);
    }
    setAnchorDate(formatDateKey(current));
  }

  function handleGenerateSchedule() {
    const generated =
      schedule.mode === "repeat"
        ? generateRepeatSchedule(schedule, data.defaultCapacity)
        : generateBlockSchedule(schedule, data.defaultCapacity);

    updateSchedule({
      dates: generated.sort((a, b) => a.date.localeCompare(b.date)),
    });
  }

  function handleCalendarDateClick(date: string) {
    if (plannerMode === "off_days") {
      updateSchedule({
        offDays: toggleDateInList(schedule.offDays, date),
      });
      return;
    }

    if (plannerMode === "exceptions") {
      updateSchedule({
        exceptionDates: toggleDateInList(schedule.exceptionDates, date),
      });
      return;
    }

    if (schedule.mode !== "single_dates") {
      const existing = datesByDay.get(date)?.[0];
      if (existing) {
        setEditingSlot(existing);
      }
      return;
    }

    onChange({
      schedule: addSingleDateToSchedule(schedule, date, data.defaultCapacity),
    });
  }

  function saveEditedSlot(updated: SessionDateSlot) {
    updateSchedule({
      dates: schedule.dates.map((date) =>
        date.id === updated.id ? updated : date,
      ),
    });
    setEditingSlot(null);
  }

  function deleteSlot(slotId: string) {
    updateSchedule({
      dates: schedule.dates.filter((date) => date.id !== slotId),
    });
    setEditingSlot(null);
  }

  const monthLabel = new Date(`${anchorDate}T12:00:00`).toLocaleDateString(
    "en-GB",
    schedule.calendarView === "month"
      ? { month: "long", year: "numeric" }
      : { day: "numeric", month: "short", year: "numeric" },
  );

  return (
    <StepSection
      title="Schedule planner"
      description="Build your session calendar, mark holidays, and fine-tune individual dates."
    >
      <div className="grid gap-3 sm:grid-cols-3">
        {modeOptions.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => updateSchedule({ mode: option.value })}
            className={`rounded-xl border px-4 py-3 text-sm font-medium transition-colors ${
              schedule.mode === option.value
                ? "border-pink-500 bg-pink-50 text-pink-700"
                : "border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 sm:p-5">
        {schedule.mode === "single_dates" ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <WizardField label="Default start time" htmlFor="default-start">
              <input
                id="default-start"
                type="time"
                value={schedule.defaultStartTime}
                onChange={(event) =>
                  updateSchedule({ defaultStartTime: event.target.value })
                }
                className={wizardInputClassName}
              />
            </WizardField>
            <WizardField label="Default end time" htmlFor="default-end">
              <input
                id="default-end"
                type="time"
                value={schedule.defaultEndTime}
                onChange={(event) =>
                  updateSchedule({ defaultEndTime: event.target.value })
                }
                className={wizardInputClassName}
              />
            </WizardField>
          </div>
        ) : null}

        {schedule.mode === "repeat" ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <WizardField label="Repeat" htmlFor="repeat-frequency">
              <select
                id="repeat-frequency"
                value={schedule.repeatFrequency}
                onChange={(event) =>
                  updateSchedule({
                    repeatFrequency: event.target.value as typeof schedule.repeatFrequency,
                  })
                }
                className={wizardInputClassName}
              >
                <option value="weekly">Weekly</option>
                <option value="fortnightly">Fortnightly</option>
                <option value="monthly">Monthly</option>
              </select>
            </WizardField>
            <WizardField label="Start date" htmlFor="repeat-start">
              <input
                id="repeat-start"
                type="date"
                value={schedule.repeatStartDate}
                onChange={(event) =>
                  updateSchedule({ repeatStartDate: event.target.value })
                }
                className={wizardInputClassName}
              />
            </WizardField>
            <WizardField label="End date" htmlFor="repeat-end">
              <input
                id="repeat-end"
                type="date"
                value={schedule.repeatEndDate}
                onChange={(event) =>
                  updateSchedule({ repeatEndDate: event.target.value })
                }
                className={wizardInputClassName}
              />
            </WizardField>
            {schedule.repeatFrequency !== "monthly" ? (
              <WizardField label="Day of week" htmlFor="repeat-day">
                <select
                  id="repeat-day"
                  value={schedule.repeatDayOfWeek}
                  onChange={(event) =>
                    updateSchedule({ repeatDayOfWeek: event.target.value })
                  }
                  className={wizardInputClassName}
                >
                  {dayOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </WizardField>
            ) : null}
            <WizardField label="Start time" htmlFor="repeat-start-time">
              <input
                id="repeat-start-time"
                type="time"
                value={schedule.defaultStartTime}
                onChange={(event) =>
                  updateSchedule({ defaultStartTime: event.target.value })
                }
                className={wizardInputClassName}
              />
            </WizardField>
            <WizardField label="End time" htmlFor="repeat-end-time">
              <input
                id="repeat-end-time"
                type="time"
                value={schedule.defaultEndTime}
                onChange={(event) =>
                  updateSchedule({ defaultEndTime: event.target.value })
                }
                className={wizardInputClassName}
              />
            </WizardField>
          </div>
        ) : null}

        {schedule.mode === "block" ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <WizardField label="Block start date" htmlFor="block-start">
              <input
                id="block-start"
                type="date"
                value={schedule.blockStartDate}
                onChange={(event) =>
                  updateSchedule({ blockStartDate: event.target.value })
                }
                className={wizardInputClassName}
              />
            </WizardField>
            <WizardField label="Block end date" htmlFor="block-end">
              <input
                id="block-end"
                type="date"
                value={schedule.blockEndDate}
                onChange={(event) =>
                  updateSchedule({ blockEndDate: event.target.value })
                }
                className={wizardInputClassName}
              />
            </WizardField>
            <WizardField label="Day of week" htmlFor="block-day">
              <select
                id="block-day"
                value={schedule.blockDayOfWeek}
                onChange={(event) =>
                  updateSchedule({ blockDayOfWeek: event.target.value })
                }
                className={wizardInputClassName}
              >
                {dayOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </WizardField>
            <WizardField label="Start time" htmlFor="block-start-time">
              <input
                id="block-start-time"
                type="time"
                value={schedule.defaultStartTime}
                onChange={(event) =>
                  updateSchedule({ defaultStartTime: event.target.value })
                }
                className={wizardInputClassName}
              />
            </WizardField>
            <WizardField label="End time" htmlFor="block-end-time">
              <input
                id="block-end-time"
                type="time"
                value={schedule.defaultEndTime}
                onChange={(event) =>
                  updateSchedule({ defaultEndTime: event.target.value })
                }
                className={wizardInputClassName}
              />
            </WizardField>
          </div>
        ) : null}

        {schedule.mode !== "single_dates" ? (
          <div className="mt-4">
            <StepperButton onClick={handleGenerateSchedule}>
              Generate on calendar
            </StepperButton>
          </div>
        ) : null}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {(["add", "off_days", "exceptions"] as PlannerMode[]).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => setPlannerMode(mode)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                plannerMode === mode
                  ? "bg-zinc-900 text-white"
                  : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
              }`}
            >
              {mode === "add"
                ? schedule.mode === "single_dates"
                  ? "Click to add dates"
                  : "Click to edit sessions"
                : mode === "off_days"
                  ? "Mark off days"
                  : "Exception dates"}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() =>
              updateSchedule({
                calendarView: schedule.calendarView === "month" ? "week" : "month",
              })
            }
            className="rounded-lg border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
          >
            {schedule.calendarView === "month" ? "Week view" : "Month view"}
          </button>
          <button
            type="button"
            onClick={() => shiftAnchor(-1)}
            className="rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-50"
          >
            Prev
          </button>
          <span className="min-w-32 text-center text-sm font-semibold text-zinc-900">
            {monthLabel}
          </span>
          <button
            type="button"
            onClick={() => shiftAnchor(1)}
            className="rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-50"
          >
            Next
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white">
        <div className="grid grid-cols-7 border-b border-zinc-200 bg-zinc-50 text-center text-xs font-semibold uppercase tracking-wide text-zinc-500">
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
            <div key={day} className="px-2 py-3">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7">
          {calendarCells.map(({ date, inRange }) => {
            const sessions = datesByDay.get(date) ?? [];
            const isOffDay = schedule.offDays.includes(date);
            const isException = schedule.exceptionDates.includes(date);
            const blocked = isScheduleDateBlocked(
              date,
              schedule.offDays,
              schedule.exceptionDates,
            );

            return (
              <button
                key={date}
                type="button"
                onClick={() => handleCalendarDateClick(date)}
                className={`min-h-[92px] border-b border-r border-zinc-100 p-2 text-left transition-colors hover:bg-zinc-50 sm:min-h-[110px] ${
                  inRange ? "bg-white" : "bg-zinc-50/70"
                } ${isOffDay ? "bg-red-50/80" : ""} ${isException ? "bg-amber-50/80" : ""}`}
              >
                <div className="flex items-start justify-between gap-1">
                  <span
                    className={`text-xs font-semibold ${
                      inRange ? "text-zinc-900" : "text-zinc-400"
                    }`}
                  >
                    {date.slice(-2)}
                  </span>
                  {blocked ? (
                    <span className="rounded bg-zinc-200 px-1 text-[10px] text-zinc-600">
                      {isOffDay ? "Off" : "Skip"}
                    </span>
                  ) : null}
                </div>

                <div className="mt-2 space-y-1">
                  {sessions.map((session) => (
                    <span
                      key={session.id}
                      className="block truncate rounded-md bg-pink-100 px-1.5 py-0.5 text-[10px] font-medium text-pink-800"
                    >
                      {session.startTime}
                    </span>
                  ))}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-zinc-200 bg-white p-4">
          <p className={wizardLabelClassName}>Off days calendar</p>
          <p className="mt-1 text-xs text-zinc-500">
            Mark holidays and club closures. Generated schedules skip these dates.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {schedule.offDays.length === 0 ? (
              <span className="text-sm text-zinc-400">No off days marked</span>
            ) : (
              schedule.offDays.map((date) => (
                <button
                  key={date}
                  type="button"
                  onClick={() =>
                    updateSchedule({
                      offDays: schedule.offDays.filter((item) => item !== date),
                    })
                  }
                  className="rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-700"
                >
                  {formatSessionDateLabel(date)} ×
                </button>
              ))
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-4">
          <p className={wizardLabelClassName}>Exception dates</p>
          <p className="mt-1 text-xs text-zinc-500">
            Exclude specific dates from repeat or block generation.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {schedule.exceptionDates.length === 0 ? (
              <span className="text-sm text-zinc-400">No exceptions added</span>
            ) : (
              schedule.exceptionDates.map((date) => (
                <button
                  key={date}
                  type="button"
                  onClick={() =>
                    updateSchedule({
                      exceptionDates: schedule.exceptionDates.filter(
                        (item) => item !== date,
                      ),
                    })
                  }
                  className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-800"
                >
                  {formatSessionDateLabel(date)} ×
                </button>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white">
        <div className="border-b border-zinc-200 px-4 py-3 sm:px-5">
          <h3 className="text-sm font-semibold text-zinc-900">
            Scheduled sessions ({activeDates.length})
          </h3>
        </div>
        {activeDates.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-zinc-500">
            Your generated sessions will appear here and on the calendar.
          </div>
        ) : (
          <ul className="divide-y divide-zinc-100">
            {activeDates.map((date) => (
              <li
                key={date.id}
                className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5"
              >
                <div>
                  <p className="font-medium text-zinc-900">
                    {formatSessionDateLabel(date.date)}
                  </p>
                  <p className="mt-1 text-sm text-zinc-500">
                    {formatSessionTimeLabel(date.startTime, date.endTime)}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingSlot(date)}
                    className="rounded-lg border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteSlot(date.id)}
                    className="rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {editingSlot ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl">
            <h3 className="text-lg font-semibold text-zinc-900">
              Edit session occurrence
            </h3>
            <p className="mt-1 text-sm text-zinc-500">
              {formatSessionDateLabel(editingSlot.date)}
            </p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <WizardField label="Start time" htmlFor="edit-start">
                <input
                  id="edit-start"
                  type="time"
                  value={editingSlot.startTime}
                  onChange={(event) =>
                    setEditingSlot({ ...editingSlot, startTime: event.target.value })
                  }
                  className={wizardInputClassName}
                />
              </WizardField>
              <WizardField label="End time" htmlFor="edit-end">
                <input
                  id="edit-end"
                  type="time"
                  value={editingSlot.endTime}
                  onChange={(event) =>
                    setEditingSlot({ ...editingSlot, endTime: event.target.value })
                  }
                  className={wizardInputClassName}
                />
              </WizardField>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <StepperButton onClick={() => setEditingSlot(null)}>
                Cancel
              </StepperButton>
              <StepperButton
                variant="primary"
                onClick={() => saveEditedSlot(editingSlot)}
              >
                Save changes
              </StepperButton>
            </div>
          </div>
        </div>
      ) : null}
    </StepSection>
  );
}
