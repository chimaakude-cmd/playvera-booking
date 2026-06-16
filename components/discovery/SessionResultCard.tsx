"use client";

import Link from "next/link";
import { MapPin } from "lucide-react";
import type { ClubSession } from "@/lib/sessions";
import { SessionImage } from "@/components/sessions/SessionImage";
import { getSessionImages } from "@/lib/session-images";
import { StarRating } from "@/components/home/shared";
import { ACTIVORA_ACTION } from "@/lib/home/constants";
import {
  DISCOVERY_RADIUS,
  DISCOVERY_TRUST_OVERLAY,
} from "@/lib/discovery/constants";
import {
  getDemoRating,
  getDemoReviewCount,
  getFromPriceLabel,
  getNextSessionLabel,
  getProviderName,
  getSessionBadges,
} from "@/lib/discovery/session-display";
import {
  isSessionSoldOut,
  resolveSessionStatusBadge,
} from "@/lib/discovery/session-badge";
import { SaveSessionButton } from "./SaveSessionButton";
import { SessionQuickPreview } from "./SessionQuickPreview";
import { SessionStatusBadge } from "./SessionStatusBadge";

type SessionResultCardProps = {
  session: ClubSession;
  distanceLabel: string | null;
  isActive: boolean;
  isPreviewOpen: boolean;
  onHover: () => void;
  onLeave: () => void;
  onTap?: () => void;
  enablePreview?: boolean;
};

export function SessionResultCard({
  session,
  distanceLabel,
  isActive,
  isPreviewOpen,
  onHover,
  onLeave,
  onTap,
  enablePreview = true,
}: SessionResultCardProps) {
  const { mainImageId } = getSessionImages(session);
  const rating = getDemoRating(session);
  const reviewCount = getDemoReviewCount(session);
  const badges = getSessionBadges(session);
  const priceLabel = getFromPriceLabel(session);
  const isVerified = badges.includes("verified");
  const statusBadge = resolveSessionStatusBadge(session);
  const soldOut = isSessionSoldOut(session);

  return (
    <div
      className="discovery-session-card-wrapper relative"
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      onClick={onTap}
    >
      <article
        className={`discovery-session-card overflow-hidden border bg-white transition-all duration-200 ${DISCOVERY_RADIUS.sessionCard} ${
          isActive
            ? "border-blue-300 shadow-lg shadow-blue-100/80 ring-2 ring-blue-100"
            : "border-slate-200 shadow-sm hover:-translate-y-0.5 hover:shadow-lg hover:shadow-slate-200/60"
        }`}
      >
        <div className="relative aspect-video w-full overflow-hidden">
          <SessionImage
            imageId={mainImageId}
            alt={session.sessionTitle}
            fallbackClassName="flex h-full w-full items-center justify-center bg-gradient-to-br from-blue-50 to-teal-50 text-sm font-medium text-slate-400"
          />

          {isVerified ? (
            <span
              className={`absolute left-3 top-3 border border-blue-100 bg-blue-50/95 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-[#2563EB] backdrop-blur-sm sm:text-xs ${DISCOVERY_RADIUS.button}`}
            >
              Verified
            </span>
          ) : null}

          <div className="absolute right-3 top-3">
            <SaveSessionButton sessionId={session.id} />
          </div>

          {statusBadge ? (
            <div className="absolute bottom-10 right-3 z-10 sm:bottom-11">
              <SessionStatusBadge badge={statusBadge} />
            </div>
          ) : null}

          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#0F172A]/90 via-[#0F172A]/50 to-transparent px-3 pb-2.5 pt-8">
            <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-0.5 text-[9px] font-medium text-white/90 sm:text-[10px]">
              {DISCOVERY_TRUST_OVERLAY.map((item, index) => (
                <span key={item} className="inline-flex items-center gap-1">
                  {index > 0 ? (
                    <span className="text-white/40" aria-hidden>
                      |
                    </span>
                  ) : null}
                  {item}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="p-4 sm:p-5">
          <div className="min-w-0">
            <h2 className="truncate text-base font-bold text-[#0F172A] sm:text-lg">
              {session.sessionTitle}
            </h2>
            <p className="mt-0.5 truncate text-sm font-medium text-slate-600">
              {getProviderName(session)}
            </p>
          </div>

          <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-600">
            <StarRating rating={rating} />
            <span>({reviewCount})</span>
            {distanceLabel ? (
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-3 w-3" aria-hidden />
                {distanceLabel}
              </span>
            ) : null}
          </div>

          <div className="mt-3 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-base font-bold text-[#0F172A]">{priceLabel}</p>
              <p className="mt-0.5 text-xs text-slate-500">
                Next: {getNextSessionLabel(session)}
              </p>
            </div>
            {soldOut ? (
              <Link
                href={`/book/${session.id}?waitlist=1`}
                onClick={(event) => event.stopPropagation()}
                className={`inline-flex items-center border border-slate-200 bg-slate-100 px-5 py-2.5 text-xs font-semibold text-slate-600 transition-colors hover:border-slate-300 hover:bg-slate-200 ${DISCOVERY_RADIUS.button}`}
              >
                Join Waitlist
              </Link>
            ) : (
              <Link
                href={`/book/${session.id}`}
                onClick={(event) => event.stopPropagation()}
                className={`inline-flex items-center px-5 py-2.5 text-xs font-semibold text-white transition-opacity hover:opacity-90 ${DISCOVERY_RADIUS.button}`}
                style={{ backgroundColor: ACTIVORA_ACTION }}
              >
                Book
              </Link>
            )}
          </div>
        </div>
      </article>

      {enablePreview ? (
        <SessionQuickPreview
          session={session}
          visible={isPreviewOpen}
          variant="desktop"
        />
      ) : (
        <SessionQuickPreview
          session={session}
          visible={isPreviewOpen}
          variant="mobile"
        />
      )}
    </div>
  );
}
