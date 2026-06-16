/**
 * Parent profile persistence (localStorage).
 *
 * Storage key: activora-parent-profile
 *
 * Supabase migration:
 * - Table: public.parent_profiles
 * - Access via: dataLayer.parentProfile
 */
export type ParentProfile = {
  fullName: string;
  email: string;
  phone: string;
  emergencyContact: string;
  relationshipToChild: string;
};

export const PARENT_PROFILE_STORAGE_KEY = "activora-parent-profile";

const defaultProfile: ParentProfile = {
  fullName: "",
  email: "",
  phone: "",
  emergencyContact: "",
  relationshipToChild: "",
};

export function getParentProfile(): ParentProfile {
  if (typeof window === "undefined") {
    return defaultProfile;
  }

  try {
    const raw = localStorage.getItem(PARENT_PROFILE_STORAGE_KEY);
    if (!raw) {
      return defaultProfile;
    }

    return { ...defaultProfile, ...(JSON.parse(raw) as ParentProfile) };
  } catch {
    return defaultProfile;
  }
}

export function saveParentProfile(profile: ParentProfile): void {
  localStorage.setItem(PARENT_PROFILE_STORAGE_KEY, JSON.stringify(profile));
}

export function getParentDisplayName(): string {
  const profile = getParentProfile();
  return profile.fullName.trim() || "Parent";
}
