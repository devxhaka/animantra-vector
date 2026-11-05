import express from 'express';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn, type ChildProcess } from 'node:child_process';
import { DIR, HOST, MODE_PRATINJAU, PORT, ROOT, URL_STUDIO } from './jalur';
import * as S from './store';
import { FORMATS, SUARA } from '../shared/formats';
import type { FormBaru, Gaya, Job } from '../shared/tipe';
import { azureSiap, daftarSuaraAzure, ttsAzure } from './azure';
import { SUARA_EDGE, edgeSiap, ttsEdge } from './edge';
import { daftarSuaraEleven, elevenSiap, faktorKredit, galatIzinSuara, modelEleven, sisaKreditEleven, ttsEleven } from './elevenlabs';

const app = express();
app.use(express.json({ limit: '15mb' }));

// ------------------------------------------------------------------
// Status koneksi Claude
// ------------------------------------------------------------------
let pendengar = 0; // long-poll `studio listen` yang sedang terbuka
let kontakTerakhir = 0; // terakhir CLI menghubungi server
const tunggu: Array<() => void> = []; // resolver long-poll
const prosesRender = new Map<string, ChildProcess>();

const kontak = () => (kontakTerakhir = Date.now());
function statusClaude() {
  const aktif = S.daftarJob().find((j) => j.status === 'dikerjakan' && j.jenis !== 'render-ulang');
  const baruSaja = Date.now() - kontakTerakhir < 45_000;
  const kerja = !!aktif && Date.now() - new Date(aktif.diperbarui).getTime() < 20 * 60_000;
  return { terhubung: pendengar > 0 || baruSaja || kerja, mendengar: pendengar > 0, bekerja: !!aktif };
}
const bangunkan = () => tunggu.splice(0).forEach((f) => f());

app.get('/api/status', (_req, res) => {
  const home = os.homedir();
  res.json({ ...statusClaude(), proyek: ROOT.startsWith(home) ? '~' + ROOT.slice(home.length) : ROOT, platform: process.platform });
});
app.get('/api/opsi', async (_req, res) => {
  const audio = (d: string) => fs.readdirSync(d).filter((f) => /\.(mp3|wav|m4a|ogg|aac)$/i.test(f));
  const [eleven, kredit, azure] = await Promise.all([daftarSuaraEleven(), sisaKreditEleven(), daftarSuaraAzure()]);
  const bisa = eleven.filter((v) => v.bisa);
  const tidak = eleven.filter((v) => !v.bisa);
  const ops = (v: (typeof eleven)[number]) => ({ nilai: `elevenlabs:${v.id}`, nama: (v.indonesia ? '🇮🇩 ' : '') + v.nama, ket: v.ket, bisa: v.bisa });
  const grupSuara = [
    ...(edgeSiap() ? [{ penyedia: 'edge', nama: 'Microsoft Edge · tanpa key', suara: SUARA_EDGE.map((v) => ({ nilai: `edge:${v.id}`, nama: '🇮🇩 ' + v.nama, ket: v.ket, bisa: true })) }] : []),
    ...(azure.length ? [{ penyedia: 'azure', nama: 'Microsoft Azure · penutur Indonesia', suara: azure.map((v) => ({ nilai: `azure:${v.id}`, nama: '🇮🇩 ' + v.nama, ket: v.ket, bisa: true })) }] : []),
    ...(bisa.length ? [{ penyedia: 'elevenlabs', nama: 'ElevenLabs', suara: bisa.map(ops) }] : []),
    ...(process.env.GEMINI_API_KEY ? [{ penyedia: 'gemini', nama: 'Gemini', suara: SUARA.map((v) => ({ nilai: `gemini:${v.nama}`, nama: v.nama, ket: v.ket, bisa: true })) }] : []),
    ...(tidak.length ? [{ penyedia: 'elevenlabs-berbayar', nama: 'ElevenLabs · butuh paket berbayar', suara: tidak.map(ops) }] : []),
  ];
  res.json({
    formats: FORMATS,
    grupSuara,
    kreditEleven: kredit ? { ...kredit, model: modelEleven(), faktor: faktorKredit() } : null,
    musik: audio(DIR.musik),
    sfx: audio(DIR.sfx),
    geminiSiap: !!process.env.GEMINI_API_KEY,
    elevenSiap: elevenSiap(),
    azureSiap: azureSiap(),
    edgeSiap: edgeSiap(),
  });
});

