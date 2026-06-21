"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { PageHeader } from "@/components/club/PageHeader";
import { ShareClubButton } from "@/components/club/share/ShareClubButton";
import { SharePromptBanner } from "@/components/club/share/SharePromptBanner";
import { getClubProfile } from "@/lib/club-profile";
import { DEMO_PROVIDER_ID } from "@/lib/club-widget";
import {
  getPlatformBreakdown,
  getShareMetrics,
  resetLegacyShareMetricsStore,
  type ShareMetrics,
  type SharePlatform,
} from "@/lib/club-share";

const PLATFORM_LABELS: Record<SharePlatform, string> = {
  whatsapp: "WhatsApp",
  facebook: "Facebook",
  instagram: "Instagram",
  x: "X",
  email: "Email",
  linkedin: "LinkedIn",
  messenger: "Messenger",
  telegram: "Telegram",
  sms: "SMS",
  copy_link: "Copy link",
  more: "More",
  pinterest: "Pinterest",
  reddit: "Reddit",
  nextdoor: "Nextdoor",
  teams: "Teams",
  slack: "Slack",
};

export function SharesAnalyticsPage() {
  const pathname = usePathname();
  const profile = getClubProfile();
  const [metrics, setMetrics] = useState<ShareMetrics | null>(null);
  const [platforms, setPlatforms] = useState<
    Array<{ platform: SharePlatform; count: number }>
  >([]);

  useEffect(() => {
    resetLegacyShareMetricsStore();
    setMetrics(getShareMetrics(pathname));
    setPlatforms(getPlatformBreakdown(pathname));
  }, [pathname]);

  if (!profile || !metrics) {
    return null;
  }

  const maxPlatformCount = Math.max(...platforms.map((p) => p.count), 1);

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <PageHeader
        title="Shares"
        description="Track how families discover and share your club profile."
        action={
          <ShareClubButton
            clubName={profile.clubName}
            slug={profile.publicSlug}
            providerId={profile.providerId || DEMO_PROVIDER_ID}
            logoUrl={profile.logoUrl}
            variant="primary"
          />
        }
      />

      <SharePromptBanner
        clubName={profile.clubName}
        slug={profile.publicSlug}
        providerId={profile.providerId || DEMO_PROVIDER_ID}
        logoUrl={profile.logoUrl}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Profile visits" value={metrics.profileVisits} />
        <MetricCard label="QR scans" value={metrics.qrScans} />
        <MetricCard label="Link clicks" value={metrics.linkClicks} />
        <MetricCard
          label="Bookings from shares"
          value={metrics.bookingsFromShares}
        />
      </div>

      <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h2 className="text-base font-semibold text-zinc-900">Top platforms</h2>
        <p className="mt-1 text-sm text-zinc-500">
          Where your club profile is being shared most
        </p>

        {platforms.length === 0 ? (
          <div className="mt-6 rounded-xl border border-dashed border-zinc-200 px-4 py-8 text-center text-sm text-zinc-500">
            No shares yet. Use Share club to get started.
          </div>
        ) : (
          <ul className="mt-6 space-y-3">
            {platforms.map(({ platform, count }) => (
              <li key={platform}>
                <div className="mb-1 flex justify-between text-sm">
                  <span className="font-medium text-zinc-800">
                    {PLATFORM_LABELS[platform]}
                  </span>
                  <span className="text-zinc-500">{count}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-zinc-100">
                  <div
                    className="h-full rounded-full bg-teal-500 transition-all"
                    style={{
                      width: `${Math.round((count / maxPlatformCount) * 100)}%`,
                    }}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}

        {metrics.topPlatform ? (
          <p className="mt-4 text-sm text-zinc-600">
            Top platform:{" "}
            <span className="font-semibold text-teal-700">
              {PLATFORM_LABELS[metrics.topPlatform]}
            </span>
          </p>
        ) : null}
      </section>
    </div>
  );
}

function MetricCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: number;
  hint?: string;
}) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
      <p className="text-sm text-zinc-500">{label}</p>
      <p className="mt-2 text-3xl font-bold tracking-tight text-zinc-900">
        {value.toLocaleString()}
      </p>
      {hint ? (
        <p className="mt-1 text-xs text-zinc-400">{hint}</p>
      ) : null}
    </div>
  );
}
