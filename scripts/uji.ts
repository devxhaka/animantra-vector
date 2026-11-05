// Uji otomatis ringan: `npm run test`. Tanpa dependensi tambahan.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { skemaSpec } from '../cli/skema';
import { cekRisetMisteri } from '../cli/cek';
import { FORMATS, formatBertokoh, formatDari, formatMisteri } from '../shared/formats';
import { GAYA_BAWAAN, GAYA_MYSTERY, PRESET_TEKS, PRESET_WARNA, rasioKontras } from '../shared/gaya-bawaan';
import { AGENT_MORGAN, KARAKTER_CONTOH, PAKAIAN_PILIHAN } from '../shared/karakter-bawaan';
import { SPEC_CONTOH } from '../shared/contoh-spec';

let lulus = 0;
const gagal: string[] = [];
function uji(nama: string, fn: () => void) {
  try {
    fn();
    lulus++;
    console.log('  ✓ ' + nama);
  } catch (e) {
    gagal.push(nama);
    console.log('  ✗ ' + nama + '\n      ' + (e as Error).message);
  }
}
function pastikan(syarat: unknown, pesan: string) {
  if (!syarat) throw new Error(pesan);
}
const valid = (spec: unknown) => {
  const r = skemaSpec.safeParse(spec);
  pastikan(r.success, r.success ? '' : r.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '));
};

console.log('Kompatibilitas spec lama');
uji('spec contoh (Kita Bongkar) tetap valid', () => valid(SPEC_CONTOH));
uji('spec Cerita lama (tanpa field baru) tetap valid', () =>
  valid({
    ...SPEC_CONTOH,
    format: 'cerita',
    pemeran: KARAKTER_CONTOH,
    adegan: [{ id: 'a1', narasi: 'Halo', durasi: 2, pembicara: 'kakak', latar: 'latar/x.svg', suasana: { gelap: 0.3 }, tokoh: [{ id: 'kakak', x: 0.5, pose: 'diam', ekspresi: 'senang' }] }],
  }),
);
uji('gaya lama tanpa teks/peringatan/permukaan tetap diterima', () => valid({ ...SPEC_CONTOH, gaya: { ...GAYA_BAWAAN, teks: undefined } }));

console.log('Format Mystery Storytelling');
uji('format mystery-story terdaftar dengan seri MYSTERY FILES', () => {
  const f = formatDari('mystery-story');
  pastikan(f.kunci === 'mystery-story' && f.nama === 'Mystery Storytelling' && f.seri === 'MYSTERY FILES', JSON.stringify(f));
});
uji('format lama tetap ada (12 format sebelumnya)', () => {
  for (const k of ['kita-bongkar', 'cerita', 'tur-lingkungan', 'story', 'pov', 'tutorial', 'mitos-fakta', 'a-vs-b', 'top-list', 'apa-jadinya', 'evolusi', 'kuis'])
    pastikan(FORMATS.some((f) => f.kunci === k), 'hilang: ' + k);
});
uji('formatBertokoh: cerita & mystery-story saja', () => {
  pastikan(formatBertokoh('cerita') && formatBertokoh('mystery-story'), 'harus true');
  pastikan(!formatBertokoh('kita-bongkar') && !formatBertokoh(undefined), 'harus false');
  pastikan(formatMisteri('mystery-story') && !formatMisteri('cerita'), 'formatMisteri salah');
});
uji('spec Mystery dengan Agent Morgan valid', () =>
  valid({
    ...SPEC_CONTOH,
    format: 'mystery-story',
    gaya: GAYA_MYSTERY,
    pemeran: [AGENT_MORGAN],
    adegan: [{ id: 'hook', narasi: 'Ada yang janggal di sini.', durasi: 3, pembicara: 'morgan', tokoh: [{ id: 'morgan', x: 0.5, pose: 'berpikir', ekspresi: 'serius' }] }],
  }),
);

console.log('Preset Mystery Files');
uji('warna sesuai spesifikasi', () => {
  const w = GAYA_MYSTERY.warna;
  const harap = { latar: '#0B1D2A', lantai: '#08131C', teks: '#E6D9B8', merek: '#2E7D8C', sorot: '#F5B24C', permukaan: '#142A38', peringatan: '#C85D55' };
  for (const [k, v] of Object.entries(harap)) pastikan((w as Record<string, string | undefined>)[k] === v, `${k}: ${(w as any)[k]} ≠ ${v}`);
});
uji('preset ada di daftar warna & teks', () => {
  pastikan(PRESET_WARNA.some((p) => p.nama === 'Mystery Files'), 'preset warna');
  pastikan(PRESET_TEKS.some((p) => p.nama === 'Mystery Files'), 'preset teks');
});
uji('kontras teks terbaca (WCAG ≥ 4,5)', () => {
  const w = GAYA_MYSTERY.warna;
  pastikan(rasioKontras(w.teks, w.latar) >= 4.5, 'teks vs latar ' + rasioKontras(w.teks, w.latar).toFixed(2));
  pastikan(rasioKontras(w.teksSorot, w.sorot) >= 4.5, 'teks sorot vs sorot');
  pastikan(rasioKontras(w.teksLabel, w.label) >= 4.5, 'teks label vs label');
});

console.log('Agent Morgan');
uji('identitas sesuai (laki dewasa, jaket detektif, rambut berantakan)', () => {
  const m = AGENT_MORGAN;
  pastikan(m.id === 'morgan' && m.jenis === 'laki' && m.usia === 'dewasa' && m.pakaian === 'jaket-detektif' && m.rambut === 'berantakan', JSON.stringify(m));
  pastikan(m.warna.dalam === '#111111', 'kemeja dalam hitam');
});
uji('pakaian jaket-detektif tersedia di pilihan Karakter', () => pastikan(PAKAIAN_PILIHAN.some((p) => p.kunci === 'jaket-detektif'), 'tidak ada'));

console.log('Riset Mystery (cek)');
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'uji-riset-'));
const lengkap = `# Riset\n## Fakta terverifikasi\n- a\n## Hipotesis\n- b\n## Legenda\n- c\n## Spekulasi\n- d\n## Tidak diketahui\n- e\n## Sumber\n- https://contoh.org/arsip\n`;
uji('riset lengkap lolos', () => {
  fs.writeFileSync(path.join(tmp, 'riset.md'), lengkap);
  const m = cekRisetMisteri(tmp);
  pastikan(m.length === 0, m.join('; '));
});
uji('riset tanpa bagian Legenda ditolak', () => {
  fs.writeFileSync(path.join(tmp, 'riset.md'), lengkap.replace('## Legenda\n- c\n', ''));
  pastikan(cekRisetMisteri(tmp).some((x) => x.includes('Legenda')), 'harus menolak');
});
uji('riset dengan Sumber kosong ditolak', () => {
  fs.writeFileSync(path.join(tmp, 'riset.md'), lengkap.replace('- https://contoh.org/arsip\n', ''));
  pastikan(cekRisetMisteri(tmp).some((x) => x.includes('Sumber')), 'harus menolak');
});
uji('riset.md tidak ada ditolak', () => {
  fs.rmSync(path.join(tmp, 'riset.md'));
  pastikan(cekRisetMisteri(tmp).length === 1, 'harus 1 masalah');
});
fs.rmSync(tmp, { recursive: true, force: true });

console.log(`\n${lulus} lulus, ${gagal.length} gagal`);
process.exit(gagal.length ? 1 : 0);
