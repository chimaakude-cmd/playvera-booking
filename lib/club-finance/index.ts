export * from "./types";
export * from "./data";
export * from "./vat-settings";
export * from "./vat";
export * from "./hmrc-links";
export * from "./accountant";
export * from "./tabs";

export function formatFinanceDate(iso: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

export function formatFinanceShortDate(iso: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(iso));
}
