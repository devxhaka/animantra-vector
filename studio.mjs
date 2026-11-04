#!/usr/bin/env node
// Pintu masuk CLI Animantra Studio (Windows & Mac): `node studio.mjs <perintah>`
import { register } from 'tsx/esm/api';
register();
await import('./cli/main.ts');
