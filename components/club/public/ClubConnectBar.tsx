import type { ClubProfileContact, ClubSocialLinks } from "@/lib/club-profile";
import {
  buildMailtoHref,
  buildTelHref,
  buildWhatsAppHref,
  getActiveSocialLinks,
  normalizeHttpUrl,
  socialPlatformLabels,
} from "@/lib/club-profile";
import { SocialPlatformIcon } from "./SocialPlatformIcon";

const actionButtonClassName =
  "inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-zinc-200 bg-white text-zinc-700 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-teal-200 hover:bg-teal-50 hover:text-teal-700 hover:shadow-md";

type ConnectAction = {
  key: string;
  label: string;
  href: string;
  icon: Parameters<typeof SocialPlatformIcon>[0]["platform"];
  external?: boolean;
};

function buildConnectActions(
  contact: ClubProfileContact,
  socialLinks: ClubSocialLinks,
  includeSocial: boolean,
): ConnectAction[] {
  const actions: ConnectAction[] = [];

  if (includeSocial) {
    for (const { platform, url } of getActiveSocialLinks(socialLinks)) {
      actions.push({
        key: platform,
        label: socialPlatformLabels[platform],
        href: url,
        icon: platform,
        external: true,
      });
    }
  }

  if (contact.phone.trim()) {
    actions.push({
      key: "phone",
      label: "Call",
      href: buildTelHref(contact.phone),
      icon: "phone",
    });
  }

  if (contact.email.trim()) {
    actions.push({
      key: "email",
      label: "Email",
      href: buildMailtoHref(contact.email),
      icon: "email",
    });
  }

  return actions;
}

export function ClubConnectBar({
  contact,
  socialLinks,
  showSocialLinks = true,
  title = "Connect",
}: {
  contact: ClubProfileContact;
  socialLinks: ClubSocialLinks;
  showSocialLinks?: boolean;
  title?: string;
}) {
  const actions = buildConnectActions(contact, socialLinks, showSocialLinks);

  if (actions.length === 0) {
    return null;
  }

  return (
    <section className="rounded-3xl border border-zinc-200/80 bg-white p-6 shadow-sm sm:p-8">
      <h2 className="text-2xl font-semibold">{title}</h2>
      <div className="mt-5 flex flex-wrap gap-3">
        {actions.map((action) => (
          <a
            key={action.key}
            href={action.href}
            target={action.external ? "_blank" : undefined}
            rel={action.external ? "noopener noreferrer" : undefined}
            aria-label={action.label}
            title={action.label}
            className={actionButtonClassName}
          >
            <SocialPlatformIcon platform={action.icon} />
          </a>
        ))}
      </div>
    </section>
  );
}

type ContactMethodItem = {
  label: string;
  href: string;
  text: string;
  external?: boolean;
};

export function ClubContactMethods({
  contact,
}: {
  contact: ClubProfileContact;
}) {
  const items = [
    contact.email.trim()
      ? {
          label: "Email",
          href: buildMailtoHref(contact.email),
          text: contact.email,
        }
      : null,
    contact.phone.trim()
      ? {
          label: "Phone",
          href: buildTelHref(contact.phone),
          text: contact.phone,
        }
      : null,
    contact.whatsapp.trim()
      ? {
          label: "WhatsApp",
          href: buildWhatsAppHref(contact.whatsapp),
          text: "Message on WhatsApp",
          external: true,
        }
      : null,
    contact.website.trim()
      ? (() => {
          const url = normalizeHttpUrl(contact.website);
          return url
            ? {
                label: "Website",
                href: url,
                text: "Visit website",
                external: true,
              }
            : null;
        })()
      : null,
  ].filter((item): item is ContactMethodItem => item !== null);

  if (items.length === 0) {
    return null;
  }

  return (
    <section className="rounded-3xl border border-zinc-200/80 bg-white p-6 shadow-sm sm:p-8">
      <h2 className="text-2xl font-semibold">Contact</h2>
      <div className="mt-5 flex flex-wrap gap-3">
        {items.map((item) => (
          <a
            key={item.label}
            href={item.href}
            target={item.external ? "_blank" : undefined}
            rel={item.external ? "noopener noreferrer" : undefined}
            className="inline-flex items-center gap-2 rounded-2xl border border-zinc-200 bg-zinc-50/70 px-4 py-3 text-sm font-medium text-zinc-800 transition-colors hover:border-teal-200 hover:bg-teal-50 hover:text-teal-800"
          >
            <SocialPlatformIcon
              platform={
                item.label === "Email"
                  ? "email"
                  : item.label === "Phone"
                    ? "phone"
                    : item.label === "WhatsApp"
                      ? "whatsapp"
                      : "website"
              }
              className="h-4 w-4"
            />
            {item.text}
          </a>
        ))}
      </div>
    </section>
  );
}
