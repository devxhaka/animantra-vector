// Resolver timeline aksi khusus — MURNI & DETERMINISTIK.
// - Tidak memakai waktu nyata, timer, acak, atau state global yang berubah.
// - Peringatan dikembalikan sebagai DATA (tidak di-log di sini); deduplikasi & tampilan dilakukan
//   oleh lapisan validasi/CLI (`studio cek`, render).
// - Satuan waktu: DETIK relatif awal adegan (sama dengan spec). Konversi frame→detik dilakukan pemanggil.
//
// Alur:
//   rencanakanAksi(tokoh, opsi)  → keputusan statis per aksi (khusus / fallback / diabaikan),
//                                  event `urutan` sintetis untuk fallback, dan peringatan.
//   aksiAktifPada(rencana, t)    → aksi khusus yang aktif di detik t + progres & amplop + kepemilikan
//                                  bagian tubuh (aksi yang mulai belakangan menang).
import type { AksiTokoh, Karakter, ModeAnimasi, TokohAdegan } from '../../../shared/tipe';
import {
  REGISTRI_AKSI,
  aksiDikenal,
  keadaanDasarPada,
  validasiAksi,
  type BagianTubuh,
  type DefinisiAksi,
  type PeringatanAksi,
  type UrutanEvent,
} from '../../../shared/aksi';

export type OpsiRencana = {
  /** Spec.modeAnimasi (bawaan seluruh video). Kosong → 'auto'. */
  modeBawaan?: ModeAnimasi;
  /** durasi adegan (detik), untuk peringatan aksi yang melewati adegan */
  durasiAdegan?: number;
  /** path aset kustom yang tidak ditemukan (diisi oleh CLI/cek, karena Remotion tidak bisa cek file) */
  asetHilang?: readonly string[];
  /** data tokoh (untuk cek kecocokan rig) */
  karakter?: Karakter;
  /** khusus tes: timpa registri (mis. menandai aksi `tersedia`) */
  registri?: Partial<Record<string, DefinisiAksi>>;
};

export type AksiTerencana = {
  indeks: number;
  aksi: AksiTokoh; // sudah dinormalisasi (nilai bawaan terisi)
  bagian: BagianTubuh[];
  mulai: number;
  selesai: number;
  tahan: boolean; // tetap memegang bagian tubuh setelah selesai
  /** aset kustom diminta tetapi hilang → renderer memakai gambar bawaan */
  pakaiGambarBawaan: boolean;
};

export type RencanaAksi = {
  mode: ModeAnimasi;
  khusus: AksiTerencana[];
  /** event `urutan` sintetis dari aksi yang dijalankan sebagai pose lama */
  urutanFallback: UrutanEvent[];
  peringatan: PeringatanAksi[];
};

export type FaseAksi = 'masuk' | 'tahan' | 'keluar' | 'ditahan';
export type AksiAktif = {
  indeks: number;
  aksi: AksiTokoh;
  /** bagian tubuh yang BENAR-BENAR dipegang aksi ini di detik t (setelah resolusi tumpang tindih) */
  bagian: BagianTubuh[];
  /** 0..1 linear sepanjang [mulai, mulai+durasi], tetap 1 setelahnya bila ditahan */
  progres: number;
  /** 0..1 bobot campuran terhadap pose dasar (naik saat masuk, turun saat keluar) */
  amplop: number;
  fase: FaseAksi;
  pakaiGambarBawaan: boolean;
};

const RENCANA_KOSONG = (mode: ModeAnimasi): RencanaAksi => ({ mode, khusus: [], urutanFallback: [], peringatan: [] });

/** Durasi transisi masuk/keluar (detik): maksimal 0,3 dtk atau 25% durasi aksi. */
export const durasiTransisi = (durasi: number) => Math.min(0.3, Math.max(0, durasi) * 0.25);

/** Halus (smoothstep) — deterministik, tanpa dependensi Remotion agar bisa diuji di Node. */
const halus = (x: number) => {
  const t = Math.min(1, Math.max(0, x));
  return t * t * (3 - 2 * t);
};

