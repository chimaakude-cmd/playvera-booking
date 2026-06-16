"use client";

type FlowProgressBarProps = {
  steps: ReadonlyArray<{ step: number; label: string; percent: number }>;
  currentStep: number;
};

export function FlowProgressBar({ steps, currentStep }: FlowProgressBarProps) {
  const active = steps.find((item) => item.step === currentStep);

  return (
    <div className="mb-8">
      <div className="mb-2 flex items-center justify-between text-xs font-medium text-zinc-500">
        <span>
          Step {currentStep} of {steps.length}
          {active ? ` — ${active.label}` : ""}
        </span>
        <span>{active?.percent ?? 0}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-zinc-100">
        <div
          className="h-full rounded-full bg-zinc-900 transition-all duration-300"
          style={{ width: `${active?.percent ?? 0}%` }}
        />
      </div>
    </div>
  );
}
