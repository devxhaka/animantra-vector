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
import { ID_AKSI, REGISTRI_AKSI, lihatDariArah } from '../shared/aksi';
import { aksiAktifPada, durasiTransisi, evaluasiAksi, gabungUrutanFallback, rencanakanAksi, type RencanaAksi } from '../remotion/karakter/aksi/resolver';
import { cekAksiSpec } from '../cli/cek';
import { PUTAR_MAKS, targetPutar, terapkanAksi } from '../remotion/karakter/aksi/terapkan';
import { PARAM_EKSPRESI, PARAM_POSE, PUTAR_DASAR, type StatusTokoh } from '../remotion/karakter/Tokoh';
import type { AksiAktif } from '../remotion/karakter/aksi/resolver';
import type { AksiTokoh, AksiTurnHead, Spec, TokohAdegan } from '../shared/tipe';

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

// ======================= Phase 2A: animasi hibrida =======================
console.log('Phase 2A: registri aksi');
const T_DASAR: TokohAdegan = { id: 'morgan', x: 0.5, hadap: 'kanan', pose: 'diam', ekspresi: 'netral', lihat: 'depan' };
const HEAD: AksiTokoh = { jenis: 'turn-head', mulai: 1, durasi: 2, arah: 'kanan' };
const SENTER: AksiTokoh = { jenis: 'flashlight-sweep', mulai: 0.5, durasi: 2, dari: 'kiri', ke: 'kanan' };
const BUKA: AksiTokoh = { jenis: 'open-object', mulai: 3, durasi: 2, benda: 'dokumen', posisi: { x: 0.7, y: 0.65 } };
const tersediaSemua = Object.fromEntries(ID_AKSI.map((j) => [j, { ...REGISTRI_AKSI[j], tersedia: true }]));
const kode = (r: RencanaAksi) => r.peringatan.map((p) => p.kode);

uji('3 aksi terdaftar dengan bagian tubuh yang benar', () => {
  pastikan(JSON.stringify(ID_AKSI) === JSON.stringify(['turn-head', 'flashlight-sweep', 'open-object']), ID_AKSI.join());
  pastikan(REGISTRI_AKSI['turn-head'].bagian(HEAD).join() === 'kepala', 'turn-head');
  pastikan(REGISTRI_AKSI['flashlight-sweep'].bagian(SENTER).join() === 'lengan-dep', 'senter dep');
  pastikan(REGISTRI_AKSI['flashlight-sweep'].bagian({ ...SENTER, tangan: 'bel' } as AksiTokoh).join() === 'lengan-bel', 'senter bel');
  pastikan(REGISTRI_AKSI['open-object'].bagian(BUKA).join() === 'lengan-dep', 'buka');
});
uji('status implementasi jujur: turn-head tersedia (2B); senter & open-object belum', () => {
  pastikan(REGISTRI_AKSI['turn-head'].tersedia, 'turn-head harus tersedia');
  pastikan(!REGISTRI_AKSI['flashlight-sweep'].tersedia && !REGISTRI_AKSI['open-object'].tersedia, 'lainnya belum');
});

console.log('Phase 2A: kompatibilitas');
uji('tokoh tanpa aksi → rencana kosong, tanpa peringatan, objek tokoh tidak berubah', () => {
  const r = rencanakanAksi(T_DASAR);
  pastikan(!r.khusus.length && !r.urutanFallback.length && !r.peringatan.length, JSON.stringify(r));
  pastikan(gabungUrutanFallback(T_DASAR, r) === T_DASAR, 'harus objek yang sama');
  pastikan(aksiAktifPada(r, 1).length === 0, 'tidak ada aksi aktif');
});
uji('spec lama melewati cekAksiSpec tanpa satu baris pun', () => {
  const h = cekAksiSpec({ ...SPEC_CONTOH, adegan: [{ id: 'a', narasi: 'x', durasi: 2, tokoh: [T_DASAR] }] }, () => true);
  pastikan(!h.masalah.length && !h.peringatan.length && !h.info.length, JSON.stringify(h));
});
uji('zod: aksi & modeAnimasi diterima, mode tak dikenal ditolak', () => {
  valid({ ...SPEC_CONTOH, modeAnimasi: 'auto', adegan: [{ id: 'a', narasi: 'x', durasi: 2, tokoh: [{ ...T_DASAR, modeAnimasi: 'special', aksi: [HEAD, SENTER] }] }] });
  pastikan(!skemaSpec.safeParse({ ...SPEC_CONTOH, modeAnimasi: 'ngawur' }).success, 'harus ditolak');
});

