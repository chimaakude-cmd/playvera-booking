import type { ReactNode } from "react";
import Link from "next/link";
import type { FooterLinkItem } from "@/constants/footer";
import { ACTIVORA_ACCENT } from "@/lib/home/constants";

type FooterNavLinkProps = {
  item: FooterLinkItem;
  className?: string;
};

export function FooterNavLink({ item, className = "" }: FooterNavLinkProps) {
  const isExternal = item.external || item.href.startsWith("http");
  const isMailto = item.href.startsWith("mailto:");
  const linkClassName = `group/link relative inline-flex text-sm text-white/70 transition-all duration-200 hover:text-white hover:-translate-y-px ${className}`;

  const underline = (
    <span
      className="absolute -bottom-0.5 left-0 h-px w-0 transition-all duration-200 group-hover/link:w-full"
      style={{ backgroundColor: ACTIVORA_ACCENT }}
      aria-hidden
    />
  );

  if (isExternal || isMailto) {
    return (
      <a
        href={item.href}
        className={linkClassName}
        {...(isExternal ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      >
        {item.label}
        {underline}
      </a>
    );
  }

  return (
    <Link href={item.href} className={linkClassName}>
      {item.label}
      {underline}
    </Link>
  );
}

export function FooterLinkList({ links }: { links: FooterLinkItem[] }) {
  return (
    <ul className="space-y-2.5">
      {links.map((item) => (
        <li key={`${item.label}-${item.href}`}>
          <FooterNavLink item={item} />
        </li>
      ))}
    </ul>
  );
}

export function FooterColumn({
  title,
  children,
  className = "",
}: {
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-white">
        {title}
      </h3>
      {children}
    </div>
  );
}
