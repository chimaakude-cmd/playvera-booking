"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { usePathname } from "next/navigation";
import { consumePendingSupportOpen } from "@/lib/inbox/storage";
import { detectSupportContext } from "@/lib/support/context";
import { getSupportMode } from "@/lib/support/routing";
import {
  archiveThread as archiveThreadStorage,
  bulkArchiveThreads as bulkArchiveThreadsStorage,
  bulkDeleteThreads as bulkDeleteThreadsStorage,
  createThread,
  deleteThread as deleteThreadStorage,
  escalateThreadToHuman,
  getCurrentUserContact,
  getMessagesForThread,
  getThreadById,
  getThreads,
  permanentlyDeleteThread as permanentlyDeleteThreadStorage,
  renameThread as renameThreadStorage,
  restoreThread as restoreThreadStorage,
  sendUserMessageAndMaybeAiReply,
  unarchiveThread as unarchiveThreadStorage,
  type SupportContext,
  type SupportMessage,
  type SupportMode,
  type SupportThread,
  type MessageType,
} from "@/lib/support";

type DrawerTab = "chats" | "help";

type SupportContextValue = {
  open: boolean;
  setOpen: (open: boolean) => void;
  context: SupportContext;
  supportMode: SupportMode;
  activeTab: DrawerTab;
  setActiveTab: (tab: DrawerTab) => void;
  threads: SupportThread[];
  activeThreadId: string | null;
  setActiveThreadId: (id: string | null) => void;
  activeThread: SupportThread | null;
  messages: SupportMessage[];
  refresh: () => void;
  startNewChat: (mode?: "ai" | "human") => SupportThread;
  startChatWithMessage: (
    body: string,
    messageType?: MessageType,
    mode?: "ai" | "human",
  ) => SupportThread;
  sendMessage: (body: string, messageType?: MessageType) => void;
  escalate: () => void;
  showArchived: boolean;
  setShowArchived: (v: boolean) => void;
  showRecentlyDeleted: boolean;
  setShowRecentlyDeleted: (v: boolean) => void;
  renameThread: (threadId: string, subject: string) => void;
  archiveThread: (threadId: string) => void;
  unarchiveThread: (threadId: string) => void;
  deleteThread: (threadId: string) => void;
  restoreThread: (threadId: string) => void;
  permanentlyDeleteThread: (threadId: string) => void;
  bulkArchiveThreads: (threadIds: string[]) => void;
  bulkDeleteThreads: (threadIds: string[]) => void;
};

const SupportCtx = createContext<SupportContextValue | null>(null);

export function useSupport(): SupportContextValue {
  const ctx = useContext(SupportCtx);
  if (!ctx) {
    throw new Error("useSupport must be used within SupportProvider");
  }
  return ctx;
}

type SupportProviderProps = {
  children: ReactNode;
};

export function SupportProvider({ children }: SupportProviderProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<DrawerTab>("chats");
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [showArchived, setShowArchived] = useState(false);
  const [showRecentlyDeleted, setShowRecentlyDeleted] = useState(false);

  const context = useMemo(
    () => detectSupportContext(pathname ?? "/"),
    [pathname],
  );
  const supportMode = useMemo(() => getSupportMode(context), [context]);

  const threads = useMemo(() => getThreads(false), [refreshKey]);
  const activeThread = activeThreadId
    ? (getThreadById(activeThreadId) ?? null)
    : null;
  const messages = activeThreadId
    ? getMessagesForThread(activeThreadId)
    : [];

  const refresh = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  useEffect(() => {
    refresh();
  }, [open, refresh]);

  const startNewChat = useCallback(
    (mode?: "ai" | "human") => {
      const contact = getCurrentUserContact();
      const effectiveMode =
        mode === "human" || supportMode === "human" ? "human" : supportMode;
      const thread = createThread({
        context,
        support_mode: effectiveMode,
        contact_name: contact.name,
        contact_email: contact.email,
        user_id: contact.user_id,
        subject: "New conversation",
      });
      setActiveThreadId(thread.id);
      setActiveTab("chats");
      refresh();
      return thread;
    },
    [context, supportMode, refresh],
  );

  useEffect(() => {
    function applyOpen(detail?: { newChat?: boolean; threadId?: string } | null) {
      if (detail === null) {
        return;
      }

      if (detail?.threadId) {
        setActiveThreadId(detail.threadId);
        setActiveTab("chats");
      } else if (detail?.newChat) {
        startNewChat();
      }

      setOpen(true);
    }

    function handleOpenSupport(event: Event) {
      applyOpen(
        (event as CustomEvent<{ newChat?: boolean; threadId?: string }>).detail,
      );
    }

    window.addEventListener("activora:open-support", handleOpenSupport);
    applyOpen(consumePendingSupportOpen());

    return () => {
      window.removeEventListener("activora:open-support", handleOpenSupport);
    };
  }, [startNewChat]);

  const startChatWithMessage = useCallback(
    (
      body: string,
      messageType: MessageType = "general",
      mode?: "ai" | "human",
    ) => {
      const contact = getCurrentUserContact();
      const effectiveMode =
        mode === "human" || supportMode === "human" ? "human" : supportMode;
      const thread = createThread({
        context,
        support_mode: effectiveMode,
        message_type: messageType,
        contact_name: contact.name,
        contact_email: contact.email,
        user_id: contact.user_id,
        subject: body.slice(0, 48) + (body.length > 48 ? "…" : ""),
        icon: effectiveMode === "human" ? "👤" : "🤖",
      });
      setActiveThreadId(thread.id);
      setActiveTab("chats");
      sendUserMessageAndMaybeAiReply(thread.id, body, messageType);
      refresh();
      return thread;
    },
    [context, supportMode, refresh],
  );

  const sendMessage = useCallback(
    (body: string, messageType: MessageType = "general") => {
      if (!activeThreadId) {
        startChatWithMessage(body, messageType);
        return;
      }
      sendUserMessageAndMaybeAiReply(activeThreadId, body, messageType);
      refresh();
    },
    [activeThreadId, startChatWithMessage, refresh],
  );

  const escalate = useCallback(() => {
    if (!activeThreadId) {
      return;
    }
    escalateThreadToHuman(activeThreadId);
    refresh();
  }, [activeThreadId, refresh]);

  const value: SupportContextValue = {
    open,
    setOpen,
    context,
    supportMode,
    activeTab,
    setActiveTab,
    threads,
    activeThreadId,
    setActiveThreadId,
    activeThread,
    messages,
    refresh,
    startNewChat,
    startChatWithMessage,
    sendMessage,
    escalate,
    showArchived,
    setShowArchived,
    showRecentlyDeleted,
    setShowRecentlyDeleted,
    renameThread: renameThreadStorage,
    archiveThread: archiveThreadStorage,
    unarchiveThread: unarchiveThreadStorage,
    deleteThread: deleteThreadStorage,
    restoreThread: restoreThreadStorage,
    permanentlyDeleteThread: permanentlyDeleteThreadStorage,
    bulkArchiveThreads: bulkArchiveThreadsStorage,
    bulkDeleteThreads: bulkDeleteThreadsStorage,
  };

  return <SupportCtx.Provider value={value}>{children}</SupportCtx.Provider>;
}
