import type { Metadata } from "next";
import { AccessibilityPage } from "@/components/transparency/AccessibilityPage";
import { BRAND_NAME } from "@/lib/brand";

export const metadata: Metadata = {
  title: "Accessibility",
  description: `${BRAND_NAME} accessibility commitments and feedback. Keyboard navigation, screen readers, contrast and responsive design.`,
};

export default function AccessibilityRoutePage() {
  return <AccessibilityPage />;
}
