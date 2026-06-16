"use client";

import {
  generateClubDescription,
  generateTaglineSuggestions,
  ONBOARDING_AGE_RANGE_OPTIONS,
  ONBOARDING_PRIMARY_CATEGORY_OPTIONS,
  ONBOARDING_SECONDARY_ACTIVITY_OPTIONS,
  type ClubOnboardingState,
} from "@/lib/club-onboarding";
import {
  OnboardingCheckboxGroup,
  OnboardingField,
  OnboardingStepIntro,
  onboardingTextareaClassName,
} from "../shared";

type StepProps = {
  state: ClubOnboardingState;
  onChange: (updates: Partial<ClubOnboardingState>) => void;
};

export function Step2AboutClub({ state, onChange }: StepProps) {
  function updateClub(updates: Partial<ClubOnboardingState["club"]>) {
    onChange({ club: { ...state.club, ...updates } });
  }

  function handleSuggestTagline() {
    const suggestions = generateTaglineSuggestions(
      state.club.name,
      state.club.primaryCategories,
      state.club.ageRanges,
    );
    updateClub({ suggestedTagline: suggestions[0] ?? "" });
  }

  function handleSuggestDescription() {
    updateClub({
      suggestedDescription: generateClubDescription(state.club, state.club.name),
    });
  }

  return (
    <div className="space-y-6">
      <OnboardingStepIntro
        title="Tell us about your club"
        description="About 90 seconds — this helps parents find and trust your club."
      />

      <OnboardingField label="Club name" htmlFor="club-name" required>
        <input
          id="club-name"
          value={state.club.name}
          onChange={(event) => updateClub({ name: event.target.value })}
          className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-100"
          placeholder="e.g. Riverside FC Academy"
        />
      </OnboardingField>

      <OnboardingCheckboxGroup
        label="Activity category"
        options={ONBOARDING_PRIMARY_CATEGORY_OPTIONS}
        selected={state.club.primaryCategories}
        onChange={(primaryCategories) => updateClub({ primaryCategories })}
        columns={2}
      />

      <OnboardingCheckboxGroup
        label="Specific activities"
        options={ONBOARDING_SECONDARY_ACTIVITY_OPTIONS}
        selected={state.club.secondaryActivities}
        onChange={(secondaryActivities) => updateClub({ secondaryActivities })}
        columns={2}
      />

      <OnboardingCheckboxGroup
        label="Age ranges"
        options={ONBOARDING_AGE_RANGE_OPTIONS}
        selected={state.club.ageRanges}
        onChange={(ageRanges) => updateClub({ ageRanges })}
        columns={3}
      />

      <div className="space-y-3 rounded-xl border border-zinc-200 bg-zinc-50 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-sm font-medium text-zinc-700">Suggested tagline</span>
          <button
            type="button"
            onClick={handleSuggestTagline}
            className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50"
          >
            Suggest tagline
          </button>
        </div>
        <textarea
          value={state.club.suggestedTagline}
          onChange={(event) => updateClub({ suggestedTagline: event.target.value })}
          className={onboardingTextareaClassName}
          rows={2}
          placeholder="Optional — use Suggest tagline for a draft"
        />
      </div>

      <div className="space-y-3 rounded-xl border border-zinc-200 bg-zinc-50 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-sm font-medium text-zinc-700">Suggested description</span>
          <button
            type="button"
            onClick={handleSuggestDescription}
            className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50"
          >
            Suggest description
          </button>
        </div>
        <textarea
          value={state.club.suggestedDescription}
          onChange={(event) =>
            updateClub({ suggestedDescription: event.target.value })
          }
          className={onboardingTextareaClassName}
          rows={4}
          placeholder="Optional — use Suggest description for a draft"
        />
      </div>
    </div>
  );
}
