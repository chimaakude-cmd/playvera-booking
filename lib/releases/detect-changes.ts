import type { ChangeArea, ReleaseChangeType } from "./types";

type AreaRule = {
  area: ChangeArea;
  patterns: RegExp[];
};

const AREA_RULES: AreaRule[] = [
  {
    area: "homepage",
    patterns: [/components\/home\//, /lib\/home\//, /app\/page\.tsx$/],
  },
  {
    area: "onboarding",
    patterns: [/onboarding/i, /ClubOnboarding/, /EnterpriseOnboarding/, /OrganisationOnboarding/],
  },
  {
    area: "login",
    patterns: [/app\/(login|auth|signup)/, /components\/auth\//, /lib\/auth\//, /locales\/.*\/auth\.json/],
  },
  {
    area: "dashboard",
    patterns: [/dashboard/, /components\/club\//, /components\/organisation\//, /components\/enterprise\//],
  },
  {
    area: "booking",
    patterns: [/booking/, /session-wizard/, /components\/discovery\//, /lib\/booking/],
  },
  {
    area: "admin",
    patterns: [/app\/admin\//, /components\/admin\//, /lib\/admin\//],
  },
  {
    area: "payments",
    patterns: [/stripe/, /gocardless/, /lib\/payments/, /payout/],
  },
  {
    area: "communications",
    patterns: [/communications/, /campaign/i, /locales\/.*\/emails\.json/],
  },
  {
    area: "updates",
    patterns: [/app\/updates/, /lib\/releases/, /components\/transparency\/Updates/],
  },
  {
    area: "api",
    patterns: [/app\/api\//, /lib\/data\/providers/],
  },
];

const FIX_PATTERNS = [/fix/i, /bug/i, /hotfix/i, /patch/i, /regression/i];
const FEATURE_PATTERNS = [/feat/i, /feature/i, /add/i, /new/i, /introduce/i];
const UI_PATTERNS = [/ui/i, /style/i, /layout/i, /css/i, /tailwind/i, /design/i, /tweak/i];
const BREAKING_PATTERNS = [/breaking/i, /BREAKING/i, /migrate/i, /removed/i];

function normalizePath(filePath: string): string {
  return filePath.replace(/\\/g, "/");
}

export function detectAreasFromFiles(changedFiles: string[]): ChangeArea[] {
  const areas = new Set<ChangeArea>();

  for (const rawPath of changedFiles) {
    const filePath = normalizePath(rawPath);
    let matched = false;

    for (const rule of AREA_RULES) {
      if (rule.patterns.some((pattern) => pattern.test(filePath))) {
        areas.add(rule.area);
        matched = true;
      }
    }

    if (!matched) {
      areas.add("other");
    }
  }

  return [...areas];
}

export function classifyChangeType(
  changedFiles: string[],
  commitMessages: string[] = [],
): ReleaseChangeType {
  const text = [...commitMessages, ...changedFiles].join("\n");

  if (BREAKING_PATTERNS.some((pattern) => pattern.test(text))) {
    return "major";
  }
  if (FIX_PATTERNS.some((pattern) => pattern.test(text))) {
    return "fix";
  }
  if (UI_PATTERNS.some((pattern) => pattern.test(text))) {
    return "ui_tweak";
  }
  if (FEATURE_PATTERNS.some((pattern) => pattern.test(text))) {
    return "feature";
  }

  const areas = detectAreasFromFiles(changedFiles);
  if (areas.includes("homepage") || areas.includes("onboarding") || areas.includes("dashboard")) {
    return "feature";
  }

  return "ui_tweak";
}

export function suggestAreaLabels(areas: ChangeArea[]): string[] {
  return areas.map((area) => {
    switch (area) {
      case "homepage":
        return "Homepage";
      case "onboarding":
        return "Club onboarding";
      case "login":
        return "Login & sign-up";
      case "dashboard":
        return "Club dashboard";
      case "booking":
        return "Booking & sessions";
      case "admin":
        return "Admin portal";
      case "payments":
        return "Payments";
      case "communications":
        return "Communications";
      case "updates":
        return "Release notes";
      case "api":
        return "Platform API";
      default:
        return "Platform";
    }
  });
}

export function buildChangelogSections(
  areas: ChangeArea[],
  changedFiles: string[],
  commitMessages: string[],
): {
  features: string[];
  improvements: string[];
  fixes: string[];
  breakingChanges: string[];
} {
  const labels = suggestAreaLabels(areas);
  const changeType = classifyChangeType(changedFiles, commitMessages);
  const features: string[] = [];
  const improvements: string[] = [];
  const fixes: string[] = [];
  const breakingChanges: string[] = [];

  for (const message of commitMessages) {
    const trimmed = message.trim();
    if (!trimmed) {
      continue;
    }
    if (BREAKING_PATTERNS.some((pattern) => pattern.test(trimmed))) {
      breakingChanges.push(trimmed.replace(/^BREAKING[:\s-]*/i, ""));
    } else if (FIX_PATTERNS.some((pattern) => pattern.test(trimmed))) {
      fixes.push(trimmed.replace(/^(fix|bugfix)[:\s-]*/i, ""));
    } else if (FEATURE_PATTERNS.some((pattern) => pattern.test(trimmed))) {
      features.push(trimmed.replace(/^(feat|feature)[:\s-]*/i, ""));
    } else {
      improvements.push(trimmed);
    }
  }

  if (features.length === 0 && (changeType === "feature" || changeType === "major")) {
    for (const label of labels.slice(0, 3)) {
      features.push(`Updates to ${label}`);
    }
  }

  if (improvements.length === 0 && changeType === "ui_tweak") {
    for (const label of labels.slice(0, 2)) {
      improvements.push(`UI polish for ${label}`);
    }
  }

  if (fixes.length === 0 && changeType === "fix") {
    fixes.push("Bug fixes and stability improvements");
  }

  return { features, improvements, fixes, breakingChanges };
}
