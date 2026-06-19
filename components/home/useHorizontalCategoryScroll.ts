"use client";

import { useEffect, useRef, type RefObject } from "react";

export function useHorizontalCategoryScroll(
  rowRef: RefObject<HTMLElement | null>,
) {
  const dragRef = useRef({
    active: false,
    startX: 0,
    scrollLeft: 0,
    moved: false,
  });

  useEffect(() => {
    const row = rowRef.current;
    if (!row) {
      return;
    }

    const onWheel = (event: WheelEvent) => {
      if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) {
        return;
      }

      event.preventDefault();
      row.scrollLeft += event.deltaY;
    };

    const onPointerDown = (event: PointerEvent) => {
      if (event.button !== 0) {
        return;
      }

      dragRef.current = {
        active: true,
        startX: event.pageX,
        scrollLeft: row.scrollLeft,
        moved: false,
      };
      row.setPointerCapture(event.pointerId);
    };

    const onPointerMove = (event: PointerEvent) => {
      if (!dragRef.current.active) {
        return;
      }

      const delta = event.pageX - dragRef.current.startX;
      if (Math.abs(delta) > 4) {
        dragRef.current.moved = true;
        row.classList.add("category-row--dragging");
      }

      row.scrollLeft = dragRef.current.scrollLeft - delta;
    };

    const endDrag = (event: PointerEvent) => {
      if (!dragRef.current.active) {
        return;
      }

      dragRef.current.active = false;
      row.classList.remove("category-row--dragging");

      try {
        row.releasePointerCapture(event.pointerId);
      } catch {
        /* pointer may already be released */
      }
    };

    const onClick = (event: MouseEvent) => {
      if (!dragRef.current.moved) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      dragRef.current.moved = false;
    };

    row.addEventListener("wheel", onWheel, { passive: false });
    row.addEventListener("pointerdown", onPointerDown);
    row.addEventListener("pointermove", onPointerMove);
    row.addEventListener("pointerup", endDrag);
    row.addEventListener("pointercancel", endDrag);
    row.addEventListener("click", onClick, true);

    return () => {
      row.removeEventListener("wheel", onWheel);
      row.removeEventListener("pointerdown", onPointerDown);
      row.removeEventListener("pointermove", onPointerMove);
      row.removeEventListener("pointerup", endDrag);
      row.removeEventListener("pointercancel", endDrag);
      row.removeEventListener("click", onClick, true);
    };
  }, [rowRef]);
}
