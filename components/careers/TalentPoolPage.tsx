"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { SiteFooter } from "@/components/SiteFooter";
import { TalentPoolForm } from "@/components/careers/TalentPoolForm";
import { HomeHeader } from "@/components/home/HomeHeader";
import { LazySupportLauncher } from "@/components/support/LazySupportLauncher";

export function TalentPoolPage() {
  return (
    <div className="flex min-h-full flex-col bg-white text-zinc-900">
      <HomeHeader />

      <main className="flex-1 bg-[#f6f7f9]">
        <div className="mx-auto max-w-lg px-4 py-12 sm:px-6">
          <Link
            href="/careers"
            className="inline-flex items-center gap-2 text-sm font-medium text-teal-700 hover:text-teal-900"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Back to careers
          </Link>
          <div className="mt-8 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
            <TalentPoolForm />
          </div>
        </div>
      </main>

      <SiteFooter />
      <LazySupportLauncher />
    </div>
  );
}
