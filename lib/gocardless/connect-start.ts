import { isDevelopmentEnvironment } from "@/lib/admin-users/production-gates";
import { getAppBaseUrl } from "@/lib/app-url";
import { resolveProviderIdForAuthUser } from "@/lib/club-profile/server";
import { buildGoCardlessAuthorizeUrl } from "@/lib/gocardless/oauth";
import {
  getResolvedGoCardlessEnv,
  resolveGoCardlessPlatformConfig,
} from "@/lib/gocardless/platform-config";
import { isSupabaseConfigured } from "@/lib/supabase";
import { createSupabaseCookieClient } from "@/lib/supabase-ssr";

export type GoCardlessConnectStartResult =
  | { ok: true; url: string; providerId: string }
  | { ok: false; reason: string; message: string };

const PLATFORM_UNAVAILABLE_MESSAGE =
  "GoCardless unavailable. Activora is still configuring Direct Debit.";

export function buildGoCardlessFinanceRedirectUrl(
  request: Request,
  params: Record<string, string>,
): string {
  const baseUrl = getAppBaseUrl(request);
  const url = new URL(`${baseUrl}/club/finance`);
  url.searchParams.set("tab", "payment-providers");

  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }

  return url.toString();
}

export async function resolveGoCardlessConnectProviderId(
  request: Request,
  queryProviderId?: string | null,
): Promise<string | null> {
  const fromQuery = queryProviderId?.trim();
  if (fromQuery) {
    return fromQuery;
  }

  if (!isSupabaseConfigured()) {
    return null;
  }

  try {
    const supabase = await createSupabaseCookieClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return null;
    }

    return resolveProviderIdForAuthUser(supabase, user.id);
  } catch {
    return null;
  }
}

export async function startGoCardlessConnect(
  request: Request,
  queryProviderId?: string | null,
): Promise<GoCardlessConnectStartResult> {
  let providerId = await resolveGoCardlessConnectProviderId(
    request,
    queryProviderId,
  );

  if (!providerId) {
    providerId = isDevelopmentEnvironment() ? "demo-provider-1" : null;
  }

  if (!providerId) {
    return {
      ok: false,
      reason: "missing_provider",
      message: "Could not resolve club provider. Sign in and try again.",
    };
  }

  const resolved = await resolveGoCardlessPlatformConfig(request);

  if (!resolved.isClubConnectAvailable) {
    return {
      ok: false,
      reason: "not_configured",
      message: PLATFORM_UNAVAILABLE_MESSAGE,
    };
  }

  try {
    const config = await getResolvedGoCardlessEnv(request);
    const url = buildGoCardlessAuthorizeUrl({ providerId, config });
    return { ok: true, url, providerId };
  } catch (error) {
    return {
      ok: false,
      reason: "start_failed",
      message:
        error instanceof Error
          ? error.message
          : "Could not start GoCardless connect.",
    };
  }
}

export { buildGoCardlessConnectStartPath } from "@/lib/gocardless/connect-start-path";
