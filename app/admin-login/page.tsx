import { redirect } from "next/navigation";

export default function LegacyAdminLoginRoute() {
  redirect("/admin/login");
}
