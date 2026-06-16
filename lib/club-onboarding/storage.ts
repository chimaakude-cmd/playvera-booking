import { writeAuthSession, type AuthUser } from "@/lib/auth";
import { readAuthSession } from "@/lib/auth/session";
import { toPersistableImageUrl } from "@/lib/image-urls";
import { createDefaultBookingQuestions } from "@/lib/booking-questions";
import { seedSetupProgressAfterOnboarding } from "@/lib/club-setup/storage";
import { saveClubProfile, CLUB_PROFILE_SAVE_QUOTA_MESSAGE } from "@/lib/club-profile/storage";
import {
  createDefaultClubProfile,
  DEFAULT_CLUB_BRANDING,
  DEFAULT_CLUB_CUSTOMER_VIEW,
} from "@/lib/club-profile/defaults";
import type { ClubProfileInput } from "@/lib/club-profile/types";
import {
  createEmptyContact,
  createEmptySocialLinks,
  slugifyClubName,
} from "@/lib/club-profile/types";
import {
  CLUB_ONBOARDING_COMPLETE_KEY,
  CLUB_ONBOARDING_DRAFT_KEY_PREFIX,
  CLUB_ONBOARDING_DRAFT_LEGACY_KEY,
  CLUB_ONBOARDING_DRAFT_SESSION_KEY,
  CLUB_DEFAULT_BOOKING_QUESTIONS_KEY,
  formatOwnerFullLegalName,
  getClubCategories,
  type ClubOnboardingState,
  type OnboardingClub,
  type OnboardingProfile,
} from "./types";
import { normalizePlanId } from "@/src/config/pricing";
import { setProviderSubscriptionPlan } from "@/lib/provider-subscription";
import { initializeProviderTemplates } from "@/lib/message-templates";
import {
  createInitialOnboardingState,
  syncDerivedOnboardingFields,
  validateOnboardingForCompletion,
} from "./validation";

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

/** Reject drafts larger than ~512 KB before parse/write. */
const MAX_DRAFT_BYTES = 512 * 1024;

export const DRAFT_SAVE_QUOTA_WARNING =
  "Draft could not be saved locally because the file is too large. Please continue or upload a smaller image.";

function normalizeDraftEmail(email: string): string {
  return email.trim().toLowerCase();
}

function isValidDraftEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

/** Resolve localStorage key: logged-in account, owner email, or anonymous session. */
export function resolveOnboardingDraftKey(options?: {
  authEmail?: string | null;
  ownerEmail?: string | null;
}): string {
  const authEmail = options?.authEmail?.trim();
  if (authEmail && isValidDraftEmail(authEmail)) {
    return `${CLUB_ONBOARDING_DRAFT_KEY_PREFIX}:account:${normalizeDraftEmail(authEmail)}`;
  }

  const ownerEmail = options?.ownerEmail?.trim();
  if (ownerEmail && isValidDraftEmail(ownerEmail)) {
    return `${CLUB_ONBOARDING_DRAFT_KEY_PREFIX}:email:${normalizeDraftEmail(ownerEmail)}`;
  }

  return CLUB_ONBOARDING_DRAFT_SESSION_KEY;
}

function resolveDraftKeyForState(state: ClubOnboardingState): string {
  const authEmail = readAuthSession()?.email ?? null;
  return resolveOnboardingDraftKey({
    authEmail,
    ownerEmail: state.owner.email,
  });
}

/** Never persist passwords — strip before write. */
function stripSensitiveOwnerFields(
  owner: ClubOnboardingState["owner"],
): ClubOnboardingState["owner"] {
  return {
    ...owner,
    password: "",
  };
}

export type SaveDraftResult =
  | { ok: true }
  | { ok: false; reason: "quota_exceeded" | "too_large" };

/** Strip base64/data URLs — only lightweight http(s) URLs may be persisted. */
export function stripImageDataUrls(
  profile: OnboardingProfile,
): OnboardingProfile {
  return {
    ...profile,
    logoUrl: toPersistableImageUrl(profile.logoUrl),
    coverUrl: toPersistableImageUrl(profile.coverUrl),
  };
}

function sanitizeDraftForStorage(state: ClubOnboardingState): ClubOnboardingState {
  return syncDerivedOnboardingFields({
    ...state,
    owner: stripSensitiveOwnerFields(state.owner),
    profile: stripImageDataUrls(state.profile),
    updatedAt: new Date().toISOString(),
  });
}

