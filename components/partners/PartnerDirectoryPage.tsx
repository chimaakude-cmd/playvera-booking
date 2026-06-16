"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { Handshake, Search, X } from "lucide-react";
import { SiteFooter } from "@/components/SiteFooter";
import { HomeHeader } from "@/components/home/HomeHeader";
import { LazySupportLauncher } from "@/components/support/LazySupportLauncher";
import { PartnerCard } from "@/components/partners/PartnerCard";
import { FOOTER_NAVY, FOOTER_TEAL } from "@/lib/home/footer-links";
import {
  createPartnerClaim,
  filterPartners,
  getPublicPartners,
  PARTNER_CATEGORIES,
  PARTNER_CATEGORY_LABELS,
  recordPartnerClick,
  recordPartnerView,
  type Partner,
  type PartnerCategory,
} from "@/lib/partners";

type ClaimModalState = {
  partner: Partner;
  mode: "claim" | "contact";
};

export function PartnerDirectoryPage() {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [category, setCategory] = useState<PartnerCategory | "all">("all");
  const [query, setQuery] = useState("");
  const [modal, setModal] = useState<ClaimModalState | null>(null);
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const viewedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    setPartners(getPublicPartners());
  }, [refreshKey]);

  const filtered = useMemo(
    () => filterPartners(partners, { category, query }),
    [partners, category, query],
  );

  useEffect(() => {
    for (const partner of filtered) {
      if (!viewedRef.current.has(partner.id)) {
        viewedRef.current.add(partner.id);
        recordPartnerView(partner.id);
      }
    }
  }, [filtered]);

  function openModal(partner: Partner, mode: "claim" | "contact") {
    setModal({ partner, mode });
    setContactName("");
    setContactEmail("");
    setMessage("");
    setSubmitted(false);
  }

  function closeModal() {
    setModal(null);
    setSubmitted(false);
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!modal || !contactName.trim() || !contactEmail.trim()) {
      return;
    }

    createPartnerClaim({
      partnerId: modal.partner.id,
      partnerName: modal.partner.name,
      type: modal.mode === "claim" ? "claim" : "enquiry",
      clubId: null,
      clubName: null,
      contactName: contactName.trim(),
      contactEmail: contactEmail.trim(),
      message: message.trim(),
    });
    setSubmitted(true);
    setRefreshKey((key) => key + 1);
  }

  return (
    <div className="min-h-screen bg-[#f4f7fa] text-zinc-900">
      <HomeHeader />

      <section
        className="relative overflow-hidden px-4 pb-16 pt-12 sm:px-6 lg:px-8"
        style={{
          background: `linear-gradient(135deg, ${FOOTER_NAVY} 0%, #0a3d5c 45%, ${FOOTER_TEAL} 100%)`,
        }}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-white/5 blur-3xl"
        />
        <div className="relative mx-auto max-w-5xl text-center">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 text-white backdrop-blur">
            <Handshake className="h-7 w-7" aria-hidden />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
            Activora Partner Directory
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-teal-50/90 sm:text-lg">
            Discover trusted organisations helping clubs grow, save money,
            support staff, and increase children&apos;s participation.
          </p>
          <p className="mt-6 text-sm text-teal-100/80">
            Looking to become a partner?{" "}
            <Link
              href="/partnerships"
              className="font-semibold text-white underline decoration-white/40 underline-offset-4 hover:decoration-white"
            >
              Explore partnerships
            </Link>
          </p>
        </div>
      </section>

      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative max-w-md flex-1">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400"
                aria-hidden
              />
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search partners..."
                className="w-full rounded-xl border border-zinc-200 py-2.5 pl-10 pr-3 text-sm outline-none transition focus:border-teal-400 focus:ring-2 focus:ring-teal-100"
              />
            </div>
            <p className="text-sm text-zinc-500">
              {filtered.length} partner{filtered.length === 1 ? "" : "s"}
            </p>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setCategory("all")}
              className={`rounded-full px-3.5 py-1.5 text-sm font-semibold transition ${
                category === "all"
                  ? "bg-[#072B44] text-white"
                  : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
              }`}
            >
              All
            </button>
            {PARTNER_CATEGORIES.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setCategory(item)}
                className={`rounded-full px-3.5 py-1.5 text-sm font-semibold transition ${
                  category === item
                    ? "bg-[#072B44] text-white"
                    : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                }`}
              >
                {PARTNER_CATEGORY_LABELS[item]}
              </button>
            ))}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="mt-10 rounded-2xl border border-dashed border-zinc-200 bg-white px-6 py-16 text-center">
            <p className="text-lg font-semibold text-zinc-800">
              No partners match your filters
            </p>
            <p className="mt-2 text-sm text-zinc-500">
              Try a different category or clear your search.
            </p>
            <button
              type="button"
              onClick={() => {
                setCategory("all");
                setQuery("");
              }}
              className="mt-5 rounded-xl bg-teal-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-teal-700"
            >
              Show all partners
            </button>
          </div>
        ) : (
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((partner) => (
              <PartnerCard
                key={partner.id}
                partner={partner}
                variant="public"
                actions={{
                  onWebsiteClick: () => recordPartnerClick(partner.id),
                  onContactClick: () => openModal(partner, "contact"),
                  onClaimClick: () => openModal(partner, "claim"),
                }}
              />
            ))}
          </div>
        )}
      </main>

      {modal ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="partner-modal-title"
            className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2
                  id="partner-modal-title"
                  className="text-lg font-bold text-zinc-900"
                >
                  {modal.mode === "claim" ? "Claim offer" : "Contact partner"}
                </h2>
                <p className="mt-1 text-sm text-zinc-500">{modal.partner.name}</p>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {submitted ? (
              <div className="mt-6 rounded-xl bg-teal-50 px-4 py-5 text-sm text-teal-900">
                <p className="font-semibold">Thank you — we&apos;ve recorded your request.</p>
                <p className="mt-1">
                  {modal.mode === "claim"
                    ? `Your claim for ${modal.partner.offer.title} has been submitted.`
                    : "The partner will be notified via Activora."}
                </p>
                {modal.partner.offer.promoCode ? (
                  <p className="mt-3 rounded-lg bg-white px-3 py-2 font-mono text-sm font-bold text-[#072B44]">
                    Code: {modal.partner.offer.promoCode}
                  </p>
                ) : null}
                <button
                  type="button"
                  onClick={closeModal}
                  className="mt-4 rounded-xl bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700"
                >
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="mt-5 space-y-4">
                {modal.mode === "claim" ? (
                  <div className="rounded-xl bg-zinc-50 px-4 py-3 text-sm text-zinc-700">
                    <p className="font-semibold text-zinc-900">
                      {modal.partner.offer.title}
                    </p>
                    <p className="mt-1">{modal.partner.offer.description}</p>
                  </div>
                ) : null}
                <div>
                  <label className="text-xs font-semibold text-zinc-700">
                    Your name
                  </label>
                  <input
                    required
                    value={contactName}
                    onChange={(event) => setContactName(event.target.value)}
                    className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-zinc-700">
                    Email
                  </label>
                  <input
                    required
                    type="email"
                    value={contactEmail}
                    onChange={(event) => setContactEmail(event.target.value)}
                    className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-zinc-700">
                    Message (optional)
                  </label>
                  <textarea
                    rows={3}
                    value={message}
                    onChange={(event) => setMessage(event.target.value)}
                    className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100"
                  />
                </div>
                <div className="flex gap-3 pt-1">
                  <button
                    type="submit"
                    className="flex-1 rounded-xl bg-teal-600 py-2.5 text-sm font-semibold text-white hover:bg-teal-700"
                  >
                    {modal.mode === "claim" ? "Submit claim" : "Send enquiry"}
                  </button>
                  <button
                    type="button"
                    onClick={closeModal}
                    className="rounded-xl border border-zinc-200 px-4 py-2.5 text-sm font-semibold text-zinc-600 hover:bg-zinc-50"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      ) : null}

      <SiteFooter />
      <LazySupportLauncher />
    </div>
  );
}
