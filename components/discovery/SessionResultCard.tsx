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
        className={`discovery-session-card overflow-hidden bg-white transition-all duration-200 ${DISCOVERY_RADIUS.sessionCard} ${
          isActive
            ? "shadow-lg shadow-orange-100/60 ring-2 ring-orange-100/80"
            : "shadow-sm hover:-translate-y-0.5 hover:shadow-md hover:shadow-orange-50/80"
        }`}
      >
        <div className="relative aspect-[16/10] w-full overflow-hidden sm:aspect-[16/9]">
          <SessionImage
            imageId={mainImageId}
            alt={session.sessionTitle}
            fallbackClassName="flex h-full w-full items-center justify-center bg-gradient-to-br from-orange-50 to-amber-50 text-sm font-medium text-slate-400"
          />

          {isVerified ? (
            <span
              className={`absolute left-3 top-3 bg-white/95 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-[#F87128] backdrop-blur-sm sm:text-xs ${DISCOVERY_RADIUS.button}`}
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

        </div>

        <div className="p-5 sm:p-6">
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
