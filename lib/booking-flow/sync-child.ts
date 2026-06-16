import {
  calculateAge,
  type ChildInput,
  type ChildProfile,
  updateChild,
} from "@/lib/children";
import type { BookingDetailsForm } from "./types";

export function childProfileToDetails(
  child: ChildProfile,
  parentName: string,
  email: string,
): BookingDetailsForm {
  return {
    parentName,
    email,
    childId: child.id,
    childName: child.fullName,
    childAge: String(calculateAge(child.dateOfBirth)),
    childDateOfBirth: child.dateOfBirth,
    medicalConditions: child.medicalConditions,
    allergies: child.allergies,
    medicationRequired: "",
    emergencyContactName: child.emergencyContactName,
    emergencyContactPhone: child.emergencyContactPhone,
    photoConsentSession: "",
    photoConsentMarketing: "",
    authorizedCollectionPerson: "",
  };
}

export function syncDetailsToChildProfile(
  childId: string,
  details: BookingDetailsForm,
): ChildProfile | null {
  const input: ChildInput = {
    fullName: details.childName.trim(),
    dateOfBirth:
      details.childDateOfBirth?.trim() ||
      approximateDobFromAge(details.childAge),
    medicalConditions: details.medicalConditions.trim(),
    senNeeds: "",
    allergies: details.allergies.trim(),
    emergencyContactName: details.emergencyContactName.trim(),
    emergencyContactPhone: details.emergencyContactPhone.trim(),
  };

  return updateChild(childId, input);
}

function approximateDobFromAge(ageStr: string): string {
  const age = Number(ageStr);
  if (!Number.isFinite(age) || age < 0) {
    return "";
  }
  const today = new Date();
  const year = today.getFullYear() - Math.floor(age);
  return `${year}-01-01`;
}
