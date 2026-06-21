import QRCode from "qrcode";
import jsQR from "jsqr";

export const QR_MIN_EXPORT_PX = 300;
export const QR_DISPLAY_PX = 512;
export const QR_QUIET_ZONE_MODULES = 4;

const QR_COLORS = {
  dark: "#000000",
  light: "#ffffff",
};

export class QrGenerationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "QrGenerationError";
  }
}

function buildQrOptions(width: number, errorCorrectionLevel: "M" | "Q" = "M") {
  return {
    width: Math.max(width, QR_MIN_EXPORT_PX),
    margin: QR_QUIET_ZONE_MODULES,
    errorCorrectionLevel,
    color: QR_COLORS,
  };
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

async function decodeQrDataUrl(dataUrl: string): Promise<string | null> {
  if (typeof document === "undefined") {
    return null;
  }

  const img = await loadImage(dataUrl);
  const canvas = document.createElement("canvas");
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return null;
  }

  ctx.drawImage(img, 0, 0);
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const result = jsQR(imageData.data, imageData.width, imageData.height);
  return result?.data ?? null;
}

function urlsMatch(decoded: string, expected: string): boolean {
  try {
    return new URL(decoded).href === new URL(expected).href;
  } catch {
    return decoded === expected;
  }
}

export async function validateQrDataUrl(
  dataUrl: string,
  expectedUrl: string,
): Promise<boolean> {
  const decoded = await decodeQrDataUrl(dataUrl);
  if (!decoded) {
    return false;
  }
  return urlsMatch(decoded, expectedUrl);
}

async function generateValidatedPng(
  url: string,
  width: number,
): Promise<string> {
  for (const level of ["M", "Q"] as const) {
    const dataUrl = await QRCode.toDataURL(url, buildQrOptions(width, level));
    const valid = await validateQrDataUrl(dataUrl, url);
    if (valid) {
      return dataUrl;
    }
  }

  throw new QrGenerationError("Generated QR code failed decode validation.");
}

export async function getQrDataUrl(url: string): Promise<string> {
  return generateValidatedPng(url, QR_DISPLAY_PX);
}

export async function getQrSvg(url: string): Promise<string> {
  await generateValidatedPng(url, QR_MIN_EXPORT_PX);
  return QRCode.toString(url, {
    type: "svg",
    ...buildQrOptions(QR_MIN_EXPORT_PX),
  });
}

export function downloadDataUrl(dataUrl: string, filename: string): void {
  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = filename;
  link.click();
}

export function downloadSvg(svg: string, filename: string): void {
  const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(objectUrl);
}

export function openPrintView(
  dataUrl: string,
  clubName: string,
  url: string,
): void {
  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    return;
  }

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>QR Code — ${clubName}</title>
        <style>
          body { font-family: system-ui, sans-serif; text-align: center; padding: 48px; }
          img { width: ${QR_MIN_EXPORT_PX}px; height: ${QR_MIN_EXPORT_PX}px; }
          h1 { font-size: 20px; margin-bottom: 8px; }
          p { color: #52525b; font-size: 14px; }
        </style>
      </head>
      <body>
        <h1>${clubName}</h1>
        <p>Scan to view our club profile</p>
        <img src="${dataUrl}" alt="QR code" />
        <p>${url}</p>
        <script>window.onload = () => window.print();</script>
      </body>
    </html>
  `);
  printWindow.document.close();
}
