import type { ReactNode } from "react";

type PrivacySectionProps = {
  id: string;
  title: string;
  children: ReactNode;
  className?: string;
};

export function PrivacySection({
  id,
  title,
  children,
  className = "",
}: PrivacySectionProps) {
  return (
    <section
      id={id}
      aria-labelledby={`${id}-heading`}
      className={`scroll-mt-28 border-b border-zinc-200/80 py-10 last:border-b-0 print:break-inside-avoid dark:border-zinc-700/80 ${className}`}
    >
      <h2
        id={`${id}-heading`}
        className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-2xl"
      >
        {title}
      </h2>
      <div className="mt-4 space-y-4 text-sm leading-relaxed text-zinc-600 dark:text-zinc-300 sm:text-[15px]">
        {children}
      </div>
    </section>
  );
}
