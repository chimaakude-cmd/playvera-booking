import type { Metadata } from "next";
import { ClubLayoutClient } from "@/components/auth/ClubLayoutClient";

export const metadata: Metadata = {
  title: "Club Portal",
};

export default function ClubLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ClubLayoutClient>{children}</ClubLayoutClient>;
}