console.log('Phase 2A: routing');
uji('mode bawaan = auto; spec.modeAnimasi berlaku; tokoh menimpa spec', () => {
  pastikan(rencanakanAksi({ ...T_DASAR, aksi: [HEAD] }).mode === 'auto', 'bawaan auto');
  pastikan(rencanakanAksi({ ...T_DASAR, aksi: [HEAD] }, { modeBawaan: 'existing' }).mode === 'existing', 'spec');
  pastikan(rencanakanAksi({ ...T_DASAR, modeAnimasi: 'special', aksi: [HEAD] }, { modeBawaan: 'existing' }).mode === 'special', 'tokoh menimpa');
});
uji('existing → semua fallback pose lama + info "disederhanakan" yang jujur', () => {
  const r = rencanakanAksi({ ...T_DASAR, modeAnimasi: 'existing', aksi: [HEAD, SENTER, BUKA] }, { registri: tersediaSemua });
  pastikan(!r.khusus.length, 'tidak boleh ada aksi khusus');
  pastikan(kode(r).filter((k) => k === 'disederhanakan').length === 3, kode(r).join());
  pastikan(r.peringatan.every((p) => p.tingkat === 'info'), 'tingkat info');
  const teks = r.peringatan.map((p) => p.pesan).join(' | ');
  pastikan(/kepala TIDAK berputar/.test(teks) && /senter, sinar, dan gerak menyapu TIDAK/.test(teks) && /dokumen TIDAK digambar dan TIDAK terbuka/.test(teks), teks);
  const ev = r.urutanFallback;
  pastikan(ev.some((e) => e.pada === 1 && e.lihat === 'kanan'), 'turn-head → lihat kanan');
  pastikan(ev.some((e) => e.pada === 0.5 && e.pose === 'menunjuk'), 'senter → menunjuk');
  pastikan(ev.some((e) => e.pada === 3 && e.pose === 'meraih') && ev.some((e) => e.pada === 4 && e.pose === 'berpikir'), 'buka → meraih, berpikir');
  pastikan(ev.some((e) => e.pada === 5 && e.pose === 'diam'), 'kembali ke pose dasar setelah selesai');
});
uji('special/auto saat implementasi belum ada → fallback + peringatan "belum-tersedia"', () => {
  for (const mode of ['special', 'auto'] as const) {
    const r = rencanakanAksi({ ...T_DASAR, modeAnimasi: mode, aksi: [SENTER] });
    pastikan(!r.khusus.length && r.urutanFallback.length > 0, mode);
    pastikan(r.peringatan[0]?.kode === 'belum-tersedia' && r.peringatan[0].tingkat === 'peringatan', mode + ' ' + kode(r));
  }
});
uji('special/auto saat implementasi tersedia → aksi khusus, tanpa fallback', () => {
  for (const mode of ['special', 'auto'] as const) {
    const r = rencanakanAksi({ ...T_DASAR, modeAnimasi: mode, aksi: [HEAD, SENTER, BUKA] }, { registri: tersediaSemua });
    pastikan(r.khusus.length === 3 && !r.urutanFallback.length && !r.peringatan.length, mode + ' ' + kode(r));
  }
});
uji('auto + rig tidak cocok → fallback + peringatan "rig-tidak-cocok"', () => {
  const reg = { ...tersediaSemua, 'turn-head': { ...tersediaSemua['turn-head'], cocokRig: () => 'hijab menutupi telinga' } };
  const r = rencanakanAksi({ ...T_DASAR, aksi: [HEAD] }, { registri: reg });
  pastikan(!r.khusus.length && kode(r).join() === 'rig-tidak-cocok', kode(r).join());
});
uji('nilai bawaan terisi saat normalisasi', () => {
  const r = rencanakanAksi({ ...T_DASAR, aksi: [HEAD, SENTER, BUKA] }, { registri: tersediaSemua });
  const [h, f, o] = r.khusus.map((x) => x.aksi as any);
  pastikan(h.kembali === true && f.tangan === 'dep' && f.sinar === true && o.tangan === 'dep' && o.skala === 1 && o.tetapTerbuka === true, JSON.stringify([h, f, o]));
});

