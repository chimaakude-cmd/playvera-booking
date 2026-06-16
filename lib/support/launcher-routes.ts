export const COMPACT_LAUNCHER_ROUTES = ["/club/growth/website-widget"] as const;

export function isCompactLauncherRoute(pathname: string): boolean {
  return COMPACT_LAUNCHER_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
}
