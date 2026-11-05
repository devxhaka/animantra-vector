// Registri aksi khusus (animasi hibrida). Sumber kebenaran tunggal untuk: bagian tubuh yang
// dipegang aksi, validasi parameter, nilai bawaan, dan fallback ke mesin pose lama.
// Semua fungsi di sini MURNI (tanpa state global, tanpa waktu nyata, tanpa acak) — dipakai oleh
// resolver Remotion, `studio cek`, dan tes.
import {
  EKSPRESI,
  POSE,
  type AksiTokoh,
  type ArahAksi,
  type Ekspresi,
  type JenisAksi,
  type Karakter,
  type Lihat,
  type Pose,
  type TokohAdegan,
} from './tipe';

export type BagianTubuh = 'kepala' | 'lengan-dep' | 'lengan-bel';
export type UrutanEvent = NonNullable<TokohAdegan['urutan']>[number];

export type KodePeringatan =
  | 'tidak-dikenal' // jenis aksi tidak terdaftar → diabaikan (dilaporkan)
  | 'parameter-invalid' // parameter salah → diabaikan (dilaporkan)
  | 'disederhanakan' // dijalankan sebagai pose lama (mode existing / fallback)
  | 'belum-tersedia' // implementasi khusus belum ada → fallback
  | 'rig-tidak-cocok' // tokoh ini tidak bisa menjalankan aksi khusus → fallback
  | 'aset-hilang' // aset kustom tidak ditemukan → pakai gambar bawaan
  | 'tumpang-tindih' // dua aksi berebut bagian tubuh yang sama
  | 'melewati-adegan' // aksi berakhir setelah adegan selesai
  | 'terlalu-singkat'; // durasi di bawah minimum yang wajar

export type PeringatanAksi = {
  kode: KodePeringatan;
  /** masalah = spec perlu diperbaiki (cek gagal); peringatan = jalan tapi berbeda dari permintaan; info = catatan */
  tingkat: 'masalah' | 'peringatan' | 'info';
  pesan: string;
  indeks?: number; // indeks di tokoh.aksi
  jenis?: string;
};

/** Keadaan pose dasar tokoh (dari field tokoh + urutan), dipakai untuk fallback & kembali semula. */
export type KeadaanDasar = { pose: Pose; ekspresi: Ekspresi; lihat: Lihat; hadap: 'kiri' | 'kanan' };

export type DefinisiAksi = {
  jenis: JenisAksi;
  deskripsi: string;
  /** true bila implementasi khusus sudah ada di renderer. Phase 2A: semua false. */
  tersedia: boolean;
  /** durasi minimum (detik) agar gerak terbaca */
  durasiMin: number;
  /** semua aksi punya gambar bawaan prosedural, jadi aset kustom yang hilang tidak membatalkan aksi */
  punyaGambarBawaan: boolean;
  bagian: (a: AksiTokoh) => BagianTubuh[];
  /** aksi tetap memegang bagian tubuh setelah selesai (sampai adegan berakhir) */
  tahan: (a: AksiTokoh) => boolean;
  /** daftar kesalahan parameter (kosong = valid). Parameter umum (mulai/durasi) dicek terpisah. */
  validasi: (a: Record<string, unknown>) => string[];
  /** isi nilai bawaan */
  normalisasi: (a: AksiTokoh) => AksiTokoh;
  /** alasan tokoh tidak cocok untuk versi khusus (null = cocok) */
  cocokRig: (k: Karakter | undefined) => string | null;
  /** terjemahan ke event `urutan` pose lama + penjelasan jujur apa yang TIDAK ditampilkan */
  fallback: (a: AksiTokoh, ctx: KonteksFallback) => { urutan: UrutanEvent[]; keterangan: string };
};

export type KonteksFallback = {
  /** keadaan dasar saat aksi mulai & saat aksi berakhir */
  awal: KeadaanDasar;
  akhir: KeadaanDasar;
  /** posisi kaki tokoh di layar (0..1) */
  x: number;
  y: number;
};

// ---------------- util ----------------
const ARAH_TEKS = ['kiri', 'kanan', 'atas', 'bawah'] as const;
const angka = (v: unknown) => typeof v === 'number' && Number.isFinite(v);
const titik = (v: unknown): v is { x: number; y: number } =>
  !!v && typeof v === 'object' && angka((v as { x: unknown }).x) && angka((v as { y: unknown }).y);
const cekTitik = (v: unknown, nama: string, min: number, max: number): string[] =>
  !titik(v) ? [`${nama} harus {x, y} angka`] : v.x < min || v.x > max || v.y < min || v.y > max ? [`${nama} di luar rentang ${min}..${max}`] : [];
