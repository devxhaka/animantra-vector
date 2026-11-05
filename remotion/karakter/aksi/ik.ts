// Kinematika lengan dua sendi (bahu–siku) untuk rig tokoh — MURNI & DETERMINISTIK.
// Meniru rantai transform di Tokoh.tsx persis:
//   translate(0,−ayun) → [rotate(badanMiring) di (0,pinggulY): HANYA lengan depan]
//   → translate(bahuX, sendiBahuY) rotate(a0) → translate(0,L1) rotate(a1) → tangan di (0, jarakTangan)
// Konvensi sudut SVG: rotate(θ) memetakan (0,1) → (−sinθ, cosθ). 0° = tergantung, −90° = ke depan (+x lokal).
import { VIEWBOX, type GeometriRig } from '../Tokoh';

export type Sisi = 'dep' | 'bel';
export type Titik = { x: number; y: number };
/** Penempatan tokoh di layar (sama dengan perhitungan di cerita.tsx). */
export type Penempatan = { x: number; y: number; skala: number; lebarLayar: number; tinggiLayar: number; hadap: 'kiri' | 'kanan' };

const DEG = Math.PI / 180;
export const arahSudut = (sudut: number): Titik => ({ x: -Math.sin(sudut * DEG), y: Math.cos(sudut * DEG) });
/** Kebalikan arahSudut: sudut (derajat) yang mengarah ke vektor (dx, dy). */
export const sudutArah = (dx: number, dy: number) => Math.atan2(-dx, dy) / DEG;
/** Bungkus sudut ke (−180, 180]. */
export const bungkus = (a: number) => {
  let x = ((a + 180) % 360 + 360) % 360 - 180;
  if (x === -180) x = 180;
  return x;
};
const putar = (p: Titik, pusat: Titik, sudut: number): Titik => {
  const c = Math.cos(sudut * DEG), s = Math.sin(sudut * DEG);
  const dx = p.x - pusat.x, dy = p.y - pusat.y;
  return { x: pusat.x + dx * c - dy * s, y: pusat.y + dx * s + dy * c };
};

/** Sendi bahu di koordinat lokal tokoh. Lengan depan ikut condong badan; lengan belakang tidak. */
export function posisiBahu(geo: GeometriRig, sisi: Sisi, badanMiring: number, ayun: number): Titik {
  let p = { x: sisi === 'dep' ? geo.bahuDep : geo.bahuBel, y: geo.sendiBahuY };
  if (sisi === 'dep') p = putar(p, { x: 0, y: geo.pinggulY }, badanMiring);
  return { x: p.x, y: p.y - ayun };
}
const sudutDuniaAtas = (sisi: Sisi, a0: number, badanMiring: number) => a0 + (sisi === 'dep' ? badanMiring : 0);

/** Forward kinematics: siku, pusat tangan, dan sudut dunia lengan bawah. */
export function fkTangan(geo: GeometriRig, sisi: Sisi, sudut: readonly [number, number], badanMiring: number, ayun: number) {
  const bahu = posisiBahu(geo, sisi, badanMiring, ayun);
  const atas = sudutDuniaAtas(sisi, sudut[0], badanMiring);
  const bawah = atas + sudut[1];
  const da = arahSudut(atas), db = arahSudut(bawah);
  const siku = { x: bahu.x + geo.L1 * da.x, y: bahu.y + geo.L1 * da.y };
  const tangan = { x: siku.x + geo.jarakTangan * db.x, y: siku.y + geo.jarakTangan * db.y };
  return { bahu, siku, tangan, sudutBawah: bawah };
}

/** Titik layar (0..1) → koordinat lokal tokoh (memperhitungkan posisi, skala, kanvas, cermin hadap). */
export function layarKeLokal(t: Titik, p: Penempatan): Titik {
  const lebarPx = p.lebarLayar * 0.62 * p.skala;
  const unit = VIEWBOX.w / lebarPx;
  const x = (t.x - p.x) * p.lebarLayar * unit;
  const y = (t.y - p.y) * p.tinggiLayar * unit;
  return { x: p.hadap === 'kiri' ? -x : x, y };
}
export function lokalKeLayar(l: Titik, p: Penempatan): Titik {
  const lebarPx = p.lebarLayar * 0.62 * p.skala;
  const px = (p.hadap === 'kiri' ? -l.x : l.x) * (lebarPx / VIEWBOX.w);
  const py = l.y * (lebarPx / VIEWBOX.w);
  return { x: p.x + px / p.lebarLayar, y: p.y + py / p.tinggiLayar };
}

/**
 * IK analitik dua sendi. Target di luar jangkauan di-CLAMP ke jangkauan aman (lengan lurus ke arah target),
 * terlalu dekat di-clamp ke jarak minimum. Siku selalu dibengkokkan ke bawah (y lebih besar).
 */
