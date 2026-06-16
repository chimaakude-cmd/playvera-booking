"use client";

import type {
  AttendanceStatus,
  RegisterGridChild,
  RegisterGridMeta,
} from "@/lib/club-registers";
import { isBirthdayInSessionWeek } from "@/lib/club-registers";

type AttendanceButtonProps = {
  label: string;
  active: boolean;
  tone: "present" | "absent";
  disabled?: boolean;
  onClick: () => void;
};

function AttendanceButton({
  label,
  active,
  tone,
  disabled,
  onClick,
}: AttendanceButtonProps) {
  const tones = {
    present: active
      ? "bg-emerald-600 text-white ring-emerald-600"
      : "bg-white text-emerald-700 ring-emerald-200 hover:bg-emerald-50",
    absent: active
      ? "bg-rose-600 text-white ring-rose-600"
      : "bg-white text-rose-700 ring-rose-200 hover:bg-rose-50",
  };

  const icons = { present: "✓", absent: "✕" };

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      aria-pressed={active}
      aria-label={label}
      className={`inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl text-lg font-bold ring-1 ring-inset transition disabled:opacity-50 ${tones[tone]}`}
    >
      <span aria-hidden>{icons[tone]}</span>
    </button>
  );
}

function AttendanceCell({
  value,
  disabled,
  onChange,
}: {
  value: AttendanceStatus;
  disabled?: boolean;
  onChange: (value: AttendanceStatus) => void;
}) {
  return (
    <div className="flex items-center justify-center gap-1.5">
      <AttendanceButton
        label="Present"
        tone="present"
        active={value === "present" || value === "late"}
        disabled={disabled}
        onClick={() => onChange("present")}
      />
      <AttendanceButton
        label="Absent"
        tone="absent"
        active={value === "absent"}
        disabled={disabled}
        onClick={() => onChange("absent")}
      />
    </div>
  );
}

