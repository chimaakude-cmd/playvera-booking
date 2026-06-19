"use client";

import { StaticInfoPageLayout } from "@/components/public/StaticInfoPageLayout";

export function BuiltInUkPage() {
  return (
    <StaticInfoPageLayout
      eyebrow="Company"
      title="Built in the UK"
      subtitle="Activora is built in the UK and we have no plans to move development outside the UK."
    >
      <p>
        We were started by a young team passionate about software development,
        clubs, and making activity bookings easier for families.
      </p>
      <p>
        Activora was created after seeing a clear gap in the market: clubs need
        better tools, more control, clearer information, and a simpler way to
        manage bookings without high costs or unnecessary complexity.
      </p>
      <p>
        Our mission is to make booking software as simple, useful and affordable
        as possible for clubs across the UK.
      </p>
      <p>
        Activora is managed day to day by TeamOneQ, which means updates,
        improvements and support can happen quickly. This helps us keep improving
        the platform based on real feedback from clubs, parents and providers.
      </p>
    </StaticInfoPageLayout>
  );
}
