import { redirect } from "next/navigation";

export default function FranchisorLoginRedirect() {
  redirect("/organisation/login");
}
