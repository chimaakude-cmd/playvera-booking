"use client";

import { useEffect, useState } from "react";
import { MessageCircle, X } from "lucide-react";
import { LogoMark } from "@/components/branding";
import { BRAND_NAME } from "@/lib/brand";
import {
  ACTIVORA_GRADIENT,
  ACTIVORA_WARM,
} from "@/lib/home/constants";
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
        <div className="flex w-[min(100vw-2rem,380px)] flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_16px_48px_rgba(15,23,42,0.12)]">
          <div
            className="flex items-center gap-3 px-4 py-3.5 text-white"
            style={{ background: ACTIVORA_GRADIENT }}
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white">
              <LogoMark size={28} className="h-7 w-7" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold">{AGENT_LABEL}</p>
              <p className="flex items-center gap-1.5 text-[11px] text-white/80">
                <span
                  className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-300"
                  aria-hidden
                />
                Online — typical reply under 2 hours
              </p>
            </div>
            <button
              type="button"
              onClick={handleClose}
              aria-label="Close chat"
              className="shrink-0 rounded-lg p-1.5 text-white/80 transition-colors hover:bg-white/10 hover:text-white"
            >
              <X className="h-5 w-5" aria-hidden />
            </button>
          </div>

          {view === "form" ? (
            <form onSubmit={handleSubmitEnquiry} className="space-y-3 p-4">
              {needsContactFields ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="block sm:col-span-1">
                    <span className="text-xs font-medium text-slate-600">
                      Name
                    </span>
                    <input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-violet-300 focus:outline-none focus:ring-2 focus:ring-violet-100"
                    />
                  </label>
                  <label className="block sm:col-span-1">
                    <span className="text-xs font-medium text-slate-600">
                      Email
                    </span>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-violet-300 focus:outline-none focus:ring-2 focus:ring-violet-100"
                    />
                  </label>
                </div>
              ) : (
                <p className="rounded-xl bg-violet-50 px-3 py-2 text-xs text-slate-600">
                  Signed in as {user.name} ({user.email})
                </p>
              )}
              <label className="block">
                <span className="text-xs font-medium text-slate-600">
                  How can we help?
                </span>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  required
                  rows={4}
                  placeholder="Ask about bookings, refunds, or finding activities…"
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-violet-300 focus:outline-none focus:ring-2 focus:ring-violet-100"
                />
              </label>
              <button
                type="submit"
                className="w-full rounded-xl py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-95"
                style={{ background: ACTIVORA_GRADIENT }}
              >
                Send message
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
                        ? "bg-slate-100 text-slate-900"
                        : "ml-auto text-white"
                    }`}
                    style={
                      msg.senderType !== "admin" && msg.senderType !== "system"
                        ? { background: ACTIVORA_GRADIENT }
                        : undefined
                    }
                  >
                    <p>{msg.body}</p>
                  </div>
                ))}
              </div>
              <form
                onSubmit={handleSendReply}
                className="flex gap-2 border-t border-slate-100 p-3"
              >
                <textarea
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  rows={1}
                  placeholder="Type your message…"
                  className="min-h-[40px] flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-violet-300 focus:outline-none focus:ring-2 focus:ring-violet-100"
                />
                <button
                  type="submit"
                  className="shrink-0 self-end rounded-xl px-4 py-2 text-xs font-semibold text-white hover:opacity-95"
                  style={{ backgroundColor: ACTIVORA_WARM }}
                >
                  Send
                </button>
              </form>
            </div>
          )}
        </div>
      ) : null}

      <button
        type="button"
        onClick={open ? handleClose : handleOpen}
        aria-label={open ? "Close support chat" : "Open support chat"}
        className={`flex items-center gap-2.5 rounded-full border border-slate-200/80 bg-white shadow-lg transition-all hover:scale-[1.02] hover:shadow-xl ${
          showWelcomePrompt ? "py-1.5 pl-1.5 pr-4" : "h-14 w-14 justify-center p-0"
        }`}
      >
        {showWelcomePrompt && !open ? (
          <>
            <span
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-white"
              style={{ background: ACTIVORA_GRADIENT }}
            >
              <LogoMark size={24} className="h-6 w-6" />
            </span>
            <span className="text-left">
              <span className="block text-sm font-semibold text-slate-900">
                Need help?
              </span>
              <span className="block text-[11px] font-medium text-violet-700">
                {AGENT_LABEL}
              </span>
            </span>
          </>
        ) : (
          <span
            className="flex h-full w-full items-center justify-center rounded-full text-white"
            style={{ background: ACTIVORA_GRADIENT }}
          >
            {open ? (
              <X className="h-6 w-6" aria-hidden />
            ) : (
              <MessageCircle className="h-6 w-6" aria-hidden />
            )}
          </span>
        )}
      </button>
    </div>
  );
}