// Coba suara: 1 kalimat pendek, disimpan supaya tiap suara hanya memotong kredit sekali.
const KALIMAT_COBA = 'Halo! Kok pulpen klik bisa gantian? Yuk, kita bongkar bareng.';
const dirCoba = path.join(DIR.data, 'coba-suara');
app.use('/coba-suara', express.static(dirCoba));
app.post('/api/suara/coba', async (req, res) => {
  const nilai = String(req.body?.suara ?? '');
  const [penyedia, ...r] = nilai.split(':');
  const id = r.join(':');
  if (!id) return res.status(400).json({ galat: 'Pilih suara dulu' });
  fs.mkdirSync(dirCoba, { recursive: true });
  const dasar = `${penyedia}-${id.replace(/[^a-zA-Z0-9_-]/g, '')}`;
  const ada = fs.readdirSync(dirCoba).find((f) => f.startsWith(dasar + '.'));
  if (ada) return res.json({ url: `/coba-suara/${ada}` });
  try {
    if (penyedia === 'edge') {
      const { mp3 } = await ttsEdge(KALIMAT_COBA, id);
      fs.writeFileSync(path.join(dirCoba, dasar + '.mp3'), mp3);
      return res.json({ url: `/coba-suara/${dasar}.mp3` });
    }
    if (penyedia === 'azure') {
      const { data } = await ttsAzure(KALIMAT_COBA, id);
      fs.writeFileSync(path.join(dirCoba, dasar + '.wav'), data);
      return res.json({ url: `/coba-suara/${dasar}.wav` });
    }
    if (penyedia === 'elevenlabs') {
      const { mp3 } = await ttsEleven(KALIMAT_COBA, id);
      fs.writeFileSync(path.join(dirCoba, dasar + '.mp3'), mp3);
      return res.json({ url: `/coba-suara/${dasar}.mp3` });
    }
    const { ttsGemini } = await import('../cli/tts');
    const { data } = await ttsGemini(KALIMAT_COBA, id);
    fs.writeFileSync(path.join(dirCoba, dasar + '.wav'), data);
    res.json({ url: `/coba-suara/${dasar}.wav` });
  } catch (e) {
    const m = (e as Error).message;
    res.status(400).json({ galat: galatIzinSuara(m) ? 'Suara ini butuh paket berbayar ElevenLabs' : m });
  }
});

// ------------------------------------------------------------------
// Video
// ------------------------------------------------------------------
app.get('/api/videos', (_req, res) => res.json(S.daftarVideo()));
app.get('/api/videos/:slug', (req, res) => {
  const m = S.metaVideo(req.params.slug);
  if (!m) return res.status(404).json({ galat: 'Video tidak ditemukan' });
  const d = S.dirVideo(m.slug);
  const caption = fs.existsSync(path.join(d, 'caption.txt')) ? fs.readFileSync(path.join(d, 'caption.txt'), 'utf8') : '';
  const cuplikan = fs.existsSync(path.join(d, 'cuplikan')) ? fs.readdirSync(path.join(d, 'cuplikan')).filter((f) => f.endsWith('.jpg')).sort() : [];
  const pesanan = S.metaVideo(m.slug) ? safeJson(path.join(d, 'pesanan.json')) : null;
  res.json({ meta: m, caption, cuplikan, pesanan });
});
const safeJson = (f: string) => {
  try {
    return JSON.parse(fs.readFileSync(f, 'utf8'));
  } catch {
    return null;
  }
};
app.get('/api/videos/:slug/unduh', (req, res) => {
  const m = S.metaVideo(req.params.slug);
  const f = m && path.join(S.dirVideo(m.slug), 'final.mp4');
  if (!f || !fs.existsSync(f)) return res.status(404).send('Belum ada video');
  res.download(f, `${m.slug}.mp4`);
});
app.post('/api/videos/:slug/finder', (req, res) => {
  const m = S.metaVideo(req.params.slug);
  if (!m) return res.status(404).end();
  const d = S.dirVideo(m.slug);
  const f = path.join(d, 'final.mp4');
  const target = fs.existsSync(f) ? f : d;
  if (process.platform === 'darwin') spawn('open', ['-R', target], { detached: true, stdio: 'ignore' }).unref();
  else if (process.platform === 'win32') spawn('explorer.exe', [`/select,${target}`], { detached: true, stdio: 'ignore' }).unref();
  else spawn('xdg-open', [d], { detached: true, stdio: 'ignore' }).unref();
  res.json({ ok: true });
});
app.post('/api/videos/:slug/revisi', (req, res) => {
  const m = S.metaVideo(req.params.slug);
  const teks = String(req.body?.teks ?? '').trim();
  if (!m) return res.status(404).json({ galat: 'Video tidak ditemukan' });
  if (!teks) return res.status(400).json({ galat: 'Tulis dulu revisinya' });
  const p = safeJson(path.join(S.dirVideo(m.slug), 'pesanan.json'));
  const form: FormBaru = {
    format: m.format,
    topik: m.topik,
    durasi: p?.durasiTarget ?? m.durasi,
    suara: p?.suara ?? 'gemini:Kore',
    musik: p?.musik ?? 'otomatis',
    gayaId: p?.gaya?.id ?? S.gayaAktifId(),
    ...(p?.pemeran ? { pemeran: p.pemeran.map((x: { id: string }) => x.id), sudut: p.sudut, nuansa: p.nuansa, lanjutan: p.lanjutan?.slug ?? null } : {}),
  };
  const j = S.buatJob('revisi', form, { slug: m.slug, judul: m.judul, revisi: teks });
  bangunkan();
  res.json(j);
});
app.post('/api/videos/:slug/render-ulang', (req, res) => {
  const m = S.metaVideo(req.params.slug);
  if (!m || !fs.existsSync(path.join(S.dirVideo(m.slug), 'spec.json'))) return res.status(404).json({ galat: 'Spec video tidak ada' });
  const j = S.buatJob('render-ulang', { format: m.format, topik: m.topik, durasi: m.durasi, suara: '', musik: '', gayaId: '' }, { slug: m.slug, judul: m.judul });
  jalankanRenderUlang(j);
  res.json(j);
});

