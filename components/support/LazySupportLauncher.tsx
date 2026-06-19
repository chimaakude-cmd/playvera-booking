"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ComponentType,
  type PointerEvent,
  type RefObject,
} from "react";
import { usePathname } from "next/navigation";
import { LogoMark } from "@/components/branding";
import { isCompactLauncherRoute } from "@/lib/support/launcher-routes";
import { useDraggableLauncher } from "./useDraggableLauncher";

type LoadState = "idle" | "loading" | "ready" | "error";

type PlaceholderLauncherProps = {
  buttonRef: RefObject<HTMLButtonElement | null>;
  isDragging: boolean;
  compact: boolean;
  launcherStyle: { visibility: "hidden" } | { left: number; top: number; visibility: "visible" };
  onClick: () => void;
  onPointerDown: (event: PointerEvent<HTMLButtonElement>) => void;
  onPointerMove: (event: PointerEvent<HTMLButtonElement>) => void;
  onPointerUp: (event: PointerEvent<HTMLButtonElement>) => void;
  onPointerCancel: (event: PointerEvent<HTMLButtonElement>) => void;
};

function PlaceholderLauncher({
  buttonRef,
  isDragging,
  compact,
  launcherStyle,
  onClick,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onPointerCancel,
}: PlaceholderLauncherProps) {
  return (
    <button
      ref={buttonRef}
      type="button"
      onClick={onClick}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
      aria-label="Open Support Centre. Drag to reposition."
      aria-grabbed={isDragging}
      style={launcherStyle}
      className={`fixed z-40 flex touch-none items-center gap-2 rounded-full border border-zinc-200/90 bg-white text-sm font-semibold text-zinc-900 shadow-lg transition-shadow duration-200 hover:shadow-xl ${
        compact ? "p-2" : "px-4 py-2.5"
      } ${isDragging ? "cursor-grabbing shadow-xl" : "cursor-grab"}`}
    >
      <span className="relative shrink-0">
        <span className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-white ring-2 ring-violet-100">
          <LogoMark size={28} className="h-7 w-7" />
        </span>
        <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-emerald-500" />
      </span>
      {compact ? null : <span className="hidden sm:inline">Need assistance?</span>}
    </button>
  );
}

/**
 * Defers loading the Support Centre bundle until interaction or idle.
 * Uses runtime import() instead of next/dynamic to avoid stale Turbopack chunk refs.
 */
export function LazySupportLauncher() {
  const pathname = usePathname();
  const compact = isCompactLauncherRoute(pathname);
  const [loadState, setLoadState] = useState<LoadState>("idle");
  const [Bundle, setBundle] = useState<ComponentType | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const requestLoad = useCallback(() => {
    setLoadState((current) => (current === "idle" ? "loading" : current));
  }, []);

  const {
    launcherStyle,
    isDragging,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handlePointerCancel,
    handleClick,
  } = useDraggableLauncher(buttonRef, requestLoad, { compact });

  useEffect(() => {
    if (loadState !== "idle") {
      return;
    }

    function handleOpenRequest() {
      setLoadState("loading");
    }

    window.addEventListener("activora:open-support", handleOpenRequest);

    const idle = window.requestIdleCallback?.(() => setLoadState("loading"), {
      timeout: 4000,
    });

    return () => {
      window.removeEventListener("activora:open-support", handleOpenRequest);
      if (idle !== undefined) {
        window.cancelIdleCallback?.(idle);
      }
    };
  }, [loadState]);

  useEffect(() => {
    if (loadState !== "loading") {
      return;
    }

    let cancelled = false;

    import("./SupportBundle")
      .then((mod) => {
        if (cancelled) {
          return;
        }
        setBundle(() => mod.default);
        setLoadState("ready");
      })
      .catch((error: unknown) => {
        if (cancelled) {
          return;
        }
        if (process.env.NODE_ENV === "development") {
          console.warn("[Support] Failed to load support bundle:", error);
        }
        setLoadState("error");
      });

    return () => {
      cancelled = true;
    };
  }, [loadState]);

  if (loadState === "ready" && Bundle) {
    return <Bundle />;
  }

  if (loadState === "error") {
    return null;
  }

  return (
    <PlaceholderLauncher
      buttonRef={buttonRef}
      isDragging={isDragging}
      compact={compact}
      launcherStyle={launcherStyle}
      onClick={handleClick}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
    />
  );
}
