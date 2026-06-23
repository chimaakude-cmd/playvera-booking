import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

type ProviderFinancePaymentProvidersPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

/** Alias for club finance payment providers tab (Stripe Connect return URLs). */
export default async function ProviderFinancePaymentProvidersPage({
  searchParams,
}: ProviderFinancePaymentProvidersPageProps) {
  const params = await searchParams;
  const query = new URLSearchParams({ tab: "payment-providers" });

  if (params.stripe_connected === "true") {
    query.set("stripe", "complete");
  }

  if (params.retry === "1") {
    query.set("retry", "1");
  }

  if (params.stripe === "error") {
    query.set("stripe", "error");
    const reason = params.reason;
    if (typeof reason === "string") {
      query.set("reason", reason);
    }
  }

  redirect(`/club/finance?${query.toString()}`);
}
