"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { ShareActivityModal } from "@/components/club/share/ShareActivityModal";
import { ShareClubModal } from "@/components/club/share/ShareClubModal";
import {
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
import {
  archiveSessionActivity,
  bulkArchiveSessions,
  bulkDeleteSessions,
  bulkPublishSessions,
  canHardDeleteSession,
  deleteSessionActivity,
  getActiveBookingCount,
} from "@/lib/club-activities/session-actions";
import { getClubProfile } from "@/lib/club-profile";
import { loadSessionsWithMeta } from "@/lib/data";
import { paginateItems } from "@/lib/pagination";
import type { ClubSession } from "@/lib/sessions";
import { ActivitiesEmptyState } from "./ActivitiesEmptyState";
import { ActivitiesFilters } from "./ActivitiesFilters";
import { ConfirmDialog } from "@/components/club/ConfirmDialog";
import {
  ActivitiesHeader,
  type BulkActionAvailability,
} from "./ActivitiesHeader";
import { ActivitiesMetrics } from "./ActivitiesMetrics";
import { ActivitiesSkeleton } from "./ActivitiesSkeleton";
import { ActivitiesCardsGrid } from "./ActivitiesCardsGrid";
import { SessionDeleteDialog } from "./SessionDeleteDialog";

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
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<ActivityRow | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [shareRow, setShareRow] = useState<ActivityRow | null>(null);
  const [shareClubOpen, setShareClubOpen] = useState(false);
  const [showCreated, setShowCreated] = useState(showCreatedProp);
  const [showUpdated, setShowUpdated] = useState(showUpdatedProp);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [savedFilterLabel, setSavedFilterLabel] = useState<string | null>(null);
  const [bulkConfirmAction, setBulkConfirmAction] = useState<
    "delete" | "archive" | "publish" | null
  >(null);

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
    () => paginateItems(filtered, page, 12),
    [filtered, page],
  );

  const selectedRows = useMemo(
    () => rows.filter((row) => selectedIds.includes(row.id)),
    [rows, selectedIds],
  );

  const bulkAvailability = useMemo((): BulkActionAvailability => {
    const count = selectedRows.length;
    if (count === 0) {
      return { delete: false, archive: false, publish: false };
    }

    const hasBookings = selectedRows.some(
      (row) => getActiveBookingCount(row) > 0,
    );
    const hasDraft = selectedRows.some((row) => row.status === "draft");

    return {
      delete: !hasBookings,
      archive: true,
      publish: hasDraft,
    };
  }, [selectedRows]);

  const deleteHasBookings = deleteTarget
    ? !canHardDeleteSession(deleteTarget)
    : false;

  function handleResetFilters() {
    setFilters(resetActivityFilters());
    setViewTab("all");
    setPage(1);
  }

  function handleRefresh() {
    setRefreshKey((current) => current + 1);
  }

  async function handleArchive(row: ActivityRow) {
    setActionLoading(true);
    setError(null);

    try {
      await archiveSessionActivity(row);
      setActionMessage(`"${row.title}" archived.`);
      setDeleteTarget(null);
      setSelectedIds((current) => current.filter((id) => id !== row.id));
      handleRefresh();
    } catch (archiveError) {
      setError(
        archiveError instanceof Error
          ? archiveError.message
          : "Could not archive this activity.",
      );
    } finally {
      setActionLoading(false);
    }
  }

  async function handleDeleteConfirm() {
    if (!deleteTarget) {
      return;
    }

    setActionLoading(true);

    try {
      await deleteSessionActivity(deleteTarget);
      setActionMessage(`"${deleteTarget.title}" deleted.`);
      setDeleteTarget(null);
      setSelectedIds((current) =>
        current.filter((id) => id !== deleteTarget.id),
      );
      handleRefresh();
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Could not delete this activity.",
      );
    } finally {
      setActionLoading(false);
    }
  }

  function handlePreview(row: ActivityRow) {
    window.open(`/book/${row.id}`, "_blank", "noopener,noreferrer");
  }

  function handleShare(row: ActivityRow) {
    setShareRow(row);
    setShareOpen(true);
  }

  function handleDeleteRequest(row: ActivityRow) {
    setDeleteTarget(row);
  }

  function handleBulkActionRequest(
    action: "delete" | "archive" | "publish" | "export",
  ) {
    if (action === "export") {
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
      return;
    }

    if (selectedRows.length === 0) {
      return;
    }

    if (action === "delete" && !bulkAvailability.delete) {
      setActionMessage(
        "Activities with bookings cannot be deleted. Archive instead.",
      );
      return;
    }

    if (action === "archive" && !bulkAvailability.archive) {
      return;
    }

    if (action === "publish" && !bulkAvailability.publish) {
      return;
    }

    setBulkConfirmAction(action);
  }

  async function handleBulkConfirm() {
    if (!bulkConfirmAction || selectedRows.length === 0) {
      setBulkConfirmAction(null);
      return;
    }

    const action = bulkConfirmAction;
    setBulkConfirmAction(null);
    setActionLoading(true);
    setError(null);

    try {
      if (action === "archive") {
        const archived = await bulkArchiveSessions(selectedRows);
        setActionMessage(
          `Archived ${archived} activit${archived === 1 ? "y" : "ies"}.`,
        );
      }

      if (action === "publish") {
        const drafts = selectedRows.filter((row) => row.status === "draft");
        const published = await bulkPublishSessions(drafts);
        setActionMessage(
          `Published ${published} activit${published === 1 ? "y" : "ies"}.`,
        );
      }

      if (action === "delete") {
        const { deleted } = await bulkDeleteSessions(selectedRows);
        setActionMessage(
          deleted > 0
            ? `Deleted ${deleted} activit${deleted === 1 ? "y" : "ies"}.`
            : "No activities could be deleted.",
        );
      }

      setSelectedIds([]);
      handleRefresh();
    } catch (bulkError) {
      setError(
        bulkError instanceof Error
          ? bulkError.message
          : "Could not complete bulk action.",
      );
    } finally {
      setActionLoading(false);
    }
  }

  const bulkConfirmTitle =
    bulkConfirmAction === "delete"
      ? "Delete activities?"
      : bulkConfirmAction === "archive"
        ? "Archive activities?"
        : bulkConfirmAction === "publish"
          ? "Publish activities?"
          : "";

  const bulkConfirmDescription =
    bulkConfirmAction && selectedRows.length > 0
      ? `You are about to ${bulkConfirmAction} ${selectedRows.length} activit${
          selectedRows.length === 1 ? "y" : "ies"
        }.`
      : "";

  const bulkConfirmLabel =
    bulkConfirmAction === "delete"
      ? "Delete"
      : bulkConfirmAction === "archive"
        ? "Archive"
        : bulkConfirmAction === "publish"
          ? "Publish"
          : "Confirm";

  function handleVisibilityToggle(row: ActivityRow) {
    setActivityVisibility(row.id, !row.visibility);
    handleRefresh();
  }

  if (loading) {
    return <ActivitiesSkeleton />;
  }

  return (
    <div className="space-y-6">
      <ActivitiesHeader
        selectedCount={selectedIds.length}
        bulkAvailability={bulkAvailability}
        onBulkAction={handleBulkActionRequest}
      />
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
        <ActivitiesCardsGrid
          rows={pagination.items}
          page={pagination.page}
          totalPages={pagination.totalPages}
          totalItems={pagination.totalItems}
          startIndex={pagination.startIndex}
          endIndex={pagination.endIndex}
          selectedIds={selectedIds}
          onSelectionChange={setSelectedIds}
          onPageChange={setPage}
          onVisibilityToggle={handleVisibilityToggle}
          onPreview={handlePreview}
          onShareActivity={handleShare}
          onShareClub={() => setShareClubOpen(true)}
          onArchive={(row) => void handleArchive(row)}
          onDelete={handleDeleteRequest}
          onToast={(message) => setActionMessage(message)}
        />
      )}

      <SessionDeleteDialog
        open={Boolean(deleteTarget)}
        title="Delete session?"
        hasBookings={deleteHasBookings}
        loading={actionLoading}
        onConfirmDelete={() => void handleDeleteConfirm()}
        onArchiveInstead={() => {
          if (deleteTarget) {
            void handleArchive(deleteTarget);
          }
        }}
        onCancel={() => setDeleteTarget(null)}
      />

      <ConfirmDialog
        open={bulkConfirmAction !== null}
        title={bulkConfirmTitle}
        description={bulkConfirmDescription}
        confirmLabel={bulkConfirmLabel}
        onConfirm={() => void handleBulkConfirm()}
        onCancel={() => setBulkConfirmAction(null)}
      />

      {shareRow && profile ? (
        <ShareActivityModal
          open={shareOpen}
          onClose={() => {
            setShareOpen(false);
            setShareRow(null);
          }}
          activityId={shareRow.id}
          activityTitle={shareRow.title}
          published={shareRow.session.published}
          status={shareRow.status}
          clubName={profile.clubName}
          logoUrl={profile.logoUrl}
          primaryColor={profile.branding?.primaryColor}
          secondaryColor={profile.branding?.secondaryColor}
        />
      ) : null}

      {profile ? (
        <ShareClubModal
          open={shareClubOpen}
          onClose={() => setShareClubOpen(false)}
          clubName={profile.clubName}
          slug={profile.publicSlug}
          providerId={profile.providerId}
          logoUrl={profile.logoUrl}
          primaryColor={profile.branding?.primaryColor}
          secondaryColor={profile.branding?.secondaryColor}
          visibility={profile.visibility}
          published={profile.published}
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
