// Kerumunan (Phase D): banyak figur sederhana bergaya sama dengan tokoh, dalam satu <svg>.
// Semua acak memakai benih tetap (mulberry32) dan semua gerak dihitung dari t → deterministik.
import React from 'react';
import { useCurrentFrame, useVideoConfig } from 'remotion';
import type { Kerumunan } from '../shared/tipe';

const GARIS = '#1d1d1f';
const PALET_BAWAAN = ['#7a4b3a', '#5b6b4a', '#8a7a5a', '#4a5a6b', '#9a5a3a', '#6b4a6b', '#c8b89a', '#3d4a3a', '#a0522d', '#e8e2d0', '#56606e', '#7d6b52'];
const KULIT = ['#f0cfa8', '#e3b48a', '#d09a6c', '#b67d52', '#93603d'];
const RAMBUT = ['#1d1d1f', '#2e2219', '#4a3626', '#151515'];
const KAIN = ['#ece6d6', '#3d4a6b', '#6b3d4a', '#2a2a2e', '#c8b89a', '#4d6b5a'];

/** PRNG kecil berbenih (mulberry32): hasil sama untuk benih sama, di mesin mana pun. */
export function acak(benih: number) {
  let a = benih >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export type Figur = {
  x: number; // px, posisi kaki
  y: number; // px
  h: number; // tinggi figur px
  hadap: 1 | -1;
  baju: string;
  kulit: string;
  rambut: string;
  kepala: 'rambut' | 'hijab' | 'kopiah';
  kain: string; // warna hijab/kopiah
  panjang: boolean; // pakaian sampai mata kaki
  langkah: number; // fase langkah (radian), NaN = tidak melangkah
  ayunTangan: number; // derajat
  angkatTangan: number; // 0..1 (sorak)
  bob: number; // px naik-turun
  miring: number; // derajat kepala
};

/** Susunan figur pada detik t (murni; dipakai komponen & uji). Urut dari jauh ke dekat. */
export function susunKerumunan(k: Kerumunan, t: number, W: number, H: number): Figur[] {
  const r = acak((k.benih ?? 1) * 7919 + 17);
  const n = Math.max(0, Math.min(200, Math.round(k.jumlah)));
  const [hJauh, hDekat] = k.tinggi ?? [0.07, 0.18];
  const gerak = k.gerak ?? 'gelisah';
  const berjalan = gerak === 'jalan' || gerak === 'lari';
  const arahBawaan = k.arah ?? (berjalan ? 'kanan' : 'acak');
  const palet = k.palet?.length ? k.palet : PALET_BAWAAN;
  const v = (k.kecepatan ?? (gerak === 'lari' ? 0.16 : 0.05)) * W;
  const { x1, x2, y1, y2 } = k.area;
  const out: Figur[] = [];
  for (let i = 0; i < n; i++) {
    // sebaran berlapis (stratified) di sumbu y supaya baris jauh-dekat merata, x acak
    const fy = (i + r()) / n;
    const fx = r();
    const ry = y1 + (y2 - y1) * fy;
    const kedalaman = y2 > y1 ? (ry - y1) / (y2 - y1) : 1;
    const h = (hJauh + (hDekat - hJauh) * kedalaman) * H * (0.9 + r() * 0.2);
    const hadap: 1 | -1 = arahBawaan === 'kanan' ? 1 : arahBawaan === 'kiri' ? -1 : r() < 0.5 ? 1 : -1;
    const fase = r() * Math.PI * 2;
    const pilih = <T,>(a: T[]) => a[Math.floor(r() * a.length) % a.length];
    const u = r();
    const kepala: Figur['kepala'] = u < (k.hijab ?? 0.3) ? 'hijab' : u < (k.hijab ?? 0.3) + (k.kopiah ?? 0.2) ? 'kopiah' : 'rambut';
    const baju = pilih(palet), kulit = pilih(KULIT), rambut = pilih(RAMBUT), kain = pilih(KAIN);
    const panjang = kepala === 'hijab' ? r() < 0.8 : r() < 0.25;
    const vSendiri = v * (0.8 + r() * 0.4) * (h / (hDekat * H)); // yang jauh tampak lebih lambat
    let x = (x1 + (x2 - x1) * fx) * W;
    let langkah = NaN, ayun = 0, angkat = 0, bob = 0, miring = 0;
    const tt = t + fase;
    if (berjalan) {
      // berjalan melingkar di dalam area (+ tepi), masuk lagi dari sisi seberang
      const kiri = (x1 - 0.12) * W, lebar = (x2 - x1 + 0.24) * W;
      x = kiri + ((((x - kiri + hadap * vSendiri * t) % lebar) + lebar) % lebar);
      const frek = gerak === 'lari' ? 11 : 6.5;
      langkah = tt * frek;
      ayun = Math.sin(langkah) * (gerak === 'lari' ? 38 : 22);
      bob = Math.abs(Math.sin(langkah)) * h * (gerak === 'lari' ? 0.035 : 0.018);
    } else if (gerak === 'gelisah') {
      x += Math.sin(tt * 1.3) * h * 0.04;
      ayun = Math.sin(tt * 2.1) * 10;
      miring = Math.sin(tt * 1.7) * 6;
      bob = Math.abs(Math.sin(tt * 1.9)) * h * 0.006;
    } else if (gerak === 'sorak') {
      angkat = 0.75 + 0.25 * Math.sin(tt * 6);
      bob = Math.abs(Math.sin(tt * 5)) * h * 0.03;
    } else {
      bob = Math.sin(tt * 2) * h * 0.004;
    }
    out.push({ x, y: ry * H, h, hadap, baju, kulit, rambut, kepala, kain, panjang, langkah, ayunTangan: ayun, angkatTangan: angkat, bob, miring });
  }
  return out.sort((a, b) => a.y - b.y || a.x - b.x);
}

const gelapkan = (c: string, t = 0.22) => {
  const n = parseInt(c.slice(1), 16);
  if (!/^#[0-9a-f]{6}$/i.test(c)) return c;
  const f = (v: number) => Math.round(v * (1 - t)).toString(16).padStart(2, '0');
  return `#${f((n >> 16) & 255)}${f((n >> 8) & 255)}${f(n & 255)}`;
};

/** Satu figur dalam satuan tinggi 1 (kaki di 0, puncak kepala di −1). */
const FigurView: React.FC<{ f: Figur; siluet?: boolean }> = ({ f, siluet }) => {
  const s = f.h;
  const hitam = '#141519';
  const c = (x: string) => (siluet ? hitam : x);
  const sw = 0.022; // garis tepi (satuan tinggi)
  const langkah = Number.isNaN(f.langkah) ? 0 : Math.sin(f.langkah) * 24;
  const kaki = (sudut: number, x: number, warna: string) => (
    <g transform={`translate(${x} -0.42) rotate(${sudut})`}>
      <line x1={0} y1={0} x2={0} y2={0.39} stroke={GARIS} strokeWidth={0.075 + sw * 2} strokeLinecap="round" />
      <line x1={0} y1={0} x2={0} y2={0.39} stroke={warna} strokeWidth={0.075} strokeLinecap="round" />
    </g>
  );
  const lengan = (sudut: number, x: number, warna: string) => (
    <g transform={`translate(${x} -0.72) rotate(${sudut})`}>
      <line x1={0} y1={0} x2={0} y2={0.3} stroke={GARIS} strokeWidth={0.06 + sw * 2} strokeLinecap="round" />
      <line x1={0} y1={0} x2={0} y2={0.3} stroke={warna} strokeWidth={0.06} strokeLinecap="round" />
      <circle cx={0} cy={0.31} r={0.035} fill={c(f.kulit)} stroke={GARIS} strokeWidth={sw * 0.8} />
    </g>
  );
  const naik = f.angkatTangan * 165; // sorak: lengan terangkat ke atas
  const bawah = f.panjang ? -0.04 : -0.36;
  const wajah = !siluet && s > 90;
  return (
    <g transform={`translate(${f.x} ${f.y - f.bob}) scale(${s * f.hadap} ${s})`}>
      <ellipse cx={0} cy={0.005} rx={0.16} ry={0.025} fill="#000" fillOpacity={0.12} />
      {kaki(-langkah, -0.04, c(gelapkan(f.baju, 0.35)))}
      {lengan(-f.ayunTangan + naik, -0.1, c(gelapkan(f.baju, 0.15)))}
      {kaki(langkah, 0.05, c(gelapkan(f.baju, 0.3)))}
      {/* badan */}
      <path
        d={`M -0.13 -0.68 Q -0.13 -0.77 -0.05 -0.77 L 0.06 -0.77 Q 0.13 -0.77 0.13 -0.68 L ${f.panjang ? 0.16 : 0.135} ${bawah} L ${f.panjang ? -0.16 : -0.135} ${bawah} Z`}
        fill={c(f.baju)}
        stroke={GARIS}
        strokeWidth={sw}
        strokeLinejoin="round"
      />
      {/* kepala */}
      <g transform={`rotate(${f.miring} 0 -0.8)`}>
        {f.kepala === 'hijab' ? (
          <path d="M -0.15 -0.86 A 0.15 0.15 0 0 1 0.15 -0.86 L 0.16 -0.7 Q 0 -0.64 -0.16 -0.7 Z" fill={c(f.kain)} stroke={GARIS} strokeWidth={sw} strokeLinejoin="round" />
        ) : null}
        <circle cx={0.01} cy={-0.88} r={f.kepala === 'hijab' ? 0.085 : 0.11} fill={c(f.kulit)} stroke={GARIS} strokeWidth={sw} />
        {f.kepala === 'rambut' ? <path d="M -0.105 -0.86 A 0.115 0.115 0 0 1 0.12 -0.9 Q 0.02 -0.93 -0.105 -0.86 Z" fill={c(f.rambut)} stroke={GARIS} strokeWidth={sw * 0.8} /> : null}
        {f.kepala === 'kopiah' ? <rect x={-0.09} y={-1.0} width={0.2} height={0.08} rx={0.015} fill={c(f.kain === '#ece6d6' ? '#ffffff' : f.kain)} stroke={GARIS} strokeWidth={sw * 0.8} /> : null}
        {wajah ? (
          <g fill={GARIS}>
            <circle cx={0.03} cy={-0.89} r={0.012} />
            <circle cx={0.075} cy={-0.89} r={0.011} />
          </g>
        ) : null}
      </g>
      {lengan(f.ayunTangan + naik * 0.92, 0.1, c(f.baju))}
    </g>
  );
};

export const KerumunanView: React.FC<{ k: Kerumunan }> = ({ k }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const figur = susunKerumunan(k, frame / fps, width, height);
  // overflow HARUS hidden: figur yang separuh di luar viewport svg (jalan/lari masuk-keluar layar) terukur
  // dirasterisasi berbeda antar render bila overflow visible (2–3 hash berbeda dari 10 render).
  return (
    <svg width={width} height={height} style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', ...(k.kabur ? { filter: `blur(${k.kabur}px)` } : {}) }}>
      {figur.map((f, i) => (
        <FigurView key={i} f={f} siluet={k.siluet} />
      ))}
    </svg>
  );
};
