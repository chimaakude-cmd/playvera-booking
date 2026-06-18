import type { OnboardingStep } from "./types";

export type OnboardingStepMeta = {
  id: OnboardingStep;
  title: string;
  shortTitle: string;
  description: string;
  help: {
    purpose: string;
    whyNeeded: string;
    examples: string[];
    tip?: string;
  };
};

export const ONBOARDING_STEPS: OnboardingStepMeta[] = [
  {
    id: 1,
    title: "Create account",
    shortTitle: "Account",
    description:
      "Set up your owner login — takes about a minute.",
    help: {
      purpose: "Create the owner account for your club dashboard.",
      whyNeeded:
        "You need an owner account to manage bookings, sessions, and settings.",
      examples: [
        "Club founder or director",
        "Franchise operator",
        "Company administrator",
      ],
      tip: "You can invite staff later from Settings → Account & team.",
    },
  },
  {
    id: 2,
    title: "Tell us about your club",
    shortTitle: "Your club",
    description:
      "Club name, activity types, and age ranges — parents use this to find you.",
    help: {
      purpose: "Help parents discover what your club offers.",
      whyNeeded:
        "Categories and activities power search and your public profile.",
      examples: [
        "After School Clubs with football for ages 6–11",
        "Holiday Camps with arts & crafts for ages 3–5",
      ],
      tip: "Use Suggest tagline or description for a starting draft — edit anytime.",
    },
  },
  {
    id: 3,
    title: "Club profile",
    shortTitle: "Profile",
    description:
      "Add your logo and colours — optional, but makes a great first impression.",
    help: {
      purpose: "Brand your public club page quickly.",
      whyNeeded:
        "A logo and tagline build trust when parents browse your club.",
      examples: [
        "Upload your club logo",
        "Pick a theme colour",
        "Generate tagline from your activities",
      ],
      tip: "Skip for now — you can finish this from the dashboard setup checklist.",
    },
  },
  {
    id: 4,
    title: "Complete",
    shortTitle: "Launch",
    description: "Your club is ready — explore the dashboard or create your first session.",
    help: {
      purpose: "Launch your club and continue setup at your own pace.",
      whyNeeded:
        "Payments, payouts, and team invites can wait until you are ready.",
      examples: [
        "Go to dashboard to see your setup checklist",
        "Create your first free session immediately",
        "Connect Stripe when you want to accept payments",
      ],
    },
  },
];

export function getStepMeta(step: OnboardingStep): OnboardingStepMeta {
  return ONBOARDING_STEPS[step - 1];
}
