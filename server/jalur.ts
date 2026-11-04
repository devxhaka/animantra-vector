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
/** Berjalan di sesi cloud Claude Code (bukan komputer pengguna)? */
export const DI_CLOUD = !!process.env.CLAUDE_CODE_REMOTE && process.env.CLAUDE_CODE_REMOTE !== 'false';
/**
 * Mode pratinjau: server menerima akses lewat panel pratinjau/proxy. Otomatis aktif di cloud;
 * bisa dipaksa dengan STUDIO_PRATINJAU=1 / dimatikan dengan STUDIO_PRATINJAU=0. Di komputer lokal: mati.
 */
export const MODE_PRATINJAU = process.env.STUDIO_PRATINJAU ? process.env.STUDIO_PRATINJAU === '1' : DI_CLOUD;
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

// Di cloud, Remotion tidak bisa mengunduh Chrome sendiri → pakai Chromium bawaan container bila ada.
if (DI_CLOUD && !process.env.BROWSER_EXECUTABLE) {
  const dasar = '/opt/pw-browsers';
  try {
    const shell = fs.readdirSync(dasar).find((d) => d.startsWith('chromium_headless_shell'));
    const f = shell && path.join(dasar, shell, 'chrome-headless-shell-linux64', 'chrome-headless-shell');
    if (f && fs.existsSync(f)) process.env.BROWSER_EXECUTABLE = f;
  } catch {}
}
