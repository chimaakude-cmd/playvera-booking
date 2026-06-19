import type { AttendeeCriteria } from "@/lib/attendee-criteria";
import type { Json } from "@/lib/database.types";
import type { SessionVenue } from "@/lib/session-location";
import { buildSessionLocationLabel } from "@/lib/session-location";
import type {
  BookingStructureType,
  ClubSession,
  ConfirmationEmailSettings,
  SessionDateSlot,
  SessionImages,
  SessionSchedule,
  SessionTicket,
  TicketPriceType,
} from "@/lib/sessions";

type SessionRow = {
  id: string;
  provider_id: string;
  session_title: string;
  description: string;
  activity_type: string;
  location: string;
  age_range: string;
  booking_type: BookingStructureType;
  attendee_criteria: Json;
  schedule_config: Json;
  images: Json;
  parents_bring: string;
  club_provides: string;
  confirmation_email: Json;
  default_capacity: number;
  day: string;
  start_time: string;
  end_time: string;
  price: number;
  capacity: number;
  platform_fee_percent: number;
  bookings_count: number;
  published: boolean;
  venue_name: string;
  address_line_1: string;
  address_line_2: string;
  town_city: string;
  postcode: string;
  location_notes: string;
  latitude: number | null;
  longitude: number | null;
  provider_venue_id: string | null;
  created_at: string;
  updated_at: string;
};

type SessionDateRow = {
  id: string;
  session_id: string;
  session_date: string;
  start_time: string;
  end_time: string;
  capacity: number;
  cancelled: boolean;
  bookings_count: number;
};

type TicketRow = {
  id: string;
  session_id: string;
  name: string;
  description: string;
  ticket_type: DbTicketType;
  price: number;
  low_spaces_trigger: boolean;
  recent_booking_flag: boolean;
  sort_order: number;
};

type DbTicketType =
  | "free"
  | "per_session"
  | "block_price"
  | "free_trial"
  | "subscription_placeholder";

const DOMAIN_TO_DB_TICKET_TYPE: Record<TicketPriceType, DbTicketType> = {
  free: "free",
  per_session: "per_session",
  term_block: "block_price",
  free_trial: "free_trial",
  subscription: "subscription_placeholder",
};

const DB_TO_DOMAIN_TICKET_TYPE: Record<DbTicketType, TicketPriceType> = {
  free: "free",
  per_session: "per_session",
  block_price: "term_block",
  free_trial: "free_trial",
  subscription_placeholder: "subscription",
};

export function toDbTime(time: string): string {
  if (/^\d{2}:\d{2}$/.test(time)) {
    return `${time}:00`;
  }

  return time;
}

export function fromDbTime(time: string): string {
  return time.slice(0, 5);
}

function parseImages(value: Json): SessionImages {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return { mainImage: null, extraImages: [] };
  }

  const record = value as Record<string, unknown>;
  const extraImages = Array.isArray(record.extraImages)
    ? record.extraImages.filter(
        (image): image is string => typeof image === "string",
      )
    : [];

  return {
    mainImage:
      typeof record.mainImage === "string" ? record.mainImage : null,
    extraImages,
  };
}

function parseScheduleConfig(value: Json, dates: SessionDateSlot[]): SessionSchedule {
  const defaults: SessionSchedule = {
    mode: "single_dates",
    calendarView: "month",
    dates,
    offDays: [],
    exceptionDates: [],
    defaultStartTime: "15:30",
    defaultEndTime: "16:30",
    repeatFrequency: "weekly",
    repeatStartDate: "",
    repeatEndDate: "",
    repeatDayOfWeek: "monday",
    blockStartDate: "",
    blockEndDate: "",
    blockDayOfWeek: "monday",
  };

  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return defaults;
  }

  return {
    ...defaults,
    ...(value as Partial<Omit<SessionSchedule, "dates">>),
    dates,
  };
}

