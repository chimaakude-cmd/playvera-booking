"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { ConfirmDialog } from "@/components/club/ConfirmDialog";
import { EmptyState } from "@/components/club/EmptyState";
import { LoadingState } from "@/components/club/LoadingState";
import { PageHeader } from "@/components/club/PageHeader";
import {
  dataLayer,
  dismissLocalSessionImport,
  getLocalSessionCount,
  getSessionsMissingCoordinates,
  importLocalSessionsToSupabase,
  loadSessionsWithMeta,
  repairMissingSessionCoordinates,
  shouldShowImportLocalSessionsBanner,
} from "@/lib/data";
import {
  ClubSession,
  formatSessionLocation,
  getCapacitySummary,
  getSessionDateCount,
  getTicketPriceSummary,
} from "@/lib/sessions";
import { getSessionImages } from "@/lib/session-images";
import { SessionImageStrip } from "@/components/sessions/SessionImage";

function ClubSessionsLegacyContent() {
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sessions, setSessions] = useState<ClubSession[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<ClubSession | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [showUpdated, setShowUpdated] = useState(false);
  const [showCreated, setShowCreated] = useState(false);
  const [showImportBanner, setShowImportBanner] = useState(false);
  const [localSessionCount, setLocalSessionCount] = useState(0);
  const [importing, setImporting] = useState(false);
  const [importMessage, setImportMessage] = useState<string | null>(null);
  const [repairingLocations, setRepairingLocations] = useState(false);
  const [repairMessage, setRepairMessage] = useState<string | null>(null);

  async function loadSessions() {
    setLoading(true);
    setError(null);

    try {
      const result = await loadSessionsWithMeta();
      setSessions(result.data);
      setError(result.error ?? null);
    } catch (loadError) {
      setSessions([]);
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Could not load sessions.",
      );
    } finally {
      setLoading(false);
    }
  }

  function refreshImportBannerState() {
    setLocalSessionCount(getLocalSessionCount());
    setShowImportBanner(shouldShowImportLocalSessionsBanner());
  }

  useEffect(() => {
    void loadSessions();
    refreshImportBannerState();
  }, []);

  useEffect(() => {
    if (searchParams.get("updated") === "1") {
      setShowUpdated(true);
      window.history.replaceState({}, "", "/club/activities-old");
    }

    if (searchParams.get("created") === "1") {
      setShowCreated(true);
      window.history.replaceState({}, "", "/club/activities-old");
    }
  }, [searchParams]);

  async function handleDeleteConfirm() {
    if (!deleteTarget) {
      return;
    }

    setDeleting(true);

    try {
      await dataLayer.sessions.delete(deleteTarget.id);
      setDeleteTarget(null);
      await loadSessions();
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Could not delete this session.",
      );
    } finally {
      setDeleting(false);
    }
  }

  async function handleImportLocalSessions() {
    setImporting(true);
    setImportMessage(null);
    setError(null);

    try {
      const result = await importLocalSessionsToSupabase();

      if (result.failed.length > 0) {
        const summary = result.failed
          .map((entry) => `${entry.sessionTitle}: ${entry.error}`)
          .join(" · ");
        setImportMessage(
          `Imported ${result.imported} session${result.imported === 1 ? "" : "s"}. ${result.failed.length} failed: ${summary}`,
        );
      } else if (result.imported > 0 || result.skipped > 0) {
        setImportMessage(
          `Imported ${result.imported} session${result.imported === 1 ? "" : "s"}${
            result.skipped > 0
              ? ` (${result.skipped} already in Supabase)`
              : ""
          }.`,
        );
      }

      refreshImportBannerState();
      await loadSessions();
    } catch (importError) {
      setError(
        importError instanceof Error
          ? importError.message
          : "Could not import local sessions.",
      );
    } finally {
      setImporting(false);
    }
  }

  function handleDismissImport() {
    dismissLocalSessionImport();
    refreshImportBannerState();
  }

  async function handleRepairMissingLocations() {
    setRepairingLocations(true);
    setRepairMessage(null);
    setError(null);

    try {
      const missingCount = getSessionsMissingCoordinates(sessions).length;

      if (missingCount === 0) {
        setRepairMessage("All sessions already have map locations.");
        return;
      }

      const result = await repairMissingSessionCoordinates(sessions);

      if (result.failed.length > 0) {
        const summary = result.failed
          .map((entry) => `${entry.sessionTitle}: ${entry.error}`)
          .join(" · ");
        setRepairMessage(
          `Fixed ${result.fixed} session${result.fixed === 1 ? "" : "s"}. ${result.failed.length} failed: ${summary}`,
        );
      } else {
        setRepairMessage(
          `Fixed ${result.fixed} session${result.fixed === 1 ? "" : "s"}.`,
        );
      }

      await loadSessions();
    } catch (repairError) {
      setError(
        repairError instanceof Error
          ? repairError.message
          : "Could not repair missing map locations.",
      );
    } finally {
      setRepairingLocations(false);
    }
  }

  const missingMapLocationCount = getSessionsMissingCoordinates(sessions).length;

  if (loading) {
    return <LoadingState message="Loading sessions..." />;
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Sessions"
        description="Manage your club sessions, schedules, tickets, and capacity."
        action={
          <Link
            href="/club/create-session"
            className="inline-flex rounded-lg bg-black px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-zinc-800"
          >
            Create Session
          </Link>
        }
      />

      {showImportBanner ? (
        <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-4 text-sm text-blue-950">
          <p className="font-medium">
            {localSessionCount} local session
            {localSessionCount === 1 ? "" : "s"} found from before Supabase was
            connected.
          </p>
          <p className="mt-1 text-blue-900/80">
            Import them to Supabase to show them here. This is a one-time
            migration step.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void handleImportLocalSessions()}
              disabled={importing}
              className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-800 disabled:opacity-60"
            >
              {importing ? "Importing..." : "Import local sessions"}
            </button>
            <button
              type="button"
              onClick={handleDismissImport}
              disabled={importing}
              className="rounded-lg border border-blue-300 px-4 py-2 text-sm font-medium text-blue-900 transition-colors hover:bg-blue-100 disabled:opacity-60"
            >
              Dismiss
            </button>
          </div>
        </div>
      ) : null}

      {importMessage ? (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          {importMessage}
        </div>
      ) : null}

      {missingMapLocationCount > 0 ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-950">
          <p className="font-medium">
            {missingMapLocationCount} session
            {missingMapLocationCount === 1 ? "" : "s"} missing map coordinates.
          </p>
          <p className="mt-1 text-amber-900/80">
            Use Mapbox geocoding to save latitude and longitude for existing
            sessions.
          </p>
          <button
            type="button"
            onClick={() => void handleRepairMissingLocations()}
            disabled={repairingLocations}
            className="mt-3 rounded-lg bg-amber-700 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-amber-800 disabled:opacity-60"
          >
            {repairingLocations ? "Fixing locations..." : "Fix missing map locations"}
          </button>
        </div>
      ) : null}

      {repairMessage ? (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          {repairMessage}
        </div>
      ) : null}

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      ) : null}

      {showCreated ? (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          Session created successfully.
        </div>
      ) : null}

      {showUpdated ? (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          Session updated successfully
        </div>
      ) : null}

      {sessions.length === 0 ? (
        <EmptyState
          title="No sessions yet"
          description="Create your first session to start accepting bookings from parents."
          actionLabel="Create Session"
          actionHref="/club/create-session"
        />
      ) : (
        <div className="grid gap-4">
          {sessions.map((session) => {
            const { mainImageId, galleryImageIds } = getSessionImages(session);

            return (
              <article
                key={session.id}
                className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="flex flex-col gap-4 sm:flex-row sm:flex-1">
                    <SessionImageStrip
                      mainImageId={mainImageId}
                      galleryImageIds={galleryImageIds}
                      alt={session.sessionTitle}
                      className="h-24 w-full overflow-hidden rounded-xl border border-zinc-200 sm:h-28 sm:w-32"
                    />
                    <div className="space-y-4">
                      <div>
                        <h2 className="text-lg font-semibold text-zinc-900">
                          {session.sessionTitle}
                        </h2>
                        <p className="mt-1 text-sm text-zinc-500">
                          {formatSessionLocation(session)}
                        </p>
                        <p className="mt-1 text-sm text-zinc-500">
                          {session.ageRange ||
                            session.details?.ageGroup ||
                            "All ages"}
                        </p>
                      </div>

                      <dl className="grid gap-3 text-sm sm:grid-cols-2 xl:grid-cols-4">
                        <div className="rounded-xl bg-zinc-50 px-4 py-3">
                          <dt className="text-zinc-500">Dates</dt>
                          <dd className="mt-1 font-semibold text-zinc-900">
                            {getSessionDateCount(session)} scheduled
                          </dd>
                        </div>
                        <div className="rounded-xl bg-zinc-50 px-4 py-3">
                          <dt className="text-zinc-500">Tickets</dt>
                          <dd className="mt-1 font-semibold text-zinc-900">
                            {getTicketPriceSummary(session)}
                          </dd>
                        </div>
                        <div className="rounded-xl bg-zinc-50 px-4 py-3">
                          <dt className="text-zinc-500">Capacity</dt>
                          <dd className="mt-1 font-semibold text-zinc-900">
                            {getCapacitySummary(session)}
                          </dd>
                        </div>
                        <div className="rounded-xl bg-zinc-50 px-4 py-3">
                          <dt className="text-zinc-500">Bookings</dt>
                          <dd className="mt-1 font-semibold text-zinc-900">
                            {session.bookings}
                          </dd>
                        </div>
                      </dl>

                      {session.description ? (
                        <p className="text-sm leading-6 text-zinc-600">
                          {session.description}
                        </p>
                      ) : null}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Link
                      href={`/club/sessions/${session.id}/edit`}
                      className="rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50"
                    >
                      Edit
                    </Link>
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(session)}
                      disabled={deleting}
                      className="rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 disabled:opacity-60"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete session?"
        description={`Are you sure you want to delete "${deleteTarget?.sessionTitle}"? This action cannot be undone.`}
        confirmLabel={deleting ? "Deleting..." : "Delete Session"}
        onConfirm={() => void handleDeleteConfirm()}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}

export default function ClubActivitiesOldPage() {
  return (
    <Suspense fallback={<LoadingState message="Loading sessions..." />}>
      <ClubSessionsLegacyContent />
    </Suspense>
  );
}
