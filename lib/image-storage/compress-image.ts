export const ACCEPTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export const ACCEPTED_IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp"];

export const MAX_IMAGE_FILE_SIZE_BYTES = 10 * 1024 * 1024;

export const IMAGE_PREVIEW_MAX_WIDTH = 1200;
export const IMAGE_PREVIEW_QUALITY = 0.82;

export function validateImageFile(file: File): string | null {
  if (!ACCEPTED_IMAGE_TYPES.includes(file.type as (typeof ACCEPTED_IMAGE_TYPES)[number])) {
    return "Use a JPG, PNG, or WebP image.";
  }

  if (file.size > MAX_IMAGE_FILE_SIZE_BYTES) {
    return "Each image must be 10MB or smaller.";
  }

  return null;
}

function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(image);
    };

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Could not read this image file."));
    };

    image.src = objectUrl;
  });
}

function canvasToDataUrl(
  canvas: HTMLCanvasElement,
  mimeType: string,
  quality: number,
): string {
  return canvas.toDataURL(mimeType, quality);
}

export async function compressImageFile(file: File): Promise<{
  previewDataUrl: string;
  mimeType: string;
}> {
  const validationError = validateImageFile(file);
  if (validationError) {
    throw new Error(validationError);
  }

  const image = await loadImageFromFile(file);
  const scale = Math.min(1, IMAGE_PREVIEW_MAX_WIDTH / image.width);
  const width = Math.max(1, Math.round(image.width * scale));
  const height = Math.max(1, Math.round(image.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Could not prepare image preview.");
  }

  context.drawImage(image, 0, 0, width, height);

  const preferredMimeType = file.type === "image/png" ? "image/png" : "image/webp";
  let previewDataUrl = canvasToDataUrl(
    canvas,
    preferredMimeType,
    IMAGE_PREVIEW_QUALITY,
  );

  let mimeType = preferredMimeType;

  if (preferredMimeType === "image/webp" && previewDataUrl.length < 12) {
    previewDataUrl = canvasToDataUrl(canvas, "image/jpeg", IMAGE_PREVIEW_QUALITY);
    mimeType = "image/jpeg";
  }

  return { previewDataUrl, mimeType };
}
