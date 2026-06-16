"use client";

import type { RefObject } from "react";
import { useSupport } from "./SupportProvider";
import { SupportChatView } from "./SupportChatView";

type UserRole = "parent" | "club" | null;

type SupportPanelProps = {
  userRole: UserRole;
  onSelectRole: (role: "parent" | "club") => void;
  bottomRef: RefObject<HTMLDivElement | null>;
};

function WelcomeBubble({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex justify-start">
      <div className="max-w-[88%] rounded-2xl rounded-bl-md bg-zinc-100 px-4 py-3 text-sm leading-relaxed text-[#0F172A]">
        {children}
      </div>
    </div>
  );
}

export function SupportPanel({
  userRole,
  onSelectRole,
  bottomRef,
}: SupportPanelProps) {
  const { activeThread } = useSupport();

  if (activeThread) {
    return <SupportChatView bottomRef={bottomRef} />;
  }

  return (
    <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
      <WelcomeBubble>
        <p>Hi! Welcome to PlayVera Support.</p>
        <p className="mt-2">How can we help you today?</p>
      </WelcomeBubble>

      {!userRole ? (
        <>
          <WelcomeBubble>
            <p>Are you a parent or a club/provider?</p>
          </WelcomeBubble>
          <div className="flex flex-wrap gap-2 pt-1">
            <button
              type="button"
              onClick={() => onSelectRole("parent")}
              className="rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-semibold text-[#0F172A] transition-colors hover:border-[#2563EB] hover:bg-blue-50 hover:text-[#2563EB]"
            >
              Parent
            </button>
            <button
              type="button"
              onClick={() => onSelectRole("club")}
              className="rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-semibold text-[#0F172A] transition-colors hover:border-[#2563EB] hover:bg-blue-50 hover:text-[#2563EB]"
            >
              Club / Provider
            </button>
          </div>
        </>
      ) : (
        <div className="flex justify-end">
          <div className="max-w-[88%] rounded-2xl rounded-br-md bg-[#2563EB] px-4 py-2.5 text-sm text-white">
            {userRole === "parent" ? "Parent" : "Club / Provider"}
          </div>
        </div>
      )}

      {userRole ? (
        <WelcomeBubble>
          <p>Great — type your question below and we&apos;ll get back to you.</p>
        </WelcomeBubble>
      ) : null}

      <div ref={bottomRef} />
    </div>
  );
}
