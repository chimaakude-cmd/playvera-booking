export type CampaignAudienceType =
  | "all_parents"
  | "by_activity"
  | "by_venue"
  | "by_age_group"
  | "promo_code"
  | "holiday_camp";

export type CampaignDeliveryChannel = "email" | "sms" | "whatsapp";

export type CampaignHistoryStatus = "sent" | "scheduled" | "cancelled";

export type ClubCampaign = {
  id: string;
  name: string;
  audienceType: CampaignAudienceType;
  audience: string;
  sentAt: string | null;
  scheduledAt: string | null;
  delivered: number;
  estimatedRecipients: number;
  openRate: number;
  status: CampaignHistoryStatus;
  deliveryChannel: CampaignDeliveryChannel;
  subject: string;
  body: string;
  respectUnsubscribe: boolean;
};

export type CampaignBuilderDraft = {
  audienceType: CampaignAudienceType;
  name: string;
  selectedActivities: string[];
  selectedVenues: string[];
  selectedAgeGroups: string[];
  deliveryChannel: CampaignDeliveryChannel;
  subject: string;
  body: string;
  respectUnsubscribe: boolean;
  sendMode: "now" | "schedule";
  scheduledAt: string;
};

export const CLUB_CAMPAIGNS_STORAGE_KEY = "activora-club-campaigns";

export const CAMPAIGN_TYPE_DEFINITIONS: Array<{
  id: CampaignAudienceType;
  title: string;
  description: string;
  buttonLabel: string;
}> = [
  {
    id: "all_parents",
    title: "All parents",
    description:
      "Message every parent with an active or previous booking.",
    buttonLabel: "Create campaign",
  },
  {
    id: "by_activity",
    title: "By activity",
    description: "Target parents booked onto selected activities.",
    buttonLabel: "Select activities",
  },
  {
    id: "by_venue",
    title: "By venue",
    description: "Send messages only to parents attending chosen venues.",
    buttonLabel: "Choose venues",
  },
  {
    id: "by_age_group",
    title: "By age group",
    description: "Target families based on child age ranges.",
    buttonLabel: "Choose ages",
  },
  {
    id: "promo_code",
    title: "Promo code",
    description: "Create and distribute discount campaigns.",
    buttonLabel: "Create promo campaign",
  },
  {
    id: "holiday_camp",
    title: "Holiday camp",
    description: "Promote holiday camps to suitable families.",
    buttonLabel: "Create holiday campaign",
  },
];

export const DEMO_CAMPAIGN_ACTIVITIES = [
  "Saturday football (U8)",
  "Mini tennis",
  "Gymnastics fundamentals",
  "Holiday multi-sport camp",
  "After-school athletics",
] as const;

export const DEMO_CAMPAIGN_VENUES = [
  "Main sports hall",
  "Outdoor pitch",
  "Community centre",
  "Swimming pool",
] as const;

export const DEMO_CAMPAIGN_AGE_GROUPS = [
  "4–6 years",
  "7–9 years",
  "10–12 years",
  "13+ years",
] as const;

export const CAMPAIGN_AUDIENCE_LABELS: Record<CampaignAudienceType, string> = {
  all_parents: "All parents with bookings",
  by_activity: "By activity",
  by_venue: "By venue",
  by_age_group: "By age group",
  promo_code: "Promo code campaign",
  holiday_camp: "Holiday camp",
};

export const DEFAULT_CLUB_CAMPAIGNS: ClubCampaign[] = [
  {
    id: "club_camp_001",
    name: "Term restart reminder",
    audienceType: "all_parents",
    audience: "All parents with bookings",
    sentAt: "2026-05-28T09:00:00.000Z",
    scheduledAt: null,
    delivered: 271,
    estimatedRecipients: 284,
    openRate: 46,
    status: "sent",
    deliveryChannel: "email",
    subject: "Sessions resume next week",
    body: "Hi {{parent_name}}, sessions resume on Monday. See you on the pitch!",
    respectUnsubscribe: true,
  },
  {
    id: "club_camp_002",
    name: "Football U8 session update",
    audienceType: "by_activity",
    audience: "Saturday football (U8)",
    sentAt: "2026-06-02T14:30:00.000Z",
    scheduledAt: null,
    delivered: 38,
    estimatedRecipients: 42,
    openRate: 52,
    status: "sent",
    deliveryChannel: "email",
    subject: "Venue change for Saturday football",
    body: "This week's U8 session moves to the outdoor pitch.",
    respectUnsubscribe: true,
  },
  {
    id: "club_camp_003",
    name: "Summer camp early bird",
    audienceType: "holiday_camp",
    audience: "Families with past camp bookings",
    sentAt: null,
    scheduledAt: "2026-06-20T08:00:00.000Z",
    delivered: 0,
    estimatedRecipients: 98,
    openRate: 0,
    status: "scheduled",
    deliveryChannel: "email",
    subject: "Book early — 10% off summer camps",
    body: "Secure your child's place before places fill up.",
    respectUnsubscribe: true,
  },
];

