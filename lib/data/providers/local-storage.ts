/**
 * localStorage-backed data repositories.
 */
import {
  getBookings,
  saveBooking,
  updateBookingStatus,
} from "@/lib/bookings";
import {
  getChildren,
  markChildMedicalReviewed,
  saveChild,
  updateChild,
} from "@/lib/children";
import { getFeeSettings, saveFeeSettings } from "@/lib/fee-settings";
import { getParentProfile, saveParentProfile } from "@/lib/parent-profile";
import {
  deleteSession,
  getSessionById,
  getSessions,
  incrementSessionBookings,
  saveSession,
  updateSession,
} from "@/lib/sessions";
import type {
  ActivoraDataLayer,
  BookingsRepository,
  ChildrenRepository,
  FeeSettingsRepository,
  ParentProfileRepository,
  SessionsRepository,
} from "@/lib/data/types";

const sessionsRepository: SessionsRepository = {
  getAll: async () => getSessions(),
  getById: async (id) => getSessionById(id),
  save: async (session) => saveSession(session),
  update: async (id, updates) => updateSession(id, updates),
  delete: async (id) => deleteSession(id),
  incrementBookings: async (sessionId) => {
    incrementSessionBookings(sessionId);
  },
};

const bookingsRepository: BookingsRepository = {
  getAll: getBookings,
  save: saveBooking,
  updateStatus: updateBookingStatus,
};

const childrenRepository: ChildrenRepository = {
  getAll: getChildren,
  save: saveChild,
  update: updateChild,
  markMedicalReviewed: markChildMedicalReviewed,
};

const parentProfileRepository: ParentProfileRepository = {
  get: getParentProfile,
  save: saveParentProfile,
};

const feeSettingsRepository: FeeSettingsRepository = {
  get: getFeeSettings,
  save: saveFeeSettings,
};

export const localStorageDataLayer: ActivoraDataLayer = {
  provider: "localStorage",
  sessions: sessionsRepository,
  bookings: bookingsRepository,
  children: childrenRepository,
  parentProfile: parentProfileRepository,
  feeSettings: feeSettingsRepository,
};
