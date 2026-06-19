import sharp from "sharp";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const brandingDir = path.join(root, "public", "branding");
const publicDir = path.join(root, "public");
const iconsDir = path.join(publicDir, "icons");

const sourceWordmark = path.join(brandingDir, "activora-logo.png");
const sourceHero = path.join(brandingDir, "activora-hero.png");

/** Icon row share of trimmed wordmark height (star + speech bubble). */
const MARK_HEIGHT_RATIO = 0.58;

async function squareMarkFromTrimmed(trimmedBuffer, meta) {
  const iconHeight = Math.max(1, Math.round(meta.height * MARK_HEIGHT_RATIO));
  const icon = await sharp(trimmedBuffer)
    .extract({ left: 0, top: 0, width: meta.width, height: iconHeight })
    .trim()
    .toBuffer({ resolveWithObject: true });

  const side = Math.max(icon.info.width, icon.info.height);
  return sharp(icon.data)
    .resize(side, side, {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer();
}

async function generate() {
  await mkdir(iconsDir, { recursive: true });

  const trimmed = await sharp(sourceWordmark).trim().toBuffer();
  const trimmedMeta = await sharp(trimmed).metadata();

  await sharp(trimmed)
    .png()
    .toFile(path.join(brandingDir, "activora-logo-compact.png"));

  const markSquare = await squareMarkFromTrimmed(trimmed, trimmedMeta);
  await sharp(markSquare)
    .png()
    .toFile(path.join(brandingDir, "activora-mark.png"));

  const favicon32 = sharp(markSquare).resize(32, 32);
  await favicon32.clone().png().toFile(path.join(publicDir, "favicon-32.png"));
  await favicon32
    .clone()
    .resize(16, 16)
    .toFile(path.join(publicDir, "favicon.ico"));

  await sharp(markSquare)
    .resize(180, 180)
    .png()
    .toFile(path.join(publicDir, "apple-touch-icon.png"));

  await sharp(markSquare)
    .resize(192, 192)
    .png()
    .toFile(path.join(iconsDir, "icon-192.png"));

  await sharp(markSquare)
    .resize(512, 512)
    .png()
    .toFile(path.join(iconsDir, "icon-512.png"));

  await sharp(sourceHero)
    .resize(1200, 630, {
      fit: "contain",
      background: { r: 15, g: 23, b: 42, alpha: 1 },
    })
    .png()
    .toFile(path.join(publicDir, "og-image.png"));

  await writeFile(
    path.join(publicDir, "site.webmanifest"),
    JSON.stringify(
      {
        name: "Activora",
        short_name: "Activora",
        description: "Every child. Every activity. Every day.",
        start_url: "/",
        display: "standalone",
        background_color: "#ffffff",
        theme_color: "#F87128",
        icons: [
          {
            src: "/icons/icon-192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "/icons/icon-512.png",
            sizes: "512x512",
            type: "image/png",
          },
        ],
      },
      null,
      2,
    ),
  );

  console.log("Brand assets generated.");
  console.log(
    `Wordmark: ${trimmedMeta.width}x${trimmedMeta.height} (compact/mark derived)`,
  );
}

generate().catch((error) => {
  console.error(error);
  process.exit(1);
});
