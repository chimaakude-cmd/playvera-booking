"use client";

import { useEffect, useState } from "react";
import { BRAND_NAME } from "@/lib/brand";
"use client";

import {
  createPublicEnquiry,
  createUserConversation,
  detectChatWidgetUser,
  getMessagesForConversation,
  sendMessage,
  type ChatWidgetUser,
} from "@/lib/chat/storage";
import type {
  Conversation,
  ConversationType,
  Message,
} from "@/lib/chat/types";

export const CHAT_AGENT_AVATAR =
  "https://i.pravatar.cc/150?u=chima-activora-support";

const AGENT_NAME = "Chima";
const AGENT_LABEL = `${BRAND_NAME} Support`;

type View = "closed" | "form" | "thread";

type ChatWidgetProps = {
  variant: ConversationType;
  showWelcomePrompt?: boolean;
};

function userKindForVariant(
  variant: ConversationType,
  detected: ChatWidgetUser,
): ChatWidgetUser["kind"] {
  if (variant === "public") {
    return "visitor";
  }
  if (variant === "parent") {
    return detected.kind === "parent" ? "parent" : "visitor";
  }
  return detected.kind === "provider" ? "provider" : "visitor";
}

export function ChatWidget({
  variant,
  showWelcomePrompt = false,
}: ChatWidgetProps) {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<View>("form");
  const [user, setUser] = useState<ChatWidgetUser>({
    kind: "visitor",
    name: "",
    email: "",
  });
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [reply, setReply] = useState("");
  const [sent, setSent] = useState(false);

  useEffect(() => {
    const detected = detectChatWidgetUser();
    const kind = userKindForVariant(variant, detected);
    const nextUser: ChatWidgetUser =
      kind === "provider" && detected.kind === "provider"
        ? detected
        : kind === "parent" && detected.kind === "parent"
          ? detected
          : { kind, name: "", email: "" };

    setUser(nextUser);
    if (nextUser.kind !== "visitor") {
      setName(nextUser.name);
      setEmail(nextUser.email);
    }
  }, [open, variant]);

  function loadThread(conv: Conversation) {
    setConversation(conv);
    setMessages(getMessagesForConversation(conv.id));
    setView("thread");
  }

  function handleSubmitEnquiry(event: React.FormEvent) {
    event.preventDefault();
    if (!message.trim()) {
      return;
    }

    let conv: Conversation;
    if (variant === "public" || user.kind === "visitor") {
      if (!name.trim() || !email.trim()) {
        return;
      }
      conv = createPublicEnquiry({
        name: name.trim(),
        email: email.trim(),
        message: message.trim(),
      });
    } else if (variant === "parent") {
      conv = createUserConversation({
        type: "parent",
        contactName: user.name || name.trim(),
        contactEmail: user.email || email.trim(),
        message: message.trim(),
      });
    } else {
      conv = createUserConversation({
        type: "provider",
        contactName: user.name || name.trim(),
        contactEmail: user.email || email.trim(),
        providerId: user.providerId,
        providerName: user.providerName,
        message: message.trim(),
      });
    }

    setSent(true);
    setMessage("");
    loadThread(conv);
  }

  function handleSendReply(event: React.FormEvent) {
    event.preventDefault();
    if (!conversation || !reply.trim()) {
      return;
    }

    const senderType =
      variant === "public" || user.kind === "visitor"
        ? "visitor"
        : variant === "parent"
          ? "parent"
          : "provider";

    sendMessage({
      conversationId: conversation.id,
      senderType,
      senderName:
        user.kind === "visitor" ? name : user.name || name || "User",
      body: reply.trim(),
    });
    setReply("");
    setMessages(getMessagesForConversation(conversation.id));
  }

  function handleOpen() {
    setOpen(true);
    setView(conversation ? "thread" : "form");
  }

  function handleClose() {
    setOpen(false);
  }

  const needsContactFields = user.kind === "visitor";

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-3">
      {open ? (
        <div className="flex w-[min(100vw-2rem,380px)] flex-col overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-xl">
          <div className="flex items-center gap-3 bg-zinc-900 px-4 py-3 text-white">
            <img
              src={CHAT_AGENT_AVATAR}
              alt=""
              width={40}
              height={40}
              className="h-10 w-10 shrink-0 rounded-full border-2 border-white/20 object-cover"
            />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold">{AGENT_NAME}</p>
              <p className="truncate text-[11px] text-zinc-300">{AGENT_LABEL}</p>
              <p className="mt-0.5 flex items-center gap-1.5 text-[11px] text-zinc-400">
                <span
                  className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400"
                  aria-hidden
                />
                Status: Online
              </p>
            </div>
            <button
              type="button"
              onClick={handleClose}
              aria-label="Close chat"
              className="shrink-0 rounded-lg px-2 py-1 text-lg leading-none text-zinc-300 hover:text-white"
            >
              ×
            </button>
          </div>

          {view === "form" ? (
            <form onSubmit={handleSubmitEnquiry} className="space-y-3 p-4">
              {needsContactFields ? (
                <>
                  <label className="block">
                    <span className="text-xs font-medium text-zinc-600">
                      Name
                    </span>
                    <input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm"
                    />
                  </label>
                  <label className="block">
                    <span className="text-xs font-medium text-zinc-600">
                      Email
                    </span>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm"
                    />
                  </label>
                </>
              ) : (
                <p className="rounded-xl bg-zinc-50 px-3 py-2 text-xs text-zinc-600">
                  Signed in as {user.name} ({user.email})
                </p>
              )}
              <label className="block">
                <span className="sr-only">Message</span>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  required
                  rows={4}
                  placeholder="Type your message…"
                  className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm"
                />
              </label>
              <button
                type="submit"
                className="w-full rounded-xl bg-violet-700 py-2.5 text-sm font-semibold text-white hover:bg-violet-800"
              >
                Send
              </button>
              {sent ? (
                <p className="text-center text-xs text-emerald-600">
                  Message sent — we&apos;ll reply soon.
                </p>
              ) : null}
            </form>
          ) : (
            <div className="flex max-h-96 flex-col">
              <div className="flex-1 space-y-2 overflow-y-auto p-4">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`max-w-[90%] rounded-2xl px-3 py-2 text-sm ${
                      msg.senderType === "admin" || msg.senderType === "system"
                        ? "bg-zinc-100 text-zinc-900"
                        : "ml-auto bg-violet-700 text-white"
                    }`}
                  >
                    <p>{msg.body}</p>
                  </div>
                ))}
              </div>
              <form
                onSubmit={handleSendReply}
                className="flex gap-2 border-t border-zinc-100 p-3"
              >
                <textarea
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  rows={1}
                  placeholder="Type your message…"
                  className="min-h-[40px] flex-1 rounded-xl border border-zinc-200 px-3 py-2 text-sm"
                />
                <button
                  type="submit"
                  className="shrink-0 self-end rounded-xl bg-violet-700 px-4 py-2 text-xs font-semibold text-white hover:bg-violet-800"
                >
                  Send
                </button>
              </form>
            </div>
          )}
        </div>
      ) : null}

      <div className="flex items-center gap-2.5">
        {showWelcomePrompt && !open ? (
          <div className="rounded-full border border-zinc-200/60 bg-white/95 px-3.5 py-2 text-sm text-zinc-600 shadow-md backdrop-blur-sm">
            Need assistance?
          </div>
        ) : null}

        <button
          type="button"
          onClick={open ? handleClose : handleOpen}
          aria-label={open ? "Close support chat" : "Open support chat"}
          className={`flex items-center border border-zinc-200/80 bg-white shadow-lg transition-transform hover:scale-[1.02] hover:shadow-xl ${
            showWelcomePrompt
              ? "gap-2.5 rounded-full py-1.5 pl-1.5 pr-3.5"
              : "h-14 w-14 justify-center rounded-full p-1"
          }`}
        >
          <img
            src={CHAT_AGENT_AVATAR}
            alt=""
            width={showWelcomePrompt ? 44 : 52}
            height={showWelcomePrompt ? 44 : 52}
            className={`shrink-0 rounded-full object-cover ring-2 ring-violet-100 ${
              showWelcomePrompt ? "h-11 w-11" : "h-full w-full"
            }`}
          />
          {showWelcomePrompt ? (
            <span className="text-left">
              <span className="block text-sm font-semibold text-zinc-900">
                {AGENT_NAME}
              </span>
              <span className="block text-[11px] font-medium text-violet-700">
                {AGENT_LABEL}
              </span>
            </span>
          ) : null}
        </button>
      </div>
    </div>
  );
}
