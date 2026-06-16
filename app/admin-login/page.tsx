import { StaffAccessPage } from "@/components/auth/StaffAccessPage";

// TODO: Restore full password + 2FA admin login before launch.
export const metadata = {
  title: "Admin Login | Activora",
};

export default function AdminLoginRoute() {
  return (
    <StaffAccessPage
      useServerTestLogin
      backHref="/login"
      backLabel="← Back to login options"
    />
  );
}
