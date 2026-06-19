"use client";

import { useState } from "react";
import { SiteFooter } from "@/components/SiteFooter";
import type { HomeSearchFilters } from "@/lib/home/search-url";
import { HomeCategoryRow } from "./HomeCategoryRow";
import { HomeHeader } from "./HomeHeader";
import { HomeHeroSearch } from "./HomeHeroSearch";
import { HomePopularClubs } from "./HomePopularClubs";
import { HomeQuickActions } from "./HomeQuickActions";
import { HomeTrustBar } from "./HomeTrustBar";
import { HowActivoraWorks } from "./HowActivoraWorks";
import { LanguageCommunitySection } from "./LanguageCommunitySection";
import { LazySupportLauncher } from "@/components/support/LazySupportLauncher";
import { BookDemoSection } from "./BookDemoSection";
import { HomeFaqSection } from "./HomeFaqSection";
import { LatestUpdatesSection } from "./LatestUpdatesSection";
import { HomeTrustDivider } from "./HomeTrustDivider";
import { WhyProvidersSection } from "./WhyProvidersSection";

const INITIAL_FILTERS: HomeSearchFilters = {
  location: "",
  childAge: "4 - 12 years",
  radius: "10",
  activity: "",
  date: "",
};

export function HomePage() {
  const [filters, setFilters] = useState<HomeSearchFilters>(INITIAL_FILTERS);

  function handleFiltersChange(updates: Partial<HomeSearchFilters>) {
    setFilters((current) => ({ ...current, ...updates }));
  }

  return (
    <div className="flex min-h-full flex-col bg-[#F8FAFC] text-[#0F172A]">
      <HomeHeader />

      <main className="flex-1">
        <HomeHeroSearch filters={filters} onFiltersChange={handleFiltersChange} />
        <HomeCategoryRow filters={filters} />
        <HomeTrustBar />
        <HomePopularClubs radius={filters.radius} />
        <HowActivoraWorks />
        <HomeTrustDivider />
        <WhyProvidersSection />
        <LanguageCommunitySection />
        <BookDemoSection />
        <HomeFaqSection />
        <LatestUpdatesSection />
      </main>

      <SiteFooter />
      <HomeQuickActions />
      <LazySupportLauncher />
    </div>
  );
}
