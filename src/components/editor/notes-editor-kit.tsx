'use client';

import { TrailingBlockPlugin, ExitBreakPlugin } from 'platejs';

import { BasicBlocksKit } from '@/components/editor/plugins/basic-blocks-kit';
import { BasicMarksKit } from '@/components/editor/plugins/basic-marks-kit';
import { ListKit } from '@/components/editor/plugins/list-kit';
import { SlashKit } from '@/components/editor/plugins/slash-kit';
import { BlockSelectionKit } from '@/components/editor/plugins/block-selection-kit';
import { DndKit } from '@/components/editor/plugins/dnd-kit';
import { CodeBlockKit } from '@/components/editor/plugins/code-block-kit';
import { LinkKit } from '@/components/editor/plugins/link-kit';
import { TableKit } from '@/components/editor/plugins/table-kit';
import { AutoformatKit } from '@/components/editor/plugins/autoformat-kit';
import { EmojiKit } from '@/components/editor/plugins/emoji-kit';
import { MentionKit } from '@/components/editor/plugins/mention-kit';
import { CalloutKit } from '@/components/editor/plugins/callout-kit';
import { ToggleKit } from '@/components/editor/plugins/toggle-kit';
import { DateKit } from '@/components/editor/plugins/date-kit';
import { MathKit } from '@/components/editor/plugins/math-kit';
import { IndentKit } from '@/components/editor/plugins/indent-kit';
import { TocKit } from '@/components/editor/plugins/toc-kit';

export const NotesEditorKit = [
  // Basic elements
  ...BasicBlocksKit,

  // Marks (bold, italic, underline, etc.)
  ...BasicMarksKit,

  // Block styles
  ...ListKit,
  ...CodeBlockKit,

  // Links
  ...LinkKit,

  // Tables
  ...TableKit,

  // Advanced blocks
  ...CalloutKit,
  ...ToggleKit,

  // Formatting
  ...IndentKit,

  // Special features
  ...EmojiKit,
  ...MentionKit,
  ...DateKit,
  ...MathKit,
  ...TocKit,

  // Autoformat (markdown shortcuts)
  ...AutoformatKit,

  // Block selection and drag & drop
  ...BlockSelectionKit,
  ...DndKit,

  // Slash commands
  ...SlashKit,

  // Exit break and trailing block
  ExitBreakPlugin,
  TrailingBlockPlugin,
];
