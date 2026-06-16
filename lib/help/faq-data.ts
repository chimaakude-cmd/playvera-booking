export type FaqCategoryId =
  | "getting-started"
  | "parents"
  | "providers"
  | "payments"
  | "bookings"
  | "registers"
  | "communication"
  | "troubleshooting";

export type FaqItem = {
  id: string;
  question: string;
  answer: string;
  category: FaqCategoryId;
  featured?: boolean;
};

export const FAQ_CATEGORIES: { id: FaqCategoryId; label: string }[] = [
  { id: "getting-started", label: "Getting Started" },
  { id: "parents", label: "Parents" },
  { id: "providers", label: "Providers" },
  { id: "payments", label: "Payments" },
  { id: "bookings", label: "Bookings" },
  { id: "registers", label: "Registers" },
  { id: "communication", label: "Communication" },
  { id: "troubleshooting", label: "Troubleshooting" },
];

export const FAQ_ITEMS: FaqItem[] = [
  {
    id: "what-is-activora",
    question: "What is Activora?",
    answer:
      "Activora helps clubs manage bookings, payments, attendance registers, customer communication, and activity administration in one place.",
    category: "getting-started",
    featured: true,
  },
  {
    id: "who-is-activora-for",
    question: "Who is Activora for?",
    answer:
      "Activora is built for activity clubs, schools, holiday camp providers, sports academies, and organisations that run recurring sessions for children and families.",
    category: "getting-started",
  },
  {
    id: "provider-get-started",
    question: "How do I get started as a provider?",
    answer:
      "Create a free provider account, complete your club profile, connect Stripe for payouts, and publish your first activities. Our onboarding wizard walks you through each step.",
    category: "getting-started",
  },
  {
    id: "special-software",
    question: "Do I need special software or hardware?",
    answer:
      "No — Activora runs in any modern web browser on desktop, tablet, or mobile. Coaches can take registers and parents can book from their phone.",
    category: "getting-started",
  },
  {
    id: "parent-account",
    question: "Do parents need to create an account?",
    answer:
      "Yes — parents create one account and can manage multiple children, bookings, payments, and communication in one place.",
    category: "parents",
    featured: true,
  },
  {
    id: "parent-book-session",
    question: "How do I book a session for my child?",
    answer:
      "Search for a club or activity, choose a session, add your child's details, and pay securely at checkout. You'll receive a confirmation by email.",
    category: "parents",
  },
  {
    id: "parent-multiple-children",
    question: "Can I manage multiple children on one account?",
    answer:
      "Yes — add each child to your parent profile once, then book and manage sessions for all of them from a single dashboard.",
    category: "parents",
  },
  {
    id: "parent-updates",
    question: "How do I receive updates from my child's club?",
    answer:
      "Clubs can send announcements, session reminders, and direct messages through Activora. You'll also receive email notifications for important booking updates.",
    category: "parents",
  },
  {
    id: "activora-cost",
    question: "How much does Activora cost?",
    answer:
      "No monthly subscription for clubs. Activora charges platform fees only when bookings are processed.",
    category: "providers",
    featured: true,
  },
  {
    id: "clubs-and-camps",
    question: "Can I manage after-school clubs and holiday camps?",
    answer:
      "Yes — Activora supports after-school clubs, breakfast clubs, holiday camps, sports clubs and recurring activities.",
    category: "providers",
    featured: true,
  },
  {
    id: "schools-large-providers",
    question: "Is Activora suitable for schools and large providers?",
    answer:
      "Yes — Activora supports single clubs through to larger organisations and franchise operations.",
    category: "providers",
    featured: true,
  },
  {
    id: "club-profile-setup",
    question: "How do I set up my club profile?",
    answer:
      "From your dashboard, go to Settings → Profile to add your logo, description, contact details, and public page settings. Changes appear on your booking page instantly.",
    category: "providers",
  },
  {
    id: "multiple-staff",
    question: "Can multiple staff members access the dashboard?",
    answer:
      "Yes — invite team members with role-based access so coaches, administrators, and finance staff see only what they need.",
    category: "providers",
  },
  {
    id: "clubs-receive-payments",
    question: "How do clubs receive payments?",
    answer:
      "Payments are collected securely through Stripe and transferred directly to the club's connected account.",
    category: "payments",
    featured: true,
  },
  {
    id: "payment-methods",
    question: "What payment methods do parents use?",
    answer:
      "Parents pay by card at checkout through Stripe. Apple Pay and Google Pay are supported where available.",
    category: "payments",
  },
  {
    id: "transaction-fees",
    question: "Are there transaction fees?",
    answer:
      "Stripe processing fees apply to card payments. Activora platform fees are charged only when a booking is successfully processed — there is no monthly subscription.",
    category: "payments",
  },
  {
    id: "payout-timing",
    question: "When do clubs receive payouts?",
    answer:
      "Payout timing follows your Stripe account schedule — typically a few business days after a successful payment, depending on your region and account status.",
    category: "payments",
  },
  {
    id: "cancel-refunds",
    question: "Can parents cancel or request refunds?",
    answer:
      "Providers control cancellation and refund policies and can manage requests directly inside the dashboard.",
    category: "bookings",
    featured: true,
  },
  {
    id: "recurring-bookings",
    question: "How do recurring bookings work?",
    answer:
      "Set up termly or weekly sessions and parents can enrol for the full block. You control capacity, pricing, and how far ahead bookings open.",
    category: "bookings",
  },
  {
    id: "booking-limits",
    question: "Can I set booking windows and capacity limits?",
    answer:
      "Yes — define maximum places per session, early-bird windows, and cut-off times so sessions never overfill.",
    category: "bookings",
  },
  {
    id: "session-cancelled",
    question: "What happens if a session is cancelled?",
    answer:
      "Notify affected families from your dashboard. Depending on your policy, you can offer a credit, reschedule, or process a refund in a few clicks.",
    category: "bookings",
  },
  {
    id: "registers-how",
    question: "How do attendance registers work?",
    answer:
      "Open a session register from your dashboard, mark children present or absent, and add notes. Registers sync in real time for your team.",
    category: "registers",
  },
  {
    id: "registers-mobile",
    question: "Can coaches take registers on mobile?",
    answer:
      "Yes — registers are fully mobile-friendly so coaches can check children in at the venue from any phone or tablet.",
    category: "registers",
  },
  {
    id: "registers-parent-history",
    question: "Can parents see attendance history?",
    answer:
      "Providers can choose what attendance information parents see. Many clubs share session attendance so families stay informed.",
    category: "registers",
  },
  {
    id: "registers-export",
    question: "How do I export register data?",
    answer:
      "Export attendance records from the Registers section for reporting, safeguarding audits, or sharing with your organisation.",
    category: "registers",
  },
  {
    id: "messaging-parents",
    question: "How does messaging with parents work?",
    answer:
      "Send direct messages or group announcements from Communications. Parents receive notifications and can reply from their account or email.",
    category: "communication",
  },
  {
    id: "bulk-announcements",
    question: "Can I send bulk announcements?",
    answer:
      "Yes — target all families, a specific activity, or individual parents with one message. Use templates to save time on recurring updates.",
    category: "communication",
  },
  {
    id: "email-sms",
    question: "Are email and SMS supported?",
    answer:
      "Email is included for all accounts. SMS delivery can be enabled for urgent reminders and last-minute session changes where configured.",
    category: "communication",
  },
  {
    id: "parent-replies",
    question: "Can parents reply to club messages?",
    answer:
      "Yes — two-way messaging keeps conversations in one thread so your team has full context without switching apps.",
    category: "communication",
  },
  {
    id: "forgot-password",
    question: "I forgot my password — what should I do?",
    answer:
      "Use the Forgot password link on the login page. You'll receive an email to reset your password securely.",
    category: "troubleshooting",
  },
  {
    id: "payment-failed",
    question: "A payment failed — what happens next?",
    answer:
      "The booking is not confirmed until payment succeeds. Ask the parent to retry with a different card or contact their bank. Failed attempts are logged in your finance dashboard.",
    category: "troubleshooting",
  },
  {
    id: "missing-booking",
    question: "Why can't I see my booking?",
    answer:
      "Check you're signed in with the same email used at checkout. Bookings appear under My Bookings in the parent dashboard. Contact the club if you still can't find it.",
    category: "troubleshooting",
  },
  {
    id: "contact-support",
    question: "How do I contact Activora support?",
    answer:
      "Open the support chat from any page, email support@activora.co.uk, or book a demo walkthrough with our team.",
    category: "troubleshooting",
  },
];

export function getHomepageFaqs(): FaqItem[] {
  return FAQ_ITEMS.filter((item) => item.featured);
}

export function getCategoryLabel(categoryId: FaqCategoryId): string {
  return FAQ_CATEGORIES.find((category) => category.id === categoryId)?.label ?? categoryId;
}

export function filterFaqs(
  query: string,
  category: FaqCategoryId | "all" = "all",
): FaqItem[] {
  const normalizedQuery = query.trim().toLowerCase();

  return FAQ_ITEMS.filter((item) => {
    const matchesCategory = category === "all" || item.category === category;
    if (!matchesCategory) {
      return false;
    }

    if (!normalizedQuery) {
      return true;
    }

    return (
      item.question.toLowerCase().includes(normalizedQuery) ||
      item.answer.toLowerCase().includes(normalizedQuery)
    );
  });
}
