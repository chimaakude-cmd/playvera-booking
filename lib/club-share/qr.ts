import QRCode from "qrcode";

export async function getQrDataUrl(
  url: string,
  logoUrl?: string | null,
): Promise<string> {
  const qrDataUrl = await QRCode.toDataURL(url, {
    width: 512,
    margin: 2,
    errorCorrectionLevel: "H",
    color: { dark: "#18181b", light: "#ffffff" },
  });

  if (!logoUrl) {
    return qrDataUrl;
  }

  return overlayLogoOnQr(qrDataUrl, logoUrl);
}

async function overlayLogoOnQr(
  qrDataUrl: string,
  logoUrl: string,
): Promise<string> {
  if (typeof document === "undefined") {
    return qrDataUrl;
  }

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return qrDataUrl;
  }

  const qrImage = await loadImage(qrDataUrl);
  canvas.width = qrImage.width;
  canvas.height = qrImage.height;
  ctx.drawImage(qrImage, 0, 0);

  try {
    const logo = await loadImage(logoUrl);
    const logoSize = Math.round(canvas.width * 0.22);
    const x = (canvas.width - logoSize) / 2;
    const y = (canvas.height - logoSize) / 2;

    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.roundRect(x - 6, y - 6, logoSize + 12, logoSize + 12, 12);
    ctx.fill();

    ctx.save();
    ctx.beginPath();
    ctx.roundRect(x, y, logoSize, logoSize, 8);
    ctx.clip();
    ctx.drawImage(logo, x, y, logoSize, logoSize);
    ctx.restore();
  } catch {
    return qrDataUrl;
  }

  return canvas.toDataURL("image/png");
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

export function downloadDataUrl(dataUrl: string, filename: string): void {
  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = filename;
  link.click();
}

export function openPrintView(dataUrl: string, clubName: string, url: string): void {
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
          img { width: 280px; height: 280px; }
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
