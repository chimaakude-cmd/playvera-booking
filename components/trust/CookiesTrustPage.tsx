"use client";

import Link from "next/link";
import {
  TrustLegalPageLayout,
  TrustLegalSection,
} from "@/components/trust/TrustLegalPageLayout";

export function CookiesTrustPage() {
  return (
    <TrustLegalPageLayout
      eyebrow="Legal"
      title="Cookie Policy"
      subtitle="How Activora uses cookies and similar technologies on our website and platform."
      heroExtra={
        <p className="text-sm text-teal-100/90">Last updated: 22 June 2026</p>
      }
    >
      <TrustLegalSection id="what-are-cookies" title="What are cookies?">
        <p>
          Cookies are small text files stored on your device when you visit a
          website. They help us remember your preferences, keep you signed in, and
          understand how the platform is used so we can improve it.
        </p>
      </TrustLegalSection>

      <TrustLegalSection id="cookies-we-use" title="Cookies we use">
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <strong>Essential cookies</strong> — required for authentication,
            security and core booking functionality. These cannot be switched off.
          </li>
          <li>
            <strong>Functional cookies</strong> — remember language preferences,
            accessibility settings and session state.
          </li>
          <li>
            <strong>Analytics cookies</strong> — help us understand usage patterns
            in aggregate. We use these to improve performance and navigation.
          </li>
        </ul>
      </TrustLegalSection>

      <TrustLegalSection id="third-party" title="Third-party cookies">
        <p>
          Payment providers (Stripe, GoCardless) may set cookies during checkout
          and account connection flows. These are governed by their respective
          privacy policies. Embedded content, such as maps or video, may also set
          cookies from third parties.
        </p>
      </TrustLegalSection>

      <TrustLegalSection id="managing" title="Managing cookies">
        <p>
          You can control cookies through your browser settings. Blocking essential
          cookies may prevent you from signing in or completing bookings. For more
          on how we handle personal data, see our{" "}
          <Link href="/privacy" className="font-semibold text-teal-700 dark:text-teal-400">
            Privacy Policy
          </Link>
          .
        </p>
      </TrustLegalSection>
    </TrustLegalPageLayout>
  );
}
