"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const settingsLinks = [
  { href: "/club/settings", label: "Overview", exact: true },
  { href: "/club/settings/profile", label: "Club profile" },
  { href: "/club/settings/team", label: "Account & team access" },
];

export default function ClubSettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="space-y-6">
      <nav className="flex flex-wrap gap-2 rounded-2xl border border-zinc-200/80 bg-white p-2 shadow-sm">
        {settingsLinks.map((link) => {
          const isActive = link.exact
            ? pathname === link.href
            : pathname === link.href || pathname.startsWith(`${link.href}/`);

          return (
            <Link
              key={link.href}
              href={link.href}
              className={`rounded-xl px-4 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-zinc-900 text-white"
                  : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
              }`}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>
      {children}
    </div>
  );
}
