"use client";

import { useModalDismiss } from "@/lib/hooks/use-modal-dismiss";
import { useSupport } from "./SupportProvider";
import { SupportDrawer } from "./SupportDrawer";

export function SupportCentre() {
  const { open, setOpen } = useSupport();

  useModalDismiss(open, () => setOpen(false));

  if (!open) {
    return null;
  }

  return (
    <>
      <div
        className="fixed inset-0 z-[60] bg-zinc-900/30 backdrop-blur-[2px] transition-opacity duration-200"
        onClick={() => setOpen(false)}
        aria-hidden
      />
      <SupportDrawer />
    </>
  );
}
