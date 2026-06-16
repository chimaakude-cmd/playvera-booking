import type { Metadata } from "next";
import { ParentLayoutClient } from "@/components/auth/ParentLayoutClient";

export const metadata: Metadata = {
  title: "Parent Portal",
};

export default function ParentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ParentLayoutClient>{children}</ParentLayoutClient>;
}
