"use client";

import { useEffect, useState } from "react";
import { LogoMark } from "./logo-mark";

type BrandSplashProps = {
  /** Minimum visible duration in ms */
  durationMs?: number;
  className?: string;
};

export function BrandSplash({
  durationMs = 750,
  className = "",
}: BrandSplashProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = window.setTimeout(() => setVisible(false), durationMs);
    return () => window.clearTimeout(timer);
  }, [durationMs]);

  if (!visible) {
    return null;
  }

  return (
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center bg-white ${className}`}
      role="status"
      aria-label="Loading Activora"
    >
      <div className="animate-pulse">
        <LogoMark size={72} priority />
      </div>
    </div>
  );
}

export { Logo } from "./logo";
export { LogoMark } from "./logo-mark";
export { LogoWordmark } from "./logo-wordmark";
