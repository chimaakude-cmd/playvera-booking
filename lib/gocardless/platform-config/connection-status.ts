import type {
  GoCardlessPlatformConnectionStatus,
  GoCardlessPlatformEnvironment,
} from "./types";

/** Platform connection test passed for the active environment. */
export function isPlatformConnectionVerified(
  connectionStatus: GoCardlessPlatformConnectionStatus,
  environment: GoCardlessPlatformEnvironment,
): boolean {
  if (environment === "live") {
    return connectionStatus === "live_connected";
  }
  return connectionStatus === "sandbox_connected";
}
