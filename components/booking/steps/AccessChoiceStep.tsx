"use client";

import Link from "next/link";
import { useEffect } from "react";
import { readAuthSession } from "@/lib/auth/session";
import {
  buildParentLoginUrl,
  buildParentSignupUrl,
} from "@/lib/booking-flow/redirect";
import type { BookingAccessMode } from "@/lib/booking-flow/types";

type AccessChoiceStepProps = {
  sessionId: string;
  waitlist?: boolean;
  accessMode: BookingAccessMode;
  onSelect: (mode: BookingAccessMode) => void;
  onContinue: () => void;
};

export function AccessChoiceStep({
  sessionId,
  waitlist = false,
  accessMode,
  onSelect,
  onContinue,
}: AccessChoiceStepProps) {
  const session = readAuthSession();
  const isLoggedIn = session?.role === "parent";

  useEffect(() => {
    if (isLoggedIn && accessMode !== "logged_in") {
      onSelect("logged_in");
    }
  }, [isLoggedIn, accessMode, onSelect]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-zinc-900">
          {waitlist ? "Join the waitlist" : "How would you like to continue?"}
        </h2>
        <p className="mt-1 text-sm text-zinc-500">
          {waitlist
            ? "Sign in to use saved child profiles, or continue as a guest."
            : "Log in, create an account, or book as a guest."}
        </p>
      </div>

      {isLoggedIn ? (
        <div className="rounded-xl border border-teal-200 bg-teal-50/60 px-4 py-4">
          <p className="text-sm font-medium text-teal-900">
            Signed in as {session?.name}
          </p>
          <p className="mt-1 text-xs text-teal-700">
            Your saved children and profile details will be available on the next
            step.
          </p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-3">
          <Link
            href={buildParentLoginUrl(sessionId, waitlist)}
            className="rounded-xl border border-zinc-200 bg-white p-4 text-left transition-colors hover:border-zinc-300 hover:bg-zinc-50"
          >
            <p className="text-sm font-semibold text-zinc-900">Log in</p>
            <p className="mt-1 text-xs text-zinc-500">
              Use saved children and profile
            </p>
          </Link>
          <Link
            href={buildParentSignupUrl(sessionId, waitlist)}
            className="rounded-xl border border-zinc-200 bg-white p-4 text-left transition-colors hover:border-zinc-300 hover:bg-zinc-50"
          >
            <p className="text-sm font-semibold text-zinc-900">Sign up</p>
            <p className="mt-1 text-xs text-zinc-500">
              Create a parent account first
            </p>
          </Link>
          <button
            type="button"
            onClick={() => onSelect("guest")}
            className={`rounded-xl border p-4 text-left transition-colors ${
              accessMode === "guest"
                ? "border-zinc-900 bg-zinc-50"
                : "border-zinc-200 bg-white hover:border-zinc-300 hover:bg-zinc-50"
            }`}
          >
            <p className="text-sm font-semibold text-zinc-900">
              Continue as guest
            </p>
            <p className="mt-1 text-xs text-zinc-500">
              Enter details manually each time
            </p>
          </button>
        </div>
      )}

      <button
        type="button"
        onClick={onContinue}
        className="rounded-lg bg-black px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-zinc-800"
      >
        Continue
      </button>
    </div>
  );
}
