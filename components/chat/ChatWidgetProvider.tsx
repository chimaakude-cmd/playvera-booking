"use client";

import { ChatWidget } from "./ChatWidget";
import type { ConversationType } from "@/lib/chat/types";

type ChatWidgetProviderProps = {
  children: React.ReactNode;
  variant: ConversationType;
  showWelcomePrompt?: boolean;
};

export function ChatWidgetProvider({
  children,
  variant,
  showWelcomePrompt = false,
}: ChatWidgetProviderProps) {
  return (
    <>
      {children}
      <ChatWidget variant={variant} showWelcomePrompt={showWelcomePrompt} />
    </>
  );
}
