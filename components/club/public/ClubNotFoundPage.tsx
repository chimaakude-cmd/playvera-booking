"use client";

import { PublicNotFoundLayout } from "@/components/public/PublicNotFoundLayout";

export function ClubNotFoundPage() {
  return (
    <PublicNotFoundLayout
      headline="Club page not found"
      body="We couldn't find this club profile. The link may have changed, or the club may no longer be available."
      searchInputId="club-not-found-search"
      searchTitle="Looking for another activity?"
      searchPlaceholder="Search by activity, club, or postcode"
      actions={[
        { label: "Browse activities", href: "/sessions", variant: "primary" },
        { label: "View clubs", href: "/", variant: "secondary" },
        { label: "Go to homepage", href: "/", variant: "outline" },
        { label: "Sign in", href: "/login", variant: "outline" },
      ]}
    />
  );
}
