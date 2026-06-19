import Link from "next/link";
import type { ReactNode } from "react";
import { Logo } from "@/components/branding";
import { DevQuickLogin } from "@/components/auth/DevQuickLogin";
import type { UserRole } from "@/lib/auth";

export type ActivoraLoginVariant = "club" | "parent" | "franchisor" | "admin";

type ActivoraLoginLayoutProps = {
  variant: ActivoraLoginVariant;
  headline: string;
  subtext: string;
  benefits: readonly string[];
  panelFooter?: string;
  showDashboardPreview?: boolean;
  cardTitle: string;
  cardSubtitle?: ReactNode;
  cardBanner?: ReactNode;
  children: ReactNode;
  footerLinks?: ReactNode;
  cta?: {
    prefix: string;
    label: string;
    href: string;
  };
  trustIndicators?: "full" | "secure-only" | "none";
  backHref?: string;
  backLabel?: string;
  showDevQuickLogin?: Extract<
    UserRole,
    "parent" | "club" | "admin" | "organisation"
  >;
};

function CheckIcon({ admin }: { admin?: boolean }) {
  return (
    <svg
      aria-hidden
      className={`mt-0.5 h-4 w-4 shrink-0 ${admin ? "text-violet-400" : "text-violet-300"}`}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2.5}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}

function DashboardPreview() {
  return (
    <div
      aria-hidden
      className="relative mt-10 hidden overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-4 shadow-2xl shadow-violet-950/40 ring-1 ring-white/10 backdrop-blur-sm lg:block"
    >
      <div className="mb-3 flex items-center gap-2">
        <div className="h-2.5 w-2.5 rounded-full bg-red-400/80" />
        <div className="h-2.5 w-2.5 rounded-full bg-amber-400/80" />
        <div className="h-2.5 w-2.5 rounded-full bg-emerald-400/80" />
        <div className="ml-2 h-2 flex-1 rounded-full bg-white/10" />
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div className="col-span-2 space-y-3">
          <div className="h-24 rounded-xl bg-gradient-to-br from-violet-500/30 to-violet-700/20 p-3">
            <div className="h-2 w-20 rounded-full bg-white/30" />
            <div className="mt-3 h-2 w-32 rounded-full bg-white/20" />
            <div className="mt-2 h-2 w-24 rounded-full bg-white/15" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="h-16 rounded-xl bg-white/10 p-2">
              <div className="h-2 w-12 rounded-full bg-white/25" />
              <div className="mt-2 h-2 w-16 rounded-full bg-white/15" />
            </div>
            <div className="h-16 rounded-xl bg-white/10 p-2">
              <div className="h-2 w-10 rounded-full bg-white/25" />
              <div className="mt-2 h-2 w-14 rounded-full bg-white/15" />
            </div>
          </div>
        </div>
        <div className="space-y-3">
          <div className="h-14 rounded-xl bg-emerald-500/20 p-2">
            <div className="h-2 w-8 rounded-full bg-emerald-200/40" />
            <div className="mt-2 h-2 w-12 rounded-full bg-emerald-200/25" />
          </div>
          <div className="h-14 rounded-xl bg-white/10 p-2">
            <div className="h-2 w-10 rounded-full bg-white/25" />
            <div className="mt-2 h-2 w-14 rounded-full bg-white/15" />
          </div>
          <div className="h-14 rounded-xl bg-white/10 p-2">
            <div className="h-2 w-8 rounded-full bg-white/25" />
            <div className="mt-2 h-2 w-12 rounded-full bg-white/15" />
          </div>
        </div>
      </div>
    </div>
  );
}

function TrustIndicators({
  mode,
  admin,
}: {
  mode: "full" | "secure-only" | "none";
  admin?: boolean;
}) {
  if (mode === "none") {
    return null;
  }

  const textClass = admin ? "text-violet-300/70" : "text-zinc-500";
  const dividerClass = admin ? "bg-violet-500/20" : "bg-zinc-200";
  const checkClass = admin ? "text-emerald-400" : "text-emerald-600";

  return (
    <div
      className={`mt-6 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs ${textClass}`}
    >
      {mode === "full" ? (
        <>
          <span className="inline-flex items-center gap-1.5">
            <span aria-hidden className={checkClass}>
              ✓
            </span>
            Free to start
          </span>
          <span className={`hidden h-3 w-px sm:inline-block ${dividerClass}`} />
          <span className="inline-flex items-center gap-1.5">
            <span aria-hidden className={checkClass}>
              ✓
            </span>
            No card required
          </span>
          <span className={`hidden h-3 w-px sm:inline-block ${dividerClass}`} />
        </>
      ) : null}
      <span className="inline-flex items-center gap-1.5">
        <span aria-hidden className={checkClass}>
          ✓
        </span>
        Secure login
      </span>
    </div>
  );
}

