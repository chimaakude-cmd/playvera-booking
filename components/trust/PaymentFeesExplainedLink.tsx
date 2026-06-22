import Link from "next/link";

type PaymentFeesExplainedLinkProps = {
  provider: "stripe" | "gocardless";
  className?: string;
};

const HREF_BY_PROVIDER = {
  stripe: "/trust/stripe-payments",
  gocardless: "/trust/gocardless-payments",
} as const;

export function PaymentFeesExplainedLink({
  provider,
  className = "",
}: PaymentFeesExplainedLinkProps) {
  return (
    <Link
      href={HREF_BY_PROVIDER[provider]}
      className={`text-sm font-semibold text-violet-700 underline-offset-2 hover:text-violet-900 hover:underline ${className}`.trim()}
    >
      Payment fees explained
    </Link>
  );
}
