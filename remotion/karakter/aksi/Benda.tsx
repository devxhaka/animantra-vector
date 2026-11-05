// Gambar benda aksi open-object (buku / map / dokumen) di koordinat px kanvas.
// Deterministik: tanpa mix-blend, tanpa opacity grup, tanpa <image>/<svg> bersarang
// (sampul kustom disisipkan sebagai vektor di <g transform>).
import React from 'react';
import type { AksiOpenObject } from '../../../shared/tipe';
import type { SvgInline } from '../Tokoh';
import { type BentukBenda } from './benda';

const GARIS = '#1d1d1f';

const WARNA = {
  buku: { sampul: '#7a2e2e', sampulGelap: '#5c2020', pita: '#d9b25a', dalam: '#f3ead6', garis: '#c9bca0' },
  map: { sampul: '#d4ad62', sampulGelap: '#b8914a', pita: '#d4ad62', dalam: '#e8cf95', garis: '#c9bca0' },
  dokumen: { sampul: '#e8e2d2', sampulGelap: '#d3cbb6', pita: '#b03a2e', dalam: '#fbf8f0', garis: '#c9c2b0' },
} as const;

export const BendaAksi: React.FC<{
  aksi: AksiOpenObject;
  bentuk: BentukBenda;
  /** 0 = tertutup … 180 = terbuka */
  sudut: number;
  lebar: number;
  tinggi: number;
  sampul?: SvgInline;
}> = ({ aksi, bentuk: b, sudut, lebar, tinggi, sampul }) => {
  const w = WARNA[aksi.benda];
  const t = b.tinggi;
  const atas = b.cy - t / 2;
  const bawah = b.cy + t / 2;
  const tebal = Math.max(2, t * 0.022);
  const rad = (sudut * Math.PI) / 180;
  const cos = Math.cos(rad);
  const fx = b.engselX + b.arah * b.setengah * cos; // tepi bebas panel
  const dy = (t / 2) * (1 + 0.12 * Math.sin(rad)); // tepi bebas sedikit "mendekat" saat berdiri
  const depan = sudut < 90; // sisi luar panel (sampul) terlihat

  // bagian dasar (di bawah panel, sisi jauh dari tokoh)
  const dx0 = Math.min(b.engselX, b.engselX + b.arah * b.setengah);
  const garisHalaman = (x0: number, x1: number, n: number) =>
    Array.from({ length: n }, (_, i) => {
      const y = atas + t * (0.18 + (0.66 * i) / Math.max(1, n - 1));
      const a = Math.min(x0, x1), c = Math.max(x0, x1);
      const pad = (c - a) * 0.14;
      return <line key={i} x1={a + pad} y1={y} x2={c - pad * (i === n - 1 ? 2.2 : 1)} y2={y} stroke={w.garis} strokeWidth={tebal * 0.8} strokeLinecap="round" />;
    });

  // isi bagian dasar per jenis
  const isiDasar = (
    <>
      <rect x={dx0} y={atas} width={b.setengah} height={t} fill={w.dalam} stroke={GARIS} strokeWidth={tebal} />
      {aksi.benda === 'map' ? (
        <>
          <rect x={dx0 + b.setengah * 0.12} y={atas + t * 0.1} width={b.setengah * 0.76} height={t * 0.82} fill="#fbf8f0" stroke={GARIS} strokeWidth={tebal * 0.8} />
          <rect x={dx0 + b.setengah * 0.2} y={atas + t * 0.18} width={b.setengah * 0.3} height={t * 0.26} fill="#8a8f96" stroke={GARIS} strokeWidth={tebal * 0.7} />
          {garisHalaman(dx0 + b.setengah * 0.12, dx0 + b.setengah * 0.88, 4).slice(1)}
        </>
      ) : (
        garisHalaman(dx0, dx0 + b.setengah, aksi.benda === 'dokumen' ? 7 : 6)
      )}
      {aksi.benda === 'buku' ? (
        // tebal halaman di tepi luar
        <rect x={b.arah > 0 ? dx0 + b.setengah - tebal * 2.5 : dx0} y={atas + tebal} width={tebal * 2.5} height={t - tebal * 2} fill="#e5d9bd" />
      ) : null}
      {aksi.benda === 'dokumen' ? (
        <circle cx={dx0 + b.setengah * 0.72} cy={atas + t * 0.78} r={t * 0.08} fill="none" stroke={w.pita} strokeWidth={tebal * 1.4} />
      ) : null}
    </>
  );

  // panel berputar
  const titikPanel = `${b.engselX},${atas} ${fx},${b.cy - dy} ${fx},${b.cy + dy} ${b.engselX},${bawah}`;
  const isiPanel = depan ? (
    <>
      <polygon points={titikPanel} fill={w.sampul} stroke={GARIS} strokeWidth={tebal} strokeLinejoin="round" />
      {/* pita/tab: buku = pita judul, map = tab di atas, dokumen = garis lipat */}
      {aksi.benda === 'buku' && Math.abs(cos) > 0.05 ? (
        <rect x={Math.min(b.engselX, fx) + Math.abs(fx - b.engselX) * 0.18} y={atas + t * 0.22} width={Math.abs(fx - b.engselX) * 0.64} height={t * 0.12} fill={w.pita} />
      ) : null}
      {aksi.benda === 'map' && Math.abs(cos) > 0.05 ? (
        <polygon
          points={`${b.engselX + (fx - b.engselX) * 0.55},${b.cy - dy * 1.0} ${b.engselX + (fx - b.engselX) * 0.6},${b.cy - dy * 1.14} ${b.engselX + (fx - b.engselX) * 0.92},${b.cy - dy * 1.14} ${b.engselX + (fx - b.engselX) * 0.95},${b.cy - dy * 1.0}`}
          fill={w.sampul}
          stroke={GARIS}
          strokeWidth={tebal}
          strokeLinejoin="round"
        />
      ) : null}
      {sampul && Math.abs(cos) > 0.05 ? <SampulKustom svg={sampul} b={b} cos={cos} /> : null}
      {/* bayangan di sisi engsel saat mulai berdiri */}
      <polygon points={titikPanel} fill={w.sampulGelap} fillOpacity={Math.min(0.6, Math.sin(rad) * 0.7)} />
    </>
  ) : (
    <>
      <polygon points={titikPanel} fill={w.dalam} stroke={GARIS} strokeWidth={tebal} strokeLinejoin="round" />
      {Array.from({ length: aksi.benda === 'map' ? 3 : 5 }, (_, i) => {
        const v = 0.2 + (0.6 * i) / 4;
        const ya = b.cy - t / 2 + t * v;
        const skew = (ya - b.cy) * 0.12 * Math.sin(rad);
        return <line key={i} x1={b.engselX + (fx - b.engselX) * 0.16} y1={ya} x2={b.engselX + (fx - b.engselX) * 0.84} y2={ya + skew} stroke={w.garis} strokeWidth={tebal * 0.8} strokeLinecap="round" />;
      })}
      <polygon points={titikPanel} fill="#000000" fillOpacity={Math.min(0.25, Math.sin(rad) * 0.3)} />
    </>
  );

  return (
    <svg width={lebar} height={tinggi} viewBox={`0 0 ${lebar} ${tinggi}`} style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible', pointerEvents: 'none' }}>
      <ellipse cx={b.engselX} cy={bawah + t * 0.06} rx={b.setengah * 1.15} ry={t * 0.07} fill="#000000" fillOpacity={0.22} />
      {isiDasar}
      {/* engsel */}
      <line x1={b.engselX} y1={atas} x2={b.engselX} y2={bawah} stroke={GARIS} strokeWidth={tebal * 1.2} />
      {isiPanel}
    </svg>
  );
};

