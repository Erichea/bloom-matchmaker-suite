'use client';

import * as React from 'react';
import type { PlateElementProps } from 'platejs/react';
import { PlateElement } from 'platejs/react';

export function PlaceholderElement(props: PlateElementProps) {
  return (
    <PlateElement {...props}>
      <div contentEditable={false} className="h-24 w-full bg-muted/30 rounded-md border-2 border-dashed flex items-center justify-center">
        <p className="text-sm text-muted-foreground">Media Placeholder</p>
      </div>
      {props.children}
    </PlateElement>
  );
}
