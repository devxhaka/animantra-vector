// Menerapkan aksi khusus yang aktif ke StatusTokoh — MURNI & DETERMINISTIK.
// Input: status dasar (dari mesin pose lama) + daftar aksi aktif (dari resolver) di detik yang sama.
// Output: status baru (objek baru; input tidak dimutasi). Tanpa aksi aktif → objek status yang sama.
import { EKSPRESI, type AksiTurnHead, type Lihat } from '../../../shared/tipe';
import { LIHAT, PARAM_EKSPRESI, PUTAR_DASAR, campurEkspresi, type StatusTokoh } from '../Tokoh';
import type { AksiAktif } from './resolver';

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

export type KonteksTerapkan = { hadap: 'kiri' | 'kanan' };

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
    // flashlight-sweep (2C) & open-object (2D) belum diterapkan di sini; resolver tetap merutekannya ke fallback.
  }
  return hasil;
}
