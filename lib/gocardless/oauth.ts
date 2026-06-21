import type { GoCardlessEnvConfig } from "./env";
import { getGoCardlessConnectBaseUrl } from "./env";
import { createOAuthState } from "./oauth-core";

export type { GoCardlessOAuthState, GoCardlessTokenResponse } from "./oauth-core";

export {
  signOAuthState,
  verifyOAuthState,
  createOAuthState,
  exchangeGoCardlessAuthCode,
  fetchGoCardlessMerchantId,
  testGoCardlessAccessToken,
} from "./oauth-core";

export function buildGoCardlessAuthorizeUrl(params: {
  providerId: string;
  config: GoCardlessEnvConfig;
}): string {
  const baseUrl = getGoCardlessConnectBaseUrl(params.config.environment);
  const redirectUri = params.config.redirectUri;
  const clientId = params.config.clientId;

  if (!clientId || !redirectUri) {
    throw new Error("GoCardless OAuth is not configured.");
  }

  const url = new URL(`${baseUrl}/oauth/authorize`);
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "read_write");
  url.searchParams.set("state", createOAuthState(params.providerId, params.config));
  url.searchParams.set("initial_view", "login");

  return url.toString();
}
