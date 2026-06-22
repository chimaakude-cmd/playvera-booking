import type { Metadata } from "next";
import { KnowledgeBasePage } from "@/components/support/KnowledgeBasePage";
import { BRAND_NAME } from "@/lib/brand";

export const metadata: Metadata = {
  title: "Knowledge base",
  description: `${BRAND_NAME} knowledge base — searchable help articles for providers and parents.`,
};

export default function SupportKnowledgeBasePage() {
  return <KnowledgeBasePage />;
}