const cekArah = (v: unknown, nama: string): string[] =>
  typeof v === 'string' ? ((ARAH_TEKS as readonly string[]).includes(v) ? [] : [`${nama} harus kiri/kanan/atas/bawah atau {x, y}`]) : cekTitik(v, nama, -0.5, 1.5);
const cekPilihan = (v: unknown, nama: string, pilihan: readonly string[], wajib = false): string[] =>
  v === undefined ? (wajib ? [`${nama} wajib diisi`] : []) : typeof v === 'string' && pilihan.includes(v) ? [] : [`${nama} harus salah satu: ${pilihan.join(', ')}`];
const cekBool = (v: unknown, nama: string) => (v === undefined || typeof v === 'boolean' ? [] : [`${nama} harus true/false`]);
const cekTeks = (v: unknown, nama: string) => (v === undefined || (typeof v === 'string' && v.length > 0) ? [] : [`${nama} harus teks`]);

/** Arah layar → arah `lihat` lokal tokoh. Tokoh yang menghadap kiri dicerminkan, jadi kiri/kanan tertukar. */
export function lihatDariArah(arah: ArahAksi, ctx: { x: number; y: number; hadap: 'kiri' | 'kanan' }): Lihat {
  let layar: 'kiri' | 'kanan' | 'atas' | 'bawah';
  if (typeof arah === 'string') layar = arah;
  else {
    const dx = arah.x - ctx.x;
    const dy = arah.y - (ctx.y - 0.3); // kira-kira tinggi kepala di atas kaki
    layar = Math.abs(dy) > Math.abs(dx) ? (dy < 0 ? 'atas' : 'bawah') : dx < 0 ? 'kiri' : 'kanan';
  }
  if (layar === 'atas' || layar === 'bawah') return layar;
  if (ctx.hadap === 'kiri') return layar === 'kiri' ? 'kanan' : 'kiri';
  return layar;
}
const kembaliKe = (pada: number, k: KeadaanDasar): UrutanEvent => ({ pada, pose: k.pose, ekspresi: k.ekspresi, lihat: k.lihat });
const tangan = (a: { tangan?: string }) => (a.tangan === 'bel' ? 'lengan-bel' : 'lengan-dep') as BagianTubuh;

