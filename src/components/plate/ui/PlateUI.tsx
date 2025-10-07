import React from "react";
import { PlateLeaf } from "platejs/react";
import { cn } from "@/lib/utils";

// Basic text marks
export const BoldLeaf = (props: any) => (
  <PlateLeaf
    {...props}
    className={cn("font-semibold", props.className)}
  />
);

export const ItalicLeaf = (props: any) => (
  <PlateLeaf
    {...props}
    className={cn("italic", props.className)}
  />
);

export const UnderlineLeaf = (props: any) => (
  <PlateLeaf
    {...props}
    className={cn("underline", props.className)}
  />
);

export const StrikethroughLeaf = (props: any) => (
  <PlateLeaf
    {...props}
    className={cn("line-through", props.className)}
  />
);

export const CodeLeaf = (props: any) => (
  <PlateLeaf
    {...props}
    className={cn(
      "bg-muted px-1 py-0.5 rounded text-sm font-mono",
      props.className
    )}
  />
);

// Basic elements
export const ParagraphElement = (props: any) => (
  <p {...props.attributes} className={cn("my-1", props.className)}>
    {props.children}
  </p>
);

export const HeadingElement = (props: any) => {
  const { level } = props.element;
  const Tag = `h${level}` as keyof JSX.IntrinsicElements;
  
  return (
    <Tag
      {...props.attributes}
      className={cn(
        "font-semibold",
        level === 1 && "text-3xl mt-6 mb-4",
        level === 2 && "text-2xl mt-5 mb-3",
        level === 3 && "text-xl mt-4 mb-2",
        props.className
      )}
    >
      {props.children}
    </Tag>
  );
};

export const BlockquoteElement = (props: any) => (
  <blockquote
    {...props.attributes}
    className={cn(
      "border-l-4 border-muted-foreground pl-4 py-2 my-4 bg-muted/50 italic",
      props.className
    )}
  >
    {props.children}
  </blockquote>
);

export const CodeBlockElement = (props: any) => (
  <pre
    {...props.attributes}
    className={cn(
      "bg-muted p-4 rounded-md overflow-x-auto text-sm font-mono my-4",
      props.className
    )}
  >
    <code>{props.children}</code>
  </pre>
);

export const DividerElement = (props: any) => (
  <div
    {...props.attributes}
    className={cn("my-6", props.className)}
  >
    <hr className="border-t border-border" />
    {props.children}
  </div>
);

export const UlElement = (props: any) => (
  <ul
    {...props.attributes}
    className={cn("list-disc list-inside my-2", props.className)}
  >
    {props.children}
  </ul>
);

export const OlElement = (props: any) => (
  <ol
    {...props.attributes}
    className={cn("list-decimal list-inside my-2", props.className)}
  >
    {props.children}
  </ol>
);

export const LiElement = (props: any) => (
  <li {...props.attributes} className={cn("my-1", props.className)}>
    {props.children}
  </li>
);

// UI components mapping
export const plateUI = {
  // Marks
  [MARK_BOLD]: BoldLeaf,
  [MARK_ITALIC]: ItalicLeaf,
  [MARK_UNDERLINE]: UnderlineLeaf,
  [MARK_STRIKETHROUGH]: StrikethroughLeaf,
  [MARK_CODE]: CodeLeaf,
  
  // Elements
  [ELEMENT_PARAGRAPH]: ParagraphElement,
  [ELEMENT_H1]: (props: any) => <HeadingElement {...props} element={{ ...props.element, level: 1 }} />,
  [ELEMENT_H2]: (props: any) => <HeadingElement {...props} element={{ ...props.element, level: 2 }} />,
  [ELEMENT_H3]: (props: any) => <HeadingElement {...props} element={{ ...props.element, level: 3 }} />,
  [ELEMENT_BLOCKQUOTE]: BlockquoteElement,
  [ELEMENT_CODE_BLOCK]: CodeBlockElement,
  [ELEMENT_DIVIDER]: DividerElement,
  [ELEMENT_UL]: UlElement,
  [ELEMENT_OL]: OlElement,
  [ELEMENT_LI]: LiElement,
};

// Import constants from plugins
import {
  MARK_BOLD,
  MARK_ITALIC,
  MARK_UNDERLINE,
  MARK_STRIKETHROUGH,
  MARK_CODE,
  ELEMENT_PARAGRAPH,
  ELEMENT_H1,
  ELEMENT_H2,
  ELEMENT_H3,
  ELEMENT_BLOCKQUOTE,
  ELEMENT_CODE_BLOCK,
  ELEMENT_DIVIDER,
  ELEMENT_UL,
  ELEMENT_OL,
  ELEMENT_LI,
} from "../config/plugins";

// Import slash element
import { SlashInputElement } from "./slash-node";
