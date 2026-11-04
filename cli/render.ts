import fs from 'node:fs';
import path from 'node:path';
import { bundle } from '@remotion/bundler';
import { renderMedia, renderStill, selectComposition } from '@remotion/renderer';
import { DIR, ROOT } from '../server/jalur';
import type { Job, Spec } from '../shared/tipe';
import { lapor } from './api';

const opsiBrowser = () => (process.env.BROWSER_EXECUTABLE ? { browserExecutable: process.env.BROWSER_EXECUTABLE } : {});

function bacaSpec(dir: string): Spec {
  const f = path.join(dir, 'spec.json');
  if (!fs.existsSync(f)) throw new Error('spec.json belum ada di ' + dir);
  return JSON.parse(fs.readFileSync(f, 'utf8'));
}

/** Salin musik/ & sfx/ dari folder proyek ke folder video (agar ikut ter-bundle & bisa diputar di studio). */
function siapkanAudio(dir: string, spec: Spec) {
  const pakai = new Set<string>();
  if (spec.musik?.file) pakai.add(spec.musik.file);
  for (const a of spec.adegan) for (const s of a.sfx ?? []) pakai.add(s.file);
  for (const p of pakai) {
    if (!/^(musik|sfx)\//.test(p)) continue;
    const tujuan = path.join(dir, p);
    const asal = path.join(ROOT, p);
    if (!fs.existsSync(tujuan) && fs.existsSync(asal)) {
      fs.mkdirSync(path.dirname(tujuan), { recursive: true });
      fs.copyFileSync(asal, tujuan);
    }
  }
}

async function siapkanBundle(dir: string, onProgress?: (p: number) => void) {
  // Bundle hanya berkas yang dibutuhkan (tanpa final.mp4 / riwayat) lewat folder publik sementara.
  const pub = path.join(ROOT, '.cache', 'publik', path.basename(dir));
  fs.rmSync(pub, { recursive: true, force: true });
  fs.mkdirSync(pub, { recursive: true });
  const lewati = new Set(['riwayat', 'cek', 'cuplikan', 'suara.tmp']);
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.isDirectory() && !lewati.has(e.name)) fs.cpSync(path.join(dir, e.name), path.join(pub, e.name), { recursive: true });
    else if (e.isFile() && /^logo\./.test(e.name)) fs.copyFileSync(path.join(dir, e.name), path.join(pub, e.name));
  }
  return bundle({
    entryPoint: path.join(DIR.remotion, 'index.ts'),
    publicDir: pub,
    onProgress: (p) => onProgress?.(p),
    outDir: path.join(ROOT, '.cache', 'bundle', path.basename(dir)),
  });
}

export async function renderCek(dir: string, detik: number[]) {
  const spec = bacaSpec(dir);
  siapkanAudio(dir, spec);
  const serveUrl = await siapkanBundle(dir);
  const inputProps = { spec, basis: '' };
  const comp = await selectComposition({ serveUrl, id: 'Video', inputProps, ...opsiBrowser() });
  const out = path.join(dir, 'cek');
  fs.mkdirSync(out, { recursive: true });
  const hasil: string[] = [];
  for (const d of detik) {
    const frame = Math.min(comp.durationInFrames - 1, Math.max(0, Math.round(d * spec.fps)));
    const f = path.join(out, `detik-${d.toFixed(1).replace('.', '_')}.png`);
    await renderStill({ composition: comp, serveUrl, inputProps, frame, output: f, scale: 0.5, ...opsiBrowser() });
    hasil.push(f);
  }
  return hasil;
}

export async function renderFinal(job: Job, dir: string) {
  const spec = bacaSpec(dir);
  siapkanAudio(dir, spec);
  let terakhir = -1;
  const persen = async (p: number) => {
    const n = Math.round(p);
    if (n === terakhir) return;
    terakhir = n;
    await lapor(job.id, { persen: n });
  };
  await lapor(job.id, { tahap: 'render', status: 'mulai', persen: 0, log: 'Merender video' });

  const serveUrl = await siapkanBundle(dir, (p) => void persen(p * 0.08));
  const inputProps = { spec, basis: '' };
  const comp = await selectComposition({ serveUrl, id: 'Video', inputProps, ...opsiBrowser() });

  const sementara = path.join(dir, 'final.tmp.mp4');
  let antre = Promise.resolve();
  await renderMedia({
    composition: comp,
    serveUrl,
    inputProps,
    codec: 'h264',
    outputLocation: sementara,
    audioCodec: 'aac',
    onProgress: ({ progress }) => {
      antre = antre.then(() => persen(8 + progress * 84));
    },
    ...opsiBrowser(),
  });
  await antre;
  fs.renameSync(sementara, path.join(dir, 'final.mp4'));

  // cover + cuplikan
  const frameCover = Math.min(comp.durationInFrames - 1, Math.round(spec.fps * 1.4));
  await renderStill({ composition: comp, serveUrl, inputProps, frame: frameCover, output: path.join(dir, 'cover.jpg'), imageFormat: 'jpeg', jpegQuality: 85, scale: 0.5, ...opsiBrowser() });
  const cDir = path.join(dir, 'cuplikan');
  fs.rmSync(cDir, { recursive: true, force: true });
  fs.mkdirSync(cDir, { recursive: true });
  let awal = 0;
  const titik: number[] = [];
  for (const a of spec.adegan) {
    const dur = Math.round(a.durasi * spec.fps);
    titik.push(awal + Math.round(dur * 0.6));
    awal += dur;
  }
  const pilih = titik.length > 8 ? titik.filter((_, i) => i % Math.ceil(titik.length / 8) === 0) : titik;
  for (const [i, f] of pilih.entries()) {
    await renderStill({ composition: comp, serveUrl, inputProps, frame: Math.min(f, comp.durationInFrames - 1), output: path.join(cDir, `${String(i + 1).padStart(2, '0')}.jpg`), imageFormat: 'jpeg', jpegQuality: 75, scale: 0.25, ...opsiBrowser() });
    await persen(92 + ((i + 1) / pilih.length) * 8);
  }
  await lapor(job.id, { tahap: 'render', status: 'selesai', log: `Render selesai (${(comp.durationInFrames / spec.fps).toFixed(0)} dtk)` });
  console.log('✓ ' + path.relative(ROOT, path.join(dir, 'final.mp4')));
}
