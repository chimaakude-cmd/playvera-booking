"use client";

import { useEffect, useRef, useState } from "react";
import { Heart } from "lucide-react";
import {
  SAVE_LISTS,
  type SaveListName,
} from "@/lib/discovery/constants";
import {
  isSessionSaved,
  loadSavedSessions,
  persistSavedSessions,
  toggleSessionInList,
  type SavedSessionsStore,
} from "@/lib/discovery/saved-sessions";
import { DISCOVERY_RADIUS } from "@/lib/discovery/constants";
import { ACTIVORA_ACTION } from "@/lib/home/constants";

type SaveSessionButtonProps = {
  sessionId: string;
  className?: string;
};

export function SaveSessionButton({
  sessionId,
  className = "",
}: SaveSessionButtonProps) {
  const [store, setStore] = useState<SavedSessionsStore | null>(null);
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setStore(loadSavedSessions());
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        panelRef.current &&
        !panelRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!store) {
    return null;
  }

  const saved = isSessionSaved(store, sessionId);

  function handleToggleList(list: SaveListName) {
    const next = toggleSessionInList(store!, sessionId, list);
    setStore(next);
    persistSavedSessions(next);
  }

  return (
    <div className={`relative ${className}`} ref={panelRef}>
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          setOpen((value) => !value);
        }}
        aria-label={saved ? "Saved to lists" : "Save to list"}
        aria-expanded={open}
        className={`inline-flex h-9 w-9 items-center justify-center border border-slate-200 bg-white/95 backdrop-blur-sm transition-colors hover:border-blue-200 hover:bg-blue-50 ${DISCOVERY_RADIUS.button}`}
      >
        <Heart
          className={`h-4 w-4 ${saved ? "fill-[#2563EB] text-[#2563EB]" : "text-slate-500"}`}
          aria-hidden
        />
      </button>

      {open ? (
        <div
          className={`absolute right-0 top-[calc(100%+6px)] z-20 w-48 border border-slate-200 bg-white p-2 shadow-lg shadow-slate-900/10 ${DISCOVERY_RADIUS.card}`}
        >
          <p className="px-2 py-1 text-xs font-semibold text-slate-500">
            Save to list
          </p>
          {SAVE_LISTS.map((list) => {
            const active = store[list].includes(sessionId);
            return (
              <button
                key={list}
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  handleToggleList(list);
                }}
                className="flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-left text-sm text-[#0F172A] hover:bg-blue-50"
              >
                <span>{list}</span>
                {active ? (
                  <span
                    className="text-xs font-semibold"
                    style={{ color: ACTIVORA_ACTION }}
                  >
                    ✓
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
