import { HomeHeader } from "@/components/home/HomeHeader";
import { LoginChoice } from "@/components/home/LoginChoice";
import { SiteFooter } from "@/components/SiteFooter";
import { HOME_SECTION } from "@/components/home/shared";

export default function LoginChoicePage() {
  return (
    <div className="flex min-h-screen flex-col bg-[#F8FAFC] text-[#0F172A]">
      <HomeHeader />

      <main className={`flex-1 ${HOME_SECTION}`}>
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <LoginChoice />
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
