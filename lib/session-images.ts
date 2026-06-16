import { imageStorage } from "@/lib/image-storage";
import { ClubSession } from "@/lib/sessions";

function normalizeExtraImages(extraImages: unknown): string[] {
  if (!Array.isArray(extraImages)) {
    return [];
  }

  return extraImages.filter(
    (image): image is string =>
      typeof image === "string" && image.length > 0,
  );
}

export function getSessionImages(session: ClubSession) {
  const images = session.details?.images;

  return {
    mainImageId: images?.mainImage ?? null,
    galleryImageIds: normalizeExtraImages(images?.extraImages),
  };
}

export function getSessionMainImageUrl(session: ClubSession): string | null {
  const { mainImageId } = getSessionImages(session);
  return imageStorage.getPreviewUrl(mainImageId);
}

export function getSessionGalleryImageUrls(session: ClubSession): string[] {
  const { galleryImageIds } = getSessionImages(session);
  return galleryImageIds
    .map((id) => imageStorage.getPreviewUrl(id))
    .filter((url): url is string => Boolean(url));
}

export function resolveImagePreviewUrl(
  imageId: string | null | undefined,
): string | null {
  return imageStorage.getPreviewUrl(imageId);
}

export function hasStoredImage(imageRef: string | null | undefined): boolean {
  if (!imageRef) {
    return false;
  }

  if (
    imageRef.startsWith("data:image/") ||
    imageRef.startsWith("http://") ||
    imageRef.startsWith("https://")
  ) {
    return true;
  }

  return imageStorage.has(imageRef);
}
