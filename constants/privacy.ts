export const PRIVACY_POLICY_VERSION = "1.0.0";
export const PRIVACY_POLICY_EFFECTIVE_DATE = "2026-06-22";

export const PRIVACY_CONTACT = {
  platform: "Activora",
  email: "adminactivora@gmail.com",
  address: "61 Frances Street, SE18 5AD",
  country: "United Kingdom",
} as const;

export type PrivacyNavItem = {
  id: string;
  label: string;
};

export type PrivacyTableColumn = {
  header: string;
  accessor: string;
};

export type PrivacyTableData = {
  id: string;
  title: string;
  caption?: string;
  columns: PrivacyTableColumn[];
  rows: Record<string, string>[];
};

export type PrivacyListSection = {
  title: string;
  items: string[];
};

export type PrivacyLegalBasisRow = {
  purpose: string;
  basis: string;
  explanation: string;
};

export type PrivacyRetentionRow = {
  dataType: string;
  period: string;
  notes: string;
};

export type PrivacyVersionEntry = {
  version: string;
  date: string;
  summary: string;
};

export const PRIVACY_NAV_ITEMS: PrivacyNavItem[] = [
  { id: "introduction", label: "Introduction" },
  { id: "who-we-are", label: "Who we are" },
  { id: "information-we-collect", label: "Information we collect" },
  { id: "special-category-data", label: "Special category data" },
  { id: "how-we-use-information", label: "How we use information" },
  { id: "legal-basis", label: "Legal basis" },
  { id: "payments", label: "Payments" },
  { id: "communications", label: "Communications" },
  { id: "data-sharing", label: "Data sharing" },
  { id: "international-transfers", label: "International transfers" },
  { id: "data-retention", label: "Data retention" },
  { id: "childrens-privacy", label: "Children's privacy" },
  { id: "security", label: "Security" },
  { id: "user-rights", label: "Your rights" },
  { id: "cookies", label: "Cookies" },
  { id: "data-requests", label: "Data requests" },
  { id: "contact", label: "Contact" },
  { id: "updates", label: "Policy updates" },
];

export const PRIVACY_INTRODUCTION = {
  paragraphs: [
    "This Privacy Policy explains how Activora (\"we\", \"us\", \"our\") collects, uses, stores and protects personal information when you use our booking and management platform.",
    "Activora helps activity providers, clubs, holiday camps, wraparound care settings, sports organisations and similar providers manage bookings, attendance, payments and communications with parents and guardians.",
    "We process personal data in accordance with the UK General Data Protection Regulation (UK GDPR), the Data Protection Act 2018, the Privacy and Electronic Communications Regulations (PECR) and applicable standards relating to children's data.",
    "Please read this policy carefully. By creating an account, completing onboarding or making a booking through Activora, you acknowledge that you have read and understood how we handle personal information.",
  ],
};

export const PRIVACY_WHO_WE_ARE = {
  paragraphs: [
    "Activora operates the Activora booking platform. For the purposes of UK data protection law, Activora is the data controller responsible for personal information processed through the platform, except where a club or provider acts as an independent controller for their own customer relationships.",
    "When you book an activity with a provider through Activora, that provider may also process your data as a separate controller for operational, safeguarding and attendance purposes. Providers are responsible for their own privacy notices where required.",
  ],
  details: [
    { label: "Platform", value: PRIVACY_CONTACT.platform },
    { label: "Contact email", value: PRIVACY_CONTACT.email },
    { label: "Registered address", value: PRIVACY_CONTACT.address },
    { label: "Country", value: PRIVACY_CONTACT.country },
  ],
};