function RowIconBadges({
  child,
  sessionDate,
}: {
  child: RegisterGridChild;
  sessionDate: string;
}) {
  const hasAllergy = Boolean(child.allergies.trim());
  const hasMedical = Boolean(
    child.medicalConditions.trim() || child.medicationNotes.trim(),
  );
  const birthday = isBirthdayInSessionWeek(child.dateOfBirth, sessionDate);

  return (
    <div className="flex flex-wrap items-center justify-center gap-1">
      {hasMedical ? (
        <span
          className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-amber-50 text-xs font-bold text-amber-900 ring-1 ring-amber-200"
          title="Medical condition"
        >
          ⚕
        </span>
      ) : null}
      {hasAllergy ? (
        <span
          className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-orange-50 text-xs font-bold text-orange-900 ring-1 ring-orange-200"
          title={`Allergy: ${child.allergies}`}
        >
          !
        </span>
      ) : null}
      <span
        className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-xs ring-1 ${
          child.photoConsent === "allowed"
            ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
            : child.photoConsent === "not_allowed"
              ? "bg-rose-50 text-rose-700 ring-rose-200"
              : "bg-zinc-100 text-zinc-500 ring-zinc-200"
        }`}
        title={
          child.photoConsent === "allowed"
            ? "Photo allowed"
            : child.photoConsent === "not_allowed"
              ? "No photos"
              : "Photo consent unknown"
        }
      >
        {child.photoConsent === "allowed"
          ? "📷"
          : child.photoConsent === "not_allowed"
            ? "🚫"
            : "?"}
      </span>
      {birthday ? (
        <span
          className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-violet-50 text-xs ring-1 ring-violet-200"
          title="Birthday this week"
        >
          🎂
        </span>
      ) : null}
    </div>
  );
}

function RegisterMobileCard({
  child,
  meta,
  canMark,
  onOpenDetails,
  onAttendanceChange,
}: {
  child: RegisterGridChild;
  meta: RegisterGridMeta;
  canMark: boolean;
  onOpenDetails: () => void;
  onAttendanceChange: (registerSessionId: string, status: AttendanceStatus) => void;
}) {
  const visibleDates = meta.sessionDates.filter(
    (d) => child.activeByDate[d.registerSessionId],
  );

  return (
    <article className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <button
            type="button"
            onClick={onOpenDetails}
            className="text-left text-base font-semibold text-zinc-900 hover:text-teal-700"
          >
            {child.childName}
          </button>
          <p className="text-sm text-zinc-500">
            Age {child.childAge}
            {child.ticketType ? ` · ${child.ticketType}` : ""}
          </p>
        </div>
        <RowIconBadges
          child={child}
          sessionDate={visibleDates[0]?.date ?? meta.sessionDates[0].date}
        />
      </div>

      <div className="mt-4 space-y-3">
        {visibleDates.map((sessionDate) => (
          <div key={sessionDate.registerSessionId}>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">
              {meta.isBlockMode
                ? sessionDate.shortDateLabel
                : "Attendance"}
            </p>
            <AttendanceCell
              value={
                child.attendanceByDate[sessionDate.registerSessionId] ??
                "not_marked"
              }
              disabled={!canMark}
              onChange={(status) =>
                onAttendanceChange(sessionDate.registerSessionId, status)
              }
            />
          </div>
        ))}
      </div>
    </article>
  );
}

type RegisterGridProps = {
  meta: RegisterGridMeta;
  children: RegisterGridChild[];
  selectedDateId: string;
  canMark: boolean;
  onOpenChild: (child: RegisterGridChild) => void;
  onAttendanceChange: (
    bookingId: string,
    registerSessionId: string,
    status: AttendanceStatus,
  ) => void;
};

export function RegisterGrid({
  meta,
  children,
  selectedDateId,
  canMark,
  onOpenChild,
  onAttendanceChange,
}: RegisterGridProps) {
  if (children.length === 0) {
    return (
      <p className="rounded-2xl border border-zinc-200/80 bg-white p-8 text-center text-sm text-zinc-500 shadow-sm">
        No active bookings match your search.
      </p>
    );
  }

  const referenceDate =
    meta.sessionDates.find((d) => d.registerSessionId === selectedDateId) ??
    meta.sessionDates[0];

  return (
    <>
      <div className="hidden overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-sm md:block">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-zinc-50/90 text-left text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
              <tr>
                <th className="sticky left-0 z-20 min-w-[160px] bg-zinc-50/95 px-4 py-3 backdrop-blur-sm">
                  Child
                </th>
                <th className="px-3 py-3 text-center">Age</th>
                <th className="px-3 py-3 text-center">Flags</th>
                <th className="min-w-[120px] px-3 py-3">Ticket</th>
                {meta.sessionDates.map((sessionDate) => (
                  <th
                    key={sessionDate.registerSessionId}
                    className={`min-w-[120px] px-3 py-3 text-center ${
                      sessionDate.registerSessionId === selectedDateId
                        ? "bg-teal-50/80 text-teal-800"
                        : ""
                    }`}
                  >
                    {meta.isBlockMode
                      ? sessionDate.shortDateLabel
                      : sessionDate.dateLabel}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {children.map((child) => (
                <tr
                  key={child.bookingId}
                  className="align-middle hover:bg-zinc-50/40"
                >
                  <td className="sticky left-0 z-10 bg-white px-4 py-3 shadow-[4px_0_8px_-4px_rgba(0,0,0,0.08)]">
                    <button
                      type="button"
                      onClick={() => onOpenChild(child)}
                      className="text-left font-semibold text-zinc-900 hover:text-teal-700"
                    >
                      {child.childName}
                    </button>
                  </td>
                  <td className="px-3 py-3 text-center text-zinc-700">
                    {child.childAge}
                  </td>
                  <td className="px-3 py-3">
                    <RowIconBadges
                      child={child}
                      sessionDate={referenceDate.date}
                    />
                  </td>
                  <td className="px-3 py-3 text-zinc-600">
                    {child.ticketType ?? "—"}
                  </td>
                  {meta.sessionDates.map((sessionDate) => {
                    const active =
                      child.activeByDate[sessionDate.registerSessionId];

                    return (
                      <td
                        key={sessionDate.registerSessionId}
                        className={`px-3 py-3 ${
                          sessionDate.registerSessionId === selectedDateId
                            ? "bg-teal-50/30"
                            : ""
                        }`}
                      >
                        {active ? (
                          <AttendanceCell
                            value={
                              child.attendanceByDate[
                                sessionDate.registerSessionId
                              ] ?? "not_marked"
                            }
                            disabled={!canMark}
                            onChange={(status) =>
                              onAttendanceChange(
                                child.bookingId,
                                sessionDate.registerSessionId,
                                status,
                              )
                            }
                          />
                        ) : (
                          <span className="flex justify-center text-zinc-300">
                            —
                          </span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="space-y-3 md:hidden">
        {children.map((child) => (
          <RegisterMobileCard
            key={child.bookingId}
            child={child}
            meta={meta}
            canMark={canMark}
            onOpenDetails={() => onOpenChild(child)}
            onAttendanceChange={(registerSessionId, status) =>
              onAttendanceChange(child.bookingId, registerSessionId, status)
            }
          />
        ))}
      </div>
    </>
  );
}
