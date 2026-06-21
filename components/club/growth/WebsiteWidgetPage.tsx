"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  EmbedProviderWidget,
  filterSessionsForWidget,
} from "@/components/embed/EmbedProviderWidget";
import { PageHeader } from "@/components/club/PageHeader";
import { LoadingState } from "@/components/club/LoadingState";
import {
  buildShareContent,
  downloadDataUrl,
  getQrDataUrl,
  nativeShare,
} from "@/lib/club-share";
import {
  DEMO_PROVIDER_ID,
  DEFAULT_WIDGET_SETTINGS,
  getProviderEmbedCode,
  getProviderEmbedUrl,
  getPublicBookingPageUrl,
  getWidgetSettings,
  saveWidgetSettings,
  type ClubWidgetSettings,
  type WidgetActivityScope,
  type WidgetCardStyle,
  type WidgetLayout,
} from "@/lib/club-widget";
import { fetchClubProfileFromApi } from "@/lib/club-profile/client";
import { getClubProfile, getPublicClubPath } from "@/lib/club-profile";
import type { ClubProfile } from "@/lib/club-profile";
import { fetchBookableActivitiesForClub } from "@/lib/sessions/public-client";
import type { ClubSession } from "@/lib/sessions";

const inputClass =
  "mt-2 h-11 w-full rounded-xl border border-zinc-200 bg-white px-4 text-sm text-zinc-900 shadow-sm transition-colors focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20";
const labelClass = "text-sm font-medium text-zinc-700";
const toggleRowClass =
  "flex min-h-11 items-center gap-3 rounded-xl border border-zinc-100 bg-zinc-50/60 px-4 py-2.5 text-sm text-zinc-700 transition-colors hover:bg-zinc-50";

function CheckIcon() {
  return (
    <svg
      className="h-4 w-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2.5}
      aria-hidden
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}

function CopyButton({
  text,
  label,
  variant = "primary",
}: {
  text: string;
  label: string;
  variant?: "primary" | "secondary";
}) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const base =
    variant === "primary"
      ? "bg-teal-600 text-white hover:bg-teal-700"
      : "border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50";

  return (
    <button
      type="button"
      onClick={() => void handleCopy()}
      className={`inline-flex h-10 shrink-0 items-center justify-center gap-1.5 rounded-xl px-4 text-sm font-semibold transition-colors ${base}`}
    >
      {copied ? (
        <>
          <CheckIcon />
          Copied
        </>
      ) : (
        label
      )}
    </button>
  );
}

function PublishingCard({
  title,
  description,
  copyText,
  copyLabel,
  preview,
}: {
  title: string;
  description: string;
  copyText: string;
  copyLabel: string;
  preview?: string;
}) {
  return (
    <div className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold text-zinc-900">{title}</h3>
          <p className="mt-1 text-sm text-zinc-500">{description}</p>
          {preview ? (
            <pre className="mt-3 max-h-24 overflow-hidden text-ellipsis rounded-xl bg-zinc-50 px-3 py-2.5 font-mono text-xs leading-relaxed text-zinc-600">
              {preview}
            </pre>
          ) : null}
        </div>
        <CopyButton text={copyText} label={copyLabel} />
      </div>
    </div>
  );
}

