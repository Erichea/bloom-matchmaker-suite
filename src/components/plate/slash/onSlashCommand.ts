import { Editor, Element, Transforms } from "slate";

export const shouldOpenSlash = (editor: Editor): boolean => {
  // Selection must be collapsed and inside an editable block
  const { selection } = editor;
  if (!selection || !Editor.isEditor(editor)) return false;
  
  if (
    !selection.anchor || 
    !selection.focus || 
    selection.anchor.path.toString() !== selection.focus.path.toString() || 
    selection.anchor.offset !== selection.focus.offset
  ) {
    return false;
  }

  // Get text from start of block to cursor
  try {
    const blockEntry = Editor.above(editor, { 
      match: n => Element.isElement(n) && Editor.isBlock(editor, n)
    });
    if (!blockEntry) return false;
    
    const [, path] = blockEntry;
    const startPoint = Editor.start(editor, path);
    const range = { anchor: startPoint, focus: selection.anchor };
    const text = Editor.string(editor, range);

    // Open when text is empty or ends with whitespace, followed by a "/"
    // i.e., typed "/" at block start or after space
    return /(^|\s)\/$/.test(text);
  } catch {
    return false;
  }
};

export const getSlashQuery = (editor: Editor): string => {
  const { selection } = editor;
  if (!selection) return "";

  try {
    const blockEntry = Editor.above(editor, { 
      match: n => Element.isElement(n) && Editor.isBlock(editor, n)
    });
    if (!blockEntry) return "";
    
    const [, path] = blockEntry;
    const startPoint = Editor.start(editor, path);
    const range = { anchor: startPoint, focus: selection.anchor };
    const text = Editor.string(editor, range);

    // Extract the part after the last "/"
    const match = text.match(/\/(.*)$/);
    return match ? match[1] : "";
  } catch {
    return "";
  }
};

export const removeSlashText = (editor: Editor): void => {
  const { selection } = editor;
  if (!selection) return;

  try {
    const blockEntry = Editor.above(editor, { 
      match: n => Element.isElement(n) && Editor.isBlock(editor, n)
    });
    if (!blockEntry) return;
    
    const [, path] = blockEntry;
    const startPoint = Editor.start(editor, path);
    const range = { anchor: startPoint, focus: selection.anchor };
    const text = Editor.string(editor, range);

    // Find the slash and remove it and everything after
    const slashIndex = text.lastIndexOf('/');
    if (slashIndex !== -1) {
      const slashPoint = { 
        path: selection.anchor.path, 
        offset: slashIndex 
      };
      Transforms.delete(editor, {
        at: {
          anchor: slashPoint,
          focus: selection.anchor
        }
      });
    }
  } catch {
    // If anything fails, just don't remove the text
  }
};
