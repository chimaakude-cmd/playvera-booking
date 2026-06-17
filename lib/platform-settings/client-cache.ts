import {
  SEED_ADMIN_BOOKING_QUESTIONS,
  type AdminBookingQuestion,
} from "@/lib/admin-booking-questions";
import {
  DEFAULT_PLATFORM_FEE_MATRIX,
  type PlatformFeeMatrix,
} from "@/lib/fee-settings";
import type { PlatformPublicSettings } from "./types";

let cachedPublicSettings: PlatformPublicSettings | null = null;
let hydratePromise: Promise<PlatformPublicSettings> | null = null;

export function getCachedPlatformPublicSettings(): PlatformPublicSettings | null {
  return cachedPublicSettings;
}

export function getCachedPlatformFeeMatrix(): PlatformFeeMatrix {
  return cachedPublicSettings?.defaultFees ?? DEFAULT_PLATFORM_FEE_MATRIX;
}

export function getCachedBookingQuestionDefaults(): AdminBookingQuestion[] | null {
  return cachedPublicSettings?.bookingQuestionDefaults ?? null;
}

export async function hydratePlatformPublicSettings(): Promise<PlatformPublicSettings> {
  if (cachedPublicSettings) {
    return cachedPublicSettings;
  }

  if (hydratePromise) {
    return hydratePromise;
  }

  hydratePromise = (async () => {
    try {
      const response = await fetch("/api/platform-settings/public", {
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("Failed to load platform settings.");
      }

      const data = (await response.json()) as PlatformPublicSettings;
      cachedPublicSettings = data;
      return data;
    } catch {
      const fallback: PlatformPublicSettings = {
        platformName: "Activora",
        marketplaceEnabled: true,
        marketplaceFooterText: "Powered by Activora",
        aiSearchAssistantEnabled: false,
        defaultFees: DEFAULT_PLATFORM_FEE_MATRIX,
        bookingQuestionDefaults: SEED_ADMIN_BOOKING_QUESTIONS,
      };
      cachedPublicSettings = fallback;
      return fallback;
    } finally {
      hydratePromise = null;
    }
  })();

  return hydratePromise;
}

export function invalidatePlatformPublicSettingsCache(): void {
  cachedPublicSettings = null;
  hydratePromise = null;
}
