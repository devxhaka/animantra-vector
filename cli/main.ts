import fs from 'node:fs';
import path from 'node:path';
import { parseArgs } from 'node:util';
import { DI_CLOUD, DIR, PORT, ROOT, URL_STUDIO } from '../server/jalur';
import { api, lapor, studioJalan } from './api';
import { TAHAP, type Job } from '../shared/tipe';

const [perintah = 'bantuan', ...sisa] = process.argv.slice(2);
const { values: o } = parseArgs({
  args: sisa,
  allowPositionals: true,
  options: {
    job: { type: 'string' },
    tahap: { type: 'string' },
    status: { type: 'string' },
    log: { type: 'string' },
    teks: { type: 'string' },
    persen: { type: 'string' },
    pesan: { type: 'string' },
    detik: { type: 'string' },
    menit: { type: 'string' },
    agen: { type: 'string' },
    'tanpa-buka': { type: 'boolean' },
    'tanpa-selesai': { type: 'boolean' },
  },
});

const perlu = (k: keyof typeof o) => {
  const v = o[k];
  if (v === undefined || v === '') {
    console.error(`Butuh --${k}`);
    process.exit(2);
  }
  return String(v);
};

async function folderJob(id: string) {
  const r = await api<Job>(`/api/jobs/${id}`);
  if (r.status !== 200) throw new Error(`Job ${id} tidak ditemukan (studio jalan?)`);
  return { job: r.data, dir: path.join(DIR.videos, r.data.slug) };
}

