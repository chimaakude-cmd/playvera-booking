import { getActivityPublicUrl } from "@/lib/club-share/url";
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
      pass: false,
      reason: "visible=false on sessions row.",
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
    status === "draft"
  ) {
    steps.push({
      step: "status",
      pass: false,
      reason: `status=${status}.`,
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
select
  s.id,
  s.session_title,
  s.provider_id,
  s.published,
  s.moderation_status,
  s.removed_at,
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

-- Fix (only if row exists, has dates/tickets, and should be bookable):
-- update public.sessions set published = true, updated_at = now() where id = '${escapedId}' and published = false;`;
}
