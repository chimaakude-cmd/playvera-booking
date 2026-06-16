export const PARTNERS_STORAGE_KEY = "activora-partners";
export const PARTNER_CLAIMS_STORAGE_KEY = "activora-partner-claims";
export const CLUB_SAVED_PARTNERS_KEY = "activora-club-saved-partners";
export const PARTNERS_DEMO_PURGE_KEY = "activora-partners-demo-purged";

export const LOGO_DATA_URL_MAX_BYTES = 80_000;

/** Legacy demo partner IDs removed from the directory (pre-real-data seed). */
export const LEGACY_DEMO_PARTNER_IDS = new Set([
  "partner_sportequip",
  "partner_clubcover",
  "partner_coachacademy",
  "partner_numbersfirst",
  "partner_clublaw",
  "partner_growyourclub",
  "partner_staffperks",
  "partner_pitchperfect",
  "partner_playmore",
  "partner_sessiontech",
  "partner_activpay",
  "partner_joinin",
]);

/** Legacy demo claim IDs removed with demo partners. */
export const LEGACY_DEMO_CLAIM_IDS = new Set(["pclaim_demo1", "pclaim_demo2"]);
