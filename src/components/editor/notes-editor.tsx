'use client';

import * as React from 'react';

import { Plate, usePlateEditor } from 'platejs/react';

import { NotesEditorKit } from '@/components/editor/notes-editor-kit';
import { Editor, EditorContainer } from '@/components/ui/editor';

type NotesEditorProps = {
  value?: any[];
  onChange?: (value: any[]) => void;
  readOnly?: boolean;
  placeholder?: string;
};

export function NotesEditor({
  value,
  onChange,
  readOnly = false,
  placeholder = "Type '/' for commands or start writing...",
}: NotesEditorProps) {
  const editor = usePlateEditor({
    plugins: NotesEditorKit,
    value: value || [{ type: 'p', children: [{ text: '' }] }],
    readOnly,
  });

  const handleChange = React.useCallback(
    (options: { editor: any; value: unknown }) => {
      if (Array.isArray(options.value)) {
        onChange?.(options.value);
      }
    },
    [onChange]
  );

  return (
    <Plate editor={editor} onChange={handleChange}>
      <EditorContainer className="h-full relative">
        <Editor 
          variant="none" 
          placeholder={placeholder} 
          className="h-full px-4 py-4"
        />
      </EditorContainer>
    </Plate>
  );
}
