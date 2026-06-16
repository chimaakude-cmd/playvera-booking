import {
  CLUB_SAVED_PARTNERS_KEY,
  LEGACY_DEMO_CLAIM_IDS,
  LEGACY_DEMO_PARTNER_IDS,
  PARTNER_CLAIMS_STORAGE_KEY,
  PARTNERS_DEMO_PURGE_KEY,
  PARTNERS_STORAGE_KEY,
} from "./defaults";
import type {
  CreatePartnerClaimInput,
  CreatePartnerInput,
  Partner,
  PartnerAnalytics,
  PartnerCategory,
  PartnerClaim,
  PartnerStatus,
  UpdatePartnerInput,
} from "./types";
import {
  isPartnerPubliclyVisible,
  slugifyPartnerName,
} from "./types";

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function createId(prefix: string): string {
  return `${prefix}_${crypto.randomUUID().slice(0, 8)}`;
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
  localStorage.setItem(key, JSON.stringify(value));
}

function ensureStorageInitialized(): void {
  if (!isBrowser()) {
    return;
  }
  if (!localStorage.getItem(PARTNERS_STORAGE_KEY)) {
    writeJson(PARTNERS_STORAGE_KEY, []);
  }
  if (!localStorage.getItem(PARTNER_CLAIMS_STORAGE_KEY)) {
    writeJson(PARTNER_CLAIMS_STORAGE_KEY, []);
  }
}

function purgeLegacyDemoData(): void {
  if (!isBrowser()) {
    return;
  }
  if (localStorage.getItem(PARTNERS_DEMO_PURGE_KEY)) {
    return;
  }

  const partners = readJson<Partner[]>(PARTNERS_STORAGE_KEY, []);
  const claims = readJson<PartnerClaim[]>(PARTNER_CLAIMS_STORAGE_KEY, []);
  const saved = readJson<string[]>(CLUB_SAVED_PARTNERS_KEY, []);

  const nextPartners = partners.filter(
    (partner) => !LEGACY_DEMO_PARTNER_IDS.has(partner.id),
  );
  const nextClaims = claims.filter(
    (claim) =>
      !LEGACY_DEMO_CLAIM_IDS.has(claim.id) &&
      !LEGACY_DEMO_PARTNER_IDS.has(claim.partnerId),
  );
  const nextSaved = saved.filter((id) => !LEGACY_DEMO_PARTNER_IDS.has(id));

  if (
    nextPartners.length !== partners.length ||
    nextClaims.length !== claims.length ||
    nextSaved.length !== saved.length
  ) {
    writeJson(PARTNERS_STORAGE_KEY, nextPartners);
    writeJson(PARTNER_CLAIMS_STORAGE_KEY, nextClaims);
    writeJson(CLUB_SAVED_PARTNERS_KEY, nextSaved);
  }

  localStorage.setItem(PARTNERS_DEMO_PURGE_KEY, "1");
}

function prepareStorage(): void {
  ensureStorageInitialized();
  purgeLegacyDemoData();
}

function sortPartners(partners: Partner[]): Partner[] {
  return [...partners].sort((a, b) => {
    if (a.status === "featured" && b.status !== "featured") {
      return -1;
    }
    if (b.status === "featured" && a.status !== "featured") {
      return 1;
    }
    if (a.recommended !== b.recommended) {
      return a.recommended ? -1 : 1;
    }
    return a.name.localeCompare(b.name);
  });
}

function partnerAnalytics(partner: Partner): PartnerAnalytics {
  return (
    partner.analytics ?? {
      views: 0,
      clicks: 0,
      claims: 0,
      introductions: 0,
    }
  );
}

function updatePartnerAnalytics(
  partnerId: string,
  field: keyof PartnerAnalytics,
): void {
  prepareStorage();
  const partners = readJson<Partner[]>(PARTNERS_STORAGE_KEY, []);
  const index = partners.findIndex((partner) => partner.id === partnerId);
  if (index === -1) {
    return;
  }
  const analytics = partnerAnalytics(partners[index]);
  partners[index] = {
    ...partners[index],
    analytics: {
      ...analytics,
      [field]: analytics[field] + 1,
    },
    updatedAt: nowIso(),
  };
  writeJson(PARTNERS_STORAGE_KEY, partners);
}

export function getAllPartners(): Partner[] {
  prepareStorage();
  return sortPartners(readJson<Partner[]>(PARTNERS_STORAGE_KEY, []));
}

export function getPublicPartners(): Partner[] {
  return getAllPartners().filter((partner) =>
    isPartnerPubliclyVisible(partner.status),
  );
}

export function getPartnerById(id: string): Partner | null {
  return getAllPartners().find((partner) => partner.id === id) ?? null;
}

export function getPartnerBySlug(slug: string): Partner | null {
  return getAllPartners().find((partner) => partner.slug === slug) ?? null;
}

export function filterPartners(
  partners: Partner[],
  filters: {
    category?: PartnerCategory | "all";
    benefitType?: string | "all";
    recommended?: boolean;
    isNew?: boolean;
    query?: string;
  },
): Partner[] {
  let result = partners;

  if (filters.category && filters.category !== "all") {
    result = result.filter((partner) => partner.category === filters.category);
  }

  if (filters.benefitType && filters.benefitType !== "all") {
    result = result.filter(
      (partner) => partner.benefitType === filters.benefitType,
    );
  }

  if (filters.recommended) {
    result = result.filter((partner) => partner.recommended);
  }

  if (filters.isNew) {
    result = result.filter((partner) => partner.isNew);
  }

  if (filters.query?.trim()) {
    const query = filters.query.trim().toLowerCase();
    result = result.filter(
      (partner) =>
        partner.name.toLowerCase().includes(query) ||
        partner.shortDescription.toLowerCase().includes(query) ||
        partner.benefitOffered.toLowerCase().includes(query),
    );
  }

  return result;
}

