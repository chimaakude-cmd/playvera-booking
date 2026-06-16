import { formatCurrency } from "@/lib/sessions";
import type { ChartPoint } from "@/lib/dashboard-metrics";
import { DashboardSection } from "./DashboardCards";

type TrendChartProps = {
  title: string;
  description: string;
  data: ChartPoint[];
  valuePrefix?: string;
  emptyLabel?: string;
};

function TrendChart({
  title,
  description,
  data,
  valuePrefix = "£",
  emptyLabel = "No data yet",
}: TrendChartProps) {
  const maxValue = Math.max(...data.map((item) => item.value), 1);

  return (
    <DashboardSection title={title} description={description}>
      <div className="flex h-52 items-end justify-between gap-2 sm:gap-3">
        {data.map((item) => {
          const height = `${Math.max((item.value / maxValue) * 100, item.value > 0 ? 10 : 4)}%`;

          return (
            <div
              key={item.label}
              className="flex flex-1 flex-col items-center gap-2"
            >
              <span className="text-[11px] font-medium text-zinc-500">
                {item.value > 0
                  ? valuePrefix === "£"
                    ? formatCurrency(item.value)
                    : String(item.value)
                  : "—"}
              </span>
              <div className="flex h-36 w-full items-end">
                <div
                  className="w-full rounded-t-lg bg-gradient-to-t from-teal-600 to-teal-400 transition-all duration-300"
                  style={{ height }}
                />
              </div>
              <span className="text-[11px] text-zinc-400">{item.label}</span>
            </div>
          );
        })}
      </div>
      {data.every((item) => item.value === 0) ? (
        <p className="mt-4 text-center text-xs text-zinc-500">{emptyLabel}</p>
      ) : null}
    </DashboardSection>
  );
}

export function RevenueTrendChart({ data }: { data: ChartPoint[] }) {
  return (
    <TrendChart
      title="Revenue"
      description="Confirmed revenue over the last six months"
      data={data}
      emptyLabel="Revenue will appear once bookings are confirmed."
    />
  );
}

export function BookingTrendChart({ data }: { data: ChartPoint[] }) {
  return (
    <TrendChart
      title="Booking trend"
      description="New bookings created each day this week"
      data={data}
      valuePrefix=""
      emptyLabel="Booking trends will appear as parents sign up."
    />
  );
}
