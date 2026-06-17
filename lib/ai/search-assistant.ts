import { ACTIVITY_CATALOG } from "@/lib/home/activity-catalog";
import type { HomeSearchFilters } from "@/lib/home/search-url";
import { DEFAULT_DISCOVERY_FILTERS } from "@/lib/discovery/constants";
import { AI_SEARCH_OPENAI_MODEL } from "./constants";

export type AiSearchFilterFields = Partial<
  Pick<
    HomeSearchFilters,
    "location" | "childAge" | "radius" | "activity" | "date"
  >
> & {
  /** Parsed but not yet supported by discovery filters — kept for follow-up UX. */
  sessionType?: string;
  priceMin?: number;
  priceMax?: number;
};

export type AiSearchParseResult = {
  filters: AiSearchFilterFields;
  followUpQuestion?: string;
};

const ALLOWED_FILTER_KEYS = new Set([
  "location",
  "childAge",
  "radius",
  "activity",
  "date",
  "sessionType",
  "priceMin",
  "priceMax",
]);

const FORBIDDEN_RESPONSE_KEYS = [
  "action",
  "command",
  "intent",
  "create",
  "delete",
  "refund",
  "publish",
  "message",
  "admin",
  "booking",
  "provider",
] as const;

const ACTIVITY_KEYWORDS = ACTIVITY_CATALOG.flatMap((item) => [
  item.query.toLowerCase(),
  item.label.toLowerCase(),
]);

const UK_POSTCODE_PATTERN =
  /\b([A-Z]{1,2}\d{1,2}[A-Z]?\s*\d[A-Z]{2})\b/i;

const RADIUS_PATTERN =
  /\b(?:within|under|less than|up to)?\s*(\d{1,2})\s*(?:mi(?:le)?s?|miles)\b/i;

const AGE_PATTERNS = [
  /\b(?:age|aged)\s*(\d{1,2})\b/i,
  /\b(\d{1,2})\s*(?:year|yr)s?\s*old\b/i,
  /\bfor\s+(?:my\s+)?(\d{1,2})\s*(?:yo|y\.?o\.?)\b/i,
  /\b(\d{1,2})\s*yo\b/i,
];

const LOCATION_PATTERNS = [
  /\b(?:near|around|in|at|close to)\s+([A-Za-z][A-Za-z\s'-]{2,40})/i,
  UK_POSTCODE_PATTERN,
];

const DATE_KEYWORDS: Array<{ pattern: RegExp; value: () => string }> = [
  {
    pattern: /\btoday\b/i,
    value: () => formatIsoDate(new Date()),
  },
  {
    pattern: /\btomorrow\b/i,
    value: () => {
      const date = new Date();
      date.setDate(date.getDate() + 1);
      return formatIsoDate(date);
    },
  },
  {
    pattern: /\bthis\s+weekend\b/i,
    value: () => formatIsoDate(nextWeekendDate()),
  },
  {
    pattern: /\bnext\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i,
    value: () => formatIsoDate(nextWeekdayFromQuery()),
  },
];

function formatIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function nextWeekendDate(): Date {
  const date = new Date();
  const day = date.getDay();
  const daysUntilSaturday = day === 6 ? 0 : (6 - day + 7) % 7;
  date.setDate(date.getDate() + daysUntilSaturday);
  return date;
}

function nextWeekdayFromQuery(): Date {
  const date = new Date();
  date.setDate(date.getDate() + 7);
  return date;
}

function normalizeRadius(value: string | number | undefined): string | undefined {
  if (value === undefined || value === "") {
    return undefined;
  }
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric <= 0) {
    return undefined;
  }
  const allowed = ["5", "10", "15", "25"];
  const asString = String(Math.round(numeric));
  if (allowed.includes(asString)) {
    return asString;
  }
  const nearest = allowed.reduce((best, current) => {
    return Math.abs(Number(current) - numeric) <
      Math.abs(Number(best) - numeric)
      ? current
      : best;
  });
  return nearest;
}

function sanitizeString(value: unknown, maxLength = 120): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }
  const trimmed = value.trim().slice(0, maxLength);
  return trimmed.length > 0 ? trimmed : undefined;
}

function sanitizeNumber(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value) && value >= 0) {
    return value;
  }
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value.replace(/[^\d.]/g, ""));
    if (Number.isFinite(parsed) && parsed >= 0) {
      return parsed;
    }
  }
  return undefined;
}

function hasForbiddenKeys(payload: Record<string, unknown>): boolean {
  return Object.keys(payload).some((key) => {
    const lower = key.toLowerCase();
    return FORBIDDEN_RESPONSE_KEYS.some((forbidden) =>
      lower.includes(forbidden),
    );
  });
}

