"use client";

import { BOOKING_FLOW_STEPS } from "@/lib/booking-flow/constants";
import type { BookingFlowStep } from "@/lib/booking-flow/types";

type BookingProgressBarProps = {
  currentStep: BookingFlowStep;
};

export function BookingProgressBar({ currentStep }: BookingProgressBarProps) {
  const active = BOOKING_FLOW_STEPS.find((item) => item.step === currentStep);
  const percent = active?.percent ?? 25;

  return (
    <div className="mb-8">
      <div className="mb-2 flex items-center justify-between text-xs font-semibold text-slate-500">
        <span>{percent}% complete</span>
        <span>
          Step {currentStep} of {BOOKING_FLOW_STEPS.length}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-[#2563EB] transition-all duration-300"
          style={{ width: `${percent}%` }}
        />
      </div>
      <div className="mt-3 grid grid-cols-4 gap-1 text-center text-[11px] font-medium text-slate-500">
        {BOOKING_FLOW_STEPS.map((item) => (
          <span
            key={item.step}
            className={
              item.step === currentStep
                ? "font-semibold text-[#2563EB]"
                : item.step < currentStep
                  ? "text-slate-700"
                  : undefined
            }
          >
            {item.percent}% {item.label}
          </span>
        ))}
      </div>
    </div>
  );
}