console.log('Phase 2A: timeline & interpolasi (detik)');
uji('fase & progres: sebelum, masuk, tahan, keluar, sesudah', () => {
  const r = rencanakanAksi({ ...T_DASAR, aksi: [HEAD] }, { registri: tersediaSemua }).khusus[0];
  pastikan(evaluasiAksi(r, 0.99) === null, 'sebelum mulai');
  const m = evaluasiAksi(r, 1.15)!;
  pastikan(m.fase === 'masuk' && m.amplop > 0 && m.amplop < 1 && Math.abs(m.progres - 0.075) < 1e-9, JSON.stringify(m));
  const t = evaluasiAksi(r, 2)!;
  pastikan(t.fase === 'tahan' && t.amplop === 1 && t.progres === 0.5, JSON.stringify(t));
  const k = evaluasiAksi(r, 2.9)!;
  pastikan(k.fase === 'keluar' && k.amplop > 0 && k.amplop < 1, JSON.stringify(k));
  pastikan(evaluasiAksi(r, 3.01) === null, 'sesudah selesai (kembali=true)');
});
uji('kembali:false → ditahan sampai adegan selesai', () => {
  const r = rencanakanAksi({ ...T_DASAR, aksi: [{ ...HEAD, kembali: false } as AksiTokoh] }, { registri: tersediaSemua }).khusus[0];
  const e = evaluasiAksi(r, 10)!;
  pastikan(e.fase === 'ditahan' && e.amplop === 1 && e.progres === 1, JSON.stringify(e));
  pastikan(evaluasiAksi(r, 2.95)!.amplop === 1, 'tidak ada fase keluar');
});
uji('amplop naik monoton saat masuk & turun monoton saat keluar', () => {
  const r = rencanakanAksi({ ...T_DASAR, aksi: [HEAD] }, { registri: tersediaSemua }).khusus[0];
  let lalu = -1;
  for (let t = 1; t <= 1.3; t += 0.01) {
    const a = evaluasiAksi(r, t)!.amplop;
    pastikan(a >= lalu - 1e-12, 'masuk t=' + t);
    lalu = a;
  }
  lalu = 2;
  for (let t = 2.7; t < 3; t += 0.01) {
    const a = evaluasiAksi(r, t)!.amplop;
    pastikan(a <= lalu + 1e-12, 'keluar t=' + t);
    lalu = a;
  }
});
uji('durasi transisi = min(0,3 dtk, 25% durasi)', () => pastikan(durasiTransisi(2) === 0.3 && durasiTransisi(0.8) === 0.2, 'nilai'));

console.log('Phase 2A: tumpang tindih & kepemilikan bagian tubuh');
uji('dua aksi lengan-dep tumpang tindih → yang mulai belakangan menang + peringatan', () => {
  const r = rencanakanAksi({ ...T_DASAR, aksi: [SENTER, { ...BUKA, mulai: 1.5 } as AksiTokoh] }, { registri: tersediaSemua });
  pastikan(kode(r).includes('tumpang-tindih'), kode(r).join());
  const a = aksiAktifPada(r, 2);
  pastikan(a.length === 1 && a[0].aksi.jenis === 'open-object', JSON.stringify(a.map((x) => x.aksi.jenis)));
  pastikan(aksiAktifPada(r, 1)[0]?.aksi.jenis === 'flashlight-sweep', 'sebelum tumpang tindih senter aktif');
});
uji('bagian berbeda berjalan bersamaan (menoleh + senter)', () => {
  const r = rencanakanAksi({ ...T_DASAR, aksi: [HEAD, SENTER] }, { registri: tersediaSemua });
  pastikan(!kode(r).includes('tumpang-tindih'), kode(r).join());
  const a = aksiAktifPada(r, 1.5).map((x) => x.bagian.join());
  pastikan(a.length === 2 && a.includes('kepala') && a.includes('lengan-dep'), JSON.stringify(a));
});
uji('mulai sama → indeks lebih besar menang (deterministik)', () => {
  const r = rencanakanAksi({ ...T_DASAR, aksi: [SENTER, { ...SENTER, ke: 'atas' } as AksiTokoh] }, { registri: tersediaSemua });
  pastikan(aksiAktifPada(r, 1)[0].indeks === 1, 'indeks 1');
});

