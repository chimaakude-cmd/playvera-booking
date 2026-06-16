import type { ApplicationNote, CareerJob, JobApplication } from "./types";

export const CAREERS_JOBS_KEY = "activora-careers-jobs";
export const CAREERS_APPLICATIONS_KEY = "activora-careers-applications";
export const CAREERS_TALENT_POOL_KEY = "activora-careers-talent-pool";
export const CAREERS_APPLICATION_NOTES_KEY = "activora-careers-application-notes";

/** Max data-URL CV size stored in localStorage (bytes). */
export const MAX_CV_DATA_URL_BYTES = 500_000;

export const SEED_CAREER_JOBS: CareerJob[] = [
  {
    id: "job_demo_001",
    slug: "customer-success-manager",
    title: "Customer Success Manager",
    department: "customer_success",
    location: "London, UK",
    salary: "£35,000 – £45,000",
    contractType: "full_time",
    workLocation: "hybrid",
    description:
      "Help clubs, schools and activity providers get the most from Activora. You'll onboard new customers, run training sessions, and be their champion as they grow bookings and engagement.",
    responsibilities: [
      "Onboard new club and school customers with tailored setup plans",
      "Run product training webinars and 1:1 coaching sessions",
      "Monitor account health and proactively resolve issues",
      "Gather product feedback and share insights with the product team",
      "Build relationships that drive retention and expansion",
    ],
    requirements: [
      "2+ years in customer success, account management, or SaaS support",
      "Excellent communication — comfortable on video calls with busy club owners",
      "Organised and empathetic; you enjoy solving problems for people",
      "Experience with CRM tools and basic data analysis",
      "Right to work in the UK",
    ],
    benefits: [
      "25 days paid leave plus bank holidays",
      "Company sick pay from day one",
      "£500 annual learning budget",
      "Flexible hybrid working (2 days in our London hub)",
      "Private healthcare after probation",
    ],
    status: "open",
    featuredOnHomepage: true,
    views: 142,
    postedAt: "2026-06-01T09:00:00.000Z",
    createdAt: "2026-06-01T09:00:00.000Z",
    updatedAt: "2026-06-01T09:00:00.000Z",
  },
  {
    id: "job_demo_002",
    slug: "full-stack-engineer",
    title: "Full Stack Engineer",
    department: "engineering",
    location: "Manchester, UK",
    salary: "£50,000 – £65,000",
    contractType: "full_time",
    workLocation: "hybrid",
    description:
      "Build the platform that powers bookings for thousands of families. You'll work across our Next.js frontend, API layer, and integrations with Stripe, email, and more.",
    responsibilities: [
      "Ship features across the Activora web app and admin tools",
      "Write clean, tested TypeScript in a modern Next.js codebase",
      "Collaborate on architecture decisions and code reviews",
      "Improve performance, accessibility, and developer experience",
      "Participate in on-call rotation (light, with fair rotation)",
    ],
    requirements: [
      "3+ years building production web applications",
      "Strong TypeScript and React experience",
      "Comfortable with REST APIs, SQL, and git workflows",
      "Interest in edtech, sport, or family-focused products",
      "Right to work in the UK",
    ],
    benefits: [
      "25 days paid leave plus bank holidays",
      "Remote-friendly with Manchester hub access",
      "£1,000 annual learning budget",
      "Latest MacBook Pro and home office stipend",
      "Equity options after 12 months",
    ],
    status: "open",
    featuredOnHomepage: false,
    views: 89,
    postedAt: "2026-06-08T10:00:00.000Z",
    createdAt: "2026-06-08T10:00:00.000Z",
    updatedAt: "2026-06-08T10:00:00.000Z",
  },
  {
    id: "job_demo_003",
    slug: "sales-executive",
    title: "Sales Executive",
    department: "sales",
    location: "Birmingham, UK",
    salary: "£30,000 – £40,000 + commission",
    contractType: "full_time",
    workLocation: "office",
    description:
      "Bring Activora to clubs, schools and activity providers across the Midlands. You'll run demos, close deals, and help grow the community of providers on our platform.",
    responsibilities: [
      "Prospect and qualify leads from inbound and outbound channels",
      "Run product demos tailored to football clubs, dance schools, and more",
      "Manage pipeline in CRM and hit monthly targets",
      "Work with marketing on campaigns and event presence",
      "Provide market feedback to shape our go-to-market strategy",
    ],
    requirements: [
      "1+ years B2B sales experience, ideally in SaaS or sport/education",
      "Confident presenter — you enjoy talking to club owners and head teachers",
      "Self-motivated with a track record of hitting targets",
      "Full UK driving licence (regional travel required)",
      "Right to work in the UK",
    ],
    benefits: [
      "Uncapped commission on closed deals",
      "25 days paid leave plus bank holidays",
      "Company car allowance after probation",
      "Sales training and mentorship programme",
      "Team socials and sport industry events",
    ],
    status: "open",
    featuredOnHomepage: false,
    views: 56,
    postedAt: "2026-06-12T08:00:00.000Z",
    createdAt: "2026-06-12T08:00:00.000Z",
    updatedAt: "2026-06-12T08:00:00.000Z",
  },
];

export const SEED_JOB_APPLICATIONS: JobApplication[] = [
  {
    id: "app_demo_001",
    jobId: "job_demo_001",
    jobTitle: "Customer Success Manager",
    candidateName: "Emma Richardson",
    candidateEmail: "emma.richardson@example.com",
    candidatePhone: "07700 900123",
    cvDataUrl: null,
    cvFileName: "emma-richardson-cv.pdf",
    coverNote:
      "I've spent three years in SaaS customer success and love helping small businesses adopt new tools.",
    linkedInUrl: "https://linkedin.com/in/emmarichardson",
    availability: "4 weeks notice",
    rightToWork: true,
    status: "reviewing",
    createdAt: "2026-06-13T14:20:00.000Z",
    updatedAt: "2026-06-14T09:00:00.000Z",
  },
];

export const SEED_APPLICATION_NOTES: ApplicationNote[] = [
  {
    id: "appnote_demo_001",
    applicationId: "app_demo_001",
    authorId: "admin_support",
    authorName: "Support Admin",
    body: "Strong SaaS background — schedule intro call.",
    createdAt: "2026-06-14T09:00:00.000Z",
  },
];
