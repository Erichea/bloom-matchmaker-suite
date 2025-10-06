import * as React from "react";
import { Button, type ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const PremiumButton = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, children, variant, ...props }, ref) => {
    return (
      <Button
        ref={ref}
        variant={variant ?? "premium"}
        className={cn(
          "rounded-2xl px-8 py-3 text-sm font-medium tracking-wide",
          "bg-accent text-accent-foreground",
          "hover:shadow-lg hover:scale-[1.02] transition-all duration-300",
          "shadow-md active:scale-[0.98]",
          "focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:ring-offset-2",
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
