import * as React from "react";
import { Button, type ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const PremiumButton = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, children, variant, ...props }, ref) => {
    return (
      <Button
        ref={ref}
        variant={variant ?? "default"}
        className={cn(
          "rounded-full px-6 py-2 text-sm font-medium tracking-wide",
          "bg-[hsl(var(--brand-primary))] text-[hsl(var(--brand-primary-foreground))]",
          "hover:bg-[hsl(var(--brand-primary))]/90 transition-all duration-200",
          "shadow-[0_12px_30px_-12px_rgba(190,76,139,0.55)] hover:shadow-[0_16px_40px_-12px_rgba(190,76,139,0.6)]",
          "focus-visible:ring-2 focus-visible:ring-[hsl(var(--brand-primary))]/60 focus-visible:ring-offset-2",
          className,
        )}
        {...props}
      >
        {children}
      </Button>
    );
  },
);

PremiumButton.displayName = "PremiumButton";
