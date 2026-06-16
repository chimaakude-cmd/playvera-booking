"use client";

import Link from "next/link";
import { Logo } from "@/components/branding";
import { OwnerAccountFields } from "@/components/onboarding/OwnerAccountFields";
import type { OnboardingOwner } from "@/lib/club-onboarding/types";
import { validateOwnerAccount } from "@/lib/onboarding/validate-owner";
import { ACTIVORA_ACTION, ACTIVORA_PRIMARY } from "@/lib/home/constants";
import { DEFAULT_PHONE_COUNTRY } from "@/lib/phone";
import { useEffect, useState } from "react";

const ENTERPRISE_OWNER_DRAFT_KEY = "activora-enterprise-owner-draft";

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
    const raw = localStorage.getItem(ENTERPRISE_OWNER_DRAFT_KEY);
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
  localStorage.setItem(ENTERPRISE_OWNER_DRAFT_KEY, JSON.stringify(owner));
}

export function EnterpriseOnboardingPlaceholder() {
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
      <div className="flex min-h-screen items-center justify-center bg-[#F8FAFC]">
        <div
          className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200"
          style={{ borderTopColor: ACTIVORA_ACTION }}
        />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#F8FAFC] px-4 py-8 sm:py-12">
      <div className="w-full max-w-2xl">
        <div className="text-center">
          <Logo size="desktop" />
        </div>

        <div className="mt-8 rounded-[20px] border border-slate-200 bg-white p-8 shadow-sm sm:p-10">
          <span
            className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl text-3xl text-white"
            style={{ backgroundColor: ACTIVORA_ACTION }}
          >
            🏛️
          </span>

          <h1
            className="mt-6 text-center text-2xl font-bold tracking-tight sm:text-3xl"
            style={{ color: ACTIVORA_PRIMARY }}
          >
            Enterprise onboarding
          </h1>

          <p className="mt-3 text-center text-sm leading-relaxed text-slate-600">
            Set up your organisation dashboard for councils, trusts, multi-site
            operators and larger programmes — with centralised reporting, permissions
            and billing.
          </p>

          <section className="mt-8 rounded-[20px] border border-slate-200 bg-slate-50/60 p-5 text-left">
            <h2 className="text-sm font-semibold" style={{ color: ACTIVORA_PRIMARY }}>
              Step 1 — Account owner
            </h2>
            <p className="mt-1 text-xs leading-relaxed text-slate-500">
              This owner account will administer your enterprise organisation on
              Activora.
            </p>

            <div className="mt-4">
              <OwnerAccountFields
                owner={owner}
                onChange={updateOwner}
                loginHint="You'll use this email and password to sign in once enterprise onboarding is live."
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
              className="mt-4 w-full rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 sm:w-auto"
              style={{ backgroundColor: ACTIVORA_ACTION }}
            >
              Continue
            </button>

            {ownerComplete ? (
              <p className="mt-3 text-xs font-medium text-emerald-700">
                Owner details saved. Full enterprise onboarding is coming soon.
              </p>
            ) : null}
          </section>

          {ownerComplete ? (
            <>
              <p className="mt-6 text-center text-sm leading-relaxed text-slate-600">
                Our team will help you configure sites, roles and integrations for
                your organisation. Dedicated onboarding support is included with
                Enterprise plans.
              </p>

              <p
                className="mt-4 inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-600"
              >
                Coming soon
              </p>
            </>
          ) : null}

          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/contact?topic=enterprise"
              className="inline-flex w-full items-center justify-center rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 sm:w-auto"
              style={{ backgroundColor: ACTIVORA_ACTION }}
            >
              Talk to sales
            </Link>
            <Link
              href="/get-started"
              className="inline-flex w-full items-center justify-center rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-[#0F172A] transition-colors hover:border-slate-300 sm:w-auto"
            >
              Back to account types
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