console.log('Phase 2A: input salah & aset');
uji('jenis tak dikenal → "tidak-dikenal" (masalah), diabaikan tapi dilaporkan', () => {
  const r = rencanakanAksi({ ...T_DASAR, aksi: [{ jenis: 'salto', mulai: 0, durasi: 1 } as unknown as AksiTokoh] });
  pastikan(kode(r).join() === 'tidak-dikenal' && r.peringatan[0].tingkat === 'masalah' && !r.khusus.length && !r.urutanFallback.length, kode(r).join());
});
uji('parameter invalid → "parameter-invalid" dengan rincian', () => {
  const salah = [
    { jenis: 'turn-head', mulai: 0, durasi: 1, arah: 'serong' },
    { jenis: 'flashlight-sweep', mulai: -1, durasi: 0, dari: 'kiri' },
    { jenis: 'open-object', mulai: 0, durasi: 1, benda: 'koper', posisi: { x: 2, y: 0.5 } },
  ] as unknown as AksiTokoh[];
  const r = rencanakanAksi({ ...T_DASAR, aksi: salah });
  pastikan(kode(r).every((k) => k === 'parameter-invalid') && r.peringatan.length === 3, kode(r).join());
  const teks = r.peringatan.map((p) => p.pesan).join(' | ');
  for (const frasa of ['arah harus', 'mulai harus', 'durasi harus', 'ke wajib', 'benda harus', 'posisi di luar']) pastikan(teks.includes(frasa), 'kurang: ' + frasa + ' dalam ' + teks);
});
uji('aset kustom hilang → tetap aksi khusus dengan gambar bawaan + peringatan', () => {
  const r = rencanakanAksi({ ...T_DASAR, aksi: [{ ...SENTER, aset: 'aset/senter.svg' } as AksiTokoh] }, { registri: tersediaSemua, asetHilang: ['aset/senter.svg'] });
  pastikan(r.khusus.length === 1 && r.khusus[0].pakaiGambarBawaan && kode(r).join() === 'aset-hilang', kode(r).join());
  const ada = rencanakanAksi({ ...T_DASAR, aksi: [{ ...SENTER, aset: 'aset/senter.svg' } as AksiTokoh] }, { registri: tersediaSemua });
  pastikan(!ada.khusus[0].pakaiGambarBawaan && !ada.peringatan.length, 'aset ada');
});
uji('aksi melewati adegan & terlalu singkat diperingatkan', () => {
  const r = rencanakanAksi({ ...T_DASAR, aksi: [{ ...HEAD, durasi: 0.1 } as AksiTokoh, { ...BUKA, mulai: 4 } as AksiTokoh] }, { registri: tersediaSemua, durasiAdegan: 5 });
  pastikan(kode(r).includes('terlalu-singkat') && kode(r).includes('melewati-adegan'), kode(r).join());
});
uji('cekAksiSpec: masalah menggagalkan, fallback jadi peringatan (aset tak relevan saat fallback)', () => {
  const spec = {
    ...SPEC_CONTOH,
    adegan: [{ id: 'a', narasi: 'x', durasi: 6, tokoh: [{ ...T_DASAR, aksi: [HEAD, { ...SENTER, aset: 'aset/tidak-ada.svg' }, { jenis: 'terbang', mulai: 0, durasi: 1 }] }] }],
  } as unknown as Spec;
  const h = cekAksiSpec(spec, (p) => p !== 'aset/tidak-ada.svg');
  pastikan(h.masalah.length === 1 && /terbang/.test(h.masalah[0]), JSON.stringify(h.masalah));
  // turn-head kini aksi khusus (tanpa peringatan); senter masih fallback (1 peringatan)
  pastikan(h.peringatan.length === 1 && /flashlight-sweep.*belum tersedia/.test(h.peringatan[0]), JSON.stringify(h.peringatan));
});