export function ActivoraLoginLayout({
  variant,
  headline,
  subtext,
  benefits,
  panelFooter,
  showDashboardPreview = false,
  cardTitle,
  cardSubtitle,
  cardBanner,
  children,
  footerLinks,
  cta,
  trustIndicators = "full",
  backHref = "/login",
  backLabel = "← Back to login options",
  showDevQuickLogin,
}: ActivoraLoginLayoutProps) {
  const isAdmin = variant === "admin";

  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      <section
        className={`relative flex flex-col justify-between overflow-hidden px-6 py-10 sm:px-10 lg:w-[55%] lg:px-12 lg:py-14 xl:px-16 ${
          isAdmin
            ? "bg-gradient-to-br from-violet-950 via-zinc-950 to-zinc-950"
            : "bg-gradient-to-br from-violet-950 via-violet-900/95 to-zinc-950"
        }`}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-violet-500/20 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-32 -left-16 h-80 w-80 rounded-full bg-violet-400/10 blur-3xl"
        />

        <div className="relative">
          <div className="inline-flex">
            <Logo size={48} href="/" priority />
          </div>

          <h1 className="mt-8 max-w-xl text-3xl font-bold tracking-tight text-white sm:text-4xl xl:text-[2.5rem] xl:leading-tight">
            {headline}
          </h1>
          <p className="mt-4 max-w-lg text-base leading-relaxed text-violet-100/80 sm:text-lg">
            {subtext}
          </p>

          {benefits.length > 0 ? (
            <ul className="mt-8 grid gap-3 sm:grid-cols-2 sm:gap-x-6 sm:gap-y-3">
              {benefits.map((benefit) => (
                <li
                  key={benefit}
                  className="flex items-start gap-2.5 text-sm text-violet-50/90"
                >
                  <CheckIcon admin={isAdmin} />
                  <span>{benefit}</span>
                </li>
              ))}
            </ul>
          ) : null}

          {showDashboardPreview ? <DashboardPreview /> : null}
        </div>

        {panelFooter ? (
          <p className="relative mt-10 hidden text-xs text-violet-200/50 lg:block">
            {panelFooter}
          </p>
        ) : null}
      </section>

      <section
        className={`flex flex-1 items-center justify-center px-6 py-10 sm:px-10 lg:w-[45%] lg:py-14 ${
          isAdmin ? "bg-zinc-950" : "bg-zinc-50"
        }`}
      >
        <div className="w-full max-w-[520px]">
          <div className="mb-8 lg:hidden">
            <Logo size={48} href="/" priority />
          </div>

          <div className="mb-6">
            <h2
              className={`text-2xl font-bold tracking-tight ${isAdmin ? "text-white" : "text-zinc-900"}`}
            >
              {cardTitle}
            </h2>
            {cardSubtitle ? (
              <p
                className={`mt-2 text-sm ${isAdmin ? "text-violet-200/70" : "text-zinc-500"}`}
              >
                {cardSubtitle}
              </p>
            ) : null}
          </div>

          {cardBanner}

          <div
            className={
              isAdmin
                ? "rounded-2xl border border-violet-500/20 bg-zinc-900/80 p-7 shadow-2xl shadow-violet-950/40 backdrop-blur-sm ring-1 ring-violet-500/10 sm:p-9"
                : "rounded-2xl border border-zinc-200/80 bg-white/90 p-7 shadow-xl shadow-zinc-900/5 backdrop-blur-sm ring-1 ring-zinc-100 sm:p-9"
            }
          >
            {children}

            {cta ? (
              <div
                className={`mt-6 space-y-3 border-t pt-6 ${isAdmin ? "border-violet-500/20" : "border-zinc-100"}`}
              >
                <p
                  className={`text-center text-sm ${isAdmin ? "text-violet-200/70" : "text-zinc-600"}`}
                >
                  {cta.prefix}{" "}
                  <Link
                    href={cta.href}
                    className={`font-semibold hover:opacity-90 ${isAdmin ? "text-violet-300" : "text-violet-700 hover:text-violet-900"}`}
                  >
                    {cta.label}
                  </Link>
                </p>
              </div>
            ) : null}

            {footerLinks}

            <TrustIndicators mode={trustIndicators} admin={isAdmin} />

            {showDevQuickLogin && process.env.NODE_ENV !== "production" ? (
              <DevQuickLogin accountType={showDevQuickLogin} />
            ) : null}
          </div>

          {backHref && backLabel ? (
            <p
              className={`mt-6 text-center text-sm ${isAdmin ? "text-violet-200/70" : "text-zinc-500"}`}
            >
              <Link
                href={backHref}
                className={`font-medium hover:opacity-90 ${isAdmin ? "text-violet-200 hover:text-white" : "text-zinc-600 hover:text-zinc-900"}`}
              >
                {backLabel}
              </Link>
            </p>
          ) : null}
        </div>
      </section>
    </div>
  );
}
