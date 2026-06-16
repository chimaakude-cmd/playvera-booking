"use client";

import { useEffect, useRef, useState } from "react";
import { getQrDataUrl } from "@/lib/club-share/qr";
import { getShortDisplayUrl } from "@/lib/club-share/url";

type ShareInstagramImageProps = {
  clubName: string;
  link: string;
  logoUrl?: string | null;
  primaryColor?: string;
  secondaryColor?: string;
  onGenerated?: (dataUrl: string) => void;
};

export async function generateInstagramShareImage(options: {
  clubName: string;
  link: string;
  logoUrl?: string | null;
  primaryColor?: string;
  secondaryColor?: string;
}): Promise<string> {
  const {
    clubName,
    link,
    logoUrl,
    primaryColor = "#0d9488",
    secondaryColor = "#14b8a6",
  } = options;

  const canvas = document.createElement("canvas");
  const size = 1080;
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return "";
  }

  const gradient = ctx.createLinearGradient(0, 0, size, size);
  gradient.addColorStop(0, primaryColor);
  gradient.addColorStop(1, secondaryColor);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  ctx.fillStyle = "rgba(255,255,255,0.95)";
  ctx.beginPath();
  ctx.roundRect(80, 80, size - 160, size - 160, 48);
  ctx.fill();

  ctx.fillStyle = "#18181b";
  ctx.font = "bold 56px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(clubName, size / 2, 220, size - 240);

  ctx.fillStyle = "#52525b";
  ctx.font = "32px system-ui, sans-serif";
  ctx.fillText("Join our activities", size / 2, 290, size - 240);

  if (logoUrl) {
    try {
      const logo = await loadImage(logoUrl);
      const logoSize = 160;
      ctx.save();
      ctx.beginPath();
      ctx.roundRect(size / 2 - logoSize / 2, 330, logoSize, logoSize, 24);
      ctx.clip();
      ctx.drawImage(logo, size / 2 - logoSize / 2, 330, logoSize, logoSize);
      ctx.restore();
    } catch {
      // skip logo
    }
  }

  const qrUrl = await getQrDataUrl(link, null);
  const qr = await loadImage(qrUrl);
  const qrSize = 320;
  ctx.drawImage(qr, size / 2 - qrSize / 2, 520, qrSize, qrSize);

  ctx.fillStyle = "#71717a";
  ctx.font = "28px system-ui, sans-serif";
  ctx.fillText(getShortDisplayUrl(link), size / 2, 920, size - 200);

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

export function ShareInstagramImage({
  clubName,
  link,
  logoUrl,
  primaryColor,
  secondaryColor,
  onGenerated,
}: ShareInstagramImageProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function render() {
      setLoading(true);
      const url = await generateInstagramShareImage({
        clubName,
        link,
        logoUrl,
        primaryColor,
        secondaryColor,
      });
      if (cancelled) {
        return;
      }
      setDataUrl(url);
      onGenerated?.(url);
      setLoading(false);

      const canvas = canvasRef.current;
      if (canvas && url) {
        const ctx = canvas.getContext("2d");
        const img = await loadImage(url);
        canvas.width = 400;
        canvas.height = 400;
        ctx?.drawImage(img, 0, 0, 400, 400);
      }
    }

    void render();
    return () => {
      cancelled = true;
    };
  }, [clubName, link, logoUrl, primaryColor, secondaryColor, onGenerated]);

  function handleDownload() {
    if (!dataUrl) {
      return;
    }
    const anchor = document.createElement("a");
    anchor.href = dataUrl;
    anchor.download = `${clubName.replace(/\s+/g, "-").toLowerCase()}-instagram.png`;
    anchor.click();
  }

  return (
    <div className="space-y-3">
      <div className="mx-auto aspect-square w-full max-w-[200px] overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-50">
        {loading ? (
          <div className="flex h-full items-center justify-center text-xs text-zinc-400">
            Generating…
          </div>
        ) : (
          <canvas ref={canvasRef} className="h-full w-full" />
        )}
      </div>
      <button
        type="button"
        onClick={handleDownload}
        disabled={!dataUrl}
        className="w-full rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-50"
      >
        Download share image
      </button>
    </div>
  );
}

export function downloadInstagramShareImage(dataUrl: string, clubName: string): void {
  const anchor = document.createElement("a");
  anchor.href = dataUrl;
  anchor.download = `${clubName.replace(/\s+/g, "-").toLowerCase()}-instagram.png`;
  anchor.click();
}
