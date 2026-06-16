import { adminListDataSource } from "@/lib/admin/data-source";
import { createSupabaseServerClient } from "@/lib/supabase";

export type AdminReviewRow = {
  id: string;
  providerId: string;
  providerName: string;
  activityId: string;
  activityTitle: string;
  rating: number;
  title: string;
  body: string;
  status: string;
  createdAt: string;
  reviewerEmail: string;
};

export type AdminReviewsListResult = {
  reviews: AdminReviewRow[];
  dataSource: "supabase" | "env_missing";
};

type ReviewRow = {
  id: string;
  provider_id: string;
  activity_id: string;
  rating: number;
  title: string;
  body: string;
  status: string;
  created_at: string;
  providers: { name: string } | { name: string }[] | null;
  sessions: { session_title: string } | { session_title: string }[] | null;
  bookings: { email: string } | { email: string }[] | null;
};

function firstRelation<T>(value: T | T[] | null | undefined): T | null {
  if (!value) {
    return null;
  }

  return Array.isArray(value) ? (value[0] ?? null) : value;
}

function mapReviewRow(row: ReviewRow): AdminReviewRow {
  const provider = firstRelation(row.providers);
  const session = firstRelation(row.sessions);
  const booking = firstRelation(row.bookings);

  return {
    id: row.id,
    providerId: row.provider_id,
    providerName: provider?.name?.trim() || "—",
    activityId: row.activity_id,
    activityTitle: session?.session_title?.trim() || "—",
    rating: row.rating,
    title: row.title.trim() || "—",
    body: row.body.trim(),
    status: row.status,
    createdAt: row.created_at,
    reviewerEmail: booking?.email?.trim() || "—",
  };
}

async function fetchReviewRows(): Promise<ReviewRow[] | null> {
  const supabase = createSupabaseServerClient();

  const { data, error } = await supabase
    .from("reviews")
    .select(
      `
        id,
        provider_id,
        activity_id,
        rating,
        title,
        body,
        status,
        created_at,
        providers ( name ),
        sessions ( session_title ),
        bookings ( email )
      `,
    )
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[Admin reviews] Failed to load reviews:", error.message);
    return null;
  }

  return (data ?? []) as unknown as ReviewRow[];
}

export async function fetchAdminReviewsList(): Promise<AdminReviewsListResult> {
  const dataSource = adminListDataSource();
  if (dataSource === "env_missing") {
    return { reviews: [], dataSource: "env_missing" };
  }

  const rows = await fetchReviewRows();

  return {
    reviews: (rows ?? []).map(mapReviewRow),
    dataSource: "supabase",
  };
}
