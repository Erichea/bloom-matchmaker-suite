'use client';

import * as React from 'react';

import type { PlateEditor, PlateElementProps } from 'platejs/react';

import {
  Heading1Icon,
  Heading2Icon,
  Heading3Icon,
  ListIcon,
  ListOrdered,
  Quote,
  Code2,
  Minus,
  Text,
} from 'lucide-react';
import { type TComboboxInputElement } from 'platejs';
import { PlateElement } from 'platejs/react';

import { insertBlock } from '../transforms';

import {
  InlineCombobox,
  InlineComboboxContent,
  InlineComboboxEmpty,
  InlineComboboxGroup,
  InlineComboboxGroupLabel,
  InlineComboboxInput,
  InlineComboboxItem,
} from './inline-combobox';

type Group = {
  group: string;
  items: {
    icon: React.ReactNode;
    value: string;
    onSelect: (editor: PlateEditor, value: string) => void;
    keywords?: string[];
    label: string;
    description?: string;
  }[];
};

const groups: Group[] = [
  {
    group: 'Basic Blocks',
    items: [
      {
        icon: <Text className="h-4 w-4" />,
        value: 'p',
        label: 'Paragraph',
        description: 'Plain text',
        onSelect: (editor) => insertBlock(editor, 'p'),
      },
      {
        icon: <Heading1Icon className="h-4 w-4" />,
        value: 'h1',
        label: 'Heading 1',
        description: 'Large section heading',
        onSelect: (editor) => insertBlock(editor, 'h1'),
      },
      {
        icon: <Heading2Icon className="h-4 w-4" />,
        value: 'h2',
        label: 'Heading 2',
        description: 'Section heading',
        onSelect: (editor) => insertBlock(editor, 'h2'),
      },
      {
        icon: <Heading3Icon className="h-4 w-4" />,
        value: 'h3',
        label: 'Heading 3',
        description: 'Small heading',
        onSelect: (editor) => insertBlock(editor, 'h3'),
      },
    ],
  },
  {
    group: 'Lists',
    items: [
      {
        icon: <ListIcon className="h-4 w-4" />,
        value: 'ul',
        label: 'Bulleted List',
        description: 'Create a bulleted list',
        onSelect: (editor) => insertBlock(editor, 'ul'),
      },
      {
        icon: <ListOrdered className="h-4 w-4" />,
        value: 'ol',
        label: 'Numbered List',
        description: 'Create a numbered list',
        onSelect: (editor) => insertBlock(editor, 'ol'),
      },
    ],
  },
  {
    group: 'Advanced',
    items: [
      {
        icon: <Quote className="h-4 w-4" />,
        value: 'blockquote',
        label: 'Callout',
        description: 'Highlight a key insight',
        onSelect: (editor) => insertBlock(editor, 'blockquote'),
      },
      {
        icon: <Code2 className="h-4 w-4" />,
        value: 'code_block',
        label: 'Code Block',
        description: 'Capture code snippets',
        onSelect: (editor) => insertBlock(editor, 'code_block'),
      },
      {
        icon: <Minus className="h-4 w-4" />,
        value: 'hr',
        label: 'Divider',
        description: 'Visually separate content',
        onSelect: (editor) => insertBlock(editor, 'hr'),
      },
    ],
  },
];

export function SlashInputElement(props: PlateElementProps) {
  const { children, element } = props;

  const items = React.useMemo(() => {
    return groups.flatMap((group) => group.items);
  }, []);

  return (
    <PlateElement {...props}>
      <InlineCombobox
        element={element}
        trigger="/"
        items={items}
        id="slash"
        inputClassName="slate-combobox-input"
      >
        <InlineComboboxContent>
          {groups.map((group, index) => (
            <InlineComboboxGroup key={group.group}>
              <InlineComboboxGroupLabel>{group.group}</InlineComboboxGroupLabel>
              {group.items.map((item) => (
                <InlineComboboxItem
                  key={item.value}
                  value={item.value}
                  keywords={item.keywords}
                  label={item.label}
                  description={item.description}
                >
                  <div className="flex items-center gap-2">
                    {item.icon}
                    <div>
                      <div className="font-medium">{item.label}</div>
                      {item.description && (
                        <div className="text-sm text-muted-foreground">
                          {item.description}
                        </div>
                      )}
                    </div>
                  </div>
                </InlineComboboxItem>
              ))}
            </InlineComboboxGroup>
          ))}
          <InlineComboboxEmpty>No results found</InlineComboboxEmpty>
        </InlineComboboxContent>
        <InlineComboboxInput placeholder="Type a command or search..." />
      </InlineCombobox>
      {children}
    </PlateElement>
  );
}
