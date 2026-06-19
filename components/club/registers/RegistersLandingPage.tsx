"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/club/PageHeader";
import { LoadingState } from "@/components/club/LoadingState";
import { loadSessionsWithMeta } from "@/lib/data";
import {
  buildRegisterActivityCards,
  DEMO_BLOCK_SESSION_ID,
  type RegisterActivityCardData,
} from "@/lib/club-registers";
import type { ClubSession } from "@/lib/sessions";
import { RegisterActivityCard } from "./RegisterActivityCard";
import { RegisterQrModal } from "./RegisterQrModal";

export function RegistersLandingPage() {
  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState<ClubSession[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [qrCard, setQrCard] = useState<RegisterActivityCardData | null>(null);

  const loadSessions = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await loadSessionsWithMeta();
      setSessions(result.data);
      setError(result.error ?? null);
    } catch (loadError) {
      setSessions([]);
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Could not load activities.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadSessions();
  }, [loadSessions]);

  const cards = useMemo(() => buildRegisterActivityCards(sessions), [sessions]);

  const realActivities = useMemo(
    () => cards.filter((card) => !card.isExample),
    [cards],
  );

  const exampleActivities = useMemo(
    () => cards.filter((card) => card.isExample),
    [cards],
  );

  function handleToast(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(null), 2500);
  }

  if (loading) {
    return <LoadingState message="Loading registers..." />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Registers"
        description="Choose an activity to view its register, contact parents, or create a booking QR code."
      />

      {error ? (
        <p className="rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {error}
        </p>
      ) : null}

      {toast ? (
        <p className="rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
          {toast}
        </p>
      ) : null}

      {realActivities.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-200 bg-white px-6 py-16 text-center">
          <h2 className="text-lg font-semibold text-zinc-900">
            You haven&apos;t created any activities yet.
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-zinc-500">
            Create an activity to start taking bookings and managing registers.
          </p>
          <Link
            href="/club/create-session"
            className="mt-6 inline-flex rounded-lg bg-black px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-zinc-800"
          >
            Create your first activity
          </Link>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {realActivities.map((card) => (
            <RegisterActivityCard
              key={card.id}
              card={card}
              onCreateQr={setQrCard}
              onToast={handleToast}
            />
          ))}
        </div>
      )}

      {exampleActivities.length > 0 ? (
        <section className="space-y-4">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500">
              Example
            </h2>
            <p className="mt-1 text-sm text-zinc-600">
              Preview how registers work with sample bookings and block sessions.
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {exampleActivities.map((card) => (
              <RegisterActivityCard
                key={card.id}
                card={card}
                onCreateQr={setQrCard}
                onToast={handleToast}
              />
            ))}
          </div>
        </section>
      ) : null}

      <RegisterQrModal
        activityId={qrCard?.id ?? DEMO_BLOCK_SESSION_ID}
        activityTitle={qrCard?.title ?? "Activity"}
        open={qrCard !== null}
        onClose={() => setQrCard(null)}
      />
    </div>
  );
}
