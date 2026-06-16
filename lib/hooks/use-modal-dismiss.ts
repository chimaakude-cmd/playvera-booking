import { useEffect } from "react";

/** Close a modal or drawer when the user presses Escape. */
export function useModalDismiss(open: boolean, onDismiss: () => void): void {
  useEffect(() => {
    if (!open) {
      return;
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onDismiss();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onDismiss]);
}
