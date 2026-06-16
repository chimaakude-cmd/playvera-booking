"use client";

import { useEffect, useMemo, useState } from "react";
import { Bookmark, Search } from "lucide-react";
import { PageHeader } from "@/components/club/PageHeader";
import { PartnerCard } from "@/components/partners/PartnerCard";
import {
  createPartnerClaim,
  filterPartners,
  getPublicPartners,
  getSavedPartnerIds,
  isPartnerSaved,
  PARTNER_BENEFIT_TYPES,
  PARTNER_BENEFIT_TYPE_LABELS,
  PARTNER_CATEGORIES,
  PARTNER_CATEGORY_LABELS,
  recordPartnerClick,
  toggleSavedPartner,
  type Partner,
  type PartnerBenefitType,
  type PartnerCategory,
} from "@/lib/partners";

type ActionModal = {
  partner: Partner;
  mode: "claim" | "contact" | "introduction";
};

export function ClubPartnersPage() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [category, setCategory] = useState<PartnerCategory | "all">("all");
  const [benefitType, setBenefitType] = useState<PartnerBenefitType | "all">(
    "all",
  );
  const [recommendedOnly, setRecommendedOnly] = useState(false);
  const [newOnly, setNewOnly] = useState(false);
  const [savedOnly, setSavedOnly] = useState(false);
  const [query, setQuery] = useState("");
  const [modal, setModal] = useState<ActionModal | null>(null);
  const [contactName, setContactName] = useState("Club manager");
  const [contactEmail, setContactEmail] = useState("");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [savedIds, setSavedIds] = useState<string[]>([]);

  useEffect(() => {
    setSavedIds(getSavedPartnerIds());
  }, [refreshKey]);

  const partners = useMemo(() => {
    void refreshKey;
    return getPublicPartners();
  }, [refreshKey]);

  const filtered = useMemo(() => {
    let result = filterPartners(partners, {
      category,
      benefitType,
      recommended: recommendedOnly || undefined,
      isNew: newOnly || undefined,
      query,
    });
    if (savedOnly) {
      result = result.filter((partner) => savedIds.includes(partner.id));
    }
    return result;
  }, [
    partners,
    category,
    benefitType,
    recommendedOnly,
    newOnly,
    savedOnly,
    savedIds,
    query,
  ]);

  function refresh() {
    setRefreshKey((key) => key + 1);
  }

  function openModal(partner: Partner, mode: ActionModal["mode"]) {
    setModal({ partner, mode });
    setMessage("");
    setSubmitted(false);
  }

  function handleSave(partnerId: string) {
    toggleSavedPartner(partnerId);
    refresh();
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!modal || !contactName.trim() || !contactEmail.trim()) {
      return;
    }

    const type =
      modal.mode === "claim"
        ? "claim"
        : modal.mode === "introduction"
          ? "introduction"
          : "enquiry";

    createPartnerClaim({
      partnerId: modal.partner.id,
      partnerName: modal.partner.name,
      type,
      clubId: "club_demo",
      clubName: "Your club",
      contactName: contactName.trim(),
      contactEmail: contactEmail.trim(),
      message: message.trim(),
    });
    setSubmitted(true);
    refresh();
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Provider benefits"
        description="Exclusive offers and trusted partners for Activora clubs."
      />

      <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
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
              className="w-full rounded-xl border border-zinc-200 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100"
            />
          </div>
          <p className="text-sm text-zinc-500">
            {filtered.length} offer{filtered.length === 1 ? "" : "s"}
            {savedIds.length > 0 ? ` · ${savedIds.length} saved` : ""}
          </p>
        </div>

        <div className="mt-4 space-y-3">
          <div className="flex flex-wrap gap-2">
            <span className="self-center text-xs font-semibold uppercase tracking-wide text-zinc-400">
              Category
            </span>
            <button
              type="button"
              onClick={() => setCategory("all")}
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                category === "all"
                  ? "bg-teal-600 text-white"
                  : "bg-zinc-100 text-zinc-600"
              }`}
            >
              All
            </button>
            {PARTNER_CATEGORIES.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setCategory(item)}
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  category === item
                    ? "bg-teal-600 text-white"
                    : "bg-zinc-100 text-zinc-600"
                }`}
              >
                {PARTNER_CATEGORY_LABELS[item]}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
              Benefit type
            </span>
            <select
              value={benefitType}
              onChange={(event) =>
                setBenefitType(event.target.value as PartnerBenefitType | "all")
              }
              className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-semibold text-zinc-700"
            >
              <option value="all">All types</option>
              {PARTNER_BENEFIT_TYPES.map((type) => (
                <option key={type} value={type}>
                  {PARTNER_BENEFIT_TYPE_LABELS[type]}
                </option>
              ))}
            </select>

            <label className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold text-zinc-700">
              <input
                type="checkbox"
                checked={recommendedOnly}
                onChange={(event) => setRecommendedOnly(event.target.checked)}
                className="rounded border-zinc-300 text-teal-600"
              />
              Recommended
            </label>
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold text-zinc-700">
              <input
                type="checkbox"
                checked={newOnly}
                onChange={(event) => setNewOnly(event.target.checked)}
                className="rounded border-zinc-300 text-teal-600"
              />
              New
            </label>
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold text-zinc-700">
              <input
                type="checkbox"
                checked={savedOnly}
                onChange={(event) => setSavedOnly(event.target.checked)}
                className="rounded border-zinc-300 text-teal-600"
              />
              <Bookmark className="h-3.5 w-3.5" aria-hidden />
              Saved only
            </label>
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-200 bg-white px-6 py-14 text-center">
          <p className="font-semibold text-zinc-800">No partners found</p>
          <p className="mt-1 text-sm text-zinc-500">
            Adjust your filters or browse all available offers.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((partner) => (
            <PartnerCard
              key={partner.id}
              partner={partner}
              variant="club"
              saved={isPartnerSaved(partner.id)}
              actions={{
                onWebsiteClick: () => {
                  recordPartnerClick(partner.id);
                  refresh();
                },
                onContactClick: () => openModal(partner, "contact"),
                onClaimClick: () => openModal(partner, "claim"),
                onIntroductionClick: () => openModal(partner, "introduction"),
                onSaveClick: () => handleSave(partner.id),
              }}
            />
          ))}
        </div>
      )}

      {modal ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-bold text-zinc-900">
              {modal.mode === "claim"
                ? "Claim offer"
                : modal.mode === "introduction"
                  ? "Request introduction"
                  : "Contact partner"}
            </h2>
            <p className="mt-1 text-sm text-zinc-500">{modal.partner.name}</p>

            {submitted ? (
              <div className="mt-5 rounded-xl bg-teal-50 px-4 py-4 text-sm text-teal-900">
                <p className="font-semibold">Request submitted successfully.</p>
                {modal.mode === "claim" && modal.partner.offer.promoCode ? (
                  <p className="mt-2 font-mono font-bold">
                    Promo code: {modal.partner.offer.promoCode}
                  </p>
                ) : null}
                <button
                  type="button"
                  onClick={() => setModal(null)}
                  className="mt-4 rounded-xl bg-teal-600 px-4 py-2 text-sm font-semibold text-white"
                >
                  Close
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="mt-5 space-y-3">
                <div>
                  <label className="text-xs font-semibold text-zinc-700">
                    Contact name
                  </label>
                  <input
                    required
                    value={contactName}
                    onChange={(event) => setContactName(event.target.value)}
                    className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm"
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
                    className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-zinc-700">
                    Message
                  </label>
                  <textarea
                    rows={3}
                    value={message}
                    onChange={(event) => setMessage(event.target.value)}
                    className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full rounded-xl bg-teal-600 py-2.5 text-sm font-semibold text-white hover:bg-teal-700"
                >
                  Submit
                </button>
              </form>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
