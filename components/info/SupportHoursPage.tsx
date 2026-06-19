"use client";

import Link from "next/link";
import { StaticInfoPageLayout } from "@/components/public/StaticInfoPageLayout";
import { FOOTER_SUPPORT_HOURS } from "@/lib/callback-requests";
import { ACTIVORA_ACTION } from "@/lib/home/constants";

export function SupportHoursPage() {
  return (
    <StaticInfoPageLayout
      eyebrow="Support"
      title="Support hours"
      subtitle="Our support hours are the same as our opening hours."
    >
      <div className="rounded-2xl border border-orange-50 bg-[#FFF8F3] px-5 py-4">
        <p className="text-sm font-semibold text-zinc-900">Opening hours</p>
        <p className="mt-1 text-sm text-zinc-600">{FOOTER_SUPPORT_HOURS}</p>
      </div>
      <p>
        During support hours, we aim to respond as quickly as possible. However,
        there may be times when we are handling high workloads, updating the
        website, fixing issues or making improvements to the platform.
      </p>
      <p>
        If we cannot respond straight away, we will always aim to get back to you
        within one working day, or by the next day at the very latest.
      </p>
      <p>
        Sometimes we may respond outside normal support hours to make sure your
        issue receives a fair and helpful reply.
      </p>
      <p>
        <Link
          href="/contact"
          className="font-semibold transition-colors hover:opacity-90"
          style={{ color: ACTIVORA_ACTION }}
        >
          Contact us
        </Link>{" "}
        if you need help and we will get back to you as soon as we can.
      </p>
    </StaticInfoPageLayout>
  );
}
