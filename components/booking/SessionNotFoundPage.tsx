"use client";

import { PublicNotFoundLayout } from "@/components/public/PublicNotFoundLayout";
import { buildSessionsUrl } from "@/lib/home/search-url";

const UK_POSTCODE_PATTERN =
  /^[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}$/i;

function buildSessionNotFoundSearchUrl(query: string): string {
  const trimmed = query.trim();
  if (UK_POSTCODE_PATTERN.test(trimmed)) {
    return buildSessionsUrl({
      location: trimmed.toUpperCase(),
      childAge: "",
      radius: "10",
      activity: "",
      date: "",
    });
  }

  return buildSessionsUrl({
    location: "",
    childAge: "",
    radius: "",
    activity: trimmed,
    date: "",
  });
}

export function SessionNotFoundPage() {
  return (
    <PublicNotFoundLayout
      headline="Session not found"
      body="We couldn't find this session. It may have been removed, the link may have changed, or the session may no longer be available."
      searchInputId="session-not-found-search"
      searchTitle="Looking for another activity?"
      searchPlaceholder="Search by activity, club, or postcode"
      icon="📅"
      onSearch={buildSessionNotFoundSearchUrl}
      actions={[
        { label: "Browse activities", href: "/sessions", variant: "primary" },
        { label: "View clubs", href: "/", variant: "secondary" },
        { label: "Go to homepage", href: "/", variant: "outline" },
        { label: "Sign in", href: "/login", variant: "outline" },
      ]}
    />
  );
}
