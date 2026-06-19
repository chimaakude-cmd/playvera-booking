"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  cancelCustomerBooking,
  getClubCustomers,
  processCustomerRefund,
  type CustomerPaymentStatus,
} from "@/lib/club-customers";
import type { RegisterGridChild, RegisterSessionDate } from "@/lib/club-registers";
import {
  ATTENDANCE_LABELS,
  PAYMENT_STATUS_LABELS,
  PHOTO_CONSENT_LABELS,
} from "@/lib/club-registers";
import { useModalDismiss } from "@/lib/hooks/use-modal-dismiss";
import { formatMoney } from "@/lib/payments";

type ChildRegisterDrawerProps = {
  entry: RegisterGridChild | null;
  selectedDateId?: string;
  sessionDates?: RegisterSessionDate[];
  canManageBookings: boolean;
  canViewPayment: boolean;
  canViewMedical: boolean;
  onClose: () => void;
  onUpdated: (entry: RegisterGridChild) => void;
};

function StatusPill({
  label,
  tone,
}: {
  label: string;
  tone: "emerald" | "amber" | "rose" | "zinc" | "sky";
}) {
  const styles = {
    emerald: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    amber: "bg-amber-50 text-amber-800 ring-amber-200",
    rose: "bg-rose-50 text-rose-700 ring-rose-200",
    zinc: "bg-zinc-100 text-zinc-600 ring-zinc-200",
    sky: "bg-sky-50 text-sky-700 ring-sky-200",
  };

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${styles[tone]}`}
    >
      {label}
    </span>
  );
}

function paymentTone(
  status: CustomerPaymentStatus,
): "emerald" | "amber" | "rose" | "zinc" | "sky" {
  if (status === "paid") return "emerald";
  if (status === "pending") return "amber";
  if (status === "refunded" || status === "partial_refund") return "rose";
  if (status === "refund_requested") return "sky";
  return "zinc";
}

export function ChildRegisterDrawer({
  entry,
  selectedDateId,
  sessionDates,
  canManageBookings,
  canViewPayment,
  canViewMedical,
  onClose,
  onUpdated,
}: ChildRegisterDrawerProps) {
  const [refundType, setRefundType] = useState<"full" | "partial">("full");
  const [refundAmount, setRefundAmount] = useState("");
  const [refundReason, setRefundReason] = useState("");
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  useModalDismiss(Boolean(entry), onClose);

  useEffect(() => {
    if (entry) {
      setRefundType("full");
      setRefundAmount("");
      setRefundReason("");
      setActionMessage(null);
    }
  }, [entry]);

  if (!entry) {
    return null;
  }

  const customer = getClubCustomers().find(
    (c) => c.email.toLowerCase() === entry.parentEmail.toLowerCase(),
  );

  function handleCancelSession() {
    if (!canManageBookings) return;

    if (entry!.isDemo) {
      onUpdated({ ...entry!, paymentStatus: "refunded" });
      setActionMessage("Demo session cancelled.");
      return;
    }

    cancelCustomerBooking(entry!.bookingId);
    onUpdated({ ...entry!, paymentStatus: "refunded" });
    setActionMessage("Session booking cancelled.");
  }

  function handleRefund() {
    if (!canManageBookings || !refundReason.trim()) return;

    const amount =
      refundType === "full" ? entry!.pricePaid : Number(refundAmount);

    if (!Number.isFinite(amount) || amount <= 0) {
      setActionMessage("Enter a valid refund amount.");
      return;
    }

    if (entry!.isDemo) {
      onUpdated({
        ...entry!,
        paymentStatus: refundType === "full" ? "refunded" : "partial_refund",
      });
      setActionMessage(
        `${refundType === "full" ? "Full" : "Partial"} refund recorded (demo).`,
      );
      setRefundReason("");
      return;
    }

    processCustomerRefund({
      bookingId: entry!.bookingId,
      sessionTitle: entry!.sessionTitle,
      amount,
      type: refundType,
      reason: refundReason.trim(),
    });

    onUpdated({
      ...entry!,
      paymentStatus: refundType === "full" ? "refunded" : "partial_refund",
    });
    setActionMessage(
      `${refundType === "full" ? "Full" : "Partial"} refund recorded.`,
    );
    setRefundReason("");
  }

  const selectedDate = sessionDates?.find(
    (d) => d.registerSessionId === selectedDateId,
  );

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-zinc-900/40">
      <button
        type="button"
        aria-label="Close child register details"
        className="flex-1"
        onClick={onClose}
      />
      <aside className="flex h-full w-full max-w-xl flex-col overflow-hidden bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-3 border-b border-zinc-100 px-5 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-teal-700">
              Register details
            </p>
            <h2 className="mt-1 text-xl font-bold text-zinc-900">
              {entry.childName}
            </h2>
            <p className="mt-1 text-sm text-zinc-500">
              Age {entry.childAge} · {entry.sessionTitle}
              {selectedDate ? ` · ${selectedDate.dateLabel}` : ""}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-lg px-2 py-1 text-2xl text-zinc-400 hover:text-zinc-700"
          >
            ×
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5">
          {actionMessage ? (
            <p className="mb-4 rounded-xl bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700">
              {actionMessage}
            </p>
          ) : null}

          {entry.isDemo ? (
            <p className="mb-4 rounded-xl bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800">
              Example register — actions update locally until real bookings exist.
            </p>
          ) : null}

          <section className="space-y-3">
            <h3 className="text-sm font-semibold text-zinc-900">Parent / carer</h3>
            <dl className="grid gap-2 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-zinc-500">Name</dt>
                <dd className="font-medium text-zinc-900">{entry.parentName}</dd>
              </div>
              <div>
                <dt className="text-zinc-500">Phone</dt>
                <dd className="font-medium text-zinc-900">{entry.parentPhone}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-zinc-500">Email</dt>
                <dd className="font-medium text-zinc-900">{entry.parentEmail}</dd>
              </div>
            </dl>
          </section>

          <section className="mt-6 space-y-3">
            <h3 className="text-sm font-semibold text-zinc-900">
              Emergency contact
            </h3>
            <p className="text-sm text-zinc-900">
              {entry.emergencyContactName}
              <br />
              {entry.emergencyContactPhone}
            </p>
          </section>

          {canViewMedical ? (
            <section className="mt-6 space-y-3">
              <h3 className="text-sm font-semibold text-zinc-900">Medical</h3>
              <dl className="space-y-3 text-sm">
                <div>
                  <dt className="text-zinc-500">Conditions</dt>
                  <dd className="mt-1 text-zinc-900">
                    {entry.medicalConditions.trim() || "None reported"}
                  </dd>
                </div>
                <div>
                  <dt className="text-zinc-500">Allergies</dt>
                  <dd className="mt-1 text-zinc-900">
                    {entry.allergies.trim() || "None reported"}
                  </dd>
                </div>
                <div>
                  <dt className="text-zinc-500">Medication notes</dt>
                  <dd className="mt-1 text-zinc-900">
                    {entry.medicationNotes.trim() || "None reported"}
                  </dd>
                </div>
              </dl>
            </section>
          ) : null}

          <section className="mt-6 space-y-2">
            <h3 className="text-sm font-semibold text-zinc-900">Photo consent</h3>
            <StatusPill
              label={PHOTO_CONSENT_LABELS[entry.photoConsent]}
              tone={
                entry.photoConsent === "allowed"
                  ? "emerald"
                  : entry.photoConsent === "not_allowed"
                    ? "rose"
                    : "zinc"
              }
            />
          </section>

          {entry.hasBookingQuestions ? (
            <section className="mt-6 space-y-3">
              <h3 className="text-sm font-semibold text-zinc-900">
                Booking answers
              </h3>
              <ul className="space-y-2 text-sm">
                {entry.bookingQuestionAnswers.map((answer) => (
                  <li
                    key={answer.questionId}
                    className="rounded-xl border border-zinc-100 px-3 py-2"
                  >
                    <span className="font-medium text-zinc-700">
                      {answer.label}
                    </span>
                    <p className="mt-0.5 text-zinc-900">
                      {String(answer.value)}
                    </p>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <section className="mt-6 grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <h3 className="text-sm font-semibold text-zinc-900">Attendance</h3>
              <p className="mt-1">{ATTENDANCE_LABELS[entry.attendance]}</p>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-zinc-900">
                Booking reference
              </h3>
              <p className="mt-1 font-mono text-zinc-800">
                {entry.bookingReference}
              </p>
            </div>
          </section>

          {canViewPayment ? (
            <section className="mt-6 space-y-2">
              <h3 className="text-sm font-semibold text-zinc-900">Payment</h3>
              <div className="flex flex-wrap items-center gap-2">
                <StatusPill
                  label={PAYMENT_STATUS_LABELS[entry.paymentStatus]}
                  tone={paymentTone(entry.paymentStatus)}
                />
                <span className="text-sm font-semibold text-zinc-900">
                  {formatMoney(entry.pricePaid)}
                </span>
              </div>
            </section>
          ) : null}

          {canManageBookings ? (
            <section className="mt-8 space-y-6 border-t border-zinc-100 pt-6">
              <div>
                <h3 className="text-sm font-semibold text-zinc-900">Refund</h3>
                <div className="mt-3 space-y-3 rounded-2xl border border-zinc-200 p-4">
                  <div className="flex gap-2">
                    {(["full", "partial"] as const).map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setRefundType(type)}
                        className={`flex-1 rounded-xl px-3 py-2.5 text-sm font-semibold ${
                          refundType === type
                            ? "bg-zinc-900 text-white"
                            : "border border-zinc-200 text-zinc-700"
                        }`}
                      >
                        {type === "full" ? "Full refund" : "Partial refund"}
                      </button>
                    ))}
                  </div>
                  {refundType === "partial" ? (
                    <input
                      type="number"
                      min={0}
                      step={0.01}
                      value={refundAmount}
                      onChange={(e) => setRefundAmount(e.target.value)}
                      placeholder={`Amount (max ${formatMoney(entry.pricePaid)})`}
                      className="w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm"
                    />
                  ) : null}
                  <textarea
                    value={refundReason}
                    onChange={(e) => setRefundReason(e.target.value)}
                    rows={2}
                    placeholder="Refund reason (required)"
                    className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm"
                  />
                  <button
                    type="button"
                    onClick={handleRefund}
                    className="w-full rounded-xl bg-rose-600 py-3 text-sm font-semibold text-white hover:bg-rose-700"
                  >
                    Confirm refund
                  </button>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-zinc-900">
                  Cancel session
                </h3>
                <button
                  type="button"
                  onClick={handleCancelSession}
                  className="mt-3 w-full rounded-xl border border-rose-200 bg-rose-50 py-3 text-sm font-semibold text-rose-700 hover:bg-rose-100"
                >
                  Cancel this session
                </button>
              </div>
            </section>
          ) : null}

          <section className="mt-8 border-t border-zinc-100 pt-6">
            <Link
              href={
                customer
                  ? `/club/customers?email=${encodeURIComponent(entry.parentEmail)}`
                  : "/club/customers"
              }
              className="inline-flex w-full items-center justify-center rounded-xl border border-zinc-200 py-3 text-sm font-semibold text-zinc-700 hover:bg-zinc-50"
            >
              View customer profile
            </Link>
          </section>
        </div>
      </aside>
    </div>
  );
}
