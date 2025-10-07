'use client';

import { SlashInputPlugin } from '@platejs/slash-command/react';
import { KEYS } from 'platejs';

import { SlashInputElement } from '@/components/ui/slash-node';

export const SlashKit = [
  SlashInputPlugin.withComponent(SlashInputElement),
];
