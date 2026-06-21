"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";
import { DemoDataBadge } from "@/components/club/DemoDataBadge";
import { PageHeader } from "@/components/club/PageHeader";
import { DashboardSection } from "@/components/club/dashboard/DashboardCards";
import { ConfirmDialog } from "@/components/club/ConfirmDialog";
import { PaginationControls } from "@/components/ui/PaginationControls";
import { getCurrentClubRole, roleHasPermission } from "@/lib/club-team";
import {
  archiveDiscount,
  createDiscount,
  createEarlyBirdDiscount,
  createSiblingDiscount,
  duplicateDiscount,
  filterDiscounts,
  getClubDiscounts,
  getDiscountMetrics,
  getDiscountRedemptions,
  pauseDiscount,
  updateDiscount,
  updateEarlyBirdDiscount,
  updateSiblingDiscount,
  type ClubDiscount,
  type DiscountFilters,
  type DiscountFormInput,
  type EarlyBirdDiscountFormInput,
  type SiblingDiscountFormInput,
} from "@/lib/club-discounts";
import { paginateItems } from "@/lib/pagination";
import { isClubDemoRoute } from "@/lib/club-demo-mode";
import { DiscountOverviewCards } from "./DiscountOverviewCards";
import { DiscountsTable } from "./DiscountsTable";
import { DiscountFormModal } from "./DiscountFormModal";
import { AutoDiscountFormModal } from "./AutoDiscountFormModal";
import { DiscountToolsSection } from "./DiscountToolsSection";
import {
  getDiscountTool,
  type DiscountToolId,
} from "@/lib/club-discounts/presets";

