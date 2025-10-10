import type { PlateEditor } from 'platejs/react';

export const insertBlock = (editor: PlateEditor, value: string) => {
  if (!editor.selection) {
    editor.tf.insertNodes({
      type: value,
      children: [{ text: '' }],
    });
  } else {
    editor.tf.toggleBlock({ type: value });
  }
};
