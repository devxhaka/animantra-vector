import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const DIR = {
  data: path.join(ROOT, 'data'),
  jobs: path.join(ROOT, 'data', 'jobs'),
  gaya: path.join(ROOT, 'data', 'gaya'),
  karakter: path.join(ROOT, 'data', 'karakter'),
  perpustakaan: path.join(ROOT, 'perpustakaan'),
  videos: path.join(ROOT, 'videos'),
  musik: path.join(ROOT, 'musik'),
  sfx: path.join(ROOT, 'sfx'),
  studio: path.join(ROOT, 'studio'),
  remotion: path.join(ROOT, 'remotion'),
};
for (const d of [DIR.data, DIR.jobs, DIR.gaya, DIR.karakter, DIR.videos, DIR.musik, DIR.sfx]) fs.mkdirSync(d, { recursive: true });

export const PORT = Number(process.env.STUDIO_PORT || 4321);
/** STUDIO_PRATINJAU=1 → izinkan akses lewat panel pratinjau/proxy (dipakai di sesi cloud). Lokal: biarkan kosong. */
export const MODE_PRATINJAU = process.env.STUDIO_PRATINJAU === '1';
export const HOST = MODE_PRATINJAU ? '0.0.0.0' : '127.0.0.1';
export const URL_STUDIO = `http://127.0.0.1:${PORT}`;

export function bacaJson<T>(file: string, cadangan: T): T {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8')) as T;
  } catch {
    return cadangan;
  }
}
export function tulisJson(file: string, data: unknown) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const tmp = file + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2));
  fs.renameSync(tmp, file);
}

/** Muat .env sederhana (tanpa dependensi). */
export function muatEnv() {
  const f = path.join(ROOT, '.env');
  if (!fs.existsSync(f)) return;
  for (const baris of fs.readFileSync(f, 'utf8').split(/\r?\n/)) {
    const m = baris.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
}
muatEnv();
