"use client";

import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/club/PageHeader";
import {
  createPartner,
  exportPartnersJson,
  getAllPartners,
  getPartnerClaims,
  getPartnerClaimsForPartner,
  getPartnersAnalyticsSummary,
  LOGO_DATA_URL_MAX_BYTES,
  PARTNER_BENEFIT_TYPES,
  PARTNER_BENEFIT_TYPE_LABELS,
  PARTNER_CATEGORIES,
  PARTNER_CATEGORY_LABELS,
  PARTNER_STATUSES,
  PARTNER_STATUS_LABELS,
  setPartnerStatus,
  updatePartner,
  type CreatePartnerInput,
  type Partner,
  type PartnerBenefitType,
  type PartnerCategory,
  type PartnerClaim,
  type PartnerStatus,
} from "@/lib/partners";

type Tab = "partners" | "claims";

type PartnerFormState = {
  name: string;
  category: PartnerCategory;
  shortDescription: string;
  benefitOffered: string;
  benefitType: PartnerBenefitType;
  website: string;
  contactEmail: string;
  contactPhone: string;
  logoDataUrl: string | null;
  offerTitle: string;
  offerDescription: string;
  offerTerms: string;
  offerPromoCode: string;
  offerValidUntil: string;
  status: PartnerStatus;
  recommended: boolean;
  isNew: boolean;
};

const EMPTY_FORM: PartnerFormState = {
  name: "",
  category: "equipment",
  shortDescription: "",
  benefitOffered: "",
  benefitType: "discount",
  website: "",
  contactEmail: "",
  contactPhone: "",
  logoDataUrl: null,
  offerTitle: "",
  offerDescription: "",
  offerTerms: "",
  offerPromoCode: "",
  offerValidUntil: "",
  status: "draft",
  recommended: false,
  isNew: true,
};

function partnerToForm(partner: Partner): PartnerFormState {
  return {
    name: partner.name,
    category: partner.category,
    shortDescription: partner.shortDescription,
    benefitOffered: partner.benefitOffered,
    benefitType: partner.benefitType,
    website: partner.website,
    contactEmail: partner.contactEmail,
    contactPhone: partner.contactPhone,
    logoDataUrl: partner.logoDataUrl,
    offerTitle: partner.offer.title,
    offerDescription: partner.offer.description,
    offerTerms: partner.offer.terms,
    offerPromoCode: partner.offer.promoCode,
    offerValidUntil: partner.offer.validUntil,
    status: partner.status,
    recommended: partner.recommended,
    isNew: partner.isNew,
  };
}

