export type BookingAccessMode = "login" | "signup" | "guest" | "logged_in";

export type BookingDetailsForm = {
  parentName: string;
  email: string;
  childId?: string;
  childName: string;
  childAge: string;
  childDateOfBirth?: string;
  medicalConditions: string;
  allergies: string;
  medicationRequired: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  photoConsentSession: string;
  photoConsentMarketing: string;
  authorizedCollectionPerson: string;
};

export type BookingFlowStep = 1 | 2 | 3 | 4;

export type BookingFlowDraft = {
  sessionId: string;
  accessMode: BookingAccessMode;
  details: BookingDetailsForm;
  questionValues: Record<string, string | boolean>;
  currentStep: BookingFlowStep;
};

export const emptyBookingDetails = (): BookingDetailsForm => ({
  parentName: "",
  email: "",
  childName: "",
  childAge: "",
  medicalConditions: "",
  allergies: "",
  medicationRequired: "",
  emergencyContactName: "",
  emergencyContactPhone: "",
  photoConsentSession: "",
  photoConsentMarketing: "",
  authorizedCollectionPerson: "",
});