// ---------------- registri ----------------
export const REGISTRI_AKSI: Record<JenisAksi, DefinisiAksi> = {
  'turn-head': {
    jenis: 'turn-head',
    deskripsi: 'Menoleh ke kiri/kanan/tengah, opsional arah mata & ekspresi, opsional kembali.',
    tersedia: false,
    durasiMin: 0.3,
    punyaGambarBawaan: true,
    bagian: () => ['kepala'],
    tahan: (a) => a.jenis === 'turn-head' && a.kembali === false,
    validasi: (a) => [
      ...cekPilihan(a.arah, 'arah', ['kiri', 'kanan', 'tengah'], true),
      ...cekPilihan(a.lihat, 'lihat', ['depan', 'kiri', 'kanan', 'atas', 'bawah']),
      ...cekPilihan(a.ekspresi, 'ekspresi', EKSPRESI),
      ...cekBool(a.kembali, 'kembali'),
    ],
    normalisasi: (a) => (a.jenis === 'turn-head' ? { ...a, kembali: a.kembali ?? true } : a),
    cocokRig: () => null,
    fallback: (a, ctx) => {
      const t = a as Extract<AksiTokoh, { jenis: 'turn-head' }>;
      const lihat = t.lihat ?? (t.arah === 'tengah' ? 'depan' : lihatDariArah(t.arah, { ...ctx, hadap: ctx.awal.hadap }));
      const urutan: UrutanEvent[] = [{ pada: t.mulai, lihat, ...(t.ekspresi ? { ekspresi: t.ekspresi } : {}) }];
      if (t.kembali !== false) urutan.push(kembaliKe(t.mulai + t.durasi, ctx.akhir));
      return { urutan, keterangan: 'hanya arah pandang mata' + (t.ekspresi ? ' dan ekspresi' : '') + ' yang berubah; kepala TIDAK berputar' };
    },
  },
  'flashlight-sweep': {
    jenis: 'flashlight-sweep',
    deskripsi: 'Mengangkat senter dan menyapu dari satu arah ke arah lain, opsional dengan sinar.',
    tersedia: false,
    durasiMin: 0.6,
    punyaGambarBawaan: true,
    bagian: (a) => [tangan(a as { tangan?: string })],
    tahan: () => false,
    validasi: (a) => [
      ...cekPilihan(a.tangan, 'tangan', ['dep', 'bel']),
      ...(a.dari === undefined ? ['dari wajib diisi'] : cekArah(a.dari, 'dari')),
      ...(a.ke === undefined ? ['ke wajib diisi'] : cekArah(a.ke, 'ke')),
      ...cekBool(a.sinar, 'sinar'),
      ...cekTeks(a.aset, 'aset'),
    ],
    normalisasi: (a) => (a.jenis === 'flashlight-sweep' ? { ...a, tangan: a.tangan ?? 'dep', sinar: a.sinar ?? true } : a),
    cocokRig: () => null,
    fallback: (a, ctx) => {
      const f = a as Extract<AksiTokoh, { jenis: 'flashlight-sweep' }>;
      return {
        urutan: [{ pada: f.mulai, pose: 'menunjuk', lihat: lihatDariArah(f.ke, { ...ctx, hadap: ctx.awal.hadap }) }, kembaliKe(f.mulai + f.durasi, ctx.akhir)],
        keterangan: "hanya pose 'menunjuk' (selalu tangan depan) ke arah tujuan; senter, sinar, dan gerak menyapu TIDAK ditampilkan",
      };
    },
  },
  'open-object': {
    jenis: 'open-object',
    deskripsi: 'Tangan meraih benda (dokumen/buku/map) di posisi tertentu lalu membukanya.',
    tersedia: false,
    durasiMin: 0.8,
    punyaGambarBawaan: true,
    bagian: (a) => [tangan(a as { tangan?: string })],
    tahan: () => false,
    validasi: (a) => [
      ...cekPilihan(a.benda, 'benda', ['dokumen', 'buku', 'map'], true),
      ...(a.posisi === undefined ? ['posisi wajib diisi'] : cekTitik(a.posisi, 'posisi', 0, 1)),
      ...(a.skala === undefined || (angka(a.skala) && (a.skala as number) > 0 && (a.skala as number) <= 3) ? [] : ['skala harus angka 0..3']),
      ...cekPilihan(a.tangan, 'tangan', ['dep', 'bel']),
      ...cekTeks(a.aset, 'aset'),
      ...cekBool(a.tetapTerbuka, 'tetapTerbuka'),
    ],
    normalisasi: (a) => (a.jenis === 'open-object' ? { ...a, tangan: a.tangan ?? 'dep', skala: a.skala ?? 1, tetapTerbuka: a.tetapTerbuka ?? true } : a),
    cocokRig: () => null,
    fallback: (a, ctx) => {
      const o = a as Extract<AksiTokoh, { jenis: 'open-object' }>;
      const lihat = lihatDariArah(o.posisi, { ...ctx, hadap: ctx.awal.hadap });
      return {
        urutan: [{ pada: o.mulai, pose: 'meraih', lihat }, { pada: o.mulai + o.durasi * 0.5, pose: 'berpikir', lihat: 'bawah' }, kembaliKe(o.mulai + o.durasi, ctx.akhir)],
        keterangan: `hanya pose 'meraih' lalu 'berpikir'; ${o.benda} TIDAK digambar dan TIDAK terbuka`,
      };
    },
  },
};

export const ID_AKSI = Object.keys(REGISTRI_AKSI) as JenisAksi[];
export const aksiDikenal = (jenis: unknown): jenis is JenisAksi => typeof jenis === 'string' && jenis in REGISTRI_AKSI;

/** Validasi lengkap satu aksi (parameter umum + khusus). Kosong = valid. */
export function validasiAksi(a: unknown): string[] {
  if (!a || typeof a !== 'object') return ['aksi harus objek'];
  const o = a as Record<string, unknown>;
  if (!aksiDikenal(o.jenis)) return [`jenis aksi "${String(o.jenis)}" tidak dikenal (tersedia: ${ID_AKSI.join(', ')})`];
  const umum = [...(angka(o.mulai) && (o.mulai as number) >= 0 ? [] : ['mulai harus angka ≥ 0 (detik)']), ...(angka(o.durasi) && (o.durasi as number) > 0 ? [] : ['durasi harus angka > 0 (detik)'])];
  return [...umum, ...REGISTRI_AKSI[o.jenis].validasi(o)];
}

/** Keadaan dasar tokoh pada detik t: field tokoh + event `urutan` (yang asli) dengan pada ≤ t. */
export function keadaanDasarPada(tokoh: TokohAdegan, t: number): KeadaanDasar {
  const k: KeadaanDasar = { pose: tokoh.pose ?? 'diam', ekspresi: tokoh.ekspresi ?? 'netral', lihat: tokoh.lihat ?? 'depan', hadap: tokoh.hadap ?? 'kanan' };
  for (const u of [...(tokoh.urutan ?? [])].sort((a, b) => a.pada - b.pada)) {
    if (u.pada > t) break;
    if (u.pose && (POSE as readonly string[]).includes(u.pose)) k.pose = u.pose;
    if (u.ekspresi) k.ekspresi = u.ekspresi;
    if (u.lihat) k.lihat = u.lihat;
    if (u.hadap) k.hadap = u.hadap;
  }
  return k;
}
