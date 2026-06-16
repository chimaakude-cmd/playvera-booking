import { BookingStatus, statusLabels as bookingStatusLabels } from "@/lib/bookings";

export const statusLabels = bookingStatusLabels;

const styles: Record<BookingStatus, string> = {
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  confirmed: "bg-green-50 text-green-700 border-green-200",
  cancelled: "bg-zinc-100 text-zinc-600 border-zinc-200",
  refund_requested: "bg-purple-50 text-purple-700 border-purple-200",
  waitlist_pending_payment:
    "bg-blue-50 text-blue-700 border-blue-200",
};

type StatusBadgeProps = {
  status: BookingStatus;
};

export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium ${styles[status]}`}
    >
      {statusLabels[status]}
    </span>
  );
}
