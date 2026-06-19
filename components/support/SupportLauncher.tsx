"use client";

import { useRef } from "react";
import { usePathname } from "next/navigation";
import { LogoMark } from "@/components/branding";
import { launcherLabel } from "@/lib/support/routing";
import { isCompactLauncherRoute } from "@/lib/support/launcher-routes";
import { useSupport } from "./SupportProvider";
import { useDraggableLauncher } from "./useDraggableLauncher";

export function SupportLauncher() {
  const pathname = usePathname();
  const compact = isCompactLauncherRoute(pathname);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const { open, setOpen, context, supportMode } = useSupport();
  const { status, label } = launcherLabel(context, supportMode);

  const {
    launcherStyle,
    isDragging,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handlePointerCancel,
    handleClick,
  } = useDraggableLauncher(buttonRef, () => setOpen(true), { compact });

  if (open) {
    return null;
  }

  return (
    <button
      ref={buttonRef}
      type="button"
      onClick={handleClick}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
      aria-label="Open Support Centre. Drag to reposition."
      aria-grabbed={isDragging}
      style={launcherStyle}
      className={`group fixed z-40 flex touch-none items-center gap-2.5 rounded-full border border-zinc-200/90 bg-white shadow-lg transition-shadow duration-200 hover:shadow-xl ${
        compact ? "p-2" : "px-3 py-2 sm:px-4 sm:py-2.5"
      } ${isDragging ? "cursor-grabbing shadow-xl" : "cursor-grab"}`}
    >
      <span className="relative shrink-0">
        <span className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-white ring-2 ring-violet-100 sm:h-9 sm:w-9">
          <LogoMark size={28} className="h-7 w-7 sm:h-8 sm:w-8" />
        </span>
        <span
          className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white ${
            status === "online" ? "bg-emerald-500" : "bg-amber-400"
          }`}
          aria-hidden
        />
      </span>
      {compact ? null : (
        <>
          <span className="hidden flex-col items-start sm:flex">
            <span className="text-sm font-semibold text-zinc-900">
              Need assistance?
            </span>
            <span className="text-[11px] font-medium text-violet-600">{label}</span>
          </span>
          <span className="text-sm font-semibold text-zinc-900 sm:hidden">
            Need assistance?
          </span>
        </>
      )}
    </button>
  );
}
