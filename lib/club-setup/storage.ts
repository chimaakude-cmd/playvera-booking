import { CLUB_SETUP_PROGRESS_KEY, type SetupProgressStorage } from "./types";

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

export function loadSetupProgressStorage(): SetupProgressStorage {
  if (!isBrowser()) {
    return {};
  }

  try {
    const raw = localStorage.getItem(CLUB_SETUP_PROGRESS_KEY);
    if (!raw) {
      return {};
    }
    return JSON.parse(raw) as SetupProgressStorage;
  } catch {
    return {};
  }
}

export function saveSetupProgressStorage(storage: SetupProgressStorage): void {
  if (!isBrowser()) {
    return;
  }
  localStorage.setItem(CLUB_SETUP_PROGRESS_KEY, JSON.stringify(storage));
}

export function seedSetupProgressAfterOnboarding(): void {
  const existing = loadSetupProgressStorage();
  if (existing.onboardingSeededAt) {
    return;
  }

  saveSetupProgressStorage({
    ...existing,
    onboardingSeededAt: new Date().toISOString(),
  });
}

export function dismissSetupCard(): void {
  const existing = loadSetupProgressStorage();
  saveSetupProgressStorage({
    ...existing,
    dismissed: true,
  });
}

export function isSetupCardDismissed(): boolean {
  return loadSetupProgressStorage().dismissed === true;
}

export function resetSetupCardDismissed(): void {
  const existing = loadSetupProgressStorage();
  saveSetupProgressStorage({
    ...existing,
    dismissed: false,
  });
}
