#!/usr/bin/env node
/**
 * Post-deploy release draft generator.
 * Detects changed areas from git diff, suggests version bump, writes draft to .data/releases.json
 *
 * Usage:
 *   node scripts/generate-release-draft.mjs
 *   RELEASE_DIFF_BASE=origin/main node scripts/generate-release-draft.mjs
 */

import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(scriptDir, "..");
const runner = path.join(scriptDir, "generate-release-draft-runner.ts");

const command = process.platform === "win32" ? "npx.cmd" : "npx";
const result = spawnSync(command, ["tsx", runner], {
  cwd: root,
  stdio: "inherit",
  shell: process.platform === "win32",
});

process.exit(result.status ?? 1);
