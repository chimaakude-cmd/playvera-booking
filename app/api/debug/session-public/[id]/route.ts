import { NextRequest, NextResponse } from "next/server";
import { hasTestAdminSession } from "@/lib/auth/test-admin-session";
import { isAdminRepairEnabled } from "@/lib/admin-users/production-gates";
import { loadSessionWithMeta } from "@/lib/data/providers/resilient-sessions";
import { shouldUseSupabaseSessions } from "@/lib/data/config";
import { getPublicSessionById } from "@/lib/sessions/public-server";
import {
  analyzePublicSessionFilterSteps,
  buildPublicSessionDiagnosticSql,
  buildPublicSessionShareUrl,
  type PublicSessionRowFields,
} from "@/lib/sessions/public-diagnostics";
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

const BOOK_CHAIN_TABLES = [
  "sessions",
  "session_dates",
  "tickets",
] as const;

function summarizeSessionRow(row: PublicSessionRowFields | null) {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    session_title: row.session_title ?? null,
    published: row.published,
    visible: row.visible ?? null,
    status: row.status ?? null,
    moderation_status: row.moderation_status ?? null,
    removed_at: row.removed_at ?? null,
    deleted_at: row.deleted_at ?? null,
    archived: row.archived ?? null,
    provider_id: row.provider_id ?? null,
    isPublishedPublicSessionRow: isPublishedPublicSessionRow(row),
    isRemovedPublicSessionRow: isRemovedPublicSessionRow(row),
    isPublicSessionRow: isPublicSessionRow(row),
  };
}

function isDebugSecretValid(request: NextRequest): boolean {
  const secret = process.env.DEBUG_SECRET?.trim();
  if (!secret) {
    return false;
  }

  return request.nextUrl.searchParams.get("secret") === secret;
}

async function isDebugEndpointAllowed(request: NextRequest): Promise<boolean> {
  if (process.env.NODE_ENV !== "production") {
    return true;
  }

  if (isAdminRepairEnabled()) {
    return true;
  }

  if (isDebugSecretValid(request)) {
    return true;
  }

  return await hasTestAdminSession();
}

