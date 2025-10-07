import { toPlatePlugin, type PlatePlugin } from "platejs/react";
import { BaseParagraphPlugin } from "@platejs/core";
import {
  BaseBlockquotePlugin,
  BaseHeadingPlugin,
  BaseH1Plugin,
  BaseH2Plugin,
  BaseH3Plugin,
  BaseHorizontalRulePlugin,
} from "@platejs/basic-nodes";
import { BaseCodeBlockPlugin } from "@platejs/code-block";
import { BaseListPlugin } from "@platejs/list";
import { BaseSlashPlugin, BaseSlashInputPlugin } from "@platejs/slash-command";
import { SlashInputElement } from "../ui/slash-node";

// Element constants
export const ELEMENT_PARAGRAPH = "p" as const;
export const ELEMENT_BLOCKQUOTE = "blockquote" as const;
export const ELEMENT_CODE_BLOCK = "code_block" as const;
export const ELEMENT_DIVIDER = "hr" as const;
export const ELEMENT_H1 = "h1" as const;
export const ELEMENT_H2 = "h2" as const;
export const ELEMENT_H3 = "h3" as const;
export const ELEMENT_UL = "ul" as const;
export const ELEMENT_OL = "ol" as const;
export const ELEMENT_LI = "li" as const;
export const ELEMENT_TODO_LI = "todo_li" as const;
export const ELEMENT_LINK = "a" as const;
export const ELEMENT_IMAGE = "img" as const;
export const ELEMENT_MEDIA = "media" as const;

// Mark constants
export const MARK_BOLD = "bold" as const;
export const MARK_ITALIC = "italic" as const;
export const MARK_UNDERLINE = "underline" as const;
export const MARK_STRIKETHROUGH = "strikethrough" as const;
export const MARK_CODE = "code" as const;
export const MARK_SUBSCRIPT = "subscript" as const;
export const MARK_SUPERSCRIPT = "superscript" as const;

const clone = <T extends PlatePlugin>(plugin: T): T => plugin.clone() as T;

// Basic Elements
export const createParagraphPlugin = (): PlatePlugin =>
  clone(toPlatePlugin(BaseParagraphPlugin));

export const createHeadingPlugin = (): PlatePlugin => {
  const heading = clone(toPlatePlugin(BaseHeadingPlugin));
  heading.plugins = [
    clone(toPlatePlugin(BaseH1Plugin)),
    clone(toPlatePlugin(BaseH2Plugin)),
    clone(toPlatePlugin(BaseH3Plugin)),
  ];
  return heading;
};

export const createBlockquotePlugin = (): PlatePlugin =>
  clone(toPlatePlugin(BaseBlockquotePlugin));

export const createCodeBlockPlugin = (): PlatePlugin =>
  clone(toPlatePlugin(BaseCodeBlockPlugin));

export const createDividerPlugin = (): PlatePlugin =>
  clone(toPlatePlugin(BaseHorizontalRulePlugin));

// Lists
export const createListPlugin = (): PlatePlugin =>
  clone(toPlatePlugin(BaseListPlugin));

// Slash command
export const createSlashPlugin = (): PlatePlugin => {
  const slash = clone(toPlatePlugin(BaseSlashPlugin));
  const slashInput = clone(toPlatePlugin(BaseSlashInputPlugin));
  
  // Configure the slash input to use our component
  const slashInputWithComponent = slashInput.withComponent(SlashInputElement);
  
  return slash;
};

// Complete plugin configuration
export const plugins: PlatePlugin[] = [
  // Basic elements
  createParagraphPlugin(),
  createHeadingPlugin(),
  createBlockquotePlugin(),
  createCodeBlockPlugin(),
  createDividerPlugin(),
  
  // Lists
  createListPlugin(),
  
  // Slash command (must be last for proper onKeyDown chaining)
  createSlashPlugin(),
];