export function createPartner(input: CreatePartnerInput): Partner {
  prepareStorage();
  const partners = readJson<Partner[]>(PARTNERS_STORAGE_KEY, []);
  const now = nowIso();
  const baseSlug = slugifyPartnerName(input.name);
  let slug = baseSlug;
  let counter = 1;
  while (partners.some((partner) => partner.slug === slug)) {
    slug = `${baseSlug}-${counter}`;
    counter += 1;
  }

  const partner: Partner = {
    ...input,
    id: createId("partner"),
    slug,
    analytics: { views: 0, clicks: 0, claims: 0, introductions: 0 },
    createdAt: now,
    updatedAt: now,
  };
  writeJson(PARTNERS_STORAGE_KEY, [partner, ...partners]);
  return partner;
}

export function updatePartner(
  id: string,
  input: UpdatePartnerInput,
): Partner | null {
  prepareStorage();
  const partners = readJson<Partner[]>(PARTNERS_STORAGE_KEY, []);
  const index = partners.findIndex((partner) => partner.id === id);
  if (index === -1) {
    return null;
  }

  const current = partners[index];
  const nextName = input.name?.trim() ?? current.name;
  let nextSlug = current.slug;
  if (input.name && input.name.trim() !== current.name) {
    const baseSlug = slugifyPartnerName(nextName);
    nextSlug = baseSlug;
    let counter = 1;
    while (
      partners.some(
        (partner) => partner.id !== id && partner.slug === nextSlug,
      )
    ) {
      nextSlug = `${baseSlug}-${counter}`;
      counter += 1;
    }
  }

  const updated: Partner = {
    ...current,
    ...input,
    name: nextName,
    slug: nextSlug,
    updatedAt: nowIso(),
  };
  partners[index] = updated;
  writeJson(PARTNERS_STORAGE_KEY, partners);
  return updated;
}

export function setPartnerStatus(
  id: string,
  status: PartnerStatus,
): Partner | null {
  return updatePartner(id, { status });
}

export function deletePartner(id: string): boolean {
  prepareStorage();
  const partners = readJson<Partner[]>(PARTNERS_STORAGE_KEY, []);
  const next = partners.filter((partner) => partner.id !== id);
  if (next.length === partners.length) {
    return false;
  }
  writeJson(PARTNERS_STORAGE_KEY, next);
  return true;
}

export function recordPartnerView(partnerId: string): void {
  updatePartnerAnalytics(partnerId, "views");
}

export function recordPartnerClick(partnerId: string): void {
  updatePartnerAnalytics(partnerId, "clicks");
}

export function getPartnerClaims(): PartnerClaim[] {
  prepareStorage();
  const claims = readJson<PartnerClaim[]>(PARTNER_CLAIMS_STORAGE_KEY, []);
  return [...claims].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

export function getPartnerClaimsForPartner(partnerId: string): PartnerClaim[] {
  return getPartnerClaims().filter((claim) => claim.partnerId === partnerId);
}

export function createPartnerClaim(
  input: CreatePartnerClaimInput,
): PartnerClaim {
  prepareStorage();
  const claims = readJson<PartnerClaim[]>(PARTNER_CLAIMS_STORAGE_KEY, []);
  const claim: PartnerClaim = {
    ...input,
    id: createId("pclaim"),
    createdAt: nowIso(),
  };
  writeJson(PARTNER_CLAIMS_STORAGE_KEY, [claim, ...claims]);

  if (input.type === "claim") {
    updatePartnerAnalytics(input.partnerId, "claims");
  } else if (input.type === "introduction") {
    updatePartnerAnalytics(input.partnerId, "introductions");
  }

  return claim;
}

export function getSavedPartnerIds(): string[] {
  return readJson<string[]>(CLUB_SAVED_PARTNERS_KEY, []);
}

export function isPartnerSaved(partnerId: string): boolean {
  return getSavedPartnerIds().includes(partnerId);
}

export function toggleSavedPartner(partnerId: string): boolean {
  const saved = getSavedPartnerIds();
  const isSaved = saved.includes(partnerId);
  if (isSaved) {
    writeJson(
      CLUB_SAVED_PARTNERS_KEY,
      saved.filter((id) => id !== partnerId),
    );
    return false;
  }
  writeJson(CLUB_SAVED_PARTNERS_KEY, [...saved, partnerId]);
  return true;
}

export function getPartnersAnalyticsSummary(): PartnerAnalytics & {
  totalPartners: number;
  livePartners: number;
} {
  const partners = getAllPartners();
  const live = partners.filter((partner) =>
    isPartnerPubliclyVisible(partner.status),
  );
  return {
    totalPartners: partners.length,
    livePartners: live.length,
    views: partners.reduce(
      (sum, partner) => sum + partnerAnalytics(partner).views,
      0,
    ),
    clicks: partners.reduce(
      (sum, partner) => sum + partnerAnalytics(partner).clicks,
      0,
    ),
    claims: partners.reduce(
      (sum, partner) => sum + partnerAnalytics(partner).claims,
      0,
    ),
    introductions: partners.reduce(
      (sum, partner) => sum + partnerAnalytics(partner).introductions,
      0,
    ),
  };
}

export function exportPartnersJson(): string {
  return JSON.stringify(getAllPartners(), null, 2);
}
