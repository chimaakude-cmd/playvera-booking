"use client";

import {
  generateDescriptions,
  generateTaglineSuggestions,
  type ClubOnboardingState,
} from "@/lib/club-onboarding";
import type { OnboardingImagePreviews } from "@/lib/club-onboarding/types";
import {
  OnboardingField,
  OnboardingImageUpload,
  OnboardingStepIntro,
  onboardingInputClassName,
  onboardingTextareaClassName,
} from "../shared";

type StepProps = {
  state: ClubOnboardingState;
  onChange: (updates: Partial<ClubOnboardingState>) => void;
  imagePreviews: OnboardingImagePreviews;
  onImagePreviewChange: (updates: Partial<OnboardingImagePreviews>) => void;
};

export function Step3ClubProfile({
  state,
  onChange,
  imagePreviews,
  onImagePreviewChange,
}: StepProps) {
  function updateProfile(updates: Partial<ClubOnboardingState["profile"]>) {
    onChange({
      profile: { ...state.profile, ...updates, skippedProfile: false },
    });
  }

  function handleGenerateForMe() {
    const tagline =
      state.profile.tagline.trim() ||
      state.club.suggestedTagline.trim() ||
      generateTaglineSuggestions(
        state.club.name,
        state.club.primaryCategories,
        state.club.ageRanges,
      )[0] ||
      "";

    const aboutText =
      state.profile.aboutText.trim() ||
      state.club.suggestedDescription.trim() ||
      generateDescriptions("medium", {
        clubName: state.club.name,
        club: state.club,
      });

    updateProfile({ tagline, aboutText });
  }

  return (
    <div className="space-y-6">
      <OnboardingStepIntro
        title="Club profile"
        description="About 90 seconds — optional branding. Skip if you want to launch faster."
      />

      <OnboardingImageUpload
        label="Club logo"
        value={imagePreviews.logoUrl}
        onChange={(logoUrl) => onImagePreviewChange({ logoUrl })}
      />

      <OnboardingField label="Theme colour" htmlFor="primary-color">
        <div className="flex items-center gap-3">
          <input
            id="primary-color"
            type="color"
            value={state.profile.primaryColor}
            onChange={(event) =>
              updateProfile({ primaryColor: event.target.value })
            }
            className="h-11 w-14 cursor-pointer rounded-lg border border-zinc-200 bg-white p-1"
          />
          <input
            value={state.profile.primaryColor}
            onChange={(event) =>
              updateProfile({ primaryColor: event.target.value })
            }
            className={onboardingInputClassName}
          />
        </div>
      </OnboardingField>

      <OnboardingImageUpload
        label="Cover image"
        value={imagePreviews.coverUrl}
        onChange={(coverUrl) => onImagePreviewChange({ coverUrl })}
        compact
      />

      <OnboardingField label="Tagline" htmlFor="profile-tagline" hint="Optional">
        <input
          id="profile-tagline"
          value={state.profile.tagline}
          onChange={(event) => updateProfile({ tagline: event.target.value })}
          className={onboardingInputClassName}
          placeholder={state.club.suggestedTagline || "A short line about your club"}
        />
      </OnboardingField>

      <OnboardingField label="About us" htmlFor="profile-about" hint="Optional">
        <textarea
          id="profile-about"
          value={state.profile.aboutText}
          onChange={(event) => updateProfile({ aboutText: event.target.value })}
          className={onboardingTextareaClassName}
          rows={4}
          placeholder={
            state.club.suggestedDescription || "Tell parents what makes your club special"
          }
        />
      </OnboardingField>

      <button
        type="button"
        onClick={handleGenerateForMe}
        className="rounded-xl border border-teal-200 bg-teal-50 px-4 py-2.5 text-sm font-semibold text-teal-800 hover:bg-teal-100"
      >
        Generate for me
      </button>

      {imagePreviews.logoUrl || state.profile.tagline ? (
        <div
          className="rounded-2xl border border-zinc-200 p-4"
          style={{ borderTopColor: state.profile.primaryColor, borderTopWidth: 4 }}
        >
          <div className="flex items-center gap-3">
            {imagePreviews.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={imagePreviews.logoUrl}
                alt=""
                className="h-12 w-12 rounded-xl object-cover"
              />
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-100 text-lg font-bold text-zinc-400">
                {state.club.name.slice(0, 1) || "C"}
              </div>
            )}
            <div>
              <p className="font-semibold text-zinc-900">
                {state.club.name || "Your club"}
              </p>
              <p className="text-sm text-zinc-500">
                {state.profile.tagline || "Your tagline appears here"}
              </p>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