function formToInput(form: PartnerFormState): CreatePartnerInput {
  return {
    name: form.name.trim(),
    category: form.category,
    shortDescription: form.shortDescription.trim(),
    benefitOffered: form.benefitOffered.trim(),
    benefitType: form.benefitType,
    website: form.website.trim(),
    contactEmail: form.contactEmail.trim(),
    contactPhone: form.contactPhone.trim(),
    logoDataUrl: form.logoDataUrl,
    offer: {
      title: form.offerTitle.trim(),
      description: form.offerDescription.trim(),
      terms: form.offerTerms.trim(),
      promoCode: form.offerPromoCode.trim(),
      validUntil: form.offerValidUntil.trim(),
    },
    status: form.status,
    recommended: form.recommended,
    isNew: form.isNew,
  };
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function StatusBadge({ status }: { status: PartnerStatus }) {
  const styles: Record<PartnerStatus, string> = {
    draft: "bg-zinc-100 text-zinc-600",
    pending: "bg-amber-50 text-amber-800",
    approved: "bg-emerald-50 text-emerald-700",
    featured: "bg-violet-50 text-violet-800",
    hidden: "bg-sky-50 text-sky-800",
    archived: "bg-zinc-200 text-zinc-500",
  };
  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${styles[status]}`}
    >
      {PARTNER_STATUS_LABELS[status]}
    </span>
  );
}

const INPUT_CLASS =
  "mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100";

const LABEL_CLASS = "text-xs font-semibold text-zinc-700";

export function AdminPartnersDashboard() {
  const [tab, setTab] = useState<Tab>("partners");
  const [partners, setPartners] = useState<Partner[]>([]);
  const [claims, setClaims] = useState<PartnerClaim[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<PartnerStatus | "all">("all");
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<PartnerFormState>(EMPTY_FORM);
  const [logoError, setLogoError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    setPartners(getAllPartners());
    setClaims(getPartnerClaims());
  }, [refreshKey]);

  const summary = useMemo(() => getPartnersAnalyticsSummary(), [refreshKey]);

  const filtered = useMemo(() => {
    if (statusFilter === "all") {
      return partners;
    }
    return partners.filter((partner) => partner.status === statusFilter);
  }, [partners, statusFilter]);

  const selected = partners.find((partner) => partner.id === selectedId) ?? null;
  const selectedClaims = selected
    ? getPartnerClaimsForPartner(selected.id)
    : [];

  function refresh() {
    setRefreshKey((key) => key + 1);
  }

  function openCreate() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setLogoError(null);
    setFormOpen(true);
  }

  function openEdit(partner: Partner) {
    setEditingId(partner.id);
    setForm(partnerToForm(partner));
    setLogoError(null);
    setFormOpen(true);
  }

  function handleLogoUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    if (!file.type.startsWith("image/")) {
      setLogoError("Please upload an image file.");
      return;
    }
    if (file.size > LOGO_DATA_URL_MAX_BYTES) {
      setLogoError(`Logo must be under ${Math.round(LOGO_DATA_URL_MAX_BYTES / 1000)}KB.`);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setForm((current) => ({
        ...current,
        logoDataUrl: typeof reader.result === "string" ? reader.result : null,
      }));
      setLogoError(null);
    };
    reader.readAsDataURL(file);
  }

  function handleSave(event: React.FormEvent) {
    event.preventDefault();
    if (!form.name.trim()) {
      return;
    }
    const input = formToInput(form);
    if (editingId) {
      updatePartner(editingId, input);
    } else {
      createPartner(input);
    }
    setFormOpen(false);
    refresh();
  }

  function handleQuickStatus(status: PartnerStatus) {
    if (!selected) {
      return;
    }
    setPartnerStatus(selected.id, status);
    refresh();
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Partner Directory"
        description="Manage approved partners, offers, and track claims and introductions."
        action={
          <button
            type="button"
            onClick={openCreate}
            className="rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-violet-700"
          >
            Add partner
          </button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Total partners", value: summary.totalPartners },
          { label: "Live on directory", value: summary.livePartners },
          { label: "Total views", value: summary.views },
          { label: "Claims", value: summary.claims },
        ].map((card) => (
          <div
            key={card.label}
            className="rounded-2xl border border-violet-100 bg-violet-50/50 p-4"
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-violet-600">
              {card.label}
            </p>
            <p className="mt-1 text-2xl font-bold text-violet-900">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2 border-b border-zinc-200 pb-1">
        {(["partners", "claims"] as Tab[]).map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setTab(item)}
            className={`rounded-t-lg px-4 py-2 text-sm font-semibold capitalize ${
              tab === item
                ? "border-b-2 border-violet-600 text-violet-800"
                : "text-zinc-500 hover:text-zinc-800"
            }`}
          >
            {item}
          </button>
        ))}
      </div>

      {tab === "partners" ? (
        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <select
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(event.target.value as PartnerStatus | "all")
                }
                className="rounded-xl border border-zinc-200 px-3 py-2 text-sm"
              >
                <option value="all">All statuses</option>
                {PARTNER_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {PARTNER_STATUS_LABELS[status]}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => {
                  const blob = new Blob([exportPartnersJson()], {
                    type: "application/json",
                  });
                  const url = URL.createObjectURL(blob);
                  const anchor = document.createElement("a");
                  anchor.href = url;
                  anchor.download = "activora-partners.json";
                  anchor.click();
                  URL.revokeObjectURL(url);
                }}
                className="text-sm font-semibold text-violet-700 hover:text-violet-900"
              >
                Export JSON
              </button>
            </div>

            <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-zinc-100 bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500">
                  <tr>
                    <th className="px-4 py-3">Partner</th>
                    <th className="px-4 py-3">Category</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Analytics</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((partner) => (
                    <tr
                      key={partner.id}
                      onClick={() => setSelectedId(partner.id)}
                      className={`cursor-pointer border-b border-zinc-50 transition hover:bg-violet-50/40 ${
                        selectedId === partner.id ? "bg-violet-50/60" : ""
                      }`}
                    >
                      <td className="px-4 py-3 font-semibold text-zinc-900">
                        {partner.name}
                      </td>
                      <td className="px-4 py-3 text-zinc-600">
                        {PARTNER_CATEGORY_LABELS[partner.category]}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={partner.status} />
                      </td>
                      <td className="px-4 py-3 text-xs text-zinc-500">
                        {partner.analytics.views}v · {partner.analytics.clicks}c ·{" "}
                        {partner.analytics.claims} claims
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <aside className="rounded-2xl border border-zinc-200 bg-white p-5">
            {selected ? (
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-bold text-zinc-900">
                      {selected.name}
                    </h3>
                    <p className="text-sm text-zinc-500">
                      {PARTNER_CATEGORY_LABELS[selected.category]}
                    </p>
                  </div>
                  <StatusBadge status={selected.status} />
                </div>

                <p className="text-sm text-zinc-600">{selected.shortDescription}</p>
                <p className="rounded-xl bg-violet-50 px-3 py-2 text-sm font-semibold text-violet-900">
                  {selected.benefitOffered}
                </p>

                <dl className="grid grid-cols-2 gap-2 text-xs">
                  {[
                    ["Views", selected.analytics.views],
                    ["Clicks", selected.analytics.clicks],
                    ["Claims", selected.analytics.claims],
                    ["Introductions", selected.analytics.introductions],
                  ].map(([label, value]) => (
                    <div
                      key={label}
                      className="rounded-lg border border-zinc-100 px-3 py-2"
                    >
                      <dt className="text-zinc-400">{label}</dt>
                      <dd className="text-lg font-bold text-zinc-800">{value}</dd>
                    </div>
                  ))}
                </dl>

                <div className="flex flex-wrap gap-2">
                  {(["approved", "featured", "hidden", "archived", "pending", "draft"] as PartnerStatus[]).map(
                    (status) => (
                      <button
                        key={status}
                        type="button"
                        onClick={() => handleQuickStatus(status)}
                        disabled={selected.status === status}
                        className="rounded-lg border border-zinc-200 px-2.5 py-1 text-xs font-semibold text-zinc-700 hover:border-violet-300 disabled:opacity-40"
                      >
                        {PARTNER_STATUS_LABELS[status]}
                      </button>
                    ),
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => openEdit(selected)}
                  className="w-full rounded-xl border border-violet-200 py-2 text-sm font-semibold text-violet-800 hover:bg-violet-50"
                >
                  Edit partner
                </button>

                {selectedClaims.length > 0 ? (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
                      Recent activity
                    </p>
                    <ul className="mt-2 space-y-2">
                      {selectedClaims.slice(0, 3).map((claim) => (
                        <li
                          key={claim.id}
                          className="rounded-lg bg-zinc-50 px-3 py-2 text-xs text-zinc-600"
                        >
                          <span className="font-semibold capitalize">
                            {claim.type}
                          </span>{" "}
                          — {claim.contactName} · {formatDateTime(claim.createdAt)}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>
            ) : (
              <p className="text-sm text-zinc-500">
                Select a partner to view details and change status.
              </p>
            )}
          </aside>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-zinc-100 bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500">
              <tr>
                <th className="px-4 py-3">Partner</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Club</th>
                <th className="px-4 py-3">Contact</th>
                <th className="px-4 py-3">Date</th>
              </tr>
            </thead>
            <tbody>
              {claims.map((claim) => (
                <tr key={claim.id} className="border-b border-zinc-50">
                  <td className="px-4 py-3 font-medium">{claim.partnerName}</td>
                  <td className="px-4 py-3 capitalize">{claim.type}</td>
                  <td className="px-4 py-3 text-zinc-600">
                    {claim.clubName ?? "Public"}
                  </td>
                  <td className="px-4 py-3">
                    <p>{claim.contactName}</p>
                    <p className="text-xs text-zinc-500">{claim.contactEmail}</p>
                  </td>
                  <td className="px-4 py-3 text-xs text-zinc-500">
                    {formatDateTime(claim.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {claims.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-zinc-500">
              No claims or enquiries yet.
            </p>
          ) : null}
        </div>
      )}

      {formOpen ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center overflow-y-auto bg-black/50 p-4 sm:items-start sm:pt-10">
          <form
            onSubmit={handleSave}
            className="mb-4 w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl"
          >
            <h2 className="text-lg font-bold text-zinc-900">
              {editingId ? "Edit partner" : "Add partner"}
            </h2>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className={LABEL_CLASS}>Name</label>
                <input
                  required
                  value={form.name}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, name: event.target.value }))
                  }
                  className={INPUT_CLASS}
                />
              </div>
              <div>
                <label className={LABEL_CLASS}>Category</label>
                <select
                  value={form.category}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      category: event.target.value as PartnerCategory,
                    }))
                  }
                  className={INPUT_CLASS}
                >
                  {PARTNER_CATEGORIES.map((category) => (
                    <option key={category} value={category}>
                      {PARTNER_CATEGORY_LABELS[category]}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={LABEL_CLASS}>Status</label>
                <select
                  value={form.status}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      status: event.target.value as PartnerStatus,
                    }))
                  }
                  className={INPUT_CLASS}
                >
                  {PARTNER_STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {PARTNER_STATUS_LABELS[status]}
                    </option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className={LABEL_CLASS}>Short description</label>
                <textarea
                  required
                  rows={2}
                  value={form.shortDescription}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      shortDescription: event.target.value,
                    }))
                  }
                  className={INPUT_CLASS}
                />
              </div>
              <div>
                <label className={LABEL_CLASS}>Benefit offered</label>
                <input
                  required
                  value={form.benefitOffered}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      benefitOffered: event.target.value,
                    }))
                  }
                  className={INPUT_CLASS}
                />
              </div>
              <div>
                <label className={LABEL_CLASS}>Benefit type</label>
                <select
                  value={form.benefitType}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      benefitType: event.target.value as PartnerBenefitType,
                    }))
                  }
                  className={INPUT_CLASS}
                >
                  {PARTNER_BENEFIT_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {PARTNER_BENEFIT_TYPE_LABELS[type]}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={LABEL_CLASS}>Website</label>
                <input
                  value={form.website}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, website: event.target.value }))
                  }
                  className={INPUT_CLASS}
                />
              </div>
              <div>
                <label className={LABEL_CLASS}>Contact email</label>
                <input
                  type="email"
                  value={form.contactEmail}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      contactEmail: event.target.value,
                    }))
                  }
                  className={INPUT_CLASS}
                />
              </div>
              <div className="sm:col-span-2">
                <label className={LABEL_CLASS}>Logo</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="mt-1 block w-full text-sm"
                />
                {logoError ? (
                  <p className="mt-1 text-xs text-red-600">{logoError}</p>
                ) : null}
                {form.logoDataUrl ? (
                  <img
                    src={form.logoDataUrl}
                    alt="Logo preview"
                    className="mt-2 h-16 w-16 rounded-xl border object-contain"
                  />
                ) : null}
              </div>
              <div className="sm:col-span-2 border-t border-zinc-100 pt-4">
                <p className="text-sm font-bold text-zinc-800">Offer details</p>
              </div>
              <div className="sm:col-span-2">
                <label className={LABEL_CLASS}>Offer title</label>
                <input
                  value={form.offerTitle}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      offerTitle: event.target.value,
                    }))
                  }
                  className={INPUT_CLASS}
                />
              </div>
              <div className="sm:col-span-2">
                <label className={LABEL_CLASS}>Offer description</label>
                <textarea
                  rows={2}
                  value={form.offerDescription}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      offerDescription: event.target.value,
                    }))
                  }
                  className={INPUT_CLASS}
                />
              </div>
              <div>
                <label className={LABEL_CLASS}>Promo code</label>
                <input
                  value={form.offerPromoCode}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      offerPromoCode: event.target.value,
                    }))
                  }
                  className={INPUT_CLASS}
                />
              </div>
              <div>
                <label className={LABEL_CLASS}>Valid until</label>
                <input
                  type="date"
                  value={form.offerValidUntil}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      offerValidUntil: event.target.value,
                    }))
                  }
                  className={INPUT_CLASS}
                />
              </div>
              <div className="flex flex-wrap gap-4 sm:col-span-2">
                <label className="inline-flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={form.recommended}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        recommended: event.target.checked,
                      }))
                    }
                  />
                  Recommended
                </label>
                <label className="inline-flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={form.isNew}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        isNew: event.target.checked,
                      }))
                    }
                  />
                  Mark as new
                </label>
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                type="submit"
                className="rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-violet-700"
              >
                Save partner
              </button>
              <button
                type="button"
                onClick={() => setFormOpen(false)}
                className="rounded-xl border border-zinc-200 px-5 py-2.5 text-sm font-semibold text-zinc-600"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  );
}
