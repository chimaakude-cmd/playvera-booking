"use client";

import {
  TEMPLATE_VARIABLES,
  VARIABLE_CATEGORY_LABELS,
  getVariablesByCategory,
  type VariableCategory,
} from "@/lib/message-templates";

type TemplateVariableChipsProps = {
  onInsert?: (tag: string) => void;
  compact?: boolean;
};

export function TemplateVariableChips({
  onInsert,
  compact = false,
}: TemplateVariableChipsProps) {
  const grouped = getVariablesByCategory();

  return (
    <div className={compact ? "space-y-3" : "space-y-4"}>
      {(Object.keys(grouped) as VariableCategory[]).map((category) => {
        const variables = grouped[category];
        if (variables.length === 0) {
          return null;
        }

        return (
          <div key={category}>
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
              {VARIABLE_CATEGORY_LABELS[category]}
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {variables.map((variable) =>
                onInsert ? (
                  <button
                    key={variable.tag}
                    type="button"
                    onClick={() => onInsert(variable.tag)}
                    className="rounded-lg bg-zinc-100 px-2 py-1 text-xs font-medium text-zinc-700 transition-colors hover:bg-zinc-200"
                    title={variable.label}
                  >
                    {variable.tag}
                  </button>
                ) : (
                  <code
                    key={variable.tag}
                    className="rounded-lg bg-zinc-100 px-2 py-1 text-xs text-zinc-600"
                    title={variable.label}
                  >
                    {variable.tag}
                  </code>
                ),
              )}
            </div>
          </div>
        );
      })}
      {!onInsert ? (
        <p className="text-xs text-zinc-400">
          {TEMPLATE_VARIABLES.length} variables available across all templates.
        </p>
      ) : null}
    </div>
  );
}