export const PRIVACY_DATA_TABLES: PrivacyTableData[] = [
  {
    id: "parent-data",
    title: "Parent and guardian data",
    caption:
      "Information provided when you register, book activities or manage your account.",
    columns: [
      { header: "Data field", accessor: "field" },
      { header: "Purpose", accessor: "purpose" },
      { header: "Required", accessor: "required" },
    ],
    rows: [
      {
        field: "Full name",
        purpose: "Account identification, bookings and communications",
        required: "Yes",
      },
      {
        field: "Email address",
        purpose: "Login, booking confirmations and service messages",
        required: "Yes",
      },
      {
        field: "Phone number",
        purpose: "Urgent booking or safeguarding contact",
        required: "Often",
      },
      {
        field: "Emergency contact details",
        purpose: "Contact in an emergency during an activity",
        required: "Often",
      },
      {
        field: "Relationship to child",
        purpose: "Verify parental responsibility and safeguarding",
        required: "Often",
      },
      {
        field: "Account credentials",
        purpose: "Secure authentication",
        required: "Yes",
      },
      {
        field: "Booking and payment history",
        purpose: "Manage reservations, refunds and receipts",
        required: "Generated",
      },
      {
        field: "Communication preferences",
        purpose: "Respect marketing and notification choices",
        required: "Optional",
      },
      {
        field: "Reviews and feedback",
        purpose: "Improve services and display public ratings where enabled",
        required: "Optional",
      },
    ],
  },
  {
    id: "child-data",
    title: "Child data",
    caption:
      "Information about children linked to a parent or guardian account for bookings and attendance.",
    columns: [
      { header: "Data field", accessor: "field" },
      { header: "Purpose", accessor: "purpose" },
      { header: "Required", accessor: "required" },
    ],
    rows: [
      {
        field: "Full name",
        purpose: "Identify the child on registers and bookings",
        required: "Yes",
      },
      {
        field: "Date of birth / age",
        purpose: "Age-appropriate sessions and safeguarding",
        required: "Yes",
      },
      {
        field: "Medical conditions",
        purpose: "Safe participation where disclosed",
        required: "Optional",
      },
      {
        field: "Allergies",
        purpose: "Health and safety during activities",
        required: "Optional",
      },
      {
        field: "SEN / accessibility needs",
        purpose: "Reasonable adjustments and inclusion",
        required: "Optional",
      },
      {
        field: "Emergency contacts",
        purpose: "Contact if parent unavailable during session",
        required: "Often",
      },
      {
        field: "Attendance records",
        purpose: "Registers, safeguarding and billing",
        required: "Generated",
      },
      {
        field: "Photos or media",
        purpose: "Only where explicitly consented by parent/guardian",
        required: "Optional",
      },
      {
        field: "Safeguarding notes",
        purpose: "Welfare concerns raised by providers where necessary",
        required: "As needed",
      },
    ],
  },
  {
    id: "provider-data",
    title: "Provider, club and organisation data",
    caption:
      "Information from activity providers, clubs, camps and organisations using Activora.",
    columns: [
      { header: "Data field", accessor: "field" },
      { header: "Purpose", accessor: "purpose" },
      { header: "Required", accessor: "required" },
    ],
    rows: [
      {
        field: "Owner and staff names",
        purpose: "Account management and support",
        required: "Yes",
      },
      {
        field: "Business email and phone",
        purpose: "Verification, support and operational contact",
        required: "Yes",
      },
      {
        field: "Club or organisation name",
        purpose: "Public listings and customer-facing pages",
        required: "Yes",
      },
      {
        field: "Business type and categories",
        purpose: "Onboarding, search and compliance",
        required: "Yes",
      },
      {
        field: "Venue addresses",
        purpose: "Session location and parent directions",
        required: "Often",
      },
      {
        field: "Profile, branding and media",
        purpose: "Marketing pages and customer experience",
        required: "Optional",
      },
      {
        field: "Payout and billing details",
        purpose: "Processed via payment partners (e.g. Stripe Connect)",
        required: "For paid activities",
      },
      {
        field: "Subscription plan",
        purpose: "Platform access and billing",
        required: "Yes",
      },
      {
        field: "Session and activity data",
        purpose: "Booking, registers and reporting",
        required: "Generated",
      },
      {
        field: "Customer and register records",
        purpose: "Operational management by the provider",
        required: "Generated",
      },
    ],
  },
  {
    id: "technical-data",
    title: "Technical and usage data",
    caption:
      "Automatically collected when you access Activora websites and applications.",
    columns: [
      { header: "Data field", accessor: "field" },
      { header: "Purpose", accessor: "purpose" },
      { header: "Required", accessor: "required" },
    ],
    rows: [
      {
        field: "IP address",
        purpose: "Security, fraud prevention and approximate location",
        required: "Automatic",
      },
      {
        field: "Device and browser type",
        purpose: "Compatibility, diagnostics and security",
        required: "Automatic",
      },
      {
        field: "Session and authentication cookies",
        purpose: "Keep you signed in and secure sessions",
        required: "Automatic",
      },
      {
        field: "Server and application logs",
        purpose: "Troubleshooting, audit and security monitoring",
        required: "Automatic",
      },
      {
        field: "Analytics identifiers",
        purpose: "Understand usage and improve the platform",
        required: "Where enabled",
      },
      {
        field: "Error and performance reports",
        purpose: "Fix bugs and maintain reliability",
        required: "Automatic",
      },
      {
        field: "Referrer and page views",
        purpose: "Navigation analytics and product improvement",
        required: "Where enabled",
      },
    ],
  },
];