export function WebsiteWidgetPage() {
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<ClubWidgetSettings>(
    DEFAULT_WIDGET_SETTINGS,
  );
  const [sessions, setSessions] = useState<ClubSession[]>([]);
  const [profile, setProfile] = useState<ClubProfile | null>(() => getClubProfile());
  const [providerId, setProviderId] = useState(DEMO_PROVIDER_ID);
  const [fullscreenPreview, setFullscreenPreview] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [qrLoading, setQrLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadWidgetData() {
      setSettings(getWidgetSettings());

      const profileResult = await fetchClubProfileFromApi();
      const resolvedProfile = profileResult.ok
        ? profileResult.profile
        : getClubProfile();
      const resolvedProviderId =
        resolvedProfile?.providerId?.trim() || DEMO_PROVIDER_ID;

      const loadedSessions = await fetchBookableActivitiesForClub(
        resolvedProviderId,
      );

      if (cancelled) {
        return;
      }

      setProfile(resolvedProfile);
      setProviderId(resolvedProviderId);
      setSessions(loadedSessions);
      setLoading(false);
    }

    void loadWidgetData();

    return () => {
      cancelled = true;
    };
  }, []);

  const embedUrl = useMemo(
    () => getProviderEmbedUrl(providerId, settings),
    [providerId, settings],
  );
  const embedCode = useMemo(
    () => getProviderEmbedCode(providerId, settings),
    [providerId, settings],
  );
  const bookingLink = profile
    ? getPublicBookingPageUrl(profile.publicSlug)
    : getPublicBookingPageUrl("playvera-juniors");

  const shareContent = useMemo(
    () =>
      buildShareContent(
        profile?.clubName ?? "Our club",
        embedUrl,
      ),
    [profile?.clubName, embedUrl],
  );

  function updateSettings(patch: Partial<ClubWidgetSettings>) {
    const next = { ...settings, ...patch };
    setSettings(next);
    saveWidgetSettings(next);
    setQrDataUrl(null);
  }

  function toggleActivity(id: string) {
    const ids = settings.selectedActivityIds.includes(id)
      ? settings.selectedActivityIds.filter((x) => x !== id)
      : [...settings.selectedActivityIds, id];
    updateSettings({ selectedActivityIds: ids });
  }

  async function handleGenerateQr() {
    setQrLoading(true);
    try {
      const url = await getQrDataUrl(embedUrl, profile?.logoUrl);
      setQrDataUrl(url);
    } catch {
      setQrDataUrl(null);
    } finally {
      setQrLoading(false);
    }
  }

  function handleDownloadQr() {
    if (!qrDataUrl) {
      return;
    }
    const slug = profile?.publicSlug ?? "widget";
    downloadDataUrl(qrDataUrl, `${slug}-widget-qr.png`);
  }

  async function handleShareWidget() {
    const shared = await nativeShare(shareContent);
    if (!shared) {
      await navigator.clipboard.writeText(embedUrl);
    }
  }

  if (loading) {
    return <LoadingState message="Loading widget settings..." />;
  }

  const previewSessions = filterSessionsForWidget(sessions, settings);

  return (
    <div className="mx-auto w-full max-w-[1400px] space-y-8">
      <PageHeader
        title="Website widget"
        description="Embed your activities anywhere and grow direct bookings."
      />

      <div className="grid gap-8 lg:grid-cols-[minmax(0,35fr)_minmax(0,65fr)] lg:gap-10">
        <aside className="lg:sticky lg:top-8 lg:self-start">
          <section className="space-y-5 rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-sm">
            <div>
              <h2 className="text-base font-semibold text-zinc-900">
                Widget settings
              </h2>
              <p className="mt-1 text-sm text-zinc-500">
                Customise what families see in your embed.
              </p>
            </div>

            <div>
              <label className={labelClass}>Activities to show</label>
              <select
                value={settings.activityScope}
                onChange={(e) =>
                  updateSettings({
                    activityScope: e.target.value as WidgetActivityScope,
                  })
                }
                className={inputClass}
              >
                <option value="all">All activities</option>
                <option value="selected">Selected activities</option>
                <option value="venue">Activities from selected venue</option>
              </select>
            </div>

            {settings.activityScope === "selected" ? (
              <div className="max-h-48 space-y-1 overflow-y-auto rounded-xl border border-zinc-100 bg-zinc-50/40 p-2">
                {sessions.map((session) => (
                  <label
                    key={session.id}
                    className={toggleRowClass}
                  >
                    <input
                      type="checkbox"
                      checked={settings.selectedActivityIds.includes(session.id)}
                      onChange={() => toggleActivity(session.id)}
                      className="h-4 w-4 rounded border-zinc-300 text-teal-600 focus:ring-teal-500"
                    />
                    <span className="truncate">{session.sessionTitle}</span>
                  </label>
                ))}
              </div>
            ) : null}

            {settings.activityScope === "venue" && profile ? (
              <div>
                <label className={labelClass}>Venue</label>
                <select
                  value={settings.venueId ?? ""}
                  onChange={(e) =>
                    updateSettings({ venueId: e.target.value || null })
                  }
                  className={inputClass}
                >
                  <option value="">Select venue</option>
                  {profile.locations.map((loc) => (
                    <option key={loc.id} value={loc.id}>
                      {loc.venueName}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}

            <label className={toggleRowClass}>
              <input
                type="checkbox"
                checked={settings.upcomingOnly}
                onChange={(e) =>
                  updateSettings({ upcomingOnly: e.target.checked })
                }
                className="h-4 w-4 rounded border-zinc-300 text-teal-600 focus:ring-teal-500"
              />
              Show upcoming only
            </label>

            <div>
              <label className={labelClass}>Button colour</label>
              <div className="mt-2 flex h-11 items-center gap-3 rounded-xl border border-zinc-200 bg-white px-3 shadow-sm">
                <input
                  type="color"
                  value={settings.buttonColor}
                  onChange={(e) =>
                    updateSettings({ buttonColor: e.target.value })
                  }
                  className="h-8 w-12 cursor-pointer rounded-lg border-0 bg-transparent p-0"
                />
                <span className="font-mono text-sm text-zinc-600">
                  {settings.buttonColor}
                </span>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={labelClass}>Card style</label>
                <select
                  value={settings.cardStyle}
                  onChange={(e) =>
                    updateSettings({
                      cardStyle: e.target.value as WidgetCardStyle,
                    })
                  }
                  className={inputClass}
                >
                  <option value="soft">Soft shadow</option>
                  <option value="bordered">Bordered</option>
                  <option value="elevated">Elevated</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>Layout</label>
                <select
                  value={settings.layout}
                  onChange={(e) =>
                    updateSettings({ layout: e.target.value as WidgetLayout })
                  }
                  className={inputClass}
                >
                  <option value="full">Full</option>
                  <option value="compact">Compact</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <p className={labelClass}>Visibility</p>
              {(
                [
                  ["showProviderLogo", "Show provider logo"],
                  ["showAvailability", "Show availability"],
                  ["showAgeRange", "Show age range"],
                  ["showPoweredBy", "Show Powered by Activora"],
                ] as const
              ).map(([key, label]) => (
                <label key={key} className={toggleRowClass}>
                  <input
                    type="checkbox"
                    checked={settings[key]}
                    onChange={(e) => updateSettings({ [key]: e.target.checked })}
                    className="h-4 w-4 rounded border-zinc-300 text-teal-600 focus:ring-teal-500"
                  />
                  {label}
                </label>
              ))}
            </div>
          </section>
        </aside>

        <div className="space-y-8">
          <section className="space-y-4">
            <div className="overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-4">
                <div>
                  <h2 className="text-base font-semibold text-zinc-900">
                    Live preview
                  </h2>
                  <p className="mt-0.5 text-sm text-zinc-500">
                    See exactly how your widget will appear on your site.
                  </p>
                </div>
              </div>
              <div className="bg-zinc-50/60 p-4 sm:p-6">
                <div className="overflow-hidden rounded-xl border border-zinc-200/60 bg-white shadow-inner">
                  <EmbedProviderWidget
                    providerId={providerId}
                    settings={settings}
                    sessions={previewSessions}
                    clubName={profile?.clubName}
                    logoUrl={profile?.logoUrl}
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => setFullscreenPreview(true)}
                className="inline-flex h-11 items-center rounded-xl bg-zinc-900 px-5 text-sm font-semibold text-white transition-colors hover:bg-zinc-800"
              >
                Preview widget
              </button>
              <Link
                href={`/embed/provider/${providerId}`}
                target="_blank"
                className="inline-flex h-11 items-center rounded-xl border border-zinc-200 bg-white px-5 text-sm font-semibold text-zinc-700 transition-colors hover:bg-zinc-50"
              >
                Open embed page
              </Link>
              {profile ? (
                <Link
                  href={getPublicClubPath(profile.publicSlug)}
                  target="_blank"
                  className="inline-flex h-11 items-center rounded-xl border border-zinc-200 bg-white px-5 text-sm font-semibold text-zinc-700 transition-colors hover:bg-zinc-50"
                >
                  Open public booking page
                </Link>
              ) : null}
            </div>
          </section>

          <section className="space-y-4">
            <div>
              <h2 className="text-base font-semibold text-zinc-900">
                Publishing
              </h2>
              <p className="mt-1 text-sm text-zinc-500">
                Copy embed assets and share your widget with families.
              </p>
            </div>

            <PublishingCard
              title="Embed code"
              description="Paste this iframe into your website builder or CMS."
              copyText={embedCode}
              copyLabel="Copy"
              preview={embedCode}
            />

            <PublishingCard
              title="Booking page"
              description="Direct link to your public club booking profile."
              copyText={bookingLink}
              copyLabel="Copy URL"
            />

            <PublishingCard
              title="Embed URL"
              description="Standalone page for your embeddable widget."
              copyText={embedUrl}
              copyLabel="Copy URL"
            />

            <div className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-zinc-900">
                    QR code
                  </h3>
                  <p className="mt-1 text-sm text-zinc-500">
                    Print or display a scannable link to your widget.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => void handleGenerateQr()}
                    disabled={qrLoading}
                    className="inline-flex h-10 items-center rounded-xl bg-teal-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-teal-700 disabled:opacity-60"
                  >
                    {qrLoading ? "Generating…" : "Generate QR code"}
                  </button>
                  {qrDataUrl ? (
                    <button
                      type="button"
                      onClick={handleDownloadQr}
                      className="inline-flex h-10 items-center rounded-xl border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-700 transition-colors hover:bg-zinc-50"
                    >
                      Download QR
                    </button>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => void handleShareWidget()}
                    className="inline-flex h-10 items-center rounded-xl border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-700 transition-colors hover:bg-zinc-50"
                  >
                    Share widget
                  </button>
                </div>
              </div>
              {qrDataUrl ? (
                <div className="mt-5 flex justify-center rounded-xl border border-zinc-100 bg-zinc-50/60 p-6">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={qrDataUrl}
                    alt="Widget QR code"
                    className="h-40 w-40 rounded-lg"
                  />
                </div>
              ) : null}
            </div>
          </section>
        </div>
      </div>

      {fullscreenPreview ? (
        <div className="fixed inset-0 z-[100] flex flex-col bg-zinc-900/60 backdrop-blur-sm">
          <div className="flex items-center justify-between border-b border-zinc-200 bg-white px-4 py-3 sm:px-6">
            <p className="text-sm font-semibold text-zinc-900">Widget preview</p>
            <button
              type="button"
              onClick={() => setFullscreenPreview(false)}
              className="rounded-lg px-3 py-1.5 text-sm font-medium text-zinc-600 hover:bg-zinc-100"
            >
              Close
            </button>
          </div>
          <div className="flex-1 overflow-y-auto bg-zinc-50 p-4 sm:p-8">
            <div className="mx-auto max-w-4xl overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-xl">
              <EmbedProviderWidget
                providerId={providerId}
                settings={settings}
                sessions={previewSessions}
                clubName={profile?.clubName}
                logoUrl={profile?.logoUrl}
              />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
