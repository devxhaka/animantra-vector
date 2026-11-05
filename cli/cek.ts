import fs from 'node:fs';
import path from 'node:path';
import { skemaSpec } from './skema';
import { DIR } from '../server/jalur';
import { formatMisteri } from '../shared/formats';
import { dedupPeringatan, rencanakanAksi } from '../remotion/karakter/aksi/resolver';
import { periksaJangkauan } from '../remotion/karakter/aksi/terapkan';
import { KARAKTER_CADANGAN } from '../shared/karakter-bawaan';
import type { Spec } from '../shared/tipe';

export type HasilPeriksa = { ok: boolean; masalah: string[]; saran: string[]; info: string[] };

/** Validasi spec.json + keberadaan berkas, sebagai data (dipakai CLI & Mode Tempel). */
export function periksaSpec(dir: string): HasilPeriksa {
  const f = path.join(dir, 'spec.json');
  if (!fs.existsSync(f)) return { ok: false, masalah: ['spec.json belum ada di ' + dir], saran: [], info: [] };
  let data: unknown;
  try {
    data = JSON.parse(fs.readFileSync(f, 'utf8'));
  } catch (e) {
    return { ok: false, masalah: ['spec.json bukan JSON valid: ' + (e as Error).message], saran: [], info: [] };
  }
  return periksaSpecData(data, dir);
}

/** Validasi isi spec (sudah terurai) + keberadaan berkas di folder video. */
export function periksaSpecData(data: unknown, dir: string): HasilPeriksa {
  const r = skemaSpec.safeParse(data);
  const masalah: string[] = [];
  const saran: string[] = [];
  if (!r.success) for (const i of r.error.issues) masalah.push(`${i.path.join('.')}: ${i.message}`);
  return periksaSpecLanjut(data as any, dir, masalah, saran);
}

