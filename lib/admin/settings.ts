import {
  getCurrentUser,
  loginTestAccount,
  logout as authLogout,
  writeAuthSession,
} from "@/lib/auth";
import { BRAND_NAME } from "@/lib/brand";
import type { AdminSession, PlatformSettings } from "./types";

export const ADMIN_SESSION_KEY = "activora-admin-session";
export const PLATFORM_SETTINGS_KEY = "activora-platform-settings";

export const DEFAULT_PLATFORM_SETTINGS: PlatformSettings = {
  platformName: BRAND_NAME,
  supportEmail: "support@activora.co.uk",
  supportPhone: "0800 123 4567",
  platformUrl: "https://activora.co.uk",
  defaultCurrency: "GBP",
  country: "UK",
  vatThreshold: 90_000,
  marketplaceFooterText: "Powered by Activora",
  defaultPlatformFeePercent: 2,
  marketplaceEnabled: true,
  aiAssistantEnabled: false,
};

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

/** Reads admin session from unified auth storage. */
export function getAdminSession(): AdminSession | null {
  const user = getCurrentUser();
  if (!user || user.role !== "admin") {
    return null;
  }

  return {
    adminId: user.id,
    email: user.email,
    name: user.name,
    role: user.adminRole ?? "super_admin",
  };
}

export function setAdminSession(session: AdminSession): void {
  writeAuthSession({
    id: session.adminId,
    email: session.email,
    name: session.name,
    role: "admin",
    adminRole: session.role,
  });
}

export function clearAdminSession(): void {
  authLogout();
}

/** Demo login — sets super_admin session via unified auth. */
export function signInDemoAdmin(
  role: AdminSession["role"] = "super_admin",
): AdminSession {
  const user = loginTestAccount("admin");
  const session: AdminSession = {
    adminId: user.id,
    email: user.email,
    name: user.name,
    role,
  };
  setAdminSession(session);
  return session;
}

export function getPlatformSettings(): PlatformSettings {
  if (!isBrowser()) {
    return DEFAULT_PLATFORM_SETTINGS;
  }

  try {
    const raw = localStorage.getItem(PLATFORM_SETTINGS_KEY);
    if (!raw) {
      return DEFAULT_PLATFORM_SETTINGS;
    }
    return { ...DEFAULT_PLATFORM_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_PLATFORM_SETTINGS;
  }
}

export function savePlatformSettings(
  updates: Partial<PlatformSettings>,
): PlatformSettings {
  const current = getPlatformSettings();
  const next = { ...current, ...updates };

  if (isBrowser()) {
    localStorage.setItem(PLATFORM_SETTINGS_KEY, JSON.stringify(next));
  }

  return next;
}

export function resetPlatformSettings(): PlatformSettings {
  if (isBrowser()) {
    localStorage.removeItem(PLATFORM_SETTINGS_KEY);
  }
  return DEFAULT_PLATFORM_SETTINGS;
}
