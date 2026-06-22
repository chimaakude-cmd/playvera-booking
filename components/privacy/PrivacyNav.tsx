"use client";

import { useEffect, useState } from "react";
import type { PrivacyNavItem } from "@/constants/privacy";

type PrivacyNavProps = {
  items: PrivacyNavItem[];
  variant?: "mobile" | "desktop" | "both";
};

export function PrivacyNav({ items, variant = "both" }: PrivacyNavProps) {
  const showMobile = variant === "mobile" || variant === "both";
  const showDesktop = variant === "desktop" || variant === "both";
  const [activeId, setActiveId] = useState(items[0]?.id ?? "");

  useEffect(() => {
    const sections = items
      .map((item) => document.getElementById(item.id))
      .filter((element): element is HTMLElement => element !== null);

    if (sections.length === 0) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);

        if (visible[0]?.target.id) {
          setActiveId(visible[0].target.id);
        }
      },
      {
        rootMargin: "-30% 0px -55% 0px",
        threshold: [0, 0.25, 0.5, 1],
      },
    );

    for (const section of sections) {
      observer.observe(section);
    }

    return () => observer.disconnect();
  }, [items]);

  return (
    <>
      {showMobile ? (
      <nav
        aria-label="Privacy policy sections"
        className="sticky top-20 z-20 -mx-4 border-b border-zinc-200 bg-white/95 px-4 py-3 backdrop-blur lg:hidden print:hidden dark:border-zinc-700 dark:bg-zinc-950/95"
      >
        <ul className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {items.map((item) => {
            const isActive = activeId === item.id;
            return (
              <li key={item.id} className="shrink-0">
                <a
                  href={`#${item.id}`}
                  className={`inline-flex rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                    isActive
                      ? "bg-teal-600 text-white"
                      : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
                  }`}
                  aria-current={isActive ? "location" : undefined}
                >
                  {item.label}
                </a>
              </li>
            );
          })}
        </ul>
      </nav>
      ) : null}

      {showDesktop ? (
      <nav
        aria-label="Privacy policy sections"
        className="hidden lg:block print:hidden"
      >
        <div className="sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-700 dark:bg-zinc-900/60">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            On this page
          </p>
          <ul className="space-y-1">
            {items.map((item) => {
              const isActive = activeId === item.id;
              return (
                <li key={item.id}>
                  <a
                    href={`#${item.id}`}
                    className={`block rounded-lg px-3 py-2 text-sm transition-colors ${
                      isActive
                        ? "bg-teal-50 font-medium text-teal-800 dark:bg-teal-950/50 dark:text-teal-200"
                        : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
                    }`}
                    aria-current={isActive ? "location" : undefined}
                  >
                    {item.label}
                  </a>
                </li>
              );
            })}
          </ul>
        </div>
      </nav>
      ) : null}
    </>
  );
}
