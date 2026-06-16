import type { SharePlatform } from "@/lib/club-share";
import { BsMicrosoftTeams } from "react-icons/bs";
import { FaLinkedin } from "react-icons/fa6";
import {
  SiFacebook,
  SiInstagram,
  SiMessenger,
  SiNextdoor,
  SiPinterest,
  SiReddit,
  SiSlack,
  SiTelegram,
  SiWhatsapp,
  SiX,
} from "react-icons/si";
import { Link, Mail, MessageSquare, Share2 } from "lucide-react";
import type { ComponentType } from "react";

type IconProps = {
  className?: string;
  style?: React.CSSProperties;
};

type ShareIconConfig = {
  Icon: ComponentType<IconProps>;
  color: string;
};

export const SHARE_PLATFORM_ICONS: Record<SharePlatform, ShareIconConfig> = {
  whatsapp: { Icon: SiWhatsapp, color: "#25D366" },
  facebook: { Icon: SiFacebook, color: "#1877F2" },
  instagram: { Icon: SiInstagram, color: "#E4405F" },
  x: { Icon: SiX, color: "#000000" },
  email: { Icon: Mail, color: "#52525b" },
  linkedin: { Icon: FaLinkedin, color: "#0A66C2" },
  messenger: { Icon: SiMessenger, color: "#0084FF" },
  telegram: { Icon: SiTelegram, color: "#26A5E4" },
  sms: { Icon: MessageSquare, color: "#34C759" },
  copy_link: { Icon: Link, color: "#0d9488" },
  more: { Icon: Share2, color: "#71717a" },
  pinterest: { Icon: SiPinterest, color: "#BD081C" },
  reddit: { Icon: SiReddit, color: "#FF4500" },
  nextdoor: { Icon: SiNextdoor, color: "#8ED500" },
  teams: { Icon: BsMicrosoftTeams, color: "#6264A7" },
  slack: { Icon: SiSlack, color: "#4A154B" },
};

type SharePlatformIconProps = {
  platform: SharePlatform;
  className?: string;
};

export function SharePlatformIcon({
  platform,
  className = "h-6 w-6",
}: SharePlatformIconProps) {
  const { Icon, color } = SHARE_PLATFORM_ICONS[platform];
  return <Icon className={className} style={{ color }} aria-hidden />;
}