export function validateAiSearchResponse(
  payload: unknown,
): AiSearchParseResult | null {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return null;
  }

  const record = payload as Record<string, unknown>;

  if (hasForbiddenKeys(record)) {
    return null;
  }

  const rawFilters = record.filters;
  if (!rawFilters || typeof rawFilters !== "object" || Array.isArray(rawFilters)) {
    return null;
  }

  const filterRecord = rawFilters as Record<string, unknown>;
  if (hasForbiddenKeys(filterRecord)) {
    return null;
  }

  for (const key of Object.keys(filterRecord)) {
    if (!ALLOWED_FILTER_KEYS.has(key)) {
      return null;
    }
  }

  const filters: AiSearchFilterFields = {};

  const location = sanitizeString(filterRecord.location);
  if (location) {
    filters.location = location;
  }

  const childAge = sanitizeString(filterRecord.childAge, 20);
  if (childAge) {
    filters.childAge = childAge;
  }

  const activity = sanitizeString(filterRecord.activity);
  if (activity) {
    filters.activity = activity;
  }

  const date = sanitizeString(filterRecord.date, 10);
  if (date && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
    filters.date = date;
  }

  const radius = normalizeRadius(
    filterRecord.radius as string | number | undefined,
  );
  if (radius) {
    filters.radius = radius;
  }

  const sessionType = sanitizeString(filterRecord.sessionType);
  if (sessionType) {
    filters.sessionType = sessionType;
  }

  const priceMin = sanitizeNumber(filterRecord.priceMin);
  if (priceMin !== undefined) {
    filters.priceMin = priceMin;
  }

  const priceMax = sanitizeNumber(filterRecord.priceMax);
  if (priceMax !== undefined) {
    filters.priceMax = priceMax;
  }

  const followUpQuestion = sanitizeString(record.followUpQuestion, 240);

  return {
    filters,
    followUpQuestion,
  };
}

export function aiFiltersToHomeSearchFilters(
  filters: AiSearchFilterFields,
): Partial<HomeSearchFilters> {
  const next: Partial<HomeSearchFilters> = {};

  if (filters.location) {
    next.location = filters.location;
  }
  if (filters.childAge) {
    next.childAge = filters.childAge;
  }
  if (filters.activity) {
    next.activity = filters.activity;
  } else if (filters.sessionType) {
    next.activity = filters.sessionType;
  }
  if (filters.radius) {
    next.radius = filters.radius;
  }
  if (filters.date) {
    next.date = filters.date;
  }

  return next;
}

export function mergeAiFiltersWithDefaults(
  filters: AiSearchFilterFields,
): HomeSearchFilters {
  return {
    ...DEFAULT_DISCOVERY_FILTERS,
    ...aiFiltersToHomeSearchFilters(filters),
  };
}

function findActivityKeyword(query: string): string | undefined {
  const lower = query.toLowerCase();
  for (const keyword of ACTIVITY_KEYWORDS) {
    if (lower.includes(keyword)) {
      const match = ACTIVITY_CATALOG.find(
        (item) =>
          item.query.toLowerCase() === keyword ||
          item.label.toLowerCase() === keyword,
      );
      return match?.query ?? keyword;
    }
  }
  return undefined;
}

function findAge(query: string): string | undefined {
  for (const pattern of AGE_PATTERNS) {
    const match = query.match(pattern);
    if (match?.[1]) {
      return match[1];
    }
  }
  return undefined;
}

function findLocation(query: string): string | undefined {
  const postcodeMatch = query.match(UK_POSTCODE_PATTERN);
  if (postcodeMatch?.[1]) {
    return postcodeMatch[1].toUpperCase();
  }

  for (const pattern of LOCATION_PATTERNS) {
    const match = query.match(pattern);
    if (match?.[1]) {
      return match[1].trim();
    }
  }

  if (/\bnear me\b/i.test(query)) {
    return "Near me";
  }

  return undefined;
}

function findRadius(query: string): string | undefined {
  const match = query.match(RADIUS_PATTERN);
  if (match?.[1]) {
    return normalizeRadius(match[1]);
  }
  return undefined;
}

function findDate(query: string): string | undefined {
  for (const entry of DATE_KEYWORDS) {
    if (entry.pattern.test(query)) {
      return entry.value();
    }
  }

  const isoMatch = query.match(/\b(20\d{2}-\d{2}-\d{2})\b/);
  if (isoMatch?.[1]) {
    return isoMatch[1];
  }

  return undefined;
}

function findSessionType(query: string): string | undefined {
  const types = [
    { pattern: /\b(holiday\s+camp|camps?)\b/i, value: "camps" },
    { pattern: /\bwraparound\b/i, value: "wraparound" },
    { pattern: /\b(after[\s-]?school|after school club)\b/i, value: "wraparound" },
    { pattern: /\b(one[\s-]?off|single session)\b/i, value: "one-off" },
    { pattern: /\b(term[\s-]?time|weekly)\b/i, value: "term-time" },
  ];

  for (const entry of types) {
    if (entry.pattern.test(query)) {
      return entry.value;
    }
  }

  return undefined;
}

function findPriceRange(query: string): { min?: number; max?: number } {
  const underMatch = query.match(/\b(?:under|below|less than|max)\s*£?\s*(\d+)\b/i);
  if (underMatch?.[1]) {
    return { max: Number(underMatch[1]) };
  }

  const betweenMatch = query.match(
    /\b£?\s*(\d+)\s*(?:-|to)\s*£?\s*(\d+)\b/i,
  );
  if (betweenMatch?.[1] && betweenMatch?.[2]) {
    return {
      min: Number(betweenMatch[1]),
      max: Number(betweenMatch[2]),
    };
  }

  return {};
}

