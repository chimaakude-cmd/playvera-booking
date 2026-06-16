"use client";

import { useFranchiseePolicy } from "@/lib/organisation";

export function FranchiseeManagedBanner() {
  const { isManaged, organisation } = useFranchiseePolicy();

  if (!isManaged || !organisation) {
    return null;
  }

  return (
    <div className="rounded-xl border border-violet-200 bg-violet-50 px-4 py-3 text-sm text-violet-900">
      This club is managed by{" "}
      <span className="font-semibold">{organisation.name}</span>. Some settings
      are controlled by your franchisor.
    </div>
  );
}
