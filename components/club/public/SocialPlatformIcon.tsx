import type { ClubSocialPlatform } from "@/lib/club-profile";

type SocialPlatformIconProps = {
  platform: ClubSocialPlatform | "email" | "phone" | "whatsapp";
  className?: string;
};

export function SocialPlatformIcon({
  platform,
  className = "h-5 w-5",
}: SocialPlatformIconProps) {
  switch (platform) {
    case "instagram":
      return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden>
          <rect x="3" y="3" width="18" height="18" rx="5" fill="none" stroke="currentColor" strokeWidth="1.8" />
          <circle cx="12" cy="12" r="4.2" fill="none" stroke="currentColor" strokeWidth="1.8" />
          <circle cx="17.2" cy="6.8" r="1.1" fill="currentColor" />
        </svg>
      );
    case "facebook":
      return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden>
          <path
            d="M14 8.5h2.5V5.5H14c-2.2 0-3.5 1.4-3.5 3.6V11H8v3h2.5v7H14v-7h2.7l.3-3H14V9.1c0-.8.2-1.1 1.2-1.1Z"
            fill="currentColor"
          />
        </svg>
      );
    case "linkedin":
      return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden>
          <path
            d="M6.5 9.5H9.5V18.5H6.5V9.5ZM8 8.2C7.1 8.2 6.4 7.5 6.4 6.6C6.4 5.7 7.1 5 8 5C8.9 5 9.6 5.7 9.6 6.6C9.6 7.5 8.9 8.2 8 8.2ZM11.2 9.5H14V10.4C14.5 9.7 15.5 9.2 16.8 9.2C19.4 9.2 20 10.8 20 13.2V18.5H17V13.7C17 12.5 17 11.2 15.6 11.2C14.2 11.2 14 12.3 14 13.6V18.5H11.2V9.5Z"
            fill="currentColor"
          />
        </svg>
      );
    case "x":
      return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden>
          <path
            d="M5 5L11.2 13.1L5.2 19H7.1L12 14.5L16.1 19H19L12.6 10.4L18.1 5H16.2L11.8 9L8.2 5H5ZM7.6 6.3H7.9L16.4 17.7H16.1L7.6 6.3Z"
            fill="currentColor"
          />
        </svg>
      );
    case "tiktok":
      return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden>
          <path
            d="M14.5 5.2c.8 1 2 1.7 3.3 1.8v2.6c-1.2 0-2.3-.4-3.3-1v6.8c0 2.8-2.2 5-5 5s-5-2.2-5-5 2.2-5 5-5c.4 0 .8 0 1.2.1v2.8c-.4-.2-.8-.3-1.2-.3-1.2 0-2.2 1-2.2 2.2s1 2.2 2.2 2.2 2.2-1 2.2-2.2V5.2h2.8Z"
            fill="currentColor"
          />
        </svg>
      );
    case "youtube":
      return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden>
          <path
            d="M10 9.8v4.4l4.2-2.2L10 9.8ZM20.2 7.4c.2.8.3 1.9.3 3.6s-.1 2.8-.3 3.6c-.2.9-.9 1.6-1.8 1.8-1 .3-5.2.3-5.2.3s-4.2 0-5.2-.3c-.9-.2-1.6-.9-1.8-1.8C5.1 13.8 5 12.7 5 11s.1-2.8.3-3.6c.2-.9.9-1.6 1.8-1.8C7.8 5.3 12 5.3 12 5.3s4.2 0 5.2.3c.9.2 1.6.9 1.8 1.8Z"
            fill="currentColor"
          />
        </svg>
      );
    case "threads":
      return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden>
          <path
            d="M12 4.5c2.8 0 5 1.1 6.4 3.1-.9.4-1.7 1-2.4 1.7-1-.9-2.3-1.4-4-1.4-2.8 0-5 1.7-5 4.1 0 2.3 2.2 4 5 4 1.4 0 2.5-.3 3.4-.9.2 1.2.9 2.2 2 2.8-1.3.7-2.9 1.1-4.7 1.1-4.2 0-7.5-2.5-7.5-6 0-3.6 3.4-6.5 8.8-6.5Z"
            fill="currentColor"
          />
        </svg>
      );
    case "snapchat":
      return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden>
          <path
            d="M12 5.5c2.2 0 4 1.4 4.6 3.4-.8.2-1.5.6-2.1 1.1.3-1 .9-1.8 1.7-2.3C14.8 6.4 13.5 6 12 6c-3 0-5.4 1.8-5.4 4.1 0 .8.3 1.5.8 2.1-.7-.1-1.3-.4-1.8-.8.5 2.1 2.6 3.6 5.1 3.6 1 0 1.9-.2 2.7-.6.2.8.7 1.5 1.4 2-.9.5-2 .8-3.2.8-3.8 0-6.8-2.2-6.8-5.1 0-2.2 1.8-4.2 4.7-5.1.5-.2 1.1-.3 1.7-.4.4-1.2 1.5-2 2.8-2Z"
            fill="currentColor"
          />
        </svg>
      );
    case "pinterest":
      return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden>
          <path
            d="M12 5c-3.9 0-7 3-7 6.7 0 2.8 1.7 5.2 4.2 6.2-.2-.9-.1-2 .5-3 .5-1 3.2-12.7 3.2-12.7s-.8-.6-.8-1.5c0-1.4.8-2.5 1.8-2.5.8 0 1.2.6 1.2 1.4 0 .9-.6 2.2-.9 3.4-.3 1.1.6 2 1.7 2 2 0 3.6-2.1 3.6-5.2C17.3 7.5 15 5 12 5Z"
            fill="currentColor"
          />
        </svg>
      );
    case "website":
      return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden>
          <circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
          <path d="M4 12h16M12 3.5c2.5 2.8 2.5 14.2 0 17M12 3.5c-2.5 2.8-2.5 14.2 0 17" fill="none" stroke="currentColor" strokeWidth="1.4" />
        </svg>
      );
    case "email":
      return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden>
          <rect x="4" y="6" width="16" height="12" rx="2" fill="none" stroke="currentColor" strokeWidth="1.8" />
          <path d="M4.5 7.5 12 13l7.5-5.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
        </svg>
      );
    case "phone":
      return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden>
          <path
            d="M8.2 5.8c.4-.9 1.4-1.3 2.3-.9l1.8.8c.8.4 1.2 1.3 1 2.2l-.5 2c3.1 1.8 4.8 3.5 6.6 6.6l2-.5c.9-.2 1.8.2 2.2 1l.8 1.8c.4.9 0 1.9-.9 2.3l-1.7.7c-1.2.5-2.6.1-4.7-1.4-2.7-1.9-4.8-4-6.7-6.7-1.5-2.1-1.9-3.5-1.4-4.7l.7-1.7Z"
            fill="currentColor"
          />
        </svg>
      );
    case "whatsapp":
      return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden>
          <path
            d="M12 5c-3.3 0-6 2.5-6 5.6 0 1.1.3 2.1.9 3L5.5 18l4.6-1.2c.9.5 1.9.8 2.9.8 3.3 0 6-2.5 6-5.6S15.3 5 12 5Zm0 9.8c-.8 0-1.6-.2-2.3-.6l-.5-.3-2.7.7.7-2.6-.3-.5c-.5-.8-.8-1.7-.8-2.6 0-2.4 2.1-4.3 4.9-4.3s4.9 1.9 4.9 4.3-2.1 4.3-4.9 4.3Z"
            fill="currentColor"
          />
        </svg>
      );
    default:
      return null;
  }
}
