/** Curated Unsplash photography for homepage & discovery category cards. */
export type HomeActivityCategory = {
  label: string;
  icon: string;
  query: string;
  image: string;
};

const UNSPLASH = (id: string) =>
  `https://images.unsplash.com/${id}?w=440&h=260&fit=crop&q=80&auto=format`;

/** Reliable fallback when a category image fails to load. */
export const CATEGORY_FALLBACK_IMAGE = UNSPLASH(
  "photo-1503454537195-1dcabb73ffb9",
);

export const HOME_ACTIVITY_CATEGORIES: HomeActivityCategory[] = [
  {
    label: "Football",
    icon: "⚽",
    query: "Football",
    image: UNSPLASH("photo-1574629810360-7efbbe195018"),
  },
  {
    label: "Swimming",
    icon: "🏊",
    query: "Swimming",
    image: UNSPLASH("photo-1530549387789-4c1017266635"),
  },
  {
    label: "Arts & Crafts",
    icon: "🎨",
    query: "arts",
    image: UNSPLASH("photo-1460661419371-ef9473adf5b6"),
  },
  {
    label: "Drama",
    icon: "🎭",
    query: "drama",
    image: UNSPLASH("photo-1508700115892-45ecd05ae2ad"),
  },
  {
    label: "Rugby",
    icon: "🏉",
    query: "rugby",
    image: UNSPLASH("photo-1431324155629-310a6fd5cc0e"),
  },
  {
    label: "Cricket",
    icon: "🏏",
    query: "cricket",
    image: UNSPLASH("photo-1531415074968-3383a7bb0f43"),
  },
  {
    label: "Dance",
    icon: "💃",
    query: "dance",
    image: UNSPLASH("photo-1518834107812-67b864686f66"),
  },
  {
    label: "Holiday Camps",
    icon: "🏕",
    query: "camps",
    image: UNSPLASH("photo-1529156069898-49953e39b3ac"),
  },
  {
    label: "Wraparound Care",
    icon: "🌅",
    query: "wraparound care",
    image: UNSPLASH("photo-1587654780291-39c9404d746b"),
  },
  {
    label: "Multi-Sport",
    icon: "🏅",
    query: "multi-sport",
    image: UNSPLASH("photo-1461896836934-ffe607ba8211"),
  },
  {
    label: "Archery",
    icon: "🏹",
    query: "archery",
    image: UNSPLASH("photo-1545966781-1361f7759d86"),
  },
  {
    label: "Gymnastics",
    icon: "🤸",
    query: "gymnastics",
    image: UNSPLASH("photo-1518611012118-696722aa8901"),
  },
  {
    label: "Tennis",
    icon: "🎾",
    query: "tennis",
    image: UNSPLASH("photo-1622279450506-86d3bb089662"),
  },
  {
    label: "Martial Arts",
    icon: "🥋",
    query: "martial arts",
    image: UNSPLASH("photo-1555597673-b21d5c935865"),
  },
  {
    label: "Coding",
    icon: "💻",
    query: "coding",
    image: UNSPLASH("photo-1517694712202-5ce790470c82"),
  },
  {
    label: "Music",
    icon: "🎵",
    query: "music",
    image: UNSPLASH("photo-1511379938543-a9366a4d04dc"),
  },
];