function sanitizeLoadedDraft(state: ClubOnboardingState): ClubOnboardingState {
  return syncDerivedOnboardingFields({
    ...state,
    owner: stripSensitiveOwnerFields(state.owner),
    profile: stripImageDataUrls(state.profile),
  });
}

type LegacyDraft = Partial<ClubOnboardingState> & {
  business?: { clubName?: string; businessType?: string };
  sessions?: {
    ageRanges?: string[];
    programmeTypes?: string[];
    activityFocus?: string[];
    generatedDescription?: string;
  };
  profileDesign?: {
    logoUrl?: string | null;
    coverUrl?: string | null;
    primaryColor?: string;
    tagline?: string;
    aboutText?: string;
    skipped?: boolean;
  };
};

function migrateLegacyDraft(parsed: LegacyDraft): ClubOnboardingState {
  const defaults = createInitialOnboardingState();

  const club: OnboardingClub = {
    ...defaults.club,
    ...parsed.club,
    name:
      parsed.club?.name?.trim() ||
      parsed.business?.clubName?.trim() ||
      defaults.club.name,
    businessType:
      parsed.club?.businessType ||
      (parsed.business?.businessType as OnboardingClub["businessType"]) ||
      defaults.club.businessType,
    primaryCategories:
      parsed.club?.primaryCategories?.length
        ? parsed.club.primaryCategories
        : parsed.sessions?.programmeTypes?.length
          ? parsed.sessions.programmeTypes
          : defaults.club.primaryCategories,
    secondaryActivities:
      parsed.club?.secondaryActivities?.length
        ? parsed.club.secondaryActivities
        : parsed.sessions?.activityFocus?.length
          ? parsed.sessions.activityFocus
          : defaults.club.secondaryActivities,
    ageRanges:
      parsed.club?.ageRanges?.length
        ? parsed.club.ageRanges
        : parsed.sessions?.ageRanges?.length
          ? parsed.sessions.ageRanges
          : defaults.club.ageRanges,
    suggestedDescription:
      parsed.club?.suggestedDescription ||
      parsed.sessions?.generatedDescription ||
      defaults.club.suggestedDescription,
  };

  const rawLogoUrl =
    parsed.profile?.logoUrl ??
    parsed.profileDesign?.logoUrl ??
    defaults.profile.logoUrl;
  const rawCoverUrl =
    parsed.profile?.coverUrl ??
    parsed.profileDesign?.coverUrl ??
    defaults.profile.coverUrl;

  const profile: OnboardingProfile = {
    ...defaults.profile,
    ...parsed.profile,
    logoUrl: toPersistableImageUrl(rawLogoUrl),
    coverUrl: toPersistableImageUrl(rawCoverUrl),
    primaryColor:
      parsed.profile?.primaryColor ||
      parsed.profileDesign?.primaryColor ||
      defaults.profile.primaryColor,
    tagline:
      parsed.profile?.tagline ||
      parsed.profileDesign?.tagline ||
      defaults.profile.tagline,
    aboutText:
      parsed.profile?.aboutText ||
      parsed.profileDesign?.aboutText ||
      defaults.profile.aboutText,
    skippedProfile:
      parsed.profile?.skippedProfile ??
      parsed.profileDesign?.skipped ??
      defaults.profile.skippedProfile,
  };

  const legacyStep =
    parsed.currentStep && parsed.currentStep <= 4
      ? (parsed.currentStep as 1 | 2 | 3 | 4)
      : null;
  const hasLegacyPlanStep = !parsed.planId && legacyStep !== null && legacyStep >= 2;
  const currentStep = legacyStep
    ? ((hasLegacyPlanStep ? legacyStep + 1 : legacyStep) as ClubOnboardingState["currentStep"])
    : defaults.currentStep;

  return syncDerivedOnboardingFields({
    ...defaults,
    ...parsed,
    planId: normalizePlanId(parsed.planId),
    currentStep: currentStep <= 5 ? currentStep : defaults.currentStep,
    owner: { ...defaults.owner, ...parsed.owner },
    club,
    profile,
    completedAt: parsed.completedAt ?? defaults.completedAt,
    updatedAt: parsed.updatedAt ?? defaults.updatedAt,
  });
}

function tryLoadDraftFromKey(key: string): ClubOnboardingState | null {
  if (!isBrowser()) {
    return null;
  }

  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      return null;
    }

    if (raw.length > MAX_DRAFT_BYTES) {
      localStorage.removeItem(key);
      return null;
    }

    const migrated = migrateLegacyDraft(JSON.parse(raw) as LegacyDraft);
    return sanitizeLoadedDraft(migrated);
  } catch {
    localStorage.removeItem(key);
    return null;
  }
}

