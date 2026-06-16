import { InboxPage } from "@/components/club/inbox/InboxPage";

type PageProps = {
  searchParams: Promise<{ cat?: string; newChat?: string }>;
};

export default async function ClubInboxPage(_props: PageProps) {
  return <InboxPage />;
}
