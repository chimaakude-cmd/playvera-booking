"use client";

import { ClubBookingQuestionsSettings } from "@/components/club/settings/ClubBookingQuestionsSettings";
import { PageHeader } from "@/components/club/PageHeader";

export default function ClubBookingQuestionsSettingsPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <PageHeader
        title="Booking questions"
        description="Enable Activora defaults and add custom questions for your club."
      />
      <ClubBookingQuestionsSettings />
    </div>
  );
}
