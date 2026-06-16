"use client";

import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { ConfirmDialog } from "@/components/club/ConfirmDialog";
import { ShareClubModal } from "@/components/club/share/ShareClubModal";
import {
  archiveActivities,
  computeActivityMetrics,
  DEFAULT_ACTIVITY_FILTERS,
  extractFilterOptions,
  filterActivityRows,
  loadFilterView,
  mapSessionsToActivityRows,
  resetActivityFilters,
  saveFilterView,
  setActivityVisibility,
  type ActivityFilters,
  type ActivityRow,
  type ActivityViewTab,
} from "@/lib/club-activities";
import { getClubProfile } from "@/lib/club-profile";
import { dataLayer, loadSessionsWithMeta } from "@/lib/data";
import { paginateItems } from "@/lib/pagination";
import type { ClubSession } from "@/lib/sessions";
import { ActivitiesEmptyState } from "./ActivitiesEmptyState";
import { ActivitiesFilters } from "./ActivitiesFilters";
import { ActivitiesHeader } from "./ActivitiesHeader";
import { ActivitiesMetrics } from "./ActivitiesMetrics";
import { ActivitiesSkeleton } from "./ActivitiesSkeleton";
import { ActivitiesTable } from "./ActivitiesTable";

const ActivityOverviewDrawer = dynamic(
  () =>
    import("./ActivityOverviewDrawer").then(
      (module) => module.ActivityOverviewDrawer,
    ),
  { ssr: false },
);

type ActivitiesPageProps = {
  showCreated?: boolean;
  showUpdated?: boolean;
};

