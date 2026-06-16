import type { MessageTemplate } from "./types";
import { DEFAULT_TEMPLATES, COMMUNICATIONS_TEMPLATES_KEY } from "./templates";

export function getMessageTemplates(): MessageTemplate[] {
  if (typeof window === "undefined") {
    return DEFAULT_TEMPLATES;
  }

  try {
    const raw = localStorage.getItem(COMMUNICATIONS_TEMPLATES_KEY);
    if (!raw) {
      return DEFAULT_TEMPLATES;
    }

    const saved = JSON.parse(raw) as MessageTemplate[];
    if (!Array.isArray(saved) || saved.length === 0) {
      return DEFAULT_TEMPLATES;
    }

    return mergeWithDefaults(saved);
  } catch {
    return DEFAULT_TEMPLATES;
  }
}

function mergeWithDefaults(saved: MessageTemplate[]): MessageTemplate[] {
  const savedByCode = new Map(saved.map((template) => [template.code, template]));

  return DEFAULT_TEMPLATES.map((defaultTemplate) => {
    const existing = savedByCode.get(defaultTemplate.code);
    if (!existing) {
      return defaultTemplate;
    }

    return {
      ...defaultTemplate,
      ...existing,
      id: defaultTemplate.id,
      code: defaultTemplate.code,
      description: defaultTemplate.description,
    };
  });
}

export function saveMessageTemplate(
  template: MessageTemplate,
): MessageTemplate[] {
  const templates = getMessageTemplates().map((entry) =>
    entry.code === template.code ? { ...entry, ...template } : entry,
  );

  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(
        COMMUNICATIONS_TEMPLATES_KEY,
        JSON.stringify(templates),
      );
    } catch {
      // ignore storage errors in stub
    }
  }

  return templates;
}

export function saveMessageTemplates(
  templates: MessageTemplate[],
): MessageTemplate[] {
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(
        COMMUNICATIONS_TEMPLATES_KEY,
        JSON.stringify(templates),
      );
    } catch {
      // ignore storage errors in stub
    }
  }

  return templates;
}
