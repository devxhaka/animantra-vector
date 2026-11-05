// Geometri & timeline benda untuk aksi open-object — MURNI & DETERMINISTIK.
// SATU sumber untuk: gambar benda (Benda.tsx) dan target tangan (terapkan.ts), sehingga tangan
// selalu tepat di tepi panel yang sedang dibuka.
//
// Model: benda = dua bagian dengan engsel di `posisi.x`. Saat tertutup, panel menutupi bagian yang JAUH
// dari tokoh. Membuka = panel berputar 0→180° melewati engsel ke arah tokoh. `posisi` = pusat benda terbuka.
import type { AksiOpenObject, BendaAksi } from '../../../shared/tipe';

/** Ukuran benda TERBUKA, relatif lebar kanvas (lebar & tinggi), sebelum dikali `skala`. */
export const UKURAN_BENDA: Record<BendaAksi, { w: number; h: number }> = {
  buku: { w: 0.2, h: 0.13 },
  map: { w: 0.22, h: 0.15 },
  dokumen: { w: 0.17, h: 0.2 },
};

/** Fase (porsi durasi aksi): jangkau → sentuh → buka (tangan mengikuti tepi panel) → lepas. */
export const FASE_BUKA = { sentuh: 0.35, buka: 0.45, lepas: 0.85 } as const;

export type Kanvas = { lebar: number; tinggi: number };
export type BentukBenda = {
  /** x engsel (px kanvas) = pusat benda terbuka */
  engselX: number;
  /** y pusat (px) */
  cy: number;
  /** lebar satu bagian (px) = setengah lebar benda terbuka */
  setengah: number;
  tinggi: number;
  /** +1 = bagian tertutup ada di kanan engsel (tokoh di kiri benda), −1 sebaliknya */
  arah: 1 | -1;
};

const halus = (x: number) => {
  const t = Math.min(1, Math.max(0, x));
  return t * t * (3 - 2 * t);
};

export function bentukBenda(a: AksiOpenObject, kanvas: Kanvas, tokohX: number): BentukBenda {
  const u = UKURAN_BENDA[a.benda];
  const skala = a.skala ?? 1;
  return {
    engselX: a.posisi.x * kanvas.lebar,
    cy: a.posisi.y * kanvas.tinggi,
    setengah: (u.w * kanvas.lebar * skala) / 2,
    tinggi: u.h * kanvas.lebar * skala,
    arah: a.posisi.x >= tokohX ? 1 : -1,
  };
}

/** Progres aksi pada detik t (tidak di-clamp). */
const progres = (a: AksiOpenObject, t: number) => (t - a.mulai) / Math.max(1e-6, a.durasi);

/** Sudut panel (derajat, 0 = tertutup, 180 = terbuka penuh) pada detik t relatif adegan. */
export function sudutBuka(a: AksiOpenObject, t: number): number {
  const p = progres(a, t);
  if (p <= FASE_BUKA.buka) return 0;
  if (p <= FASE_BUKA.lepas) return 180 * halus((p - FASE_BUKA.buka) / (FASE_BUKA.lepas - FASE_BUKA.buka));
  if (a.tetapTerbuka !== false) return 180;
  // tetapTerbuka:false → menutup kembali selama fase lepas
  return p >= 1 ? 0 : 180 * (1 - halus((p - FASE_BUKA.lepas) / (1 - FASE_BUKA.lepas)));
}

/** Titik tengah tepi bebas panel (px kanvas) untuk sudut tertentu (proyeksi 2D: cos). */
export function tepiPanel(b: BentukBenda, sudut: number): { x: number; y: number } {
  return { x: b.engselX + b.arah * b.setengah * Math.cos((sudut * Math.PI) / 180), y: b.cy };
}

/**
 * Target tangan (px kanvas) & bobot kendali lengan (0 = pose dasar, 1 = sepenuhnya ke target) pada detik t.
 * Jangkau: bobot naik halus ke tepi panel tertutup · sentuh: diam di tepi · buka: mengikuti tepi panel ·
 * lepas: bobot turun halus. Di luar rentang aksi bobot 0.
 */
export function targetTangan(a: AksiOpenObject, b: BentukBenda, t: number): { titik: { x: number; y: number }; bobot: number } {
  const p = progres(a, t);
  if (p <= 0 || p >= 1) return { titik: tepiPanel(b, 0), bobot: 0 };
  if (p < FASE_BUKA.sentuh) return { titik: tepiPanel(b, 0), bobot: halus(p / FASE_BUKA.sentuh) };
  if (p < FASE_BUKA.buka) return { titik: tepiPanel(b, 0), bobot: 1 };
  if (p < FASE_BUKA.lepas) return { titik: tepiPanel(b, sudutBuka(a, t)), bobot: 1 };
  const akhir = tepiPanel(b, 180);
  return { titik: akhir, bobot: 1 - halus((p - FASE_BUKA.lepas) / (1 - FASE_BUKA.lepas)) };
}
