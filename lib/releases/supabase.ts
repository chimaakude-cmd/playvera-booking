import type { CreateReleaseInput, Release, UpdateReleaseInput } from "./types";

/**
 * Supabase persistence stub for platform release notes.
 * Wire to `platform_releases` when moving off localStorage / `.data/releases.json`.
 */
export type ReleasesRepository = {
  list(): Promise<Release[]>;
  getById(id: string): Promise<Release | null>;
  create(input: CreateReleaseInput): Promise<Release>;
  update(id: string, input: UpdateReleaseInput): Promise<Release | null>;
  delete(id: string): Promise<boolean>;
};

export function createSupabaseReleasesRepository(): ReleasesRepository {
  return {
    async list() {
      throw new Error("Supabase releases repository is not configured yet.");
    },
    async getById() {
      throw new Error("Supabase releases repository is not configured yet.");
    },
    async create() {
      throw new Error("Supabase releases repository is not configured yet.");
    },
    async update() {
      throw new Error("Supabase releases repository is not configured yet.");
    },
    async delete() {
      throw new Error("Supabase releases repository is not configured yet.");
    },
  };
}
