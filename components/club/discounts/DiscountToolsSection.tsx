"use client";

import {
  BadgePercent,
  CalendarClock,
  Gift,
  HandCoins,
  Layers,
  Users,
  type LucideIcon,
} from "lucide-react";
import {
  DISCOUNT_TOOLS,
  type DiscountToolConfig,
  type DiscountToolId,
} from "@/lib/club-discounts/presets";

const TOOL_ICONS: Record<DiscountToolId, LucideIcon> = {
  sibling: Users,
  early_bird: CalendarClock,
  multi_session: Layers,
  free_trial: Gift,
  manual: HandCoins,
  first_booking: BadgePercent,
};

type DiscountToolsSectionProps = {
  canManage: boolean;
  onCreateTool: (toolId: DiscountToolId) => void;
};

function StatusBadge({ availability }: { availability: DiscountToolConfig["availability"] }) {
  if (availability === "available") {
    return (
      <span className="rounded-full bg-teal-50 px-2.5 py-0.5 text-[11px] font-semibold text-teal-700 ring-1 ring-inset ring-teal-600/15">
        Available
      </span>
    );
  }

  return (
    <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-[11px] font-semibold text-zinc-600 ring-1 ring-inset ring-zinc-200">
      Available soon
    </span>
  );
}

function DiscountToolCard({
  tool,
  canManage,
  onCreateTool,
}: {
  tool: DiscountToolConfig;
  canManage: boolean;
  onCreateTool: (toolId: DiscountToolId) => void;
}) {
  const Icon = TOOL_ICONS[tool.id];
  const isAvailable = tool.availability === "available";

  return (
    <article
      className={`flex h-full flex-col rounded-xl border p-4 transition-shadow duration-200 ${
        isAvailable
          ? "border-zinc-200/80 bg-white shadow-sm hover:shadow-md"
          : "border-zinc-200/60 bg-zinc-50/50"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ring-1 ring-inset ${
            isAvailable
              ? "bg-teal-50 text-teal-700 ring-teal-600/15"
              : "bg-zinc-100 text-zinc-500 ring-zinc-200"
          }`}
        >
          <Icon className="h-5 w-5" aria-hidden />
        </div>
        <StatusBadge availability={tool.availability} />
      </div>

      <h3 className="mt-4 text-sm font-semibold text-zinc-900">{tool.title}</h3>
      <p className="mt-2 flex-1 text-sm leading-6 text-zinc-500">{tool.description}</p>

      {isAvailable && canManage && tool.buttonLabel ? (
        <button
          type="button"
          onClick={() => onCreateTool(tool.id)}
          className="mt-4 inline-flex w-full items-center justify-center rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-teal-700"
        >
          {tool.buttonLabel}
        </button>
      ) : null}

      {!isAvailable ? (
        <p className="mt-4 rounded-lg border border-zinc-200/80 bg-white/80 px-3 py-2.5 text-xs leading-5 text-zinc-500">
          {tool.unavailableNote}
        </p>
      ) : null}

      {isAvailable && !canManage ? (
        <p className="mt-4 text-xs leading-5 text-zinc-500">
          Your role can view discounts but not create new offers.
        </p>
      ) : null}
    </article>
  );
}

export function DiscountToolsSection({
  canManage,
  onCreateTool,
}: DiscountToolsSectionProps) {
  return (
    <div className="space-y-4">
      <p className="text-sm leading-6 text-zinc-500">
        Discounts should be used carefully so clubs still cover staffing, venue and
        platform costs.
      </p>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {DISCOUNT_TOOLS.map((tool) => (
          <DiscountToolCard
            key={tool.id}
            tool={tool}
            canManage={canManage}
            onCreateTool={onCreateTool}
          />
        ))}
      </div>
    </div>
  );
}
