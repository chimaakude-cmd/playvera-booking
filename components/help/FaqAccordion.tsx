"use client";

import {
  useCallback,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { ChevronDown } from "lucide-react";

export type FaqAccordionItem = {
  id: string;
  question: string;
  answer: ReactNode;
};

type FaqAccordionProps = {
  items: FaqAccordionItem[];
  allowMultiple?: boolean;
  className?: string;
  itemClassName?: string;
};

export function FaqAccordion({
  items,
  allowMultiple = false,
  className = "",
  itemClassName = "",
}: FaqAccordionProps) {
  const baseId = useId();
  const [openIds, setOpenIds] = useState<Set<string>>(() => new Set());
  const buttonRefs = useRef<Map<string, HTMLButtonElement>>(new Map());

  const toggleItem = useCallback(
    (id: string) => {
      setOpenIds((current) => {
        const next = new Set(current);
        if (next.has(id)) {
          next.delete(id);
          return next;
        }
        if (!allowMultiple) {
          next.clear();
        }
        next.add(id);
        return next;
      });
    },
    [allowMultiple],
  );

  const focusItemAt = useCallback(
    (index: number) => {
      const item = items[index];
      if (!item) {
        return;
      }
      buttonRefs.current.get(item.id)?.focus();
    },
    [items],
  );

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
      switch (event.key) {
        case "ArrowDown":
          event.preventDefault();
          focusItemAt((index + 1) % items.length);
          break;
        case "ArrowUp":
          event.preventDefault();
          focusItemAt((index - 1 + items.length) % items.length);
          break;
        case "Home":
          event.preventDefault();
          focusItemAt(0);
          break;
        case "End":
          event.preventDefault();
          focusItemAt(items.length - 1);
          break;
        default:
          break;
      }
    },
    [focusItemAt, items.length],
  );

  return (
    <div className={`divide-y divide-zinc-200/80 rounded-2xl border border-zinc-200/80 bg-white shadow-sm ${className}`}>
      {items.map((item, index) => {
        const isOpen = openIds.has(item.id);
        const headerId = `${baseId}-${item.id}-header`;
        const panelId = `${baseId}-${item.id}-panel`;

        return (
          <div key={item.id} className={itemClassName}>
            <h3>
              <button
                ref={(node) => {
                  if (node) {
                    buttonRefs.current.set(item.id, node);
                  } else {
                    buttonRefs.current.delete(item.id);
                  }
                }}
                type="button"
                id={headerId}
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => toggleItem(item.id)}
                onKeyDown={(event) => handleKeyDown(event, index)}
                className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition-colors hover:bg-teal-50/40 sm:px-6 sm:py-5"
              >
                <span className="text-sm font-semibold text-zinc-900 sm:text-base">
                  {item.question}
                </span>
                <ChevronDown
                  className={`h-5 w-5 shrink-0 text-teal-600 transition-transform duration-300 ease-in-out ${
                    isOpen ? "rotate-180" : ""
                  }`}
                  aria-hidden
                />
              </button>
            </h3>
            <div
              id={panelId}
              role="region"
              aria-labelledby={headerId}
              hidden={!isOpen}
              className={`grid transition-[grid-template-rows,opacity] duration-300 ease-in-out ${
                isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
              }`}
            >
              <div className="overflow-hidden">
                <div className="px-5 pb-5 text-sm leading-relaxed text-zinc-600 sm:px-6 sm:pb-6">
                  {item.answer}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
