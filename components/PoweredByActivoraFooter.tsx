import Link from "next/link";
import { Logo } from "@/components/branding";

export function PoweredByActivoraFooter() {
  return (
    <footer className="border-t border-zinc-200/70 bg-white">
      <div className="mx-auto max-w-6xl px-6 py-10 text-center">
        <div className="flex justify-center">
          <Logo size="mobile" href="/" />
        </div>
        <p className="mx-auto mt-3 max-w-md text-xs leading-5 text-zinc-500">
          Discover activities, clubs and experiences near you.
        </p>
        <Link
          href="/"
          className="mt-2 inline-block text-xs font-medium text-zinc-400 transition-opacity hover:opacity-80"
        >
          Powered by Activora
        </Link>
      </div>
    </footer>
  );
}
