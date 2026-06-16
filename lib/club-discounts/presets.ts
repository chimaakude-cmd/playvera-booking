import type { DiscountFormInput } from "./types";

export type DiscountToolId =
  | "sibling"
  | "early_bird"
  | "multi_session"
  | "free_trial"
  | "manual"
  | "first_booking";

export type DiscountToolAvailability = "available" | "available_soon";

export type DiscountToolConfig = {
  id: DiscountToolId;
  title: string;
  description: string;
  availability: DiscountToolAvailability;
  unavailableNote: string;
  buttonLabel?: string;
  createTitle?: string;
  preset?: Partial<DiscountFormInput>;
};

export const DISCOUNT_TOOLS: DiscountToolConfig[] = [
  {
    id: "sibling",
    title: "Sibling discount",
    description: "Automatically reward families booking more than one child.",
    availability: "available",
    unavailableNote: "",
    buttonLabel: "Create sibling discount",
    createTitle: "Create sibling discount",
  },
  {
    id: "early_bird",
    title: "Early bird",
    description: "Offer a discount for parents who book before a deadline.",
    availability: "available",
    unavailableNote: "",
    buttonLabel: "Create early bird discount",
    createTitle: "Create early bird discount",
  },
  {
    id: "multi_session",
    title: "Multi-session discount",
    description: "Encourage parents to book a full block of sessions.",
    availability: "available",
    unavailableNote: "",
    buttonLabel: "Create multi-session discount",
    createTitle: "Create multi-session discount",
    preset: {
      name: "Multi-session block discount",
      code: "",
      type: "percentage",
      value: 10,
      appliesTo: "selected_session",
      appliesToLabel: "",
      minimumSpend: 0,
      usageLimitTotal: null,
      usageLimitPerParent: 1,
      isActive: true,
    },
  },
  {
    id: "free_trial",
    title: "Free trial",
    description: "Let new families try their first session free.",
    availability: "available",
    unavailableNote: "",
    buttonLabel: "Create free trial code",
    createTitle: "Create free trial code",
    preset: {
      name: "Free trial session",
      code: "",
      type: "percentage",
      value: 100,
      appliesTo: "all_activities",
      minimumSpend: 0,
      usageLimitTotal: null,
      usageLimitPerParent: 1,
      isActive: true,
    },
  },
  {
    id: "manual",
    title: "Manual discount",
    description: "Apply a staff-approved discount to a parent booking.",
    availability: "available",
    unavailableNote: "",
    buttonLabel: "Create manual discount",
    createTitle: "Create manual discount",
    preset: {
      name: "Staff manual discount",
      code: "",
      type: "fixed",
      value: 5,
      appliesTo: "all_activities",
      minimumSpend: 0,
      usageLimitTotal: null,
      usageLimitPerParent: null,
      isActive: true,
    },
  },
  {
    id: "first_booking",
    title: "First booking offer",
    description: "Give new parents a welcome discount on their first booking.",
    availability: "available",
    unavailableNote: "",
    buttonLabel: "Create first booking offer",
    createTitle: "Create first booking offer",
    preset: {
      name: "First booking welcome offer",
      code: "",
      type: "fixed",
      value: 5,
      appliesTo: "all_activities",
      minimumSpend: 0,
      usageLimitTotal: null,
      usageLimitPerParent: 1,
      isActive: true,
    },
  },
];

export function getDiscountTool(id: DiscountToolId): DiscountToolConfig | undefined {
  return DISCOUNT_TOOLS.find((tool) => tool.id === id);
}

export function getDiscountToolPreset(id: DiscountToolId): Partial<DiscountFormInput> | undefined {
  return getDiscountTool(id)?.preset;
}
