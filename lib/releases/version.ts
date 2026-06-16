import type { ReleaseChangeType } from "./types";

export type ParsedVersion = {
  major: number;
  minor: number;
  patch: number;
};

/** Parse semver-like strings: 0.5, 0.5.1, 1.0.0 */
export function parseVersion(version: string): ParsedVersion {
  const parts = version.trim().split(".").map((part) => Number.parseInt(part, 10));
  return {
    major: parts[0] ?? 0,
    minor: parts[1] ?? 0,
    patch: parts[2] ?? 0,
  };
}

export function formatVersion(parsed: ParsedVersion): string {
  if (parsed.patch > 0) {
    return `${parsed.major}.${parsed.minor}.${parsed.patch}`;
  }
  return `${parsed.major}.${parsed.minor}`;
}

/**
 * Version bump rules (0.x pre-1.0):
 * - major / feature release → 0.5 → 0.6
 * - fix → 0.5 → 0.5.1
 * - ui_tweak → 0.5.1 → 0.5.2
 */
export function suggestNextVersion(
  currentVersion: string,
  changeType: ReleaseChangeType,
): string {
  const current = parseVersion(currentVersion);

  if (changeType === "major" || changeType === "feature") {
    return formatVersion({
      major: current.major,
      minor: current.minor + 1,
      patch: 0,
    });
  }

  if (changeType === "fix" || changeType === "ui_tweak") {
    const nextPatch = current.patch > 0 ? current.patch + 1 : 1;
    return formatVersion({
      major: current.major,
      minor: current.minor,
      patch: nextPatch,
    });
  }

  return formatVersion({
    major: current.major,
    minor: current.minor,
    patch: current.patch + 1,
  });
}

export function compareVersions(a: string, b: string): number {
  const va = parseVersion(a);
  const vb = parseVersion(b);
  if (va.major !== vb.major) {
    return va.major - vb.major;
  }
  if (va.minor !== vb.minor) {
    return va.minor - vb.minor;
  }
  return va.patch - vb.patch;
}

export function getLatestVersion(versions: string[]): string {
  if (versions.length === 0) {
    return "0.5";
  }
  return [...versions].sort(compareVersions).at(-1) ?? "0.5";
}
