"use client";

import { useEffect, useState, type RefObject } from "react";
import { useSupport } from "./SupportProvider";
import { SupportEscalation } from "./SupportEscalation";

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

type SupportChatViewProps = {
  bottomRef: RefObject<HTMLDivElement | null>;
};

export function SupportChatView({ bottomRef }: SupportChatViewProps) {
  const { activeThread, messages, escalate, refresh } = useSupport();
  const [dismissedEscalation, setDismissedEscalation] = useState(false);

  const lastAiMessage = [...messages]
    .reverse()
    .find((m) => m.sender_type === "ai");
  const showEscalation =
    lastAiMessage?.needs_escalation &&
    activeThread?.support_mode !== "human" &&
    !dismissedEscalation;

  useEffect(() => {
    setDismissedEscalation(false);
  }, [activeThread?.id]);

  function handleTransfer() {
    escalate();
    setDismissedEscalation(true);
    refresh();
  }

  if (!activeThread) {
    return null;
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {messages.map((message) => {
          const isUser = message.sender_type === "user";
          const isSystem = message.sender_type === "system";
          const isAi = message.sender_type === "ai";

          return (
            <div
              key={message.id}
              className={`flex ${isUser ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[88%] rounded-2xl px-4 py-2.5 ${
                  isUser
                    ? "rounded-br-md bg-[#2563EB] text-white"
                    : isSystem
                      ? "rounded-bl-md bg-zinc-100 text-zinc-600"
                      : isAi
                        ? "rounded-bl-md border border-blue-100 bg-blue-50 text-[#0F172A]"
                        : "rounded-bl-md bg-zinc-100 text-[#0F172A]"
                }`}
              >
                {!isUser ? (
                  <p className="text-[10px] font-medium text-zinc-500">
                    {message.sender_name}
                  </p>
                ) : null}
                <p className="text-sm leading-relaxed">{message.body}</p>
                <p
                  className={`mt-1 text-[10px] ${
                    isUser ? "text-blue-100" : "text-zinc-400"
                  }`}
                >
                  {formatTime(message.created_at)}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {showEscalation ? (
        <SupportEscalation
          onTransfer={handleTransfer}
          onKeepChatting={() => setDismissedEscalation(true)}
        />
      ) : null}
    </div>
  );
}
