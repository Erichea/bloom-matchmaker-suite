'use client';

import * as React from 'react';

import { cn } from '@/lib/utils';

// Simple combobox components for slash command
export const InlineCombobox = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    element: any;
    trigger: string;
    items: any[];
    id: string;
    inputClassName?: string;
    children: React.ReactNode;
  }
>(({ className, element, trigger, items, id, inputClassName, children, ...props }, ref) => {
  return (
    <div ref={ref} className={cn('relative', className)} {...props}>
      {children}
    </div>
  );
});

InlineCombobox.displayName = 'InlineCombobox';

export const InlineComboboxContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        'absolute z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md',
        'animate-in fade-in-0 zoom-in-95',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
});

InlineComboboxContent.displayName = 'InlineComboboxContent';

export const InlineComboboxGroup = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => {
  return (
    <div ref={ref} className={cn('py-1', className)} {...props}>
      {children}
    </div>
  );
});

InlineComboboxGroup.displayName = 'InlineComboboxGroup';

export const InlineComboboxGroupLabel = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn('px-2 py-1.5 text-sm font-semibold', className)}
      {...props}
    >
      {children}
    </div>
  );
});

InlineComboboxGroupLabel.displayName = 'InlineComboboxGroupLabel';

export const InlineComboboxItem = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    value: string;
    keywords?: string[];
    label: string;
    description?: string;
  }
>(({ className, children, value, keywords, label, description, ...props }, ref) => {
  return (
    <button
      ref={ref}
      className={cn(
        'relative flex w-full cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none',
        'hover:bg-accent hover:text-accent-foreground',
        'focus:bg-accent focus:text-accent-foreground',
        'data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
        className
      )}
      value={value}
      {...props}
    >
      {children}
    </button>
  );
});

InlineComboboxItem.displayName = 'InlineComboboxItem';

export const InlineComboboxEmpty = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn('py-6 text-center text-sm', className)}
      {...props}
    >
      {children}
    </div>
  );
});

InlineComboboxEmpty.displayName = 'InlineComboboxEmpty';

export const InlineComboboxInput = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, placeholder, ...props }, ref) => {
  return (
    <input
      ref={ref}
      className={cn(
        'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background',
        'file:border-0 file:bg-transparent file:text-sm file:font-medium',
        'placeholder:text-muted-foreground',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        'disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
      placeholder={placeholder}
      {...props}
    />
  );
});

InlineComboboxInput.displayName = 'InlineComboboxInput';