export function ikDuaSendi(geo: GeometriRig, sisi: Sisi, target: Titik, badanMiring: number, ayun: number) {
  const bahu = posisiBahu(geo, sisi, badanMiring, ayun);
  const L1 = geo.L1, L2 = geo.jarakTangan;
  const min = Math.abs(L1 - L2) + 1, max = L1 + L2 - 1;
  const dx0 = target.x - bahu.x, dy0 = target.y - bahu.y;
  const jarak = Math.hypot(dx0, dy0);
  const terjangkau = jarak >= min && jarak <= max;
  const dc = Math.min(max, Math.max(min, jarak));
  const alfa = jarak < 1e-9 ? -90 : sudutArah(dx0, dy0);
  const ux = jarak < 1e-9 ? 1 : dx0 / jarak, uy = jarak < 1e-9 ? 0 : dy0 / jarak;
  const titikTarget = { x: bahu.x + ux * dc, y: bahu.y + uy * dc };
  const beta = Math.acos(Math.min(1, Math.max(-1, (L1 * L1 + dc * dc - L2 * L2) / (2 * L1 * dc)))) / DEG;
  // dua kemungkinan siku; pilih yang lebih rendah (y lebih besar)
  const calon = [alfa + beta, alfa - beta].map((atas) => {
    const d = arahSudut(atas);
    return { atas, siku: { x: bahu.x + L1 * d.x, y: bahu.y + L1 * d.y } };
  });
  const pilih = calon[0].siku.y >= calon[1].siku.y ? calon[0] : calon[1];
  const bawah = sudutArah(titikTarget.x - pilih.siku.x, titikTarget.y - pilih.siku.y);
  const a0 = bungkus(pilih.atas - (sisi === 'dep' ? badanMiring : 0));
  const a1 = bungkus(bawah - pilih.atas);
  return { sudut: [a0, a1] as [number, number], terjangkau, tangan: titikTarget };
}

/** Siku tetap menekuk sedikit saat membidik (derajat, negatif = menekuk ke depan). */
export const TEKUK_BIDIK = -18;

/** Arahkan lengan bawah TEPAT ke sudut dunia tertentu; lengan atas 18° lebih rendah. */
export function arahkanLengan(sisi: Sisi, sudutBawahDunia: number, badanMiring: number): [number, number] {
  const atas = sudutBawahDunia - TEKUK_BIDIK;
  return [bungkus(atas - (sisi === 'dep' ? badanMiring : 0)), TEKUK_BIDIK];
}

/**
 * Bidik titik lokal: cari sudut lengan bawah θ sehingga arah dari TANGAN ke target = θ
 * (senter/sinar benar-benar menunjuk target). Pemindaian 1° di sekitar arah bahu→target, lalu
 * bisection 40 langkah: deterministik, tanpa iterasi yang bisa berayun.
 * Bila tidak ada solusi (target di dalam jangkauan tangan), pakai arah bahu→target (`tepat: false`).
 */
export function bidikTitik(geo: GeometriRig, sisi: Sisi, target: Titik, badanMiring: number, ayun: number) {
  const bahu = posisiBahu(geo, sisi, badanMiring, ayun);
  const dasar = sudutArah(target.x - bahu.x, target.y - bahu.y);
  const galat = (theta: number) => {
    const { tangan } = fkTangan(geo, sisi, arahkanLengan(sisi, theta, badanMiring), badanMiring, ayun);
    return bungkus(sudutArah(target.x - tangan.x, target.y - tangan.y) - theta);
  };
  // pemindaian: akar terdekat ke arah bahu→target
  let terbaik: { lo: number; hi: number } | null = null;
  for (let d = 0; d <= 90 && !terbaik; d += 1)
    for (const arah of d === 0 ? [1] : [1, -1]) {
      const lo = dasar + arah * d, hi = lo + arah;
      const gLo = galat(lo), gHi = galat(hi);
      // tanda berganti & bukan lompatan bungkus ±180
      if (gLo === 0 || (Math.sign(gLo) !== Math.sign(gHi) && Math.abs(gLo - gHi) < 90)) {
        terbaik = { lo, hi };
        break;
      }
    }
  if (!terbaik) return { sudut: arahkanLengan(sisi, dasar, badanMiring), sudutBawah: bungkus(dasar), tepat: false };
  let { lo, hi } = terbaik;
  let gLo = galat(lo);
  for (let i = 0; i < 40; i++) {
    const mid = (lo + hi) / 2;
    const gMid = galat(mid);
    if (gMid === 0) {
      lo = hi = mid;
      break;
    }
    if (Math.sign(gMid) === Math.sign(gLo)) {
      lo = mid;
      gLo = gMid;
    } else hi = mid;
  }
  const theta = (lo + hi) / 2;
  return { sudut: arahkanLengan(sisi, theta, badanMiring), sudutBawah: bungkus(theta), tepat: true };
}
