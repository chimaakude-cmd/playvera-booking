export type ActivityCategoryGroup =
  | "sports"
  | "education"
  | "holiday"
  | "creative"
  | "wellbeing";

export type ActivityChip = {
  label: string;
  icon: string;
  query: string;
  group: ActivityCategoryGroup;
  /** Lower rank = more popular (shown first). */
  popularity: number;
};

export const ACTIVITY_CATEGORY_LABELS: Record<ActivityCategoryGroup, string> = {
  sports: "Sports",
  education: "Education & Clubs",
  holiday: "Holiday & Childcare",
  creative: "Creative",
  wellbeing: "Wellbeing",
};

/** Number of activity chips shown on the homepage row (before the More tile). */
export const INITIAL_ACTIVITY_VISIBLE_COUNT = 7;

export const ACTIVITY_CATALOG: ActivityChip[] = [
  // Existing featured activities (most popular)
  {
    label: "Football",
    icon: "⚽",
    query: "Football",
    group: "sports",
    popularity: 1,
  },
  {
    label: "Swimming",
    icon: "🏊",
    query: "Swimming",
    group: "sports",
    popularity: 2,
  },
  {
    label: "Camps",
    icon: "🏕",
    query: "camps",
    group: "holiday",
    popularity: 3,
  },
  {
    label: "Arts",
    icon: "🎨",
    query: "arts",
    group: "creative",
    popularity: 4,
  },
  {
    label: "Martial Arts",
    icon: "🥋",
    query: "martial arts",
    group: "sports",
    popularity: 5,
  },
  {
    label: "Performing Arts",
    icon: "🎭",
    query: "performing arts",
    group: "creative",
    popularity: 6,
  },

  // Sports
  {
    label: "Basketball",
    icon: "🏀",
    query: "basketball",
    group: "sports",
    popularity: 7,
  },
  {
    label: "Tennis",
    icon: "🎾",
    query: "tennis",
    group: "sports",
    popularity: 8,
  },
  {
    label: "Rugby",
    icon: "🏉",
    query: "rugby",
    group: "sports",
    popularity: 9,
  },
  {
    label: "Cricket",
    icon: "🏏",
    query: "cricket",
    group: "sports",
    popularity: 10,
  },
  {
    label: "Gymnastics",
    icon: "🤸",
    query: "gymnastics",
    group: "sports",
    popularity: 11,
  },
  {
    label: "Athletics",
    icon: "🏃",
    query: "athletics",
    group: "sports",
    popularity: 12,
  },
  {
    label: "Dance",
    icon: "💃",
    query: "dance",
    group: "sports",
    popularity: 13,
  },
  {
    label: "Boxing",
    icon: "🥊",
    query: "boxing",
    group: "sports",
    popularity: 14,
  },
  {
    label: "Fencing",
    icon: "🤺",
    query: "fencing",
    group: "sports",
    popularity: 15,
  },
  {
    label: "Archery",
    icon: "🏹",
    query: "archery",
    group: "sports",
    popularity: 16,
  },
  {
    label: "Multi-Sport",
    icon: "🏅",
    query: "multi-sport",
    group: "sports",
    popularity: 17,
  },
  {
    label: "Netball",
    icon: "🥅",
    query: "netball",
    group: "sports",
    popularity: 18,
  },
  {
    label: "Badminton",
    icon: "🏸",
    query: "badminton",
    group: "sports",
    popularity: 19,
  },
  {
    label: "Dodgeball",
    icon: "🎯",
    query: "dodgeball",
    group: "sports",
    popularity: 20,
  },

  // Education & Clubs
  {
    label: "Tuition",
    icon: "📚",
    query: "tuition",
    group: "education",
    popularity: 21,
  },
  {
    label: "Homework Club",
    icon: "✏️",
    query: "homework club",
    group: "education",
    popularity: 22,
  },
  {
    label: "Coding",
    icon: "💻",
    query: "coding",
    group: "education",
    popularity: 23,
  },
  {
    label: "STEM",
    icon: "🔬",
    query: "stem",
    group: "education",
    popularity: 24,
  },
  {
    label: "Languages",
    icon: "🌍",
    query: "languages",
    group: "education",
    popularity: 25,
  },
  {
    label: "Chess",
    icon: "♟️",
    query: "chess",
    group: "education",
    popularity: 26,
  },
  {
    label: "Science",
    icon: "🧪",
    query: "science",
    group: "education",
    popularity: 27,
  },
  {
    label: "Reading Club",
    icon: "📖",
    query: "reading club",
    group: "education",
    popularity: 28,
  },

  // Holiday & Childcare
  {
    label: "Breakfast Club",
    icon: "🥐",
    query: "breakfast club",
    group: "holiday",
    popularity: 29,
  },
  {
    label: "After School Club",
    icon: "🎒",
    query: "after school club",
    group: "holiday",
    popularity: 30,
  },
  {
    label: "Holiday Camp",
    icon: "⛺",
    query: "holiday camp",
    group: "holiday",
    popularity: 31,
  },
  {
    label: "Wraparound Care",
    icon: "🌅",
    query: "wraparound care",
    group: "holiday",
    popularity: 32,
  },

  // Creative
  {
    label: "Music",
    icon: "🎵",
    query: "music",
    group: "creative",
    popularity: 33,
  },
  {
    label: "Drama",
    icon: "🎭",
    query: "drama",
    group: "creative",
    popularity: 34,
  },
  {
    label: "Art & Design",
    icon: "🖌️",
    query: "art and design",
    group: "creative",
    popularity: 35,
  },
  {
    label: "Photography",
    icon: "📷",
    query: "photography",
    group: "creative",
    popularity: 36,
  },
  {
    label: "Media",
    icon: "🎬",
    query: "media",
    group: "creative",
    popularity: 37,
  },

  // Wellbeing
  {
    label: "Yoga",
    icon: "🧘",
    query: "yoga",
    group: "wellbeing",
    popularity: 38,
  },
  {
    label: "Mindfulness",
    icon: "🌿",
    query: "mindfulness",
    group: "wellbeing",
    popularity: 39,
  },
  {
    label: "SEN Activities",
    icon: "💙",
    query: "sen activities",
    group: "wellbeing",
    popularity: 40,
  },
];

export function getActivitiesByPopularity(
  catalog: ActivityChip[] = ACTIVITY_CATALOG,
): ActivityChip[] {
  return [...catalog].sort((a, b) => a.popularity - b.popularity);
}

export const ACTIVITY_CATEGORY_ORDER: ActivityCategoryGroup[] = [
  "sports",
  "education",
  "holiday",
  "creative",
  "wellbeing",
];

export function groupActivitiesByCategory(
  activities: ActivityChip[],
): Partial<Record<ActivityCategoryGroup, ActivityChip[]>> {
  const grouped: Partial<Record<ActivityCategoryGroup, ActivityChip[]>> = {};

  for (const activity of activities) {
    grouped[activity.group] ??= [];
    grouped[activity.group]!.push(activity);
  }

  return grouped;
}

export function filterActivities(
  query: string,
  catalog: ActivityChip[] = ACTIVITY_CATALOG,
): ActivityChip[] {
  const normalized = query.trim().toLowerCase();
  const sorted = getActivitiesByPopularity(catalog);

  if (!normalized) {
    return sorted;
  }

  return sorted.filter(
    (activity) =>
      activity.label.toLowerCase().includes(normalized) ||
      activity.query.toLowerCase().includes(normalized) ||
      ACTIVITY_CATEGORY_LABELS[activity.group].toLowerCase().includes(normalized),
  );
}
