"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { PageHeader } from "@/components/club/PageHeader";
import type {
  GoCardlessPlatformConfigPublic,
  GoCardlessPlatformLogRow,
} from "@/lib/gocardless/platform-config/types";

type ConfigResponse = {
  config: GoCardlessPlatformConfigPublic;
  resolved: {
    isClubConnectAvailable: boolean;
    isBillingConfigured: boolean;
    callbackUri: string;
    webhookUri: string;
  };
};

type FormState = {
  environment: "sandbox" | "live";
  accessToken: string;
  webhookSecret: string;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  callbackUri: string;
  platformEnabled: boolean;
  platformFeePercent: string;
};

function StatusPill({
  label,
  tone,
}: {
  label: string;
  tone: "ok" | "warn" | "error" | "neutral";
}) {
  const styles = {
    ok: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    warn: "bg-amber-50 text-amber-800 ring-amber-200",
    error: "bg-rose-50 text-rose-700 ring-rose-200",
    neutral: "bg-zinc-100 text-zinc-600 ring-zinc-200",
  };

  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${styles[tone]}`}
    >
      {label}
    </span>
  );
}

function connectionTone(
  status: GoCardlessPlatformConfigPublic["connectionStatus"],
): "ok" | "warn" | "error" | "neutral" {
  if (status === "live_connected" || status === "sandbox_connected") {
    return "ok";
  }
  if (status === "error") {
    return "error";
  }
  return "warn";
}

type Props = {
  /** When true, renders inline on /admin/finance without page chrome. */
  embedded?: boolean;
};

export function AdminGoCardlessSetupSection({ embedded = false }: Props) {
  const [config, setConfig] = useState<GoCardlessPlatformConfigPublic | null>(
    null,
  );
  const [resolved, setResolved] = useState<ConfigResponse["resolved"] | null>(
    null,
  );
  const [form, setForm] = useState<FormState>({
    environment: "sandbox",
    accessToken: "",
    webhookSecret: "",
    clientId: "",
    clientSecret: "",
    redirectUri: "",
    callbackUri: "",
    platformEnabled: false,
    platformFeePercent: "2.5",
  });
  const [logs, setLogs] = useState<GoCardlessPlatformLogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [testSplit, setTestSplit] = useState<Record<string, number> | null>(
    null,
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [configRes, logsRes] = await Promise.all([
        fetch("/api/admin/gocardless-platform-config"),
        fetch("/api/admin/gocardless-platform-config/logs?limit=20"),
      ]);

      if (!configRes.ok) {
        throw new Error("Unable to load GoCardless platform configuration.");
      }

      const configData = (await configRes.json()) as ConfigResponse;
      setConfig(configData.config);
      setResolved(configData.resolved);
      setForm({
        environment: configData.config.environment,
        accessToken: "",
        webhookSecret: "",
        clientId: configData.config.clientId ?? "",
        clientSecret: "",
        redirectUri: configData.config.redirectUri ?? "",
        callbackUri:
          configData.config.callbackUri ?? configData.resolved.callbackUri,
        platformEnabled: configData.config.platformEnabled,
        platformFeePercent: String(configData.config.platformFeePercent),
      });

      if (logsRes.ok) {
        const logsData = (await logsRes.json()) as {
          logs: GoCardlessPlatformLogRow[];
        };
        setLogs(logsData.logs);
      }
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Failed to load configuration.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleSave() {
    setSaving(true);
    setError(null);
    setMessage(null);

    try {
      const body: Record<string, unknown> = {
        environment: form.environment,
        clientId: form.clientId || null,
        redirectUri: form.redirectUri || null,
        callbackUri: form.callbackUri || null,
        platformEnabled: form.platformEnabled,
        platformFeePercent: Number(form.platformFeePercent),
      };

      if (form.accessToken.trim()) {
        body.accessToken = form.accessToken.trim();
      }
      if (form.webhookSecret.trim()) {
        body.webhookSecret = form.webhookSecret.trim();
      }
      if (form.clientSecret.trim()) {
        body.clientSecret = form.clientSecret.trim();
      }

      const response = await fetch("/api/admin/gocardless-platform-config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const payload = (await response.json()) as { error?: string };
        throw new Error(payload.error ?? "Save failed.");
      }

      setMessage("GoCardless platform configuration saved.");
      setForm((current) => ({
        ...current,
        accessToken: "",
        webhookSecret: "",
        clientSecret: "",
      }));
      await load();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Save failed.");
    } finally {
      setSaving(false);
    }
  }

  async function handleTestConnection() {
    setTesting(true);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch("/api/admin/gocardless-platform-config/test", {
        method: "POST",
      });
      const payload = (await response.json()) as {
        ok?: boolean;
        message?: string;
        error?: string;
      };

      if (!response.ok || !payload.ok) {
        throw new Error(payload.error ?? payload.message ?? "Connection test failed.");
      }

      setMessage(payload.message ?? "Connection test passed.");
      await load();
    } catch (testError) {
      setError(
        testError instanceof Error
          ? testError.message
          : "Connection test failed.",
      );
    } finally {
      setTesting(false);
    }
  }

  async function handleDisable() {
    if (!window.confirm("Disable GoCardless platform? Clubs will lose Direct Debit connect.")) {
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const response = await fetch("/api/admin/gocardless-platform-config/disable", {
        method: "POST",
      });
      if (!response.ok) {
        throw new Error("Unable to disable GoCardless platform.");
      }
      setMessage("GoCardless platform disabled.");
      await load();
    } catch (disableError) {
      setError(
        disableError instanceof Error
          ? disableError.message
          : "Disable failed.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleTestPayment() {
    setTesting(true);
    setError(null);
    setMessage(null);
    setTestSplit(null);

    try {
      const response = await fetch(
        "/api/admin/gocardless-platform-config/test-payment",
        { method: "POST" },
      );
      const payload = (await response.json()) as {
        ok?: boolean;
        message?: string;
        split?: Record<string, number>;
        error?: string;
      };

      if (!response.ok || !payload.ok) {
        throw new Error(payload.error ?? payload.message ?? "Test payment failed.");
      }

      setTestSplit(payload.split ?? null);
      setMessage(payload.message ?? "Test payment recorded.");
      await load();
    } catch (paymentError) {
      setError(
        paymentError instanceof Error
          ? paymentError.message
          : "Test payment failed.",
      );
    } finally {
      setTesting(false);
    }
  }

  async function handleSimulateWebhook() {
    setTesting(true);
    setError(null);

    try {
      const response = await fetch(
        "/api/admin/gocardless-platform-config/simulate-webhook",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ event: "payment_confirmed" }),
        },
      );
      const payload = (await response.json()) as {
        ok?: boolean;
        message?: string;
        error?: string;
      };

      if (!response.ok || !payload.ok) {
        throw new Error(payload.error ?? "Webhook simulation failed.");
      }

      setMessage(payload.message ?? "Webhook simulated.");
      await load();
    } catch (webhookError) {
      setError(
        webhookError instanceof Error
          ? webhookError.message
          : "Webhook simulation failed.",
      );
    } finally {
      setTesting(false);
    }
  }

  const lastCheckedLabel = config?.lastTestedAt
    ? new Date(config.lastTestedAt).toLocaleString("en-GB")
    : "Never";

  return (
    <div className="space-y-6" id={embedded ? "gocardless-platform-setup" : undefined}>
      {embedded ? (
        <div className="rounded-2xl border border-zinc-200/80 bg-white px-6 py-5 shadow-sm">
          <h2 className="text-lg font-semibold text-zinc-900">GoCardless Platform Setup</h2>
          <p className="mt-1 text-sm text-zinc-500">
            Configure Direct Debit at the platform level before clubs can connect. Activora retains the platform fee before club payout.
          </p>
        </div>
      ) : (
        <PageHeader
          title="GoCardless platform setup"
          description="Configure Direct Debit at the platform level before clubs can connect. Activora retains the platform fee before club payout."
          action={
            <Link
              href="/admin/finance"
              className="rounded-xl border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
            >
              Back to Finance
            </Link>
          }
        />
      )}

      {message ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {message}
        </div>
      ) : null}

      {error ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          {error}
        </div>
      ) : null}

      <article className="rounded-2xl border border-zinc-200/80 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-100 px-6 py-5">
          <div>
            <h2 className="text-lg font-semibold text-zinc-900">Platform status</h2>
            <p className="mt-1 text-sm text-zinc-500">
              Save credentials, run Test connection, then enable platform for clubs.
            </p>
          </div>
          {config ? (
            <div className="flex flex-col items-end gap-1">
              <StatusPill
                label={
                  config.connectionStatus === "live_connected" ||
                  config.connectionStatus === "sandbox_connected"
                    ? "Connected"
                    : config.connectionStatusLabel
                }
                tone={connectionTone(config.connectionStatus)}
              />
              {config.connectionStatus === "live_connected" ||
              config.connectionStatus === "sandbox_connected" ? (
                <span className="text-xs text-zinc-500">
                  {config.connectionStatusLabel}
                </span>
              ) : null}
            </div>
          ) : null}
        </div>

        <div className="grid gap-4 p-6 sm:grid-cols-2 lg:grid-cols-4">
          <Metric label="Platform enabled" value={config?.platformEnabled ? "Yes" : "No"} />
          <Metric
            label="Club connect"
            value={resolved?.isClubConnectAvailable ? "Available" : "Unavailable"}
          />
          <Metric
            label="Billing API"
            value={resolved?.isBillingConfigured ? "Ready" : "Missing token"}
          />
          <Metric
            label="Platform fee"
            value={`${config?.platformFeePercent ?? 2.5}%`}
          />
          <Metric label="Last checked" value={lastCheckedLabel} />
        </div>
      </article>

      <article className="rounded-2xl border border-zinc-200/80 bg-white shadow-sm">
        <div className="border-b border-zinc-100 px-6 py-5">
          <h2 className="text-lg font-semibold text-zinc-900">Configuration</h2>
          <p className="mt-1 text-sm text-zinc-500">
            Env vars override stored values when set. Secrets are write-only in the UI.
          </p>
        </div>

        {loading ? (
          <p className="px-6 py-8 text-sm text-zinc-500">Loading configuration…</p>
        ) : (
          <div className="grid gap-5 p-6 lg:grid-cols-2">
            <Field label="Environment">
              <select
                value={form.environment}
                onChange={(e) =>
                  setForm((current) => ({
                    ...current,
                    environment: e.target.value as "sandbox" | "live",
                  }))
                }
                className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm"
              >
                <option value="sandbox">Sandbox</option>
                <option value="live">Live</option>
              </select>
            </Field>

            <Field label="Default platform fee %">
              <input
                type="number"
                min={0}
                max={10}
                step={0.1}
                value={form.platformFeePercent}
                onChange={(e) =>
                  setForm((current) => ({
                    ...current,
                    platformFeePercent: e.target.value,
                  }))
                }
                className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm"
              />
            </Field>

            <Field label="GoCardless access token">
              <input
                type="password"
                placeholder={config?.hasAccessToken ? "•••••••• (unchanged)" : "Required for billing API"}
                value={form.accessToken}
                onChange={(e) =>
                  setForm((current) => ({ ...current, accessToken: e.target.value }))
                }
                className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm"
              />
            </Field>

            <Field label="GoCardless webhook secret">
              <input
                type="password"
                placeholder={config?.hasWebhookSecret ? "•••••••• (unchanged)" : "From GoCardless dashboard"}
                value={form.webhookSecret}
                onChange={(e) =>
                  setForm((current) => ({ ...current, webhookSecret: e.target.value }))
                }
                className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm"
              />
            </Field>

            <Field label="OAuth client ID">
              <input
                type="text"
                value={form.clientId}
                onChange={(e) =>
                  setForm((current) => ({ ...current, clientId: e.target.value }))
                }
                className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm"
              />
            </Field>

            <Field label="OAuth client secret">
              <input
                type="password"
                placeholder={config?.hasClientSecret ? "•••••••• (unchanged)" : "Partner app secret"}
                value={form.clientSecret}
                onChange={(e) =>
                  setForm((current) => ({ ...current, clientSecret: e.target.value }))
                }
                className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm"
              />
            </Field>

            <Field label="Redirect URI">
              <input
                type="url"
                value={form.redirectUri}
                onChange={(e) =>
                  setForm((current) => ({ ...current, redirectUri: e.target.value }))
                }
                placeholder="https://activora.uk/api/gocardless/connect/callback"
                className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm"
              />
            </Field>

            <Field label="Callback URI">
              <input
                type="url"
                value={form.callbackUri}
                onChange={(e) =>
                  setForm((current) => ({ ...current, callbackUri: e.target.value }))
                }
                className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm"
              />
            </Field>

            <Field label="Webhook endpoint (read-only)">
              <input
                type="url"
                readOnly
                value={resolved?.webhookUri ?? ""}
                className="w-full rounded-xl border border-zinc-100 bg-zinc-50 px-3 py-2 text-sm text-zinc-600"
              />
              <p className="text-xs text-zinc-500">
                Register this URL in the GoCardless dashboard with your webhook secret.
              </p>
            </Field>

            <label className="flex items-center gap-3 lg:col-span-2">
              <input
                type="checkbox"
                checked={form.platformEnabled}
                onChange={(e) =>
                  setForm((current) => ({
                    ...current,
                    platformEnabled: e.target.checked,
                  }))
                }
                className="h-4 w-4 rounded border-zinc-300 text-violet-600"
              />
              <span className="text-sm font-medium text-zinc-900">
                Platform enabled — allow clubs to connect GoCardless
              </span>
            </label>
          </div>
        )}

        <div className="flex flex-wrap gap-2 border-t border-zinc-100 px-6 py-4">
          <ActionButton onClick={() => void handleSave()} disabled={saving || loading}>
            {saving ? "Saving…" : "Save securely"}
          </ActionButton>
          <ActionButton
            variant="secondary"
            onClick={() => void handleTestConnection()}
            disabled={testing || loading}
          >
            Test connection
          </ActionButton>
          <ActionButton
            variant="secondary"
            onClick={() => void load()}
            disabled={loading}
          >
            View logs
          </ActionButton>
          <ActionButton
            variant="danger"
            onClick={() => void handleDisable()}
            disabled={saving || loading}
          >
            Disable
          </ActionButton>
        </div>
      </article>

      <article className="rounded-2xl border border-zinc-200/80 bg-white shadow-sm">
        <div className="border-b border-zinc-100 px-6 py-5">
          <h2 className="text-lg font-semibold text-zinc-900">Payment testing</h2>
          <p className="mt-1 text-sm text-zinc-500">
            £1 test payment, webhook simulation, and fee split confirmation.
          </p>
        </div>
        <div className="space-y-4 p-6">
          <div className="flex flex-wrap gap-2">
            <ActionButton
              variant="secondary"
              onClick={() => void handleTestPayment()}
              disabled={testing}
            >
              Run £1 test payment
            </ActionButton>
            <ActionButton
              variant="secondary"
              onClick={() => void handleSimulateWebhook()}
              disabled={testing}
            >
              Simulate webhook
            </ActionButton>
          </div>

          {testSplit ? (
            <dl className="grid gap-2 rounded-xl border border-zinc-100 bg-zinc-50 p-4 text-sm sm:grid-cols-2">
              <SplitRow label="Gross amount" value={testSplit.gross_amount} />
              <SplitRow label="Processing fee" value={testSplit.processing_fee} />
              <SplitRow label="Platform fee" value={testSplit.platform_fee} />
              <SplitRow label="Net to club" value={testSplit.net_amount} />
            </dl>
          ) : null}

          <p className="text-xs text-zinc-500">
            Example £50 flow: GoCardless processing fee deducted first, then Activora
            retains {config?.platformFeePercent ?? 2.5}%, remainder paid to the club.
          </p>
        </div>
      </article>

      <article className="overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-sm">
        <div className="border-b border-zinc-100 px-6 py-5">
          <h2 className="text-lg font-semibold text-zinc-900">Platform logs</h2>
        </div>
        {logs.length === 0 ? (
          <p className="px-6 py-8 text-sm text-zinc-500">No GoCardless platform logs yet.</p>
        ) : (
          <ul className="divide-y divide-zinc-100">
            {logs.map((log) => (
              <li key={log.id} className="px-6 py-4 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-medium text-zinc-900">{log.event_type}</span>
                  <span className="text-xs text-zinc-400">
                    {new Date(log.created_at).toLocaleString("en-GB")}
                  </span>
                </div>
                <p className="mt-1 text-zinc-600">{log.message}</p>
              </li>
            ))}
          </ul>
        )}
      </article>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-zinc-100 bg-zinc-50/50 px-4 py-3">
      <p className="text-xs font-medium text-zinc-500">{label}</p>
      <p className="mt-1 text-sm font-semibold text-zinc-900">{value}</p>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-medium text-zinc-700">{label}</span>
      {children}
    </label>
  );
}

function ActionButton({
  children,
  onClick,
  disabled,
  variant = "primary",
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  variant?: "primary" | "secondary" | "danger";
}) {
  const styles = {
    primary: "bg-zinc-900 text-white hover:bg-zinc-800",
    secondary: "border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50",
    danger: "border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100",
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`rounded-xl px-4 py-2 text-sm font-medium disabled:opacity-50 ${styles[variant]}`}
    >
      {children}
    </button>
  );
}

function SplitRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-zinc-500">{label}</dt>
      <dd className="font-medium text-zinc-900">£{value.toFixed(2)}</dd>
    </div>
  );
}
