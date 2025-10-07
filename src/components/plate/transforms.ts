import { Editor, Element as SlateElement, Transforms } from 'slate';
import { PlateEditor } from 'platejs/react';

const toggleBlock = (editor: any, type: string) => {
  Transforms.setNodes(
    editor,
    { type } as Partial<SlateElement>,
    {
      match: (node) => SlateElement.isElement(node) && Editor.isBlock(editor, node),
    },
  );
};

const isListActive = (editor: any, listType: string) => {
  const [match] = Editor.nodes(editor, {
    match: (node) => SlateElement.isElement(node) && (node as any).type === listType,
  });
  return Boolean(match);
};

const unwrapLists = (editor: any) => {
  const listTypes = new Set(['ul', 'ol']);
  Transforms.unwrapNodes(editor, {
    match: (node) => SlateElement.isElement(node) && listTypes.has((node as any).type as string),
    split: true,
  });
};

const toggleList = (editor: any, listType: 'ul' | 'ol') => {
  const isActive = isListActive(editor, listType);
  unwrapLists(editor);
  Transforms.setNodes(editor, {
    type: isActive ? 'p' : 'li',
  } as Partial<SlateElement>);
  if (!isActive) {
    const list = { type: listType, children: [] as SlateElement[] } as SlateElement;
    Transforms.wrapNodes(editor, list, {
      match: (node) => SlateElement.isElement(node) && (node as any).type === 'li',
    });
  }
};

const insertDivider = (editor: any) => {
  const divider = { type: 'hr', children: [{ text: '' }] } as SlateElement;
  Transforms.insertNodes(editor, divider);
  const paragraph = { type: 'p', children: [{ text: '' }] } as SlateElement;
  Transforms.insertNodes(editor, paragraph, { select: true });
};

export const insertBlock = (editor: any, type: string) => {
  // Remove the slash command text first
  Transforms.removeNodes(editor, {
    match: (node) => (node as any).type === 'slash',
  });

  switch (type) {
    case 'p':
      toggleBlock(editor, 'p');
      break;
    case 'h1':
      toggleBlock(editor, 'h1');
      break;
    case 'h2':
      toggleBlock(editor, 'h2');
      break;
    case 'h3':
      toggleBlock(editor, 'h3');
      break;
    case 'blockquote':
      toggleBlock(editor, 'blockquote');
      break;
    case 'code_block':
      toggleBlock(editor, 'code_block');
      break;
    case 'ul':
      toggleList(editor, 'ul');
      break;
    case 'ol':
      toggleList(editor, 'ol');
      break;
    case 'hr':
      insertDivider(editor);
      break;
    default:
      toggleBlock(editor, 'p');
  }
};
