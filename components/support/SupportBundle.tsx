"use client";

import { SupportProvider } from "./SupportProvider";
import { SupportLauncher } from "./SupportLauncher";
import { SupportCentre } from "./SupportCentre";

function SupportBundle() {
  return (
    <SupportProvider>
      <SupportLauncher />
      <SupportCentre />
    </SupportProvider>
  );
}

export default SupportBundle;
export { SupportBundle };
