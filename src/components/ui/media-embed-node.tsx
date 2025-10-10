'use client';

import * as React from 'react';
import type { PlateElementProps } from 'platejs/react';
import { PlateElement } from 'platejs/react';

export function MediaEmbedElement(props: PlateElementProps) {
  const { children, element } = props;
  const url = (element as any).url || '';

  return (
    <PlateElement {...props}>
      <div contentEditable={false} className="relative">
        <div className="aspect-video w-full bg-muted rounded-md flex items-center justify-center">
          <p className="text-sm text-muted-foreground">Media Embed: {url}</p>
        </div>
      </div>
      {children}
    </PlateElement>
  );
}