export const PRIVACY_SPECIAL_CATEGORY = {
  paragraphs: [
    "Some information you or a provider enter may relate to health, disability or safeguarding. Under UK GDPR this can be special category data.",
    "We only collect medical, allergy, SEN or accessibility information where it is necessary for safe participation, reasonable adjustments, safeguarding or legal obligations. Providers should collect the minimum information required for their activity.",
    "Where consent is the appropriate lawful basis for special category data, we rely on the parent or guardian providing that information knowingly as part of a booking or profile. You may withdraw consent for optional health data by updating your profile or contacting us, subject to legal and safeguarding limits.",
  ],
};

export const PRIVACY_USES: PrivacyListSection[] = [
  {
    title: "Account and platform services",
    items: [
      "Creating and managing user accounts for parents, providers and staff.",
      "Authenticating users and maintaining secure sessions.",
      "Enabling club onboarding, profile setup and dashboard access.",
    ],
  },
  {
    title: "Bookings and attendance",
    items: [
      "Processing activity bookings, waitlists and session registers.",
      "Sharing booking details with the relevant provider.",
      "Recording attendance for safeguarding, billing and operational needs.",
    ],
  },
  {
    title: "Payments and refunds",
    items: [
      "Facilitating card and direct debit payments through payment partners.",
      "Issuing receipts, invoices and refund processing.",
      "Managing provider payouts and platform subscription fees.",
    ],
  },
  {
    title: "Communications",
    items: [
      "Sending booking confirmations, reminders and service notifications.",
      "Delivering provider messages about sessions or schedule changes.",
      "Responding to support requests and callback enquiries.",
    ],
  },
  {
    title: "Safeguarding and fraud prevention",
    items: [
      "Investigating suspicious activity and protecting accounts.",
      "Supporting providers with welfare concerns where appropriate.",
      "Maintaining audit logs for security and compliance.",
    ],
  },
  {
    title: "Analytics and improvement",
    items: [
      "Understanding how features are used to improve Activora.",
      "Measuring performance and fixing errors.",
      "Developing new tools for providers and parents.",
    ],
  },
  {
    title: "Legal and regulatory",
    items: [
      "Complying with tax, accounting and record-keeping obligations.",
      "Responding to lawful requests from regulators or courts.",
      "Enforcing our terms and protecting our legal rights.",
    ],
  },
];

