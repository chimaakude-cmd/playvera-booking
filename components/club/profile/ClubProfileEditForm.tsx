"use client";

import { FormEvent, useState } from "react";
import type {
  ClubProfile,
  ClubProfileInput,
  ClubProfileLocation,
  ClubProfileMediaItem,
} from "@/lib/club-profile";
import {
  buttonStyleLabels,
  cardStyleLabels,
  CLUB_ACCESSIBILITY_OPTIONS,
  CLUB_AGE_RANGE_OPTIONS,
  CLUB_CATEGORY_OPTIONS,
  CLUB_SOCIAL_PLATFORMS,
  fontPresetLabels,
  slugifyClubName,
  socialPlatformLabels,
  socialPlatformPlaceholders,
  verificationStatusLabels,
  validateClubProfileInput,
} from "@/lib/club-profile";
import { useFranchiseePolicy } from "@/lib/organisation";
import {
  ProfileChipGroup,
  ProfileField,
  ProfileImagePlaceholder,
  ProfileSection,
  ProfileSelect,
  ProfileTextarea,
  ProfileTextInput,
  ProfileToggle,
} from "./ProfileFormFields";

type ClubProfileEditFormProps = {
  initialProfile: ClubProfile;
  onSave: (input: ClubProfileInput) => void;
};

const sectionLinks = [
  { id: "identity", label: "Identity" },
  { id: "about", label: "About" },
  { id: "locations", label: "Locations" },
  { id: "contact", label: "Contact" },
  { id: "social", label: "Social" },
  { id: "branding", label: "Branding" },
  { id: "customer-view", label: "Customer view" },
  { id: "media", label: "Media" },
  { id: "seo", label: "SEO" },
];

function createEmptyLocation(): ClubProfileLocation {
  return {
    id: crypto.randomUUID(),
    venueName: "",
    addressLine1: "",
    addressLine2: "",
    townCity: "",
    postcode: "",
    latitude: 51.5,
    longitude: -0.12,
    radiusMiles: 5,
    isMain: false,
  };
}

function toggleListValue(list: string[], value: string): string[] {
  return list.includes(value)
    ? list.filter((item) => item !== value)
    : [...list, value];
}