/** Render ulang tidak butuh Claude: server menjalankan CLI render sendiri. */
function jalankanRenderUlang(j: Job) {
  j.status = 'dikerjakan';
  for (const t of ['riset', 'naskah', 'suara', 'model', 'cek', 'audio'] as const) j.tahap[t] = 'lewati';
  S.tambahLog(j, 'Render ulang dari spec terakhir');
  S.simpanJob(j);
  const p = spawn(process.execPath, [path.join(ROOT, 'studio.mjs'), 'render', '--job', j.id], { cwd: ROOT, stdio: 'ignore' });
  prosesRender.set(j.id, p);
  p.on('exit', (code) => {
    prosesRender.delete(j.id);
    const now = S.ambilJob(j.id);
    if (now && now.status === 'dikerjakan' && code !== 0) {
      now.status = 'gagal';
      now.pesanGagal = `Render berhenti (kode ${code}). Lihat log.`;
      S.simpanJob(now);
    }
  });
}

// ------------------------------------------------------------------
// Job
// ------------------------------------------------------------------
app.get('/api/jobs', (req, res) => {
  const semua = S.daftarJob();
  const aktif = semua.filter((j) => j.status === 'antre' || j.status === 'dikerjakan');
  // tampilkan juga yang baru gagal/batal dalam 10 menit terakhir
  // gagal/batal tetap tampil (agar bisa diulang) sampai pengguna menekan Tutup
  const baru = semua.filter((j) => (j.status === 'gagal' || j.status === 'dibatalkan') && !j.ditutup && Date.now() - new Date(j.diperbarui).getTime() < 7 * 86_400_000);
  res.json(req.query.semua ? semua.reverse() : [...aktif, ...baru]);
});
app.get('/api/jobs/:id', (req, res) => {
  const j = S.ambilJob(req.params.id);
  return j ? res.json(j) : res.status(404).json({ galat: 'Job tidak ada' });
});
app.post('/api/jobs', (req, res) => {
  const b = req.body ?? {};
  const form: FormBaru = {
    format: String(b.format || 'kita-bongkar'),
    topik: String(b.topik || '').trim(),
    durasi: Math.max(15, Math.min(180, Number(b.durasi) || 50)),
    suara: String(b.suara || (edgeSiap() ? 'edge:id-ID-GadisNeural' : azureSiap() ? 'azure:id-ID-GadisNeural' : elevenSiap() ? 'elevenlabs:EXAVITQu4vr4xnSDxMaL' : 'gemini:Kore')),
    musik: String(b.musik || 'otomatis'),
    gayaId: String(b.gayaId || S.gayaAktifId()),
    ...(b.format === 'cerita'
      ? {
          pemeran: Array.isArray(b.pemeran) ? b.pemeran.map(String) : [],
          sudut: ['pov', 'dialog', 'narator'].includes(b.sudut) ? b.sudut : 'dialog',
          nuansa: String(b.nuansa ?? ''),
          lanjutan: b.lanjutan ? String(b.lanjutan) : null,
        }
      : {}),
  };
  if (form.format === 'cerita' && !form.pemeran?.length) return res.status(400).json({ galat: 'Pilih minimal satu pemeran' });
  if (!form.topik) return res.status(400).json({ galat: 'Topik belum diisi' });
  const j = S.buatJob('baru', form);
  bangunkan();
  res.json(j);
});
app.post('/api/jobs/:id/batal', (req, res) => {
  const j = S.ambilJob(req.params.id);
  if (!j) return res.status(404).end();
  if (j.status === 'antre' || j.status === 'dikerjakan') {
    j.status = 'dibatalkan';
    S.tambahLog(j, 'Dibatalkan dari studio');
    S.simpanJob(j);
    prosesRender.get(j.id)?.kill();
  }
  res.json(j);
});
app.post('/api/jobs/:id/ulangi', (req, res) => {
  const j = S.ambilJob(req.params.id);
  if (!j) return res.status(404).end();
  if (j.status !== 'gagal' && j.status !== 'dibatalkan') return res.status(400).json({ galat: 'Job ini tidak sedang gagal' });
  if (req.body?.suara) j.form.suara = String(req.body.suara);
  // tahap yang sudah selesai dipertahankan; suara & sesudahnya diulang
  const ulang = ['suara', 'model', 'cek', 'audio', 'render'] as const;
  for (const t of ulang) if (j.tahap[t] !== 'selesai' || t === 'suara' || t === 'render') j.tahap[t] = 'belum';
  j.status = 'antre';
  j.tahapAktif = null;
  j.persen = null;
  j.pesanGagal = undefined;
  j.ditutup = false;
  j.ulangan = (j.ulangan ?? 0) + 1;
  S.tambahLog(j, `Diulang${req.body?.suara ? ' dengan suara baru' : ''}; menunggu Claude`);
  S.simpanJob(j);
  bangunkan();
  res.json(j);
});
app.post('/api/jobs/:id/tutup', (req, res) => {
  const j = S.ambilJob(req.params.id);
  if (j) {
    j.ditutup = true;
    S.simpanJob(j);
  }
  res.json({ ok: true });
});