console.log('Phase 2A: arah & tokoh menghadap kiri');
uji('arah layar dikonversi ke lihat lokal (tokoh menghadap kiri dicerminkan)', () => {
  pastikan(lihatDariArah('kanan', { x: 0.5, y: 0.8, hadap: 'kanan' }) === 'kanan', 'hadap kanan');
  pastikan(lihatDariArah('kanan', { x: 0.5, y: 0.8, hadap: 'kiri' }) === 'kiri', 'hadap kiri → cermin');
  pastikan(lihatDariArah({ x: 0.2, y: 0.5 }, { x: 0.6, y: 0.8, hadap: 'kanan' }) === 'kiri', 'target di kiri');
  pastikan(lihatDariArah({ x: 0.62, y: 0.1 }, { x: 0.6, y: 0.8, hadap: 'kanan' }) === 'atas', 'target di atas');
  const r = rencanakanAksi({ ...T_DASAR, hadap: 'kiri', modeAnimasi: 'existing', aksi: [HEAD] });
  pastikan(r.urutanFallback[0].lihat === 'kiri', 'fallback turn-head kanan pada tokoh hadap kiri → lihat kiri');
});

console.log('Phase 2A: determinisme');
uji('rencana & evaluasi identik bila diulang, dan tidak bergantung urutan evaluasi frame', () => {
  const tokoh = { ...T_DASAR, aksi: [HEAD, SENTER, BUKA] };
  const r1 = rencanakanAksi(tokoh, { registri: tersediaSemua, durasiAdegan: 6 });
  const r2 = rencanakanAksi(tokoh, { registri: tersediaSemua, durasiAdegan: 6 });
  pastikan(JSON.stringify(r1) === JSON.stringify(r2), 'rencana berbeda');
  const frame = Array.from({ length: 180 }, (_, f) => f);
  const maju = frame.map((f) => JSON.stringify(aksiAktifPada(r1, f / 30)));
  const acak = [...frame].sort((a, b) => ((a * 7919) % 181) - ((b * 7919) % 181)); // urutan "acak" deterministik
  const hasilAcak = new Map(acak.map((f) => [f, JSON.stringify(aksiAktifPada(r1, f / 30))]));
  pastikan(frame.every((f) => hasilAcak.get(f) === maju[f]), 'urutan evaluasi memengaruhi hasil');
  pastikan(JSON.stringify(tokoh.aksi) === JSON.stringify([HEAD, SENTER, BUKA]), 'input tidak boleh dimutasi');
});

