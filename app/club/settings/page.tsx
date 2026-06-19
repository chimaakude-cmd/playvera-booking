"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ChangePasswordSection } from "@/components/auth/ChangePasswordSection";
import { SavedVenuesList } from "@/components/club/SavedVenuesList";
import { LanguageSettingsSection } from "@/components/i18n/LanguageSettingsSection";
import { PageHeader } from "@/components/club/PageHeader";
import { LoadingState } from "@/components/club/LoadingState";
import { deleteProviderVenue, loadProviderVenues } from "@/lib/data";
import {
  getClubProfile,
  getPublicClubPath,
  type ClubProfile,
} from "@/lib/club-profile";
import type { ProviderVenue } from "@/lib/provider-venues";

function SettingsHubCard({
  title,
  description,
  href,
  cta,
  badge,
}: {
  title: string;
  description: string;
  href: string;
  cta: string;
  badge?: string;
}) {
  return (
    <Link
      href={href}
      className="group rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md sm:p-6"
    >
      <div className="flex items-start justify-between gap-3">
        <h2 className="text-base font-semibold text-zinc-900">{title}</h2>
        {badge ? (
          <span className="rounded-full bg-teal-50 px-2.5 py-0.5 text-xs font-semibold text-teal-700">
            {badge}
          </span>
        ) : null}
      </div>
      <p className="mt-2 text-sm leading-6 text-zinc-500">{description}</p>
      <p className="mt-4 text-sm font-semibold text-teal-700 group-hover:text-teal-800">
        {cta} →
      </p>
    </Link>
  );
}

function SavedVenuesSection() {
  const [venues, setVenues] = useState<ProviderVenue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingVenueId, setDeletingVenueId] = useState<string | null>(null);

  useEffect(() => {
    async function loadVenues() {
      setLoading(true);
      setError(null);

      try {
        setVenues(await loadProviderVenues());
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Could not load saved venues.",
        );
      } finally {
        setLoading(false);
      }
    }

    void loadVenues();
  }, []);

  async function handleDeleteVenue(venueId: string) {
    setDeletingVenueId(venueId);
    setError(null);

    try {
      await deleteProviderVenue(venueId);
      setVenues((current) => current.filter((venue) => venue.id !== venueId));
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Could not delete venue.",
      );
    } finally {
      setDeletingVenueId(null);
    }
  }

  return (
    <section className="space-y-4 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
      <div>
        <h2 className="text-base font-semibold text-zinc-900">Saved venues</h2>
        <p className="mt-1 text-sm text-zinc-500">
          Reuse venue addresses when creating sessions. Profile locations are
          managed separately in Club profile.
        </p>
      </div>

      {loading ? (
        <p className="text-sm text-zinc-500">Loading saved venues...</p>
      ) : null}

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      {!loading ? (
        <SavedVenuesList
          venues={venues}
          onDelete={handleDeleteVenue}
          deletingVenueId={deletingVenueId}
          showEditPlaceholder
          compact
        />
      ) : null}
    </section>
  );
}

export default function ClubSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<ClubProfile | null>(null);

  useEffect(() => {
    setProfile(getClubProfile());
    setLoading(false);
  }, []);

  if (loading || !profile) {
    return <LoadingState message="Loading settings..." />;
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <PageHeader
        title="Settings"
        description="Manage your club profile, venues, and account preferences."
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <SettingsHubCard
          title="Club profile"
          description="Logo, branding, locations, social links, and your public parent-facing page."
          href="/club/settings/profile"
          cta="Open club profile"
          badge={profile.published ? "Published" : "Draft"}
        />
        <SettingsHubCard
          title="Edit club profile"
          description="Update all eight profile sections including SEO and customer view toggles."
          href="/club/settings/profile/edit"
          cta="Edit profile"
        />
        {profile.published ? (
          <SettingsHubCard
            title="Public club page"
            description="Preview exactly what parents see when they discover your club."
            href={getPublicClubPath(profile.publicSlug)}
            cta="View public page"
          />
        ) : null}
        <SettingsHubCard
          title="Website widget"
          description="Embed bookable activities on your club website with a customisable iframe widget."
          href="/club/growth/website-widget"
          cta="Configure widget"
        />
        <SettingsHubCard
          title="Booking questions"
          description="Enable platform defaults and add custom questions for parent registrations."
          href="/club/settings/booking-questions"
          cta="Manage questions"
        />
        <SettingsHubCard
          title="Report a bug"
          description="Something not working? Tell the Activora team and we'll investigate."
          href="/report-bug?url=/club/settings"
          cta="Report a bug"
        />
        <SettingsHubCard
          title="Subscription & billing"
          description="View your plan, platform fee, features, and upgrade path."
          href="/club/settings/subscription"
          cta="Manage subscription"
        />
        <SettingsHubCard
          title="Account & team access"
          description="Invite staff, assign Coach, Administrator, or Manager roles, and manage team permissions."
          href="/club/settings/team"
          cta="Manage team"
        />
        <SettingsHubCard
          title="Stripe Connect"
          description="Connect Stripe to receive payouts. Platform fee depends on your subscription plan."
          href="/club/finance?tab=stripe"
          cta="Open in Finance"
        />
        <SettingsHubCard
          title="Fee handling"
          description="Platform fee, Stripe processing, and who pays — club, parent, or split."
          href="/club/finance?tab=fees"
          cta="Open in Finance"
        />
        <SettingsHubCard
          title="VAT settings"
          description="VAT registration, threshold monitoring, and how VAT appears on bookings and invoices."
          href="/club/finance?tab=vat"
          cta="Open in Finance"
        />
        <SettingsHubCard
          title="Accountant access"
          description="Invite your accountant to view finance reports, invoices, and exports."
          href="/club/finance?tab=accountant"
          cta="Open in Finance"
        />
      </div>

      <LanguageSettingsSection />

      <ChangePasswordSection />

      <SavedVenuesSection />
    </div>
  );
}
