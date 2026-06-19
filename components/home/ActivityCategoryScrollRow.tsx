"use client";

import Link from "next/link";
import { useRef, type ReactNode } from "react";
import {
  HOME_ACTIVITY_CATEGORIES,
  type HomeActivityCategory,
} from "@/lib/home/category-images";
import { CategoryCardImage } from "./CategoryCardImage";
import { useHorizontalCategoryScroll } from "./useHorizontalCategoryScroll";

const CATEGORY_OVERLAY =
  "linear-gradient(180deg, transparent 35%, rgba(0,0,0,.65) 100%)";

type ActivityCategoryScrollRowProps = {
  activeQuery?: string;
  exploreAllHref: string;
  exploreAllLabel: string;
  renderCategory?: (
    category: HomeActivityCategory,
    card: ReactNode,
  ) => ReactNode;
};

function CategoryCardContent({ category }: { category: HomeActivityCategory }) {
  return (
    <>
      <CategoryCardImage src={category.image} alt="" />
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: CATEGORY_OVERLAY }}
      />
      <div className="relative flex h-full flex-col justify-end p-4">
        <span className="mb-1 text-base leading-none" aria-hidden>
          {category.icon}
        </span>
        <p className="text-sm font-bold leading-tight text-white">
          {category.label}
        </p>
      </div>
    </>
  );
}

export function ActivityCategoryScrollRow({
  activeQuery = "",
  exploreAllHref,
  exploreAllLabel,
  renderCategory,
}: ActivityCategoryScrollRowProps) {
  const rowRef = useRef<HTMLDivElement>(null);
  useHorizontalCategoryScroll(rowRef);

  return (
    <div ref={rowRef} className="category-row">
      {HOME_ACTIVITY_CATEGORIES.map((category) => {
        const isActive =
          activeQuery.toLowerCase() === category.query.toLowerCase();

        const card = (
          <div
            className={`category-card group relative block overflow-hidden text-left ${
              isActive ? "category-card--active" : ""
            }`}
          >
            <CategoryCardContent category={category} />
          </div>
        );

        if (renderCategory) {
          return (
            <div key={category.label} className="category-card-wrap">
              {renderCategory(category, card)}
            </div>
          );
        }

        return (
          <div key={category.label} className="category-card-wrap">
            {card}
          </div>
        );
      })}

      <Link href={exploreAllHref} className="category-card category-card--explore">
        <span className="text-lg font-semibold text-[#F87128]" aria-hidden>
          →
        </span>
        <span className="text-sm font-bold leading-snug text-[#0F172A]">
          {exploreAllLabel}
        </span>
      </Link>
    </div>
  );
}