/** Sampul kustom pada sisi depan panel, mengikuti lebar terproyeksi (cos) tanpa dicerminkan. */
const SampulKustom: React.FC<{ svg: SvgInline; b: BentukBenda; cos: number }> = ({ svg, b, cos }) => {
  const [vx, vy, vw, vh] = svg.viewBox.split(/[\s,]+/).map(Number);
  if (![vx, vy, vw, vh].every(Number.isFinite) || vw <= 0 || vh <= 0) return null;
  const lebarTampak = b.setengah * Math.abs(cos);
  const x0 = b.arah * cos > 0 ? b.engselX : b.engselX - lebarTampak;
  const pad = 0.1;
  const ky = (b.tinggi * (1 - 2 * pad)) / vh;
  const k = Math.min(b.setengah * (1 - 2 * pad) / vw, ky);
  // skala X ikut proyeksi (cos), skala Y tetap; dipusatkan di area sampul
  const sx = (k * lebarTampak) / b.setengah;
  const tx = x0 + (lebarTampak - vw * sx) / 2 - vx * sx;
  const ty = b.cy - (vh * k) / 2 - vy * k;
  return <g transform={`translate(${tx} ${ty}) scale(${sx} ${k})`} dangerouslySetInnerHTML={{ __html: svg.isi }} />;
};
