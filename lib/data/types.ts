import type { Booking, BookingStatus, NewBooking } from "@/lib/bookings";
import type { ChildInput, ChildProfile } from "@/lib/children";
import type { FeeSettings } from "@/lib/fee-settings";
import type { ParentProfile } from "@/lib/parent-profile";
import type {
  ClubSession,
  SessionInput,
} from "@/lib/sessions";

export type DataSource = "supabase" | "localStorage";

export type SessionsQueryOptions = {
  publishedOnly?: boolean;
};

export type SessionsResult<T> = {
  data: T;
  source: DataSource;
  error?: string;
};

/**
 * Repository interfaces for Activora domain data.
 *
 * Sessions are async because Supabase I/O is promise-based.
 * Other repositories remain sync until they are migrated.
 */
export type SessionsRepository = {
  getAll(options?: SessionsQueryOptions): Promise<ClubSession[]>;
  getById(id: string): Promise<ClubSession | undefined>;
  save(
    session: Omit<ClubSession, "id" | "bookings" | "createdAt">,
  ): Promise<ClubSession>;
  update(id: string, updates: SessionInput): Promise<ClubSession | null>;
  delete(id: string): Promise<boolean>;
  incrementBookings(sessionId: string): Promise<void>;
};

export type BookingsRepository = {
  getAll(): Booking[];
  save(booking: NewBooking): Booking;
  updateStatus(bookingId: string, status: BookingStatus): void;
};

export type ChildrenRepository = {
  getAll(): ChildProfile[];
  save(input: ChildInput): ChildProfile;
  update(id: string, input: ChildInput): ChildProfile | null;
  markMedicalReviewed(id: string): void;
};

export type ParentProfileRepository = {
  get(): ParentProfile;
  save(profile: ParentProfile): void;
};

export type FeeSettingsRepository = {
  get(): FeeSettings;
  save(settings: FeeSettings): void;
};

export type ActivoraDataLayer = {
  provider: import("./config").DataProviderName;
  sessions: SessionsRepository;
  bookings: BookingsRepository;
  children: ChildrenRepository;
  parentProfile: ParentProfileRepository;
  feeSettings: FeeSettingsRepository;
};
