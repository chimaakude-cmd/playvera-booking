"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, type Dispatch, type SetStateAction } from "react";
import { PageHeader } from "@/components/club/PageHeader";
import type {
  StripePlatformConfigPublic,
  StripePlatformLogRow,
} from "@/lib/stripe/platform-admin/types";
import {
  STRIPE_CONNECT_STATUS_LABELS,
  type StripeConnectStatus,
} from "@/lib/stripe-connect/types";

type ConfigResponse = {
  config: StripePlatformConfigPublic;
  resolved: {
    isClubConnectAvailable: boolean;
    isPlatformConfigured: boolean;
    isConnectionVerified: boolean;
    isWebhookConfigured: boolean;
    clubConnectBlockers: string[];
    webhookUri: string;
    environment: "test" | "live";
    environmentLabel: string;
    resolvedKeyMode: "test" | "live" | null;
    resolvedKeyModeLabel: string;
    environmentKeyMismatch: boolean;
  };
  message?: string;
};

type FormState = {
  environment: "test" | "live";
  secretKey: string;
  publishableKey: string;
  webhookSecret: string;
  platformEnabled: boolean;
  platformFeePercent: string;
};

function applyConfigResponse(
  configData: ConfigResponse,
  setConfig: (config: StripePlatformConfigPublic) => void,
  setResolved: (resolved: ConfigResponse["resolved"]) => void,
  setForm: Dispatch<SetStateAction<FormState>>,
) {
  setConfig(configData.config);
  setResolved(configData.resolved);
  setForm({
    environment: configData.config.environment,
    secretKey: "",
    publishableKey: "",
    webhookSecret: "",
    platformEnabled: configData.config.platformEnabled,
    platformFeePercent: String(configData.config.platformFeePercent),
  });
}

function EnvLockedBadge() {
  return (
    <span className="inline-flex rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-zinc-600 ring-1 ring-inset ring-zinc-200">
      Using environment variable
    </span>
  );
}

type ConnectedProviderRow = {
  providerId: string;
  clubName: string;
  stripeStatus: string;
  stripeStatusLabel: string;
};

async function parseApiError(
  response: Response,
  fallback: string,
): Promise<string> {
  try {
    const payload = (await response.json()) as { error?: string; message?: string };
    return payload.error ?? payload.message ?? fallback;
  } catch {
    return fallback;
  }
}

