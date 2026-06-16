import { getClientAppBaseUrl } from "@/lib/club-widget/embed";
import type { EmbedType } from "./types";

function embedQueryForType(type: EmbedType): string {
  switch (type) {
    case "mini_card":
      return "layout=compact&card=bordered&logo=1&availability=0&age=0";
    case "book_now":
      return "layout=compact&card=bordered&logo=1&availability=0&age=0&powered=0";
    case "activity_widget":
    default:
      return "";
  }
}

function embedHeightForType(type: EmbedType): number {
  switch (type) {
    case "mini_card":
      return 320;
    case "book_now":
      return 120;
    case "activity_widget":
    default:
      return 700;
  }
}

export function generateEmbedCode(
  type: EmbedType,
  providerId: string,
  baseUrl?: string,
): string {
  const origin = baseUrl ?? getClientAppBaseUrl();
  const query = embedQueryForType(type);
  const src = query
    ? `${origin}/embed/provider/${providerId}?${query}`
    : `${origin}/embed/provider/${providerId}`;
  const height = embedHeightForType(type);
  const title =
    type === "book_now"
      ? "Book now"
      : type === "mini_card"
        ? "Club mini card"
        : "Book activities";

  return `<iframe src="${src}" width="100%" height="${height}" style="border:0;border-radius:16px;" title="${title}"></iframe>`;
}

export function getEmbedPreviewUrl(
  type: EmbedType,
  providerId: string,
  baseUrl?: string,
): string {
  const origin = baseUrl ?? getClientAppBaseUrl();
  const query = embedQueryForType(type);
  return query
    ? `${origin}/embed/provider/${providerId}?${query}`
    : `${origin}/embed/provider/${providerId}`;
}
