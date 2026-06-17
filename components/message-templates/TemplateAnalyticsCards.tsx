type TemplateAnalyticsCardsProps = {
  accent?: "violet" | "teal";
};

export function TemplateAnalyticsCards({
  accent = "violet",
}: TemplateAnalyticsCardsProps) {
  const borderClass =
    accent === "violet"
      ? "border-violet-100 bg-violet-50/60 text-violet-900"
      : "border-teal-100 bg-teal-50/60 text-teal-900";

  return (
    <p
      className={`rounded-xl border px-4 py-3 text-sm leading-6 ${borderClass}`}
    >
      Analytics will appear once real messages are sent.
    </p>
  );
}