// ---- dipanggil CLI Claude ----
app.get('/api/claude/dengar', async (req, res) => {
  kontak();
  const ambil = () => S.daftarJob().find((j) => j.status === 'antre' && j.jenis !== 'render-ulang');
  let j = ambil();
  if (!j) {
    pendengar++;
    let selesai = false;
    const tutup = () => {
      if (!selesai) (selesai = true), pendengar--;
    };
    req.on('close', tutup);
    await new Promise<void>((r) => {
      const t = setTimeout(r, Number(req.query.detik ?? 25) * 1000);
      tunggu.push(() => (clearTimeout(t), r()));
    });
    tutup();
    kontak();
    j = ambil();
  }
  if (!j) return res.status(204).end();
  j.status = 'dikerjakan';
  S.tambahLog(j, 'Claude mulai mengerjakan');
  S.simpanJob(j);
  const pesanan = S.siapkanFolder(j);
  res.json({ job: j, pesanan });
});
app.post('/api/claude/progress', (req, res) => {
  kontak();
  const { job, tahap, status, log, persen } = req.body ?? {};
  const j = S.ambilJob(job);
  if (!j) return res.status(404).json({ galat: 'Job tidak ada' });
  if (j.status === 'dibatalkan') return res.status(409).json({ galat: 'DIBATALKAN: pengguna membatalkan job ini di studio. Hentikan pekerjaan.' });
  if (tahap) S.aturTahap(j, tahap, status ?? 'mulai', persen ?? null);
  else if (persen != null) j.persen = persen;
  if (log) S.tambahLog(j, String(log));
  S.simpanJob(j);
  res.json({ ok: true });
});
app.post('/api/claude/selesai', (req, res) => {
  kontak();
  const j = S.ambilJob(req.body?.job);
  if (!j) return res.status(404).end();
  if (j.status === 'dibatalkan') return res.status(409).json({ galat: 'DIBATALKAN' });
  for (const k of Object.keys(j.tahap) as (keyof Job['tahap'])[]) if (j.tahap[k] === 'jalan') j.tahap[k] = 'selesai';
  j.status = 'selesai';
  j.tahapAktif = null;
  j.persen = null;
  S.tambahLog(j, 'Video selesai');
  S.tandaiVideoSelesai(j.slug);
  S.simpanJob(j);
  res.json({ ok: true });
});
app.post('/api/claude/gagal', (req, res) => {
  kontak();
  const j = S.ambilJob(req.body?.job);
  if (!j) return res.status(404).end();
  j.status = 'gagal';
  j.pesanGagal = String(req.body?.pesan ?? 'Gagal');
  S.tambahLog(j, 'Gagal: ' + j.pesanGagal);
  S.simpanJob(j);
  res.json({ ok: true });
});