function buildFollowUpQuestion(
  filters: AiSearchFilterFields,
  query: string,
): string | undefined {
  const hasActivity = Boolean(filters.activity || filters.sessionType);
  const hasLocation = Boolean(filters.location);
  const hasAge = Boolean(filters.childAge);

  if (!hasActivity && !hasLocation && !hasAge) {
    return "What activity are you looking for, and which area should we search?";
  }

  if (!hasLocation && /weekend|tomorrow|saturday|sunday/i.test(query)) {
    return "Which town or postcode should we search near?";
  }

  if (!hasAge && hasActivity) {
    return "How old is your child? That helps us match the right age groups.";
  }

  if (
    filters.priceMin !== undefined ||
    filters.priceMax !== undefined
  ) {
    return undefined;
  }

  return undefined;
}

/**
 * Keyword-based parser used when OPENAI_API_KEY is unavailable.
 */
export function parseSearchQueryWithKeywords(
  query: string,
): AiSearchParseResult {
  const trimmed = query.trim();
  if (!trimmed) {
    return {
      filters: {},
      followUpQuestion:
        "Tell us what you're looking for — for example, swimming for a 7-year-old near Manchester.",
    };
  }

  const activity = findActivityKeyword(trimmed);
  const sessionType = findSessionType(trimmed);
  const childAge = findAge(trimmed);
  const location = findLocation(trimmed);
  const radius = findRadius(trimmed);
  const date = findDate(trimmed);
  const priceRange = findPriceRange(trimmed);

  const filters: AiSearchFilterFields = {
    ...(activity ? { activity } : {}),
    ...(sessionType ? { sessionType } : {}),
    ...(childAge ? { childAge } : {}),
    ...(location ? { location } : {}),
    ...(radius ? { radius } : {}),
    ...(date ? { date } : {}),
    ...(priceRange.min !== undefined ? { priceMin: priceRange.min } : {}),
    ...(priceRange.max !== undefined ? { priceMax: priceRange.max } : {}),
  };

  return {
    filters,
    followUpQuestion: buildFollowUpQuestion(filters, trimmed),
  };
}

const OPENAI_SYSTEM_PROMPT = `You are Activora's activity discovery search assistant (Phase 1).

Your ONLY job is to convert a parent's natural language search into JSON filters for browsing activities.

STRICT RULES:
- Return JSON ONLY with this shape: {"filters":{...},"followUpQuestion":"optional string"}
- Allowed filter keys: location, childAge, radius, activity, date, sessionType, priceMin, priceMax
- radius must be one of: "5", "10", "15", "25" (miles)
- date must be ISO YYYY-MM-DD when inferrable
- NEVER suggest or return create, edit, delete, refund, publish, message, admin, booking, or provider actions
- If the request is unclear, ask ONE short followUpQuestion instead of guessing wildly
- Leave unknown fields out of filters rather than inventing values`;

export async function parseSearchQueryWithOpenAI(
  query: string,
  apiKey: string,
): Promise<AiSearchParseResult> {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: AI_SEARCH_OPENAI_MODEL,
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: OPENAI_SYSTEM_PROMPT },
        {
          role: "user",
          content: `Parse this parent search query into discovery filters:\n"${query.slice(0, 500)}"`,
        },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI request failed (${response.status})`);
  }

  const payload = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };

  const content = payload.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("OpenAI returned an empty response");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch {
    throw new Error("OpenAI returned invalid JSON");
  }

  const validated = validateAiSearchResponse(parsed);
  if (!validated) {
    throw new Error("OpenAI response failed safety validation");
  }

  return validated;
}

export async function parseSearchQuery(query: string): Promise<AiSearchParseResult> {
  const trimmed = query.trim();
  if (!trimmed) {
    return parseSearchQueryWithKeywords("");
  }

  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    return parseSearchQueryWithKeywords(trimmed);
  }

  try {
    return await parseSearchQueryWithOpenAI(trimmed, apiKey);
  } catch {
    return parseSearchQueryWithKeywords(trimmed);
  }
}

export function getNoResultsSuggestions(
  filters: HomeSearchFilters,
): Array<{ label: string; updates: Partial<HomeSearchFilters> }> {
  const suggestions: Array<{
    label: string;
    updates: Partial<HomeSearchFilters>;
  }> = [];

  const currentRadius = Number(filters.radius) || 10;
  if (currentRadius < 25) {
    suggestions.push({
      label: "Widen search radius to 25 miles",
      updates: { radius: "25" },
    });
  }

  if (filters.date.trim()) {
    suggestions.push({
      label: "Try a different date",
      updates: { date: "" },
    });
  }

  if (filters.activity.trim() || filters.childAge.trim()) {
    suggestions.push({
      label: "Remove activity or age filters",
      updates: { activity: "", childAge: "" },
    });
  }

  return suggestions;
}
