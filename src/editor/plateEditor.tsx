import React, { useMemo, type ReactNode } from 'react';
import {
  createPlateEditor,
  Plate,
  PlateProvider,
  PlateContent,
} from '@platejs/react';
import {
  createParagraphPlugin,
  ELEMENT_PARAGRAPH,
} from '@platejs/paragraph';
import {
  createHeadingPlugin,
  ELEMENT_H1,
  ELEMENT_H2,
  ELEMENT_H3,
} from '@platejs/heading';
import {
  createBlockquotePlugin,
  ELEMENT_BLOCKQUOTE,
} from '@platejs/blockquote';
import {
  createCodeBlockPlugin,
  ELEMENT_CODE_BLOCK,
} from '@platejs/code-block';
import { createListPlugin, ELEMENT_UL, ELEMENT_OL, ELEMENT_LI } from '@platejs/list';
import {
  createDividerPlugin,
  ELEMENT_DIVIDER,
} from '@platejs/divider';
import { createSlashPlugin, SlashCommandItem } from '@platejs/slash-command';
import { slashCommands } from '@/slash/commands';
import { Editor, Element as SlateElement } from 'slate';

type CustomElement = SlateElement & { type?: string };

type RenderElementProps = {
  element: CustomElement;
  attributes: Record<string, unknown>;
  children: ReactNode;
};

const renderElement = ({ element, attributes, children }: RenderElementProps) => {
  switch (element.type) {
    case ELEMENT_H1:
      return (
        <h1 {...attributes} className="text-2xl font-semibold tracking-tight">
          {children}
        </h1>
      );
    case ELEMENT_H2:
      return (
        <h2 {...attributes} className="text-xl font-semibold">
          {children}
        </h2>
      );
    case ELEMENT_H3:
      return (
        <h3 {...attributes} className="text-lg font-semibold">
          {children}
        </h3>
      );
    case ELEMENT_BLOCKQUOTE:
      return (
        <blockquote
          {...attributes}
          className="border-l-4 border-muted pl-4 italic text-muted-foreground"
        >
          {children}
        </blockquote>
      );
    case ELEMENT_CODE_BLOCK:
      return (
        <pre {...attributes} className="rounded-md bg-muted p-3 text-sm font-mono">
          <code>{children}</code>
        </pre>
      );
    case ELEMENT_DIVIDER:
      return (
        <div {...attributes} contentEditable={false} className="my-6">
          <hr className="border-border" />
          {children}
        </div>
      );
    case ELEMENT_UL:
      return (
        <ul {...attributes} className="list-disc pl-6">
          {children}
        </ul>
      );
    case ELEMENT_OL:
      return (
        <ol {...attributes} className="list-decimal pl-6">
          {children}
        </ol>
      );
    case ELEMENT_LI:
      return (
        <li {...attributes} className="leading-7">
          {children}
        </li>
      );
    default:
      return (
        <p {...attributes} className="leading-7">
          {children}
        </p>
      );
  }
};

export const NotionLikeEditor = ({
  initialValue,
  onChange,
  placeholder = 'Type / for commands or start writing...',
}) => {
  const platePlugins = useMemo(() => {
    const slashItems: SlashCommandItem[] = slashCommands.map((cmd) => ({
      key: cmd.id,
      text: cmd.label,
      description: cmd.description,
      icon: cmd.icon,
      onSelected: (editor: Editor) => cmd.action(editor),
    }));

    return [
      createParagraphPlugin(),
      createHeadingPlugin(),
      createBlockquotePlugin(),
      createCodeBlockPlugin(),
      createListPlugin(),
      createDividerPlugin(),
      createSlashPlugin({
        options: {
          items: slashItems,
          trigger: '/',
        },
      }),
    ];
  }, []);

  const editor = useMemo(
    () => createPlateEditor({ plugins: platePlugins }),
    [platePlugins]
  );

  const handleOnChange = (value) => {
    if (onChange) {
      const json = JSON.stringify(value);
      onChange(value, json, editor);
    }
  };

  return (
    <PlateProvider editor={editor}>
      <Plate initialValue={initialValue} onChange={handleOnChange}>
        <PlateContent
          placeholder={placeholder}
          renderElement={renderElement}
        />
      </Plate>
    </PlateProvider>
  );
};