function pickNewestDraft(
  drafts: Array<ClubOnboardingState | null>,
): ClubOnboardingState | null {
  let newest: ClubOnboardingState | null = null;

  for (const draft of drafts) {
    if (!draft) {
      continue;
    }
    if (
      !newest ||
      new Date(draft.updatedAt).getTime() > new Date(newest.updatedAt).getTime()
    ) {
      newest = draft;
    }
  }

  return newest;
}

function collectDraftLoadKeys(): string[] {
  const authEmail = readAuthSession()?.email ?? null;
  const keys = new Set<string>();

  if (authEmail) {
    keys.add(resolveOnboardingDraftKey({ authEmail }));
  }

  keys.add(CLUB_ONBOARDING_DRAFT_SESSION_KEY);

  const sessionDraft = tryLoadDraftFromKey(CLUB_ONBOARDING_DRAFT_SESSION_KEY);
  if (sessionDraft?.owner.email.trim()) {
    keys.add(
      resolveOnboardingDraftKey({ ownerEmail: sessionDraft.owner.email }),
    );
  }

  if (isBrowser()) {
    for (let index = 0; index < localStorage.length; index += 1) {
      const key = localStorage.key(index);
      if (key?.startsWith(`${CLUB_ONBOARDING_DRAFT_KEY_PREFIX}:email:`)) {
        keys.add(key);
      }
    }
  }

  keys.add(CLUB_ONBOARDING_DRAFT_LEGACY_KEY);

  return [...keys];
}

export function loadOnboardingDraft(): ClubOnboardingState {
  if (!isBrowser()) {
    return createInitialOnboardingState();
  }

  const drafts = collectDraftLoadKeys().map((key) => tryLoadDraftFromKey(key));
  const loaded = pickNewestDraft(drafts);

  return loaded ?? createInitialOnboardingState();
}

function writeDraftToKey(
  key: string,
  sanitized: ClubOnboardingState,
): SaveDraftResult {
  const serialized = JSON.stringify(sanitized);

  if (serialized.length > MAX_DRAFT_BYTES) {
    return { ok: false, reason: "too_large" };
  }

  try {
    localStorage.setItem(key, serialized);
    return { ok: true };
  } catch (error) {
    if (
      error instanceof DOMException &&
      (error.name === "QuotaExceededError" ||
        error.name === "NS_ERROR_DOM_QUOTA_REACHED")
    ) {
      return { ok: false, reason: "quota_exceeded" };
    }
    throw error;
  }
}

export function safeSaveOnboardingDraft(state: ClubOnboardingState): SaveDraftResult {
  if (!isBrowser()) {
    return { ok: true };
  }

  const sanitized = sanitizeDraftForStorage(state);
  const primaryKey = resolveDraftKeyForState(state);
  const result = writeDraftToKey(primaryKey, sanitized);

  if (!result.ok) {
    return result;
  }

  if (primaryKey !== CLUB_ONBOARDING_DRAFT_SESSION_KEY) {
    const sessionResult = writeDraftToKey(CLUB_ONBOARDING_DRAFT_SESSION_KEY, sanitized);
    if (!sessionResult.ok) {
      return sessionResult;
    }
  }

  if (localStorage.getItem(CLUB_ONBOARDING_DRAFT_LEGACY_KEY)) {
    localStorage.removeItem(CLUB_ONBOARDING_DRAFT_LEGACY_KEY);
  }

  return { ok: true };
}

export function saveOnboardingDraft(state: ClubOnboardingState): SaveDraftResult {
  return safeSaveOnboardingDraft(state);
}

export function clearOnboardingDraft(state?: ClubOnboardingState): void {
  if (!isBrowser()) {
    return;
  }

  const keys = new Set<string>([
    CLUB_ONBOARDING_DRAFT_SESSION_KEY,
    CLUB_ONBOARDING_DRAFT_LEGACY_KEY,
  ]);

  if (state) {
    keys.add(resolveDraftKeyForState(state));
  } else {
    const authEmail = readAuthSession()?.email ?? null;
    if (authEmail) {
      keys.add(resolveOnboardingDraftKey({ authEmail }));
    }
  }

  for (const key of keys) {
    localStorage.removeItem(key);
  }
}

export function isOnboardingComplete(): boolean {
  if (!isBrowser()) {
    return false;
  }

  return localStorage.getItem(CLUB_ONBOARDING_COMPLETE_KEY) === "true";
}

