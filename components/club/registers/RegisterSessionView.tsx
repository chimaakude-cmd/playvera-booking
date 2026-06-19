"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { getCurrentClubRole, roleHasPermission } from "@/lib/club-team";
import {
  ATTENDANCE_LABELS,
  buildRegisterGrid,
  countPresentForDate,
  getRegisterSessionOptions,
  PAYMENT_STATUS_LABELS,
  PHOTO_CONSENT_LABELS,
  saveRegisterDateAttendance,
  saveRegisterGridAttendance,
  type AttendanceStatus,
  type RegisterGridChild,
  type RegisterGridData,
  type RegisterSessionOption,
} from "@/lib/club-registers";
import { formatSessionDateLabel, formatSessionTimeLabel } from "@/lib/session-wizard";
import { ChildRegisterDrawer } from "./ChildRegisterDrawer";
import { RegisterGrid } from "./RegisterGrid";
import { RegisterHeader } from "./RegisterHeader";

function resolveRegisterSessionId(
  param: string,
  sessionOptions: RegisterSessionOption[],
): string | null {
  if (sessionOptions.some((option) => option.id === param)) {
    return param;
  }

  const forActivity = sessionOptions.filter((option) => option.sessionId === param);
  if (forActivity.length === 0) {
    return null;
  }

  const today = new Date().toISOString().slice(0, 10);
  const upcoming =
    forActivity.find((option) => option.date >= today) ?? forActivity[0];
  return upcoming.id;
}

type RegisterSessionViewProps = {
  sessionParam: string;
};

