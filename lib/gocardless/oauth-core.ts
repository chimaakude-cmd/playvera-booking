import { createHmac, randomBytes, timingSafeEqual } from "crypto";
import {
  getGoCardlessConnectBaseUrl,
  type GoCardlessEnvironment,
} from "./env";
import type { GoCardlessEnvConfig } from "./env";

export type GoCardlessOAuthState = {
  providerId: string;
  nonce: string;
};

export type GoCardlessTokenResponse = {
  access_token: string;
  token_type: string;
  scope: string;
  organisation_id: string;
};

function getStateSecret(config?: GoCardlessEnvConfig): string {
  return (
    config?.clientSecret?.trim() ||
    process.env.GOCARDLESS_CLIENT_SECRET?.trim() ||
    process.env.GOCARDLESS_ACCESS_TOKEN?.trim() ||
    "gocardless-oauth-state-dev"
  );
}

export function signOAuthState(
  payload: GoCardlessOAuthState,
  config?: GoCardlessEnvConfig,
): string {
  const data = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = createHmac("sha256", getStateSecret(config))
    .update(data)
    .digest("base64url");
  return `${data}.${signature}`;
}

export function verifyOAuthState(
  stateParam: string,
  config?: GoCardlessEnvConfig,
): GoCardlessOAuthState | null {
  const [data, signature] = stateParam.split(".");
  if (!data || !signature) {
    return null;
  }

  const expected = createHmac("sha256", getStateSecret(config))
    .update(data)
    .digest("base64url");

  try {
    const sigBuffer = Buffer.from(signature);
    const expectedBuffer = Buffer.from(expected);
    if (
      sigBuffer.length !== expectedBuffer.length ||
      !timingSafeEqual(sigBuffer, expectedBuffer)
    ) {
      return null;
    }
  } catch {
    return null;
  }

  try {
    const parsed = JSON.parse(
      Buffer.from(data, "base64url").toString("utf8"),
    ) as GoCardlessOAuthState;

    if (!parsed.providerId?.trim() || !parsed.nonce?.trim()) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

export function createOAuthState(
  providerId: string,
  config?: GoCardlessEnvConfig,
): string {
  return signOAuthState(
    {
      providerId: providerId.trim(),
      nonce: randomBytes(16).toString("hex"),
    },
    config,
  );
}

export async function exchangeGoCardlessAuthCode(params: {
  code: string;
  config: GoCardlessEnvConfig;
}): Promise<GoCardlessTokenResponse> {
  const baseUrl = getGoCardlessConnectBaseUrl(params.config.environment);

  if (
    !params.config.clientId ||
    !params.config.clientSecret ||
    !params.config.redirectUri
  ) {
    throw new Error("GoCardless OAuth is not configured.");
  }

  const response = await fetch(`${baseUrl}/oauth/access_token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: params.config.clientId,
      client_secret: params.config.clientSecret,
      redirect_uri: params.config.redirectUri,
      grant_type: "authorization_code",
      code: params.code,
    }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(
      `GoCardless token exchange failed (${response.status})${detail ? `: ${detail.slice(0, 200)}` : ""}`,
    );
  }

  return (await response.json()) as GoCardlessTokenResponse;
}

export async function fetchGoCardlessMerchantId(
  accessToken: string,
  environment: GoCardlessEnvironment,
): Promise<string | null> {
  const apiBase =
    environment === "live"
      ? "https://api.gocardless.com"
      : "https://api-sandbox.gocardless.com";

  const response = await fetch(`${apiBase}/creditors`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "GoCardless-Version": "2015-07-06",
    },
  });

  if (!response.ok) {
    return null;
  }

  const payload = (await response.json()) as {
    creditors?: Array<{ id?: string }>;
  };

  return payload.creditors?.[0]?.id?.trim() || null;
}

export async function testGoCardlessAccessToken(
  accessToken: string,
  environment: GoCardlessEnvironment,
): Promise<{ ok: boolean; message: string; creditorId?: string }> {
  const creditorId = await fetchGoCardlessMerchantId(accessToken, environment);

  if (creditorId) {
    return {
      ok: true,
      message: `Connected to GoCardless (${environment}). Creditor ${creditorId}.`,
      creditorId,
    };
  }

  return {
    ok: false,
    message: `Could not verify GoCardless access token (${environment}).`,
  };
}
