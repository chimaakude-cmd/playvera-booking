"use client";

import {
  FOOTER_LINK_COLUMNS,
  FOOTER_NAVY,
} from "@/constants/footer";
import { translateFooterColumnTitle, useTranslation } from "@/lib/i18n";
import {
  FooterAccordionSection,
  FooterBrandColumn,
} from "./FooterBrand";
import { FooterBottomBar } from "./FooterBottomBar";
import { FooterColumn, FooterLinkList } from "./FooterNavLink";

export function Footer() {
  const { t } = useTranslation("footer");

  return (
    <footer
      className="mt-auto text-white"
      style={{ backgroundColor: FOOTER_NAVY }}
      aria-label={t("siteFooter")}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="hidden pb-12 pt-14 lg:grid lg:grid-cols-8 lg:gap-8">
          <FooterBrandColumn />
          {FOOTER_LINK_COLUMNS.map((column) => (
            <FooterColumn
              key={column.id}
              title={translateFooterColumnTitle(column.id, column.title, t)}
            >
              <FooterLinkList links={column.links} />
            </FooterColumn>
          ))}
        </div>

        <div className="hidden pb-10 pt-12 md:block lg:hidden">
          <div className="mb-8">
            <FooterBrandColumn />
          </div>
          <div className="grid grid-cols-3 gap-8">
            {FOOTER_LINK_COLUMNS.map((column) => (
              <FooterColumn
                key={column.id}
                title={translateFooterColumnTitle(column.id, column.title, t)}
              >
                <FooterLinkList links={column.links} />
              </FooterColumn>
            ))}
          </div>
        </div>

        <div className="pb-8 pt-10 md:hidden">
          <div className="border-b border-white/10 pb-6">
            <FooterBrandColumn />
          </div>
          {FOOTER_LINK_COLUMNS.map((column, index) => (
            <FooterAccordionSection
              key={column.id}
              title={translateFooterColumnTitle(column.id, column.title, t)}
              defaultOpen={index === 0}
            >
              <FooterLinkList links={column.links} />
            </FooterAccordionSection>
          ))}
        </div>

        <FooterBottomBar
          legalNavLabel={t("bottom.legalNav")}
          builtInLabel={t("bottom.builtIn")}
        />
      </div>
    </footer>
  );
}

export { Footer as SiteFooter };