export const PRIVACY_LEGAL_BASIS: PrivacyLegalBasisRow[] = [
  {
    purpose: "Creating and managing your account",
    basis: "Contract",
    explanation:
      "Processing is necessary to provide the Activora service you sign up for.",
  },
  {
    purpose: "Processing bookings and attendance",
    basis: "Contract",
    explanation:
      "Required to deliver the booking and register features you use.",
  },
  {
    purpose: "Payment processing and refunds",
    basis: "Contract",
    explanation:
      "Necessary to take payment for activities and manage financial transactions.",
  },
  {
    purpose: "Optional marketing emails or newsletters",
    basis: "Consent",
    explanation:
      "We only send marketing where you opt in. You can unsubscribe at any time.",
  },
  {
    purpose: "Medical, allergy or accessibility information",
    basis: "Consent / Legitimate interests",
    explanation:
      "Collected where necessary for safety and inclusion, often with explicit parent input.",
  },
  {
    purpose: "Platform security and fraud prevention",
    basis: "Legitimate interests",
    explanation:
      "Protecting users, providers and the platform from misuse and unauthorised access.",
  },
  {
    purpose: "Analytics to improve Activora",
    basis: "Legitimate interests",
    explanation:
      "Understanding aggregated usage to improve reliability and user experience.",
  },
  {
    purpose: "Tax, accounting and legal record keeping",
    basis: "Legal obligation",
    explanation:
      "Retaining financial and booking records as required by UK law.",
  },
  {
    purpose: "Safeguarding and welfare concerns",
    basis: "Legitimate interests / Legal obligation",
    explanation:
      "Protecting children and meeting safeguarding duties where applicable.",
  },
];

export const PRIVACY_PAYMENTS = {
  paragraphs: [
    "Activora uses trusted payment partners to process transactions securely. Card payments are handled through Stripe, including Stripe Connect for provider payouts. Direct debit collections may be processed through GoCardless where enabled.",
    "We do not store full payment card numbers on Activora servers. Payment partners tokenise card details and process transactions on our behalf under their own privacy policies and PCI-DSS standards.",
    "We may retain transaction references, amounts, dates, refund status and limited billing metadata for accounting, dispute resolution and legal compliance.",
  ],
};

export const PRIVACY_COMMUNICATIONS = {
  paragraphs: [
    "We send transactional messages that are necessary for the service, including account verification, booking confirmations, payment receipts, schedule changes and security alerts. These are not marketing messages and cannot always be opted out of while you use the platform.",
    "Providers may send operational messages to customers about their sessions through Activora. Providers are responsible for ensuring those messages are appropriate and lawful.",
    "Marketing communications about Activora products or features are sent only with your consent. You can withdraw marketing consent through account settings where available, unsubscribe links in emails, or by contacting us.",
  ],
};

export const PRIVACY_SHARING: PrivacyListSection[] = [
  {
    title: "Activity providers and clubs",
    items: [
      "Booking, child and contact details needed to deliver the activity you booked.",
      "Attendance and register information for sessions you attend.",
    ],
  },
  {
    title: "Schools and partner organisations",
    items: [
      "Where a school or organisation uses Activora for wraparound care or clubs, limited data may be shared as configured by that organisation.",
    ],
  },
  {
    title: "Payment providers",
    items: [
      "Stripe and GoCardless receive data necessary to process payments, verify accounts and prevent fraud.",
    ],
  },
  {
    title: "Analytics and infrastructure providers",
    items: [
      "Cloud hosting, monitoring and analytics services that help us run Activora securely.",
      "These providers act as processors under contractual safeguards.",
    ],
  },
  {
    title: "Professional advisers and authorities",
    items: [
      "Lawyers, accountants or insurers where reasonably necessary.",
      "Regulators, courts or law enforcement when required by law.",
    ],
  },
];

export const PRIVACY_INTERNATIONAL_TRANSFERS = {
  paragraphs: [
    "Activora is based in the United Kingdom. Some service providers we use may process data outside the UK, including in the European Economic Area, United States or other countries.",
    "Where personal data is transferred internationally, we implement appropriate safeguards such as UK International Data Transfer Agreements, Standard Contractual Clauses or transfers to countries with adequacy decisions, as applicable.",
    "You may contact us for more information about the safeguards applied to specific transfers.",
  ],
};

export const PRIVACY_RETENTION: PrivacyRetentionRow[] = [
  {
    dataType: "Bookings and attendance records",
    period: "7 years",
    notes: "For accounting, disputes and regulatory requirements.",
  },
  {
    dataType: "Payment and transaction records",
    period: "7 years",
    notes: "As required for tax and financial reporting.",
  },
  {
    dataType: "Account profiles",
    period: "Until deletion",
    notes: "Retained while your account is active. Deleted or anonymised after a verified deletion request, subject to legal retention limits.",
  },
  {
    dataType: "Support enquiries",
    period: "24 months",
    notes: "To resolve issues and improve support quality.",
  },
  {
    dataType: "Analytics data",
    period: "26 months",
    notes: "Aggregated usage metrics; identifiers removed or shortened where possible.",
  },
];