export function markOnboardingComplete(): void {
  if (isBrowser()) {
    localStorage.setItem(CLUB_ONBOARDING_COMPLETE_KEY, "true");
  }
}

function buildClubProfileInput(state: ClubOnboardingState): ClubProfileInput {
  const defaults = createDefaultClubProfile();
  const slug = slugifyClubName(state.club.name);
  const aboutText =
    state.profile.aboutText.trim() || state.club.suggestedDescription.trim();
  const tagline =
    state.profile.tagline.trim() || state.club.suggestedTagline.trim();
  const persistedProfile = stripImageDataUrls(state.profile);
  const logoUrl = persistedProfile.logoUrl;
  const coverUrl = persistedProfile.coverUrl;

  const contact = {
    ...createEmptyContact(),
    email: state.owner.email.trim(),
    phone: state.owner.phone.trim(),
  };

  return {
    logoUrl,
    coverImageUrl: coverUrl,
    clubName: state.club.name.trim(),
    tagline,
    shortDescription: aboutText.slice(0, 200),
    establishedYear: null,
    verificationStatus: "unverified",
    longDescription: aboutText,
    uniqueSellingPoints: "",
    categories: getClubCategories(state.club),
    ageRanges: state.club.ageRanges,
    accessibilityOptions: defaults.accessibilityOptions,
    locations: defaults.locations,
    contact,
    socialLinks: createEmptySocialLinks(),
    branding: {
      ...DEFAULT_CLUB_BRANDING,
      primaryColor: state.profile.primaryColor,
      secondaryColor: DEFAULT_CLUB_BRANDING.secondaryColor,
    },
    customerView: DEFAULT_CLUB_CUSTOMER_VIEW,
    mediaGallery: defaults.mediaGallery,
    publicSlug: slug,
    metaTitle: `${state.club.name.trim()} | Activeora`,
    metaDescription: tagline,
    published: true,
    profileDesign: {
      logoUrl,
      coverUrl,
      primaryColor: state.profile.primaryColor,
      accentColor: DEFAULT_CLUB_BRANDING.secondaryColor,
      themePreset: null,
      tagline,
      aboutText,
      whatMakesSpecial: "",
      profileStyle: "modern",
      trustSignals: {
        verified: false,
        dbs: false,
        ofsted: false,
        insurance: false,
        yearsRunning: false,
        avgReview: false,
      },
      settings: {
        publicVisible: true,
        searchIndexing: true,
        showReviews: true,
        allowMessaging: true,
      },
      publishedAt: new Date().toISOString(),
      skipped: state.profile.skippedProfile,
    },
  };
}

function createOwnerAuthUser(state: ClubOnboardingState): AuthUser {
  const name = formatOwnerFullLegalName(state.owner);

  return {
    id: `club_owner_${Date.now()}`,
    email: state.owner.email.trim(),
    name: name || "Club Owner",
    role: "club",
    clubRole: "owner",
  };
}

export function completeClubOnboarding(state: ClubOnboardingState): {
  success: boolean;
  errors: string[];
} {
  const synced = syncDerivedOnboardingFields(state);
  const errors = validateOnboardingForCompletion(synced);

  if (errors.length > 0) {
    return { success: false, errors };
  }

  if (!isBrowser()) {
    return { success: false, errors: ["Onboarding must be completed in the browser."] };
  }

  const profileInput = buildClubProfileInput(synced);

  try {
    saveClubProfile(profileInput);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not save club profile.";
    const isQuotaMessage = message === CLUB_PROFILE_SAVE_QUOTA_MESSAGE;

    if (!isQuotaMessage) {
      return {
        success: false,
        errors: [message],
      };
    }
  }

  const user = createOwnerAuthUser(synced);
  writeAuthSession(user);

  setProviderSubscriptionPlan(normalizePlanId(synced.planId));

  markOnboardingComplete();
  seedSetupProgressAfterOnboarding();
  initializeProviderTemplates(undefined, { showOnboardingBanner: true });
  clearOnboardingDraft();

  return { success: true, errors: [] };
}

export function getClubDefaultBookingQuestions() {
  if (!isBrowser()) {
    return createDefaultBookingQuestions();
  }

  try {
    const raw = localStorage.getItem(CLUB_DEFAULT_BOOKING_QUESTIONS_KEY);
    if (!raw) {
      return createDefaultBookingQuestions();
    }
    return JSON.parse(raw) as ReturnType<typeof createDefaultBookingQuestions>;
  } catch {
    return createDefaultBookingQuestions();
  }
}
