"use client";

import { useEffect, useState } from "react";
import type { ClubCustomer, CustomerRefundRecord } from "@/lib/club-customers";
import {
  cancelCustomerBooking,
  processCustomerRefund,
  saveCustomerNotes,
} from "@/lib/club-customers";
import { PHOTO_CONSENT_LABELS } from "@/lib/club-registers";
import { formatMoney } from "@/lib/payments";

type CustomerDetailDrawerProps = {
  customer: ClubCustomer | null;
  canManage: boolean;
  onClose: () => void;
  onUpdated: () => void;
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

export function CustomerDetailDrawer({
  customer,
  canManage,
  onClose,
  onUpdated,
}: CustomerDetailDrawerProps) {
  const [notes, setNotes] = useState("");
  const [refundBookingId, setRefundBookingId] = useState("");
  const [refundType, setRefundType] = useState<"full" | "partial">("full");
  const [refundAmount, setRefundAmount] = useState("");
  const [refundReason, setRefundReason] = useState("");
  const [cancelBookingId, setCancelBookingId] = useState("");
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  useEffect(() => {
    if (customer) {
      setNotes(customer.notes);
      setRefundBookingId(customer.bookings[0]?.id ?? "");
      setCancelBookingId(customer.bookings[0]?.id ?? "");
      setActionMessage(null);
    }
  }, [customer]);

  if (!customer) {
    return null;
  }

  const selectedRefundBooking = customer.bookings.find(
    (b) => b.id === refundBookingId,
  );

  function handleSaveNotes() {
    saveCustomerNotes(customer!.id, notes);
    setActionMessage("Notes saved.");
    onUpdated();
  }

  function handleRefund() {
    if (!canManage || !selectedRefundBooking || !refundReason.trim()) return;

    const amount =
      refundType === "full"
        ? selectedRefundBooking.amount
        : Number(refundAmount);

    if (!Number.isFinite(amount) || amount <= 0) {
      setActionMessage("Enter a valid refund amount.");
      return;
    }

    processCustomerRefund({
      bookingId: selectedRefundBooking.id,
      sessionTitle: selectedRefundBooking.sessionTitle,
      amount,
      type: refundType,
      reason: refundReason.trim(),
    });

    setActionMessage(
      `${refundType === "full" ? "Full" : "Partial"} refund recorded.`,
    );
    setRefundReason("");
    onUpdated();
  }

  function handleCancelSession() {
    if (!canManage || !cancelBookingId) return;
    cancelCustomerBooking(cancelBookingId);
    setActionMessage("Session booking cancelled.");
    onUpdated();
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-zinc-900/40">
      <button
        type="button"
        aria-label="Close customer profile"
        className="flex-1"
        onClick={onClose}
      />
      <aside className="flex h-full w-full max-w-xl flex-col overflow-hidden bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-3 border-b border-zinc-100 px-5 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-teal-700">
              Customer profile
            </p>
            <h2 className="mt-1 text-xl font-bold text-zinc-900">
              {customer.parentName}
            </h2>
            <p className="mt-1 text-sm text-zinc-500">{customer.email}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
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

          <section className="space-y-3">
            <h3 className="text-sm font-semibold text-zinc-900">Contact</h3>
            <dl className="grid gap-2 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-zinc-500">Phone</dt>
                <dd className="font-medium text-zinc-900">{customer.phone}</dd>
              </div>
              <div>
                <dt className="text-zinc-500">Emergency contact</dt>
                <dd className="font-medium text-zinc-900">
                  {customer.emergencyContactName}
                  <br />
                  {customer.emergencyContact}
                </dd>
              </div>
            </dl>
          </section>

          <section className="mt-6 space-y-3">
            <h3 className="text-sm font-semibold text-zinc-900">
              Linked children
            </h3>
            <div className="space-y-3">
              {customer.children.map((child) => (
                <div
                  key={child.id}
                  className="rounded-xl border border-zinc-200 bg-zinc-50/60 p-3 text-sm"
                >
                  <p className="font-semibold text-zinc-900">
                    {child.name} · age {child.age}
                  </p>
                  {child.medicalConditions || child.allergies ? (
                    <p className="mt-1 text-rose-700">
                      {child.medicalConditions
                        ? `Medical: ${child.medicalConditions}`
                        : null}
                      {child.medicalConditions && child.allergies ? " · " : null}
                      {child.allergies ? `Allergies: ${child.allergies}` : null}
                    </p>
                  ) : null}
                  <p className="mt-1 text-zinc-600">
                    {PHOTO_CONSENT_LABELS[child.photoConsent]}
                  </p>
                </div>
              ))}
            </div>
          </section>

          <section className="mt-6">
            <h3 className="text-sm font-semibold text-zinc-900">
              Booking history
            </h3>
            <ul className="mt-3 space-y-2">
              {customer.bookings.map((booking) => (
                <li
                  key={booking.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-zinc-200 px-3 py-2.5 text-sm"
                >
                  <div>
                    <p className="font-medium text-zinc-900">
                      {booking.sessionTitle}
                    </p>
                    <p className="text-xs text-zinc-500">
                      {booking.dateLabel} · {booking.venue}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{formatMoney(booking.amount)}</p>
                    <StatusPill label={booking.status} tone="zinc" />
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <section className="mt-6">
            <h3 className="text-sm font-semibold text-zinc-900">
              Attendance history
            </h3>
            <ul className="mt-3 space-y-2 text-sm">
              {customer.attendance.map((record) => (
                <li
                  key={record.id}
                  className="flex justify-between rounded-xl border border-zinc-100 px-3 py-2"
                >
                  <span>{record.sessionTitle}</span>
                  <StatusPill label={record.status} tone="sky" />
                </li>
              ))}
            </ul>
          </section>

          <section className="mt-6">
            <h3 className="text-sm font-semibold text-zinc-900">
              Refund history
            </h3>
            {customer.refunds.length === 0 ? (
              <p className="mt-2 text-sm text-zinc-500">No refunds yet.</p>
            ) : (
              <ul className="mt-3 space-y-2">
                {customer.refunds.map((refund: CustomerRefundRecord) => (
                  <li
                    key={refund.id}
                    className="rounded-xl border border-zinc-200 px-3 py-2.5 text-sm"
                  >
                    <div className="flex justify-between gap-2">
                      <span className="font-medium">{refund.sessionTitle}</span>
                      <span>{formatMoney(refund.amount)}</span>
                    </div>
                    <p className="mt-1 text-xs text-zinc-500">{refund.reason}</p>
                    <StatusPill
                      label={`${refund.type} · ${refund.status}`}
                      tone={refund.status === "completed" ? "emerald" : "amber"}
                    />
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="mt-6">
            <h3 className="text-sm font-semibold text-zinc-900">Notes</h3>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Internal notes about this family…"
              className="mt-2 w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm"
            />
            <button
              type="button"
              onClick={handleSaveNotes}
              className="mt-2 rounded-xl border border-zinc-200 px-4 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-50"
            >
              Save notes
            </button>
          </section>

          {canManage ? (
            <section className="mt-8 space-y-6 border-t border-zinc-100 pt-6">
              <div>
                <h3 className="text-sm font-semibold text-zinc-900">Refund</h3>
                <div className="mt-3 space-y-3 rounded-2xl border border-zinc-200 p-4">
                  <label className="block text-xs font-medium text-zinc-500">
                    Booking
                    <select
                      value={refundBookingId}
                      onChange={(e) => setRefundBookingId(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm"
                    >
                      {customer.bookings.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.sessionTitle} · {formatMoney(b.amount)}
                        </option>
                      ))}
                    </select>
                  </label>
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
                      placeholder="Refund amount (£)"
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
                <div className="mt-3 space-y-3 rounded-2xl border border-zinc-200 p-4">
                  <label className="block text-xs font-medium text-zinc-500">
                    Select booking to cancel
                    <select
                      value={cancelBookingId}
                      onChange={(e) => setCancelBookingId(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm"
                    >
                      {customer.bookings
                        .filter((b) => b.status !== "cancelled")
                        .map((b) => (
                          <option key={b.id} value={b.id}>
                            {b.sessionTitle} · {b.dateLabel}
                          </option>
                        ))}
                    </select>
                  </label>
                  <button
                    type="button"
                    onClick={handleCancelSession}
                    className="w-full rounded-xl border border-rose-200 bg-rose-50 py-3 text-sm font-semibold text-rose-700 hover:bg-rose-100"
                  >
                    Cancel session booking
                  </button>
                </div>
              </div>
            </section>
          ) : null}
        </div>
      </aside>
    </div>
  );
}
