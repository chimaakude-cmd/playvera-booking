import { NextResponse } from "next/server";
import {
  exchangeGoCardlessAuthCode,
  fetchGoCardlessMerchantId,
  verifyOAuthState,
} from "@/lib/gocardless/oauth";
import { buildGoCardlessFinanceRedirectUrl } from "@/lib/gocardless/connect-start";
import { persistProviderGoCardlessConnect } from "@/lib/gocardless/provider-persistence";
import {
  appendGoCardlessPlatformLog,
  getResolvedGoCardlessEnv,
  resolveGoCardlessPlatformConfig,
} from "@/lib/gocardless/platform-config";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code")?.trim();
  const stateParam = searchParams.get("state")?.trim();
  const oauthError = searchParams.get("error")?.trim();

  if (oauthError) {
    return NextResponse.redirect(
      buildGoCardlessFinanceRedirectUrl(request, {
        gocardless: "error",
        reason: oauthError,
      }),
    );
  }

  if (!code || !stateParam) {
    return NextResponse.redirect(
      buildGoCardlessFinanceRedirectUrl(request, {
        gocardless: "error",
        reason: "missing_code",
      }),
    );
  }

  const config = await getResolvedGoCardlessEnv(request);
  const state = verifyOAuthState(stateParam, config);
  if (!state) {
    return NextResponse.redirect(
      buildGoCardlessFinanceRedirectUrl(request, {
        gocardless: "error",
        reason: "invalid_state",
      }),
    );
  }

  const resolved = await resolveGoCardlessPlatformConfig(request);
  if (!resolved.isClubConnectAvailable) {
    return NextResponse.redirect(
      buildGoCardlessFinanceRedirectUrl(request, {
        gocardless: "error",
        reason: "not_configured",
      }),
    );
  }

  try {
    const token = await exchangeGoCardlessAuthCode({ code, config });
    const merchantId =
      (await fetchGoCardlessMerchantId(token.access_token, config.environment)) ||
      token.organisation_id;

    if (!merchantId?.trim()) {
      throw new Error("GoCardless did not return a merchant account ID.");
    }

    await persistProviderGoCardlessConnect({
      providerId: state.providerId,
      organisationId: token.organisation_id,
      merchantId,
      status: "connected",
    });

    await appendGoCardlessPlatformLog({
      eventType: "club_oauth_connected",
      message: `Club ${state.providerId} connected GoCardless merchant ${merchantId}.`,
      metadata: {
        providerId: state.providerId,
        merchantId,
        organisationId: token.organisation_id,
      },
    });

    return NextResponse.redirect(
      buildGoCardlessFinanceRedirectUrl(request, {
        connected: "gocardless",
        gocardless: "connected",
      }),
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[gocardless] OAuth callback failed", {
      providerId: state.providerId,
      message,
    });

    await appendGoCardlessPlatformLog({
      level: "error",
      eventType: "club_oauth_failed",
      message: `Club OAuth failed for ${state.providerId}: ${message}`,
      metadata: { providerId: state.providerId },
    });

    return NextResponse.redirect(
      buildGoCardlessFinanceRedirectUrl(request, {
        gocardless: "error",
        reason: "callback_failed",
      }),
    );
  }
}
