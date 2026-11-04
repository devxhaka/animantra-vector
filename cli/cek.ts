import fs from 'node:fs';
import path from 'node:path';
import { skemaSpec } from './skema';
import { DIR } from '../server/jalur';

/** Validasi spec.json + keberadaan berkas. Cetak masalah dalam bahasa yang bisa langsung diperbaiki. */
export function cekSpec(dir: string): boolean {
  const f = path.join(dir, 'spec.json');
  if (!fs.existsSync(f)) {
    console.error('✗ spec.json belum ada di ' + dir);
    return false;
  }
  let data: unknown;
  try {
    data = JSON.parse(fs.readFileSync(f, 'utf8'));
  } catch (e) {
    console.error('✗ spec.json bukan JSON valid: ' + (e as Error).message);
    return false;
  }
  const r = skemaSpec.safeParse(data);
  const masalah: string[] = [];
  const saran: string[] = [];
  if (!r.success) for (const i of r.error.issues) masalah.push(`${i.path.join('.')}: ${i.message}`);
  const spec = data as any;
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

  const total = (spec.adegan ?? []).reduce((s: number, a: any) => s + (a.durasi ?? 0), 0);
  console.log(`Spec: ${spec.adegan?.length ?? 0} adegan · total ${total.toFixed(1)} dtk`);
  for (const m of masalah) console.log('  ✗ ' + m);
  for (const s of saran) console.log('  ! ' + s);
  if (!masalah.length) console.log('✓ Spec valid');
  return masalah.length === 0;
}
