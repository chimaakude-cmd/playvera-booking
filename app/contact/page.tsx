import type { Metadata } from "next";
import { ContactPage } from "@/components/contact/ContactPage";
import { BRAND_NAME } from "@/lib/brand";

export const metadata: Metadata = {
  title: "Contact",
  description: `Get in touch with ${BRAND_NAME}. Request a callback, book a demo, or open support chat. Our team responds during opening hours.`,
};

type ContactRouteProps = {
  searchParams: Promise<{ tab?: string }>;
};

export default async function ContactRoutePage({
  searchParams,
}: ContactRouteProps) {
  const params = await searchParams;
  return <ContactPage initialTab={params.tab} />;
}
