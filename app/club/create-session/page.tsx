"use client";

import { PageHeader } from "@/components/club/PageHeader";
import { SessionWizard } from "@/components/club/session-wizard/SessionWizard";

export default function CreateSessionPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <PageHeader
        title="Create Session"
        description="Follow the Activora wizard to set up booking structure, schedule, tickets, and parent confirmation."
      />
      <SessionWizard />
    </div>
  );
}
