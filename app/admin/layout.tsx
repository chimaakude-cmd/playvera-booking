import type { Metadata } from "next";
import { AdminLayoutClient } from "@/components/auth/AdminLayoutClient";

/**
 * Activora platform admin area.
 *
 * SECURITY: This route tree is isolated from club (/club) and parent (/parent)
 * portals. Club and parent shells must never link to or embed /admin routes.
 */
export const metadata: Metadata = {
  title: "Platform Admin",
};

export default function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AdminLayoutClient>{children}</AdminLayoutClient>;
}