export function RegisterSessionView({ sessionParam }: RegisterSessionViewProps) {
  const router = useRouter();
  const role = getCurrentClubRole();
  const canMark = roleHasPermission(role, "mark_attendance");
  const canExport = roleHasPermission(role, "export_registers");
  const canViewMedical = roleHasPermission(role, "view_medical_notes");
  const canManageBookings = roleHasPermission(role, "manage_bookings");
  const canViewPayment = roleHasPermission(role, "view_parent_payment_status");

  const sessionOptions = useMemo(() => {
    const all = getRegisterSessionOptions();
    if (role === "coach") {
      return all.slice(0, Math.min(3, all.length));
    }
    return all;
  }, [role]);

  const resolvedSessionId = useMemo(
    () => resolveRegisterSessionId(sessionParam, sessionOptions),
    [sessionParam, sessionOptions],
  );

  const activitySessionOptions = useMemo(() => {
    if (!resolvedSessionId) {
      return [];
    }

    const selected = sessionOptions.find((option) => option.id === resolvedSessionId);
    if (!selected) {
      return [];
    }

    return sessionOptions.filter(
      (option) => option.sessionId === selected.sessionId,
    );
  }, [resolvedSessionId, sessionOptions]);

  const [selectedId, setSelectedId] = useState(resolvedSessionId ?? "");
  const [grid, setGrid] = useState<RegisterGridData | null>(null);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [drawerEntry, setDrawerEntry] = useState<RegisterGridChild | null>(
    null,
  );
  const [drawerDateId, setDrawerDateId] = useState<string>("");

  useEffect(() => {
    if (resolvedSessionId) {
      setSelectedId(resolvedSessionId);
    }
  }, [resolvedSessionId]);

  const selectedSession = sessionOptions.find((option) => option.id === selectedId);

  const venues = useMemo(() => {
    const set = new Set(activitySessionOptions.map((option) => option.venue));
    return Array.from(set);
  }, [activitySessionOptions]);

  const activities = useMemo(() => {
    const set = new Set(
      activitySessionOptions.map((option) => option.activityTitle),
    );
    return Array.from(set);
  }, [activitySessionOptions]);

  const [filterDate, setFilterDate] = useState("");
  const [filterActivity, setFilterActivity] = useState("all");
  const [filterVenue, setFilterVenue] = useState("all");

  const filteredOptions = useMemo(() => {
    return activitySessionOptions.filter((option) => {
      if (filterDate && option.date !== filterDate) return false;
      if (filterActivity !== "all" && option.activityTitle !== filterActivity) {
        return false;
      }
      if (filterVenue !== "all" && option.venue !== filterVenue) return false;
      return true;
    });
  }, [activitySessionOptions, filterDate, filterActivity, filterVenue]);

  const loadGrid = useCallback(() => {
    if (!selectedSession) {
      setGrid(null);
      return;
    }
    setGrid(buildRegisterGrid(selectedSession));
  }, [selectedSession]);

  useEffect(() => {
    if (!selectedId && filteredOptions[0]) {
      setSelectedId(filteredOptions[0].id);
    }
  }, [filteredOptions, selectedId]);

  useEffect(() => {
    loadGrid();
  }, [loadGrid]);

  const filteredChildren = useMemo(() => {
    if (!grid) return [];
    const query = searchQuery.trim().toLowerCase();
    if (!query) return grid.children;

    return grid.children.filter(
      (child) =>
        child.childName.toLowerCase().includes(query) ||
        child.parentName.toLowerCase().includes(query) ||
        child.parentPhone.toLowerCase().includes(query),
    );
  }, [grid, searchQuery]);

  const selectedDateId = selectedSession?.id ?? grid?.meta.selectedDateId ?? "";
  const attendanceCount = grid
    ? countPresentForDate(grid.children, selectedDateId)
    : { present: 0, total: 0 };

  function updateChildAttendance(
    bookingId: string,
    registerSessionId: string,
    attendance: AttendanceStatus,
  ) {
    if (!canMark) return;

    setGrid((current) => {
      if (!current) return current;

      const nextChildren = current.children.map((child) => {
        if (child.bookingId !== bookingId) return child;
        return {
          ...child,
          attendanceByDate: {
            ...child.attendanceByDate,
            [registerSessionId]: attendance,
          },
          attendance:
            registerSessionId === selectedDateId
              ? attendance
              : child.attendance,
        };
      });

      const updated = nextChildren.find((child) => child.bookingId === bookingId);
      if (updated) {
        saveRegisterDateAttendance(
          registerSessionId,
          bookingId,
          attendance,
          updated.notes,
        );
      }

      return { ...current, children: nextChildren };
    });

    setSavedMessage("Attendance saved.");
    window.setTimeout(() => setSavedMessage(null), 1500);
  }

  function handleMarkAllPresent() {
    if (!canMark || !grid) return;

    setGrid((current) => {
      if (!current) return current;

      const nextChildren = current.children.map((child) => {
        if (!child.activeByDate[selectedDateId]) return child;
        return {
          ...child,
          attendanceByDate: {
            ...child.attendanceByDate,
            [selectedDateId]: "present" as const,
          },
          attendance: "present" as const,
        };
      });

      const nextGrid = { ...current, children: nextChildren };
      saveRegisterGridAttendance(nextGrid);
      return nextGrid;
    });

    setSavedMessage("All marked present.");
    window.setTimeout(() => setSavedMessage(null), 2000);
  }

  function handleSave() {
    if (!canMark || !grid) return;
    saveRegisterGridAttendance(grid);
    setSavedMessage("Register saved.");
    window.setTimeout(() => setSavedMessage(null), 2500);
  }

  function handleExport() {
    if (!canExport || !grid || !selectedSession) return;

    const header = [
      "Child",
      "Age",
      "Ticket",
      "Parent",
      "Contact",
      "Medical",
      "Allergy",
      "Photo consent",
      ...(canViewPayment ? ["Payment"] : []),
      ...grid.meta.sessionDates.map((date) =>
        grid.meta.isBlockMode ? date.shortDateLabel : "Attendance",
      ),
      "Booking ref",
    ];

    const rows = filteredChildren.map((child) => {
      const attendanceCells = grid.meta.sessionDates.map((sessionDate) => {
        if (!child.activeByDate[sessionDate.registerSessionId]) return "—";
        return ATTENDANCE_LABELS[
          child.attendanceByDate[sessionDate.registerSessionId] ?? "not_marked"
        ];
      });

      return [
        child.childName,
        String(child.childAge),
        child.ticketType ?? "",
        child.parentName,
        child.parentPhone,
        child.hasMedicalFlag ? "Yes" : "No",
        child.allergies.trim() || "No",
        PHOTO_CONSENT_LABELS[child.photoConsent],
        ...(canViewPayment ? [PAYMENT_STATUS_LABELS[child.paymentStatus]] : []),
        ...attendanceCells,
        child.bookingReference,
      ];
    });

    const csv = [header, ...rows]
      .map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `register-${selectedSession.date}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  function handlePrint() {
    if (!canExport) return;
    window.print();
  }

  function handleOpenChild(child: RegisterGridChild) {
    setDrawerEntry(child);
    setDrawerDateId(selectedDateId);
  }

  function handleDrawerUpdated(updated: RegisterGridChild) {
    if (updated.paymentStatus === "refunded") {
      loadGrid();
      setDrawerEntry(null);
      return;
    }

    setGrid((current) => {
      if (!current) return current;
      return {
        ...current,
        children: current.children.map((child) =>
          child.bookingId === updated.bookingId ? { ...child, ...updated } : child,
        ),
      };
    });
    setDrawerEntry(updated);
  }

  if (!resolvedSessionId || !selectedSession) {
    return (
      <div className="space-y-4">
        <Link
          href="/club/registers"
          className="inline-flex min-h-11 items-center gap-1.5 rounded-xl border border-zinc-200 px-3 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-50"
        >
          <span aria-hidden>←</span>
          Back to registers
        </Link>
        <p className="rounded-2xl border border-zinc-200/80 bg-white p-8 text-center text-sm text-zinc-500 shadow-sm">
          Could not find a register for this activity. Choose an activity from the
          registers page.
        </p>
        <button
          type="button"
          onClick={() => router.push("/club/registers")}
          className="rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-700"
        >
          View all activities
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4 print:space-y-3">
      <div className="print:hidden rounded-2xl border border-zinc-200/80 bg-white p-4 shadow-sm sm:p-5">
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <Link
            href="/club/registers"
            className="inline-flex min-h-11 items-center gap-1.5 rounded-xl border border-zinc-200 px-3 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-50"
          >
            <span aria-hidden>←</span>
            Back to registers
          </Link>
        </div>

        <h2 className="text-sm font-semibold text-zinc-900">Select session</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="block text-xs font-medium text-zinc-500">
            Date
            <input
              type="date"
              value={filterDate}
              onChange={(event) => setFilterDate(event.target.value)}
              className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm"
            />
          </label>
          <label className="block text-xs font-medium text-zinc-500">
            Activity
            <select
              value={filterActivity}
              onChange={(event) => setFilterActivity(event.target.value)}
              className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm"
            >
              <option value="all">All activities</option>
              {activities.map((activity) => (
                <option key={activity} value={activity}>
                  {activity}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-xs font-medium text-zinc-500">
            Venue
            <select
              value={filterVenue}
              onChange={(event) => setFilterVenue(event.target.value)}
              className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm"
            >
              <option value="all">All venues</option>
              {venues.map((venue) => (
                <option key={venue} value={venue}>
                  {venue}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-xs font-medium text-zinc-500">
            Session time
            <select
              value={selectedId}
              onChange={(event) => setSelectedId(event.target.value)}
              className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm"
            >
              {filteredOptions.length === 0 ? (
                <option value="">No sessions match</option>
              ) : (
                filteredOptions.map((option: RegisterSessionOption) => (
                  <option key={option.id} value={option.id}>
                    {formatSessionDateLabel(option.date)} ·{" "}
                    {formatSessionTimeLabel(option.startTime, option.endTime)}
                    {option.isBlock ? " · Block" : ""}
                  </option>
                ))
              )}
            </select>
          </label>
        </div>
      </div>

      {grid && selectedSession ? (
        <>
          <RegisterHeader
            meta={grid.meta}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onExport={handleExport}
            canExport={canExport}
          />

          <div className="flex flex-col gap-3 rounded-2xl border border-zinc-200/80 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between print:hidden">
            <p className="text-sm font-semibold text-zinc-800">
              <span className="text-teal-700">
                {attendanceCount.present} / {attendanceCount.total}
              </span>{" "}
              checked in
              {grid.meta.isBlockMode ? (
                <span className="font-normal text-zinc-500">
                  {" "}
                  for{" "}
                  {grid.meta.sessionDates.find(
                    (date) => date.registerSessionId === selectedDateId,
                  )?.shortDateLabel ?? "selected date"}
                </span>
              ) : null}
            </p>

            <div className="flex flex-wrap gap-2">
              {canMark ? (
                <button
                  type="button"
                  onClick={handleMarkAllPresent}
                  className="min-h-11 rounded-xl bg-teal-600 px-4 py-3 text-sm font-semibold text-white hover:bg-teal-700"
                >
                  Mark all present
                </button>
              ) : null}
              {canMark ? (
                <button
                  type="button"
                  onClick={handleSave}
                  className="min-h-11 rounded-xl bg-zinc-900 px-4 py-3 text-sm font-semibold text-white hover:bg-zinc-800"
                >
                  Save register
                </button>
              ) : null}
              {canExport ? (
                <button
                  type="button"
                  onClick={handleExport}
                  className="min-h-11 rounded-xl border border-zinc-200 px-4 py-3 text-sm font-semibold text-zinc-700 hover:bg-zinc-50"
                >
                  Export CSV
                </button>
              ) : null}
              {canExport ? (
                <button
                  type="button"
                  onClick={handlePrint}
                  className="min-h-11 rounded-xl border border-zinc-200 px-4 py-3 text-sm font-semibold text-zinc-700 hover:bg-zinc-50"
                >
                  Print
                </button>
              ) : null}
            </div>
          </div>

          {savedMessage ? (
            <p className="rounded-xl border border-emerald-100 bg-emerald-50 px-5 py-2.5 text-sm font-medium text-emerald-700 print:hidden">
              {savedMessage}
            </p>
          ) : null}

          {grid.children.length === 0 ? (
            <p className="rounded-2xl border border-zinc-200/80 bg-white p-8 text-center text-sm text-zinc-500 shadow-sm">
              No confirmed bookings for this session yet.
            </p>
          ) : (
            <RegisterGrid
              meta={grid.meta}
              children={filteredChildren}
              selectedDateId={selectedDateId}
              canMark={canMark}
              onOpenChild={handleOpenChild}
              onAttendanceChange={updateChildAttendance}
            />
          )}
        </>
      ) : null}

      <ChildRegisterDrawer
        entry={drawerEntry}
        selectedDateId={drawerDateId}
        sessionDates={grid?.meta.sessionDates}
        canManageBookings={canManageBookings}
        canViewPayment={canViewPayment}
        canViewMedical={canViewMedical}
        onClose={() => setDrawerEntry(null)}
        onUpdated={handleDrawerUpdated}
      />

      {role === "coach" ? (
        <p className="text-xs text-zinc-500 print:hidden">
          Coach view: assigned sessions only. You can mark attendance and view
          medical notes but cannot export registers or manage bookings.
        </p>
      ) : null}
    </div>
  );
}
