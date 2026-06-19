"use client";

import Link from "next/link";
import { BadgeCheck } from "lucide-react";
import { ACTIVORA_ACCENT, ACTIVORA_ACTION, POPULAR_CLUBS } from "@/lib/home/constants";
import { useTranslation } from "@/lib/i18n";
import { HOME_BUTTON, HOME_CARD, HOME_SECTION, HOME_SHADOW, StarRating } from "./shared";

type HomePopularClubsProps = {
  radius: string;
};

export function HomePopularClubs({ radius }: HomePopularClubsProps) {
  const { t } = useTranslation("homepage");

  return (
    <section className={`bg-[#F8FAFC] ${HOME_SECTION}`}>
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-2xl font-bold text-[#0F172A] sm:text-3xl">
              {t("popularClubs.title")}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {t("popularClubs.withinRadius", { value: radius })}
            </p>
          </div>
          <Link
            href="/sessions"
            className={`border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-[#0F172A] transition-colors hover:border-slate-300 ${HOME_BUTTON}`}
          >
            {t("popularClubs.viewAll")}
          </Link>
        </div>

        <div className="-mx-4 flex gap-4 overflow-x-auto px-4 pb-1 sm:-mx-6 sm:gap-5 sm:px-6">
          {POPULAR_CLUBS.map((club) => (
            <article
              key={club.name}
              className={`w-[280px] shrink-0 overflow-hidden border border-slate-200/80 bg-white transition-shadow hover:shadow-lg sm:w-[300px] ${HOME_CARD} ${HOME_SHADOW}`}
            >
              <div className="relative aspect-[16/11] overflow-hidden">
                <img
                  src={club.image}
                  alt={club.name}
                  loading="lazy"
                  className="h-full w-full object-cover"
                />
                <span
                  className={`absolute left-3 top-3 px-2.5 py-1 text-xs font-bold text-white ${HOME_BUTTON}`}
                  style={{ backgroundColor: ACTIVORA_ACTION }}
                >
                  From {club.price}
                </span>
                {club.verified ? (
                  <span className={`absolute right-3 top-3 inline-flex items-center gap-1 bg-white/95 px-2 py-1 text-[11px] font-semibold text-[#0F172A] ${HOME_BUTTON}`}>
                    <BadgeCheck className="h-3.5 w-3.5" style={{ color: ACTIVORA_ACCENT }} aria-hidden />
                    {t("popularClubs.verified")}
                  </span>
                ) : null}
              </div>

              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-bold text-[#0F172A]">{club.name}</h3>
                  <StarRating rating={club.rating} />
                </div>
                <p className="mt-2 text-sm text-slate-600">{club.ages}</p>
                <p className="mt-0.5 text-sm text-slate-500">{club.distance}</p>
                <p
                  className="mt-2 text-xs font-semibold"
                  style={{ color: ACTIVORA_ACCENT }}
                >
                  {t("popularClubs.spacesLeft", { count: club.spacesLeft })}
                </p>
                <Link
                  href="/sessions"
                  className={`mt-4 flex w-full items-center justify-center px-4 py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-90 ${HOME_BUTTON}`}
                  style={{ backgroundColor: ACTIVORA_ACTION }}
                >
                  {t("popularClubs.bookNow")}
                </Link>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
