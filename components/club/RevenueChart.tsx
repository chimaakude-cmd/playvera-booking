import { formatCurrency } from "@/lib/sessions";

type RevenueChartProps = {
  data: { label: string; value: number }[];
};

export function RevenueChart({ data }: RevenueChartProps) {
  const maxValue = Math.max(...data.map((item) => item.value), 1);

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-zinc-900">Revenue</h2>
          <p className="mt-1 text-sm text-zinc-500">
            Weekly confirmed booking revenue
          </p>
        </div>
        <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-600">
          Placeholder
        </span>
      </div>

      <div className="mt-8 flex h-48 items-end justify-between gap-2">
        {data.map((item) => {
          const height = `${Math.max((item.value / maxValue) * 100, item.value > 0 ? 8 : 4)}%`;

          return (
            <div
              key={item.label}
              className="flex flex-1 flex-col items-center gap-2"
            >
              <span className="text-xs font-medium text-zinc-500">
                {item.value > 0 ? formatCurrency(item.value) : "—"}
              </span>
              <div className="flex h-32 w-full items-end">
                <div
                  className="w-full rounded-t-md bg-zinc-900 transition-all"
                  style={{ height }}
                />
              </div>
              <span className="text-xs text-zinc-400">{item.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
