import type { PlateEditor } from 'platejs/react';

export const insertBlock = (editor: PlateEditor, value: string) => {
  if (!editor.selection) {
    editor.tf.insert.block({ type: value });
  } else {
    editor.tf.toggle.block({ type: value });
  }
};
