"use client";

import {
  Bookmark,
  BookmarkCheck,
  ExternalLink,
  Gift,
  Mail,
  MessageSquare,
  Sparkles,
  Star,
} from "lucide-react";
import {
  PARTNER_BENEFIT_TYPE_LABELS,
  PARTNER_CATEGORY_LABELS,
  type Partner,
} from "@/lib/partners";

export type PartnerCardVariant = "public" | "club";

export type PartnerCardActions = {
  onWebsiteClick?: () => void;
  onContactClick?: () => void;
  onClaimClick?: () => void;
  onSaveClick?: () => void;
  onIntroductionClick?: () => void;
};

type PartnerCardProps = {
  partner: Partner;
  variant?: PartnerCardVariant;
  saved?: boolean;
  actions?: PartnerCardActions;
};

function PartnerLogo({ partner }: { partner: Partner }) {
  if (partner.logoDataUrl) {
    return (
      <img
        src={partner.logoDataUrl}
        alt=""
        className="h-12 w-12 rounded-xl border border-zinc-100 bg-white object-contain p-1"
      />
    );
  }

  const initial = partner.name.charAt(0).toUpperCase();
  return (
    <div
      aria-hidden
      className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-teal-700 text-lg font-bold text-white shadow-sm"
    >
      {initial}
    </div>
  );
}

export function PartnerCard({
  partner,
  variant = "public",
  saved = false,
  actions,
}: PartnerCardProps) {
  const isClub = variant === "club";
  const isFeatured = partner.status === "featured";

  return (
    <article
      className={`group flex h-full flex-col rounded-2xl border bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${
        isClub
          ? "border-zinc-200 hover:border-teal-300"
          : "border-white/10 bg-white/95 hover:border-teal-300/60"
      }`}
    >
      <div className="flex items-start gap-4">
        <PartnerLogo partner={partner} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-bold text-zinc-900">{partner.name}</h3>
            {isFeatured ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-800">
                <Star className="h-3 w-3" aria-hidden />
                Featured
              </span>
            ) : null}
            {partner.isNew ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-2 py-0.5 text-[11px] font-semibold text-sky-800">
                <Sparkles className="h-3 w-3" aria-hidden />
                New
              </span>
            ) : null}
            {partner.recommended && isClub ? (
              <span className="rounded-full bg-teal-50 px-2 py-0.5 text-[11px] font-semibold text-teal-800">
                Recommended
              </span>
            ) : null}
          </div>
          <p className="mt-1 text-sm font-medium text-teal-700">
            {PARTNER_CATEGORY_LABELS[partner.category]}
          </p>
        </div>
      </div>

      <p className="mt-4 flex-1 text-sm leading-6 text-zinc-600">
        {partner.shortDescription}
      </p>

      <div
        className={`mt-4 rounded-xl px-3 py-2.5 text-sm ${
          isClub ? "bg-teal-50 text-teal-900" : "bg-[#072B44]/5 text-[#072B44]"
        }`}
      >
        <p className="text-[11px] font-semibold uppercase tracking-wide opacity-70">
          Benefit offered
        </p>
        <p className="mt-0.5 font-semibold">{partner.benefitOffered}</p>
        {isClub ? (
          <p className="mt-1 text-xs opacity-80">
            {PARTNER_BENEFIT_TYPE_LABELS[partner.benefitType]}
          </p>
        ) : null}
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {partner.website ? (
          <a
            href={partner.website}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => actions?.onWebsiteClick?.()}
            className={`inline-flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-sm font-semibold transition ${
              isClub
                ? "border-zinc-200 text-zinc-700 hover:border-teal-300 hover:text-teal-800"
                : "border-zinc-200 text-zinc-700 hover:border-teal-400 hover:text-teal-800"
            }`}
          >
            <ExternalLink className="h-4 w-4" aria-hidden />
            Website
          </a>
        ) : null}

        {partner.contactEmail ? (
          <button
            type="button"
            onClick={() => actions?.onContactClick?.()}
            className={`inline-flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-sm font-semibold transition ${
              isClub
                ? "border-zinc-200 text-zinc-700 hover:border-teal-300 hover:text-teal-800"
                : "border-zinc-200 text-zinc-700 hover:border-teal-400 hover:text-teal-800"
            }`}
          >
            <Mail className="h-4 w-4" aria-hidden />
            Contact partner
          </button>
        ) : null}

        {isClub && actions?.onIntroductionClick ? (
          <button
            type="button"
            onClick={() => actions.onIntroductionClick?.()}
            className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 px-3.5 py-2 text-sm font-semibold text-zinc-700 transition hover:border-teal-300 hover:text-teal-800"
          >
            <MessageSquare className="h-4 w-4" aria-hidden />
            Request introduction
          </button>
        ) : null}

        {isClub && actions?.onSaveClick ? (
          <button
            type="button"
            onClick={() => actions.onSaveClick?.()}
            className={`inline-flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-sm font-semibold transition ${
              saved
                ? "border-teal-200 bg-teal-50 text-teal-800"
                : "border-zinc-200 text-zinc-700 hover:border-teal-300 hover:text-teal-800"
            }`}
            aria-pressed={saved}
          >
            {saved ? (
              <BookmarkCheck className="h-4 w-4" aria-hidden />
            ) : (
              <Bookmark className="h-4 w-4" aria-hidden />
            )}
            {saved ? "Saved" : "Save partner"}
          </button>
        ) : null}

        {actions?.onClaimClick ? (
          <button
            type="button"
            onClick={() => actions.onClaimClick?.()}
            className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-sm font-semibold text-white transition ${
              isClub
                ? "bg-teal-600 hover:bg-teal-700"
                : "bg-teal-600 hover:bg-teal-700 focus:ring-2 focus:ring-teal-500/30"
            }`}
          >
            <Gift className="h-4 w-4" aria-hidden />
            Claim offer
          </button>
        ) : null}
      </div>
    </article>
  );
}
