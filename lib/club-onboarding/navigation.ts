import { CLUB_POST_ONBOARDING_DASHBOARD_PATH } from "@/lib/auth/routes";

export { CLUB_POST_ONBOARDING_DASHBOARD_PATH };

/** Full navigation so middleware sees the freshly written role cookie. */
export function navigateToClubDashboardAfterOnboarding(): void {
  window.location.assign(CLUB_POST_ONBOARDING_DASHBOARD_PATH);
}