function periksaSpecLanjut(spec: any, dir: string, masalah: string[], saran: string[]): HasilPeriksa {
  const ada = (p: string) => fs.existsSync(path.join(dir, p)) || (/^(musik|sfx)\//.test(p) && fs.existsSync(path.join(DIR.videos, '..', p)));
  for (const [i, a] of (spec.adegan ?? []).entries()) {
    for (const s of a.aset ?? []) if (!ada(s.file)) masalah.push(`adegan[${i}] aset tidak ada: ${s.file}`);
    for (const s of a.sfx ?? []) if (!ada(s.file)) masalah.push(`adegan[${i}] sfx tidak ada: ${s.file}`);
    if (a.suara && !ada(a.suara)) masalah.push(`adegan[${i}] suara tidak ada: ${a.suara}`);
    if (a.latar && !ada(a.latar)) masalah.push(`adegan[${i}] latar tidak ada: ${a.latar}`);
    const ids = new Set((spec.pemeran ?? []).map((p: any) => p.id));
    for (const t of a.tokoh ?? []) if (!ids.has(t.id)) masalah.push(`adegan[${i}] tokoh "${t.id}" tidak ada di pemeran`);
    if (a.pembicara && a.pembicara !== 'narator' && !ids.has(a.pembicara)) masalah.push(`adegan[${i}] pembicara "${a.pembicara}" tidak ada di pemeran`);
    if (a.pembicara && a.pembicara !== 'narator' && !(a.tokoh ?? []).some((t: any) => t.id === a.pembicara)) saran.push(`adegan[${i}] "${a.id}": ${a.pembicara} bicara tapi tidak tampil (mulutnya tidak terlihat)`);
    const kata = String(a.narasi ?? '').split(/\s+/).length;
    if (a.durasi && kata / a.durasi > 3.4) saran.push(`adegan[${i}] "${a.id}" narasi terlalu padat (${kata} kata / ${a.durasi} dtk)`);
    if (!a.aset?.length && !a.tokoh?.length && !a.latar) saran.push(`adegan[${i}] "${a.id}" tidak punya visual (aset/tokoh/latar)`);
  }
  for (const [i, a] of (spec.adegan ?? []).entries())
    for (const s of a.aset ?? [])
      if (String(s.file).endsWith('.svg') && ada(s.file)) {
        const isi = fs.readFileSync(path.join(dir, s.file), 'utf8');
        if (!/viewBox=/.test(isi)) masalah.push(`adegan[${i}] ${s.file}: SVG wajib punya viewBox`);
        if (/<text[\s>]/.test(isi)) saran.push(`${s.file}: hindari <text> di SVG — pakai label spec agar huruf mengikuti gaya`);
        if (/<image[\s>]|xlink:href="http/.test(isi)) masalah.push(`${s.file}: SVG tidak boleh memuat gambar eksternal`);
      }
  if (spec.musik?.file && !ada(spec.musik.file)) masalah.push(`musik tidak ada: ${spec.musik.file}`);
  if (spec.judulSorot && spec.judul && !spec.judul.includes(spec.judulSorot)) masalah.push('judulSorot harus potongan persis dari judul');
  if (!fs.existsSync(path.join(dir, 'caption.txt'))) saran.push('caption.txt belum ditulis');
  if (formatMisteri(spec.format)) masalah.push(...cekRisetMisteri(dir));
  const aksi = cekAksiSpec(spec, (p) => fs.existsSync(path.join(dir, p)));
  masalah.push(...aksi.masalah);
  saran.push(...aksi.peringatan);
  const info = aksi.info;

  const total = (spec.adegan ?? []).reduce((s: number, a: any) => s + (a.durasi ?? 0), 0);
  return { ok: masalah.length === 0, masalah, saran, info };
}

/** Validasi spec.json + keberadaan berkas. Cetak masalah dalam bahasa yang bisa langsung diperbaiki. */
export function cekSpec(dir: string): boolean {
  const { ok, masalah, saran, info } = periksaSpec(dir);
  const spec = (() => {
    try {
      return JSON.parse(fs.readFileSync(path.join(dir, 'spec.json'), 'utf8')) as any;
    } catch {
      return null;
    }
  })();
  const total = (spec?.adegan ?? []).reduce((s: number, a: any) => s + (a.durasi ?? 0), 0);
  console.log(`Spec: ${spec?.adegan?.length ?? 0} adegan · total ${total.toFixed(1)} dtk`);
  for (const m of masalah) console.log('  ✗ ' + m);
  for (const s of saran) console.log('  ! ' + s);
  for (const s of info) console.log('  · ' + s);
  if (ok) console.log('✓ Spec valid');
  return ok;
}

/** Bagian wajib riset.md untuk Mystery Files (lihat panduan/mystery-storytelling.md). */
export const BAGIAN_RISET_MISTERI = [
  { kunci: /fakta/i, nama: 'Fakta terverifikasi' },
  { kunci: /hipotesis/i, nama: 'Hipotesis' },
  { kunci: /legenda/i, nama: 'Legenda' },
  { kunci: /spekulasi/i, nama: 'Spekulasi' },
  { kunci: /tidak diketahui/i, nama: 'Tidak diketahui' },
  { kunci: /sumber/i, nama: 'Sumber' },
];

/** Kembalikan daftar masalah riset.md untuk format mystery (kosong = lolos). */
export function cekRisetMisteri(dir: string): string[] {
  const f = path.join(dir, 'riset.md');
  if (!fs.existsSync(f)) return ['riset.md wajib ada untuk Mystery Files (lihat panduan/mystery-storytelling.md)'];
  const isi = fs.readFileSync(f, 'utf8');
  const judul = isi.split(/\r?\n/).filter((b) => /^#{1,3}\s/.test(b));
  const masalah: string[] = [];
  for (const b of BAGIAN_RISET_MISTERI) if (!judul.some((j) => b.kunci.test(j))) masalah.push(`riset.md: bagian "## ${b.nama}" belum ada`);
  // bagian Sumber harus berisi minimal satu butir/tautan
  const iSumber = isi.search(/^#{1,3}\s.*sumber/im);
  if (iSumber >= 0) {
    const sisa = isi.slice(iSumber).split(/\r?\n/).slice(1);
    const akhir = sisa.findIndex((b) => /^#{1,3}\s/.test(b));
    const badan = (akhir >= 0 ? sisa.slice(0, akhir) : sisa).filter((b) => /^\s*([-*]|\d+\.)\s+\S/.test(b) || /https?:\/\//.test(b));
    if (!badan.length) masalah.push('riset.md: bagian Sumber belum berisi sumber (butir atau tautan)');
  }
  return masalah;
}

/**
 * Validasi aksi khusus semua tokoh di spec memakai resolver yang SAMA dengan renderer.
 * Peringatan dikumpulkan sebagai data lalu dideduplikasi di sini (bukan di jalur render).
 */
export function cekAksiSpec(spec: Partial<Spec>, adaBerkas: (p: string) => boolean) {
  const masalah: string[] = [];
  const peringatan: string[] = [];
  const info: string[] = [];
  for (const [i, a] of (spec.adegan ?? []).entries()) {
    for (const tk of a.tokoh ?? []) {
      if (!tk.aksi?.length) continue;
      const asetHilang = tk.aksi.map((x) => (x as { aset?: unknown }).aset).filter((x): x is string => typeof x === 'string' && !adaBerkas(x));
      const rencana = rencanakanAksi(tk, {
        modeBawaan: spec.modeAnimasi,
        durasiAdegan: a.durasi,
        asetHilang,
        karakter: spec.pemeran?.find((p) => p.id === tk.id),
      });
      const karakter = spec.pemeran?.find((p) => p.id === tk.id) ?? KARAKTER_CADANGAN;
      for (const r of rencana.khusus)
        if (r.aksi.jenis === 'open-object') {
          const pesan = periksaJangkauan(tk, r.aksi, karakter, { lebar: spec.lebar ?? 1080, tinggi: spec.tinggi ?? 1920 });
          if (pesan) rencana.peringatan.push({ kode: 'di-luar-jangkauan', tingkat: 'peringatan', indeks: r.indeks, jenis: 'open-object', pesan });
        }
      for (const p of dedupPeringatan(rencana.peringatan)) {
        const baris = `adegan[${i}] "${a.id}" ${tk.id}${p.indeks !== undefined ? ` aksi #${p.indeks}` : ''}: ${p.pesan}`;
        (p.tingkat === 'masalah' ? masalah : p.tingkat === 'peringatan' ? peringatan : info).push(baris);
      }
    }
  }
  return { masalah, peringatan, info };
}
