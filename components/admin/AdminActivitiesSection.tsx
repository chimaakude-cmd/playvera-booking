"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/club/PageHeader";
import { PaginationControls } from "@/components/ui/PaginationControls";
import { adminActorHeaders } from "@/lib/admin-users/api-auth";
import { adminEnvMissingLabel } from "@/lib/admin/data-source";
import {
  ACTIVITY_STATUS_LABELS,
  canManageActivitiesAdmin,
  getAdminSession,
  type AdminActivity,
  type AdminActivityProviderOption,
  type AdminActivityUpdatePayload,
} from "@/lib/admin";
import { useModalDismiss } from "@/lib/hooks/use-modal-dismiss";
import { paginateItems } from "@/lib/pagination";

type Props = {
  activities: AdminActivity[];
  providers: AdminActivityProviderOption[];
  dataSource: "supabase" | "env_missing";
};

const DAY_OPTIONS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
] as const;

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 0,
  }).format(value);
}

function StatusBadge({ status }: { status: AdminActivity["status"] }) {
  const styles: Record<AdminActivity["status"], string> = {
    published: "bg-emerald-50 text-emerald-700",
    unpublished: "bg-zinc-100 text-zinc-600",
    paused: "bg-amber-50 text-amber-800",
    cancelled: "bg-rose-50 text-rose-700",
    draft: "bg-zinc-100 text-zinc-600",
  };

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${styles[status]}`}
    >
      {ACTIVITY_STATUS_LABELS[status]}
    </span>
  );
}

type DeleteActivityModalProps = {
  activity: AdminActivity | null;
  open: boolean;
  deleting: boolean;
  error: string | null;
  onCancel: () => void;
  onConfirm: () => void;
};

function DeleteActivityModal({
  activity,
  open,
  deleting,
  error,
  onCancel,
  onConfirm,
}: DeleteActivityModalProps) {
  useModalDismiss(open, onCancel);

  if (!open || !activity) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close"
        className="absolute inset-0 bg-zinc-900/40"
        onClick={onCancel}
      />
      <div className="relative w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl">
        <h3 className="text-base font-semibold text-zinc-900">Delete activity?</h3>
        <p className="mt-2 text-sm text-zinc-600">
          Are you sure you want to delete this activity? This cannot be undone.
        </p>
        <p className="mt-2 text-xs text-zinc-500">{activity.title}</p>
        {error ? <p className="mt-2 text-xs text-rose-600">{error}</p> : null}
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={deleting}
            className="rounded-lg border border-zinc-200 px-4 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={deleting}
            className="rounded-lg bg-rose-600 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-700 disabled:opacity-50"
          >
            {deleting ? "Deleting…" : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}

type EditActivityModalProps = {
  activity: AdminActivity;
  providers: AdminActivityProviderOption[];
  open: boolean;
  saving: boolean;
  error: string | null;
  onClose: () => void;
  onSave: (payload: AdminActivityUpdatePayload) => void;
};

function EditActivityModal({
  activity,
  providers,
  open,
  saving,
  error,
  onClose,
  onSave,
}: EditActivityModalProps) {
  const [title, setTitle] = useState(activity.title);
  const [providerId, setProviderId] = useState(activity.providerId);
  const [day, setDay] = useState(activity.dayRaw);
  const [startTime, setStartTime] = useState(activity.startTime);
  const [endTime, setEndTime] = useState(activity.endTime);
  const [venue, setVenue] = useState(activity.venue);
  const [capacity, setCapacity] = useState(String(activity.capacity));
  const [price, setPrice] = useState(String(activity.price));
  const [status, setStatus] = useState<
    "draft" | "published" | "unpublished"
  >(
    activity.status === "published" || activity.status === "unpublished"
      ? activity.status
      : "draft",
  );
  const [visibility, setVisibility] = useState(activity.visibility);

  useModalDismiss(open, onClose);

  if (!open) {
    return null;
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    onSave({
      title,
      providerId,
      day,
      startTime,
      endTime,
      venue,
      capacity: Number(capacity),
      price: Number(price),
      status,
      visibility,
    });
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close"
        className="absolute inset-0 bg-zinc-900/40"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl"
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <h3 className="text-base font-semibold text-zinc-900">Edit activity</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-2 py-1 text-sm text-zinc-500 hover:bg-zinc-100"
          >
            Close
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block">
            <span className="text-xs font-medium text-zinc-600">Activity name</span>
            <input
              required
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm"
            />
          </label>

          <label className="block">
            <span className="text-xs font-medium text-zinc-600">Provider</span>
            <select
              required
              value={providerId}
              onChange={(event) => setProviderId(event.target.value)}
              className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm"
            >
              {providers.map((provider) => (
                <option key={provider.id} value={provider.id}>
                  {provider.name}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="text-xs font-medium text-zinc-600">Schedule / day</span>
            <select
              required
              value={day}
              onChange={(event) => setDay(event.target.value)}
              className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm"
            >
              {DAY_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option.charAt(0).toUpperCase() + option.slice(1)}
                </option>
              ))}
            </select>
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="text-xs font-medium text-zinc-600">Start time</span>
              <input
                required
                type="time"
                value={startTime}
                onChange={(event) => setStartTime(event.target.value)}
                className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm"
              />
            </label>
            <label className="block">
              <span className="text-xs font-medium text-zinc-600">End time</span>
              <input
                required
                type="time"
                value={endTime}
                onChange={(event) => setEndTime(event.target.value)}
                className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm"
              />
            </label>
          </div>

          <label className="block">
            <span className="text-xs font-medium text-zinc-600">Venue</span>
            <input
              required
              value={venue}
              onChange={(event) => setVenue(event.target.value)}
              className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm"
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="text-xs font-medium text-zinc-600">Capacity</span>
              <input
                required
                type="number"
                min={1}
                value={capacity}
                onChange={(event) => setCapacity(event.target.value)}
                className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm"
              />
            </label>
            <label className="block">
              <span className="text-xs font-medium text-zinc-600">Price (£)</span>
              <input
                required
                type="number"
                min={0}
                step={0.01}
                value={price}
                onChange={(event) => setPrice(event.target.value)}
                className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm"
              />
            </label>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="text-xs font-medium text-zinc-600">Status</span>
              <select
                value={status}
                onChange={(event) =>
                  setStatus(
                    event.target.value as "draft" | "published" | "unpublished",
                  )
                }
                className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm"
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="unpublished">Unpublished</option>
              </select>
            </label>
            <label className="block">
              <span className="text-xs font-medium text-zinc-600">Visibility</span>
              <select
                value={visibility}
                onChange={(event) =>
                  setVisibility(event.target.value as AdminActivity["visibility"])
                }
                className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm"
              >
                <option value="public">Public</option>
                <option value="hidden">Private</option>
              </select>
            </label>
          </div>

          {error ? <p className="text-xs text-rose-600">{error}</p> : null}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="rounded-xl border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800 disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

async function patchActivity(
  activityId: string,
  payload: AdminActivityUpdatePayload,
  headers: Record<string, string>,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const response = await fetch(`/api/admin/activities/${activityId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { error?: string } | null;
    return { ok: false, error: body?.error ?? "Update failed." };
  }

  return { ok: true };
}

