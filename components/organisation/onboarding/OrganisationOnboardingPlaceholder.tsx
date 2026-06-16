"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Logo } from "@/components/branding";
import { OwnerAccountFields } from "@/components/onboarding/OwnerAccountFields";
import type { OnboardingOwner } from "@/lib/club-onboarding/types";
import { validateOwnerAccount } from "@/lib/onboarding/validate-owner";
import { DEFAULT_PHONE_COUNTRY } from "@/lib/phone";

const ORGANISATION_OWNER_DRAFT_KEY = "activora-organisation-owner-draft";

function PlanField({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-zinc-100 bg-zinc-50/80 px-4 py-3">
      <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold text-zinc-800">{value}</p>
    </div>
  );
}

function createEmptyOwner(): OnboardingOwner {
  return {
    firstName: "",
    middleName: "",
    lastName: "",
    email: "",
    phone: "",
    phoneCountry: DEFAULT_PHONE_COUNTRY,
    password: "",
  };
}

function loadOwnerDraft(): OnboardingOwner {
  if (typeof window === "undefined") {
    return createEmptyOwner();
  }

  try {
    const raw = localStorage.getItem(ORGANISATION_OWNER_DRAFT_KEY);
    if (!raw) {
      return createEmptyOwner();
    }
    return { ...createEmptyOwner(), ...(JSON.parse(raw) as Partial<OnboardingOwner>) };
  } catch {
    return createEmptyOwner();
  }
}

function saveOwnerDraft(owner: OnboardingOwner): void {
  if (typeof window === "undefined") {
    return;
  }
  localStorage.setItem(ORGANISATION_OWNER_DRAFT_KEY, JSON.stringify(owner));
}

export function OrganisationOnboardingPlaceholder() {
  const [owner, setOwner] = useState<OnboardingOwner | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [ownerComplete, setOwnerComplete] = useState(false);

  useEffect(() => {
    const draft = loadOwnerDraft();
    setOwner(draft);
    setOwnerComplete(validateOwnerAccount(draft).length === 0 && draft.firstName !== "");
  }, []);

  function updateOwner(updates: Partial<OnboardingOwner>) {
    if (!owner) {
      return;
    }
    const next = { ...owner, ...updates };
    setOwner(next);
    saveOwnerDraft(next);
    setErrors([]);
  }

  function handleContinue() {
    if (!owner) {
      return;
    }

    const validationErrors = validateOwnerAccount(owner);
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      setOwnerComplete(false);
      return;
    }

    saveOwnerDraft(owner);
    setErrors([]);
    setOwnerComplete(true);
  }

  if (!owner) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f6f7f9]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-200 border-t-violet-600" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#f6f7f9] px-4 py-8 sm:py-12">
      <div className="w-full max-w-2xl">
        <div className="text-center">
          <Logo size="desktop" />
        </div>

        <div className="mt-8 rounded-2xl border border-zinc-200/80 bg-white p-8 shadow-sm sm:p-10">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-50 text-3xl">
            🏢
          </span>

          <h1 className="mt-6 text-center text-2xl font-bold tracking-tight text-zinc-900">
            Franchisor onboarding
          </h1>

          <p className="mt-3 text-center text-sm leading-relaxed text-zinc-500">
            Set up your head office dashboard to manage franchisee clubs,
            locations, staff teams, and organisation-wide reporting — all from
            one place.
          </p>

          <section className="mt-8 rounded-2xl border border-zinc-200 bg-zinc-50/40 p-5 text-left">
            <h2 className="text-sm font-semibold text-zinc-900">
              Step 1 — Account owner
            </h2>
            <p className="mt-1 text-xs leading-relaxed text-zinc-500">
              This owner account will have full control of the franchisor dashboard.
            </p>

            <div className="mt-4">
              <OwnerAccountFields
                owner={owner}
                onChange={updateOwner}
                loginHint={
                  <>
                    You&apos;ll use this email and password to sign in at{" "}
                    <strong>/organisation/login</strong> once franchisor onboarding is
                    live.
                  </>
                }
              />
            </div>

            {errors.length > 0 ? (
              <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
                <p className="text-sm font-medium text-red-800">
                  Please fix the following before continuing:
                </p>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-red-700">
                  {errors.map((error) => (
                    <li key={error}>{error}</li>
                  ))}
                </ul>
              </div>
            ) : null}

            <button
              type="button"
              onClick={handleContinue}
              className="mt-4 w-full rounded-xl bg-violet-700 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-violet-800 sm:w-auto"
            >
              Continue
            </button>

            {ownerComplete ? (
              <p className="mt-3 text-xs font-medium text-emerald-700">
                Owner details saved. Full franchisor onboarding is coming soon.
              </p>
            ) : null}
          </section>

          {ownerComplete ? (
            <>
              <p className="mt-6 text-center text-sm leading-relaxed text-zinc-500">
                As a franchisor, you can create franchisee clubs directly from your
                dashboard — franchisees don&apos;t always need to self-signup. Invite
                club managers when you&apos;re ready for them to take over day-to-day
                operations.
              </p>

              <p className="mt-4 inline-flex rounded-full bg-violet-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-violet-700">
                Coming soon
              </p>

              <section className="mt-8 rounded-2xl border border-violet-100 bg-violet-50/40 p-5">
                <h2 className="text-sm font-semibold text-violet-900">
                  Franchisor plans
                </h2>
                <p className="mt-1 text-xs leading-relaxed text-violet-700/80">
                  Pricing placeholder — final plans and fees are not yet confirmed.
                  Managing multiple clubs adds platform costs on top of individual
                  club subscriptions.
                </p>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <PlanField label="Plan name" value="Franchisor Growth (placeholder)" />
                  <PlanField label="Monthly fee" value="From £299 / month (TBC)" />
                  <PlanField label="Included clubs" value="5 franchisee clubs" />
                  <PlanField label="Extra club fee" value="£49 / club / month (TBC)" />
                  <PlanField
                    label="Activora platform fee"
                    value="2.5% on franchisee bookings (TBC)"
                  />
                  <PlanField label="Billing status" value="Trial — not yet live" />
                </div>

                <p className="mt-4 text-xs leading-relaxed text-violet-700/70">
                  Additional platform fees apply when managing multiple clubs under
                  one franchisor account. These cover group reporting, permission
                  controls, and centralised billing — exact pricing will be confirmed
                  before launch.
                </p>
              </section>
            </>
          ) : null}

          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/organisation/login"
              className="inline-flex w-full items-center justify-center rounded-xl bg-violet-700 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-violet-800 sm:w-auto"
            >
              Franchisor login (dev)
            </Link>
            <Link
              href="/signup"
              className="inline-flex w-full items-center justify-center rounded-xl border border-zinc-200 bg-white px-5 py-2.5 text-sm font-semibold text-zinc-700 transition-colors hover:border-zinc-300 hover:bg-zinc-50 sm:w-auto"
            >
              Back to sign up
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
