export type HelpArticle = {
  id: string;
  title: string;
  category: string;
  summary: string;
  body: string;
};

export const HELP_ARTICLES: HelpArticle[] = [
  {
    id: "onboarding-getting-started",
    title: "Getting started with club onboarding",
    category: "Onboarding",
    summary: "Complete your profile, venues, and sessions to go live.",
    body: "Walk through each onboarding step: owner account, business details, finance setup, session audience, venues, and review. You can save progress and return anytime. Once submitted, our team reviews your listing within 1–2 business days.",
  },
  {
    id: "stripe-connect",
    title: "Connecting Stripe for payouts",
    category: "Stripe",
    summary: "Link your Stripe account to receive session payments.",
    body: "From Club Dashboard → Finance → Stripe Connect, start the onboarding flow. You'll need your business bank details and identity verification. Payouts typically arrive within 2–7 business days after a session is completed.",
  },
  {
    id: "sessions-create",
    title: "Creating and managing sessions",
    category: "Sessions",
    summary: "Set up recurring or one-off sessions with capacity and pricing.",
    body: "Use the Session Wizard to define age range, capacity, price, venue, and schedule. Draft sessions can be edited before publishing. Parents book via your public club page or Activora search.",
  },
  {
    id: "refunds-policy",
    title: "Refunds and cancellations",
    category: "Refunds",
    summary: "How refunds work for parents and clubs.",
    body: "Parents can request refunds according to your cancellation policy. Clubs can issue full or partial refunds from the booking detail page. Refunds are processed back to the original payment method within 5–10 business days.",
  },
  {
    id: "finance-overview",
    title: "Finance dashboard overview",
    category: "Finance",
    summary: "Track revenue, fees, VAT, and payouts in one place.",
    body: "The Finance section shows gross revenue, platform fees, net payouts, and VAT summaries. Export CSV reports for your accountant. Connect Stripe to enable live payout tracking.",
  },
  {
    id: "reviews-management",
    title: "Managing parent reviews",
    category: "Reviews",
    summary: "Respond to reviews and maintain your club reputation.",
    body: "Reviews appear on your public club profile after sessions complete. You can reply publicly to thank parents or address concerns. Flag inappropriate reviews for admin review.",
  },
  {
    id: "registers-attendance",
    title: "Session registers and attendance",
    category: "Registers",
    summary: "Mark attendance and export registers for safeguarding.",
    body: "Open a session's register from Club Dashboard → Registers. Mark children present or absent, add notes, and export PDF/CSV for your records. Registers sync with bookings automatically.",
  },
  {
    id: "communications-parents",
    title: "Communicating with parents",
    category: "Communications",
    summary: "Send updates, reminders, and announcements.",
    body: "Use Communications to email parents on a session or across your club. Templates are available for reminders, weather cancellations, and term updates. All messages are logged for compliance.",
  },
  {
    id: "payments-parent",
    title: "Payment issues for parents",
    category: "Payments",
    summary: "Troubleshoot failed payments and receipts.",
    body: "If a payment fails, check your card expiry and billing address. Retry from My Bookings. Receipts are emailed automatically and available in your account under Payment History.",
  },
  {
    id: "bookings-parent",
    title: "Booking and changing sessions",
    category: "Bookings",
    summary: "Book, reschedule, or cancel sessions as a parent.",
    body: "Search sessions by location and activity, then book for your child. Changes depend on the club's policy — some allow free rescheduling up to 24 hours before. Contact the club or support if you need help.",
  },
];

export function searchArticles(query: string): HelpArticle[] {
  const q = query.trim().toLowerCase();
  if (!q) {
    return HELP_ARTICLES;
  }
  return HELP_ARTICLES.filter(
    (a) =>
      a.title.toLowerCase().includes(q) ||
      a.summary.toLowerCase().includes(q) ||
      a.category.toLowerCase().includes(q),
  );
}
