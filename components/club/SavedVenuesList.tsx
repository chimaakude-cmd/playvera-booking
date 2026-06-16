"use client";

import type { ProviderVenue } from "@/lib/provider-venues";

type SavedVenuesListProps = {
  venues: ProviderVenue[];
  selectedVenueId?: string | null;
  onSelect?: (venue: ProviderVenue) => void;
  onDelete: (venueId: string) => void | Promise<void>;
  deletingVenueId?: string | null;
  showEditPlaceholder?: boolean;
  compact?: boolean;
};

export function SavedVenuesList({
  venues,
  selectedVenueId,
  onSelect,
  onDelete,
  deletingVenueId,
  showEditPlaceholder = false,
  compact = false,
}: SavedVenuesListProps) {
  if (venues.length === 0) {
    return (
      <p className="text-sm text-zinc-600">
        No saved venues yet. Add a new address.
      </p>
    );
  }

  return (
    <div className={`grid gap-3 ${compact ? "sm:grid-cols-1" : "sm:grid-cols-2"}`}>
      {venues.map((venue) => {
        const isSelected = selectedVenueId === venue.id;
        const isDeleting = deletingVenueId === venue.id;

        return (
          <div
            key={venue.id}
            className={`rounded-xl border p-4 transition-colors ${
              isSelected
                ? "border-pink-300 bg-pink-50"
                : "border-zinc-200 bg-white hover:border-zinc-300"
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <button
                type="button"
                onClick={() => onSelect?.(venue)}
                disabled={!onSelect}
                className={`min-w-0 flex-1 text-left ${
                  onSelect ? "cursor-pointer" : "cursor-default"
                }`}
              >
                <p className="text-sm font-semibold text-zinc-900">
                  {venue.venueName}
                </p>
                <p className="mt-1 text-sm text-zinc-600">
                  {[venue.townCity, venue.postcode].filter(Boolean).join(" · ")}
                </p>
                {!compact ? (
                  <p className="mt-1 text-xs text-zinc-500">{venue.addressLine1}</p>
                ) : null}
              </button>

              <div className="flex shrink-0 flex-col gap-2">
                {showEditPlaceholder ? (
                  <button
                    type="button"
                    disabled
                    className="rounded-md border border-zinc-200 px-2.5 py-1 text-xs font-medium text-zinc-400"
                    title="Venue editing coming soon"
                  >
                    Edit
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={() => void onDelete(venue.id)}
                  disabled={isDeleting}
                  className="rounded-md border border-red-200 px-2.5 py-1 text-xs font-medium text-red-700 transition-colors hover:bg-red-50 disabled:opacity-60"
                >
                  {isDeleting ? "Deleting..." : "Delete"}
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
