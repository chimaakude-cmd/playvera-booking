"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Activity,
  AlertTriangle,
  Bell,
  CheckCircle2,
  Clock,
  ExternalLink,
} from "lucide-react";
import { SiteFooter } from "@/components/SiteFooter";
import { HomeHeader } from "@/components/home/HomeHeader";
import { LazySupportLauncher } from "@/components/support/LazySupportLauncher";
import { TransparencyHero } from "@/components/transparency/TransparencyHero";
import {
  COMPONENT_HEALTH_LABELS,
  DEMO_PLATFORM_STATUS,
  getPlatformStatus,
  INCIDENT_STATUS_LABELS,
  OVERALL_STATUS_LABELS,
  type ComponentHealth,
  type PlatformStatusSnapshot,
} from "@/lib/platform-status";

const HEALTH_STYLES: Record<
  ComponentHealth,
  { dot: string; bg: string; text: string }
> = {
  operational: {
    dot: "bg-emerald-500",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
  },
  degraded: {
    dot: "bg-amber-500",
    bg: "bg-amber-50",
    text: "text-amber-700",
  },
  outage: {
    dot: "bg-red-500",
    bg: "bg-red-50",
    text: "text-red-700",
  },
};

const OVERALL_BADGE: Record<
  PlatformStatusSnapshot["overall"],
  { bg: string; text: string; icon: typeof CheckCircle2 }
> = {
  operational: {
    bg: "bg-emerald-500/20 border-emerald-400/40",
    text: "text-emerald-100",
    icon: CheckCircle2,
  },
  degraded: {
    bg: "bg-amber-500/20 border-amber-400/40",
    text: "text-amber-100",
    icon: AlertTriangle,
  },
  major_outage: {
    bg: "bg-red-500/20 border-red-400/40",
    text: "text-red-100",
    icon: AlertTriangle,
  },
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function StatusPage() {
  const [status, setStatus] = useState<PlatformStatusSnapshot>(DEMO_PLATFORM_STATUS);
  const [toast, setToast] = useState<string | null>(null);
  const [email, setEmail] = useState("");

  useEffect(() => {
    setStatus(getPlatformStatus());
  }, []);

  useEffect(() => {
    if (!toast) {
      return;
    }
    const timer = window.setTimeout(() => setToast(null), 4000);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const overallStyle = OVERALL_BADGE[status.overall];
  const OverallIcon = overallStyle.icon;

  function handleSubscribe(event: React.FormEvent) {
    event.preventDefault();
    if (!email.trim()) {
      return;
    }
    setToast("Thanks — status update emails are coming soon.");
    setEmail("");
  }

  return (
    <div className="flex min-h-full flex-col bg-white text-zinc-900">
      <HomeHeader />

      <main className="flex-1">
        <TransparencyHero
          eyebrow="Platform"
          title="System Status"
          subtitle="Real-time availability of Activora services. We monitor every core component and publish incidents as they happen."
        >
          <span
            className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold ${overallStyle.bg} ${overallStyle.text}`}
          >
            <OverallIcon className="h-4 w-4" aria-hidden />
            {OVERALL_STATUS_LABELS[status.overall]}
          </span>
        </TransparencyHero>

        <section className="border-b border-zinc-100 py-12 sm:py-16">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <h2 className="flex items-center gap-2 text-2xl font-bold text-zinc-900">
              <Activity className="h-6 w-6 text-teal-600" aria-hidden />
              Components
            </h2>
            <p className="mt-2 text-sm text-zinc-600">
              Health indicators for each platform surface.
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {status.components.map((component) => {
                const style = HEALTH_STYLES[component.health];
                return (
                  <div
                    key={component.id}
                    className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-zinc-900">
                        {component.name}
                      </p>
                      <span
                        className={`h-2.5 w-2.5 shrink-0 rounded-full ${style.dot}`}
                        aria-hidden
                      />
                    </div>
                    <p
                      className={`mt-2 inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${style.bg} ${style.text}`}
                    >
                      {COMPONENT_HEALTH_LABELS[component.health]}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="border-b border-zinc-100 bg-zinc-50/60 py-12 sm:py-16">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold text-zinc-900">Metrics</h2>
            <div className="mt-8 grid gap-6 sm:grid-cols-3">
              <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  Uptime (30 days)
                </p>
                <p className="mt-2 text-3xl font-bold text-teal-600">
                  {status.uptimePercent}%
                </p>
              </div>
              <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  Avg response time
                </p>
                <p className="mt-2 text-3xl font-bold text-teal-600">
                  {status.responseTimeMs}ms
                </p>
              </div>
              <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  Last incident
                </p>
                <p className="mt-2 flex items-center gap-2 text-lg font-semibold text-zinc-900">
                  <Clock className="h-5 w-5 text-zinc-400" aria-hidden />
                  {formatDate(status.lastIncident)}
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="border-b border-zinc-100 py-12 sm:py-16">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold text-zinc-900">Incident history</h2>
            <div className="mt-8 overflow-x-auto rounded-2xl border border-zinc-200 bg-white shadow-sm">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-zinc-100 bg-zinc-50 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  <tr>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Issue</th>
                    <th className="px-4 py-3">Resolution</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {status.incidents.map((incident) => (
                    <tr key={incident.id} className="text-zinc-700">
                      <td className="whitespace-nowrap px-4 py-3 font-medium text-zinc-900">
                        {formatDate(incident.date)}
                      </td>
                      <td className="px-4 py-3">{incident.issue}</td>
                      <td className="px-4 py-3 text-zinc-600">
                        {incident.resolution}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                          {INCIDENT_STATUS_LABELS[incident.status]}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <section className="py-12 sm:py-16">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-8 lg:grid-cols-2">
              <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
                <div className="flex items-center gap-2">
                  <Bell className="h-5 w-5 text-teal-600" aria-hidden />
                  <h2 className="text-lg font-bold text-zinc-900">
                    Subscribe to updates
                  </h2>
                </div>
                <p className="mt-2 text-sm text-zinc-600">
                  Get notified when we post incidents or maintenance windows.
                </p>
                <form onSubmit={handleSubscribe} className="mt-4 flex flex-col gap-3 sm:flex-row">
                  <input
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="you@example.com"
                    className="flex-1 rounded-xl border border-zinc-200 px-3 py-2.5 text-sm outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100"
                    required
                  />
                  <button
                    type="submit"
                    className="rounded-xl bg-teal-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-400"
                  >
                    Subscribe
                  </button>
                </form>
              </div>

              <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
                <h2 className="text-lg font-bold text-zinc-900">Report an issue</h2>
                <p className="mt-2 text-sm text-zinc-600">
                  Experiencing a problem? Tell us what happened so we can investigate.
                </p>
                <Link
                  href="/report-bug"
                  className="mt-4 inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50 px-5 py-2.5 text-sm font-semibold text-zinc-900 transition hover:border-teal-300 hover:bg-teal-50"
                >
                  Report an issue
                  <ExternalLink className="h-4 w-4" aria-hidden />
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      {toast ? (
        <div
          role="status"
          className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-xl bg-zinc-900 px-4 py-3 text-sm font-medium text-white shadow-lg"
        >
          {toast}
        </div>
      ) : null}

      <SiteFooter />
      <LazySupportLauncher />
    </div>
  );
}
