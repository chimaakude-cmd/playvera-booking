import type { BookingStructureType } from "./sessions";

export type AttendeeCriteriaType = "age" | "school_year" | "key_stage";

export type AttendeeCriteria = {
  type: AttendeeCriteriaType;
  ageFrom: number;
  ageTo: number;
  schoolYearFrom: string;
  schoolYearTo: string;
  keyStageFrom: string;
  keyStageTo: string;
};

export const SCHOOL_YEARS = [
  { value: "reception", label: "Reception" },
  { value: "year-1", label: "Year 1" },
  { value: "year-2", label: "Year 2" },
  { value: "year-3", label: "Year 3" },
  { value: "year-4", label: "Year 4" },
  { value: "year-5", label: "Year 5" },
  { value: "year-6", label: "Year 6" },
  { value: "year-7", label: "Year 7" },
  { value: "year-8", label: "Year 8" },
  { value: "year-9", label: "Year 9" },
  { value: "year-10", label: "Year 10" },
  { value: "year-11", label: "Year 11" },
  { value: "year-12", label: "Year 12" },
  { value: "year-13", label: "Year 13" },
] as const;

export const KEY_STAGES = [
  { value: "eyfs", label: "EYFS" },
  { value: "ks1", label: "KS1" },
  { value: "ks2", label: "KS2" },
  { value: "ks3", label: "KS3" },
  { value: "ks4", label: "KS4" },
  { value: "ks5", label: "KS5" },
] as const;

export const AGE_OPTIONS = Array.from({ length: 19 }, (_, age) => age);

export function createDefaultAttendeeCriteria(): AttendeeCriteria {
  return {
    type: "age",
    ageFrom: 5,
    ageTo: 11,
    schoolYearFrom: "year-1",
    schoolYearTo: "year-6",
    keyStageFrom: "ks1",
    keyStageTo: "ks2",
  };
}

function getSchoolYearLabel(value: string): string {
  return SCHOOL_YEARS.find((year) => year.value === value)?.label ?? value;
}

function getKeyStageLabel(value: string): string {
  return KEY_STAGES.find((stage) => stage.value === value)?.label ?? value;
}

function isOrderValid(fromIndex: number, toIndex: number): boolean {
  return fromIndex <= toIndex;
}

export function formatAttendeePreview(criteria: AttendeeCriteria): string {
  if (criteria.type === "age") {
    return `Age ${criteria.ageFrom}–${criteria.ageTo}`;
  }

  if (criteria.type === "school_year") {
    return `${getSchoolYearLabel(criteria.schoolYearFrom)}–${getSchoolYearLabel(criteria.schoolYearTo)}`;
  }

  return `${getKeyStageLabel(criteria.keyStageFrom)}–${getKeyStageLabel(criteria.keyStageTo)}`;
}

export function validateAttendeeCriteria(criteria: AttendeeCriteria): string[] {
  const errors: string[] = [];

  if (criteria.type === "age") {
    if (criteria.ageFrom > criteria.ageTo) {
      errors.push("From age must be less than or equal to to age");
    }
  }

  if (criteria.type === "school_year") {
    const fromIndex = SCHOOL_YEARS.findIndex(
      (year) => year.value === criteria.schoolYearFrom,
    );
    const toIndex = SCHOOL_YEARS.findIndex(
      (year) => year.value === criteria.schoolYearTo,
    );
    if (!isOrderValid(fromIndex, toIndex)) {
      errors.push("School year range must be in order");
    }
  }

  if (criteria.type === "key_stage") {
    const fromIndex = KEY_STAGES.findIndex(
      (stage) => stage.value === criteria.keyStageFrom,
    );
    const toIndex = KEY_STAGES.findIndex(
      (stage) => stage.value === criteria.keyStageTo,
    );
    if (!isOrderValid(fromIndex, toIndex)) {
      errors.push("Key stage range must be in order");
    }
  }

  return errors;
}

export const bookingStructureLabels: Record<BookingStructureType, string> = {
  individual: "Individual Sessions",
  block: "Block Booking",
  subscription: "Subscription",
};

export const bookingStructureDescriptions: Record<BookingStructureType, string> =
  {
    individual: "Parents book one date only.",
    block: "Parents buy multiple scheduled dates together.",
    subscription: "Recurring payment membership model (payments coming later).",
  };