function parseConfirmationEmail(value: Json): ConfirmationEmailSettings {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {
      confirmationImage: null,
      welcomeMessage: "",
      extraInformation: "",
    };
  }

  const record = value as Record<string, unknown>;

  const confirmationImage =
    typeof record.confirmationImage === "string"
      ? record.confirmationImage
      : typeof record.imagePlaceholder === "string"
        ? record.imagePlaceholder
        : null;

  return {
    confirmationImage,
    welcomeMessage:
      typeof record.welcomeMessage === "string" ? record.welcomeMessage : "",
    extraInformation:
      typeof record.extraInformation === "string"
        ? record.extraInformation
        : "",
    clubContactDetails:
      typeof record.clubContactDetails === "string"
        ? record.clubContactDetails
        : undefined,
    replyToEmail:
      typeof record.replyToEmail === "string" ? record.replyToEmail : undefined,
  };
}

function toScheduleConfig(schedule?: SessionSchedule): Json {
  if (!schedule) {
    return {};
  }

  const { dates: _dates, ...config } = schedule;
  return config as Json;
}

export function mapSessionDateRow(row: SessionDateRow): SessionDateSlot {
  return {
    id: row.id,
    date: row.session_date,
    startTime: fromDbTime(row.start_time),
    endTime: fromDbTime(row.end_time),
    capacity: row.capacity,
    cancelled: row.cancelled,
  };
}

export function mapTicketRow(row: TicketRow): SessionTicket {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    priceType: DB_TO_DOMAIN_TICKET_TYPE[row.ticket_type],
    price: Number(row.price),
    lowSpacesTrigger: row.low_spaces_trigger,
    recentBookingFlag: row.recent_booking_flag,
  };
}

function parseVenue(row: SessionRow): SessionVenue | undefined {
  const hasVenueFields =
    row.venue_name ||
    row.address_line_1 ||
    row.town_city ||
    row.postcode;

  if (hasVenueFields) {
    return {
      venueName: row.venue_name,
      addressLine1: row.address_line_1,
      addressLine2: row.address_line_2 || undefined,
      townCity: row.town_city,
      postcode: row.postcode,
      locationNotes: row.location_notes || undefined,
      latitude: row.latitude === null ? null : Number(row.latitude),
      longitude: row.longitude === null ? null : Number(row.longitude),
    };
  }

  if (row.location) {
    const postcodeMatch = row.location.match(
      /\b([A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2})\b/i,
    );

    if (postcodeMatch?.[1]) {
      const parts = row.location.split(",").map((part) => part.trim());

      return {
        venueName: parts[0] || row.session_title,
        addressLine1: parts[1] || "",
        townCity: parts.length > 2 ? parts[parts.length - 2] : "",
        postcode: postcodeMatch[1].replace(/\s+/g, " ").trim().toUpperCase(),
        latitude: row.latitude === null ? null : Number(row.latitude),
        longitude: row.longitude === null ? null : Number(row.longitude),
      };
    }
  }

  return undefined;
}

