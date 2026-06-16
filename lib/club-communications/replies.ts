import type { ParentReply } from "./types";

export const COMMUNICATIONS_REPLIES_KEY = "activora-club-communications-replies";

export const DEFAULT_PARENT_REPLIES: ParentReply[] = [
  {
    id: "reply-1",
    parentName: "Helen Carter",
    childName: "Mia Carter",
    activity: "Saturday Football Skills",
    lastMessage:
      "Can Mia swap to the earlier session next week? She has a school trip on the Saturday.",
    lastMessageAt: "2026-06-12T09:14:00.000Z",
    status: "open",
    assignedStaff: "Sarah Mitchell",
    bookingId: "booking-demo-1",
    customerEmail: "helen.carter@example.com",
  },
  {
    id: "reply-2",
    parentName: "James Okonkwo",
    childName: "Noah Okonkwo",
    activity: "Holiday Multi-Sports Camp",
    lastMessage: "Thanks — we've updated Noah's emergency contact number.",
    lastMessageAt: "2026-06-11T16:42:00.000Z",
    status: "resolved",
    assignedStaff: "David Hughes",
    bookingId: "booking-demo-2",
    customerEmail: "james.okonkwo@example.com",
  },
  {
    id: "reply-3",
    parentName: "Priya Sharma",
    childName: "Arjun Sharma",
    activity: "Junior Tennis Academy",
    lastMessage:
      "Is there parking at the venue? First time visiting and not sure where to go.",
    lastMessageAt: "2026-06-13T08:05:00.000Z",
    status: "pending",
    assignedStaff: "Unassigned",
    bookingId: "booking-demo-5",
    customerEmail: "priya.sharma@example.com",
  },
  {
    id: "reply-4",
    parentName: "Sarah Mitchell",
    childName: "Ella Mitchell",
    activity: "Saturday Football Skills",
    lastMessage:
      "Ella won't be attending this Saturday — she's unwell. Please confirm she's marked absent.",
    lastMessageAt: "2026-06-13T07:30:00.000Z",
    status: "open",
    assignedStaff: "Sarah Mitchell",
    bookingId: "booking-demo-3",
    customerEmail: "sarah.mitchell@example.com",
  },
];

export function getParentReplies(): ParentReply[] {
  if (typeof window === "undefined") {
    return DEFAULT_PARENT_REPLIES;
  }

  try {
    const raw = localStorage.getItem(COMMUNICATIONS_REPLIES_KEY);
    if (!raw) {
      return DEFAULT_PARENT_REPLIES;
    }

    const parsed = JSON.parse(raw) as ParentReply[];
    return parsed.length > 0 ? parsed : DEFAULT_PARENT_REPLIES;
  } catch {
    return DEFAULT_PARENT_REPLIES;
  }
}

export function saveParentReplies(replies: ParentReply[]): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    localStorage.setItem(COMMUNICATIONS_REPLIES_KEY, JSON.stringify(replies));
  } catch {
    // ignore storage errors in stub
  }
}

export function updateParentReply(
  id: string,
  updates: Partial<ParentReply>,
): ParentReply[] {
  const replies = getParentReplies().map((reply) =>
    reply.id === id ? { ...reply, ...updates } : reply,
  );
  saveParentReplies(replies);
  return replies;
}

export function countRepliesNeedingAttention(replies: ParentReply[]): number {
  return replies.filter((reply) => reply.status === "open").length;
}
