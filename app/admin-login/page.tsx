import { StaffAccessPage } from "@/components/auth/StaffAccessPage";

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