export async function GET(request: NextRequest, context: RouteContext) {
  if (!(await isDebugEndpointAllowed(request))) {
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
      : Promise.resolve({
          data: null,
          error: { message: "Service role not configured" },
        }),
    anonClient.from("sessions").select("*").eq("id", sessionId).maybeSingle(),
    serviceClient
      ? serviceClient
          .from("tickets")
          .select("id", { count: "exact", head: true })
          .eq("session_id", sessionId)
      : Promise.resolve({
          count: null,
          error: { message: "Service role not configured" },
        }),
    anonClient
      .from("tickets")
      .select("id", { count: "exact", head: true })
      .eq("session_id", sessionId),
    serviceClient
      ? serviceClient
          .from("session_dates")
          .select("id", { count: "exact", head: true })
          .eq("session_id", sessionId)
      : Promise.resolve({
          count: null,
          error: { message: "Service role not configured" },
        }),
    anonClient
      .from("session_dates")
      .select("id", { count: "exact", head: true })
      .eq("session_id", sessionId),
    getPublicSessionById(sessionId),
    loadSessionWithMeta(sessionId),
  ]);

  const serviceRow =
    (serviceRoleResult.data as PublicSessionRowFields | null) ?? null;
  const anonRow = (anonResult.data as PublicSessionRowFields | null) ?? null;

  const serviceFilter = analyzePublicSessionFilterSteps(serviceRow);
  const anonFilter = analyzePublicSessionFilterSteps(anonRow);

  let publicApiRouteStatus: number | null = null;
  let publicApiRouteBody: unknown = null;
  try {
    const apiUrl = new URL(
      `/api/public/sessions/${encodeURIComponent(sessionId)}`,
      request.url,
    );
    const apiResponse = await fetch(apiUrl, { cache: "no-store" });
    publicApiRouteStatus = apiResponse.status;
    publicApiRouteBody = await apiResponse.json().catch(() => null);
  } catch {
    publicApiRouteStatus = null;
    publicApiRouteBody = null;
  }

  const anonBlockedByRls =
    Boolean(serviceRow) &&
    !anonRow &&
    !anonResult.error?.message;

  return NextResponse.json({
    sessionId,
    incomingId: sessionId,
    bookChain: {
      page: "app/book/[id]/page.tsx",
      clientFetch: "lib/sessions/public-client.ts → fetchPublicSessionById",
      apiRoute: "app/api/public/sessions/[sessionId]/route.ts",
      serverLoader: "lib/sessions/public-server.ts → getPublicSessionById",
      rowFilter: "lib/sessions/public-schema.ts → fetchPublicSessionByIdRow + isPublicSessionRow",
      tablesQueried: BOOK_CHAIN_TABLES,
    },
    env: {
      nodeEnv: process.env.NODE_ENV,
      NEXT_PUBLIC_DATA_PROVIDER:
        process.env.NEXT_PUBLIC_DATA_PROVIDER ?? "(default supabase)",
      shouldUseSupabaseSessions: shouldUseSupabaseSessions(),
      supabaseConfigured: true,
      serviceRoleConfigured,
      adminRepairEnabled: isAdminRepairEnabled(),
      debugSecretConfigured: Boolean(process.env.DEBUG_SECRET?.trim()),
    },
    sessions: {
      serviceRole: {
        found: Boolean(serviceRoleResult.data),
        error: serviceRoleResult.error?.message ?? null,
        summary: summarizeSessionRow(serviceRow),
        filterAnalysis: serviceFilter,
      },
      anon: {
        found: Boolean(anonResult.data),
        error: anonResult.error?.message ?? null,
        rlsLikelyBlocked: anonBlockedByRls,
        summary: summarizeSessionRow(anonRow),
        filterAnalysis: anonFilter,
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
    shareUrl: buildPublicSessionShareUrl(sessionId),
    localStorageVisibilityOverride: {
      note: "Server cannot read browser localStorage. Check client ?debug=1 panel for activora-activities-visibility override.",
      key: "activora-activities-visibility",
    },
    publicApiRouteSimulation: {
      status: publicApiRouteStatus,
      body: publicApiRouteBody,
      sessionFound: Boolean(publicApiSession),
    },
    getPublicSessionById: {
      found: Boolean(publicApiSession),
      sessionId: publicApiSession?.id ?? null,
      sessionTitle: publicApiSession?.sessionTitle ?? null,
      published: publicApiSession?.published ?? null,
      ticketCount: publicApiSession?.tickets?.length ?? 0,
      dateCount: publicApiSession?.schedule?.dates?.length ?? 0,
    },
    loadSessionWithMeta: {
      source: loadWithMetaResult.source,
      found: Boolean(loadWithMetaResult.data),
      error: loadWithMetaResult.error ?? null,
      sessionId: loadWithMetaResult.data?.id ?? null,
      published: loadWithMetaResult.data?.published ?? null,
      providerContext: loadWithMetaResult.data
        ? {
            paymentProvider: loadWithMetaResult.data.paymentProvider ?? null,
            providerVenueId: loadWithMetaResult.data.providerVenueId ?? null,
          }
        : null,
    },
    exactExclusion: {
      failingStep: serviceFilter.failingStep,
      steps: serviceFilter.steps,
      likelyCause:
        serviceFilter.failingStep === "published_check"
          ? "sessions.published=false in DB while club UI may show visible via localStorage override (fixed in latest code) or publish PATCH never persisted."
          : serviceFilter.failingStep === "find_by_id"
            ? anonBlockedByRls
              ? "Row exists for service role but anon/RLS cannot read it — ensure published=true and migration 00064 policies applied."
              : "No sessions row with this id in Supabase."
            : serviceFilter.failingStep
              ? `Failed at ${serviceFilter.failingStep}.`
              : null,
    },
    sql: buildPublicSessionDiagnosticSql(sessionId),
    howToAccessInProduction: {
      adminRepair: "Set ADMIN_REPAIR_ENABLED=true on Vercel, redeploy, then GET /api/debug/session-public/{id}",
      debugSecret:
        "Set DEBUG_SECRET on Vercel, redeploy, then GET /api/debug/session-public/{id}?secret=YOUR_SECRET",
      adminSession: "Sign in with admin test session cookie, then GET /api/debug/session-public/{id}",
      bookPageDebug: "GET /book/{id}?debug=1 while signed in as admin (inline panel)",
    },
  });
}
