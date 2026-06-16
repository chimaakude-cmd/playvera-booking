import type { OnboardingClub } from "./types";

export type DescriptionLength = "short" | "medium" | "long";

export type DescriptionContext = {
  clubName: string;
  club: OnboardingClub;
};

export const THEME_PRESET_COLOURS = {
  professional: { primary: "#0f766e", accent: "#334155", label: "Professional" },
  sports: { primary: "#16a34a", accent: "#ea580c", label: "Sports" },
  playful: { primary: "#7c3aed", accent: "#f59e0b", label: "Playful" },
  minimal: { primary: "#18181b", accent: "#71717a", label: "Minimal" },
  premium: { primary: "#1e3a5f", accent: "#c9a227", label: "Premium" },
} as const;

const TAGLINE_TEMPLATES = [
  (name: string, categories: string[]) =>
    `${name} — ${categories[0] ?? "quality sessions"} for every child`,
  (name: string, ages: string[]) =>
    `Inspiring ${ages[0] ?? "young minds"} at ${name}`,
  (_name: string, categories: string[]) =>
    `Where ${categories.slice(0, 2).join(" & ") || "fun and learning"} come together`,
  (name: string) => `${name}: safe, fun, and unforgettable experiences`,
  (name: string, categories: string[]) =>
    `Trusted ${categories[0] ?? "club"} sessions — book with confidence`,
];

export function generateTaglineSuggestions(
  clubName: string,
  primaryCategories: string[],
  ageRanges: string[],
): string[] {
  const name = clubName.trim() || "Your club";
  const categories =
    primaryCategories.length > 0 ? primaryCategories : ["after-school sessions"];

  return TAGLINE_TEMPLATES.map((template, index) => {
    const base = template(name, index % 2 === 0 ? categories : ageRanges);
    return base.length > 90 ? `${base.slice(0, 87)}…` : base;
  });
}

export function generateDescriptions(
  length: DescriptionLength,
  context: DescriptionContext,
): string {
  const name = context.clubName.trim() || context.club.name.trim() || "Our club";
  const categories = context.club.primaryCategories;
  const activities = context.club.secondaryActivities.slice(0, 3).join(", ");
  const ages = context.club.ageRanges.join(", ");
  const categoryText = categories.slice(0, 2).join(" and ") || "sessions";

  const short = `${name} runs ${categoryText} for ages ${ages || "all ages"}. ${activities ? `Activities include ${activities}.` : ""} Book online in minutes.`;

  const medium = `${name} delivers engaging ${categoryText} designed for children aged ${ages || "4–14"}. ${activities ? `From ${activities}, every session is structured, safe, and fun.` : "Every session is structured, safe, and fun."} Parents love our clear communication and flexible booking.`;

  const long = `${name} is a trusted provider of ${categoryText} for ${ages || "children of all ages"}. ${activities ? `Our coaches specialise in ${activities}, building confidence through play and skill development.` : "Our coaches build confidence through play and skill development."} We prioritise safeguarding, inclusivity, and a welcoming environment for every family. Join hundreds of parents who book with us on Activeora.`;

  if (length === "short") {
    return short;
  }
  if (length === "medium") {
    return medium;
  }
  return long;
}

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export async function generateColoursFromLogo(
  file: File | string,
): Promise<{ primary: string; accent: string }> {
  const presets = Object.values(THEME_PRESET_COLOURS);

  if (typeof file === "string" && file.startsWith("data:")) {
    try {
      const colours = await extractColoursFromDataUrl(file);
      if (colours) {
        return colours;
      }
    } catch {
      // fall through to mock mapping
    }
  }

  const seed =
    typeof file === "string" ? hashString(file) : hashString(file.name);
  const preset = presets[seed % presets.length];
  return { primary: preset.primary, accent: preset.accent };
}

async function extractColoursFromDataUrl(
  dataUrl: string,
): Promise<{ primary: string; accent: string } | null> {
  if (typeof document === "undefined") {
    return null;
  }

  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const size = 32;
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve(null);
        return;
      }

      ctx.drawImage(img, 0, 0, size, size);
      const { data } = ctx.getImageData(0, 0, size, size);

      let r = 0;
      let g = 0;
      let b = 0;
      let count = 0;

      for (let i = 0; i < data.length; i += 4) {
        const alpha = data[i + 3];
        if (alpha < 128) {
          continue;
        }
        r += data[i];
        g += data[i + 1];
        b += data[i + 2];
        count += 1;
      }

      if (count === 0) {
        resolve(null);
        return;
      }

      const primary = rgbToHex(
        Math.round(r / count),
        Math.round(g / count),
        Math.round(b / count),
      );
      const accent = rgbToHex(
        Math.min(255, Math.round((r / count) * 1.2)),
        Math.min(255, Math.round((g / count) * 0.85)),
        Math.min(255, Math.round((b / count) * 1.1)),
      );

      resolve({ primary, accent });
    };
    img.onerror = () => resolve(null);
    img.src = dataUrl;
  });
}

function rgbToHex(r: number, g: number, b: number): string {
  return `#${[r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("")}`;
}
