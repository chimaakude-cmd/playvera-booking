import {
  initialWizardFormData,
  type WizardFormData,
  type WizardStep,
} from "@/lib/session-wizard";
import {
  createDefaultSubscriptionConfig,
  normalizeSessionPaymentModel,
  type SessionPaymentModel,
} from "./payment-model";

export const SESSION_WIZARD_DRAFT_KEY = "activora-session-wizard-draft";

export type SessionWizardPhase = "payment" | "setup" | "wizard";

export type SessionWizardDraft = {
  paymentModel: SessionPaymentModel | null;
  phase: SessionWizardPhase;
  step: WizardStep;
  data: WizardFormData;
  savedAt: string;
};

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

export function createInitialWizardDraft(): SessionWizardDraft {
  return {
    paymentModel: null,
    phase: "payment",
    step: 0,
    data: initialWizardFormData,
    savedAt: new Date().toISOString(),
  };
}

export function loadSessionWizardDraft(): SessionWizardDraft | null {
  if (!isBrowser()) {
    return null;
  }

  try {
    const raw = localStorage.getItem(SESSION_WIZARD_DRAFT_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as Partial<SessionWizardDraft>;
    return {
      paymentModel: normalizeSessionPaymentModel(parsed.paymentModel ?? null),
      phase: parsed.phase ?? "payment",
      step: (parsed.step ?? 0) as WizardStep,
      data: {
        ...initialWizardFormData,
        ...(parsed.data ?? {}),
        subscriptionConfig: {
          ...createDefaultSubscriptionConfig(),
          ...(parsed.data?.subscriptionConfig ?? {}),
        },
      },
      savedAt: parsed.savedAt ?? new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

export function saveSessionWizardDraft(
  draft: Omit<SessionWizardDraft, "savedAt">,
): void {
  if (!isBrowser()) {
    return;
  }

  localStorage.setItem(
    SESSION_WIZARD_DRAFT_KEY,
    JSON.stringify({
      ...draft,
      savedAt: new Date().toISOString(),
    }),
  );
}

export function clearSessionWizardDraft(): void {
  if (!isBrowser()) {
    return;
  }

  localStorage.removeItem(SESSION_WIZARD_DRAFT_KEY);
}
