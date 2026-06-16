import type { Metadata } from "next";
import { OrganisationLayoutClient } from "@/components/auth/OrganisationLayoutClient";

export const metadata: Metadata = {
  title: "Organisation Portal",
};

export default function OrganisationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <OrganisationLayoutClient>{children}</OrganisationLayoutClient>;
}