async function deleteActivityRequest(
  activityId: string,
  headers: Record<string, string>,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const response = await fetch(`/api/admin/activities/${activityId}`, {
    method: "DELETE",
    headers,
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { error?: string } | null;
    return { ok: false, error: body?.error ?? "Delete failed." };
  }

  return { ok: true };
}

export function AdminActivitiesSection({
  activities,
  providers,
  dataSource,
}: Props) {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [editingActivity, setEditingActivity] = useState<AdminActivity | null>(
    null,
  );
  const [deletingActivity, setDeletingActivity] = useState<AdminActivity | null>(
    null,
  );
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const session = getAdminSession();
  const canManage = session ? canManageActivitiesAdmin(session.role) : false;
  const actorHeaders = session
    ? adminActorHeaders({
        adminId: session.adminId,
        email: session.email,
        name: session.name,
        role: session.role,
      })
    : {};

  const pagination = useMemo(
    () => paginateItems(activities, page, 10),
    [activities, page],
  );

  async function handleSave(payload: AdminActivityUpdatePayload) {
    if (!editingActivity || !session) {
      return;
    }

    setSaving(true);
    setActionError(null);

    const result = await patchActivity(editingActivity.id, payload, actorHeaders);
    setSaving(false);

    if (!result.ok) {
      setActionError(result.error);
      return;
    }

    setEditingActivity(null);
    router.refresh();
  }

  async function handleDeleteConfirm() {
    if (!deletingActivity || !session) {
      return;
    }

    setDeleting(true);
    setActionError(null);

    const result = await deleteActivityRequest(deletingActivity.id, actorHeaders);
    setDeleting(false);

    if (!result.ok) {
      setActionError(result.error);
      return;
    }

    setDeletingActivity(null);
    router.refresh();
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Activities"
        description="All sessions and activities across providers on the Activora marketplace."
        action={
          dataSource === "env_missing" ? (
            <span className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-xs font-medium text-amber-800">
              {adminEnvMissingLabel()}
            </span>
          ) : undefined
        }
      />

      <div className="overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-zinc-100">
            <thead>
              <tr className="bg-zinc-50/80">
                {[
                  "Activity",
                  "Provider",
                  "Schedule",
                  "Venue",
                  "Capacity",
                  "Price",
                  "Status",
                  "Actions",
                ].map((heading) => (
                  <th
                    key={heading}
                    scope="col"
                    className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-zinc-500"
                  >
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {pagination.items.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-12 text-center text-sm text-zinc-500"
                  >
                    No activities found.
                  </td>
                </tr>
              ) : (
                pagination.items.map((activity) => (
                  <tr key={activity.id} className="hover:bg-zinc-50/50">
                    <td className="px-4 py-4">
                      <Link
                        href={`/admin/activities/${activity.id}`}
                        className="text-sm font-medium text-violet-700 hover:text-violet-900"
                      >
                        {activity.title}
                      </Link>
                      <p className="text-xs text-zinc-500">
                        {activity.visibility === "public" ? "Public" : "Private"}
                      </p>
                    </td>
                    <td className="px-4 py-4 text-sm text-zinc-700">
                      {activity.providerName}
                    </td>
                    <td className="px-4 py-4 text-sm text-zinc-700">
                      {activity.day}
                      <span className="block text-xs text-zinc-500">
                        {activity.startTime}–{activity.endTime}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-sm text-zinc-700">
                      {activity.venue}
                    </td>
                    <td className="px-4 py-4 text-sm text-zinc-700">
                      {activity.bookingsCount}/{activity.capacity}
                    </td>
                    <td className="px-4 py-4 text-sm text-zinc-700">
                      {activity.price === 0
                        ? "Free"
                        : formatCurrency(activity.price)}
                    </td>
                    <td className="px-4 py-4">
                      <StatusBadge status={activity.status} />
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-wrap gap-2">
                        <Link
                          href={`/admin/activities/${activity.id}`}
                          className="rounded-lg border border-zinc-200 px-2.5 py-1 text-xs font-medium text-zinc-600 hover:bg-zinc-50"
                        >
                          View
                        </Link>
                        {canManage ? (
                          <>
                            <button
                              type="button"
                              onClick={() => {
                                setActionError(null);
                                setEditingActivity(activity);
                              }}
                              className="rounded-lg border border-zinc-200 px-2.5 py-1 text-xs font-medium text-zinc-600 hover:bg-zinc-50"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setActionError(null);
                                setDeletingActivity(activity);
                              }}
                              className="rounded-lg border border-rose-200 px-2.5 py-1 text-xs font-medium text-rose-700 hover:bg-rose-50"
                            >
                              Delete
                            </button>
                          </>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          {pagination.totalItems > 0 ? (
            <PaginationControls
              page={pagination.page}
              totalPages={pagination.totalPages}
              totalItems={pagination.totalItems}
              startIndex={pagination.startIndex}
              endIndex={pagination.endIndex}
              onPageChange={setPage}
            />
          ) : null}
        </div>
      </div>

      {editingActivity ? (
        <EditActivityModal
          key={editingActivity.id}
          activity={editingActivity}
          providers={providers}
          open
          saving={saving}
          error={actionError}
          onClose={() => {
            setEditingActivity(null);
            setActionError(null);
          }}
          onSave={handleSave}
        />
      ) : null}

      <DeleteActivityModal
        activity={deletingActivity}
        open={Boolean(deletingActivity)}
        deleting={deleting}
        error={actionError}
        onCancel={() => {
          setDeletingActivity(null);
          setActionError(null);
        }}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}
