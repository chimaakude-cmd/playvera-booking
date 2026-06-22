import Link from "next/link";
import { ACTIVORA_ACTION } from "@/lib/home/constants";

const linkClassName =
  "inline-flex items-center justify-center rounded-xl px-5 py-2.5 text-sm font-semibold transition-colors";

export function TrustPaymentCTAs() {
  return (
    <nav
      aria-label="Related actions"
      className="mt-10 flex flex-col gap-3 sm:flex-row sm:flex-wrap"
    >
      <Link
        href="/get-started"
        className={`${linkClassName} text-white hover:opacity-90`}
        style={{ backgroundColor: ACTIVORA_ACTION }}
      >
        Create provider account
      </Link>
      <Link
        href="/privacy"
        className={`${linkClassName} border border-zinc-200 bg-white text-zinc-800 hover:bg-zinc-50`}
      >
        Read GDPR policy
      </Link>
      <Link
        href="/contact"
        className={`${linkClassName} border border-zinc-200 bg-white text-zinc-800 hover:bg-zinc-50`}
      >
        Contact support
      </Link>
    </nav>
  );
}
