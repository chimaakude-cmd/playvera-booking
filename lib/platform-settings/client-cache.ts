import {
  SEED_ADMIN_BOOKING_QUESTIONS,
  type AdminBookingQuestion,
} from "@/lib/admin-booking-questions/defaults";
import { getAllPlans, type PlanId } from "@/src/config/pricing";
import type { PlatformFeeMatrix } from "@/lib/fee-settings";
import type { PlatformPublicSettings } from "./types";

function buildFallbackFeeMatrix(): PlatformFeeMatrix {
  const matrix = {} as PlatformFeeMatrix;
  for (const plan of getAllPlans()) {
    matrix[plan.id as PlanId] = plan.platformFeePercent;
  }
  return matrix;
}

let cachedPublicSettings: PlatformPublicSettings | null = null;
let hydratePromise: Promise<PlatformPublicSettings> | null = null;

export function getCachedPlatformPublicSettings(): PlatformPublicSettings | null {
  return cachedPublicSettings;
}

export function getCachedPlatformFeeMatrix(): PlatformFeeMatrix {
  const fee = cachedPublicSettings?.defaultFees?.STARTER ?? 2.5;
  return {
    STARTER: fee,
    PRO: fee,
    FRANCHISE: fee,
    ENTERPRISE: fee,
  };
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
        defaultFees: {
          STARTER: 2.5,
          PRO: 2.5,
          FRANCHISE: 2.5,
          ENTERPRISE: 2.5,
        },
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
