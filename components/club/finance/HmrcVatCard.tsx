import { HMRC_TAX_DISCLAIMER, HMRC_VAT_LINKS } from "@/lib/club-finance";
import { FinanceSection } from "./shared";

const HMRC_ACTIONS = [
  {
    label: "Register for VAT",
    href: HMRC_VAT_LINKS.register,
    description: "Official HMRC service to register your business for VAT.",
  },
  {
    label: "Manage VAT account",
    href: HMRC_VAT_LINKS.manageAccount,
    description: "Sign in to HMRC online services to manage your VAT account.",
  },
  {
    label: "Learn about VAT threshold",
    href: HMRC_VAT_LINKS.vatThreshold,
    description: "Current UK VAT registration thresholds and guidance.",
  },
] as const;

export function HmrcVatCard() {
  return (
    <FinanceSection
      title="HMRC VAT registration"
      description="Go directly to the official UK government website to register for VAT or manage your VAT account."
    >
      <div className="grid gap-4 sm:grid-cols-3">
        {HMRC_ACTIONS.map((action) => (
          <a
            key={action.label}
            href={action.href}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex flex-col rounded-xl border border-zinc-200 bg-white p-4 transition-all hover:border-zinc-300 hover:shadow-sm"
          >
            <span className="text-sm font-semibold text-zinc-900 group-hover:text-teal-700">
              {action.label}
            </span>
            <span className="mt-1 flex-1 text-xs leading-5 text-zinc-500">
              {action.description}
            </span>
            <span className="mt-3 text-xs font-medium text-teal-700">
              Opens gov.uk ↗
            </span>
          </a>
        ))}
      </div>

      <p className="mt-5 rounded-xl border border-amber-100 bg-amber-50/60 px-4 py-3 text-sm leading-6 text-amber-900">
        {HMRC_TAX_DISCLAIMER}
      </p>
    </FinanceSection>
  );
}