const RECIPIENT_BASE: Record<CampaignAudienceType, number> = {
  all_parents: 284,
  by_activity: 42,
  by_venue: 67,
  by_age_group: 54,
  promo_code: 156,
  holiday_camp: 98,
};

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function createCampaignId(): string {
  return `club_camp_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

export function createDefaultDraft(
  audienceType: CampaignAudienceType,
): CampaignBuilderDraft {
  const typeMeta = CAMPAIGN_TYPE_DEFINITIONS.find(
    (entry) => entry.id === audienceType,
  );

  return {
    audienceType,
    name: typeMeta?.title ?? "New campaign",
    selectedActivities: [],
    selectedVenues: [],
    selectedAgeGroups: [],
    deliveryChannel: "email",
    subject: "",
    body: "",
    respectUnsubscribe: true,
    sendMode: "now",
    scheduledAt: "",
  };
}

export function estimateRecipientCount(
  draft: Pick<
    CampaignBuilderDraft,
    | "audienceType"
    | "selectedActivities"
    | "selectedVenues"
    | "selectedAgeGroups"
    | "respectUnsubscribe"
  >,
): number {
  let base = RECIPIENT_BASE[draft.audienceType];

  if (draft.audienceType === "by_activity") {
    base = Math.max(
      12,
      draft.selectedActivities.length * 18 +
        (draft.selectedActivities.length > 0 ? 8 : 0),
    );
  }

  if (draft.audienceType === "by_venue") {
    base = Math.max(
      10,
      draft.selectedVenues.length * 22 +
        (draft.selectedVenues.length > 0 ? 5 : 0),
    );
  }

  if (draft.audienceType === "by_age_group") {
    base = Math.max(
      8,
      draft.selectedAgeGroups.length * 14 +
        (draft.selectedAgeGroups.length > 0 ? 6 : 0),
    );
  }

  if (draft.respectUnsubscribe) {
    base = Math.max(1, Math.round(base * 0.94));
  }

  return base;
}

export function buildAudienceLabel(draft: CampaignBuilderDraft): string {
  switch (draft.audienceType) {
    case "all_parents":
      return CAMPAIGN_AUDIENCE_LABELS.all_parents;
    case "by_activity":
      return draft.selectedActivities.length > 0
        ? draft.selectedActivities.join(", ")
        : "Selected activities";
    case "by_venue":
      return draft.selectedVenues.length > 0
        ? draft.selectedVenues.join(", ")
        : "Selected venues";
    case "by_age_group":
      return draft.selectedAgeGroups.length > 0
        ? draft.selectedAgeGroups.join(", ")
        : "Selected age groups";
    case "promo_code":
      return "Parents eligible for promotional offers";
    case "holiday_camp":
      return "Families with past camp or multi-day bookings";
    default:
      return CAMPAIGN_AUDIENCE_LABELS[draft.audienceType];
  }
}

export function getClubCampaigns(): ClubCampaign[] {
  if (!isBrowser()) {
    return [...DEFAULT_CLUB_CAMPAIGNS];
  }

  try {
    const raw = localStorage.getItem(CLUB_CAMPAIGNS_STORAGE_KEY);
    if (!raw) {
      return [...DEFAULT_CLUB_CAMPAIGNS];
    }

    const parsed = JSON.parse(raw) as ClubCampaign[];
    if (!Array.isArray(parsed) || parsed.length === 0) {
      return [...DEFAULT_CLUB_CAMPAIGNS];
    }

    return parsed;
  } catch {
    return [...DEFAULT_CLUB_CAMPAIGNS];
  }
}

export function saveClubCampaigns(campaigns: ClubCampaign[]): ClubCampaign[] {
  if (isBrowser()) {
    try {
      localStorage.setItem(
        CLUB_CAMPAIGNS_STORAGE_KEY,
        JSON.stringify(campaigns),
      );
    } catch {
      // ignore storage errors in stub
    }
  }

  return campaigns;
}

export function addClubCampaign(
  draft: CampaignBuilderDraft,
): ClubCampaign {
  const estimatedRecipients = estimateRecipientCount(draft);
  const audience = buildAudienceLabel(draft);
  const now = new Date().toISOString();

  const campaign: ClubCampaign = {
    id: createCampaignId(),
    name: draft.name.trim() || "Untitled campaign",
    audienceType: draft.audienceType,
    audience,
    sentAt: draft.sendMode === "now" ? now : null,
    scheduledAt:
      draft.sendMode === "schedule" && draft.scheduledAt
        ? new Date(`${draft.scheduledAt}T09:00:00`).toISOString()
        : null,
    delivered: draft.sendMode === "now" ? estimatedRecipients : 0,
    estimatedRecipients,
    openRate: 0,
    status: draft.sendMode === "now" ? "sent" : "scheduled",
    deliveryChannel: draft.deliveryChannel,
    subject: draft.subject.trim(),
    body: draft.body.trim(),
    respectUnsubscribe: draft.respectUnsubscribe,
  };

  const campaigns = [campaign, ...getClubCampaigns()];
  saveClubCampaigns(campaigns);
  return campaign;
}

export function removeClubCampaign(id: string): ClubCampaign[] {
  const campaigns = getClubCampaigns().filter((entry) => entry.id !== id);
  saveClubCampaigns(campaigns);
  return campaigns;
}

export function formatCampaignDate(value: string | null): string {
  if (!value) {
    return "—";
  }

  return new Date(value).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function getCharacterLimit(channel: CampaignDeliveryChannel): number {
  if (channel === "sms") {
    return 160;
  }

  if (channel === "whatsapp") {
    return 1024;
  }

  return 5000;
}
