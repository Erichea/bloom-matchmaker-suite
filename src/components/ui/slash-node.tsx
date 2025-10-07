'use client';

import * as React from 'react';

import type { PlateEditor, PlateElementProps } from 'platejs/react';

import {
  ChevronRightIcon,
  Code2,
  Heading1Icon,
  Heading2Icon,
  Heading3Icon,
  ListIcon,
  ListOrdered,
  PilcrowIcon,
  Quote,
} from 'lucide-react';
import { type TComboboxInputElement, KEYS } from 'platejs';
import { PlateElement } from 'platejs/react';

import {
  insertBlock,
} from '@/components/editor/transforms';

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
    className?: string;
    focusEditor?: boolean;
    keywords?: string[];
    label?: string;
  }[];
};

const groups: Group[] = [
  {
    group: 'Basic blocks',
    items: [
      {
        icon: <PilcrowIcon />,
        keywords: ['paragraph'],
        label: 'Text',
        value: KEYS.p,
      },
      {
        icon: <Heading1Icon />,
        keywords: ['title', 'h1'],
        label: 'Heading 1',
        value: KEYS.h1,
      },
      {
        icon: <Heading2Icon />,
        keywords: ['subtitle', 'h2'],
        label: 'Heading 2',
        value: KEYS.h2,
      },
      {
        icon: <Heading3Icon />,
        keywords: ['subtitle', 'h3'],
        label: 'Heading 3',
        value: KEYS.h3,
      },
      {
        icon: <ListIcon />,
        keywords: ['unordered', 'ul', '-'],
        label: 'Bulleted list',
        value: KEYS.ul,
      },
      {
        icon: <ListOrdered />,
        keywords: ['ordered', 'ol', '1'],
        label: 'Numbered list',
        value: KEYS.ol,
      },
      {
        icon: <Code2 />,
        keywords: ['```'],
        label: 'Code Block',
        value: KEYS.codeBlock,
      },
      {
        icon: <Quote />,
        keywords: ['citation', 'blockquote', 'quote', '>'],
        label: 'Blockquote',
        value: KEYS.blockquote,
      },
    ].map((item) => ({
      ...item,
      onSelect: (editor, value) => {
        insertBlock(editor, value);
      },
    })),
  },
];

export function SlashInputElement(
  props: PlateElementProps<TComboboxInputElement>
) {
  const { editor, element } = props;

  return (
    <PlateElement {...props} as="span">
      <InlineCombobox element={element} trigger="/">
        <InlineComboboxInput />

        <InlineComboboxContent>
          <InlineComboboxEmpty>No results</InlineComboboxEmpty>

          {groups.map(({ group, items }) => (
            <InlineComboboxGroup key={group}>
              <InlineComboboxGroupLabel>{group}</InlineComboboxGroupLabel>

              {items.map(
                ({ icon, keywords, label, value, onSelect }) => (
                  <InlineComboboxItem
                    key={value}
                    value={value}
                    onClick={() => onSelect(editor, value)}
                    label={label}
                    keywords={keywords}
                  >
                    <div className="mr-2 text-muted-foreground">{icon}</div>
                    <div className="flex flex-col">
                      <span>{label ?? value}</span>
                    </div>
                    <ChevronRightIcon className="ml-auto h-4 w-4 text-muted-foreground" />
                  </InlineComboboxItem>
                )
              )}
            </InlineComboboxGroup>
          ))}
        </InlineComboboxContent>
      </InlineCombobox>

      {props.children}
    </PlateElement>
  );
}
