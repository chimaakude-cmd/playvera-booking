import { isSupabaseStorageConfigured } from "./supabase-provider";
import { ImageStorageProvider, ImageUploadOptions, StoredImage } from "./types";

type ResilientImageStorageProviderOptions = {
  preferSupabase: boolean;
};

/**
 * Tries Supabase Storage first when configured, then falls back to localStorage.
 */
export class ResilientImageStorageProvider implements ImageStorageProvider {
  constructor(
    private readonly supabaseProvider: ImageStorageProvider,
    private readonly localProvider: ImageStorageProvider,
    private readonly options: ResilientImageStorageProviderOptions,
  ) {}

  private shouldTrySupabase(): boolean {
    if (!this.options.preferSupabase) {
      return false;
    }

    return isSupabaseStorageConfigured();
  }

  async upload(
    file: File,
    uploadOptions?: ImageUploadOptions,
  ): Promise<StoredImage> {
    if (!this.shouldTrySupabase()) {
      if (this.options.preferSupabase && !isSupabaseStorageConfigured()) {
        const local = await this.localProvider.upload(file, uploadOptions);
        return {
          ...local,
          fallbackWarning:
            "Supabase Storage is not configured, so this image was saved locally in your browser only.",
        };
      }

      return this.localProvider.upload(file, uploadOptions);
    }

    try {
      return await this.supabaseProvider.upload(file, uploadOptions);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Supabase Storage upload failed.";
      const local = await this.localProvider.upload(file, uploadOptions);

      return {
        ...local,
        fallbackWarning: `${message} Image saved locally as a fallback.`,
      };
    }
  }

  async remove(id: string, options?: ImageUploadOptions): Promise<void> {
    if (id.startsWith("http://") || id.startsWith("https://")) {
      await this.supabaseProvider.remove(id, options);
      return;
    }

    await this.localProvider.remove(id, options);
  }

  get(id: string): StoredImage | null {
    return (
      this.supabaseProvider.get(id) ?? this.localProvider.get(id)
    );
  }

  getPreviewUrl(id: string | null | undefined): string | null {
    return (
      this.supabaseProvider.getPreviewUrl(id) ??
      this.localProvider.getPreviewUrl(id)
    );
  }

  has(id: string): boolean {
    return this.supabaseProvider.has(id) || this.localProvider.has(id);
  }
}
