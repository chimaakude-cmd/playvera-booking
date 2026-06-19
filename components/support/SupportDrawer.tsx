"use client";

import { useEffect, useRef, useState } from "react";
import { LogoMark } from "@/components/branding";
import { ACTIVORA_GRADIENT } from "@/lib/home/constants";
import { isThreadEnded } from "@/lib/support";
import { THREAD_ENDED_MESSAGE } from "@/lib/support/defaults";
import { canUseAi } from "@/lib/support/routing";
import { useSupport } from "./SupportProvider";
import { SupportEndChatModal } from "./SupportEndChatModal";
import { SupportPanel } from "./SupportPanel";

type UserRole = "parent" | "club" | null;

export function SupportDrawer() {
  const {
    setOpen,
    activeThread,
    supportMode,
    sendMessage,
    startChatWithMessage,
    messages,
    refresh,
    endThread,
  } = useSupport();

  const [userRole, setUserRole] = useState<UserRole>(null);
  const [draft, setDraft] = useState("");
  const [endChatOpen, setEndChatOpen] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const inChat = Boolean(activeThread);
  const chatEnded = activeThread ? isThreadEnded(activeThread.status) : false;
  const statusLabel = canUseAi(supportMode)
    ? "AI + Human Support"
    : "Human Support";

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, userRole, inChat]);

  function handleSend(event: React.FormEvent) {
    event.preventDefault();
    if (chatEnded) {
      return;
    }
    const text = draft.trim();
    if (!text) {
      return;
    }

    setDraft("");

    if (!inChat) {
      const rolePrefix =
        userRole === "parent"
          ? "I'm a parent. "
          : userRole === "club"
            ? "I'm a club/provider. "
            : "";
      startChatWithMessage(rolePrefix + text);
    } else {
      sendMessage(text);
    }

    setTimeout(refresh, 500);
  }

  const canSend =
    !chatEnded &&
    (inChat ? draft.trim().length > 0 : userRole !== null && draft.trim().length > 0);

  function handleConfirmEndChat() {
    endThread();
    setEndChatOpen(false);
    refresh();
  }

  return (
    <>
      <div
        role="dialog"
        aria-label="Activora Support Centre"
        className="fixed bottom-4 right-4 z-[70] flex h-[min(560px,calc(100vh-2rem))] w-[calc(100%-2rem)] max-w-[380px] flex-col overflow-hidden rounded-2xl bg-white shadow-[0_16px_48px_rgba(15,23,42,0.12)] sm:bottom-6 sm:right-6"
      >
        <header
          className="flex shrink-0 items-center gap-3 px-4 py-3.5 text-white"
          style={{ background: ACTIVORA_GRADIENT }}
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white">
            <LogoMark size={32} className="h-8 w-8" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-sm font-semibold leading-tight">Activora Support</h2>
            <p className="text-[11px] text-white/80">{statusLabel}</p>
          </div>
          {inChat && !chatEnded ? (
            <button
              type="button"
              onClick={() => setEndChatOpen(true)}
              className="shrink-0 rounded-lg border border-white/20 px-2.5 py-1.5 text-[11px] font-semibold text-zinc-200 transition-colors hover:bg-white/10 hover:text-white"
            >
              End chat
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="shrink-0 rounded-lg p-1.5 text-zinc-300 transition-colors hover:bg-white/10 hover:text-white"
            aria-label="Close"
          >
            ✕
          </button>
        </header>

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <SupportPanel
            userRole={userRole}
            onSelectRole={setUserRole}
            bottomRef={bottomRef}
          />
        </div>

        {chatEnded ? (
          <div className="shrink-0 border-t border-zinc-100 bg-zinc-50 px-4 py-3 text-center text-sm text-zinc-600">
            {THREAD_ENDED_MESSAGE}
          </div>
        ) : (
          <form
            onSubmit={handleSend}
            className="flex shrink-0 items-center gap-2 border-t border-zinc-100 px-3 py-3"
          >
            <input
              type="text"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder={
                !inChat && !userRole
                  ? "Choose Parent or Club / Provider first…"
                  : "Type your message…"
              }
              disabled={!inChat && !userRole}
              className="min-w-0 flex-1 rounded-xl border border-zinc-200 px-3 py-2.5 text-sm text-[#0F172A] outline-none transition-colors placeholder:text-zinc-400 focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] disabled:cursor-not-allowed disabled:bg-zinc-50 disabled:text-zinc-400"
            />
            <button
              type="submit"
              disabled={!canSend}
              className="shrink-0 rounded-xl bg-[#2563EB] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#1d4ed8] disabled:cursor-not-allowed disabled:opacity-40"
            >
              Send
            </button>
          </form>
        )}
      </div>

      <SupportEndChatModal
        open={endChatOpen}
        onCancel={() => setEndChatOpen(false)}
        onConfirm={handleConfirmEndChat}
      />
    </>
  );
}
