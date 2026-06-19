"use client";

import Link from "next/link";
import { FormEvent, useState, type ReactNode } from "react";
import { ActivoraLogo } from "@/components/branding/logo";
import { CategoryCardImage } from "@/components/home/CategoryCardImage";
import { ACTIVORA_ACTION } from "@/lib/home/constants";
import { buildSessionsUrl } from "@/lib/home/search-url";
import { publicNotFoundCategoryCards } from "@/lib/public/not-found-categories";

export type PublicNotFoundAction = {
  label: string;
  href: string;
  variant?: "primary" | "secondary" | "outline";
};

type PublicNotFoundLayoutProps = {
  headline: string;
  body: string;
  searchInputId: string;
  searchTitle: string;
  searchPlaceholder: string;
  actions: PublicNotFoundAction[];
  icon?: ReactNode;
  discoveryTitle?: string;
  discoverySubtitle?: string;
  onSearch?: (query: string) => string;
};

function actionClassName(variant: PublicNotFoundAction["variant"] = "outline") {
  if (variant === "primary") {
    return "rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:opacity-95";
  }

  if (variant === "secondary") {
    return "rounded-xl border border-orange-200 bg-orange-50 px-5 py-2.5 text-sm font-semibold text-[#C2410C] transition-colors hover:bg-orange-100";
  }

  return "rounded-xl border border-orange-200 bg-white px-5 py-2.5 text-sm font-semibold text-zinc-700 transition-colors hover:bg-orange-50";
}

function PublicNotFoundFooter() {
  return (
    <footer className="mt-auto border-t border-orange-100/80 bg-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="space-y-2">
          <ActivoraLogo size="desktop" href="/" />
          <p className="max-w-sm text-sm text-zinc-600">
            Discover activities, clubs and experiences near you.
          </p>
        </div>
        <nav className="flex flex-wrap gap-x-5 gap-y-2 text-sm font-medium">
          <Link href="/sessions" className="text-zinc-700 hover:text-[#F87128]">
            Browse activities
          </Link>
          <Link href="/" className="text-zinc-700 hover:text-[#F87128]">
            Clubs
          </Link>
          <Link href="/login" className="text-zinc-700 hover:text-[#F87128]">
            Sign in
          </Link>
        </nav>
      </div>
    </footer>
  );
}

export function PublicNotFoundLayout({
  headline,
  body,
  searchInputId,
  searchTitle,
  searchPlaceholder,
  actions,
  icon,
  discoveryTitle = "Looking for something for your child?",
  discoverySubtitle = "Explore popular activity categories on Activora.",
  onSearch,
}: PublicNotFoundLayoutProps) {
  const [query, setQuery] = useState("");

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) {
      return;
    }

    const destination = onSearch
      ? onSearch(trimmed)
      : buildSessionsUrl(
          { location: "", childAge: "", radius: "", activity: trimmed, date: "" },
        );

    window.location.href = destination;
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#FFF8F3] text-[#0F172A]">
      <header className="shrink-0 border-b border-orange-100/80 bg-white/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <ActivoraLogo size="desktop" href="/" priority />
          <Link
            href="/login"
            className="rounded-xl border border-orange-200 px-4 py-2 text-sm font-semibold text-zinc-700 transition-colors hover:bg-orange-50"
          >
            Sign in
          </Link>
        </div>
      </header>

      <main className="flex flex-1 flex-col">
        <section className="flex flex-1 items-center px-4 py-10 sm:px-6 sm:py-12">
          <div className="mx-auto w-full max-w-3xl">
            <div className="rounded-3xl border border-orange-100 bg-white p-6 shadow-sm sm:p-10">
              <div className="text-center">
                <div
                  className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl text-3xl"
                  style={{
                    backgroundColor: `${ACTIVORA_ACTION}20`,
                    color: ACTIVORA_ACTION,
                  }}
                  aria-hidden
                >
                  {icon ?? "🔍"}
                </div>
                <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                  {headline}
                </h1>
                <p className="mt-4 text-base leading-7 text-zinc-600">{body}</p>
              </div>

              <div className="mt-8 rounded-2xl border border-orange-50 bg-[#FFF8F3] p-5 sm:p-6">
                <h2 className="text-sm font-semibold text-zinc-900">
                  {searchTitle}
                </h2>
                <form
                  onSubmit={handleSearch}
                  className="mt-3 flex flex-col gap-3 sm:flex-row"
                >
                  <label htmlFor={searchInputId} className="sr-only">
                    {searchPlaceholder}
                  </label>
                  <input
                    id={searchInputId}
                    type="search"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder={searchPlaceholder}
                    className="min-w-0 flex-1 rounded-xl border border-orange-100 bg-white px-4 py-3 text-sm text-zinc-900 shadow-sm outline-none placeholder:text-zinc-400 focus:ring-2 focus:ring-[#F87128]/30"
                  />
                  <button
                    type="submit"
                    className="rounded-xl px-5 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:opacity-95"
                    style={{ backgroundColor: ACTIVORA_ACTION }}
                  >
                    Search
                  </button>
                </form>
              </div>

              <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                {actions.map((action) => (
                  <Link
                    key={`${action.href}-${action.label}`}
                    href={action.href}
                    className={actionClassName(action.variant)}
                    style={
                      action.variant === "primary"
                        ? { backgroundColor: ACTIVORA_ACTION }
                        : undefined
                    }
                  >
                    {action.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="border-t border-orange-100/80 bg-white/70 px-4 py-10 sm:px-6 sm:py-12">
          <div className="mx-auto max-w-6xl">
            <h2 className="text-center text-xl font-bold sm:text-2xl">
              {discoveryTitle}
            </h2>
            <p className="mt-2 text-center text-sm text-zinc-500">
              {discoverySubtitle}
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {publicNotFoundCategoryCards.map((category) => (
                <Link
                  key={category.label}
                  href={buildSessionsUrl(
                    {
                      location: "",
                      childAge: "",
                      radius: "",
                      activity: "",
                      date: "",
                    },
                    category.query,
                  )}
                  className="group overflow-hidden rounded-2xl border border-orange-100 bg-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className="relative aspect-[16/10] overflow-hidden bg-orange-50">
                    <CategoryCardImage
                      src={category.image}
                      alt={category.label}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-4">
                      <p className="text-lg font-semibold text-white">
                        {category.icon} {category.label}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      </main>

      <PublicNotFoundFooter />
    </div>
  );
}
