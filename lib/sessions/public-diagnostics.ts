import { getActivityPublicUrl } from "@/lib/club-share/url";
import { getPublicSessionById } from "@/lib/sessions/public-server";
import {
  createSupabaseServerClient,
  createSupabaseServiceRoleClient,
  isSupabaseConfigured,
  isSupabaseServiceRoleConfigured,
} from "@/lib/supabase";
import {
  isPublicSessionRow,
  isPublishedPublicSessionRow,
  isRemovedPublicSessionRow,
  type PublicSessionRow,
} from "@/lib/sessions/public-schema";

export type PublicSessionFilterStep = {
  step: string;
  pass: boolean;
  reason: string;
};

export type PublicSessionRowFields = PublicSessionRow & {
  provider_id?: string | null;
  moderation_status?: string | null;
  visible?: boolean | null;
  session_title?: string | null;
};

export function analyzePublicSessionFilterSteps(
  row: PublicSessionRowFields | null,
): {
  steps: PublicSessionFilterStep[];
  passes: boolean;
  failingStep: string | null;
} {
  if (!row) {
    return {
      steps: [
        {
          step: "find_by_id",
          pass: false,
          reason: "No sessions row returned for this id (missing row or RLS blocked read).",
        },
      ],
      passes: false,
      failingStep: "find_by_id",
    };
  }

  const steps: PublicSessionFilterStep[] = [
    {
      step: "find_by_id",
      pass: true,
      reason: `Row found (id=${row.id}).`,
    },
  ];

  const publishedPass = isPublishedPublicSessionRow(row);
  steps.push({
    step: "published_check",
    pass: publishedPass,
    reason: publishedPass
      ? `published=${String(row.published)} (treated as public; published !== false).`
      : `published=false — session excluded from public booking.`,
  });

  if (row.visible === false) {
    steps.push({
      step: "visible_column",
      pass: true,
      reason:
        "visible=false ignored for public booking (dashboard uses published flag; column may be absent).",
    });
  } else if (row.visible != null) {
    steps.push({
      step: "visible_column",
      pass: true,
      reason: `visible=${String(row.visible)}.`,
    });
  }

  const moderationStatus = row.moderation_status ?? null;
  if (moderationStatus === "removed") {
    steps.push({
      step: "moderation_status",
      pass: false,
      reason: "moderation_status=removed.",
    });
  } else if (moderationStatus != null) {
    steps.push({
      step: "moderation_status",
      pass: true,
      reason: `moderation_status=${moderationStatus}.`,
    });
  }

  if (row.removed_at) {
    steps.push({
      step: "removed_at",
      pass: false,
      reason: `removed_at=${row.removed_at}.`,
    });
  } else {
    steps.push({
      step: "removed_at",
      pass: true,
      reason: "removed_at is null.",
    });
  }

  if (row.deleted_at) {
    steps.push({
      step: "deleted_at",
      pass: false,
      reason: `deleted_at=${row.deleted_at}.`,
    });
  } else {
    steps.push({
      step: "deleted_at",
      pass: true,
      reason: "deleted_at is null.",
    });
  }

  if (row.archived === true) {
    steps.push({
      step: "archived",
      pass: false,
      reason: "archived=true.",
    });
  } else {
    steps.push({
      step: "archived",
      pass: true,
      reason: `archived=${String(row.archived ?? false)}.`,
    });
  }

  const status = row.status ?? null;
  if (
    status === "removed" ||
    status === "archived" ||
    status === "deleted" ||
    (status === "draft" && row.published === false)
  ) {
    steps.push({
      step: "status",
      pass: false,
      reason:
        status === "draft"
          ? `status=draft with published=false — excluded (published=true would pass).`
          : `status=${status}.`,
    });
  } else if (status === "draft") {
    steps.push({
      step: "status",
      pass: true,
      reason: `status=draft but published=${String(row.published)} — treated as public (matches dashboard).`,
    });
  } else if (status != null) {
    steps.push({
      step: "status",
      pass: true,
      reason: `status=${status}.`,
    });
  }

  const removedPass = !isRemovedPublicSessionRow(row);
  steps.push({
    step: "removed_aggregate",
    pass: removedPass,
    reason: removedPass
      ? "Not removed/archived/draft by aggregate removed check."
      : "Failed aggregate removed/archived/draft check.",
  });

  const passes = isPublicSessionRow(row);
  steps.push({
    step: "isPublicSessionRow",
    pass: passes,
    reason: passes
      ? "Session passes isPublicSessionRow() — eligible for /api/public/sessions."
      : "Session fails isPublicSessionRow() — public API returns 404.",
  });

  const failingStep = steps.find((step) => !step.pass)?.step ?? null;

  return { steps, passes, failingStep };
}

export function buildPublicSessionShareUrl(sessionId: string): string {
  return getActivityPublicUrl(sessionId);
}