function ActivitiesPageContent({
  showCreated: showCreatedProp = false,
  showUpdated: showUpdatedProp = false,
}: ActivitiesPageProps) {
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sessions, setSessions] = useState<ClubSession[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const [viewTab, setViewTab] = useState<ActivityViewTab>("all");
  const [filters, setFilters] = useState<ActivityFilters>(
    DEFAULT_ACTIVITY_FILTERS,
  );
  const [page, setPage] = useState(1);
  const [selectedRow, setSelectedRow] = useState<ActivityRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ActivityRow | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [showCreated, setShowCreated] = useState(showCreatedProp);
  const [showUpdated, setShowUpdated] = useState(showUpdatedProp);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [savedFilterLabel, setSavedFilterLabel] = useState<string | null>(null);

  const profile = getClubProfile();

  const loadSessions = useCallback(async () => {
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
          : "Could not load activities.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadSessions();
    const saved = loadFilterView();
    if (saved) {
      setViewTab(saved.viewTab);
      setFilters(saved.filters);
      setSavedFilterLabel(
        new Date(saved.savedAt).toLocaleDateString("en-GB", {
          day: "numeric",
          month: "short",
        }),
      );
    }
  }, [loadSessions, refreshKey]);

  useEffect(() => {
    if (searchParams.get("updated") === "1") {
      setShowUpdated(true);
      window.history.replaceState({}, "", "/club/sessions");
    }

    if (searchParams.get("created") === "1") {
      setShowCreated(true);
      window.history.replaceState({}, "", "/club/sessions");
    }

    const query = searchParams.get("q");
    if (query) {
      setFilters((current) => ({ ...current, query }));
    }
  }, [searchParams]);

  const rows = useMemo(() => {
    void refreshKey;
    return mapSessionsToActivityRows(sessions);
  }, [sessions, refreshKey]);

  const metrics = useMemo(() => computeActivityMetrics(rows), [rows]);
  const filterOptions = useMemo(() => extractFilterOptions(rows), [rows]);

  const filtered = useMemo(
    () => filterActivityRows(rows, viewTab, filters),
    [rows, viewTab, filters],
  );

  const pagination = useMemo(
    () => paginateItems(filtered, page, 10),
    [filtered, page],
  );

  function handleResetFilters() {
    setFilters(resetActivityFilters());
    setViewTab("all");
    setPage(1);
  }

  function handleRefresh() {
    setRefreshKey((current) => current + 1);
  }

  async function handleDeleteConfirm() {
    if (!deleteTarget) {
      return;
    }

    setDeleting(true);

    try {
      await dataLayer.sessions.delete(deleteTarget.id);
      setDeleteTarget(null);
      setSelectedRow(null);
      handleRefresh();
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Could not delete this activity.",
      );
    } finally {
      setDeleting(false);
    }
  }

  async function handleDuplicate(row: ActivityRow) {
    const source = row.session;
    const { id: _id, bookings: _bookings, createdAt: _createdAt, ...rest } =
      source;

    try {
      await dataLayer.sessions.save({
        ...rest,
        sessionTitle: `${source.sessionTitle} (copy)`,
        published: false,
      });
      setActionMessage("Activity duplicated as draft.");
      handleRefresh();
    } catch (duplicateError) {
      setError(
        duplicateError instanceof Error
          ? duplicateError.message
          : "Could not duplicate this activity.",
      );
    }
  }

  function handlePreview(row: ActivityRow) {
    window.open(`/book/${row.id}`, "_blank", "noopener,noreferrer");
  }

  function handleShare(_row: ActivityRow) {
    setShareOpen(true);
  }

  function handleBulkAction(action: "archive" | "export") {
    if (action === "archive") {
      const drafts = rows.filter((row) => row.status === "draft");
      archiveActivities(drafts.map((row) => row.id));
      setActionMessage(
        drafts.length > 0
          ? `Archived ${drafts.length} draft${drafts.length === 1 ? "" : "s"}.`
          : "No drafts to archive.",
      );
      handleRefresh();
      return;
    }

    const csv = [
      ["Title", "Status", "Venue", "Bookings", "Capacity"].join(","),
      ...filtered.map((row) =>
        [
          `"${row.title.replace(/"/g, '""')}"`,
          row.status,
          `"${row.venueName.replace(/"/g, '""')}"`,
          row.occupancy.filled,
          row.occupancy.capacity,
        ].join(","),
      ),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "activities-export.csv";
    link.click();
    URL.revokeObjectURL(url);
    setActionMessage("Activity list exported.");
  }

  function handleVisibilityToggle(row: ActivityRow) {
    setActivityVisibility(row.id, !row.visibility);
    handleRefresh();
  }

  if (loading) {
    return <ActivitiesSkeleton />;
  }

  return (
    <div className="space-y-6">
      <ActivitiesHeader onBulkAction={handleBulkAction} />
      <ActivitiesMetrics metrics={metrics} />

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      ) : null}

      {showCreated ? (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          Activity created successfully.
        </div>
      ) : null}

      {showUpdated ? (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          Activity updated successfully.
        </div>
      ) : null}

      {actionMessage ? (
        <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900">
          {actionMessage}
        </div>
      ) : null}

      <ActivitiesFilters
        viewTab={viewTab}
        filters={filters}
        options={filterOptions}
        savedFilterLabel={savedFilterLabel}
        onViewTabChange={(tab) => {
          setViewTab(tab);
          setPage(1);
        }}
        onFiltersChange={(next) => {
          setFilters(next);
          setPage(1);
        }}
        onSaveFilterView={() => {
          saveFilterView(viewTab, filters);
          setSavedFilterLabel("saved");
        }}
        onReset={handleResetFilters}
      />

      {filtered.length === 0 ? (
        <ActivitiesEmptyState />
      ) : (
        <ActivitiesTable
          rows={pagination.items}
          page={pagination.page}
          totalPages={pagination.totalPages}
          totalItems={pagination.totalItems}
          startIndex={pagination.startIndex}
          endIndex={pagination.endIndex}
          onPageChange={setPage}
          onRowClick={setSelectedRow}
          onVisibilityToggle={handleVisibilityToggle}
          onPreview={handlePreview}
          onShare={handleShare}
          onDuplicate={handleDuplicate}
          onDelete={setDeleteTarget}
        />
      )}

      <ActivityOverviewDrawer
        row={selectedRow}
        onClose={() => setSelectedRow(null)}
        onShare={handleShare}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete activity?"
        description={`Are you sure you want to delete "${deleteTarget?.title}"? This action cannot be undone.`}
        confirmLabel={deleting ? "Deleting..." : "Delete activity"}
        onConfirm={() => void handleDeleteConfirm()}
        onCancel={() => setDeleteTarget(null)}
      />

      {profile ? (
        <ShareClubModal
          open={shareOpen}
          onClose={() => setShareOpen(false)}
          clubName={profile.clubName}
          slug={profile.publicSlug}
          providerId={profile.providerId}
          logoUrl={profile.logoUrl}
          primaryColor={profile.branding?.primaryColor}
          secondaryColor={profile.branding?.secondaryColor}
        />
      ) : null}
    </div>
  );
}

export function ActivitiesPage(props: ActivitiesPageProps = {}) {
  return (
    <Suspense fallback={<ActivitiesSkeleton />}>
      <ActivitiesPageContent {...props} />
    </Suspense>
  );
}
