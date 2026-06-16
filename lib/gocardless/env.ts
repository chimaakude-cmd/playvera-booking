export type GoCardlessEnvConfig = {
  accessToken: string | null;
  environment: "sandbox" | "live";
  webhookSecret: string | null;
  isConfigured: boolean;
};

export function getGoCardlessEnv(): GoCardlessEnvConfig {
  const accessToken = process.env.GOCARDLESS_ACCESS_TOKEN?.trim() || null;
  const envRaw = (
    process.env.GOCARDLESS_ENVIRONMENT ??
    process.env.GOCARDLESS_ENV
  )
    ?.trim()
    .toLowerCase();
  const environment: "sandbox" | "live" =
    envRaw === "live" ? "live" : "sandbox";
  const webhookSecret = process.env.GOCARDLESS_WEBHOOK_SECRET?.trim() || null;

  return {
    accessToken,
    environment,
    webhookSecret,
    isConfigured: Boolean(accessToken),
  };
}
