import type { AdminBooking, BookingPaymentStatus } from "@/lib/admin/types";
import { adminListDataSource } from "@/lib/admin/data-source";
import { getAdminSupabaseClient } from "@/lib/admin/supabase-client";

export type AdminBookingsListResult = {
  bookings: AdminBooking[];
  dataSource: "supabase" | "env_missing";
};

type BookingRow = {
  id: string;
  session_id: string;
  session_title: string;
  provider_name: string;
  parent_name: string;
  email: string;
  child_name: string;
  price_paid: number;
  status: AdminBooking["status"];
  created_at: string;
  sessions: { provider_id: string } | { provider_id: string }[] | null;
  session_dates:
    | { session_date: string }
    | { session_date: string }[]
    | null;
};

function firstRelation<T>(value: T | T[] | null | undefined): T | null {
  if (!value) {
    return null;
  }

  return Array.isArray(value) ? (value[0] ?? null) : value;
}

function formatBookingReference(bookingId: string, createdAt: string): string {
  const year = new Date(createdAt).getFullYear();
  const suffix = bookingId.replace(/-/g, "").slice(0, 4).toUpperCase();
  return `PV-${year}-${suffix}`;
}

function derivePaymentStatus(
  status: AdminBooking["status"],
): BookingPaymentStatus {
  if (status === "cancelled") {
    return "refunded";
  }

  if (status === "refund_requested") {
    return "paid";
  }

  if (status === "pending") {
    return "pending";
  }

  return "paid";
}

function mapBookingRow(row: BookingRow): AdminBooking {
  const session = firstRelation(row.sessions);
  const sessionDate = firstRelation(row.session_dates);

  return {
    id: row.id,
    reference: formatBookingReference(row.id, row.created_at),
    parentName: row.parent_name.trim() || "—",
    childName: row.child_name.trim() || "—",
    email: row.email.trim() || "—",
    activityId: row.session_id,
    activityTitle: row.session_title.trim() || "—",
    providerId: session?.provider_id ?? "",
    providerName: row.provider_name.trim() || "—",
    sessionDate: sessionDate?.session_date ?? "",
    status: row.status,
    paymentStatus: derivePaymentStatus(row.status),
    amount: Number(row.price_paid ?? 0),
    notes: "",
    createdAt: row.created_at,
  };
}

async function fetchBookingRows(): Promise<BookingRow[] | null> {
  const supabase = getAdminSupabaseClient();

  const { data, error } = await supabase
    .from("bookings")
    .select(
      `
        id,
        session_id,
        session_title,
        provider_name,
        parent_name,
        email,
        child_name,
        price_paid,
        status,
        created_at,
        sessions (
          provider_id
        ),
        session_dates (
          session_date
        )
      `,
    )
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[Admin bookings] Failed to load bookings:", error.message);
    return null;
  }

  return (data ?? []) as unknown as BookingRow[];
}

export async function fetchAdminBookingsList(): Promise<AdminBookingsListResult> {
  const dataSource = adminListDataSource();
  if (dataSource === "env_missing") {
    return { bookings: [], dataSource: "env_missing" };
  }

  const rows = await fetchBookingRows();

  return {
    bookings: (rows ?? []).map(mapBookingRow),
    dataSource: "supabase",
  };
}