export function ClubProfileEditForm({
  initialProfile,
  onSave,
}: ClubProfileEditFormProps) {
  const { isLocked, lockedMessage } = useFranchiseePolicy(initialProfile.providerId);
  const profileLocked = isLocked("profile");
  const [profile, setProfile] = useState<ClubProfileInput>({
    logoUrl: initialProfile.logoUrl,
    coverImageUrl: initialProfile.coverImageUrl,
    clubName: initialProfile.clubName,
    tagline: initialProfile.tagline,
    shortDescription: initialProfile.shortDescription,
    establishedYear: initialProfile.establishedYear,
    verificationStatus: initialProfile.verificationStatus,
    longDescription: initialProfile.longDescription,
    uniqueSellingPoints: initialProfile.uniqueSellingPoints,
    categories: initialProfile.categories,
    ageRanges: initialProfile.ageRanges,
    accessibilityOptions: initialProfile.accessibilityOptions,
    locations: initialProfile.locations,
    contact: initialProfile.contact,
    socialLinks: initialProfile.socialLinks,
    branding: initialProfile.branding,
    customerView: initialProfile.customerView,
    mediaGallery: initialProfile.mediaGallery,
    publicSlug: initialProfile.publicSlug,
    metaTitle: initialProfile.metaTitle,
    metaDescription: initialProfile.metaDescription,
    published: initialProfile.published,
  });
  const [fieldErrors, setFieldErrors] = useState<{
    contact: Partial<Record<keyof ClubProfileInput["contact"], string>>;
    social: Partial<Record<keyof ClubProfileInput["socialLinks"], string>>;
  }>({ contact: {}, social: {} });

  function updateLocation(
    locationId: string,
    updates: Partial<ClubProfileLocation>,
  ) {
    setProfile((current) => ({
      ...current,
      locations: current.locations.map((location) =>
        location.id === locationId ? { ...location, ...updates } : location,
      ),
    }));
  }

  function setMainLocation(locationId: string) {
    setProfile((current) => ({
      ...current,
      locations: current.locations.map((location) => ({
        ...location,
        isMain: location.id === locationId,
      })),
    }));
  }

  function addLocation() {
    setProfile((current) => ({
      ...current,
      locations: [...current.locations, createEmptyLocation()],
    }));
  }

  function removeLocation(locationId: string) {
    setProfile((current) => ({
      ...current,
      locations: current.locations.filter(
        (location) => location.id !== locationId,
      ),
    }));
  }

  function addMediaItem(type: ClubProfileMediaItem["type"]) {
    setProfile((current) => ({
      ...current,
      mediaGallery: [
        ...current.mediaGallery,
        {
          id: crypto.randomUUID(),
          type,
          url: "",
          caption: "",
          sortOrder: current.mediaGallery.length,
        },
      ],
    }));
  }

  function updateMediaItem(
    mediaId: string,
    updates: Partial<ClubProfileMediaItem>,
  ) {
    setProfile((current) => ({
      ...current,
      mediaGallery: current.mediaGallery.map((item) =>
        item.id === mediaId ? { ...item, ...updates } : item,
      ),
    }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const validation = validateClubProfileInput(profile);
    setFieldErrors({
      contact: validation.contactErrors,
      social: validation.socialErrors,
    });

    if (!validation.isValid) {
      return;
    }

    onSave(profile);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <nav className="sticky top-20 z-10 -mx-1 overflow-x-auto rounded-2xl border border-zinc-200/80 bg-white/95 px-3 py-3 shadow-sm backdrop-blur">
        <div className="flex min-w-max gap-2">
          {sectionLinks.map((link) => (
            <a
              key={link.id}
              href={`#${link.id}`}
              className="rounded-full px-3 py-1.5 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900"
            >
              {link.label}
            </a>
          ))}
        </div>
      </nav>

      <ProfileSection
        id="identity"
        title="Club identity"
        description="How parents first discover and recognise your club."
      >
        <div className="grid gap-5 sm:grid-cols-[160px_1fr]">
          <ProfileImagePlaceholder
            label="Club logo"
            hint="Square image, 400×400 recommended"
          />
          <ProfileImagePlaceholder
            label="Cover banner"
            hint="Wide image, 1600×600 recommended"
            aspect="banner"
          />
        </div>
        <ProfileField label="Club name" htmlFor="club-name">
          <ProfileTextInput
            id="club-name"
            value={profile.clubName}
            onChange={(value) =>
              setProfile((current) => ({
                ...current,
                clubName: value,
                publicSlug: current.publicSlug || slugifyClubName(value),
              }))
            }
            placeholder="PlayVera Juniors"
            disabled={profileLocked}
          />
          {profileLocked ? (
            <p className="mt-1.5 text-xs text-violet-700">{lockedMessage}</p>
          ) : null}
        </ProfileField>
        <ProfileField label="Short tagline" htmlFor="tagline">
          <ProfileTextInput
            id="tagline"
            value={profile.tagline}
            onChange={(value) =>
              setProfile((current) => ({ ...current, tagline: value }))
            }
            placeholder="Confidence through play, every week."
          />
        </ProfileField>
        <ProfileField label="Club description" htmlFor="short-description">
          <ProfileTextarea
            id="short-description"
            value={profile.shortDescription}
            onChange={(value) =>
              setProfile((current) => ({ ...current, shortDescription: value }))
            }
            placeholder="A concise summary for cards and search results."
            rows={3}
          />
        </ProfileField>
        <ProfileField
          label="Established year"
          htmlFor="established-year"
          hint="Optional"
        >
          <ProfileTextInput
            id="established-year"
            type="number"
            value={profile.establishedYear?.toString() ?? ""}
            onChange={(value) =>
              setProfile((current) => ({
                ...current,
                establishedYear: value ? Number(value) : null,
              }))
            }
            placeholder="2018"
          />
        </ProfileField>
        <div className="rounded-xl border border-zinc-200 bg-zinc-50/70 px-4 py-3">
          <p className="text-sm font-medium text-zinc-900">
            Verification: {verificationStatusLabels[profile.verificationStatus]}
          </p>
          <p className="mt-1 text-xs text-zinc-500">
            Ownership checks for website, socials, and email will be added in a
            future release.
          </p>
        </div>
      </ProfileSection>

      <ProfileSection
        id="about"
        title="About"
        description="Tell parents what you offer and who it is for."
      >
        <ProfileField label="Long description" htmlFor="long-description">
          <ProfileTextarea
            id="long-description"
            value={profile.longDescription}
            onChange={(value) =>
              setProfile((current) => ({ ...current, longDescription: value }))
            }
            rows={5}
          />
        </ProfileField>
        <ProfileField label="What makes your club unique" htmlFor="unique-points">
          <ProfileTextarea
            id="unique-points"
            value={profile.uniqueSellingPoints}
            onChange={(value) =>
              setProfile((current) => ({
                ...current,
                uniqueSellingPoints: value,
              }))
            }
            rows={3}
          />
        </ProfileField>
        <ProfileField label="Categories offered">
          <ProfileChipGroup
            options={CLUB_CATEGORY_OPTIONS}
            selected={profile.categories}
            onToggle={(value) =>
              setProfile((current) => ({
                ...current,
                categories: toggleListValue(current.categories, value),
              }))
            }
          />
        </ProfileField>
        <ProfileField label="Age ranges">
          <ProfileChipGroup
            options={CLUB_AGE_RANGE_OPTIONS}
            selected={profile.ageRanges}
            onToggle={(value) =>
              setProfile((current) => ({
                ...current,
                ageRanges: toggleListValue(current.ageRanges, value),
              }))
            }
          />
        </ProfileField>
        <ProfileField label="Accessibility options">
          <ProfileChipGroup
            options={CLUB_ACCESSIBILITY_OPTIONS}
            selected={profile.accessibilityOptions}
            onToggle={(value) =>
              setProfile((current) => ({
                ...current,
                accessibilityOptions: toggleListValue(
                  current.accessibilityOptions,
                  value,
                ),
              }))
            }
          />
        </ProfileField>
      </ProfileSection>

      <ProfileSection
        id="locations"
        title="Locations"
        description="Add every venue parents may visit. Group activities by location on your public page."
      >
        <div className="space-y-4">
          {profile.locations.map((location, index) => (
            <div
              key={location.id}
              className="rounded-2xl border border-zinc-200 bg-zinc-50/60 p-4"
            >
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm font-semibold text-zinc-900">
                  Venue {index + 1}
                </p>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setMainLocation(location.id)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
                      location.isMain
                        ? "bg-teal-600 text-white"
                        : "bg-white text-zinc-700 ring-1 ring-zinc-200"
                    }`}
                  >
                    Main venue
                  </button>
                  {profile.locations.length > 1 ? (
                    <button
                      type="button"
                      onClick={() => removeLocation(location.id)}
                      className="rounded-lg px-3 py-1.5 text-xs font-semibold text-rose-700 ring-1 ring-rose-200"
                    >
                      Remove
                    </button>
                  ) : null}
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <ProfileField label="Venue name">
                  <ProfileTextInput
                    id={`venue-name-${location.id}`}
                    value={location.venueName}
                    onChange={(value) =>
                      updateLocation(location.id, { venueName: value })
                    }
                    placeholder="Riverside Community Centre"
                  />
                </ProfileField>
                <ProfileField label="Radius served (miles)">
                  <ProfileTextInput
                    id={`radius-${location.id}`}
                    type="number"
                    value={String(location.radiusMiles)}
                    onChange={(value) =>
                      updateLocation(location.id, {
                        radiusMiles: Number(value) || 0,
                      })
                    }
                  />
                </ProfileField>
                <ProfileField label="Address line 1">
                  <ProfileTextInput
                    id={`address-1-${location.id}`}
                    value={location.addressLine1}
                    onChange={(value) =>
                      updateLocation(location.id, { addressLine1: value })
                    }
                  />
                </ProfileField>
                <ProfileField label="Address line 2">
                  <ProfileTextInput
                    id={`address-2-${location.id}`}
                    value={location.addressLine2}
                    onChange={(value) =>
                      updateLocation(location.id, { addressLine2: value })
                    }
                  />
                </ProfileField>
                <ProfileField label="Town/city">
                  <ProfileTextInput
                    id={`town-${location.id}`}
                    value={location.townCity}
                    onChange={(value) =>
                      updateLocation(location.id, { townCity: value })
                    }
                  />
                </ProfileField>
                <ProfileField label="Postcode">
                  <ProfileTextInput
                    id={`postcode-${location.id}`}
                    value={location.postcode}
                    onChange={(value) =>
                      updateLocation(location.id, { postcode: value })
                    }
                  />
                </ProfileField>
              </div>
              <p className="mt-3 text-xs text-zinc-500">
                Map pin: {location.latitude.toFixed(4)},{" "}
                {location.longitude.toFixed(4)} (static placeholder — pin editor
                coming later)
              </p>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={addLocation}
          className="rounded-xl border border-dashed border-zinc-300 px-4 py-3 text-sm font-semibold text-zinc-700 transition-colors hover:border-zinc-400 hover:bg-zinc-50"
        >
          Add another venue
        </button>
      </ProfileSection>

      <ProfileSection
        id="contact"
        title="Contact"
        description="Required email plus optional phone, WhatsApp, and website."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <ProfileField label="Email" htmlFor="contact-email" hint="Required">
            <ProfileTextInput
              id="contact-email"
              type="email"
              value={profile.contact.email}
              onChange={(value) =>
                setProfile((current) => ({
                  ...current,
                  contact: { ...current.contact, email: value },
                }))
              }
              placeholder="hello@yourclub.com"
            />
            {fieldErrors.contact.email ? (
              <p className="mt-1 text-xs text-rose-600">
                {fieldErrors.contact.email}
              </p>
            ) : null}
          </ProfileField>
          <ProfileField label="Phone number" htmlFor="contact-phone" hint="Optional">
            <ProfileTextInput
              id="contact-phone"
              value={profile.contact.phone}
              onChange={(value) =>
                setProfile((current) => ({
                  ...current,
                  contact: { ...current.contact, phone: value },
                }))
              }
              placeholder="+44 20 7946 0123"
            />
            {fieldErrors.contact.phone ? (
              <p className="mt-1 text-xs text-rose-600">
                {fieldErrors.contact.phone}
              </p>
            ) : null}
          </ProfileField>
          <ProfileField label="WhatsApp" htmlFor="contact-whatsapp" hint="Optional">
            <ProfileTextInput
              id="contact-whatsapp"
              value={profile.contact.whatsapp}
              onChange={(value) =>
                setProfile((current) => ({
                  ...current,
                  contact: { ...current.contact, whatsapp: value },
                }))
              }
              placeholder="+447700900123"
            />
            {fieldErrors.contact.whatsapp ? (
              <p className="mt-1 text-xs text-rose-600">
                {fieldErrors.contact.whatsapp}
              </p>
            ) : null}
          </ProfileField>
          <ProfileField label="Website" htmlFor="contact-website" hint="Optional">
            <ProfileTextInput
              id="contact-website"
              value={profile.contact.website}
              onChange={(value) =>
                setProfile((current) => ({
                  ...current,
                  contact: { ...current.contact, website: value },
                }))
              }
              placeholder="https://yourclub.com"
            />
            {fieldErrors.contact.website ? (
              <p className="mt-1 text-xs text-rose-600">
                {fieldErrors.contact.website}
              </p>
            ) : null}
          </ProfileField>
        </div>
      </ProfileSection>

      <ProfileSection
        id="social"
        title="Social media"
        description="Paste full profile URLs. Parents see icon buttons, not raw links."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          {CLUB_SOCIAL_PLATFORMS.map((platform) => (
            <ProfileField
              key={platform}
              label={socialPlatformLabels[platform]}
              htmlFor={`social-${platform}`}
            >
              <ProfileTextInput
                id={`social-${platform}`}
                value={profile.socialLinks[platform]}
                onChange={(value) =>
                  setProfile((current) => ({
                    ...current,
                    socialLinks: {
                      ...current.socialLinks,
                      [platform]: value,
                    },
                  }))
                }
                placeholder={socialPlatformPlaceholders[platform]}
              />
              {fieldErrors.social[platform] ? (
                <p className="mt-1 text-xs text-rose-600">
                  {fieldErrors.social[platform]}
                </p>
              ) : null}
            </ProfileField>
          ))}
        </div>
      </ProfileSection>

      <ProfileSection
        id="branding"
        title="Club branding"
        description="Colours and presentation for your public club page."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <ProfileField label="Primary colour" htmlFor="primary-color">
            <ProfileTextInput
              id="primary-color"
              value={profile.branding.primaryColor}
              onChange={(value) =>
                setProfile((current) => ({
                  ...current,
                  branding: { ...current.branding, primaryColor: value },
                }))
              }
            />
          </ProfileField>
          <ProfileField label="Secondary colour" htmlFor="secondary-color">
            <ProfileTextInput
              id="secondary-color"
              value={profile.branding.secondaryColor}
              onChange={(value) =>
                setProfile((current) => ({
                  ...current,
                  branding: { ...current.branding, secondaryColor: value },
                }))
              }
            />
          </ProfileField>
          <ProfileField label="Button style" htmlFor="button-style">
            <ProfileSelect
              id="button-style"
              value={profile.branding.buttonStyle}
              onChange={(value) =>
                setProfile((current) => ({
                  ...current,
                  branding: {
                    ...current.branding,
                    buttonStyle: value as typeof current.branding.buttonStyle,
                  },
                }))
              }
              options={Object.entries(buttonStyleLabels).map(
                ([value, label]) => ({ value, label }),
              )}
            />
          </ProfileField>
          <ProfileField label="Card style" htmlFor="card-style">
            <ProfileSelect
              id="card-style"
              value={profile.branding.cardStyle}
              onChange={(value) =>
                setProfile((current) => ({
                  ...current,
                  branding: {
                    ...current.branding,
                    cardStyle: value as typeof current.branding.cardStyle,
                  },
                }))
              }
              options={Object.entries(cardStyleLabels).map(([value, label]) => ({
                value,
                label,
              }))}
            />
          </ProfileField>
          <ProfileField label="Font preset" htmlFor="font-preset">
            <ProfileSelect
              id="font-preset"
              value={profile.branding.fontPreset}
              onChange={(value) =>
                setProfile((current) => ({
                  ...current,
                  branding: {
                    ...current.branding,
                    fontPreset: value as typeof current.branding.fontPreset,
                  },
                }))
              }
              options={Object.entries(fontPresetLabels).map(([value, label]) => ({
                value,
                label,
              }))}
            />
          </ProfileField>
        </div>
        <div
          className="rounded-2xl p-5 text-white"
          style={{
            background: `linear-gradient(135deg, ${profile.branding.primaryColor}, ${profile.branding.secondaryColor})`,
          }}
        >
          <p className="text-sm font-semibold">Branding preview</p>
          <p className="mt-2 text-xs text-white/85">
            Buttons, cards, and headings on your public page will use these
            colours.
          </p>
          <button
            type="button"
            className="mt-4 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-zinc-900"
          >
            Book now
          </button>
        </div>
      </ProfileSection>

      <ProfileSection
        id="customer-view"
        title="Customer view settings"
        description="Choose what parents see on your public club page."
      >
        <div className="grid gap-3 sm:grid-cols-2">
          {(
            [
              ["showTeam", "Show team", "Display coaches and staff profiles."],
              [
                "showTestimonials",
                "Show testimonials",
                "Surface parent reviews and quotes.",
              ],
              ["showMap", "Show map", "Display venue locations on a map."],
              [
                "showSocialLinks",
                "Show social links",
                "Show Instagram, TikTok, and other channels.",
              ],
              [
                "showAgeRanges",
                "Show age ranges",
                "Highlight who each activity is suitable for.",
              ],
              [
                "showGallery",
                "Show gallery",
                "Display photos, videos, and highlights.",
              ],
            ] as const
          ).map(([key, label, description]) => (
            <ProfileToggle
              key={key}
              label={label}
              description={description}
              checked={profile.customerView[key]}
              onChange={(checked) =>
                setProfile((current) => ({
                  ...current,
                  customerView: { ...current.customerView, [key]: checked },
                }))
              }
            />
          ))}
        </div>
      </ProfileSection>

      <ProfileSection
        id="media"
        title="Media gallery"
        description="Photos, videos, and highlights that bring your club to life."
      >
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => addMediaItem("photo")}
            className="rounded-lg bg-zinc-900 px-3 py-2 text-xs font-semibold text-white"
          >
            Add photo
          </button>
          <button
            type="button"
            onClick={() => addMediaItem("video")}
            className="rounded-lg border border-zinc-200 px-3 py-2 text-xs font-semibold text-zinc-800"
          >
            Add video
          </button>
          <button
            type="button"
            onClick={() => addMediaItem("highlight")}
            className="rounded-lg border border-zinc-200 px-3 py-2 text-xs font-semibold text-zinc-800"
          >
            Add highlight
          </button>
        </div>
        <div className="space-y-3">
          {profile.mediaGallery.map((item) => (
            <div
              key={item.id}
              className="grid gap-3 rounded-xl border border-zinc-200 p-4 sm:grid-cols-[120px_1fr]"
            >
              <ProfileImagePlaceholder
                label={item.type}
                hint="Upload coming soon"
              />
              <div className="space-y-3">
                <ProfileField label="Media URL">
                  <ProfileTextInput
                    id={`media-url-${item.id}`}
                    value={item.url}
                    onChange={(value) =>
                      updateMediaItem(item.id, { url: value })
                    }
                    placeholder="https://..."
                  />
                </ProfileField>
                <ProfileField label="Caption">
                  <ProfileTextInput
                    id={`media-caption-${item.id}`}
                    value={item.caption}
                    onChange={(value) =>
                      updateMediaItem(item.id, { caption: value })
                    }
                  />
                </ProfileField>
              </div>
            </div>
          ))}
        </div>
      </ProfileSection>

      <ProfileSection
        id="seo"
        title="SEO & publishing"
        description="Control your public URL and how your club appears in search."
      >
        <ProfileField
          label="Public URL slug"
          htmlFor="public-slug"
          hint="Used for your parent-facing club page."
        >
          <ProfileTextInput
            id="public-slug"
            value={profile.publicSlug}
            onChange={(value) =>
              setProfile((current) => ({
                ...current,
                publicSlug: slugifyClubName(value),
              }))
            }
            placeholder="playvera-juniors"
          />
        </ProfileField>
        <ProfileField label="Meta title" htmlFor="meta-title">
          <ProfileTextInput
            id="meta-title"
            value={profile.metaTitle}
            onChange={(value) =>
              setProfile((current) => ({ ...current, metaTitle: value }))
            }
          />
        </ProfileField>
        <ProfileField label="Meta description" htmlFor="meta-description">
          <ProfileTextarea
            id="meta-description"
            value={profile.metaDescription}
            onChange={(value) =>
              setProfile((current) => ({ ...current, metaDescription: value }))
            }
            rows={3}
          />
        </ProfileField>
        <ProfileToggle
          label="Publish club page"
          description="Make your public club page visible to parents."
          checked={profile.published}
          onChange={(checked) =>
            setProfile((current) => ({ ...current, published: checked }))
          }
        />
      </ProfileSection>

      <div className="sticky bottom-4 flex flex-wrap gap-3 rounded-2xl border border-zinc-200 bg-white/95 p-4 shadow-lg backdrop-blur">
        <button
          type="submit"
          className="rounded-xl bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-zinc-800"
        >
          Save club profile
        </button>
        <p className="self-center text-xs text-zinc-500">
          Static UI only — saved locally until Supabase sync is connected.
        </p>
      </div>
    </form>
  );
}
