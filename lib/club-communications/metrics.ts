import type { CommunicationsMetrics, MessageLogEntry } from "./types";
import { countBirthdayMessagesDue } from "./birthday";
import { countRepliesNeedingAttention, getParentReplies } from "./replies";
import { getEffectiveTemplate } from "@/lib/message-templates";

export const COMMUNICATIONS_LOG_KEY = "activora-club-communications-log";

function startOfMonthIso(): string {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
}

export const DEFAULT_MESSAGE_LOG: MessageLogEntry[] = [
  {
    id: "log-1",
    templateCode: "A",
    channel: "email",
    status: "sent",
    sentAt: "2026-06-13T10:15:00.000Z",
    parentEmail: "helen.carter@example.com",
  },
  {
    id: "log-2",
    templateCode: "B",
    channel: "email",
    status: "sent",
    sentAt: "2026-06-13T10:15:01.000Z",
    parentEmail: "helen.carter@example.com",
  },
  {
    id: "log-3",
    templateCode: "C",
    channel: "email",
    status: "scheduled",
    sentAt: "2026-06-14T10:00:00.000Z",
    parentEmail: "james.okonkwo@example.com",
  },
  {
    id: "log-4",
    templateCode: "F",
    channel: "email",
    status: "sent",
    sentAt: "2026-06-10T14:20:00.000Z",
    parentEmail: "david.hughes@example.com",
  },
  {
    id: "log-5",
    templateCode: "A",
    channel: "email",
    status: "failed",
    sentAt: "2026-06-09T11:05:00.000Z",
    parentEmail: "invalid@example",
  },
  {
    id: "log-6",
    templateCode: "C",
    channel: "email",
    status: "scheduled",
    sentAt: "2026-06-15T08:00:00.000Z",
    parentEmail: "priya.sharma@example.com",
  },
];

export function getMessageLog(): MessageLogEntry[] {
  if (typeof window === "undefined") {
    return DEFAULT_MESSAGE_LOG;
  }

  try {
    const raw = localStorage.getItem(COMMUNICATIONS_LOG_KEY);
    if (!raw) {
      return DEFAULT_MESSAGE_LOG;
    }

    const parsed = JSON.parse(raw) as MessageLogEntry[];
    return parsed.length > 0 ? parsed : DEFAULT_MESSAGE_LOG;
  } catch {
    return DEFAULT_MESSAGE_LOG;
  }
}

export function getCommunicationsMetrics(): CommunicationsMetrics {
  const log = getMessageLog();
  const monthStart = startOfMonthIso();
  const birthdayEnabled =
    getEffectiveTemplate("G").enabled;
  const replies = getParentReplies();

  const messagesSentThisMonth = log.filter(
    (entry) => entry.status === "sent" && entry.sentAt >= monthStart,
  ).length;

  const scheduledMessages = log.filter(
    (entry) => entry.status === "scheduled",
  ).length;

  const reviewRequestsSent = log.filter(
    (entry) =>
      entry.templateCode === "F" &&
      entry.status === "sent" &&
      entry.sentAt >= monthStart,
  ).length;

  const failedMessages = log.filter((entry) => entry.status === "failed").length;

  return {
    messagesSentThisMonth,
    scheduledMessages,
    birthdayMessagesDue: countBirthdayMessagesDue(birthdayEnabled),
    reviewRequestsSent,
    failedMessages,
    parentRepliesNeedingAttention: countRepliesNeedingAttention(replies),
  };
}
