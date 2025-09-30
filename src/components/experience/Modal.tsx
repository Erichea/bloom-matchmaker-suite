import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  type DialogProps,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import * as React from "react";

interface ModalProps extends DialogProps {
  trigger?: React.ReactNode;
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

export function Modal({ trigger, title, description, children, className, ...props }: ModalProps) {
  return (
    <Dialog {...props}>
      {trigger ? <DialogTrigger asChild>{trigger}</DialogTrigger> : null}
      <DialogContent className={cn("rounded-3xl border-none bg-[hsl(var(--surface))] p-8 shadow-2xl", className)}>
        {(title || description) && (
          <DialogHeader className="space-y-2">
            {title ? (
              <DialogTitle className="text-xl font-semibold tracking-tight text-[hsl(var(--brand-secondary))]">
                {title}
              </DialogTitle>
            ) : null}
            {description ? (
              <DialogDescription className="text-sm text-muted-foreground">
                {description}
              </DialogDescription>
            ) : null}
          </DialogHeader>
        )}
        {children}
      </DialogContent>
    </Dialog>
  );
}
