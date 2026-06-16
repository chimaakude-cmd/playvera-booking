"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";
import { LoadingState } from "@/components/club/LoadingState";
import { PageHeader } from "@/components/club/PageHeader";
import { SessionForm } from "@/components/club/SessionForm";
import {
  ClubSession,
  getSessionById,
  SessionInput,
  updateSession,
} from "@/lib/sessions";

export default function EditSessionPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.id as string;

  const [session, setSession] = useState<ClubSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const found = getSessionById(sessionId);
    setSession(found ?? null);
    setLoading(false);
  }, [sessionId]);

  function handleSubmit(data: SessionInput) {
    updateSession(sessionId, data);
    router.push("/club/activities?updated=1");
  }

  if (loading) {
    return <LoadingState message="Loading session..." />;
  }

  if (!session) {
    return (
      <div className="space-y-6">
        <PageHeader title="Session not found" />
        <p className="text-sm text-zinc-500">
          This session may have been deleted.
        </p>
        <Link
          href="/club/activities"
          className="inline-flex rounded-lg bg-black px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-zinc-800"
        >
          Back to Sessions
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <PageHeader
        title="Edit Session"
        description={`Update details for ${session.sessionTitle}.`}
      />
      <SessionForm
        initialValues={session}
        submitLabel="Save Changes"
        onSubmit={handleSubmit}
      />
    </div>
  );
}
