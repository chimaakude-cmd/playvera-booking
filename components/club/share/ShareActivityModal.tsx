"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import {
  buildShareContent,
  copyShareLink,
  copySlackShareMessage,
  downloadDataUrl,
  downloadSvg,
  getActivityPublicUrl,
  getClubPublicUrl,
  getMoreSocialShareActions,
  getPrimarySocialShareActions,
  getQrDataUrl,
  getQrSvg,
  getShortDisplayUrl,
  openPrintView,
  trackShareEvent,
  validateActivityShareTarget,
  type SharePlatform,
} from "@/lib/club-share";
import { SharePlatformButton } from "./SharePlatformButton";
import {
  ShareInstagramImage,
  generateInstagramShareImage,
} from "./ShareInstagramImage";

type ShareActivityModalProps = {
  open: boolean;
  onClose: () => void;
  activityId: string;
  activityTitle: string;
  published?: boolean;
  status?: string;
  clubName: string;
  slug: string;
  logoUrl?: string | null;
  primaryColor?: string;
  secondaryColor?: string;
};

export function ShareActivityModal({
  open,
  onClose,
  activityId,
  activityTitle,
  published,
  status,
  clubName,
  slug,
  logoUrl,
  primaryColor = "#0d9488",
  secondaryColor = "#14b8a6",
}: ShareActivityModalProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [showMore, setShowMore] = useState(false);
  const [showInstagram, setShowInstagram] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const shareValidation = useMemo(
    () => validateActivityShareTarget({ published, status }),
    [published, status],
  );
  const canShare = shareValidation.ok;

  const publicUrl = useMemo(
    () => getActivityPublicUrl(activityId),
    [activityId],
  );
  const qrUrl = useMemo(
    () => getClubPublicUrl(slug, { forQr: true }),
    [slug],
  );
  const shareContent = useMemo(
    () =>
      buildShareContent(
        activityTitle,
        publicUrl,
      ),
    [activityTitle, publicUrl],
  );
  const primaryActions = useMemo(
    () => getPrimarySocialShareActions(activityTitle, publicUrl),
    [activityTitle, publicUrl],
  );
  const moreActions = useMemo(
    () => getMoreSocialShareActions(activityTitle, publicUrl),
    [activityTitle, publicUrl],
  );

  useEffect(() => {
    if (!open || !canShare) {
      setQrDataUrl(null);
      return;
    }

    let cancelled = false;
    void getQrDataUrl(qrUrl)
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
  }, [open, canShare, qrUrl]);

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
    trackShareEvent("social_share", "copy_link", { source: "club_dashboard" });
    setCopied(true);
    showToast("Link copied");
    setTimeout(() => setCopied(false), 2000);
  }

  function handleDownloadQr() {
    if (!qrDataUrl) {
      return;
    }
    downloadDataUrl(qrDataUrl, `${activityId}-booking-qr.png`);
    showToast("QR downloaded");
  }

  function handlePrintQr() {
    if (!qrDataUrl) {
      return;
    }
    openPrintView(qrDataUrl, clubName, getClubPublicUrl(slug));
  }

  async function handleDownloadSvg() {
    try {
      const svg = await getQrSvg(qrUrl);
      downloadSvg(svg, `${slug}-qr.svg`);
      showToast("SVG downloaded");
    } catch {
      showToast("Could not generate SVG");
    }
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
        await handleCopyLink();
      }
      return;
    }

    if (href) {
      trackShareEvent("social_share", platform);
      window.open(href, "_blank", "noopener,noreferrer");
    }
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
        aria-labelledby="share-activity-title"
        className="relative z-[201] flex max-h-[85vh] w-full min-h-0 flex-col overflow-hidden rounded-t-3xl border border-zinc-200 bg-white shadow-2xl sm:max-h-[80vh] sm:max-w-[460px] sm:rounded-2xl"
      >
        <div className="flex shrink-0 items-center justify-center pt-3 sm:hidden">
          <div className="h-1 w-10 rounded-full bg-zinc-200" />
        </div>

        <div className="shrink-0 border-b border-zinc-100 px-5 pb-4 pt-3 sm:px-6 sm:pt-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2
                id="share-activity-title"
                className="text-lg font-semibold text-zinc-900 sm:text-xl"
              >
                Share {activityTitle}
              </h2>
              <p className="mt-1 text-sm text-zinc-500">
                Send parents straight to the booking page.
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
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-4 sm:px-6">
          {!canShare ? (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-900">
              {shareValidation.message}
            </div>
          ) : (
            <div className="space-y-6">
              <section className="text-center">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-400">
                  QR code
                </p>
                <div className="mx-auto flex h-48 w-48 items-center justify-center rounded-2xl border border-zinc-200 bg-white p-3 shadow-sm">
                  {qrDataUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={qrDataUrl}
                      alt={`QR code for ${activityTitle}`}
                      className="h-full w-full object-contain"
                    />
                  ) : (
                    <div className="h-full w-full animate-pulse rounded-xl bg-zinc-100" />
                  )}
                </div>
                <p className="mt-3 break-all text-xs text-zinc-500">
                  {getShortDisplayUrl(getClubPublicUrl(slug))}
                </p>
                <div className="mt-3 flex flex-wrap justify-center gap-2">
                  <ActionButton onClick={handleDownloadQr} disabled={!qrDataUrl}>
                    Download PNG
                  </ActionButton>
                  <ActionButton
                    onClick={() => void handleDownloadSvg()}
                    disabled={!qrDataUrl}
                  >
                    Download SVG
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

              {showInstagram ? (
                <section className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
                  <p className="mb-3 text-sm font-semibold text-zinc-900">
                    Instagram share image
                  </p>
                  <ShareInstagramImage
                    clubName={clubName}
                    link={publicUrl}
                    qrTargetUrl={getClubPublicUrl(slug, { forQr: true })}
                    logoUrl={logoUrl}
                    primaryColor={primaryColor}
                    secondaryColor={secondaryColor}
                  />
                </section>
              ) : null}
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

export async function quickInstagramShareForActivity(options: {
  activityTitle: string;
  link: string;
  logoUrl?: string | null;
  primaryColor?: string;
  secondaryColor?: string;
}): Promise<void> {
  const dataUrl = await generateInstagramShareImage({
    clubName: options.activityTitle,
    link: options.link,
    logoUrl: options.logoUrl,
    primaryColor: options.primaryColor,
    secondaryColor: options.secondaryColor,
  });
  if (dataUrl) {
    downloadDataUrl(
      dataUrl,
      `${options.activityTitle.replace(/\s+/g, "-").toLowerCase()}-instagram.png`,
    );
  }
}
