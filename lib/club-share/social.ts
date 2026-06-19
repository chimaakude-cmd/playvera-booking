import type { ShareContent, SharePlatform } from "./types";

export function buildShareContent(clubName: string, link: string): ShareContent {
  return {
    title: `Join us at ${clubName}`,
    body: "Check out our activities and sessions.",
    link,
  };
}

export function getWhatsAppShareUrl(clubName: string, link: string): string {
  const text = `Come and join us at ${clubName}. ${link}`;
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}

export function getFacebookShareUrl(link: string): string {
  return `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(link)}`;
}

export function getEmailShareUrl(content: ShareContent): string {
  const subject = "Come and explore our sessions";
  const body = `${content.title}\n\n${content.body}\n\n${content.link}`;
  return `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

export function getLinkedInShareUrl(link: string): string {
  return `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(link)}`;
}

export function getXShareUrl(content: ShareContent): string {
  const text = `${content.title} — ${content.body}`;
  return `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(content.link)}`;
}

export function getTelegramShareUrl(content: ShareContent): string {
  const text = `${content.title}\n${content.link}`;
  return `https://t.me/share/url?url=${encodeURIComponent(content.link)}&text=${encodeURIComponent(text)}`;
}

export function getMessengerShareUrl(link: string): string {
  return `https://www.facebook.com/dialog/send?link=${encodeURIComponent(link)}&app_id=0&redirect_uri=${encodeURIComponent(link)}`;
}

export function getSmsShareUrl(content: ShareContent): string {
  const body = `${content.title} ${content.link}`;
  return `sms:?body=${encodeURIComponent(body)}`;
}

export function getPinterestShareUrl(content: ShareContent): string {
  return `https://pinterest.com/pin/create/button/?url=${encodeURIComponent(content.link)}&description=${encodeURIComponent(content.title)}`;
}

export function getRedditShareUrl(content: ShareContent): string {
  return `https://reddit.com/submit?url=${encodeURIComponent(content.link)}&title=${encodeURIComponent(content.title)}`;
}

export function getNextdoorShareUrl(link: string): string {
  return `https://nextdoor.com/share/?url=${encodeURIComponent(link)}`;
}

export function getTeamsShareUrl(content: ShareContent): string {
  return `https://teams.microsoft.com/share?href=${encodeURIComponent(content.link)}&msgText=${encodeURIComponent(`${content.title} — ${content.body}`)}`;
}

export function getSlackShareText(content: ShareContent): string {
  return `${content.title}\n${content.body}\n${content.link}`;
}

export async function copySlackShareMessage(content: ShareContent): Promise<void> {
  await navigator.clipboard.writeText(getSlackShareText(content));
}

export type SocialShareAction = {
  platform: SharePlatform;
  label: string;
  color: string;
  action: "url" | "copy" | "native" | "instagram";
  href?: string;
};

function buildShareActions(
  clubName: string,
  link: string,
): SocialShareAction[] {
  const content = buildShareContent(clubName, link);

  return [
    {
      platform: "whatsapp",
      label: "WhatsApp",
      color: "#25D366",
      action: "url",
      href: getWhatsAppShareUrl(clubName, link),
    },
    {
      platform: "facebook",
      label: "Facebook",
      color: "#1877F2",
      action: "url",
      href: getFacebookShareUrl(link),
    },
    {
      platform: "email",
      label: "Email",
      color: "#52525b",
      action: "url",
      href: getEmailShareUrl(content),
    },
    {
      platform: "sms",
      label: "SMS",
      color: "#34C759",
      action: "url",
      href: getSmsShareUrl(content),
    },
    {
      platform: "instagram",
      label: "Instagram",
      color: "#E4405F",
      action: "instagram",
    },
    {
      platform: "linkedin",
      label: "LinkedIn",
      color: "#0A66C2",
      action: "url",
      href: getLinkedInShareUrl(link),
    },
    {
      platform: "reddit",
      label: "Reddit",
      color: "#FF4500",
      action: "url",
      href: getRedditShareUrl(content),
    },
    {
      platform: "pinterest",
      label: "Pinterest",
      color: "#BD081C",
      action: "url",
      href: getPinterestShareUrl(content),
    },
    {
      platform: "slack",
      label: "Slack",
      color: "#4A154B",
      action: "copy",
    },
    {
      platform: "teams",
      label: "Teams",
      color: "#6264A7",
      action: "url",
      href: getTeamsShareUrl(content),
    },
    {
      platform: "telegram",
      label: "Telegram",
      color: "#26A5E4",
      action: "url",
      href: getTelegramShareUrl(content),
    },
    {
      platform: "nextdoor",
      label: "Nextdoor",
      color: "#8ED500",
      action: "url",
      href: getNextdoorShareUrl(link),
    },
  ];
}

export function getPrimarySocialShareActions(
  clubName: string,
  link: string,
): SocialShareAction[] {
  const primaryPlatforms = new Set<SharePlatform>([
    "whatsapp",
    "facebook",
    "email",
    "sms",
    "instagram",
    "linkedin",
  ]);

  return buildShareActions(clubName, link).filter((action) =>
    primaryPlatforms.has(action.platform),
  );
}

export function getMoreSocialShareActions(
  clubName: string,
  link: string,
): SocialShareAction[] {
  const morePlatforms = new Set<SharePlatform>([
    "reddit",
    "pinterest",
    "slack",
    "teams",
    "telegram",
    "nextdoor",
  ]);

  return buildShareActions(clubName, link).filter((action) =>
    morePlatforms.has(action.platform),
  );
}

/** @deprecated Use getPrimarySocialShareActions and getMoreSocialShareActions. */
export function getSocialShareActions(
  clubName: string,
  link: string,
): SocialShareAction[] {
  return [
    ...getPrimarySocialShareActions(clubName, link),
    ...getMoreSocialShareActions(clubName, link),
  ];
}

export async function copyShareLink(link: string): Promise<void> {
  await navigator.clipboard.writeText(link);
}

export async function nativeShare(content: ShareContent): Promise<boolean> {
  if (typeof navigator !== "undefined" && navigator.share) {
    try {
      await navigator.share({
        title: content.title,
        text: content.body,
        url: content.link,
      });
      return true;
    } catch {
      return false;
    }
  }
  return false;
}
