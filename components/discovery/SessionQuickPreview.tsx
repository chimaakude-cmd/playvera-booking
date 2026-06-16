"use client";

import Link from "next/link";
import type { ClubSession } from "@/lib/sessions";
import {
  formatDay,
  formatTimeRange,
} from "@/lib/sessions";
import { getSessionGalleryImageUrls, getSessionImages } from "@/lib/session-images";
import { SessionImage } from "@/components/sessions/SessionImage";
import { SafeImage } from "@/components/ui/SafeImage";
import { DISCOVERY_RADIUS } from "@/lib/discovery/constants";
import { ACTIVORA_ACTION } from "@/lib/home/constants";
import {
  getFromPriceLabel,
  getProviderName,
} from "@/lib/discovery/session-display";
import { isSessionSoldOut } from "@/lib/discovery/session-badge";

type SessionQuickPreviewProps = {
  session: ClubSession;
  visible: boolean;
  variant?: "desktop" | "mobile";
};

function PreviewContent({ session }: { session: ClubSession }) {
  const { mainImageId, galleryImageIds } = getSessionImages(session);
  const galleryUrls = getSessionGalleryImageUrls(session);
  const soldOut = isSessionSoldOut(session);

  const description =
    session.description?.trim() ||
    `${session.sessionTitle} — ${session.activityType.replace(/_/g, " ")} for ${session.ageRange}.`;

  const galleryItems: Array<{ type: "id" | "url"; value: string }> = [
    ...(mainImageId ? [{ type: "id" as const, value: mainImageId }] : []),
    ...galleryImageIds
      .filter((id) => id !== mainImageId)
      .slice(0, 2)
      .map((id) => ({ type: "id" as const, value: id })),
    ...galleryUrls.slice(0, 2).map((url) => ({ type: "url" as const, value: url })),
  ].slice(0, 3);

  return (
    <>
      <div className="flex items-center gap-3">
        <div
          className={`relative h-11 w-11 shrink-0 overflow-hidden border border-slate-100 ${DISCOVERY_RADIUS.button}`}
        >
          <SessionImage
            imageId={mainImageId}
            alt={getProviderName(session)}
            fallbackClassName="flex h-full w-full items-center justify-center bg-gradient-to-br from-blue-50 to-teal-50 text-xs font-bold text-[#2563EB]"
          />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-[#0F172A]">
            {getProviderName(session)}
          </p>
          <p className="text-xs text-slate-500">Verified provider</p>
        </div>
      </div>

      {galleryItems.length > 0 ? (
        <div className="mt-3 grid grid-cols-3 gap-1.5">
          {galleryItems.map((item) => (
            <div
              key={item.value}
              className={`relative aspect-[4/3] overflow-hidden ${DISCOVERY_RADIUS.button}`}
            >
              {item.type === "url" ? (
                <SafeImage
                  src={item.value}
                  alt=""
                  fill
                  className="h-full w-full object-cover"
                  sizes="100px"
                />
              ) : (
                <SessionImage imageId={item.value} alt={session.sessionTitle} />
              )}
            </div>
          ))}
        </div>
      ) : null}

      <p className="mt-3 line-clamp-3 text-xs leading-relaxed text-slate-600">
        {description}
      </p>

      <dl className="mt-3 space-y-1 text-xs text-slate-600">
        <div className="flex justify-between gap-2">
          <dt className="text-slate-500">Ages</dt>
          <dd className="font-medium text-[#0F172A]">{session.ageRange}</dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt className="text-slate-500">Price</dt>
          <dd className="font-medium text-[#0F172A]">
            {getFromPriceLabel(session)}
          </dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt className="text-slate-500">Schedule</dt>
          <dd className="text-right font-medium text-[#0F172A]">
            {formatDay(session.day)} ·{" "}
            {formatTimeRange(session.startTime, session.endTime)}
          </dd>
        </div>
      </dl>

      {soldOut ? (
        <Link
          href={`/book/${session.id}?waitlist=1`}
          className={`mt-4 inline-flex w-full items-center justify-center border border-slate-200 bg-slate-100 py-2.5 text-xs font-semibold text-slate-600 transition-colors hover:border-slate-300 hover:bg-slate-200 ${DISCOVERY_RADIUS.button}`}
        >
          Join Waitlist
        </Link>
      ) : (
        <Link
          href={`/book/${session.id}`}
          className={`mt-4 inline-flex w-full items-center justify-center py-2.5 text-xs font-semibold text-white transition-opacity hover:opacity-90 ${DISCOVERY_RADIUS.button}`}
          style={{ backgroundColor: ACTIVORA_ACTION }}
        >
          Book
        </Link>
      )}
    </>
  );
}

export function SessionQuickPreview({
  session,
  visible,
  variant = "desktop",
}: SessionQuickPreviewProps) {
  if (variant === "mobile") {
    if (!visible) {
      return null;
    }

    return (
      <div
        className={`discovery-preview-panel mt-3 border border-slate-200 bg-white p-4 shadow-md lg:hidden ${DISCOVERY_RADIUS.card}`}
      >
        <PreviewContent session={session} />
      </div>
    );
  }

  return (
    <div
      className={`discovery-preview-panel pointer-events-none absolute left-full top-0 z-30 ml-3 hidden w-[300px] border border-slate-200 bg-white p-4 shadow-2xl shadow-slate-900/15 transition-all duration-200 lg:block xl:w-[320px] ${DISCOVERY_RADIUS.card} ${
        visible
          ? "translate-x-0 opacity-100"
          : "-translate-x-2 opacity-0"
      }`}
      aria-hidden={!visible}
    >
      <PreviewContent session={session} />
    </div>
  );
}
