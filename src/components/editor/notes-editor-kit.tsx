'use client';

import { TrailingBlockPlugin } from 'platejs';

import { BasicBlocksKit } from '@/components/editor/plugins/basic-blocks-kit';
import { BasicMarksKit } from '@/components/editor/plugins/basic-marks-kit';
import { CodeBlockKit } from '@/components/editor/plugins/code-block-kit';
import { LinkKit } from '@/components/editor/plugins/link-kit';
import { ListKit } from '@/components/editor/plugins/list-kit';
import { SlashKit } from '@/components/editor/plugins/slash-kit';

export const NotesEditorKit = [
  // Elements
  ...BasicBlocksKit,
  ...CodeBlockKit,
  ...LinkKit,

  // Marks
  ...BasicMarksKit,

  // Block Style
  ...ListKit,

  // Editing
  ...SlashKit,
  TrailingBlockPlugin,
];
