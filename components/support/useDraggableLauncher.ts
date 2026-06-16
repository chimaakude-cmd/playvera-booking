"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type PointerEvent,
  type RefObject,
} from "react";
import {
  COMPACT_LAUNCHER_BOTTOM_BOOST,
  DEFAULT_LAUNCHER_OFFSET,
  LAUNCHER_DRAG_THRESHOLD,
  LAUNCHER_EDGE_PADDING,
  LAUNCHER_RESET_EVENT,
  readLauncherPosition,
  saveLauncherPosition,
  type LauncherPosition,
} from "@/lib/support/launcher-position";

type DraggableLauncherOptions = {
  /** Collapse to icon-only and dock higher from the bottom edge. */
  compact?: boolean;
};

type DragState = {
  startX: number;
  startY: number;
  originX: number;
  originY: number;
  moved: boolean;
};

export function useDraggableLauncher(
  ref: RefObject<HTMLButtonElement | null>,
  onActivate?: () => void,
  options: DraggableLauncherOptions = {},
) {
  const { compact = false } = options;
  const [position, setPosition] = useState<LauncherPosition | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragStateRef = useRef<DragState | null>(null);
  const suppressClickRef = useRef(false);

  const getElementSize = useCallback(() => {
    const el = ref.current;
    return {
      width: el?.offsetWidth ?? 200,
      height: el?.offsetHeight ?? 48,
    };
  }, [ref]);

  const getDefaultPosition = useCallback((): LauncherPosition => {
    const { width, height } = getElementSize();
    const bottomOffset =
      DEFAULT_LAUNCHER_OFFSET + (compact ? COMPACT_LAUNCHER_BOTTOM_BOOST : 0);
    return {
      x: window.innerWidth - width - DEFAULT_LAUNCHER_OFFSET,
      y: window.innerHeight - height - bottomOffset,
    };
  }, [compact, getElementSize]);

  const clampPosition = useCallback(
    (x: number, y: number): LauncherPosition => {
      const { width, height } = getElementSize();
      const maxX = window.innerWidth - width - LAUNCHER_EDGE_PADDING;
      const maxY = window.innerHeight - height - LAUNCHER_EDGE_PADDING;
      return {
        x: Math.max(LAUNCHER_EDGE_PADDING, Math.min(x, maxX)),
        y: Math.max(LAUNCHER_EDGE_PADDING, Math.min(y, maxY)),
      };
    },
    [getElementSize],
  );

  const applyInitialPosition = useCallback(() => {
    const saved = readLauncherPosition();
    if (saved) {
      setPosition(clampPosition(saved.x, saved.y));
    } else {
      setPosition(getDefaultPosition());
    }
  }, [clampPosition, getDefaultPosition]);

  useLayoutEffect(() => {
    applyInitialPosition();
  }, [applyInitialPosition]);

  useEffect(() => {
    setPosition((current) => {
      const defaultPos = getDefaultPosition();
      if (!current) {
        return defaultPos;
      }
      if (compact && current.y > defaultPos.y) {
        return clampPosition(current.x, defaultPos.y);
      }
      return clampPosition(current.x, current.y);
    });
  }, [clampPosition, compact, getDefaultPosition]);

  useEffect(() => {
    const onResize = () => {
      setPosition((current) => {
        if (!current) {
          return getDefaultPosition();
        }
        return clampPosition(current.x, current.y);
      });
    };

    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [clampPosition, getDefaultPosition]);

  useEffect(() => {
    const onReset = () => {
      setPosition(getDefaultPosition());
    };

    window.addEventListener(LAUNCHER_RESET_EVENT, onReset);
    return () => window.removeEventListener(LAUNCHER_RESET_EVENT, onReset);
  }, [getDefaultPosition]);

  const handlePointerDown = (event: PointerEvent<HTMLButtonElement>) => {
    if (event.button !== 0) {
      return;
    }

    const current = position ?? getDefaultPosition();
    dragStateRef.current = {
      startX: event.clientX,
      startY: event.clientY,
      originX: current.x,
      originY: current.y,
      moved: false,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: PointerEvent<HTMLButtonElement>) => {
    const drag = dragStateRef.current;
    if (!drag) {
      return;
    }

    const dx = event.clientX - drag.startX;
    const dy = event.clientY - drag.startY;

    if (
      !drag.moved &&
      Math.abs(dx) < LAUNCHER_DRAG_THRESHOLD &&
      Math.abs(dy) < LAUNCHER_DRAG_THRESHOLD
    ) {
      return;
    }

    drag.moved = true;
    setIsDragging(true);
    setPosition(clampPosition(drag.originX + dx, drag.originY + dy));
  };

  const finishPointerInteraction = (
    event: PointerEvent<HTMLButtonElement>,
  ) => {
    const drag = dragStateRef.current;
    if (!drag) {
      return;
    }

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    if (drag.moved) {
      const dx = event.clientX - drag.startX;
      const dy = event.clientY - drag.startY;
      const next = clampPosition(drag.originX + dx, drag.originY + dy);
      setPosition(next);
      saveLauncherPosition(next);
      suppressClickRef.current = true;
    }

    dragStateRef.current = null;
    setIsDragging(false);
  };

  const handlePointerUp = (event: PointerEvent<HTMLButtonElement>) => {
    finishPointerInteraction(event);
  };

  const handlePointerCancel = (event: PointerEvent<HTMLButtonElement>) => {
    finishPointerInteraction(event);
  };

  const handleClick = () => {
    if (suppressClickRef.current) {
      suppressClickRef.current = false;
      return;
    }
    onActivate?.();
  };

  const launcherStyle =
    position === null
      ? { visibility: "hidden" as const }
      : {
          left: position.x,
          top: position.y,
          visibility: "visible" as const,
        };

  return {
    launcherStyle,
    isDragging,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handlePointerCancel,
    handleClick,
  };
}
