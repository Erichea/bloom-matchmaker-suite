'use client';

import * as React from 'react';
import type { PlateElementProps } from 'platejs/react';
import { PlateElement } from 'platejs/react';
import { Caption } from './caption';

export function VideoElement(props: PlateElementProps) {
  const { children, element } = props;
  const url = (element as any).url || '';

  return (
    <PlateElement {...props}>
      <figure contentEditable={false} className="group relative">
        <video src={url} controls className="w-full rounded-md" />
        <Caption>{children}</Caption>
      </figure>
    </PlateElement>
  );
}
