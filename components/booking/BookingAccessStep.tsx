"use client";

import Link from "next/link";
import { LogIn, UserPlus, UserRound } from "lucide-react";
import {
  buildParentLoginUrl,
  buildParentSignupUrl,
} from "@/lib/booking-flow/redirect";

type BookingAccessStepProps = {
  sessionId: string;
  onSelectGuest: () => void;
};

const cardClassName =
  "flex w-full items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 text-left transition-all hover:border-blue-200 hover:bg-blue-50/40";

export function BookingAccessStep({
  sessionId,
  onSelectGuest,
}: BookingAccessStepProps) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-[#0F172A]">How would you like to book?</h2>
        <p className="mt-1 text-sm text-slate-600">
          Sign in to use saved child profiles, or continue as a guest.
        </p>
      </div>

      <Link href={buildParentLoginUrl(sessionId)} className={cardClassName}>
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-[#2563EB]">
          <LogIn className="h-5 w-5" aria-hidden />
        </span>
        <span>
          <span className="block text-sm font-semibold text-[#0F172A]">
            Log in as parent
          </span>
          <span className="mt-0.5 block text-xs text-slate-500">
            Use saved children and return here after sign in
          </span>
        </span>
      </Link>

      <Link href={buildParentSignupUrl(sessionId)} className={cardClassName}>
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
          <UserPlus className="h-5 w-5" aria-hidden />
        </span>
        <span>
          <span className="block text-sm font-semibold text-[#0F172A]">
            Sign up as parent
          </span>
          <span className="mt-0.5 block text-xs text-slate-500">
            Create an account and return to this booking
          </span>
        </span>
      </Link>

      <button type="button" onClick={onSelectGuest} className={cardClassName}>
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
          <UserRound className="h-5 w-5" aria-hidden />
        </span>
        <span>
          <span className="block text-sm font-semibold text-[#0F172A]">
            Continue as guest
          </span>
          <span className="mt-0.5 block text-xs text-slate-500">
            No account needed — enter details manually
          </span>
        </span>
      </button>
    </div>
  );
}