export function buildPublicSessionDiagnosticSql(sessionId: string): string {
  const escapedId = sessionId.replace(/'/g, "''");
  return `-- Public booking diagnostic for session ${escapedId}
-- Note: status/visible columns may not exist in all deployments; omit from SELECT if query errors.

select
  s.id,
  s.session_title,
  s.provider_id,
  s.published,
  s.status,
  s.visible,
  s.moderation_status,
  s.removed_at,
  s.deleted_at,
  s.archived,
  s.created_at,
  s.updated_at,
  (select count(*) from public.session_dates sd where sd.session_id = s.id) as session_dates_count,
  (select count(*) from public.tickets t where t.session_id = s.id) as tickets_count
from public.sessions s
where s.id = '${escapedId}';

select id, session_date, start_time, end_time, capacity, cancelled
from public.session_dates
where session_id = '${escapedId}'
order by session_date;

select id, name, ticket_type, price, sort_order
from public.tickets
where session_id = '${escapedId}'
order by sort_order;

-- Fix with RETURNING (confirms rows matched; status/visible may error if columns absent):
-- update public.sessions
-- set published = true,
--     status = case when status = 'draft' then 'published' else status end,
--     updated_at = now()
-- where id = '${escapedId}'
-- returning id, published, status, visible, updated_at;`;
}

function summarizeDiagnosticRow(row: PublicSessionRowFields | null) {
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

export async function collectPublicSessionDiagnostics(sessionId: string) {
  const trimmedId = sessionId.trim();

  if (!trimmedId) {
    return { error: "Session id is required." };
  }

  if (!isSupabaseConfigured()) {
    return {
      sessionId: trimmedId,
      supabaseConfigured: false,
      error: "Supabase is not configured.",
    };
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
  ] = await Promise.all([
    serviceClient
      ? serviceClient
          .from("sessions")
          .select("*")
          .eq("id", trimmedId)
          .maybeSingle()
      : Promise.resolve({
          data: null,
          error: { message: "Service role not configured" },
        }),
    anonClient.from("sessions").select("*").eq("id", trimmedId).maybeSingle(),
    serviceClient
      ? serviceClient
          .from("tickets")
          .select("id", { count: "exact", head: true })
          .eq("session_id", trimmedId)
      : Promise.resolve({
          count: null,
          error: { message: "Service role not configured" },
        }),
    anonClient
      .from("tickets")
      .select("id", { count: "exact", head: true })
      .eq("session_id", trimmedId),
    serviceClient
      ? serviceClient
          .from("session_dates")
          .select("id", { count: "exact", head: true })
          .eq("session_id", trimmedId)
      : Promise.resolve({
          count: null,
          error: { message: "Service role not configured" },
        }),
    anonClient
      .from("session_dates")
      .select("id", { count: "exact", head: true })
      .eq("session_id", trimmedId),
    getPublicSessionById(trimmedId),
  ]);

  const serviceRoleRow =
    (serviceRoleResult.data as PublicSessionRowFields | null) ?? null;
  const anonRow = (anonResult.data as PublicSessionRowFields | null) ?? null;

  const serviceFilter = analyzePublicSessionFilterSteps(serviceRoleRow);
  const anonFilter = analyzePublicSessionFilterSteps(anonRow);

  const anonBlockedByRls =
    Boolean(serviceRoleRow) && !anonRow && !anonResult.error?.message;

  return {
    sessionId: trimmedId,
    serviceRoleRow: summarizeDiagnosticRow(serviceRoleRow),
    anonRow: summarizeDiagnosticRow(anonRow),
    serviceRoleRaw: serviceRoleRow,
    anonRaw: anonRow,
    filterSteps: {
      serviceRole: serviceFilter.steps,
      anon: anonFilter.steps,
    },
    failingStep: serviceFilter.failingStep,
    anonFailingStep: anonFilter.failingStep,
    anonBlockedByRls,
    ticketCounts: {
      serviceRole: ticketServiceResult.count ?? null,
      anon: ticketAnonResult.count ?? null,
    },
    dateCounts: {
      serviceRole: dateServiceResult.count ?? null,
      anon: dateAnonResult.count ?? null,
    },
    getPublicSessionById: {
      found: Boolean(publicApiSession),
      sessionId: publicApiSession?.id ?? null,
      sessionTitle: publicApiSession?.sessionTitle ?? null,
      published: publicApiSession?.published ?? null,
      ticketCount: publicApiSession?.tickets?.length ?? 0,
      dateCount: publicApiSession?.schedule?.dates?.length ?? 0,
    },
    likelyCause:
      serviceFilter.failingStep === "find_by_id"
        ? anonBlockedByRls
          ? "Row exists for service role but anon/RLS cannot read it — check published=true and migration 00064 policies."
          : "No sessions row with this id in Supabase (UPDATE may have matched 0 rows)."
        : serviceFilter.failingStep === "published_check"
          ? "sessions.published=false in DB."
          : serviceFilter.failingStep
            ? `Failed at ${serviceFilter.failingStep}.`
            : null,
    sql: buildPublicSessionDiagnosticSql(trimmedId),
  };
}