export function DiscountsPage() {
  const pathname = usePathname();
  const isDemoExperience = isClubDemoRoute(pathname);
  const role = getCurrentClubRole();
  const canView = roleHasPermission(role, "view_discounts");
  const canManage = roleHasPermission(role, "manage_discounts");

  const [refreshKey, setRefreshKey] = useState(0);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<DiscountFilters>({
    query: "",
    status: "all",
    type: "all",
  });
  const [formOpen, setFormOpen] = useState(false);
  const [autoFormOpen, setAutoFormOpen] = useState(false);
  const [autoFormKind, setAutoFormKind] = useState<"sibling" | "early_bird">(
    "sibling",
  );
  const [formPreset, setFormPreset] = useState<
    Partial<DiscountFormInput> | undefined
  >(undefined);
  const [formCreateTitle, setFormCreateTitle] = useState<string | undefined>(
    undefined,
  );
  const [editingDiscount, setEditingDiscount] = useState<ClubDiscount | null>(
    null,
  );
  const [archiveTarget, setArchiveTarget] = useState<ClubDiscount | null>(null);

  const discounts = useMemo(() => {
    void refreshKey;
    return getClubDiscounts();
  }, [refreshKey]);

  const redemptions = useMemo(() => {
    void refreshKey;
    return getDiscountRedemptions();
  }, [refreshKey]);

  const metrics = useMemo(
    () => getDiscountMetrics(discounts, redemptions),
    [discounts, redemptions],
  );

  const filtered = useMemo(
    () => filterDiscounts(discounts, filters),
    [discounts, filters],
  );

  const pagination = useMemo(
    () => paginateItems(filtered, page, 8),
    [filtered, page],
  );

  function refresh() {
    setRefreshKey((current) => current + 1);
  }

  function openCreateForm(toolId?: DiscountToolId) {
    setEditingDiscount(null);

    if (toolId === "sibling" || toolId === "early_bird") {
      const tool = getDiscountTool(toolId);
      setAutoFormKind(toolId);
      setFormCreateTitle(tool?.createTitle);
      setAutoFormOpen(true);
      return;
    }

    if (toolId) {
      const tool = getDiscountTool(toolId);
      setFormPreset(tool?.preset);
      setFormCreateTitle(tool?.createTitle);
    } else {
      setFormPreset(undefined);
      setFormCreateTitle(undefined);
    }

    setFormOpen(true);
  }

  function openEditForm(discount: ClubDiscount) {
    setEditingDiscount(discount);
    setFormPreset(undefined);
    setFormCreateTitle(undefined);

    if (discount.kind === "sibling" || discount.kind === "early_bird") {
      setAutoFormKind(discount.kind);
      setAutoFormOpen(true);
      return;
    }

    setFormOpen(true);
  }

  function handleSave(input: DiscountFormInput) {
    if (editingDiscount) {
      updateDiscount(editingDiscount.id, input);
    } else {
      createDiscount(input);
    }
    refresh();
  }

  function handleSaveSibling(input: SiblingDiscountFormInput) {
    if (editingDiscount?.kind === "sibling") {
      updateSiblingDiscount(editingDiscount.id, input);
    } else {
      createSiblingDiscount(input);
    }
    refresh();
  }

  function handleSaveEarlyBird(input: EarlyBirdDiscountFormInput) {
    if (editingDiscount?.kind === "early_bird") {
      updateEarlyBirdDiscount(editingDiscount.id, input);
    } else {
      createEarlyBirdDiscount(input);
    }
    refresh();
  }

  function handleDuplicate(discount: ClubDiscount) {
    duplicateDiscount(discount.id);
    refresh();
  }

  function handlePause(discount: ClubDiscount) {
    pauseDiscount(discount.id);
    refresh();
  }

  function handleArchiveConfirm() {
    if (!archiveTarget) {
      return;
    }

    archiveDiscount(archiveTarget.id);
    setArchiveTarget(null);
    refresh();
  }

  if (!canView) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Discounts"
          description="Create and manage promo codes for your club activities."
        />
        <div className="rounded-2xl border border-zinc-200/80 bg-white px-6 py-14 text-center shadow-sm">
          <h2 className="text-lg font-semibold text-zinc-900">Access restricted</h2>
          <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-zinc-500">
            Your role does not include access to club discounts. Contact a manager
            or owner if you need to create or manage promo codes.
          </p>
          <Link
            href="/club/dashboard"
            className="mt-6 inline-flex rounded-xl bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-zinc-800"
          >
            Back to dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Discounts"
        description="Create promo codes, track redemptions, and preview how discounts appear at checkout."
        action={
          isDemoExperience || canManage ? (
            <div className="flex flex-wrap items-center gap-3">
              {isDemoExperience ? <DemoDataBadge /> : null}
              {canManage ? (
                <button
                  type="button"
                  onClick={() => openCreateForm()}
                  className="inline-flex rounded-xl bg-teal-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-teal-700"
                >
                  Create discount
                </button>
              ) : null}
            </div>
          ) : undefined
        }
      />

      <DiscountOverviewCards metrics={metrics} />

      <div className="rounded-xl border border-teal-100 bg-teal-50/70 px-4 py-3 text-sm leading-6 text-teal-900">
        Each code is unique to your club. Redemptions are recorded with the parent,
        booking reference, and amount discounted — shown clearly at checkout and on
        receipts.
      </div>

      {discounts.length === 0 ? (
        <div className="overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-sm">
          <div className="px-6 py-14 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-teal-50 text-xl text-teal-600">
              %
            </div>
            <h3 className="mt-4 text-base font-semibold text-zinc-900">
              No discounts yet
            </h3>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-zinc-500">
              Create promo codes and discounts to encourage bookings.
            </p>
            {canManage ? (
              <button
                type="button"
                onClick={() => openCreateForm()}
                className="mt-6 inline-flex rounded-xl bg-teal-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-teal-700"
              >
                Create discount
              </button>
            ) : null}
          </div>
        </div>
      ) : (
        <>
          <div className="rounded-2xl border border-zinc-200/80 bg-white p-4 shadow-sm sm:p-5">
            <div className="grid gap-3 lg:grid-cols-3">
              <label className="block text-xs font-medium text-zinc-500 lg:col-span-1">
                Search name or code
                <input
                  type="search"
                  value={filters.query}
                  onChange={(event) => {
                    setFilters((current) => ({
                      ...current,
                      query: event.target.value,
                    }));
                    setPage(1);
                  }}
                  placeholder="Search by name or code"
                  className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm"
                />
              </label>
              <label className="block text-xs font-medium text-zinc-500">
                Status
                <select
                  value={filters.status}
                  onChange={(event) => {
                    setFilters((current) => ({
                      ...current,
                      status: event.target.value as DiscountFilters["status"],
                    }));
                    setPage(1);
                  }}
                  className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm"
                >
                  <option value="all">All statuses</option>
                  <option value="active">Active</option>
                  <option value="paused">Paused</option>
                  <option value="scheduled">Scheduled</option>
                  <option value="expired">Expired</option>
                  <option value="inactive">Inactive</option>
                  <option value="archived">Archived</option>
                </select>
              </label>
              <label className="block text-xs font-medium text-zinc-500">
                Type
                <select
                  value={filters.type}
                  onChange={(event) => {
                    setFilters((current) => ({
                      ...current,
                      type: event.target.value as DiscountFilters["type"],
                    }));
                    setPage(1);
                  }}
                  className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm"
                >
                  <option value="all">All types</option>
                  <option value="percentage">Percentage</option>
                  <option value="fixed">Fixed amount</option>
                </select>
              </label>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-sm">
            {pagination.items.length === 0 ? (
              <div className="px-6 py-14 text-center">
                <h3 className="text-base font-semibold text-zinc-900">
                  No matching discounts
                </h3>
                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-zinc-500">
                  Try adjusting your search or filters.
                </p>
              </div>
            ) : (
              <>
                <DiscountsTable
                  discounts={pagination.items}
                  canManage={canManage}
                  onEdit={openEditForm}
                  onDuplicate={handleDuplicate}
                  onPause={handlePause}
                  onArchive={setArchiveTarget}
                />
                <PaginationControls
                  page={pagination.page}
                  totalPages={pagination.totalPages}
                  totalItems={pagination.totalItems}
                  startIndex={pagination.startIndex}
                  endIndex={pagination.endIndex}
                  onPageChange={setPage}
                />
              </>
            )}
          </div>
        </>
      )}

      <DashboardSection
        title="Discount tools"
        description="Choose the type of offer you want to create."
      >
        <DiscountToolsSection
          canManage={canManage}
          onCreateTool={(toolId) => openCreateForm(toolId)}
        />
      </DashboardSection>

      <DiscountFormModal
        open={formOpen}
        discount={
          editingDiscount?.kind === "promo" || !editingDiscount?.kind
            ? editingDiscount
            : null
        }
        existingDiscounts={discounts}
        preset={formPreset}
        createTitle={formCreateTitle}
        onClose={() => {
          setFormOpen(false);
          setEditingDiscount(null);
          setFormPreset(undefined);
          setFormCreateTitle(undefined);
        }}
        onSubmit={handleSave}
      />

      <AutoDiscountFormModal
        open={autoFormOpen}
        kind={autoFormKind}
        discount={
          editingDiscount?.kind === "sibling" ||
          editingDiscount?.kind === "early_bird"
            ? editingDiscount
            : null
        }
        createTitle={formCreateTitle}
        onClose={() => {
          setAutoFormOpen(false);
          setEditingDiscount(null);
          setFormCreateTitle(undefined);
        }}
        onSubmitSibling={handleSaveSibling}
        onSubmitEarlyBird={handleSaveEarlyBird}
      />

      <ConfirmDialog
        open={archiveTarget !== null}
        title="Archive discount?"
        description={`"${archiveTarget?.name ?? "This discount"}" will be archived and hidden from active lists. Existing redemption records are kept.`}
        confirmLabel="Archive"
        onConfirm={handleArchiveConfirm}
        onCancel={() => setArchiveTarget(null)}
      />
    </div>
  );
}
