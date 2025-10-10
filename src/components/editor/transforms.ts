import type { PlateEditor } from 'platejs/react';

export const insertBlock = (editor: PlateEditor, value: string) => {
  editor.tf.toggleBlock({ type: value });
};

export const getBlockType = (element: any) => {
  return element.type || null;
};

export const setBlockType = (editor: PlateEditor, type: string) => {
  editor.tf.toggleBlock({ type });
};

export const insertInlineElement = (editor: PlateEditor, type: string) => {
  editor.tf.insertNodes({
    type,
    children: [{ text: '' }],
  });
};
