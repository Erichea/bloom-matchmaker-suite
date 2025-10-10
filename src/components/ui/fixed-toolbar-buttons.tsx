'use client';

import * as React from 'react';

import {
  BoldIcon,
  Code2Icon,
  ItalicIcon,
  ListIcon,
  ListOrderedIcon,
  StrikethroughIcon,
  UnderlineIcon,
} from 'lucide-react';
import { KEYS } from 'platejs';

import { AlignToolbarButton } from './align-toolbar-button';
import { EmojiToolbarButton } from './emoji-toolbar-button';
import { InlineEquationToolbarButton } from './equation-toolbar-button';
import { RedoToolbarButton, UndoToolbarButton } from './history-toolbar-button';
import {
  IndentToolbarButton,
  OutdentToolbarButton,
} from './indent-toolbar-button';
import { InsertToolbarButton } from './insert-toolbar-button';
import { LineHeightToolbarButton } from './line-height-toolbar-button';
import { LinkToolbarButton } from './link-toolbar-button';
import {
  BulletedListToolbarButton,
  NumberedListToolbarButton,
} from './list-toolbar-button';
import { MarkToolbarButton } from './mark-toolbar-button';
import { MediaToolbarButton } from './media-toolbar-button';
import { ModeToolbarButton } from './mode-toolbar-button';
import { MoreToolbarButton } from './more-toolbar-button';
import { TableToolbarButton } from './table-toolbar-button';
import { ToolbarGroup } from './toolbar';
import { TurnIntoToolbarButton } from './turn-into-toolbar-button';

export function FixedToolbarButtons() {
  return (
    <div className="flex w-full">
      <div className="flex flex-1 items-center gap-1 overflow-x-auto">
        <ToolbarGroup>
          <UndoToolbarButton />
          <RedoToolbarButton />
        </ToolbarGroup>

        <ToolbarGroup>
          <InsertToolbarButton />
          <TurnIntoToolbarButton />
        </ToolbarGroup>

        <ToolbarGroup>
          <MarkToolbarButton nodeType={KEYS.bold} tooltip="Bold (⌘+B)">
            <BoldIcon />
          </MarkToolbarButton>

          <MarkToolbarButton nodeType={KEYS.italic} tooltip="Italic (⌘+I)">
            <ItalicIcon />
          </MarkToolbarButton>

          <MarkToolbarButton
            nodeType={KEYS.underline}
            tooltip="Underline (⌘+U)"
          >
            <UnderlineIcon />
          </MarkToolbarButton>

          <MarkToolbarButton
            nodeType={KEYS.strikethrough}
            tooltip="Strikethrough (⌘+⇧+M)"
          >
            <StrikethroughIcon />
          </MarkToolbarButton>

          <MarkToolbarButton nodeType={KEYS.code} tooltip="Code (⌘+E)">
            <Code2Icon />
          </MarkToolbarButton>
        </ToolbarGroup>

        <ToolbarGroup>
          <AlignToolbarButton />

          <NumberedListToolbarButton />
          <BulletedListToolbarButton />
        </ToolbarGroup>

        <ToolbarGroup>
          <LinkToolbarButton />
          <InlineEquationToolbarButton />
          <TableToolbarButton />
          <EmojiToolbarButton />
          <MediaToolbarButton />
        </ToolbarGroup>

        <ToolbarGroup>
          <LineHeightToolbarButton />
          <OutdentToolbarButton />
          <IndentToolbarButton />
        </ToolbarGroup>

        <ToolbarGroup>
          <MoreToolbarButton />
        </ToolbarGroup>
      </div>

      <div className="grow" />

      <ToolbarGroup>
        <ModeToolbarButton />
      </ToolbarGroup>
    </div>
  );
}
