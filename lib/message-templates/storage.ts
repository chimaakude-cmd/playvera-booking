import {
  DEMO_PROVIDER_ID,
  PLATFORM_DEFAULT_TEMPLATES,
} from "./defaults";
import type {
  MessageTemplateRecord,
  ProviderTemplateSettings,
  TemplateKey,
} from "./types";
import { TEMPLATE_KEY_ORDER } from "./types";

export const PLATFORM_TEMPLATES_KEY = "activora-platform-templates";
export const CLUB_TEMPLATE_OVERRIDES_KEY = "activora-club-template-overrides";
export const CLUB_TEMPLATE_SETTINGS_KEY = "activora-club-template-settings";
export const CLUB_TEMPLATES_ONBOARDING_BANNER_KEY =
  "activora-club-templates-onboarding-banner";

type ClubOverridesStore = Record<string, MessageTemplateRecord[]>;
type ClubSettingsStore = Record<string, ProviderTemplateSettings[]>;

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function nowIso(): string {
  return new Date().toISOString();
}

function readJson<T>(key: string, fallback: T): T {
  if (!isBrowser()) {
    return fallback;
  }

  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      return fallback;
    }

    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson<T>(key: string, value: T): void {
  if (!isBrowser()) {
    return;
  }

  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore quota errors in stub
  }
}

function mergePlatformWithDefaults(
  saved: MessageTemplateRecord[],
): MessageTemplateRecord[] {
  const savedByKey = new Map(
    saved.map((template) => [template.templateKey, template]),
  );

  return PLATFORM_DEFAULT_TEMPLATES.map((defaultTemplate) => {
    const existing = savedByKey.get(defaultTemplate.templateKey);
    if (!existing) {
      return defaultTemplate;
    }

    return {
      ...defaultTemplate,
      ...existing,
      id: defaultTemplate.id,
      scope: "platform",
      providerId: null,
      templateKey: defaultTemplate.templateKey,
      description: defaultTemplate.description,
      channels: existing.channels?.length
        ? existing.channels
        : defaultTemplate.channels,
      channel:
        existing.channel ??
        existing.channels?.[0] ??
        defaultTemplate.channel,
    };
  });
}

export function getPlatformTemplates(): MessageTemplateRecord[] {
  const saved = readJson<MessageTemplateRecord[]>(PLATFORM_TEMPLATES_KEY, []);

  if (saved.length === 0) {
    return PLATFORM_DEFAULT_TEMPLATES;
  }

  return mergePlatformWithDefaults(saved);
}

export function savePlatformTemplate(
  template: MessageTemplateRecord,
): MessageTemplateRecord[] {
  const templates = getPlatformTemplates().map((entry) =>
    entry.templateKey === template.templateKey
      ? {
          ...entry,
          ...template,
          scope: "platform" as const,
          providerId: null,
          updatedAt: nowIso(),
          channel: template.channels[0] ?? template.channel,
        }
      : entry,
  );

  writeJson(PLATFORM_TEMPLATES_KEY, templates);
  return templates;
}

export function getProviderId(): string {
  if (!isBrowser()) {
    return DEMO_PROVIDER_ID;
  }

  try {
    const raw = localStorage.getItem("activora-club-profile");
    if (raw) {
      const profile = JSON.parse(raw) as { providerId?: string };
      if (profile.providerId?.trim()) {
        return profile.providerId.trim();
      }
    }
  } catch {
    // fall through
  }

  return DEMO_PROVIDER_ID;
}

function createDefaultProviderSettings(
  providerId: string,
): ProviderTemplateSettings[] {
  return TEMPLATE_KEY_ORDER.map((templateKey) => ({
    providerId,
    templateKey,
    usesDefault: true,
  }));
}

export function getProviderTemplateSettings(
  providerId = getProviderId(),
): ProviderTemplateSettings[] {
  const store = readJson<ClubSettingsStore>(CLUB_TEMPLATE_SETTINGS_KEY, {});
  const saved = store[providerId];

  if (!saved || saved.length === 0) {
    return createDefaultProviderSettings(providerId);
  }

  const savedByKey = new Map(saved.map((entry) => [entry.templateKey, entry]));

  return TEMPLATE_KEY_ORDER.map((templateKey) => {
    const existing = savedByKey.get(templateKey);
    return (
      existing ?? {
        providerId,
        templateKey,
        usesDefault: true,
      }
    );
  });
}

function saveProviderTemplateSettings(
  providerId: string,
  settings: ProviderTemplateSettings[],
): void {
  const store = readJson<ClubSettingsStore>(CLUB_TEMPLATE_SETTINGS_KEY, {});
  store[providerId] = settings;
  writeJson(CLUB_TEMPLATE_SETTINGS_KEY, store);
}

export function getClubTemplateOverrides(
  providerId = getProviderId(),
): MessageTemplateRecord[] {
  const store = readJson<ClubOverridesStore>(CLUB_TEMPLATE_OVERRIDES_KEY, {});
  return store[providerId] ?? [];
}

function saveClubTemplateOverrides(
  providerId: string,
  overrides: MessageTemplateRecord[],
): void {
  const store = readJson<ClubOverridesStore>(CLUB_TEMPLATE_OVERRIDES_KEY, {});
  store[providerId] = overrides;
  writeJson(CLUB_TEMPLATE_OVERRIDES_KEY, store);
}