export function mapSessionRowsToClubSession(
  row: SessionRow,
  dateRows: SessionDateRow[],
  ticketRows: TicketRow[],
): ClubSession {
  const dates = dateRows.map(mapSessionDateRow);
  const tickets = ticketRows
    .sort((left, right) => left.sort_order - right.sort_order)
    .map(mapTicketRow);
  const images = parseImages(row.images);
  const capacities = dates.filter((date) => !date.cancelled).map((date) => date.capacity);
  const venue = parseVenue(row);

  return {
    id: row.id,
    sessionTitle: row.session_title,
    description: row.description,
    activityType: row.activity_type,
    location: venue ? buildSessionLocationLabel(venue) : row.location,
    venue,
    ageRange: row.age_range,
    day: row.day,
    startTime: fromDbTime(row.start_time),
    endTime: fromDbTime(row.end_time),
    price: Number(row.price),
    capacity: row.capacity,
    providerStripeAccountId: "",
    platformFeePercent: Number(row.platform_fee_percent),
    bookings: row.bookings_count,
    createdAt: row.created_at,
    bookingStructure: row.booking_type,
    published: row.published,
    defaultCapacity: row.default_capacity,
    tickets,
    confirmationEmail: parseConfirmationEmail(row.confirmation_email),
    schedule: parseScheduleConfig(row.schedule_config, dates),
    details: {
      description: row.description,
      ageGroup: row.age_range,
      attendeeCriteria:
        row.attendee_criteria &&
        typeof row.attendee_criteria === "object" &&
        !Array.isArray(row.attendee_criteria)
          ? (row.attendee_criteria as AttendeeCriteria)
          : undefined,
      images,
      parentsBring: row.parents_bring,
      clubProvides: row.club_provides,
    },
    minSessionCapacity: capacities.length ? Math.min(...capacities) : row.capacity,
    maxSessionCapacity: capacities.length ? Math.max(...capacities) : row.capacity,
    providerVenueId: row.provider_venue_id,
  };
}

export function mapClubSessionToSessionInsert(
  session: Omit<ClubSession, "id" | "bookings" | "createdAt">,
  providerId: string,
  sessionId: string,
) {
  const images = session.details?.images ?? {
    mainImage: null,
    extraImages: [],
  };
  const venue = session.venue;

  return {
    id: sessionId,
    provider_id: providerId,
    session_title: session.sessionTitle,
    description: session.description ?? session.details?.description ?? "",
    activity_type: session.activityType,
    location: venue
      ? buildSessionLocationLabel(venue)
      : session.location,
    venue_name: venue?.venueName ?? "",
    address_line_1: venue?.addressLine1 ?? "",
    address_line_2: venue?.addressLine2 ?? "",
    town_city: venue?.townCity ?? "",
    postcode: venue?.postcode ?? "",
    location_notes: venue?.locationNotes ?? "",
    latitude: venue?.latitude ?? null,
    longitude: venue?.longitude ?? null,
    provider_venue_id: session.providerVenueId ?? null,
    age_range: session.ageRange || session.details?.ageGroup || "",
    booking_type: session.bookingStructure ?? "individual",
    attendee_criteria: (session.details?.attendeeCriteria ?? {}) as Json,
    schedule_config: toScheduleConfig(session.schedule),
    images: images as Json,
    parents_bring: session.details?.parentsBring ?? "",
    club_provides: session.details?.clubProvides ?? "",
    confirmation_email: (session.confirmationEmail ?? {}) as Json,
    default_capacity: session.defaultCapacity ?? session.capacity,
    day: session.day,
    start_time: toDbTime(session.startTime),
    end_time: toDbTime(session.endTime),
    price: session.price,
    capacity: session.capacity,
    platform_fee_percent: session.platformFeePercent,
    bookings_count: 0,
    published: session.published ?? true,
  };
}

export function mapClubSessionDatesToInsert(
  sessionId: string,
  dates: SessionDateSlot[],
) {
  return dates.map((date) => ({
    id: date.id,
    session_id: sessionId,
    session_date: date.date,
    start_time: toDbTime(date.startTime),
    end_time: toDbTime(date.endTime),
    capacity: date.capacity,
    cancelled: date.cancelled ?? false,
    bookings_count: 0,
  }));
}

export function mapClubSessionTicketsToInsert(
  sessionId: string,
  tickets: SessionTicket[] | undefined,
) {
  return (tickets ?? []).map((ticket, index) => ({
    id: ticket.id,
    session_id: sessionId,
    name: ticket.name,
    description: ticket.description,
    ticket_type: DOMAIN_TO_DB_TICKET_TYPE[ticket.priceType],
    price: ticket.price,
    low_spaces_trigger: ticket.lowSpacesTrigger,
    recent_booking_flag: ticket.recentBookingFlag,
    sort_order: index,
  }));
}

export type { SessionRow, SessionDateRow, TicketRow };
