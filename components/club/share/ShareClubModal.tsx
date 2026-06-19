"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import {
  EMBED_OPTIONS,
  buildShareContent,
  copyShareLink,
  copySlackShareMessage,
  downloadDataUrl,
  generateEmbedCode,
  getClubPublicUrl,
  getMoreSocialShareActions,
  getPrimarySocialShareActions,
  getQrDataUrl,
  getShortDisplayUrl,
  nativeShare,
  openPrintView,
  trackShareEvent,
  validateClubShareTarget,
  type EmbedType,
  type SharePlatform,
} from "@/lib/club-share";
import { getClubProfile } from "@/lib/club-profile";
import type { ClubProfileVisibility } from "@/lib/club-profile/types";
import { SharePlatformButton } from "./SharePlatformButton";
import {
  ShareInstagramImage,
  generateInstagramShareImage,
} from "./ShareInstagramImage";

type ShareClubModalProps = {
  open: boolean;
  onClose: () => void;
  clubName: string;
  slug: string;
  providerId: string;
  logoUrl?: string | null;
  primaryColor?: string;
  secondaryColor?: string;
  visibility?: ClubProfileVisibility;
  published?: boolean;
};

type TabId = "share" | "embed";

export function ShareClubModal({
  open,
  onClose,
  clubName,
  slug,
  providerId,
  logoUrl,
  primaryColor = "#0d9488",
  secondaryColor = "#14b8a6",
  visibility: visibilityProp,
  published: publishedProp,
}: ShareClubModalProps) {
  const [tab, setTab] = useState<TabId>("share");
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [embedType, setEmbedType] = useState<EmbedType>("activity_widget");
  const [embedCopied, setEmbedCopied] = useState(false);
  const [showMore, setShowMore] = useState(false);
  const [showInstagram, setShowInstagram] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const cachedProfile = getClubProfile();
  const shareValidation = useMemo(
    () =>
      validateClubShareTarget({
        slug,
        visibility: visibilityProp ?? cachedProfile.visibility,
        published: publishedProp ?? cachedProfile.published,
      }),
    [slug, visibilityProp, publishedProp, cachedProfile.visibility, cachedProfile.published],
  );
  const canShare = shareValidation.ok;

  const publicUrl = useMemo(() => getClubPublicUrl(slug), [slug]);
  const qrUrl = useMemo(() => getClubPublicUrl(slug, { forQr: true }), [slug]);
  const shareContent = useMemo(
    () => buildShareContent(clubName, publicUrl),
    [clubName, publicUrl],
  );
  const primaryActions = useMemo(
    () => getPrimarySocialShareActions(clubName, publicUrl),
    [clubName, publicUrl],
  );
  const moreActions = useMemo(
    () => getMoreSocialShareActions(clubName, publicUrl),
    [clubName, publicUrl],
  );
  const embedCode = useMemo(
    () => generateEmbedCode(embedType, providerId),
    [embedType, providerId],
  );

  useEffect(() => {
    if (!open || !canShare) {
      setQrDataUrl(null);
      return;
    }

    let cancelled = false;
    void getQrDataUrl(qrUrl, logoUrl)
      .then((url) => {
        if (!cancelled) {
          setQrDataUrl(url);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setQrDataUrl(null);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [open, canShare, qrUrl, logoUrl]);

  useEffect(() => {
    if (!open) {
      return;
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  const showToast = useCallback((message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 2500);
  }, []);

  async function handleCopyLink() {
    await copyShareLink(publicUrl);
    trackShareEvent("link_click", "copy_link");
    setCopied(true);
    showToast("Link copied");
    setTimeout(() => setCopied(false), 2000);
  }

  function handleDownloadQr() {
    if (!qrDataUrl) {
      return;
    }
    downloadDataUrl(
      qrDataUrl,
      `${slug}-qr.png`,
    );
    showToast("QR downloaded");
  }

  function handlePrintQr() {
    if (!qrDataUrl) {
      return;
    }
    openPrintView(qrDataUrl, clubName, publicUrl);
  }

  async function handleSocialAction(
    platform: SharePlatform,
    action: "url" | "copy" | "native" | "instagram",
    href?: string,
  ) {
    if (action === "instagram") {
      setShowInstagram(true);
      await copyShareLink(publicUrl);
      trackShareEvent("social_share", "instagram");
      showToast("Link copied — download image for Instagram");
      return;
    }

    if (action === "copy") {
      if (platform === "slack") {
        await copySlackShareMessage(shareContent);
        trackShareEvent("social_share", platform);
        showToast("Message copied for Slack");
      } else {
        await copyShareLink(publicUrl);
        trackShareEvent("social_share", platform);
        showToast("Link copied");
      }
      return;
    }

    if (action === "native") {
      const shared = await nativeShare(shareContent);
      if (shared) {
        trackShareEvent("social_share", "more");
      } else {
        await handleCopyLink();
      }
      return;
    }

    if (href) {
      trackShareEvent("social_share", platform);
      window.open(href, "_blank", "noopener,noreferrer");
    }
  }

  async function handleCopyEmbed() {
    await navigator.clipboard.writeText(embedCode);
    setEmbedCopied(true);
    showToast("Embed code copied");
    setTimeout(() => setEmbedCopied(false), 2000);
  }

  if (!open || !mounted) {
    return null;
  }

  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-end sm:items-center sm:justify-center sm:p-4">
      <button
        type="button"
        aria-label="Close share modal"
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="share-club-title"
        className="relative z-[201] flex max-h-[85vh] w-full min-h-0 flex-col overflow-hidden rounded-t-3xl border border-zinc-200 bg-white shadow-2xl sm:max-h-[80vh] sm:max-w-[460px] sm:rounded-2xl"
      >
        <div className="flex shrink-0 items-center justify-center pt-3 sm:hidden">
          <div className="h-1 w-10 rounded-full bg-zinc-200" />
        </div>

        <div className="shrink-0 border-b border-zinc-100 px-5 pb-4 pt-3 sm:px-6 sm:pt-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2
                id="share-club-title"
                className="text-lg font-semibold text-zinc-900 sm:text-xl"
              >
                Share {clubName}
              </h2>
              <p className="mt-1 text-sm text-zinc-500">
                Invite families and grow your community.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="mt-4 flex gap-1 rounded-xl bg-zinc-100 p-1">
            {(
              [
                ["share", "Share"],
                ["embed", "Embed on your website"],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setTab(id)}
                className={`flex-1 rounded-lg px-3 py-2 text-xs font-semibold transition-colors sm:text-sm ${
                  tab === id
                    ? "bg-white text-zinc-900 shadow-sm"
                    : "text-zinc-500 hover:text-zinc-700"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-4 sm:px-6">
          {tab === "share" ? (
            <div className="space-y-6">
              {!canShare ? (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-900">
                  {shareValidation.message}
                </div>
              ) : (
                <>
              <section className="text-center">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-400">
                  QR code
                </p>
                <div className="mx-auto flex h-48 w-48 items-center justify-center rounded-2xl border border-zinc-200 bg-white p-3 shadow-sm">
                  {qrDataUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={qrDataUrl}
                      alt={`QR code for ${clubName}`}
                      className="h-full w-full object-contain"
                    />
                  ) : (
                    <div className="h-full w-full animate-pulse rounded-xl bg-zinc-100" />
                  )}
                </div>
                <p className="mt-3 break-all text-xs text-zinc-500">
                  {getShortDisplayUrl(publicUrl)}
                </p>
                <div className="mt-3 flex flex-wrap justify-center gap-2">
                  <ActionButton onClick={handleDownloadQr} disabled={!qrDataUrl}>
                    Download QR
                  </ActionButton>
                  <ActionButton onClick={() => void handleCopyLink()}>
                    {copied ? "Copied!" : "Copy link"}
                  </ActionButton>
                  <ActionButton onClick={handlePrintQr} disabled={!qrDataUrl}>
                    Print
                  </ActionButton>
                </div>
              </section>

              <section>
                <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-400">
                  Share instantly
                </p>
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                  {primaryActions.map((item) => (
                    <SharePlatformButton
                      key={item.platform}
                      platform={item.platform}
                      label={item.label}
                      ariaLabel={`Share on ${item.label}`}
                      onClick={() =>
                        void handleSocialAction(
                          item.platform,
                          item.action,
                          item.href,
                        )
                      }
                    />
                  ))}
                </div>
              </section>

              <section>
                <button
                  type="button"
                  onClick={() => setShowMore((current) => !current)}
                  className="text-sm font-semibold text-teal-700 hover:text-teal-800"
                >
                  {showMore ? "Hide more options" : "More sharing options"}
                </button>
                {showMore ? (
                  <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
                    {moreActions.map((item) => (
                      <SharePlatformButton
                        key={item.platform}
                        platform={item.platform}
                        label={item.label}
                        ariaLabel={`Share on ${item.label}`}
                        onClick={() =>
                          void handleSocialAction(
                            item.platform,
                            item.action,
                            item.href,
                          )
                        }
                      />
                    ))}
                  </div>
                ) : null}
              </section>
                </>
              )}

              {canShare && showInstagram ? (
                <section className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
                  <p className="mb-3 text-sm font-semibold text-zinc-900">
                    Instagram share image
                  </p>
                  <ShareInstagramImage
                    clubName={clubName}
                    link={publicUrl}
                    logoUrl={logoUrl}
                    primaryColor={primaryColor}
                    secondaryColor={secondaryColor}
                  />
                </section>
              ) : null}
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-zinc-500">
                Copy an embed snippet for your club website.
              </p>
              <div className="space-y-2">
                {EMBED_OPTIONS.map((option) => (
                  <label
                    key={option.type}
                    className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors ${
                      embedType === option.type
                        ? "border-teal-300 bg-teal-50/50"
                        : "border-zinc-200 hover:border-zinc-300"
                    }`}
                  >
                    <input
                      type="radio"
                      name="embed-type"
                      checked={embedType === option.type}
                      onChange={() => setEmbedType(option.type)}
                      className="mt-1 accent-teal-600"
                    />
                    <div>
                      <p className="text-sm font-semibold text-zinc-900">
                        {option.label}
                      </p>
                      <p className="mt-0.5 text-xs text-zinc-500">
                        {option.description}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
              <div>
                <p className="text-sm font-medium text-zinc-700">Embed code</p>
                <pre className="mt-2 max-h-32 overflow-auto rounded-xl bg-zinc-50 p-3 text-xs text-zinc-700">
                  {embedCode}
                </pre>
                <button
                  type="button"
                  onClick={() => void handleCopyEmbed()}
                  className="mt-3 rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-700"
                >
                  {embedCopied ? "Copied!" : "Copy embed code"}
                </button>
              </div>
            </div>
          )}
        </div>

        {toast ? (
          <div className="pointer-events-none absolute bottom-6 left-1/2 -translate-x-1/2 rounded-full bg-zinc-900 px-4 py-2 text-xs font-medium text-white shadow-lg">
            {toast}
          </div>
        ) : null}
      </div>
    </div>,
    document.body,
  );
}

function ActionButton({
  children,
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="rounded-xl border border-zinc-200 px-3 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 disabled:opacity-50 sm:text-sm"
    >
      {children}
    </button>
  );
}

export async function quickInstagramShare(options: {
  clubName: string;
  link: string;
  logoUrl?: string | null;
  primaryColor?: string;
  secondaryColor?: string;
}): Promise<void> {
  const dataUrl = await generateInstagramShareImage(options);
  if (dataUrl) {
    downloadDataUrl(
      dataUrl,
      `${options.clubName.replace(/\s+/g, "-").toLowerCase()}-instagram.png`,
    );
  }
}
