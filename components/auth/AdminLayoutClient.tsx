"use client";

import { AdminPortalGuard } from "@/components/auth/AdminPortalGuard";

export function AdminLayoutClient({ children }: { children: React.ReactNode }) {
  return <AdminPortalGuard>{children}</AdminPortalGuard>;
}