export const PRIVACY_CHILDREN = {
  paragraphs: [
    "Activora is designed for use by parents, guardians and activity providers. Children should not create accounts or provide personal data directly without parental involvement.",
    "Parents and guardians are responsible for the accuracy of child information they enter, for consenting to bookings on a child's behalf, and for reviewing provider requirements before booking.",
    "If you believe a child has provided personal information to us without appropriate consent, please contact us and we will take steps to delete it where required.",
  ],
};

export const PRIVACY_SECURITY = {
  paragraphs: [
    "We take appropriate technical and organisational measures to protect personal information against unauthorised access, loss or misuse.",
  ],
  measures: [
    "Encryption of data in transit using TLS and encryption at rest for sensitive fields.",
    "Role-based permissions so staff and providers access only what they need.",
    "Access controls, session management and authentication safeguards.",
    "Regular backups and infrastructure monitoring.",
    "Audit logs for administrative and security-sensitive actions.",
  ],
};

export const PRIVACY_USER_RIGHTS = {
  intro:
    "Under UK GDPR you have rights in relation to your personal data. These rights are not absolute and may be limited in some circumstances, for example where we must retain records by law.",
  rights: [
    {
      title: "Right of access",
      description: "Request a copy of the personal data we hold about you.",
    },
    {
      title: "Right to rectification",
      description: "Ask us to correct inaccurate or incomplete information.",
    },
    {
      title: "Right to erasure",
      description:
        "Request deletion of your data where there is no compelling reason to continue processing.",
    },
    {
      title: "Right to data portability",
      description:
        "Receive your data in a structured, commonly used format where processing is based on consent or contract.",
    },
    {
      title: "Right to restrict processing",
      description: "Ask us to limit how we use your data in certain cases.",
    },
    {
      title: "Right to object",
      description:
        "Object to processing based on legitimate interests, including direct marketing.",
    },
    {
      title: "Right to withdraw consent",
      description:
        "Withdraw consent at any time where processing is based on consent.",
    },
    {
      title: "Right to complain",
      description:
        "Lodge a complaint with the Information Commissioner's Office (ICO) at ico.org.uk if you are unhappy with how we handle your data.",
    },
  ],
};

export const PRIVACY_COOKIES = {
  paragraphs: [
    "Activora uses cookies and similar technologies to keep you signed in, remember preferences, measure usage and improve security.",
    "Essential cookies are required for the platform to function. Analytics and optional cookies are used only where permitted by PECR and your cookie preferences.",
    "A cookie consent banner will be integrated on public pages to let you manage non-essential cookies. Until then, you can control cookies through your browser settings, though some features may not work correctly if essential cookies are blocked.",
  ],
  categories: [
    {
      name: "Strictly necessary",
      description: "Required for login, security and core booking flows.",
    },
    {
      name: "Functional",
      description: "Remember preferences such as language or saved filters.",
    },
    {
      name: "Analytics",
      description: "Help us understand how the platform is used.",
    },
  ],
};

export const PRIVACY_UPDATES = {
  paragraphs: [
    "We may update this Privacy Policy from time to time to reflect changes in law, our services or how we process data.",
    "When we make material changes, we will update the effective date and version number at the top of this page and, where appropriate, notify you by email or in-app notice.",
    "Continued use of Activora after changes take effect constitutes acceptance of the updated policy, except where further consent is required by law.",
  ],
};

export const PRIVACY_VERSION_HISTORY: PrivacyVersionEntry[] = [
  {
    version: "1.0.0",
    date: "2026-06-22",
    summary:
      "Initial publication of the Activora Privacy Policy covering parents, children, providers, payments, cookies and UK GDPR rights.",
  },
];

export const PRIVACY_ACCEPTANCE_LABEL =
  "I have read and agree to the Activora Privacy Policy.";
