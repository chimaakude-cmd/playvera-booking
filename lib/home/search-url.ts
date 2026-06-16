export type HomeSearchFilters = {
  location: string;
  childAge: string;
  radius: string;
  activity: string;
  date: string;
};

export function buildSessionsUrl(
  filters: HomeSearchFilters,
  activityOverride?: string,
): string {
  const params = new URLSearchParams();

  if (filters.location.trim()) {
    params.set("location", filters.location.trim());
  }

  if (filters.childAge.trim()) {
    params.set("childAge", filters.childAge.trim());
  }

  if (filters.radius) {
    params.set("radius", filters.radius);
  }

  if (filters.date.trim()) {
    params.set("date", filters.date.trim());
  }

  const activity = activityOverride ?? filters.activity.trim();
  if (activity) {
    params.set("activity", activity);
  }

  const query = params.toString();
  return query ? `/sessions?${query}` : "/sessions";
}
