import {
  Brush,
  CircleDot,
  Drama,
  Flame,
  Palette,
  Shield,
  Sparkles,
  Swords,
  Tent,
  Theater,
  Trophy,
  Waves,
  type LucideIcon,
} from "lucide-react";
import type { ActivityChip } from "@/lib/home/activity-catalog";

const ACTIVITY_ICON_MAP: Record<string, LucideIcon> = {
  Football: CircleDot,
  Swimming: Waves,
  Camps: Tent,
  Arts: Palette,
  "Martial Arts": Swords,
  "Performing Arts": Theater,
  Basketball: Trophy,
  Dance: Sparkles,
  Gymnastics: Flame,
  Tennis: CircleDot,
  Rugby: Shield,
  Cricket: CircleDot,
  Hockey: CircleDot,
  "Arts & Crafts": Brush,
  Drama: Drama,
};

export function getActivityIcon(label: string): LucideIcon {
  return ACTIVITY_ICON_MAP[label] ?? Sparkles;
}

export function ActivityIcon({
  activity,
  className = "h-5 w-5",
}: {
  activity: ActivityChip;
  className?: string;
}) {
  const Icon = getActivityIcon(activity.label);
  return <Icon className={className} aria-hidden />;
}
