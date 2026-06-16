import { redirect } from "next/navigation";

export default function ClubNotificationsPage() {
  redirect("/club/inbox?cat=notifications");
}