export function getEffectiveTemplate(
  templateKey: TemplateKey,
  providerId = getProviderId(),
): MessageTemplateRecord {
  const settings = getProviderTemplateSettings(providerId);
  const setting = settings.find((entry) => entry.templateKey === templateKey);
  const platform = getPlatformTemplates().find(
    (entry) => entry.templateKey === templateKey,
  );

  if (!platform) {
    throw new Error(`Unknown template key: ${templateKey}`);
  }

  if (setting?.usesDefault !== false) {
    return platform;
  }

  const override = getClubTemplateOverrides(providerId).find(
    (entry) => entry.templateKey === templateKey,
  );

  return override ?? platform;
}

export function getClubTemplatesView(
  providerId = getProviderId(),
): Array<{
  templateKey: TemplateKey;
  platformTemplate: MessageTemplateRecord;
  effectiveTemplate: MessageTemplateRecord;
  usesDefault: boolean;
  hasOverride: boolean;
}> {
  const platformTemplates = getPlatformTemplates();
  const settings = getProviderTemplateSettings(providerId);
  const overrides = getClubTemplateOverrides(providerId);
  const overrideKeys = new Set(overrides.map((entry) => entry.templateKey));

  return TEMPLATE_KEY_ORDER.map((templateKey) => {
    const platformTemplate =
      platformTemplates.find((entry) => entry.templateKey === templateKey) ??
      PLATFORM_DEFAULT_TEMPLATES.find((entry) => entry.templateKey === templateKey)!;
    const setting = settings.find((entry) => entry.templateKey === templateKey);
    const usesDefault = setting?.usesDefault !== false;

    return {
      templateKey,
      platformTemplate,
      effectiveTemplate: getEffectiveTemplate(templateKey, providerId),
      usesDefault,
      hasOverride: overrideKeys.has(templateKey),
    };
  });
}

export function cloneTemplateForProvider(
  templateKey: TemplateKey,
  providerId = getProviderId(),
): MessageTemplateRecord {
  const platform = getPlatformTemplates().find(
    (entry) => entry.templateKey === templateKey,
  );

  if (!platform) {
    throw new Error(`Unknown template key: ${templateKey}`);
  }

  const clone: MessageTemplateRecord = {
    ...platform,
    id: `provider-template-${providerId}-${templateKey.toLowerCase()}`,
    scope: "provider",
    providerId,
    updatedAt: nowIso(),
    createdAt: nowIso(),
  };

  const overrides = getClubTemplateOverrides(providerId);
  const nextOverrides = [
    ...overrides.filter((entry) => entry.templateKey !== templateKey),
    clone,
  ];

  saveClubTemplateOverrides(providerId, nextOverrides);

  const settings = getProviderTemplateSettings(providerId).map((entry) =>
    entry.templateKey === templateKey ? { ...entry, usesDefault: false } : entry,
  );
  saveProviderTemplateSettings(providerId, settings);

  return clone;
}

export function saveClubTemplateOverride(
  template: MessageTemplateRecord,
  providerId = getProviderId(),
): void {
  const overrides = getClubTemplateOverrides(providerId);
  const nextOverrides = [
    ...overrides.filter(
      (entry) => entry.templateKey !== template.templateKey,
    ),
    {
      ...template,
      scope: "provider" as const,
      providerId,
      updatedAt: nowIso(),
    },
  ];

  saveClubTemplateOverrides(providerId, nextOverrides);

  const settings = getProviderTemplateSettings(providerId).map((entry) =>
    entry.templateKey === template.templateKey
      ? { ...entry, usesDefault: false }
      : entry,
  );
  saveProviderTemplateSettings(providerId, settings);
}

export function restoreClubTemplateDefault(
  templateKey: TemplateKey,
  providerId = getProviderId(),
): void {
  const overrides = getClubTemplateOverrides(providerId).filter(
    (entry) => entry.templateKey !== templateKey,
  );
  saveClubTemplateOverrides(providerId, overrides);

  const settings = getProviderTemplateSettings(providerId).map((entry) =>
    entry.templateKey === templateKey ? { ...entry, usesDefault: true } : entry,
  );
  saveProviderTemplateSettings(providerId, settings);
}

export function initializeProviderTemplates(
  providerId = getProviderId(),
  options?: { showOnboardingBanner?: boolean },
): void {
  const store = readJson<ClubSettingsStore>(CLUB_TEMPLATE_SETTINGS_KEY, {});

  if (!store[providerId]) {
    store[providerId] = createDefaultProviderSettings(providerId);
    writeJson(CLUB_TEMPLATE_SETTINGS_KEY, store);
  }

  const overridesStore = readJson<ClubOverridesStore>(
    CLUB_TEMPLATE_OVERRIDES_KEY,
    {},
  );

  if (!overridesStore[providerId]) {
    overridesStore[providerId] = [];
    writeJson(CLUB_TEMPLATE_OVERRIDES_KEY, overridesStore);
  }

  if (options?.showOnboardingBanner && isBrowser()) {
    try {
      localStorage.setItem(CLUB_TEMPLATES_ONBOARDING_BANNER_KEY, "true");
    } catch {
      // ignore
    }
  }
}

export function shouldShowTemplatesOnboardingBanner(): boolean {
  if (!isBrowser()) {
    return false;
  }

  return localStorage.getItem(CLUB_TEMPLATES_ONBOARDING_BANNER_KEY) === "true";
}

export function dismissTemplatesOnboardingBanner(): void {
  if (isBrowser()) {
    localStorage.removeItem(CLUB_TEMPLATES_ONBOARDING_BANNER_KEY);
  }
}

export function seedPlatformTemplatesIfEmpty(): void {
  if (!isBrowser()) {
    return;
  }

  const existing = localStorage.getItem(PLATFORM_TEMPLATES_KEY);
  if (!existing) {
    writeJson(PLATFORM_TEMPLATES_KEY, PLATFORM_DEFAULT_TEMPLATES);
  }
}
