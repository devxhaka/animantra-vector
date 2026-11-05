// Menerapkan aksi khusus yang aktif ke StatusTokoh — MURNI & DETERMINISTIK.
// Input: status dasar (dari mesin pose lama) + daftar aksi aktif (dari resolver) di detik yang sama.
// Output: status baru (objek baru; input tidak dimutasi). Tanpa aksi aktif → objek status yang sama.
import { EKSPRESI, type AksiFlashlightSweep, type AksiTurnHead, type ArahAksi, type Karakter, type Lihat } from '../../../shared/tipe';
import { LIHAT, PARAM_EKSPRESI, PUTAR_DASAR, ayunJalan, campurEkspresi, geometriRig, sudutLenganDasar, type GeometriRig, type StatusTokoh, type SvgInline } from '../Tokoh';
import type { AksiAktif } from './resolver';
import { bidikTitik, arahkanLengan, bungkus, layarKeLokal, type Penempatan, type Sisi } from './ik';

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** Besar putaran maksimum ke samping (1 = fitur wajah ke tepi aman kepala). */
export const PUTAR_MAKS = 0.95;

/**
 * Arah layar turn-head → nilai putarKepala lokal.
 * Tokoh menghadap kanan: layar kanan = lokal +x. Tokoh menghadap kiri dicerminkan, jadi tandanya dibalik.
 */
export function targetPutar(arah: AksiTurnHead['arah'], hadap: 'kiri' | 'kanan'): number {
  if (arah === 'tengah') return 0;
  const layarKanan = arah === 'kanan' ? 1 : -1;
  return PUTAR_MAKS * layarKanan * (hadap === 'kanan' ? 1 : -1);
}

/** Vektor arah mata lokal: dari field `lihat` aksi, atau mengikuti arah wajah. */
function lihatTurnHead(a: AksiTurnHead, target: number): [number, number] {
  if (a.lihat) return LIHAT[a.lihat as Lihat];
  return [Math.sign(target) * Math.min(1, Math.abs(target) * 1.05), 0];
}

export type KonteksTerapkan = {
  hadap: 'kiri' | 'kanan';
  /** wajib untuk aksi lengan (flashlight-sweep); turn-head cukup `hadap` */
  karakter?: Karakter;
  penempatan?: Penempatan;
  /** SVG aset kustom yang berhasil dimuat (undefined = pakai gambar bawaan) */
  gambar?: (aset: string) => SvgInline | undefined;
};

// ---------------- flashlight-sweep ----------------
const halus = (x: number) => {
  const t = Math.min(1, Math.max(0, x));
  return t * t * (3 - 2 * t);
};
/** Sudut dunia lengan bawah untuk arah layar (lokal, sudah memperhitungkan cermin hadap). */
export function sudutArahLayar(arah: Exclude<ArahAksi, { x: number; y: number }>, hadap: 'kiri' | 'kanan'): number {
  if (arah === 'atas') return -170; // ke atas, sedikit ke depan
  if (arah === 'bawah') return -25; // ke bawah, sedikit ke depan
  const layarKanan = arah === 'kanan';
  const keDepan = hadap === 'kanan' ? layarKanan : !layarKanan;
  return keDepan ? -90 : 90; // depan lokal = −90°, belakang lokal = +90°
}
/** Sudut lengan bawah (dunia) untuk satu ujung sapuan. */
function sudutUjung(arah: ArahAksi, geo: GeometriRig, sisi: Sisi, ctx: Required<Pick<KonteksTerapkan, 'penempatan'>>, badanMiring: number, ayun: number) {
  if (typeof arah === 'string') return sudutArahLayar(arah, ctx.penempatan.hadap);
  return bidikTitik(geo, sisi, layarKeLokal(arah, ctx.penempatan), badanMiring, ayun).sudutBawah;
}
/** Selisih sudut untuk sapuan: jalur terpendek; tepat 180° (depan↔belakang) lewat ATAS. */
export function selisihSapu(dari: number, ke: number) {
  const d = bungkus(ke - dari);
  if (Math.abs(Math.abs(d) - 180) < 1e-6) return dari < 0 ? -180 : 180;
  return d;
}
/** Porsi waktu aksi yang dipakai menyapu (sisanya: angkat di awal, tahan di akhir). */
export const SAPU = { mulai: 0.15, selesai: 0.85 };

function terapkanSenter(s: StatusTokoh, a: AksiAktif & { aksi: AksiFlashlightSweep }, ctx: KonteksTerapkan): StatusTokoh {
  if (!ctx.karakter || !ctx.penempatan) return s; // tanpa data penempatan tidak bisa membidik (tidak terjadi di renderer)
  const sisi: Sisi = a.aksi.tangan === 'bel' ? 'bel' : 'dep';
  if (!a.bagian.includes(sisi === 'dep' ? 'lengan-dep' : 'lengan-bel')) return s;
  const geo = geometriRig(ctx.karakter);
  const badanMiring = s.pose.badan;
  const ayun = ayunJalan(s);
  const p = { penempatan: ctx.penempatan };
  const awal = sudutUjung(a.aksi.dari, geo, sisi, p, badanMiring, ayun);
  const akhir = sudutUjung(a.aksi.ke, geo, sisi, p, badanMiring, ayun);
  const q = halus((a.progres - SAPU.mulai) / (SAPU.selesai - SAPU.mulai));
  const sudutBawah = awal + selisihSapu(awal, akhir) * q;
  const target = arahkanLengan(sisi, sudutBawah, badanMiring);
  const dasar = sudutLenganDasar(s)[sisi];
  const m = a.amplop;
  const sudut: [number, number] = [dasar[0] + bungkus(target[0] - dasar[0]) * m, dasar[1] + bungkus(target[1] - dasar[1]) * m];
  const gambar = a.aksi.aset && !a.pakaiGambarBawaan ? ctx.gambar?.(a.aksi.aset) : undefined;
  return {
    ...s,
    lengan: { ...s.lengan, [sisi]: sudut },
    pegang: { ...s.pegang, [sisi]: { jenis: 'senter', sinar: a.aksi.sinar === false ? 0 : m, ...(gambar ? { svg: gambar } : {}) } },
  };
}

export function terapkanAksi(s: StatusTokoh, aktif: readonly AksiAktif[], ctx: KonteksTerapkan): StatusTokoh {
  if (!aktif.length) return s;
  let hasil: StatusTokoh = s;
  for (const a of aktif) {
    if (a.aksi.jenis === 'turn-head' && a.bagian.includes('kepala')) {
      const t = targetPutar(a.aksi.arah, ctx.hadap);
      const m = a.amplop;
      const lihat = lihatTurnHead(a.aksi, t);
      hasil = {
        ...hasil,
        putarKepala: lerp(PUTAR_DASAR, t, m),
        lihat: [lerp(hasil.lihat[0], lihat[0], m), lerp(hasil.lihat[1], lihat[1], m)],
        ekspresi:
          a.aksi.ekspresi && (EKSPRESI as readonly string[]).includes(a.aksi.ekspresi)
            ? campurEkspresi(hasil.ekspresi, PARAM_EKSPRESI[a.aksi.ekspresi], m)
            : hasil.ekspresi,
      };
    }
    if (a.aksi.jenis === 'flashlight-sweep' && a.amplop > 0) hasil = terapkanSenter(hasil, a as AksiAktif & { aksi: AksiFlashlightSweep }, ctx);
    // open-object (2D) belum diterapkan di sini; resolver tetap merutekannya ke fallback.
  }
  return hasil;
}
