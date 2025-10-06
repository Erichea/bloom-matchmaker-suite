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
import { BaseSlashPlugin } from "@platejs/slash-command";

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

const clone = <T extends PlatePlugin>(plugin: T): T => plugin.clone() as T;

export const createParagraphPlugin = (): PlatePlugin => clone(toPlatePlugin(BaseParagraphPlugin));

export const createHeadingPlugin = (): PlatePlugin => {
  const heading = clone(toPlatePlugin(BaseHeadingPlugin));
  heading.plugins = [clone(toPlatePlugin(BaseH1Plugin)), clone(toPlatePlugin(BaseH2Plugin)), clone(toPlatePlugin(BaseH3Plugin))];
  return heading;
};

export const createBlockquotePlugin = (): PlatePlugin => clone(toPlatePlugin(BaseBlockquotePlugin));

export const createCodeBlockPlugin = (): PlatePlugin => clone(toPlatePlugin(BaseCodeBlockPlugin));

export const createListPlugin = (): PlatePlugin => clone(toPlatePlugin(BaseListPlugin));

export const createDividerPlugin = (): PlatePlugin => clone(toPlatePlugin(BaseHorizontalRulePlugin));

export const createSlashPlugin = (): PlatePlugin => clone(toPlatePlugin(BaseSlashPlugin));
