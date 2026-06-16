"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import {
  inputClassName,
  labelClassName,
} from "@/components/club/SessionForm";
import { LoadingState } from "@/components/club/LoadingState";
import { LanguageSettingsSection } from "@/components/i18n/LanguageSettingsSection";
import { PageHeader } from "@/components/club/PageHeader";
import {
  getParentProfile,
  ParentProfile,
  saveParentProfile,
} from "@/lib/parent-profile";

export default function ParentProfilePage() {
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState<ParentProfile>({
    fullName: "",
    email: "",
    phone: "",
    emergencyContact: "",
    relationshipToChild: "",
  });

  useEffect(() => {
    setForm(getParentProfile());
    setLoading(false);
  }, []);

  function updateField(field: keyof ParentProfile, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
    setSaved(false);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    saveParentProfile(form);
    setSaved(true);
  }

  if (loading) {
    return <LoadingState message="Loading profile..." />;
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <PageHeader
        title="Profile"
        description="Update your contact details and emergency information."
      />

      {saved ? (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          Profile updated successfully
        </div>
      ) : null}

      <form
        onSubmit={handleSubmit}
        className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8"
      >
        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="full-name" className={labelClassName}>
              Full name
            </label>
            <input
              id="full-name"
              value={form.fullName}
              onChange={(event) => updateField("fullName", event.target.value)}
              className={inputClassName}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="email" className={labelClassName}>
              Email
            </label>
            <input
              id="email"
              type="email"
              value={form.email}
              onChange={(event) => updateField("email", event.target.value)}
              className={inputClassName}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="phone" className={labelClassName}>
              Phone number
            </label>
            <input
              id="phone"
              type="tel"
              value={form.phone}
              onChange={(event) => updateField("phone", event.target.value)}
              className={inputClassName}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="emergency-contact" className={labelClassName}>
              Main emergency contact
            </label>
            <input
              id="emergency-contact"
              value={form.emergencyContact}
              onChange={(event) =>
                updateField("emergencyContact", event.target.value)
              }
              className={inputClassName}
              placeholder="Name and phone number"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="relationship" className={labelClassName}>
              Relationship to child
            </label>
            <input
              id="relationship"
              value={form.relationshipToChild}
              onChange={(event) =>
                updateField("relationshipToChild", event.target.value)
              }
              className={inputClassName}
              placeholder="e.g. Mother, Father, Guardian"
            />
          </div>
        </div>

        <button
          type="submit"
          className="mt-8 rounded-lg bg-black px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-zinc-800"
        >
          Save profile
        </button>
      </form>

      <LanguageSettingsSection />

      <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h2 className="text-base font-semibold text-zinc-900">Need help?</h2>
        <p className="mt-2 text-sm text-zinc-500">
          Found a bug or something not working? Let us know so we can fix it.
        </p>
        <Link
          href="/report-bug?url=/parent/profile"
          className="mt-4 inline-block rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-teal-500"
        >
          Report a bug
        </Link>
      </section>
    </div>
  );
}
