import { NextRequest, NextResponse } from "next/server";
import { hasTestAdminSession } from "@/lib/auth/test-admin-session";
import { isAdminRepairEnabled } from "@/lib/admin-users/production-gates";
import { loadSessionWithMeta } from "@/lib/data/providers/resilient-sessions";
import { getPublicSessionById } from "@/lib/sessions/public-server";
import {
  isPublicSessionRow,
  isPublishedPublicSessionRow,
  isRemovedPublicSessionRow,
  type PublicSessionRow,
} from "@/lib/sessions/public-schema";
import {
  createSupabaseServerClient,
  createSupabaseServiceRoleClient,
  isSupabaseConfigured,
  isSupabaseServiceRoleConfigured,
} from "@/lib/supabase";

type RouteContext = {
  params: Promise<{ id: string }>;
};

function summarizeSessionRow(row: PublicSessionRow | null) {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    published: row.published,
    status: row.status ?? null,
    removed_at: row.removed_at ?? null,
    deleted_at: row.deleted_at ?? null,
    archived: row.archived ?? null,
    provider_id: (row as { provider_id?: string }).provider_id ?? null,
    isPublishedPublicSessionRow: isPublishedPublicSessionRow(row),
    isRemovedPublicSessionRow: isRemovedPublicSessionRow(row),
    isPublicSessionRow: isPublicSessionRow(row),
  };
}

async function isDebugEndpointAllowed(): Promise<boolean> {
  if (process.env.NODE_ENV !== "production") {
    return true;
  }

  if (isAdminRepairEnabled()) {
    return true;
  }

  return await hasTestAdminSession();
}

export async function GET(request: NextRequest, context: RouteContext) {
  if (!(await isDebugEndpointAllowed())) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  const { id } = await context.params;
  const sessionId = id.trim();

  if (!sessionId) {
    return NextResponse.json({ error: "Session id is required." }, { status: 400 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({
      sessionId,
      supabaseConfigured: false,
      error: "Supabase is not configured.",
    });
  }

  const serviceRoleConfigured = isSupabaseServiceRoleConfigured();
  const anonClient = createSupabaseServerClient();
  const serviceClient = serviceRoleConfigured
    ? createSupabaseServiceRoleClient()
    : null;

  const [
    serviceRoleResult,
    anonResult,
    ticketServiceResult,
    ticketAnonResult,
    dateServiceResult,
    dateAnonResult,
    publicApiSession,
    loadWithMetaResult,
  ] = await Promise.all([
    serviceClient
      ? serviceClient
          .from("sessions")
          .select("*")
          .eq("id", sessionId)
          .maybeSingle()
      : Promise.resolve({ data: null, error: { message: "Service role not configured" } }),
    anonClient.from("sessions").select("*").eq("id", sessionId).maybeSingle(),
    serviceClient
      ? serviceClient
          .from("tickets")
          .select("id", { count: "exact", head: true })
          .eq("session_id", sessionId)
      : Promise.resolve({ count: null, error: { message: "Service role not configured" } }),
    anonClient
      .from("tickets")
      .select("id", { count: "exact", head: true })
      .eq("session_id", sessionId),
    serviceClient
      ? serviceClient
          .from("session_dates")
          .select("id", { count: "exact", head: true })
          .eq("session_id", sessionId)
      : Promise.resolve({ count: null, error: { message: "Service role not configured" } }),
    anonClient
      .from("session_dates")
      .select("id", { count: "exact", head: true })
      .eq("session_id", sessionId),
    getPublicSessionById(sessionId),
    loadSessionWithMeta(sessionId),
  ]);

  let publicApiRouteStatus: number | null = null;
  try {
    const apiUrl = new URL(
      `/api/public/sessions/${encodeURIComponent(sessionId)}`,
      request.url,
    );
    const apiResponse = await fetch(apiUrl, { cache: "no-store" });
    publicApiRouteStatus = apiResponse.status;
  } catch (error) {
    publicApiRouteStatus = null;
  }

  return NextResponse.json({
    sessionId,
    env: {
      nodeEnv: process.env.NODE_ENV,
      dataProvider: process.env.NEXT_PUBLIC_DATA_PROVIDER ?? "(default supabase)",
      supabaseConfigured: true,
      serviceRoleConfigured,
    },
    sessions: {
      serviceRole: {
        found: Boolean(serviceRoleResult.data),
        error: serviceRoleResult.error?.message ?? null,
        summary: summarizeSessionRow(
          (serviceRoleResult.data as PublicSessionRow | null) ?? null,
        ),
      },
      anon: {
        found: Boolean(anonResult.data),
        error: anonResult.error?.message ?? null,
        summary: summarizeSessionRow(
          (anonResult.data as PublicSessionRow | null) ?? null,
        ),
      },
    },
    related: {
      tickets: {
        serviceRoleCount: ticketServiceResult.count ?? null,
        serviceRoleError: ticketServiceResult.error?.message ?? null,
        anonCount: ticketAnonResult.count ?? null,
        anonError: ticketAnonResult.error?.message ?? null,
      },
      sessionDates: {
        serviceRoleCount: dateServiceResult.count ?? null,
        serviceRoleError: dateServiceResult.error?.message ?? null,
        anonCount: dateAnonResult.count ?? null,
        anonError: dateAnonResult.error?.message ?? null,
      },
    },
    activitiesTable: {
      note: "Club dashboard ActivityRow.id maps to sessions.id (no separate activities table).",
      sessionIdMatchesSessionsTable: Boolean(serviceRoleResult.data),
    },
    publicApiRoute: {
      status: publicApiRouteStatus,
      sessionFound: Boolean(publicApiSession),
      sessionId: publicApiSession?.id ?? null,
      sessionTitle: publicApiSession?.sessionTitle ?? null,
    },
    getPublicSessionById: {
      found: Boolean(publicApiSession),
      sessionId: publicApiSession?.id ?? null,
      published: publicApiSession?.published ?? null,
    },
    loadSessionWithMeta: {
      source: loadWithMetaResult.source,
      found: Boolean(loadWithMetaResult.data),
      error: loadWithMetaResult.error ?? null,
      sessionId: loadWithMetaResult.data?.id ?? null,
      published: loadWithMetaResult.data?.published ?? null,
    },
  });
}