// ======================= Phase 2B: turn-head =======================
console.log('Phase 2B: turn-head');
const S_DASAR: StatusTokoh = { pose: PARAM_POSE.diam, ekspresi: PARAM_EKSPRESI.netral, lihat: [0.35, 0], t: 1, bicara: 0, jalan: NaN };
const aktifHead = (a: Partial<AksiTurnHead>, amplop: number): AksiAktif => ({
  indeks: 0, aksi: { ...(HEAD as AksiTurnHead), kembali: true, ...a } as AksiTokoh, bagian: ['kepala'], progres: 0.5, amplop, fase: 'tahan', pakaiGambarBawaan: true,
});
uji('arah layar → putar lokal, dicerminkan untuk tokoh menghadap kiri', () => {
  pastikan(targetPutar('tengah', 'kanan') === 0 && targetPutar('tengah', 'kiri') === 0, 'tengah');
  pastikan(targetPutar('kanan', 'kanan') === PUTAR_MAKS && targetPutar('kiri', 'kanan') === -PUTAR_MAKS, 'hadap kanan');
  pastikan(targetPutar('kanan', 'kiri') === -PUTAR_MAKS && targetPutar('kiri', 'kiri') === PUTAR_MAKS, 'hadap kiri');
});
uji('tanpa aksi aktif → status sama persis (objek yang sama)', () => pastikan(terapkanAksi(S_DASAR, [], { hadap: 'kanan' }) === S_DASAR, 'objek berbeda'));
uji('amplop 0 → wajah bawaan (PUTAR_DASAR) & mata tidak berubah; amplop 1 → target', () => {
  const nol = terapkanAksi(S_DASAR, [aktifHead({ arah: 'kiri' }, 0)], { hadap: 'kanan' });
  pastikan(nol.putarKepala === PUTAR_DASAR && nol.lihat[0] === 0.35 && nol.lihat[1] === 0, JSON.stringify(nol));
  const satu = terapkanAksi(S_DASAR, [aktifHead({ arah: 'kiri' }, 1)], { hadap: 'kanan' });
  pastikan(satu.putarKepala === -PUTAR_MAKS && satu.lihat[0] < 0, JSON.stringify(satu));
});
uji('interpolasi halus: putar bergerak monoton dari dasar ke target', () => {
  let lalu = Infinity;
  for (let m = 0; m <= 1.0001; m += 0.1) {
    const p = terapkanAksi(S_DASAR, [aktifHead({ arah: 'kiri' }, m)], { hadap: 'kanan' }).putarKepala!;
    pastikan(p <= lalu + 1e-12, 'tidak monoton di m=' + m);
    lalu = p;
  }
});
uji('ekspresi opsional dicampur; lihat eksplisit dipakai bila ada', () => {
  const e = terapkanAksi(S_DASAR, [aktifHead({ arah: 'kanan', ekspresi: 'kaget' }, 1)], { hadap: 'kanan' });
  pastikan(e.ekspresi.buka === PARAM_EKSPRESI.kaget.buka && e.ekspresi.mulut === PARAM_EKSPRESI.kaget.mulut, 'ekspresi kaget');
  const l = terapkanAksi(S_DASAR, [aktifHead({ arah: 'kanan', lihat: 'atas' }, 1)], { hadap: 'kanan' });
  pastikan(l.lihat[0] === 0.3 && l.lihat[1] === -1, JSON.stringify(l.lihat));
  const tengah = terapkanAksi(S_DASAR, [aktifHead({ arah: 'tengah' }, 1)], { hadap: 'kanan' });
  pastikan(tengah.putarKepala === 0 && tengah.lihat[0] === 0, 'menghadap kamera, mata lurus');
});
uji('input status tidak dimutasi', () => {
  const salin = JSON.stringify(S_DASAR);
  terapkanAksi(S_DASAR, [aktifHead({ arah: 'kiri', ekspresi: 'cemas' }, 1)], { hadap: 'kanan' });
  pastikan(JSON.stringify(S_DASAR) === salin, 'termutasi');
});
uji('alur penuh resolver → terapkan: kembali=true lepas setelah selesai, kembali=false ditahan', () => {
  const r = rencanakanAksi({ ...T_DASAR, aksi: [HEAD] });
  pastikan(r.khusus.length === 1 && !r.urutanFallback.length && !r.peringatan.length, 'turn-head harus khusus tanpa fallback: ' + kode(r));
  const tengah = terapkanAksi(S_DASAR, aksiAktifPada(r, 2), { hadap: 'kanan' });
  pastikan(tengah.putarKepala === PUTAR_MAKS, 'di tengah aksi: ' + tengah.putarKepala);
  pastikan(terapkanAksi(S_DASAR, aksiAktifPada(r, 3.5), { hadap: 'kanan' }).putarKepala === undefined, 'setelah selesai: kembali ke wajah bawaan');
  const tahan = rencanakanAksi({ ...T_DASAR, aksi: [{ ...HEAD, kembali: false } as AksiTokoh] });
  pastikan(terapkanAksi(S_DASAR, aksiAktifPada(tahan, 9), { hadap: 'kanan' }).putarKepala === PUTAR_MAKS, 'ditahan');
});
uji('mode existing tetap fallback walau turn-head tersedia', () => {
  const r = rencanakanAksi({ ...T_DASAR, modeAnimasi: 'existing', aksi: [HEAD] });
  pastikan(!r.khusus.length && kode(r).join() === 'disederhanakan', kode(r).join());
});

console.log(`\n${lulus} lulus, ${gagal.length} gagal`);
process.exit(gagal.length ? 1 : 0);
