"use client";

import { useEffect, useState } from "react";
import { ChangePasswordSection } from "@/components/auth/ChangePasswordSection";
import { BookingQuestionsSettings } from "@/components/admin/settings/BookingQuestionsSettings";
import { PlatformFeeStructureSection } from "@/components/admin/settings/PlatformFeeStructureSection";
import { PageHeader } from "@/components/club/PageHeader";
import {
  DEFAULT_PLATFORM_SETTINGS,
  type PlatformSettings,
} from "@/lib/admin";
import { invalidatePlatformPublicSettingsCache } from "@/lib/platform-settings/client-cache";
import type { PlatformSettingsPayload } from "@/lib/platform-settings/types";

type SettingsTab = "general" | "fees" | "booking-questions";

async function fetchPlatformSettings(): Promise<PlatformSettingsPayload> {
  const response = await fetch("/api/admin/platform-settings", {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Failed to load platform settings.");
  }

  const data = (await response.json()) as { settings: PlatformSettingsPayload };
  return data.settings;
}

export function AdminSettingsSection() {
  const [tab, setTab] = useState<SettingsTab>("general");
  const [settings, setSettings] = useState<PlatformSettings>(
    DEFAULT_PLATFORM_SETTINGS,
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const payload = await fetchPlatformSettings();
        if (!cancelled) {
          setSettings(payload);
          setError(null);
        }
      } catch {
        if (!cancelled) {
          setError("Unable to load platform settings.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  function handleChange<K extends keyof PlatformSettings>(
    key: K,
    value: PlatformSettings[K],
  ) {
    setSettings((current) => ({ ...current, [key]: value }));
    setSaved(false);
    setError(null);
  }

  async function handleSave(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setSaved(false);
    setError(null);

    try {
      const response = await fetch("/api/admin/platform-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });

      if (!response.ok) {
        throw new Error("Save failed");
      }

      const data = (await response.json()) as { settings: PlatformSettingsPayload };
      setSettings(data.settings);
      invalidatePlatformPublicSettingsCache();
      setSaved(true);
    } catch {
      setError("Unable to save settings. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function handleReset() {
    setSaving(true);
    setSaved(false);
    setError(null);

    try {
      const response = await fetch("/api/admin/platform-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reset: true }),
      });

      if (!response.ok) {
        throw new Error("Reset failed");
      }

      const data = (await response.json()) as { settings: PlatformSettingsPayload };
      setSettings(data.settings);
      invalidatePlatformPublicSettingsCache();
      setSaved(true);
    } catch {
      setError("Unable to save settings. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Platform Settings"
        description="Platform-wide configuration for Activora marketplace operations."
      />

      <div className="flex gap-1 rounded-xl bg-zinc-100 p-1 max-w-lg">
        {(
          [
            { id: "general", label: "General" },
            { id: "fees", label: "Fees" },
            { id: "booking-questions", label: "Booking questions" },
          ] as const
        ).map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={`flex-1 rounded-lg px-3 py-2 text-sm font-semibold transition-all ${
              tab === item.id
                ? "bg-white text-zinc-900 shadow-sm"
                : "text-zinc-500 hover:text-zinc-700"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {tab === "booking-questions" ? (
        <div className="max-w-3xl rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-sm">
          <BookingQuestionsSettings />
        </div>
      ) : null}

      {tab === "fees" ? <PlatformFeeStructureSection /> : null}

      {tab === "general" ? (
      <form
        onSubmit={handleSave}
        className="max-w-2xl space-y-6 rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-sm"
      >
        {loading ? (
          <p className="text-sm text-zinc-500">Loading settings…</p>
        ) : null}

        <div className="grid gap-5 sm:grid-cols-2">
          <label className="block sm:col-span-2">
            <span className="text-sm font-medium text-zinc-700">
              Platform name
            </span>
            <input
              type="text"
              value={settings.platformName}
              onChange={(e) => handleChange("platformName", e.target.value)}
              disabled={loading || saving}
              className="mt-1.5 w-full rounded-xl border border-zinc-200 px-4 py-2.5 text-sm text-zinc-900 outline-none ring-violet-500/0 transition focus:border-violet-300 focus:ring-2 focus:ring-violet-500/20 disabled:opacity-60"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-zinc-700">
              Support email
            </span>
            <input
              type="email"
              value={settings.supportEmail}
              onChange={(e) => handleChange("supportEmail", e.target.value)}
              disabled={loading || saving}
              className="mt-1.5 w-full rounded-xl border border-zinc-200 px-4 py-2.5 text-sm text-zinc-900 outline-none transition focus:border-violet-300 focus:ring-2 focus:ring-violet-500/20 disabled:opacity-60"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-zinc-700">
              Support phone
            </span>
            <input
              type="tel"
              value={settings.supportPhone}
              onChange={(e) => handleChange("supportPhone", e.target.value)}
              disabled={loading || saving}
              className="mt-1.5 w-full rounded-xl border border-zinc-200 px-4 py-2.5 text-sm text-zinc-900 outline-none transition focus:border-violet-300 focus:ring-2 focus:ring-violet-500/20 disabled:opacity-60"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-zinc-700">
              Platform URL
            </span>
            <input
              type="url"
              value={settings.platformUrl}
              onChange={(e) => handleChange("platformUrl", e.target.value)}
              disabled={loading || saving}
              className="mt-1.5 w-full rounded-xl border border-zinc-200 px-4 py-2.5 text-sm text-zinc-900 outline-none transition focus:border-violet-300 focus:ring-2 focus:ring-violet-500/20 disabled:opacity-60"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-zinc-700">
              Default currency
            </span>
            <input
              type="text"
              value={settings.defaultCurrency}
              onChange={(e) => handleChange("defaultCurrency", e.target.value)}
              disabled={loading || saving}
              className="mt-1.5 w-full rounded-xl border border-zinc-200 px-4 py-2.5 text-sm text-zinc-900 outline-none transition focus:border-violet-300 focus:ring-2 focus:ring-violet-500/20 disabled:opacity-60"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-zinc-700">Country</span>
            <input
              type="text"
              value={settings.country}
              onChange={(e) => handleChange("country", e.target.value)}
              disabled={loading || saving}
              className="mt-1.5 w-full rounded-xl border border-zinc-200 px-4 py-2.5 text-sm text-zinc-900 outline-none transition focus:border-violet-300 focus:ring-2 focus:ring-violet-500/20 disabled:opacity-60"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-zinc-700">
              VAT threshold (£)
            </span>
            <input
              type="number"
              value={settings.vatThreshold}
              onChange={(e) =>
                handleChange("vatThreshold", Number(e.target.value))
              }
              disabled={loading || saving}
              className="mt-1.5 w-full rounded-xl border border-zinc-200 px-4 py-2.5 text-sm text-zinc-900 outline-none transition focus:border-violet-300 focus:ring-2 focus:ring-violet-500/20 disabled:opacity-60"
            />
          </label>

          <label className="block sm:col-span-2">
            <span className="text-sm font-medium text-zinc-700">
              Marketplace footer text
            </span>
            <input
              type="text"
              value={settings.marketplaceFooterText}
              onChange={(e) =>
                handleChange("marketplaceFooterText", e.target.value)
              }
              disabled={loading || saving}
              className="mt-1.5 w-full rounded-xl border border-zinc-200 px-4 py-2.5 text-sm text-zinc-900 outline-none transition focus:border-violet-300 focus:ring-2 focus:ring-violet-500/20 disabled:opacity-60"
            />
          </label>
        </div>

        <div className="space-y-4 border-t border-zinc-100 pt-5">
          <h3 className="text-sm font-semibold text-zinc-900">
            Marketplace settings
          </h3>
          <label className="flex items-center justify-between gap-4 rounded-xl border border-zinc-200 px-4 py-3">
            <span className="text-sm text-zinc-700">
              Marketplace enabled
            </span>
            <input
              type="checkbox"
              checked={settings.marketplaceEnabled}
              onChange={(e) =>
                handleChange("marketplaceEnabled", e.target.checked)
              }
              disabled={loading || saving}
              className="h-4 w-4 rounded border-zinc-300 text-violet-600"
            />
          </label>
          <label className="flex items-center justify-between gap-4 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3">
            <span>
              <span className="block text-sm text-zinc-700">
                AI search assistant enabled
              </span>
              <span className="text-xs text-zinc-500">
                Enables AI search assistant on activity discovery (Phase 1 only)
              </span>
            </span>
            <input
              type="checkbox"
              checked={settings.aiAssistantEnabled}
              onChange={(e) =>
                handleChange("aiAssistantEnabled", e.target.checked)
              }
              disabled={loading || saving}
              className="h-4 w-4 rounded border-zinc-300 text-violet-600"
            />
          </label>
        </div>

        <div className="flex flex-wrap items-center gap-3 border-t border-zinc-100 pt-5">
          <button
            type="submit"
            disabled={loading || saving}
            className="rounded-xl bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-zinc-800 disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save settings"}
          </button>
          <button
            type="button"
            onClick={() => void handleReset()}
            disabled={loading || saving}
            className="rounded-xl border border-zinc-200 px-5 py-2.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 disabled:opacity-60"
          >
            Reset to defaults
          </button>
          {saved ? (
            <span className="text-sm font-medium text-emerald-600">
              Settings saved successfully.
            </span>
          ) : null}
          {error ? (
            <span className="text-sm font-medium text-red-600">{error}</span>
          ) : null}
        </div>
      </form>
      ) : null}

      <ChangePasswordSection
        title="Staff account password"
        description="Update your Activora staff sign-in password."
      />
    </div>
  );
}