export function rencanakanAksi(tokoh: TokohAdegan, opsi: OpsiRencana = {}): RencanaAksi {
  const mode: ModeAnimasi = tokoh.modeAnimasi ?? opsi.modeBawaan ?? 'auto';
  const daftar = tokoh.aksi;
  if (!daftar?.length) return RENCANA_KOSONG(mode); // tanpa aksi: perilaku lama, tanpa peringatan
  const reg = { ...REGISTRI_AKSI, ...(opsi.registri ?? {}) } as Record<string, DefinisiAksi>;
  const hilang = new Set(opsi.asetHilang ?? []);
  const hasil = RENCANA_KOSONG(mode);
  const x = tokoh.x;
  const y = tokoh.y ?? 0.8;

  daftar.forEach((mentah, indeks) => {
    const jenis = (mentah as { jenis?: unknown })?.jenis;
    if (!aksiDikenal(jenis)) {
      hasil.peringatan.push({ kode: 'tidak-dikenal', tingkat: 'masalah', indeks, jenis: String(jenis), pesan: `aksi "${String(jenis)}" tidak dikenal → diabaikan` });
      return;
    }
    const salah = validasiAksi(mentah);
    if (salah.length) {
      hasil.peringatan.push({ kode: 'parameter-invalid', tingkat: 'masalah', indeks, jenis, pesan: `${jenis}: ${salah.join('; ')} → diabaikan` });
      return;
    }
    const def = reg[jenis]!;
    const aksi = def.normalisasi(mentah);
    const mulai = aksi.mulai;
    const selesai = aksi.mulai + aksi.durasi;
    if (aksi.durasi < def.durasiMin)
      hasil.peringatan.push({ kode: 'terlalu-singkat', tingkat: 'peringatan', indeks, jenis, pesan: `${jenis}: durasi ${aksi.durasi} dtk < minimum ${def.durasiMin} dtk; gerak mungkin tidak terbaca` });
    if (opsi.durasiAdegan !== undefined && selesai > opsi.durasiAdegan + 1e-6)
      hasil.peringatan.push({ kode: 'melewati-adegan', tingkat: 'peringatan', indeks, jenis, pesan: `${jenis}: berakhir di ${selesai.toFixed(2)} dtk, setelah adegan selesai (${opsi.durasiAdegan.toFixed(2)} dtk); sisanya terpotong` });

    // ---- routing ----
    let alasanFallback: { kode: PeringatanAksi['kode']; teks: string } | null = null;
    if (mode === 'existing') alasanFallback = { kode: 'disederhanakan', teks: 'mode existing' };
    else if (!def.tersedia) alasanFallback = { kode: 'belum-tersedia', teks: 'implementasi khusus belum tersedia' };
    else {
      const rig = def.cocokRig(opsi.karakter);
      if (rig) alasanFallback = { kode: 'rig-tidak-cocok', teks: rig };
    }

    const asetKustom = 'aset' in aksi ? aksi.aset : undefined;
    const asetHilang = !!asetKustom && hilang.has(asetKustom);

    if (alasanFallback) {
      const ctx = { awal: keadaanDasarPada(tokoh, mulai), akhir: keadaanDasarPada(tokoh, selesai), x, y };
      const fb = def.fallback(aksi, ctx);
      hasil.urutanFallback.push(...fb.urutan);
      // penyesuaian B: jujur soal apa yang tidak tampil
      hasil.peringatan.push({
        kode: alasanFallback.kode,
        tingkat: mode === 'existing' ? 'info' : 'peringatan',
        indeks,
        jenis,
        pesan: `${jenis} disederhanakan ke pose lama (${alasanFallback.teks}): ${fb.keterangan}`,
      });
      return;
    }
    if (asetHilang) {
      if (!def.punyaGambarBawaan) {
        const ctx = { awal: keadaanDasarPada(tokoh, mulai), akhir: keadaanDasarPada(tokoh, selesai), x, y };
        const fb = def.fallback(aksi, ctx);
        hasil.urutanFallback.push(...fb.urutan);
        hasil.peringatan.push({ kode: 'aset-hilang', tingkat: 'peringatan', indeks, jenis, pesan: `${jenis}: aset "${asetKustom}" tidak ditemukan dan tidak ada gambar bawaan → pose lama: ${fb.keterangan}` });
        return;
      }
      hasil.peringatan.push({ kode: 'aset-hilang', tingkat: 'peringatan', indeks, jenis, pesan: `${jenis}: aset "${asetKustom}" tidak ditemukan → memakai gambar bawaan` });
    }
    hasil.khusus.push({ indeks, aksi, bagian: def.bagian(aksi), mulai, selesai, tahan: def.tahan(aksi), pakaiGambarBawaan: asetHilang || !asetKustom });
  });

  hasil.urutanFallback.sort((a, b) => a.pada - b.pada);

  // ---- konflik bagian tubuh (dilaporkan sekali, statis) ----
  const k = hasil.khusus;
  for (let i = 0; i < k.length; i++)
    for (let j = i + 1; j < k.length; j++) {
      const a = k[i], b = k[j];
      const sama = a.bagian.filter((x) => b.bagian.includes(x));
      if (!sama.length) continue;
      const akhirA = a.tahan ? Infinity : a.selesai;
      const akhirB = b.tahan ? Infinity : b.selesai;
      if (a.mulai < akhirB && b.mulai < akhirA) {
        const pemenang = urutanMenang(a, b) > 0 ? a : b;
        const kalah = pemenang === a ? b : a;
        hasil.peringatan.push({
          kode: 'tumpang-tindih',
          tingkat: 'peringatan',
          indeks: kalah.indeks,
          jenis: kalah.aksi.jenis,
          pesan: `aksi #${a.indeks} (${a.aksi.jenis}) dan #${b.indeks} (${b.aksi.jenis}) sama-sama memakai ${sama.join(', ')}; selama tumpang tindih #${pemenang.indeks} yang mulai belakangan yang dipakai`,
        });
      }
    }
  return hasil;
}

