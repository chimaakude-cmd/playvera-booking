import sharp from "sharp";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const brandingDir = path.join(root, "public", "branding");
const publicDir = path.join(root, "public");
const iconsDir = path.join(publicDir, "icons");

const sourceLogo = path.join(brandingDir, "activora-logo.png");

/** Left squircle mark (square crop aligned to icon). */
const MARK_SIZE = 506;
/** Full logo without tagline row. */
const COMPACT_HEIGHT = 370;

async function generate() {
  await mkdir(iconsDir, { recursive: true });

  const mark = sharp(sourceLogo).extract({
    left: 0,
    top: 0,
    width: MARK_SIZE,
    height: MARK_SIZE,
  });

  await mark.clone().png().toFile(path.join(brandingDir, "activora-mark.png"));

  await sharp(sourceLogo)
    .extract({ left: 0, top: 0, width: 1024, height: COMPACT_HEIGHT })
    .png()
    .toFile(path.join(brandingDir, "activora-logo-compact.png"));

  const favicon32 = mark.clone().resize(32, 32);
  await favicon32.clone().png().toFile(path.join(publicDir, "favicon-32.png"));
  await favicon32
    .clone()
    .resize(16, 16)
    .toFile(path.join(publicDir, "favicon.ico"));

  await mark
    .clone()
    .resize(180, 180)
    .png()
    .toFile(path.join(publicDir, "apple-touch-icon.png"));

  await mark
    .clone()
    .resize(192, 192)
    .png()
    .toFile(path.join(iconsDir, "icon-192.png"));

  await mark
    .clone()
    .resize(512, 512)
    .png()
    .toFile(path.join(iconsDir, "icon-512.png"));

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
        theme_color: "#2563EB",
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
}

generate().catch((error) => {
  console.error(error);
  process.exit(1);
});