const PERINTAH: Record<string, () => Promise<void>> = {
  async server() {
    const buka = !o['tanpa-buka'] && !DI_CLOUD; // di cloud tidak ada browser untuk dibuka
    const petunjukCloud = () =>
      DI_CLOUD && console.log(`SESI CLOUD: studio dibuka lewat panel pratinjau app Claude. Laporkan port ${PORT} ke app (report_preview_port).`);
    if (await studioJalan()) {
      console.log(`Studio sudah jalan di ${URL_STUDIO}`);
      petunjukCloud();
      if (buka) (await import('open')).default(URL_STUDIO).catch(() => {});
      return;
    }
    const { mulaiServer } = await import('../server/server');
    await mulaiServer({ buka });
    petunjukCloud();
  },

  /** Tunggu pesanan dari studio. Jalankan di background; selesai saat ada job. */
  async listen() {
    if (!(await studioJalan())) {
      console.error('Studio belum jalan. Jalankan dulu: node studio.mjs server');
      process.exit(1);
    }
    // --agen gemini → badge studio menampilkan "Gemini terhubung".
    const agen = o.agen === 'gemini' ? 'gemini' : 'claude';
    const panduan = agen === 'gemini' ? 'GEMINI.md' : 'CLAUDE.md';
    const batas = Date.now() + Number(o.menit ?? 25) * 60_000;
    console.log(`Mendengarkan pesanan dari studio… (agen: ${agen})`);
    while (Date.now() < batas) {
      let r;
      try {
        r = await api(`/api/claude/dengar?detik=25&agen=${agen}`);
      } catch {
        await new Promise((s) => setTimeout(s, 3000));
        continue;
      }
      if (r.status === 200) {
        const { job, pesanan } = r.data;
        console.log('\n=== PESANAN BARU ===');
        console.log(JSON.stringify(pesanan, null, 2));
        console.log(
          `\nKerjakan sesuai ${panduan} (bagian "${job.jenis === 'revisi' ? 'Mengerjakan revisi' : 'Membuat video baru'}").` +
            `\nJob: ${job.id}  ·  Folder: videos/${job.slug}` +
            `\nSetelah selesai, jalankan lagi: node studio.mjs listen --agen ${agen} (di background).`,
        );
        return;
      }
    }
    console.log(`TIDAK ADA PESANAN dalam 25 menit. Jalankan lagi \`node studio.mjs listen --agen ${agen}\` di background untuk tetap terhubung.`);
  },

  async progress() {
    const job = perlu('job');
    const tahap = o.tahap;
    if (tahap && !TAHAP.some((t) => t.kunci === tahap)) {
      console.error('Tahap tidak dikenal. Pilihan: ' + TAHAP.map((t) => t.kunci).join(', '));
      process.exit(2);
    }
    await lapor(job, { tahap, status: o.status ?? 'mulai', log: o.log ?? o.teks, persen: o.persen ? Number(o.persen) : undefined });
    console.log('ok');
  },

  async log() {
    await lapor(perlu('job'), { log: perlu('teks') });
    console.log('ok');
  },

  async cek() {
    const { dir } = await folderJob(perlu('job'));
    const { cekSpec } = await import('./cek');
    const ok = cekSpec(dir);
    process.exit(ok ? 0 : 1);
  },

  async tts() {
    const { job, dir } = await folderJob(perlu('job'));
    const { buatSuara } = await import('./tts');
    await buatSuara(job, dir);
  },

  async still() {
    const { dir } = await folderJob(perlu('job'));
    const { renderCek } = await import('./render');
    const detik = (o.detik ?? '1').split(',').map(Number).filter((n) => !isNaN(n));
    const hasil = await renderCek(dir, detik);
    console.log('Gambar cek (buka & periksa dengan Read):');
    for (const f of hasil) console.log('  ' + path.relative(ROOT, f));
  },

  async render() {
    const { job, dir } = await folderJob(perlu('job'));
    const { renderFinal } = await import('./render');
    await renderFinal(job, dir);
    if (!o['tanpa-selesai']) {
      await api('/api/claude/selesai', { job: job.id });
      console.log('Job ditandai selesai. Video muncul di Riwayat studio.');
    }
  },

  async selesai() {
    const r = await api('/api/claude/selesai', { job: perlu('job') });
    console.log(r.status === 200 ? 'ok' : r.data);
  },

  async gagal() {
    await api('/api/claude/gagal', { job: perlu('job'), pesan: o.pesan ?? o.teks ?? 'Gagal' });
    console.log('ok');
  },

  async audio() {
    const daftar = (d: string) => fs.readdirSync(d).filter((f) => /\.(mp3|wav|m4a|ogg|aac)$/i.test(f));
    console.log('MUSIK (musik/):');
    for (const f of daftar(DIR.musik)) console.log('  musik/' + f);
    console.log('SFX (sfx/):');
    for (const f of daftar(DIR.sfx)) console.log('  sfx/' + f);
    if (!daftar(DIR.musik).length) console.log('  (belum ada musik — taruh file MP3 bebas royalti di folder musik/)');
  },

  async 'buat-sfx'() {
    const { buatSfxContoh } = await import('./sfx');
    buatSfxContoh(DIR.sfx);
  },

  async bantuan() {
    console.log(`Animantra Studio CLI — node studio.mjs <perintah>

  server [--tanpa-buka]           Nyalakan studio lokal & buka browser
  listen [--menit 25] [--agen gemini|claude]  Tunggu pesanan dari studio (jalankan di background)
  progress --job ID --tahap T --status mulai|selesai|lewati [--log "..."] [--persen N]
  log --job ID --teks "..."       Tambah baris log di studio
  cek --job ID                    Validasi spec.json & berkas aset
  tts --job ID                    Buat suara (Gemini TTS) + hitung durasi adegan
  still --job ID --detik 1,4,9    Render gambar cek ke videos/<slug>/cek/
  render --job ID                 Render final.mp4 + cover + cuplikan, lalu tandai selesai
  gagal --job ID --pesan "..."    Tandai job gagal
  audio                           Daftar musik & SFX lokal
  buat-sfx                        Buat SFX contoh (pop, whoosh, klik, ding)

Tahap: ${TAHAP.map((t) => t.kunci).join(', ')}`);
  },
};

const fn = PERINTAH[perintah] ?? PERINTAH.bantuan;
fn().catch((e) => {
  console.error('Galat:', e instanceof Error ? e.message : e);
  process.exit(1);
});
