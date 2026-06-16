import type { SupportState } from "./types";

export const SUPPORT_THREADS_KEY = "activora-support-threads";
export const SUPPORT_MESSAGES_KEY = "activora-support-messages";
export const SUPPORT_ASSIGNMENTS_KEY = "activora-support-assignments";

export const SUPPORT_AGENT_NAME = "Chima";
export const SUPPORT_AGENT_TITLE = "Head of Support";
export const SUPPORT_AGENT_AVATAR =
  "https://i.pravatar.cc/150?u=chima-activora-support";

export const END_CHAT_CONFIRM_MESSAGE =
  "End this chat? You and the other person will no longer be able to reply.";

export const THREAD_ENDED_MESSAGE = "This chat has ended.";

/** Empty initial state — real conversations only, no demo threads. */
export const SEED_SUPPORT_STATE: SupportState = {
  threads: [],
  messages: [],
  assignments: [],
};
