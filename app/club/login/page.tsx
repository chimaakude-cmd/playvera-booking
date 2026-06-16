import { LoginPage } from "@/components/auth/LoginPage";
import { TEST_ACCOUNTS } from "@/lib/auth/accounts";

export default function ClubLoginRoute() {
  return (
    <LoginPage
      role="club"
      title="Club sign in"
      subtitle="Manage your sessions, bookings, and club profile"
      defaultEmail={TEST_ACCOUNTS.club.email}
    />
  );
}
