"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ACTIVITIES_VISIBILITY_KEY,
  getActivityVisibilityOverrides,
  isActivityArchived,
} from "@/lib/club-activities/storage";
import { shouldUseSupabaseSessions } from "@/lib/data/config";
import {
  buildSessionLoadDiagnostics,
  showSessionLoadDiagnostics,
  type SessionLoadDiagnostics,
} from "@/lib/sessions/load-diagnostics";
import { fetchPublicSessionById } from "@/lib/sessions/public-client";
import { getSessionById } from "@/lib/sessions";

type BookSessionDebugPanelProps = {
  sessionId: string;
  loadDiagnostics: SessionLoadDiagnostics;
};

export function BookSessionDebugPanel({
  sessionId,
  loadDiagnostics,
}: BookSessionDebugPanelProps) {
  const [apiPayload, setApiPayload] = useState<unknown>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [apiLoading, setApiLoading] = useState(true);

  const visibilityOverride = useMemo(() => {
    const overrides = getActivityVisibilityOverrides();
    if (!(sessionId in overrides)) {
      return null;
    }
    return overrides[sessionId];
  }, [sessionId]);

  useEffect(() => {
    let cancelled = false;

    async function loadDebugApi() {
      setApiLoading(true);
      setApiError(null);

      try {
        const response = await fetch(
          `/api/debug/session-public/${encodeURIComponent(sessionId)}`,
          { cache: "no-store" },
        );

        if (!response.ok) {
          if (!cancelled) {
            setApiError(
              response.status === 404
                ? "Debug API returned 404 — enable ADMIN_REPAIR_ENABLED, DEBUG_SECRET (?secret=), or admin session."
                : `Debug API HTTP ${response.status}`,
            );
            setApiPayload(null);
          }
          return;
        }

        const payload = await response.json();
        if (!cancelled) {
          setApiPayload(payload);
        }
      } catch (error) {
        if (!cancelled) {
          setApiError(
            error instanceof Error
              ? error.message
              : "Could not load debug API.",
          );
          setApiPayload(null);
        }
      } finally {
        if (!cancelled) {
          setApiLoading(false);
        }
      }
    }

    void loadDebugApi();

    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  return (
    <div className="mx-auto mt-6 max-w-3xl rounded-xl border border-amber-300 bg-amber-50 p-4 text-left text-sm text-amber-950">
      <p className="font-semibold">Session load diagnostics (?debug=1)</p>
      <p className="mt-1 text-xs text-amber-800">
        Admin/dev only. Public booking chain: page → fetchPublicSessionById →
        /api/public/sessions/[id] → getPublicSessionById.
      </p>

      <pre className="mt-3 overflow-x-auto rounded-lg bg-white/80 p-3 text-xs">
        {JSON.stringify(loadDiagnostics, null, 2)}
      </pre>

      <dl className="mt-3 grid gap-2 text-xs sm:grid-cols-2">
        <div>
          <dt className="font-medium">localStorage session match</dt>
          <dd>{getSessionById(sessionId) ? "yes" : "no"}</dd>
        </div>
        <div>
          <dt className="font-medium">{ACTIVITIES_VISIBILITY_KEY} override</dt>
          <dd>
            {visibilityOverride == null
              ? "(none)"
              : String(visibilityOverride)}
          </dd>
        </div>
        <div>
          <dt className="font-medium">Archived override</dt>
          <dd>{isActivityArchived(sessionId) ? "yes" : "no"}</dd>
        </div>
        <div>
          <dt className="font-medium">Supabase sessions mode</dt>
          <dd>{shouldUseSupabaseSessions() ? "yes" : "no (localStorage)"}</dd>
        </div>
      </dl>

      <p className="mt-3 text-xs font-medium">Server debug API</p>
      {apiLoading ? (
        <p className="text-xs text-amber-800">Loading /api/debug/session-public/…</p>
      ) : apiError ? (
        <p className="text-xs text-red-700">{apiError}</p>
      ) : (
        <pre className="mt-2 max-h-96 overflow-auto rounded-lg bg-white/80 p-3 text-xs">
          {JSON.stringify(apiPayload, null, 2)}
        </pre>
      )}

      <p className="mt-3 text-xs text-amber-800">
        Production:{" "}
        <code className="rounded bg-white/70 px-1">
          https://activora.uk/api/debug/session-public/{sessionId}?secret=YOUR_DEBUG_SECRET
        </code>
      </p>
    </div>
  );
}

export async function buildBookSessionLoadDiagnostics(
  sessionId: string,
): Promise<SessionLoadDiagnostics> {
  if (shouldUseSupabaseSessions()) {
    const result = await fetchPublicSessionById(sessionId);
    return buildSessionLoadDiagnostics({
      routeId: sessionId,
      source: "supabase",
      found: Boolean(result.session),
      error: result.error,
    });
  }

  const found = getSessionById(sessionId);
  return buildSessionLoadDiagnostics({
    routeId: sessionId,
    source: "localStorage",
    found: Boolean(found),
  });
}

export function shouldShowBookSessionDebugPanel(
  debugParam: string | null,
): boolean {
  return debugParam === "1" && showSessionLoadDiagnostics();
}
