import { generateServerReleaseDraft } from "../lib/releases/server-store";

async function main() {
  const baseRef = process.env.RELEASE_DIFF_BASE;
  const release = await generateServerReleaseDraft(baseRef);

  if (!release) {
    console.log("No release draft created (no git changes or auto-draft disabled).");
    return;
  }

  console.log(`Draft release created: v${release.version} — ${release.title}`);
  console.log(`Status: ${release.status}`);
  console.log(`Areas: ${release.detectedAreas.join(", ")}`);
  console.log(`Review at /admin/releases (Drafts tab)`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
