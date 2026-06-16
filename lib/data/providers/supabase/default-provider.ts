import { getSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase";
import { formatPostgrestError } from "@/lib/data/supabase-errors";

export const DEFAULT_PROVIDER_NAME = "Demo Provider";
export const DEFAULT_PROVIDER_SLUG = "demo-provider";
const DEFAULT_PROVIDER_CACHE_KEY = "activora-default-provider-id";
const LEGACY_PROVIDER_SLUG = "activora-dev-club";

export function getDefaultProviderIdFromEnv(): string | null {
  return process.env.NEXT_PUBLIC_DEFAULT_PROVIDER_ID?.trim() || null;
}

function readCachedProviderId(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  return localStorage.getItem(DEFAULT_PROVIDER_CACHE_KEY);
}

function cacheProviderId(providerId: string): void {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.setItem(DEFAULT_PROVIDER_CACHE_KEY, providerId);
}

function clearCachedProviderId(): void {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.removeItem(DEFAULT_PROVIDER_CACHE_KEY);
}

async function findProviderBySlug(slug: string) {
  const supabase = getSupabaseBrowserClient();

  return supabase
    .from("providers")
    .select("id, name, slug")
    .eq("slug", slug)
    .maybeSingle();
}

async function verifyCachedProviderId(providerId: string): Promise<boolean> {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("providers")
    .select("id")
    .eq("id", providerId)
    .maybeSingle();

  if (error) {
    console.warn("[Activora Supabase] Cached provider verification failed", error);
    return false;
  }

  return Boolean(data?.id);
}

export async function getOrCreateDefaultProviderId(): Promise<string> {
  const envProviderId = getDefaultProviderIdFromEnv();
  if (envProviderId) {
    return envProviderId;
  }

  const cachedProviderId = readCachedProviderId();
  if (cachedProviderId && (await verifyCachedProviderId(cachedProviderId))) {
    return cachedProviderId;
  }

  if (cachedProviderId) {
    clearCachedProviderId();
  }

  if (!isSupabaseConfigured()) {
    throw new Error(
      "Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local.",
    );
  }

  const supabase = getSupabaseBrowserClient();

  for (const slug of [DEFAULT_PROVIDER_SLUG, LEGACY_PROVIDER_SLUG]) {
    const { data: existingProvider, error: lookupError } =
      await findProviderBySlug(slug);

    console.log("[Activora Supabase] Provider lookup response", {
      slug,
      data: existingProvider,
      error: lookupError,
    });

    if (lookupError) {
      const message = lookupError.message.toLowerCase();

      if (message.includes("permission denied")) {
        throw new Error(
          formatPostgrestError(
            "providers select (default provider lookup)",
            lookupError,
          ) +
            " | Fix: run supabase/migrations/00005_dev_anon_access.sql in the Supabase SQL Editor.",
        );
      }

      throw new Error(
        `Could not look up default provider: ${lookupError.message}`,
      );
    }

    if (existingProvider?.id) {
      cacheProviderId(existingProvider.id);
      return existingProvider.id;
    }
  }

  const { data: createdProvider, error: createError } = await supabase
    .from("providers")
    .insert({
      name: DEFAULT_PROVIDER_NAME,
      slug: DEFAULT_PROVIDER_SLUG,
      location: "London",
    })
    .select("id")
    .single();

  console.log("[Activora Supabase] Provider create response", {
    data: createdProvider,
    error: createError,
  });

  if (createError) {
    if (createError.message.toLowerCase().includes("permission denied")) {
      throw new Error(
        formatPostgrestError("providers insert (Demo Provider)", createError) +
          " | Fix: run supabase/migrations/00005_dev_anon_access.sql in the Supabase SQL Editor.",
      );
    }

    throw new Error(
      `Could not create default provider: ${createError.message}`,
    );
  }

  if (!createdProvider?.id) {
    throw new Error("Could not create default provider: Unknown error.");
  }

  cacheProviderId(createdProvider.id);
  return createdProvider.id;
}
