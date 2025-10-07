'use client';

import { TrailingBlockPlugin } from 'platejs';

import { BasicBlocksKit } from './plugins/basic-blocks-kit';
import { BasicMarksKit } from './plugins/basic-marks-kit';
import { ListKit } from './plugins/list-kit';
import { CodeBlockKit } from './plugins/code-block-kit';
import { LinkKit } from './plugins/link-kit';
import { SlashKit } from './plugins/slash-kit';

export const SimpleEditorKit = [
  // Elements
  ...BasicBlocksKit,
  ...CodeBlockKit,
  ...ListKit,
  ...LinkKit,

  // Marks
  ...BasicMarksKit,

  // Editing
  ...SlashKit,
  TrailingBlockPlugin,
];
