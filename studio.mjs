#!/usr/bin/env node
// Pintu masuk CLI Animantra Studio (Windows & Mac): `node studio.mjs <perintah>`
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Pastikan dependensi terpasang & tidak ketinggalan dari package-lock.json
// (misal setelah `git pull` yang menambah paket baru). Tanpa ini Vite/Remotion
// gagal dengan pesan "Failed to resolve import ...".
const root = path.dirname(fileURLToPath(import.meta.url));
const kunci = path.join(root, 'package-lock.json');
const terpasang = path.join(root, 'node_modules', '.package-lock.json');
const perintah = process.argv[2] ?? '';
if (perintah !== 'bantuan') {
  let alasan = '';
  if (!fs.existsSync(terpasang)) alasan = 'folder node_modules belum ada';
  else if (fs.existsSync(kunci) && fs.statSync(kunci).mtimeMs > fs.statSync(terpasang).mtimeMs + 1000)
    alasan = 'package-lock.json lebih baru dari node_modules (ada paket baru)';
  if (alasan) {
    console.error(`PERLU NPM INSTALL: ${alasan}.\nJalankan dulu:  npm install\nlalu ulangi perintah ini.`);
    process.exit(4);
  }
}

const { register } = await import('tsx/esm/api');
register();
await import('./cli/main.ts');
