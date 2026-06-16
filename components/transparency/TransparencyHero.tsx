import type { ReactNode } from "react";

type TransparencyHeroProps = {
  eyebrow: string;
  title: string;
  subtitle: string;
  children?: ReactNode;
};

export function TransparencyHero({
  eyebrow,
  title,
  subtitle,
  children,
}: TransparencyHeroProps) {
  return (
    <section className="relative border-b border-zinc-100 bg-gradient-to-b from-[#072B44] to-[#0a3d5c] text-white">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <p className="text-sm font-bold uppercase tracking-wider text-teal-300">
          {eyebrow}
        </p>
        <h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">
          {title}
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-teal-50/90">{subtitle}</p>
        {children ? <div className="mt-8">{children}</div> : null}
      </div>
    </section>
  );
}
