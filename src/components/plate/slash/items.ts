import React, { ReactNode } from "react";
import { Editor, Element as SlateElement, Transforms } from "slate";
import {
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Minus,
  Quote,
  Code,
  Text,
} from "lucide-react";

export interface SlashItem {
  key: string;
  label: string;
  description?: string;
  keywords?: string[];
  icon: ReactNode;
  onSelect: (editor: Editor) => void;
}

const toggleBlock = (editor: Editor, type: string) => {
  Transforms.setNodes(
    editor,
    { type } as Partial<SlateElement>,
    {
      match: (node) => SlateElement.isElement(node) && Editor.isBlock(editor, node),
    },
  );
};

const isListActive = (editor: Editor, listType: string) => {
  const [match] = Editor.nodes(editor, {
    match: (node) => SlateElement.isElement(node) && (node as any).type === listType,
  });
  return Boolean(match);
};

const unwrapLists = (editor: Editor) => {
  const listTypes = new Set(["ul", "ol"]);
  Transforms.unwrapNodes(editor, {
    match: (node) => SlateElement.isElement(node) && listTypes.has((node as any).type as string),
    split: true,
  });
};

const toggleList = (editor: Editor, listType: "ul" | "ol") => {
  const isActive = isListActive(editor, listType);
  unwrapLists(editor);
  Transforms.setNodes(editor, {
    type: isActive ? "p" : "li",
  } as Partial<SlateElement>);
  if (!isActive) {
    const list = { type: listType, children: [] as SlateElement[] } as SlateElement;
    Transforms.wrapNodes(editor, list, {
      match: (node) => SlateElement.isElement(node) && (node as any).type === "li",
    });
  }
};

const insertDivider = (editor: Editor) => {
  const divider = { type: "hr", children: [{ text: "" }] } as SlateElement;
  Transforms.insertNodes(editor, divider);
  const paragraph = { type: "p", children: [{ text: "" }] } as SlateElement;
  Transforms.insertNodes(editor, paragraph, { select: true });
};

export const slashItems: SlashItem[] = [
  {
    key: "paragraph",
    label: "Paragraph",
    description: "Plain text",
    keywords: ["text", "body"],
    icon: <Text className="h-4 w-4" />,
    onSelect: (editor) => toggleBlock(editor, "p"),
  },
  {
    key: "heading-1",
    label: "Heading 1",
    description: "Large section heading",
    keywords: ["title", "h1"],
    icon: <Heading1 className="h-4 w-4" />,
    onSelect: (editor) => toggleBlock(editor, "h1"),
  },
  {
    key: "heading-2",
    label: "Heading 2",
    description: "Section heading",
    keywords: ["subtitle", "h2"],
    icon: <Heading2 className="h-4 w-4" />,
    onSelect: (editor) => toggleBlock(editor, "h2"),
  },
  {
    key: "heading-3",
    label: "Heading 3",
    description: "Small heading",
    keywords: ["subheading", "h3"],
    icon: <Heading3 className="h-4 w-4" />,
    onSelect: (editor) => toggleBlock(editor, "h3"),
  },
  {
    key: "blockquote",
    label: "Callout",
    description: "Highlight a key insight",
    keywords: ["quote", "callout"],
    icon: <Quote className="h-4 w-4" />,
    onSelect: (editor) => toggleBlock(editor, "blockquote"),
  },
  {
    key: "code",
    label: "Code block",
    description: "Capture code snippets",
    keywords: ["code", "snippet"],
    icon: <Code className="h-4 w-4" />,
    onSelect: (editor) => toggleBlock(editor, "code_block"),
  },
  {
    key: "bulleted-list",
    label: "Bulleted list",
    description: "Create a bulleted list",
    keywords: ["list", "unordered"],
    icon: <List className="h-4 w-4" />,
    onSelect: (editor) => toggleList(editor, "ul"),
  },
  {
    key: "numbered-list",
    label: "Numbered list",
    description: "Create a numbered list",
    keywords: ["list", "ordered"],
    icon: <ListOrdered className="h-4 w-4" />,
    onSelect: (editor) => toggleList(editor, "ol"),
  },
  {
    key: "divider",
    label: "Divider",
    description: "Visually separate content",
    keywords: ["line", "separator"],
    icon: <Minus className="h-4 w-4" />,
    onSelect: insertDivider,
  },
];
