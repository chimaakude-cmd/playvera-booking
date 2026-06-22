"use client";

import Link from "next/link";
import { SiteFooter } from "@/components/SiteFooter";
import { HomeHeader } from "@/components/home/HomeHeader";
import { LazySupportLauncher } from "@/components/support/LazySupportLauncher";
import { TransparencyHero } from "@/components/transparency/TransparencyHero";
import { DataRequestCTA } from "@/components/privacy/DataRequestCTA";
import { PrivacyNav } from "@/components/privacy/PrivacyNav";
import { PrivacySection } from "@/components/privacy/PrivacySection";
import { PrivacyTable } from "@/components/privacy/PrivacyTable";
import { VersionHistory } from "@/components/privacy/VersionHistory";
import {
  PRIVACY_CHILDREN,
  PRIVACY_COMMUNICATIONS,
  PRIVACY_CONTACT,
  PRIVACY_COOKIES,
  PRIVACY_DATA_TABLES,
  PRIVACY_INTERNATIONAL_TRANSFERS,
  PRIVACY_INTRODUCTION,
  PRIVACY_LEGAL_BASIS,
  PRIVACY_NAV_ITEMS,
  PRIVACY_PAYMENTS,
  PRIVACY_POLICY_EFFECTIVE_DATE,
  PRIVACY_POLICY_VERSION,
  PRIVACY_RETENTION,
  PRIVACY_SECURITY,
  PRIVACY_SHARING,
  PRIVACY_SPECIAL_CATEGORY,
  PRIVACY_UPDATES,
  PRIVACY_USES,
  PRIVACY_USER_RIGHTS,
  PRIVACY_VERSION_HISTORY,
  PRIVACY_WHO_WE_ARE,
} from "@/constants/privacy";

function formatEffectiveDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function PrivacyPage() {
  const effectiveDate = formatEffectiveDate(PRIVACY_POLICY_EFFECTIVE_DATE);

  return (
    <div className="flex min-h-full flex-col bg-white text-zinc-900 print:bg-white dark:bg-zinc-950 dark:text-zinc-100">
      <HomeHeader />

      <main className="flex-1">
        <TransparencyHero
          eyebrow="Legal"
          title="Privacy Policy"
          subtitle="How Activora collects, uses and protects personal information for parents, children and activity providers."
        >
          <p className="text-sm text-teal-100/90">
            Version {PRIVACY_POLICY_VERSION} · Effective {effectiveDate}
          </p>
        </TransparencyHero>

        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <PrivacyNav items={PRIVACY_NAV_ITEMS} variant="mobile" />

          <div className="grid gap-10 py-10 lg:grid-cols-[minmax(0,1fr)_16rem] lg:gap-12 print:block">
            <article className="min-w-0 print:max-w-none">
              <PrivacySection id="introduction" title="1. Introduction">
                {PRIVACY_INTRODUCTION.paragraphs.map((paragraph) => (
                  <p key={paragraph.slice(0, 40)}>{paragraph}</p>
                ))}
              </PrivacySection>

              <PrivacySection id="who-we-are" title="2. Who we are">
                {PRIVACY_WHO_WE_ARE.paragraphs.map((paragraph) => (
                  <p key={paragraph.slice(0, 40)}>{paragraph}</p>
                ))}
                <dl className="mt-4 grid gap-3 rounded-xl border border-zinc-200 bg-zinc-50/80 p-4 dark:border-zinc-700 dark:bg-zinc-900/40 sm:grid-cols-2">
                  {PRIVACY_WHO_WE_ARE.details.map((detail) => (
                    <div key={detail.label}>
                      <dt className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                        {detail.label}
                      </dt>
                      <dd className="mt-1 text-sm text-zinc-800 dark:text-zinc-100">
                        {detail.label === "Contact email" ? (
                          <a
                            href={`mailto:${detail.value}`}
                            className="text-teal-700 underline underline-offset-2 hover:text-teal-900 dark:text-teal-300"
                          >
                            {detail.value}
                          </a>
                        ) : (
                          detail.value
                        )}
                      </dd>
                    </div>
                  ))}
                </dl>
              </PrivacySection>

              <PrivacySection
                id="information-we-collect"
                title="3. Information we collect"
              >
                <p>
                  The tables below summarise the main categories of personal
                  information processed through Activora. We collect only what is
                  needed for bookings, safeguarding, payments and platform
                  operation.
                </p>
                {PRIVACY_DATA_TABLES.map((table) => (
                  <div key={table.id} className="mt-6">
                    <h3
                      id={`${table.id}-heading`}
                      className="text-base font-semibold text-zinc-900 dark:text-zinc-50"
                    >
                      {table.title}
                    </h3>
                    <PrivacyTable
                      caption={table.caption}
                      columns={table.columns}
                      rows={table.rows}
                      labelledBy={`${table.id}-heading`}
                    />
                  </div>
                ))}
              </PrivacySection>

              <PrivacySection
                id="special-category-data"
                title="4. Special category data"
              >
                {PRIVACY_SPECIAL_CATEGORY.paragraphs.map((paragraph) => (
                  <p key={paragraph.slice(0, 40)}>{paragraph}</p>
                ))}
              </PrivacySection>

              <PrivacySection
                id="how-we-use-information"
                title="5. How we use information"
              >
                <p>
                  We use personal information for the following purposes, depending
                  on your role and how you interact with Activora:
                </p>
                <div className="space-y-6">
                  {PRIVACY_USES.map((section) => (
                    <div key={section.title}>
                      <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
                        {section.title}
                      </h3>
                      <ul className="mt-2 list-disc space-y-1 pl-5">
                        {section.items.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </PrivacySection>

              <PrivacySection id="legal-basis" title="6. Legal basis">
                <p>
                  Under UK GDPR we must identify a lawful basis for processing
                  personal data. The table below summarises the main bases we rely
                  on:
                </p>
                <PrivacyTable
                  columns={[
                    { header: "Purpose", accessor: "purpose" },
                    { header: "Lawful basis", accessor: "basis" },
                    { header: "Explanation", accessor: "explanation" },
                  ]}
                  rows={PRIVACY_LEGAL_BASIS}
                />
              </PrivacySection>

              <PrivacySection id="payments" title="7. Payments">
                {PRIVACY_PAYMENTS.paragraphs.map((paragraph) => (
                  <p key={paragraph.slice(0, 40)}>{paragraph}</p>
                ))}
              </PrivacySection>

              <PrivacySection id="communications" title="8. Communications">
                {PRIVACY_COMMUNICATIONS.paragraphs.map((paragraph) => (
                  <p key={paragraph.slice(0, 40)}>{paragraph}</p>
                ))}
              </PrivacySection>

              <PrivacySection id="data-sharing" title="9. Data sharing">
                <p>
                  We do not sell personal information. We share data only as
                  described below:
                </p>
                <div className="space-y-6">
                  {PRIVACY_SHARING.map((section) => (
                    <div key={section.title}>
                      <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
                        {section.title}
                      </h3>
                      <ul className="mt-2 list-disc space-y-1 pl-5">
                        {section.items.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </PrivacySection>

              <PrivacySection
                id="international-transfers"
                title="10. International transfers"
              >
                {PRIVACY_INTERNATIONAL_TRANSFERS.paragraphs.map((paragraph) => (
                  <p key={paragraph.slice(0, 40)}>{paragraph}</p>
                ))}
              </PrivacySection>

              <PrivacySection id="data-retention" title="11. Data retention">
                <p>
                  We keep personal information only for as long as necessary for
                  the purposes described in this policy:
                </p>
                <PrivacyTable
                  columns={[
                    { header: "Data type", accessor: "dataType" },
                    { header: "Retention period", accessor: "period" },
                    { header: "Notes", accessor: "notes" },
                  ]}
                  rows={PRIVACY_RETENTION}
                />
              </PrivacySection>

              <PrivacySection id="childrens-privacy" title="12. Children's privacy">
                {PRIVACY_CHILDREN.paragraphs.map((paragraph) => (
                  <p key={paragraph.slice(0, 40)}>{paragraph}</p>
                ))}
              </PrivacySection>

              <PrivacySection id="security" title="13. Security">
                {PRIVACY_SECURITY.paragraphs.map((paragraph) => (
                  <p key={paragraph.slice(0, 40)}>{paragraph}</p>
                ))}
                <ul className="list-disc space-y-1 pl-5">
                  {PRIVACY_SECURITY.measures.map((measure) => (
                    <li key={measure}>{measure}</li>
                  ))}
                </ul>
                <p>
                  Learn more on our{" "}
                  <Link
                    href="/security"
                    className="font-medium text-teal-700 underline underline-offset-2 hover:text-teal-900 dark:text-teal-300"
                  >
                    Security page
                  </Link>
                  .
                </p>
              </PrivacySection>

              <PrivacySection id="user-rights" title="14. Your rights">
                <p>{PRIVACY_USER_RIGHTS.intro}</p>
                <dl className="mt-4 space-y-4">
                  {PRIVACY_USER_RIGHTS.rights.map((right) => (
                    <div key={right.title}>
                      <dt className="font-semibold text-zinc-900 dark:text-zinc-50">
                        {right.title}
                      </dt>
                      <dd className="mt-1">{right.description}</dd>
                    </div>
                  ))}
                </dl>
              </PrivacySection>

              <PrivacySection id="cookies" title="15. Cookies">
                {PRIVACY_COOKIES.paragraphs.map((paragraph) => (
                  <p key={paragraph.slice(0, 40)}>{paragraph}</p>
                ))}
                <ul className="mt-2 space-y-3">
                  {PRIVACY_COOKIES.categories.map((category) => (
                    <li key={category.name}>
                      <span className="font-semibold text-zinc-900 dark:text-zinc-50">
                        {category.name}:
                      </span>{" "}
                      {category.description}
                    </li>
                  ))}
                </ul>
              </PrivacySection>

              <PrivacySection id="data-requests" title="16. Data requests">
                <p>
                  To exercise your privacy rights, contact us using the form below
                  or email{" "}
                  <a
                    href={`mailto:${PRIVACY_CONTACT.email}`}
                    className="font-medium text-teal-700 underline underline-offset-2 hover:text-teal-900 dark:text-teal-300"
                  >
                    {PRIVACY_CONTACT.email}
                  </a>
                  . We aim to respond within one month, as required by UK GDPR.
                </p>
                <DataRequestCTA />
              </PrivacySection>

              <PrivacySection id="contact" title="17. Contact details">
                <p>
                  For privacy questions, data requests or concerns about this
                  policy, contact:
                </p>
                <address className="not-italic rounded-xl border border-zinc-200 bg-zinc-50/80 p-4 dark:border-zinc-700 dark:bg-zinc-900/40">
                  <strong className="text-zinc-900 dark:text-zinc-50">
                    {PRIVACY_CONTACT.platform}
                  </strong>
                  <br />
                  {PRIVACY_CONTACT.address}
                  <br />
                  {PRIVACY_CONTACT.country}
                  <br />
                  <a
                    href={`mailto:${PRIVACY_CONTACT.email}`}
                    className="mt-2 inline-block text-teal-700 underline underline-offset-2 hover:text-teal-900 dark:text-teal-300"
                  >
                    {PRIVACY_CONTACT.email}
                  </a>
                </address>
              </PrivacySection>

              <PrivacySection id="updates" title="18. Updates to this policy">
                {PRIVACY_UPDATES.paragraphs.map((paragraph) => (
                  <p key={paragraph.slice(0, 40)}>{paragraph}</p>
                ))}
              </PrivacySection>

              <VersionHistory
                entries={PRIVACY_VERSION_HISTORY}
                currentVersion={PRIVACY_POLICY_VERSION}
              />
            </article>

            <aside className="hidden lg:block print:hidden">
              <PrivacyNav items={PRIVACY_NAV_ITEMS} variant="desktop" />
            </aside>
          </div>
        </div>
      </main>

      <div className="print:hidden">
        <SiteFooter />
        <LazySupportLauncher />
      </div>
    </div>
  );
}