// ------------------------------------------------------------------
// Karakter
// ------------------------------------------------------------------
app.get('/api/karakter', (_req, res) => res.json(S.daftarKarakter()));
app.post('/api/karakter', (req, res) => {
  const b = req.body ?? {};
  if (!String(b.nama ?? '').trim()) return res.status(400).json({ galat: 'Nama tokoh belum diisi' });
  res.json(S.simpanKarakter(b, req.query.idLama ? String(req.query.idLama) : undefined));
});
app.delete('/api/karakter/:id', (req, res) => {
  S.hapusKarakter(req.params.id);
  res.json({ ok: true });
});

// ------------------------------------------------------------------
// Gaya
// ------------------------------------------------------------------
app.get('/api/gaya', (_req, res) => res.json({ daftar: S.daftarGaya(), aktif: S.gayaAktifId() }));
app.post('/api/gaya', (req, res) => {
  const g = S.simpanGaya(req.body as Gaya);
  if (req.query.pakai) S.setGayaAktif(g.id);
  res.json(g);
});
app.post('/api/gaya/:id/aktif', (req, res) => {
  S.setGayaAktif(req.params.id);
  res.json({ ok: true });
});
app.delete('/api/gaya/:id', (req, res) => {
  try {
    S.hapusGaya(req.params.id);
    res.json({ ok: true });
  } catch (e) {
    res.status(400).json({ galat: (e as Error).message });
  }
});
app.post('/api/gaya-logo', (req, res) => {
  const m = String(req.body?.dataUrl ?? '').match(/^data:image\/(png|jpeg|webp|svg\+xml);base64,(.+)$/);
  if (!m) return res.status(400).json({ galat: 'Logo harus PNG, JPG, WEBP, atau SVG' });
  const ext = m[1] === 'jpeg' ? 'jpg' : m[1] === 'svg+xml' ? 'svg' : m[1];
  const file = `logo-${Date.now().toString(36)}.${ext}`;
  fs.writeFileSync(path.join(DIR.gaya, file), Buffer.from(m[2], 'base64'));
  res.json({ file });
});

// ------------------------------------------------------------------
// Berkas statis + frontend
// ------------------------------------------------------------------
app.use('/media', express.static(DIR.videos, { fallthrough: false }));
app.use('/gaya-media', express.static(DIR.gaya, { fallthrough: false }));
app.use('/musik', express.static(DIR.musik));

export async function mulaiServer(opsi: { buka: boolean }) {
  const { createServer } = await import('vite');
  const react = (await import('@vitejs/plugin-react')).default;
  const vite = await createServer({
    root: DIR.studio,
    configFile: false,
    plugins: [react()],
    appType: 'spa',
    logLevel: 'warn',
    server: { middlewareMode: true, fs: { allow: [ROOT] }, ...(MODE_PRATINJAU ? { allowedHosts: true as const } : {}) },
    optimizeDeps: { include: ['react', 'react-dom', 'remotion', '@remotion/player'] },
  });
  app.use(vite.middlewares);

  // job yang tertinggal "dikerjakan" dari sesi sebelumnya → kembalikan ke antrean
  for (const j of S.daftarJob()) {
    if (j.status === 'dikerjakan' && j.jenis === 'render-ulang') {
      j.status = 'gagal';
      j.pesanGagal = 'Studio ditutup saat render';
      S.simpanJob(j);
    }
  }

  await new Promise<void>((r, gagal) => {
    const srv = app.listen(PORT, HOST, () => r());
    srv.on('error', gagal);
  });
  console.log(`Animantra Studio jalan di ${URL_STUDIO}`);
  if (opsi.buka) (await import('open')).default(URL_STUDIO).catch(() => {});
}
