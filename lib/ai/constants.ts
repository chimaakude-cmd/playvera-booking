/**
 * Phase 1 scope guard — AI may only assist with activity discovery search.
 * Provider/admin automation is intentionally out of scope.
 */
export const AI_SEARCH_ONLY =
  process.env.AI_SEARCH_ONLY !== "false" &&
  process.env.NEXT_PUBLIC_AI_SEARCH_ONLY !== "false";

export const AI_SEARCH_OPENAI_MODEL =
  process.env.OPENAI_SEARCH_MODEL ?? "gpt-4o-mini";
