"use client";

import { getActivitiesByPopularity } from "@/lib/home/activity-catalog";
import { ACTIVORA_ACTION } from "@/lib/home/constants";
import { DISCOVERY_RADIUS } from "@/lib/discovery/constants";

type DiscoveryActivityChipsProps = {
  activeQuery: string;
  onSelect: (query: string) => void;
};

const VISIBLE_COUNT = 10;

export function DiscoveryActivityChips({
  activeQuery,
  onSelect,
}: DiscoveryActivityChipsProps) {
  const activities = getActivitiesByPopularity().slice(0, VISIBLE_COUNT);

  return (
    <div className="border-b border-orange-100/50 bg-white py-3">
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6">
        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-0.5 scrollbar-none">
          {activities.map((activity) => {
            const isActive =
              activeQuery.toLowerCase() === activity.query.toLowerCase();

            return (
              <button
                key={activity.label}
                type="button"
                onClick={() => onSelect(activity.query)}
                className={`inline-flex shrink-0 items-center gap-1.5 px-3.5 py-2 text-xs font-semibold transition-all duration-200 sm:text-sm ${DISCOVERY_RADIUS.button} ${
                  isActive
                    ? "text-white shadow-sm"
                    : "border border-orange-100/80 bg-[#FFFBF7] text-[#0F172A] hover:border-orange-200 hover:bg-orange-50"
                }`}
                style={
                  isActive ? { backgroundColor: ACTIVORA_ACTION } : undefined
                }
              >
                <span aria-hidden>{activity.icon}</span>
                {activity.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