/** >0 bila a menang atas b: mulai belakangan menang; seri → indeks lebih besar menang. */
const urutanMenang = (a: AksiTerencana, b: AksiTerencana) => (a.mulai !== b.mulai ? a.mulai - b.mulai : a.indeks - b.indeks);

/** Progres, amplop, dan fase satu aksi pada detik t (null bila tidak aktif). */
export function evaluasiAksi(r: AksiTerencana, t: number): { progres: number; amplop: number; fase: FaseAksi } | null {
  if (t < r.mulai) return null;
  const durasi = r.selesai - r.mulai;
  const tr = durasiTransisi(durasi);
  if (t > r.selesai) return r.tahan ? { progres: 1, amplop: 1, fase: 'ditahan' } : null;
  const progres = durasi > 0 ? (t - r.mulai) / durasi : 1;
  if (tr > 0 && t < r.mulai + tr) return { progres, amplop: halus((t - r.mulai) / tr), fase: 'masuk' };
  if (!r.tahan && tr > 0 && t > r.selesai - tr) return { progres, amplop: halus((r.selesai - t) / tr), fase: 'keluar' };
  return { progres, amplop: 1, fase: 'tahan' };
}

/** Aksi khusus yang aktif di detik t, dengan kepemilikan bagian tubuh sudah diselesaikan. */
export function aksiAktifPada(rencana: RencanaAksi, t: number): AksiAktif[] {
  const calon = rencana.khusus
    .map((r) => ({ r, e: evaluasiAksi(r, t) }))
    .filter((c): c is { r: AksiTerencana; e: NonNullable<ReturnType<typeof evaluasiAksi>> } => !!c.e);
  if (!calon.length) return [];
  // pemilik tiap bagian: aksi yang mulai paling belakangan
  const pemilik = new Map<BagianTubuh, AksiTerencana>();
  for (const { r } of calon)
    for (const b of r.bagian) {
      const lama = pemilik.get(b);
      if (!lama || urutanMenang(r, lama) > 0) pemilik.set(b, r);
    }
  const hasil: AksiAktif[] = [];
  for (const { r, e } of calon) {
    const bagian = r.bagian.filter((b) => pemilik.get(b) === r);
    if (!bagian.length) continue;
    hasil.push({ indeks: r.indeks, aksi: r.aksi, bagian, progres: e.progres, amplop: e.amplop, fase: e.fase, pakaiGambarBawaan: r.pakaiGambarBawaan });
  }
  return hasil.sort((a, b) => a.indeks - b.indeks);
}

/** Tokoh dengan event `urutan` fallback digabungkan (dipakai mesin pose lama apa adanya). */
export function gabungUrutanFallback(tokoh: TokohAdegan, rencana: RencanaAksi): TokohAdegan {
  if (!rencana.urutanFallback.length) return tokoh;
  return { ...tokoh, urutan: [...(tokoh.urutan ?? []), ...rencana.urutanFallback].sort((a, b) => a.pada - b.pada) };
}

/** Deduplikasi peringatan (dipakai lapisan CLI/validasi, BUKAN di jalur render). */
export function dedupPeringatan(daftar: readonly PeringatanAksi[]): PeringatanAksi[] {
  const lihat = new Set<string>();
  return daftar.filter((p) => {
    const k = `${p.kode}|${p.indeks ?? ''}|${p.pesan}`;
    if (lihat.has(k)) return false;
    lihat.add(k);
    return true;
  });
}
