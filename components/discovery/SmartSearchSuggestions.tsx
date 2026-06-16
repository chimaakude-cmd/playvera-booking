"use client";

import { SMART_SEARCH_SUGGESTIONS } from "@/lib/discovery/constants";
import { HOME_BUTTON } from "@/components/home/shared";

type SmartSearchSuggestionsProps = {
  query: string;
  onSelect: (value: string) => void;
};

export function SmartSearchSuggestions({
  query,
  onSelect,
}: SmartSearchSuggestionsProps) {
  const normalized = query.trim().toLowerCase();
  const matches = SMART_SEARCH_SUGGESTIONS.filter((item) =>
    item.label.toLowerCase().includes(normalized),
  ).slice(0, 6);

  if (matches.length === 0) {
    return null;
  }

  return (
    <ul
      className={`absolute left-0 right-0 top-[calc(100%+4px)] z-50 max-h-56 overflow-y-auto border border-slate-200 bg-white py-1 shadow-lg shadow-slate-900/10 ${HOME_BUTTON}`}
      role="listbox"
    >
      {matches.map((item) => (
        <li key={item.label}>
          <button
            type="button"
            role="option"
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => onSelect(item.label)}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-[#0F172A] transition-colors hover:bg-blue-50"
          >
            <span aria-hidden>{item.icon}</span>
            <span className="font-medium">{item.label}</span>
          </button>
        </li>
      ))}
    </ul>
  );
}
