import { StaffAccessPage } from "@/components/auth/StaffAccessPage";

// TODO: Replace dev test admin login with production auth before launch.
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
