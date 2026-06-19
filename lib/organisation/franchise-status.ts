import type { ActivoraSupabaseClient } from "@/lib/supabase";

export type ProviderFranchiseFields = {
  parent_provider_id: string | null;
  organisation_type: string;
  managed_by_franchisor: boolean;
};

export type ClubFranchiseStatus = {
  isManaged: boolean;
  franchisorId: string | null;
  franchisorName: string | null;
  organisationType: string;
};

export const INDEPENDENT_CLUB_ORGANISATION_FIELDS = {
  organisation_type: "club" as const,
  parent_provider_id: null,
  managed_by_franchisor: false,
};

/** True only when the provider has an explicit, valid franchisor relationship. */
export function isManagedFranchiseeProvider(
  fields: ProviderFranchiseFields,
  parentExists = true,
): boolean {
  if (!fields.managed_by_franchisor) {
    return false;
  }

  if (!fields.parent_provider_id) {
    return false;
  }

  if (!parentExists) {
    return false;
  }

  return true;
}

export async function fetchClubFranchiseStatus(
  supabase: ActivoraSupabaseClient,
  providerId: string,
): Promise<ClubFranchiseStatus> {
  const independent: ClubFranchiseStatus = {
    isManaged: false,
    franchisorId: null,
    franchisorName: null,
    organisationType: "club",
  };

  if (!providerId.trim()) {
    return independent;
  }

  const { data: provider, error } = await supabase
    .from("providers")
    .select("parent_provider_id, organisation_type, managed_by_franchisor")
    .eq("id", providerId)
    .maybeSingle();

  if (error || !provider) {
    return independent;
  }

  const fields: ProviderFranchiseFields = {
    parent_provider_id: provider.parent_provider_id,
    organisation_type: provider.organisation_type,
    managed_by_franchisor: provider.managed_by_franchisor ?? false,
  };

  if (!fields.parent_provider_id) {
    return {
      ...independent,
      organisationType: fields.organisation_type,
    };
  }

  const { data: parent } = await supabase
    .from("providers")
    .select("id, name")
    .eq("id", fields.parent_provider_id)
    .maybeSingle();

  const isManaged = isManagedFranchiseeProvider(fields, Boolean(parent?.id));

  return {
    isManaged,
    franchisorId: isManaged ? (parent?.id ?? null) : null,
    franchisorName: isManaged ? (parent?.name ?? null) : null,
    organisationType: fields.organisation_type,
  };
}

export async function fetchClubFranchiseStatusFromApi(
  providerId?: string,
): Promise<ClubFranchiseStatus> {
  const independent: ClubFranchiseStatus = {
    isManaged: false,
    franchisorId: null,
    franchisorName: null,
    organisationType: "club",
  };

  try {
    const query = providerId?.trim()
      ? `?providerId=${encodeURIComponent(providerId.trim())}`
      : "";
    const response = await fetch(`/api/club/franchise-status${query}`, {
      method: "GET",
      credentials: "include",
    });

    if (!response.ok) {
      return independent;
    }

    const payload = (await response.json()) as ClubFranchiseStatus;
    return {
      isManaged: Boolean(payload.isManaged),
      franchisorId: payload.franchisorId ?? null,
      franchisorName: payload.franchisorName ?? null,
      organisationType: payload.organisationType ?? "club",
    };
  } catch {
    return independent;
  }
}
