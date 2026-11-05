// Cek kompilasi produksi UI studio (`npm run build:studio`). Hasil ke .cache/build-studio (tidak dipakai saat jalan).
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'vite';
import react from '@vitejs/plugin-react';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
await build({ root: path.join(root, 'studio'), configFile: false, plugins: [react()], logLevel: 'warn', build: { outDir: path.join(root, '.cache', 'build-studio'), emptyOutDir: true, chunkSizeWarningLimit: 4000 } });
console.log('✓ Studio berhasil di-build');
