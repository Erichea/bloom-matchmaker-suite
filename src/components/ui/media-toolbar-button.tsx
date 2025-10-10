'use client';

import * as React from 'react';
import { ImageIcon } from 'lucide-react';
import { useEditorRef } from 'platejs/react';
import { ToolbarButton } from './toolbar';

export function MediaToolbarButton() {
  const editor = useEditorRef();

  return (
    <ToolbarButton
      tooltip="Insert image"
      onClick={() => {
        const url = prompt('Enter image URL:');
        if (url) {
          editor.tf.insertNodes({
            type: 'img',
            url,
            children: [{ text: '' }],
          });
        }
      }}
    >
      <ImageIcon />
    </ToolbarButton>
  );
}
