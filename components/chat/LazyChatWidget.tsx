"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useState } from "react";
import type { ConversationType } from "@/lib/chat/types";

const ChatWidget = dynamic(
  () => import("./ChatWidget").then((mod) => mod.ChatWidget),
  { ssr: false, loading: () => null },
);

type LazyChatWidgetProps = {
  variant: ConversationType;
  showWelcomePrompt?: boolean;
};

/**
 * Defers loading the full chat bundle until the user interacts or the browser is idle.
 */
export function LazyChatWidget({
  variant,
  showWelcomePrompt = false,
}: LazyChatWidgetProps) {
  const [shouldLoad, setShouldLoad] = useState(false);

  const activate = useCallback(() => {
    setShouldLoad(true);
  }, []);

  useEffect(() => {
    if (shouldLoad) {
      return;
    }

    const idle = window.requestIdleCallback?.(() => setShouldLoad(true), {
      timeout: 4000,
    });

    return () => {
      if (idle !== undefined) {
        window.cancelIdleCallback?.(idle);
      }
    };
  }, [shouldLoad]);

  if (!shouldLoad) {
    return (
      <button
        type="button"
        onClick={activate}
        aria-label="Open support chat"
        className="fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full border border-zinc-200/80 bg-white text-violet-700 shadow-lg transition-transform hover:scale-[1.02] hover:shadow-xl"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          className="h-6 w-6"
          aria-hidden
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
          />
        </svg>
      </button>
    );
  }

  return <ChatWidget variant={variant} showWelcomePrompt={showWelcomePrompt} />;
}