function StatusPill({
  label,
  tone,
}: {
  label: string;
  tone: "ok" | "warn" | "error" | "neutral" | "sandbox" | "live";
}) {
  const styles = {
    ok: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    warn: "bg-amber-50 text-amber-800 ring-amber-200",
    error: "bg-rose-50 text-rose-700 ring-rose-200",
    neutral: "bg-zinc-100 text-zinc-600 ring-zinc-200",
    sandbox: "bg-sky-50 text-sky-800 ring-sky-200",
    live: "bg-violet-50 text-violet-800 ring-violet-200",
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
  status: StripePlatformConfigPublic["connectionStatus"],
): "ok" | "warn" | "error" | "neutral" {
  if (status === "live_connected" || status === "test_connected") {
    return "ok";
  }
  if (status === "error") {
    return "error";
  }
  return "warn";
}

function resolvedModeBadgeTone(
  mode: "test" | "live" | null,
): "sandbox" | "live" | "neutral" {
  if (mode === "live") {
    return "live";
  }
  if (mode === "test") {
    return "sandbox";
  }
  return "neutral";
}

function webhookHealthTone(params: {
  configured: boolean;
  lastReceivedAt: string | null;
}): "ok" | "warn" | "error" | "neutral" {
  if (!params.configured) {
    return "error";
  }
  if (!params.lastReceivedAt) {
    return "warn";
  }

  const ageMs = Date.now() - new Date(params.lastReceivedAt).getTime();
  const dayMs = 24 * 60 * 60 * 1000;
  return ageMs <= dayMs ? "ok" : "warn";
}

function webhookHealthLabel(params: {
  configured: boolean;
  lastReceivedAt: string | null;
}): string {
  if (!params.configured) {
    return "Webhook secret missing";
  }
  if (!params.lastReceivedAt) {
    return "No webhooks received yet";
  }

  const ageMs = Date.now() - new Date(params.lastReceivedAt).getTime();
  const dayMs = 24 * 60 * 60 * 1000;
  return ageMs <= dayMs ? "Healthy" : "Stale — check Stripe dashboard";
}

type Props = {
  /** When true, renders inline on /admin/finance without page chrome. */
  embedded?: boolean;
};

export function AdminStripeSetupSection({ embedded = false }: Props) {
  const [config, setConfig] = useState<StripePlatformConfigPublic | null>(null);
  const [resolved, setResolved] = useState<ConfigResponse["resolved"] | null>(
    null,
  );
  const [form, setForm] = useState<FormState>({
    environment: "test",
    secretKey: "",
    publishableKey: "",
    webhookSecret: "",
    platformEnabled: false,
    platformFeePercent: "2.5",
  });
  const [logs, setLogs] = useState<StripePlatformLogRow[]>([]);
  const [connectedProviders, setConnectedProviders] = useState<
    ConnectedProviderRow[]
  >([]);
  const [connectedCount, setConnectedCount] = useState(0);
  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [testSplit, setTestSplit] = useState<Record<string, number> | null>(
    null,
  );

  const loadLogs = useCallback(async () => {
    try {
      const logsRes = await fetch("/api/admin/stripe-platform-config/logs?limit=20");
      if (logsRes.ok) {
        const logsData = (await logsRes.json()) as {
          logs: StripePlatformLogRow[];
        };
        setLogs(logsData.logs);
      }
    } catch {
      // Logs are non-blocking.
    }
  }, []);

  const loadConnectedProviders = useCallback(async () => {
    try {
      const response = await fetch(
        "/api/admin/stripe-platform-config/connected-providers",
      );
      if (response.ok) {
        const data = (await response.json()) as {
          providers: ConnectedProviderRow[];
          count: number;
        };
        setConnectedProviders(data.providers.slice(0, 5));
        setConnectedCount(data.count);
      }
    } catch {
      // Connected providers are non-blocking.
    }
  }, []);

  const loadConfig = useCallback(
    async (options?: { refresh?: boolean }) => {
      const isRefresh = options?.refresh ?? false;
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setInitialLoading(true);
      }
      setError(null);

      try {
        const configRes = await fetch("/api/admin/stripe-platform-config");

        if (!configRes.ok) {
          throw new Error(
            await parseApiError(
              configRes,
              "Unable to load Stripe platform configuration.",
            ),
          );
        }

        const configData = (await configRes.json()) as ConfigResponse;
        applyConfigResponse(configData, setConfig, setResolved, setForm);
        void loadLogs();
        void loadConnectedProviders();
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Failed to load configuration.",
        );
      } finally {
        if (isRefresh) {
          setRefreshing(false);
        } else {
          setInitialLoading(false);
        }
      }
    },
    [loadConnectedProviders, loadLogs],
  );

  useEffect(() => {
    void loadConfig();
  }, [loadConfig]);

  async function handleSave() {
    setSaving(true);
    setError(null);
    setMessage(null);

    try {
      const body: Record<string, unknown> = {
        environment: form.environment,
        platformEnabled: form.platformEnabled,
        platformFeePercent: Number(form.platformFeePercent),
      };

      if (form.secretKey.trim()) {
        body.secretKey = form.secretKey.trim();
      }
      if (form.publishableKey.trim()) {
        body.publishableKey = form.publishableKey.trim();
      }
      if (form.webhookSecret.trim()) {
        body.webhookSecret = form.webhookSecret.trim();
      }

      const response = await fetch("/api/admin/stripe-platform-config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        throw new Error(
          await parseApiError(response, "Save failed."),
        );
      }

      const saved = (await response.json()) as ConfigResponse;
      applyConfigResponse(saved, setConfig, setResolved, setForm);
      setMessage(saved.message ?? "Configuration saved");
      void loadLogs();
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
      const response = await fetch("/api/admin/stripe-platform-config/test", {
        method: "POST",
      });
      const payload = (await response.json()) as {
        ok?: boolean;
        message?: string;
        error?: string;
      };

      if (!response.ok || !payload.ok) {
        const reason =
          payload.error ??
          payload.message ??
          "Connection test failed.";
        throw new Error(
          reason.startsWith("Connection failed:")
            ? reason
            : `Connection failed: ${reason}`,
        );
      }

      setMessage(payload.message ?? "Connection successful");
      await loadConfig({ refresh: true });
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

  async function handleTestPayment() {
    setTesting(true);
    setError(null);
    setMessage(null);
    setTestSplit(null);

    try {
      const response = await fetch(
        "/api/admin/stripe-platform-config/test-payment",
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
      await loadConfig({ refresh: true });
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
        "/api/admin/stripe-platform-config/simulate-webhook",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ event: "checkout.session.completed" }),
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
      await loadConfig({ refresh: true });
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

  const lastWebhookLabel = config?.lastWebhookReceivedAt
    ? new Date(config.lastWebhookReceivedAt).toLocaleString("en-GB")
    : "Never";

  const canTestConnection = Boolean(
    config?.hasSecretKey ||
      form.secretKey.trim() ||
      resolved?.isPlatformConfigured,
  );

  const environmentLocked = config?.envOverrides.environment ?? false;
  const secretKeyLocked = config?.envOverrides.secretKey ?? false;
  const publishableKeyLocked = config?.envOverrides.publishableKey ?? false;
  const webhookSecretLocked = config?.envOverrides.webhookSecret ?? false;

  const webhookHealth = webhookHealthLabel({
    configured: resolved?.isWebhookConfigured ?? false,
    lastReceivedAt: config?.lastWebhookReceivedAt ?? null,
  });

  return (
    <div className="space-y-6" id={embedded ? "stripe-platform-setup" : undefined}>
      {embedded ? (
        <div className="rounded-2xl border border-zinc-200/80 bg-white px-6 py-5 shadow-sm">
          <h2 className="text-lg font-semibold text-zinc-900">Stripe Platform Setup</h2>
          <p className="mt-1 text-sm text-zinc-500">
            Configure card payments at the platform level before clubs can connect. Activora retains the platform fee before club payout.
          </p>
        </div>
      ) : (
        <PageHeader
          title="Stripe platform setup"
          description="Configure card payments at the platform level before clubs can connect. Activora retains the platform fee before club payout."
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

      {config?.environmentKeyMismatch ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <p className="font-medium">Environment and API key mode mismatch</p>
          <p className="mt-1">
            Environment is set to{" "}
            <span className="font-semibold">{config.environmentLabel}</span> but
            the active secret key resolves to{" "}
            <span className="font-semibold">
              {config.resolvedKeyMode === "live" ? "Live" : "Test mode"}
            </span>
            . Stripe API calls use the key mode — update Environment or replace
            your API keys so they match.
          </p>
        </div>
      ) : null}

      <article className="rounded-2xl border border-zinc-200/80 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-100 px-6 py-5">
          <div>
            <h2 className="text-lg font-semibold text-zinc-900">Platform status</h2>
            <p className="mt-1 text-sm text-zinc-500">
              Verify API keys, run Test connection, then allow clubs to connect.
            </p>
          </div>
          {config ? (
            <div className="flex flex-col items-end gap-2">
              <div className="flex flex-wrap items-center justify-end gap-2">
                <StatusPill
                  label={config.resolvedKeyModeLabel}
                  tone={resolvedModeBadgeTone(config.resolvedKeyMode)}
                />
                <StatusPill
                  label={config.connectionStatusLabel}
                  tone={connectionTone(config.connectionStatus)}
                />
              </div>
              {config.connectionStatus === "live_connected" ||
              config.connectionStatus === "test_connected" ? (
                <span className="text-xs text-zinc-500">
                  Configured environment: {config.environmentLabel}
                </span>
              ) : null}
            </div>
          ) : null}
        </div>

        <div className="grid gap-4 p-6 sm:grid-cols-2 lg:grid-cols-4">
          <Metric
            label="Platform enabled"
            value={config?.platformEnabled ? "Yes" : "No"}
          />
          <Metric
            label="Platform configured"
            value={resolved?.isPlatformConfigured ? "Yes" : "No"}
          />
          <Metric
            label="Club connect"
            value={resolved?.isClubConnectAvailable ? "Available" : "Unavailable"}
          />
          <Metric
            label="Secret key"
            value={config?.hasSecretKey ? "Ready" : "Missing"}
          />
          <Metric
            label="Publishable key"
            value={config?.hasPublishableKey ? "Ready" : "Missing"}
          />
          <Metric
            label="Connection verified"
            value={resolved?.isConnectionVerified ? "Yes" : "No"}
          />
          <Metric
            label="Webhook secret"
            value={resolved?.isWebhookConfigured ? "Ready" : "Missing"}
          />
          <Metric
            label="Platform fee"
            value={`${config?.platformFeePercent ?? 2.5}%`}
          />
          <Metric label="Last checked" value={lastCheckedLabel} />
        </div>

        {resolved && !resolved.isClubConnectAvailable ? (
          <div className="border-t border-zinc-100 px-6 py-4">
            <p className="text-sm font-medium text-amber-900">
              Club connect is unavailable until all checks pass:
            </p>
            <ul className="mt-2 list-inside list-disc text-sm text-amber-800">
              {resolved.clubConnectBlockers.map((blocker) => (
                <li key={blocker}>{blocker}</li>
              ))}
            </ul>
          </div>
        ) : null}
      </article>

      <article className="rounded-2xl border border-zinc-200/80 bg-white shadow-sm">
        <div className="border-b border-zinc-100 px-6 py-5">
          <h2 className="text-lg font-semibold text-zinc-900">Configuration</h2>
          <p className="mt-1 text-sm text-zinc-500">
            Env vars override stored values when set. Secrets are write-only in the UI.
          </p>
        </div>

        {initialLoading ? (
          <p className="px-6 py-8 text-sm text-zinc-500">Loading configuration…</p>
        ) : (
          <div className="grid gap-5 p-6 lg:grid-cols-2">
            <Field label="Environment">
              <div className="space-y-2">
                <select
                  value={form.environment}
                  disabled={environmentLocked}
                  onChange={(e) =>
                    setForm((current) => ({
                      ...current,
                      environment: e.target.value as "test" | "live",
                    }))
                  }
                  className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm disabled:bg-zinc-50 disabled:text-zinc-500"
                >
                  <option value="test">Test mode</option>
                  <option value="live">Live</option>
                </select>
                {environmentLocked ? (
                  <p className="text-xs text-zinc-500">
                    <EnvLockedBadge /> STRIPE_ENVIRONMENT is set — change it in deployment env to switch mode.
                  </p>
                ) : null}
                {config?.keysModeMatch === false ? (
                  <StatusPill label="Key mode mismatch" tone="error" />
                ) : null}
                {config?.environmentKeyMismatch ? (
                  <StatusPill label="Environment / key mismatch" tone="warn" />
                ) : null}
              </div>
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

            <Field label="STRIPE_SECRET_KEY">
              <div className="space-y-2">
                <input
                  type="password"
                  disabled={secretKeyLocked}
                  placeholder={
                    config?.hasSecretKey
                      ? `${config.secretKeyMasked ?? "••••••••"} (unchanged)`
                      : "sk_test_... or sk_live_..."
                  }
                  value={form.secretKey}
                  onChange={(e) =>
                    setForm((current) => ({ ...current, secretKey: e.target.value }))
                  }
                  className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm disabled:bg-zinc-50 disabled:text-zinc-500"
                />
                {secretKeyLocked ? (
                  <p className="text-xs text-zinc-500">
                    <EnvLockedBadge /> STRIPE_SECRET_KEY is set in env — stored value kept as fallback.
                  </p>
                ) : null}
              </div>
            </Field>

            <Field label="NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY">
              <div className="space-y-2">
                <input
                  type="password"
                  disabled={publishableKeyLocked}
                  placeholder={
                    config?.hasPublishableKey
                      ? `${config.publishableKeyMasked ?? "••••••••"} (unchanged)`
                      : "pk_test_... or pk_live_..."
                  }
                  value={form.publishableKey}
                  onChange={(e) =>
                    setForm((current) => ({
                      ...current,
                      publishableKey: e.target.value,
                    }))
                  }
                  className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm disabled:bg-zinc-50 disabled:text-zinc-500"
                />
                {publishableKeyLocked ? (
                  <p className="text-xs text-zinc-500">
                    <EnvLockedBadge /> Publishable key env var is set — stored value kept as fallback.
                  </p>
                ) : null}
              </div>
            </Field>

            <Field label="STRIPE_WEBHOOK_SECRET">
              <div className="space-y-2">
                <input
                  type="password"
                  disabled={webhookSecretLocked}
                  placeholder={
                    config?.hasWebhookSecret
                      ? `${config.webhookSecretMasked ?? "••••••••"} (unchanged)`
                      : "whsec_..."
                  }
                  value={form.webhookSecret}
                  onChange={(e) =>
                    setForm((current) => ({
                      ...current,
                      webhookSecret: e.target.value,
                    }))
                  }
                  className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm disabled:bg-zinc-50 disabled:text-zinc-500"
                />
                {webhookSecretLocked ? (
                  <p className="text-xs text-zinc-500">
                    <EnvLockedBadge /> STRIPE_WEBHOOK_SECRET is set in env — stored value kept as fallback.
                  </p>
                ) : null}
              </div>
            </Field>

            <Field label="Connect account type">
              <input
                type="text"
                readOnly
                value="Express (United Kingdom)"
                className="w-full rounded-xl border border-zinc-100 bg-zinc-50 px-3 py-2 text-sm text-zinc-600"
              />
            </Field>

            <Field label="Webhook endpoint (read-only)">
              <input
                type="url"
                readOnly
                value={resolved?.webhookUri ?? ""}
                className="w-full rounded-xl border border-zinc-100 bg-zinc-50 px-3 py-2 text-sm text-zinc-600 lg:col-span-2"
              />
              <p className="text-xs text-zinc-500">
                Register this URL in the Stripe Dashboard with your webhook signing secret.
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
                Platform enabled — allow clubs to connect Stripe
              </span>
            </label>
          </div>
        )}

        <div className="flex flex-wrap gap-2 border-t border-zinc-100 px-6 py-4">
          {refreshing ? (
            <p className="self-center text-xs text-zinc-500">Refreshing status…</p>
          ) : null}
          <ActionButton
            onClick={() => void handleSave()}
            disabled={saving || initialLoading}
          >
            {saving ? "Saving…" : "Save configuration"}
          </ActionButton>
          <ActionButton
            variant="secondary"
            onClick={() => void loadConfig({ refresh: true })}
            disabled={initialLoading || refreshing}
          >
            Refresh
          </ActionButton>
          <ActionButton
            variant="secondary"
            onClick={() => void handleTestConnection()}
            disabled={testing || initialLoading || !canTestConnection}
          >
            {testing ? "Testing…" : "Test connection"}
          </ActionButton>
          <ActionButton
            variant="secondary"
            onClick={() => void loadLogs()}
            disabled={initialLoading}
          >
            View logs
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
              disabled={testing || !canTestConnection}
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
            Example £50 flow: Stripe processing fee deducted first, then Activora
            retains {config?.platformFeePercent ?? 2.5}%, remainder paid to the club.
          </p>
        </div>
      </article>

      <article className="overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-sm">
        <div className="border-b border-zinc-100 px-6 py-5">
          <h2 className="text-lg font-semibold text-zinc-900">Platform logs</h2>
        </div>
        {logs.length === 0 ? (
          <p className="px-6 py-8 text-sm text-zinc-500">No Stripe platform logs yet.</p>
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

      <article className="rounded-2xl border border-zinc-200/80 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-100 px-6 py-5">
          <div>
            <h2 className="text-lg font-semibold text-zinc-900">Connected clubs</h2>
            <p className="mt-1 text-sm text-zinc-500">
              Clubs with active Stripe Connect accounts on this platform.
            </p>
          </div>
          <Link
            href="/admin/finance#payment-providers-stripe"
            className="rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
          >
            View connected providers
          </Link>
        </div>
        <div className="grid gap-4 p-6 sm:grid-cols-2 lg:grid-cols-4">
          <Metric label="Connected clubs" value={String(connectedCount)} />
          <Metric
            label="Club connect"
            value={resolved?.isClubConnectAvailable ? "Available" : "Unavailable"}
          />
        </div>
        {connectedProviders.length === 0 ? (
          <p className="border-t border-zinc-100 px-6 py-6 text-sm text-zinc-500">
            No Stripe-connected clubs yet.
          </p>
        ) : (
          <ul className="divide-y divide-zinc-100 border-t border-zinc-100">
            {connectedProviders.map((provider) => (
              <li
                key={provider.providerId}
                className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 text-sm"
              >
                <div>
                  <p className="font-medium text-zinc-900">{provider.clubName}</p>
                  <p className="font-mono text-xs text-zinc-400">{provider.providerId}</p>
                </div>
                <StatusPill
                  label={
                    provider.stripeStatusLabel ??
                    STRIPE_CONNECT_STATUS_LABELS[
                      provider.stripeStatus as StripeConnectStatus
                    ]
                  }
                  tone={
                    provider.stripeStatus === "connected" ||
                    provider.stripeStatus === "payouts_enabled"
                      ? "ok"
                      : "warn"
                  }
                />
              </li>
            ))}
          </ul>
        )}
      </article>

      <article className="rounded-2xl border border-zinc-200/80 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-100 px-6 py-5">
          <div>
            <h2 className="text-lg font-semibold text-zinc-900">Webhook health</h2>
            <p className="mt-1 text-sm text-zinc-500">
              Stripe webhook delivery and signing secret status.
            </p>
          </div>
          <StatusPill
            label={webhookHealth}
            tone={webhookHealthTone({
              configured: resolved?.isWebhookConfigured ?? false,
              lastReceivedAt: config?.lastWebhookReceivedAt ?? null,
            })}
          />
        </div>
        <div className="grid gap-4 p-6 sm:grid-cols-2 lg:grid-cols-4">
          <Metric
            label="Webhook secret"
            value={resolved?.isWebhookConfigured ? "Configured" : "Missing"}
          />
          <Metric label="Last webhook received" value={lastWebhookLabel} />
          <Metric
            label="Endpoint"
            value={resolved?.webhookUri ? "Registered URL" : "Unknown"}
          />
          <Metric
            label="Stripe mode (from key)"
            value={
              config?.resolvedKeyMode === "live"
                ? "Live"
                : config?.resolvedKeyMode === "test"
                  ? "Test"
                  : "Unknown"
            }
          />
          <Metric
            label="Configured environment"
            value={config?.environmentLabel ?? "Unknown"}
          />
        </div>
        <div className="border-t border-zinc-100 px-6 py-4">
          <p className="text-xs text-zinc-500">
            Webhook endpoint: {resolved?.webhookUri ?? "—"}. Simulate a webhook from Payment testing or send a test event from the Stripe Dashboard.
          </p>
        </div>
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
