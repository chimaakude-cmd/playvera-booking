"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";
import { LoadingState } from "@/components/club/LoadingState";
import { PageHeader } from "@/components/club/PageHeader";
import { SessionForm } from "@/components/club/SessionForm";
import { loadSessionWithMeta, updateSessionWithMeta } from "@/lib/data";
import {
  buildSessionLoadDiagnostics,
  logSessionLoadDiagnostics,
  showSessionLoadDiagnostics,
} from "@/lib/sessions/load-diagnostics";
import type { ClubSession, SessionInput } from "@/lib/sessions";

export default function EditSessionPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.id as string;

  const [session, setSession] = useState<ClubSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadSession() {
      setLoading(true);
      setLoadError(null);

      const result = await loadSessionWithMeta(sessionId);

      if (cancelled) {
        return;
      }

      logSessionLoadDiagnostics(
        buildSessionLoadDiagnostics({
          routeId: sessionId,
          source: result.source,
          found: Boolean(result.data),
          error: result.error,
        }),
      );

      setSession(result.data ?? null);
      setLoadError(result.error ?? null);
      setLoading(false);
    }

    void loadSession();

    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  async function handleSubmit(data: SessionInput) {
    setSaving(true);
    setSaveError(null);

    const result = await updateSessionWithMeta(sessionId, data);

    if (result.error) {
      setSaveError(result.error);
      setSaving(false);
      return;
    }

    if (!result.data) {
      setSaveError("Session not found. It may have been deleted.");
      setSaving(false);
      return;
    }

    router.push("/club/activities?updated=1");
  }

  if (loading) {
    return <LoadingState message="Loading session..." />;
  }

  if (!session) {
    return (
      <div className="space-y-6">
        <PageHeader title="Session not found" />
        <p className="text-sm text-zinc-500">
          This session may have been deleted.
        </p>
        {loadError ? (
          <p className="text-sm text-rose-600">{loadError}</p>
        ) : null}
        {showSessionLoadDiagnostics() ? (
          <p className="text-xs text-zinc-400">
            Diagnostics logged to the browser console for session{" "}
            <code className="rounded bg-zinc-100 px-1">{sessionId}</code>.
          </p>
        ) : null}
        <Link
          href="/club/activities"
          className="inline-flex rounded-lg bg-black px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-zinc-800"
        >
          Back to Activities
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <PageHeader
        title="Edit Session"
        description={`Update details for ${session.sessionTitle}.`}
      />
      {saveError ? (
        <p className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {saveError}
        </p>
      ) : null}
      <SessionForm
        initialValues={session}
        submitLabel={saving ? "Saving…" : "Save Changes"}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
