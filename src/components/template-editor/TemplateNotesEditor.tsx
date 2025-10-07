'use client';

import * as React from 'react';
import { Plate, usePlateEditor } from 'platejs/react';

import { SimpleEditorKit } from './simple-editor-kit';
import { Editor } from '@/components/ui/editor';

type TemplateNotesEditorProps = {
  value: any[]; // Slate JSON
  onChange: (value: any[], json: string) => void;
  readOnly?: boolean;
  className?: string;
  placeholder?: string;
};

export function TemplateNotesEditor({
  value,
  onChange,
  readOnly = false,
  className,
  placeholder = "Type '/' for commands or start writing..."
}: TemplateNotesEditorProps) {
  const editor = usePlateEditor({
    plugins: SimpleEditorKit,
    value: value || [],
    readOnly,
  });

  const handleChange = React.useCallback((options: { editor: any; value: any[] }) => {
    if (!onChange) return;
    const { value: newValue } = options;
    const json = JSON.stringify(newValue);
    onChange(newValue, json);
  }, [onChange]);

  return (
    <div className={className}>
      <Plate
        editor={editor}
        onChange={handleChange}
      >
        <Editor
          variant="none"
          placeholder={placeholder}
          className="min-h-[200px] px-0 py-0"
        />
      </Plate>
    </div>
  );
}
