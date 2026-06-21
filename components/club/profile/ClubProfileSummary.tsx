"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { ClubProfileHealthBadge } from "@/components/club/profile/ClubProfileHealthBadge";
import type { ClubProfile } from "@/lib/club-profile";
import type { ClubProfileHealth } from "@/lib/club-profile/health";
import {
  formatClubAddress,
  getMainClubLocation,
  getPublicClubPath,
  socialPlatformLabels,
  verificationStatusLabels,
} from "@/lib/club-profile";

function SummaryCard({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-sm sm:p-6">
      <h2 className="text-base font-semibold text-zinc-900">{title}</h2>
      <div className="mt-4 space-y-3 text-sm text-zinc-600">{children}</div>
    </section>
  );
}

export function ClubProfileSummary({
  profile,
  health,
}: {
  profile: ClubProfile;
  health: ClubProfileHealth;
}) {
  const mainLocation = getMainClubLocation(profile);
  const publicSlug = health.slug ?? profile.publicSlug;

  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-sm">
        <div className="h-36 bg-gradient-to-br from-teal-600 via-teal-500 to-violet-500 sm:h-44" />
        <div className="relative px-5 pb-5 sm:px-6">
          <div className="-mt-10 flex h-20 w-20 items-center justify-center rounded-2xl border-4 border-white bg-zinc-100 text-2xl font-bold text-zinc-500 shadow-sm">
            {profile.clubName.charAt(0)}
          </div>
          <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-2xl font-semibold text-zinc-900">
                  {profile.clubName}
                </h2>
                {profile.verificationStatus !== "unverified" ? (
                  <span className="rounded-full bg-teal-50 px-2.5 py-0.5 text-xs font-semibold text-teal-700 ring-1 ring-teal-200">
                    {verificationStatusLabels[profile.verificationStatus]}
                  </span>
                ) : (
                  <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-500">
                    {verificationStatusLabels[profile.verificationStatus]}
                  </span>
                )}
              </div>
              <p className="mt-1 text-sm text-zinc-600">{profile.tagline}</p>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-500">
                {profile.shortDescription}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                href="/club/settings/profile/edit"
                className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-zinc-800"
              >
                Edit profile
              </Link>
              {health.isLive && publicSlug ? (
                <Link
                  href={getPublicClubPath(publicSlug)}
                  className="rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-800 transition-colors hover:bg-zinc-50"
                >
                  View public page
                </Link>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <SummaryCard title="About">
          <p>{profile.longDescription}</p>
          <p className="font-medium text-zinc-800">What makes you unique</p>
          <p>{profile.uniqueSellingPoints}</p>
          <p>
            <span className="font-medium text-zinc-800">Categories: </span>
            {profile.categories.join(" · ") || "None selected"}
          </p>
          <p>
            <span className="font-medium text-zinc-800">Age ranges: </span>
            {profile.ageRanges.join(" · ") || "None selected"}
          </p>
        </SummaryCard>

        <SummaryCard title="Contact">
          <p>Email: {profile.contact.email || "—"}</p>
          <p>Phone: {profile.contact.phone || "—"}</p>
          <p>WhatsApp: {profile.contact.whatsapp || "—"}</p>
          <p>Website: {profile.contact.website || "—"}</p>
        </SummaryCard>

        <SummaryCard title="Social media">
          {Object.entries(profile.socialLinks).filter(([, url]) => url.trim()).length ===
          0 ? (
            <p>No social links added.</p>
          ) : (
            Object.entries(profile.socialLinks)
              .filter(([, url]) => url.trim())
              .map(([platform, url]) => (
                <p key={platform}>
                  {socialPlatformLabels[platform as keyof typeof socialPlatformLabels]}
                  : link saved
                </p>
              ))
          )}
        </SummaryCard>

        <SummaryCard title="Locations">
          {profile.locations.length === 0 ? (
            <p>No venues added yet.</p>
          ) : (
            profile.locations.map((location) => (
              <div
                key={location.id}
                className="rounded-xl border border-zinc-100 bg-zinc-50/70 px-4 py-3"
              >
                <p className="font-medium text-zinc-900">
                  {location.venueName}
                  {location.isMain ? (
                    <span className="ml-2 text-xs font-semibold uppercase tracking-wide text-teal-700">
                      Main
                    </span>
                  ) : null}
                </p>
                <p className="mt-1">{formatClubAddress(location)}</p>
                <p className="mt-1 text-xs text-zinc-500">
                  Serves {location.radiusMiles} mile radius
                </p>
              </div>
            ))
          )}
        </SummaryCard>

        <SummaryCard title="Branding & visibility">
          <p>
            Colours:{" "}
            <span className="inline-flex items-center gap-2">
              <span
                className="inline-block h-4 w-4 rounded-full ring-1 ring-zinc-200"
                style={{ backgroundColor: profile.branding.primaryColor }}
              />
              {profile.branding.primaryColor}
              <span
                className="inline-block h-4 w-4 rounded-full ring-1 ring-zinc-200"
                style={{ backgroundColor: profile.branding.secondaryColor }}
              />
              {profile.branding.secondaryColor}
            </span>
          </p>
          <p>Button style: {profile.branding.buttonStyle}</p>
          <p>Card style: {profile.branding.cardStyle}</p>
          <p>Font preset: {profile.branding.fontPreset}</p>
          <p>
            Public URL:{" "}
            {publicSlug ? getPublicClubPath(publicSlug) : "Not set"}
          </p>
          <div className="inline-flex items-center gap-2">
            Status:{" "}
            <ClubProfileHealthBadge health={health} compact />
          </div>
        </SummaryCard>
      </div>

      {mainLocation ? (
        <p className="text-xs text-zinc-500">
          Main venue map pin: {mainLocation.latitude.toFixed(4)},{" "}
          {mainLocation.longitude.toFixed(4)}
        </p>
      ) : null}
    </div>
  );
}
