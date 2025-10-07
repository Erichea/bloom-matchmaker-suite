'use client';

import { TrailingBlockPlugin } from 'platejs';

import { BasicBlocksKit } from '@/components/editor/plugins/basic-blocks-kit';
import { BasicMarksKit } from '@/components/editor/plugins/basic-marks-kit';
import { ListKit } from '@/components/editor/plugins/list-kit';
import { SlashKit } from '@/components/editor/plugins/slash-kit';
import { BlockSelectionKit } from '@/components/editor/plugins/block-selection-kit';
import { DndKit } from '@/components/editor/plugins/dnd-kit';

export const NotesEditorKit = [
  // Basic elements
  ...BasicBlocksKit,

  // Marks
  ...BasicMarksKit,

  // Block styles
  ...ListKit,

  // Block selection and drag & drop
  ...BlockSelectionKit,
  ...DndKit,

  // Slash commands
  ...SlashKit,

  // Ensure trailing block
  TrailingBlockPlugin,
];
