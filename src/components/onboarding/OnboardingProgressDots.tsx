import React from "react";

interface OnboardingProgressDotsProps {
  total: number;
  current: number;
}

export const OnboardingProgressDots: React.FC<OnboardingProgressDotsProps> = ({
  total,
  current,
}) => {
  return (
    <div className="flex items-center justify-center gap-2 py-6">
      {Array.from({ length: Math.min(total, 15) }).map((_, index) => (
        <div
          key={index}
          className={`h-2 w-2 rounded-full transition-all ${
            index === current
              ? "w-8 bg-primary"
              : index < current
              ? "bg-primary/60"
              : "bg-muted"
          }`}
        />
      ))}
      {total > 15 && (
        <span className="ml-2 text-sm text-muted-foreground">
          {current + 1} of {total}
        </span>
      )}
    </div>
  );
};
