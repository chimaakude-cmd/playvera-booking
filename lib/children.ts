/**
 * Child profile persistence (localStorage).
 *
 * Storage key: activora-children
 *
 * Supabase migration:
 * - Table: public.children
 * - Access via: dataLayer.children
 */
export type ChildProfile = {
  id: string;
  fullName: string;
  dateOfBirth: string;
  medicalConditions: string;
  senNeeds: string;
  allergies: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  medicalReviewedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export const CHILDREN_STORAGE_KEY = "activora-children";

export type ChildInput = Omit<
  ChildProfile,
  "id" | "medicalReviewedAt" | "createdAt" | "updatedAt"
>;

export function getChildren(): ChildProfile[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = localStorage.getItem(CHILDREN_STORAGE_KEY);
    if (!raw) {
      return [];
    }

    return JSON.parse(raw) as ChildProfile[];
  } catch {
    return [];
  }
}

export function saveChild(input: ChildInput): ChildProfile {
  const children = getChildren();
  const now = new Date().toISOString();
  const child: ChildProfile = {
    ...input,
    id: crypto.randomUUID(),
    medicalReviewedAt: null,
    createdAt: now,
    updatedAt: now,
  };

  children.push(child);
  localStorage.setItem(CHILDREN_STORAGE_KEY, JSON.stringify(children));

  return child;
}

export function updateChild(
  id: string,
  input: ChildInput,
): ChildProfile | null {
  const children = getChildren();
  const index = children.findIndex((child) => child.id === id);

  if (index === -1) {
    return null;
  }

  const updated: ChildProfile = {
    ...children[index],
    ...input,
    updatedAt: new Date().toISOString(),
  };

  children[index] = updated;
  localStorage.setItem(CHILDREN_STORAGE_KEY, JSON.stringify(children));

  return updated;
}

export function markChildMedicalReviewed(id: string): void {
  const children = getChildren();
  const index = children.findIndex((child) => child.id === id);

  if (index === -1) {
    return;
  }

  children[index].medicalReviewedAt = new Date().toISOString();
  children[index].updatedAt = new Date().toISOString();
  localStorage.setItem(CHILDREN_STORAGE_KEY, JSON.stringify(children));
}

export function calculateAge(dateOfBirth: string): number {
  const birth = new Date(dateOfBirth);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age -= 1;
  }

  return Math.max(0, age);
}

export function isMedicalReviewDue(child: ChildProfile): boolean {
  const hasMedicalInfo =
    child.medicalConditions.trim() ||
    child.senNeeds.trim() ||
    child.allergies.trim();

  if (!hasMedicalInfo) {
    return false;
  }

  if (!child.medicalReviewedAt) {
    return true;
  }

  const reviewed = new Date(child.medicalReviewedAt);
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  return reviewed < sixMonthsAgo;
}

export function getMedicalReviewDueCount(): number {
  return getChildren().filter(isMedicalReviewDue).length;
}
