import React from 'react';
import type { Ekspresi, Karakter, Lihat, Pose } from '../../shared/tipe';

// Tokoh boneka (cut-out) gaya vector 3D: garis tepi tegas + 3 nada (dasar, bayangan, kilau).
// Koordinat lokal: titik (0,0) = tengah telapak kaki, sumbu y ke atas negatif. Menghadap kanan (3/4).

const GARIS = '#1d1d1f';
const TEBAL = 5;

// ---------- warna ----------
function campur(a: string, b: string, t: number) {
  const ha = a.replace('#', ''), hb = b.replace('#', '');
  const c = [0, 2, 4].map((i) => Math.round(parseInt(ha.slice(i, i + 2), 16) * (1 - t) + parseInt(hb.slice(i, i + 2), 16) * t));
  return '#' + c.map((v) => Math.max(0, Math.min(255, v)).toString(16).padStart(2, '0')).join('');
}
const gelap = (c: string, t = 0.22) => campur(c, '#000000', t);
const terang = (c: string, t = 0.28) => campur(c, '#ffffff', t);

// ---------- pose & ekspresi ----------
export type ParamPose = { dep: [number, number]; bel: [number, number]; kepala: number; badan: number; gerak?: 'lambai' | 'jelaskan' };
export const PARAM_POSE: Record<Pose, ParamPose> = {
  diam: { dep: [4, -6], bel: [8, -4], kepala: 0, badan: 0 },
  menunjuk: { dep: [-95, -4], bel: [10, -6], kepala: -2, badan: -2 },
  melambai: { dep: [-158, -22], bel: [8, -4], kepala: 4, badan: 0, gerak: 'lambai' },
  berpikir: { dep: [-28, -128], bel: [-18, -96], kepala: 8, badan: 2 },
  kaget: { dep: [-138, 28], bel: [-125, 30], kepala: -5, badan: 4 },
  berdoa: { dep: [-16, -112], bel: [-10, -108], kepala: 6, badan: 0 },
  'tangan-di-dada': { dep: [-14, -128], bel: [8, -4], kepala: 4, badan: 0 },
  'memeluk-diri': { dep: [-26, -112], bel: [-22, -108], kepala: 6, badan: 4 },
  menenangkan: { dep: [-72, -14], bel: [6, -4], kepala: 5, badan: -3 },
  meraih: { dep: [-58, -20], bel: [-42, -24], kepala: -2, badan: -6 },
  menjelaskan: { dep: [-52, -62], bel: [-18, -48], kepala: 2, badan: 0, gerak: 'jelaskan' },
  jalan: { dep: [0, -10], bel: [0, -10], kepala: 0, badan: -2 },
};

export type ParamEkspresi = {
  alis: [number, number]; // [sudut sisi dalam (+ = naik/cemas, - = turun/serius), naik]
  alisKanan?: [number, number];
  buka: number; // keterbukaan mata
  pupil: number;
  senyum: number; // -1 cemberut .. 1 senyum
  mulut: number; // keterbukaan dasar
  bulat?: boolean; // mulut "O"
  pipi: number;
  miring?: number;
};
export const PARAM_EKSPRESI: Record<Ekspresi, ParamEkspresi> = {
  netral: { alis: [0, 0], buka: 1, pupil: 1, senyum: 0.3, mulut: 0, pipi: 0.25 },
  senang: { alis: [-4, 5], buka: 0.78, pupil: 1, senyum: 1, mulut: 0.3, pipi: 0.55 },
  tenang: { alis: [-3, 2], buka: 0.68, pupil: 1, senyum: 0.55, mulut: 0, pipi: 0.35 },
  cemas: { alis: [15, 4], buka: 1, pupil: 0.9, senyum: -0.45, mulut: 0.06, pipi: 0.15 },
  takut: { alis: [19, 9], buka: 1.22, pupil: 0.62, senyum: -0.65, mulut: 0.32, pipi: 0.1 },
  kaget: { alis: [2, 15], buka: 1.3, pupil: 0.66, senyum: 0, mulut: 0.62, bulat: true, pipi: 0.2 },
  sedih: { alis: [17, 0], buka: 0.62, pupil: 1, senyum: -0.85, mulut: 0, pipi: 0.1 },
  serius: { alis: [-15, -4], buka: 0.84, pupil: 1, senyum: -0.05, mulut: 0, pipi: 0.1 },
  bingung: { alis: [10, 8], alisKanan: [-8, 0], buka: 0.95, pupil: 1, senyum: -0.15, mulut: 0.04, pipi: 0.15, miring: 8 },
};
export const LIHAT: Record<Lihat, [number, number]> = { depan: [0.35, 0], kiri: [-1, 0], kanan: [1, 0], atas: [0.3, -1], bawah: [0.3, 1] };

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export function campurPose(a: ParamPose, b: ParamPose, t: number): ParamPose {
  return {
    dep: [lerp(a.dep[0], b.dep[0], t), lerp(a.dep[1], b.dep[1], t)],
    bel: [lerp(a.bel[0], b.bel[0], t), lerp(a.bel[1], b.bel[1], t)],
    kepala: lerp(a.kepala, b.kepala, t),
    badan: lerp(a.badan, b.badan, t),
    gerak: t < 0.5 ? a.gerak : b.gerak,
  };
}
export function campurEkspresi(a: ParamEkspresi, b: ParamEkspresi, t: number): ParamEkspresi {
  const ak = a.alisKanan ?? a.alis, bk = b.alisKanan ?? b.alis;
  return {
    alis: [lerp(a.alis[0], b.alis[0], t), lerp(a.alis[1], b.alis[1], t)],
    alisKanan: [lerp(ak[0], bk[0], t), lerp(ak[1], bk[1], t)],
    buka: lerp(a.buka, b.buka, t),
    pupil: lerp(a.pupil, b.pupil, t),
    senyum: lerp(a.senyum, b.senyum, t),
    mulut: lerp(a.mulut, b.mulut, t),
    bulat: t < 0.5 ? a.bulat : b.bulat,
    pipi: lerp(a.pipi, b.pipi, t),
    miring: lerp(a.miring ?? 0, b.miring ?? 0, t),
  };
}

// ---------- ukuran per usia ----------
const UKURAN = {
  anak: { H: 560, R: 112, pinggul: 0.36, bahu: 1.32 },
  remaja: { H: 700, R: 108, pinggul: 0.42, bahu: 1.42 },
  dewasa: { H: 800, R: 102, pinggul: 0.44, bahu: 1.55 },
  tua: { H: 770, R: 100, pinggul: 0.43, bahu: 1.5 },
} as const;

export type StatusTokoh = {
  pose: ParamPose;
  ekspresi: ParamEkspresi;
  lihat: [number, number];
  t: number; // detik (untuk kedip, napas, gerak)
  bicara: number; // 0..1 amplop mulut frame ini
  jalan: number; // fase langkah (radian) atau NaN bila tidak berjalan
  siluet?: boolean;
  /**
   * Opsional (aksi turn-head): arah wajah lokal -1..1. Kosong = wajah 3/4 bawaan (perilaku lama).
   * 0 = menghadap kamera, +1 = ke arah hadap tokoh, -1 = menoleh ke belakang bahu.
   * Nilai PUTAR_DASAR menghasilkan wajah yang sama persis dengan wajah bawaan.
   */
  putarKepala?: number;
};

/** Nilai putarKepala yang setara wajah 3/4 bawaan (fx = 0,14·R). */
export const PUTAR_DASAR = 0.14 / 0.3;

function hashId(s: string) {
  let h = 0;
  for (const c of s) h = (h * 31 + c.charCodeAt(0)) | 0;
  return Math.abs(h % 1000) / 1000;
}

/** Gambar tokoh sebagai <g> di koordinat lokal (kaki di 0,0). */
export const TubuhTokoh: React.FC<{ k: Karakter; s: StatusTokoh }> = ({ k, s }) => {
  const uid = React.useId().replace(/:/g, '');
  const u = UKURAN[k.usia] ?? UKURAN.remaja;
  const { H, R } = u;
  const w = k.warna;
  const panjang = k.pakaian === 'hijab-gamis' || k.pakaian === 'jubah-sorban'; // pakaian sampai mata kaki
  const lenganPendek = k.pakaian === 'kasual';
  const hijab = k.pakaian.startsWith('hijab');
  const jaket = k.pakaian === 'jaket-detektif';
  const aks = new Set(k.aksesori ?? []);
  const warnaDalam = w.dalam ?? '#141414';

  // titik-titik tubuh
  const kepalaY = -(H - R);
  const leherY = kepalaY + R * 0.9;
  const bahuY = leherY + R * 0.14;
  const pinggulY = -H * u.pinggul;
  const lebarBadan = R * u.bahu;
  const bahuDep = lebarBadan * 0.36;
  const bahuBel = -lebarBadan * 0.42;
  const panjangLengan = (pinggulY - bahuY) * 1.02;
  const L1 = panjangLengan * 0.5;
  const L2 = panjangLengan * 0.46;
  const tebalLengan = R * 0.36;
  const tebalKaki = R * 0.4;

  // gerak hidup
  const seed = hashId(k.id);
  const napas = Math.sin(s.t * 2.1 + seed * 6) * 0.012;
  const berjalan = !Number.isNaN(s.jalan);
  const langkah = berjalan ? Math.sin(s.jalan) : 0;
  const ayun = berjalan ? Math.abs(Math.sin(s.jalan)) * 9 : 0;
  const fasaKedip = ((s.t + seed * 3.7) % 3.9) / 3.9;
  const kedip = fasaKedip > 0.965 ? 0.08 : 1;

  let dep = [...s.pose.dep] as [number, number];
  let bel = [...s.pose.bel] as [number, number];
  if (s.pose.gerak === 'lambai') dep[1] += Math.sin(s.t * 9) * 22;
  if (s.pose.gerak === 'jelaskan') {
    dep[1] += Math.sin(s.t * 3.4) * 14;
    bel[1] += Math.sin(s.t * 2.7 + 1) * 8;
  }
  if (berjalan) {
    dep = [dep[0] - langkah * 20, dep[1]];
    bel = [bel[0] + langkah * 20, bel[1]];
  }
  const kepalaMiring = s.pose.kepala + (s.ekspresi.miring ?? 0) + Math.sin(s.t * 1.3 + seed * 9) * 1.2 + s.bicara * 2.5;
  const badanMiring = s.pose.badan;

  // ---------- bagian ----------
  const Lengan = ({ x, sudut, belakang }: { x: number; sudut: [number, number]; belakang?: boolean }) => {
    const warnaLengan = belakang ? gelap(w.atasan, 0.12) : w.atasan;
    const warnaKulit = belakang ? gelap(w.kulit, 0.1) : w.kulit;
    return (
      <g transform={`translate(${x} ${bahuY + R * 0.12}) rotate(${sudut[0]})`}>
        <rect x={-tebalLengan / 2} y={-tebalLengan * 0.3} width={tebalLengan} height={L1 + tebalLengan * 0.5} rx={tebalLengan / 2} fill={warnaLengan} stroke={GARIS} strokeWidth={TEBAL} />
        <g transform={`translate(0 ${L1}) rotate(${sudut[1]})`}>
          <rect x={-tebalLengan * 0.46} y={-tebalLengan * 0.35} width={tebalLengan * 0.92} height={L2 + tebalLengan * 0.4} rx={tebalLengan * 0.46} fill={lenganPendek ? warnaKulit : warnaLengan} stroke={GARIS} strokeWidth={TEBAL} />
          {!lenganPendek ? <rect x={-tebalLengan * 0.5} y={L2 - tebalLengan * 0.25} width={tebalLengan} height={tebalLengan * 0.28} rx={6} fill={gelap(warnaLengan, 0.15)} stroke={GARIS} strokeWidth={TEBAL * 0.8} /> : null}
          <circle cx={0} cy={L2 + tebalLengan * 0.28} r={tebalLengan * 0.56} fill={warnaKulit} stroke={GARIS} strokeWidth={TEBAL} />
        </g>
      </g>
    );
  };

  const Kaki = ({ x, sudut, belakang }: { x: number; sudut: number; belakang?: boolean }) => {
    const panjangKaki = -pinggulY;
    const warna = belakang ? gelap(w.bawahan, 0.12) : w.bawahan;
    return (
      <g transform={`translate(${x} ${pinggulY}) rotate(${sudut})`}>
        {!panjang ? <rect x={-tebalKaki / 2} y={-10} width={tebalKaki} height={panjangKaki - 14} rx={tebalKaki * 0.35} fill={warna} stroke={GARIS} strokeWidth={TEBAL} /> : null}
        <path
          d={`M ${-tebalKaki * 0.55} ${panjangKaki - 30} h ${tebalKaki * 1.25} a ${tebalKaki * 0.42} ${tebalKaki * 0.42} 0 0 1 0 ${tebalKaki * 0.62} h ${-tebalKaki * 1.25} z`}
          fill={belakang ? gelap(w.sepatu, 0.12) : w.sepatu}
          stroke={GARIS}
          strokeWidth={TEBAL}
          strokeLinejoin="round"
        />
      </g>
    );
  };

  const sudutKaki = berjalan ? langkah * 22 : 0;
  const pisahKaki = R * 0.3;

  // badan
  const atasBadan = bahuY;
  const bawahBadan = panjang ? -26 : jaket ? pinggulY + R * 0.62 : k.pakaian === 'hijab-kasual' || k.pakaian === 'rambut-panjang' ? pinggulY + R * 0.75 : pinggulY + R * 0.28;
  const lebarBawah = panjang ? lebarBadan * 1.22 : lebarBadan * 1.04;
  const pathBadan = `M ${-lebarBadan / 2} ${atasBadan + R * 0.25}
    Q ${-lebarBadan / 2} ${atasBadan} ${-lebarBadan / 2 + R * 0.3} ${atasBadan}
    L ${lebarBadan / 2 - R * 0.3} ${atasBadan}
    Q ${lebarBadan / 2} ${atasBadan} ${lebarBadan / 2} ${atasBadan + R * 0.25}
    L ${lebarBawah / 2} ${bawahBadan - 10}
    Q ${lebarBawah / 2} ${bawahBadan} ${lebarBawah / 2 - 14} ${bawahBadan}
    L ${-lebarBawah / 2 + 14} ${bawahBadan}
    Q ${-lebarBawah / 2} ${bawahBadan} ${-lebarBawah / 2} ${bawahBadan - 10} Z`;

  // wajah (3/4 menghadap kanan)
  // Wajah: posisi horizontal fitur. Tanpa putarKepala → nilai lama persis.
  const putar = s.putarKepala === undefined ? null : Math.max(-1, Math.min(1, s.putarKepala));
  const fx = putar === null ? R * 0.14 : R * 0.3 * putar;
  // faktor mata kiri/kanan lokal: di PUTAR_DASAR sama dengan bawaan (kiri jauh+kecil, kanan dekat)
  const kPutar = putar === null ? 0 : putar / PUTAR_DASAR; // 1 = bawaan, 0 = menghadap kamera, -1 = 3/4 cermin
  const jarakKiri = putar === null ? 1 : 0.96 + 0.04 * kPutar;
  const jarakKanan = putar === null ? 0.92 : 0.96 - 0.04 * kPutar;
  // ukuran mata relatif mata besar (R·0,13); mata "kecil" bawaan = R·0,115 → rasio tepat 0,115/0,13
  const KECIL = 0.115 / 0.13;
  const ukuranKiri = putar === null ? undefined : (1 + KECIL) / 2 - ((1 - KECIL) / 2) * kPutar; // bawaan: KECIL
  const ukuranKanan = putar === null ? undefined : (1 + KECIL) / 2 + ((1 - KECIL) / 2) * kPutar; // bawaan: 1
  const pupilKiri = putar === null ? undefined : 0.96 - 0.04 * kPutar; // bawaan 0.92
  const pupilKanan = putar === null ? undefined : 0.96 + 0.04 * kPutar; // bawaan 1
  const fy = kepalaY + R * 0.1;
  const ex = R * 0.31;
  const ey = fy - R * 0.08;
  const [lx, ly] = s.lihat;
  const e = s.ekspresi;
  const buka = e.buka * kedip;
  const Mata = ({ cx, kecil, skala, skalaPupil, sisi }: { cx: number; kecil?: boolean; skala?: number; skalaPupil?: number; sisi?: 'k' | 'b' }) => {
    // id clipPath unik per mata (jalur lama: dari `kecil`; jalur putar: dari `sisi`)
    const idKlip = `m${uid}${sisi ?? (kecil ? 'k' : 'b')}`;
    const rx = R * (skala !== undefined ? 0.13 * skala : kecil ? 0.115 : 0.13);
    const ry = R * 0.165 * Math.max(0.06, buka);
    const pr = R * 0.085 * e.pupil * (skalaPupil !== undefined ? skalaPupil : kecil ? 0.92 : 1);
    return buka < 0.15 ? (
      <path d={`M ${cx - rx} ${ey} Q ${cx} ${ey + R * 0.05} ${cx + rx} ${ey}`} stroke={GARIS} strokeWidth={TEBAL} fill="none" strokeLinecap="round" />
    ) : (
      <g>
        <ellipse cx={cx} cy={ey} rx={rx} ry={ry} fill="#fff" stroke={GARIS} strokeWidth={TEBAL * 0.8} />
        <clipPath id={idKlip}>
          <ellipse cx={cx} cy={ey} rx={rx} ry={ry} />
        </clipPath>
        <g clipPath={`url(#${idKlip})`}>
          <circle cx={cx + lx * rx * 0.42} cy={ey + ly * ry * 0.4} r={pr} fill="#2a2320" />
          <circle cx={cx + lx * rx * 0.42 + pr * 0.35} cy={ey + ly * ry * 0.4 - pr * 0.4} r={pr * 0.32} fill="#fff" />
          {/* kelopak atas (mata tenang/sedih tampak sayu) */}
          {e.buka < 0.9 ? <rect x={cx - rx} y={ey - ry - 2} width={rx * 2} height={ry * (1 - e.buka) * 0.9 + 2} fill={w.kulit} /> : null}
        </g>
      </g>
    );
  };
  const Alis = ({ cx, kiri }: { cx: number; kiri: boolean }) => {
    const [sudut, naik] = kiri ? e.alis : e.alisKanan ?? e.alis;
    const y = ey - R * 0.25 - naik * 0.9;
    return <rect x={cx - R * 0.12} y={y - 5} width={R * 0.24} height={10} rx={5} fill={gelap(w.rambut, 0.1)} transform={`rotate(${kiri ? -sudut : sudut} ${cx} ${y})`} />;
  };
  const mulutBuka = Math.min(1, Math.max(e.mulut, s.bicara * 0.95));
  const Mulut = () => {
    const mx = putar === null ? fx + R * 0.02 : fx + R * 0.02 * Math.max(-1.3, Math.min(1.3, kPutar));
    const my = fy + R * 0.4;
    const lebar = R * (e.bulat ? 0.18 : 0.32) * (1 - mulutBuka * 0.15);
    const c = e.senyum * R * 0.12;
    if (mulutBuka < 0.08) return <path d={`M ${mx - lebar / 2} ${my} Q ${mx} ${my + c} ${mx + lebar / 2} ${my}`} stroke={GARIS} strokeWidth={TEBAL} fill="none" strokeLinecap="round" />;
    const tinggi = R * 0.3 * mulutBuka;
    const d = `M ${mx - lebar / 2} ${my} Q ${mx} ${my + c * 0.4 - tinggi * 0.15} ${mx + lebar / 2} ${my} Q ${mx + lebar * 0.4} ${my + tinggi + c} ${mx} ${my + tinggi + c} Q ${mx - lebar * 0.4} ${my + tinggi + c} ${mx - lebar / 2} ${my} Z`;
    return (
      <g>
        <path d={d} fill="#6b1f2a" stroke={GARIS} strokeWidth={TEBAL * 0.9} strokeLinejoin="round" />
        {mulutBuka > 0.35 ? <ellipse cx={mx} cy={my + tinggi * 0.82 + c} rx={lebar * 0.24} ry={tinggi * 0.2} fill="#e0707a" /> : null}
      </g>
    );
  };

  // penutup kepala / rambut
  const tuaLaki = k.jenis === 'laki' && (k.usia === 'tua' || k.pakaian === 'jubah-sorban');
  const Rambut = () => {
    if (hijab) return null;
    if (k.pakaian === 'rambut-panjang' || (k.jenis === 'perempuan' && k.pakaian !== 'koko-kopiah'))
      return (
        <g>
          <path
            d={`M ${-R * 0.98} ${kepalaY - R * 0.05} Q ${-R * 1.02} ${kepalaY - R * 1.08} ${R * 0.05} ${kepalaY - R * 1.06} Q ${R * 1.02} ${kepalaY - R * 1.02} ${R * 0.98} ${kepalaY - R * 0.1} Q ${R * 0.5} ${kepalaY - R * 0.72} ${-R * 0.1} ${kepalaY - R * 0.55} Q ${-R * 0.4} ${kepalaY - R * 0.3} ${-R * 0.98} ${kepalaY - R * 0.05} Z`}
            fill={w.rambut}
            stroke={GARIS}
            strokeWidth={TEBAL}
            strokeLinejoin="round"
          />
          <path d={`M ${-R * 0.5} ${kepalaY - R * 0.85} Q ${R * 0.1} ${kepalaY - R * 1.0} ${R * 0.6} ${kepalaY - R * 0.82}`} stroke={terang(w.rambut, 0.35)} strokeWidth={8} fill="none" strokeLinecap="round" />
        </g>
      );
    if (k.rambut === 'berantakan') {
      // rambut pendek berantakan: topi rambut + jambul runcing. Garis tepi digambar dulu (2×) lalu isi,
      // supaya sambungan jambul dan rambut tidak bergaris.
      const P = (pts: [number, number][]) => 'M ' + pts.map(([x, y]) => `${x * R} ${kepalaY + y * R}`).join(' L ') + ' Z';
      const bentuk = [
        `M ${-R * 1.0} ${kepalaY + R * 0.05} Q ${-R * 1.05} ${kepalaY - R * 1.05} ${R * 0.1} ${kepalaY - R * 1.04} Q ${R * 1.0} ${kepalaY - R * 0.98} ${R * 0.96} ${kepalaY - R * 0.28} L ${R * 0.62} ${kepalaY - R * 0.42} L ${R * 0.4} ${kepalaY - R * 0.3} L ${R * 0.05} ${kepalaY - R * 0.5} L ${-R * 0.45} ${kepalaY - R * 0.4} Q ${-R * 0.7} ${kepalaY - R * 0.2} ${-R * 1.0} ${kepalaY + R * 0.05} Z`,
        P([[-0.78, -0.72], [-1.08, -1.02], [-0.5, -0.95]]),
        P([[-0.48, -0.92], [-0.42, -1.34], [-0.05, -1.02]]),
        P([[-0.08, -1.02], [0.22, -1.36], [0.36, -0.98]]),
        P([[0.3, -0.98], [0.82, -1.16], [0.64, -0.78]]),
        P([[0.62, -0.62], [1.06, -0.52], [0.8, -0.34]]),
        P([[0.22, -0.56], [0.42, -0.18], [0.04, -0.44]]),
      ];
      return (
        <g>
          <g fill={w.rambut} stroke={GARIS} strokeWidth={TEBAL * 2} strokeLinejoin="round">
            {bentuk.map((d, i) => <path key={i} d={d} />)}
          </g>
          <g fill={w.rambut}>{bentuk.map((d, i) => <path key={i} d={d} />)}</g>
          <path d={`M ${-R * 0.42} ${kepalaY - R * 0.78} Q ${-R * 0.1} ${kepalaY - R * 0.92} ${R * 0.22} ${kepalaY - R * 0.84}`} stroke={terang(w.rambut, 0.22)} strokeWidth={5} fill="none" strokeLinecap="round" opacity={0.7} />
        </g>
      );
    }
    return (
      <g>
        <path
          d={`M ${-R * 1.0} ${kepalaY + R * 0.05} Q ${-R * 1.05} ${kepalaY - R * 1.05} ${R * 0.1} ${kepalaY - R * 1.04} Q ${R * 1.0} ${kepalaY - R * 0.98} ${R * 0.96} ${kepalaY - R * 0.28} L ${R * 0.62} ${kepalaY - R * 0.42} L ${R * 0.4} ${kepalaY - R * 0.3} L ${R * 0.05} ${kepalaY - R * 0.5} L ${-R * 0.45} ${kepalaY - R * 0.4} Q ${-R * 0.7} ${kepalaY - R * 0.2} ${-R * 1.0} ${kepalaY + R * 0.05} Z`}
          fill={w.rambut}
          stroke={GARIS}
          strokeWidth={TEBAL}
          strokeLinejoin="round"
        />
        <path d={`M ${-R * 0.55} ${kepalaY - R * 0.82} Q ${R * 0.05} ${kepalaY - R * 0.98} ${R * 0.55} ${kepalaY - R * 0.8}`} stroke={terang(w.rambut, 0.3)} strokeWidth={8} fill="none" strokeLinecap="round" />
      </g>
    );
  };
  const RambutBelakang = () =>
    !hijab && (k.pakaian === 'rambut-panjang' || (k.jenis === 'perempuan' && k.pakaian !== 'koko-kopiah')) ? (
      <path d={`M ${-R * 1.02} ${kepalaY - R * 0.2} Q ${-R * 1.12} ${bahuY + R * 0.9} ${-R * 0.55} ${bahuY + R * 1.0} L ${R * 0.6} ${bahuY + R * 0.7} Q ${R * 1.0} ${kepalaY} ${R * 0.8} ${kepalaY - R * 0.3} Z`} fill={gelap(w.rambut, 0.1)} stroke={GARIS} strokeWidth={TEBAL} strokeLinejoin="round" />
    ) : null;

  const Hijab = () => {
    if (!hijab) return null;
    const luar = (
      <>
        <circle cx={0} cy={kepalaY - R * 0.02} r={R * 1.13} />
        <path d={`M ${-R * 1.1} ${kepalaY + R * 0.1} L ${-R * 1.12} ${bahuY + R * (k.pakaian === 'hijab-gamis' ? 1.15 : 0.85)} Q 0 ${bahuY + R * (k.pakaian === 'hijab-gamis' ? 1.45 : 1.1)} ${R * 1.15} ${bahuY + R * (k.pakaian === 'hijab-gamis' ? 1.1 : 0.8)} L ${R * 1.08} ${kepalaY + R * 0.1} Z`} />
      </>
    );
    return (
      <g>
        <mask id={`h${uid}`}>
          <rect x={-R * 3} y={kepalaY - R * 3} width={R * 6} height={R * 6} fill="#fff" />
          <ellipse cx={fx} cy={fy + R * 0.02} rx={R * 0.74} ry={R * 0.8} fill="#000" />
        </mask>
        <g mask={`url(#h${uid})`}>
          <g fill={w.penutup} stroke={GARIS} strokeWidth={TEBAL * 2}>
            {luar}
          </g>
          <g fill={w.penutup}>{luar}</g>
          {/* bayangan & lipatan */}
          <path d={`M ${-R * 1.0} ${kepalaY + R * 0.3} Q ${-R * 0.9} ${bahuY + R * 0.9} ${-R * 0.2} ${bahuY + R * 1.1}`} stroke={gelap(w.penutup, 0.25)} strokeWidth={14} fill="none" strokeLinecap="round" />
          <path d={`M ${-R * 0.55} ${kepalaY - R * 0.92} Q ${R * 0.1} ${kepalaY - R * 1.08} ${R * 0.7} ${kepalaY - R * 0.8}`} stroke={terang(w.penutup, 0.35)} strokeWidth={9} fill="none" strokeLinecap="round" />
        </g>
        <ellipse cx={fx} cy={fy + R * 0.02} rx={R * 0.74} ry={R * 0.8} fill="none" stroke={GARIS} strokeWidth={TEBAL} />
      </g>
    );
  };
  const Kopiah = () =>
    k.pakaian === 'koko-kopiah' ? (
      <g>
        <path d={`M ${-R * 0.72} ${kepalaY - R * 0.62} L ${-R * 0.64} ${kepalaY - R * 1.12} Q ${0} ${kepalaY - R * 1.24} ${R * 0.66} ${kepalaY - R * 1.1} L ${R * 0.76} ${kepalaY - R * 0.6} Q 0 ${kepalaY - R * 0.72} ${-R * 0.72} ${kepalaY - R * 0.62} Z`} fill={w.penutup} stroke={GARIS} strokeWidth={TEBAL} strokeLinejoin="round" />
        <path d={`M ${-R * 0.66} ${kepalaY - R * 0.8} Q 0 ${kepalaY - R * 0.92} ${R * 0.72} ${kepalaY - R * 0.78}`} stroke={terang(w.penutup, 0.3)} strokeWidth={7} fill="none" />
      </g>
    ) : k.pakaian === 'jubah-sorban' ? (
      <g>
        <ellipse cx={0} cy={kepalaY - R * 0.72} rx={R * 1.02} ry={R * 0.5} fill={w.penutup} stroke={GARIS} strokeWidth={TEBAL} />
        <path d={`M ${-R * 0.9} ${kepalaY - R * 0.62} Q 0 ${kepalaY - R * 0.95} ${R * 0.92} ${kepalaY - R * 0.68}`} stroke={gelap(w.penutup, 0.2)} strokeWidth={8} fill="none" />
        <path d={`M ${-R * 0.8} ${kepalaY - R * 0.88} Q 0 ${kepalaY - R * 1.12} ${R * 0.8} ${kepalaY - R * 0.86}`} stroke={gelap(w.penutup, 0.2)} strokeWidth={8} fill="none" />
      </g>
    ) : null;
  const Jenggot = () =>
    tuaLaki ? (
      <path d={`M ${fx - R * 0.6} ${fy + R * 0.2} Q ${fx - R * 0.5} ${fy + R * 0.95} ${fx + R * 0.05} ${fy + R * 1.0} Q ${fx + R * 0.6} ${fy + R * 0.9} ${fx + R * 0.66} ${fy + R * 0.2} Q ${fx + R * 0.3} ${fy + R * 0.6} ${fx} ${fy + R * 0.58} Q ${fx - R * 0.3} ${fy + R * 0.6} ${fx - R * 0.6} ${fy + R * 0.2} Z`} fill={k.usia === 'tua' ? '#e8e4dc' : w.rambut} stroke={GARIS} strokeWidth={TEBAL} strokeLinejoin="round" />
    ) : null;

  const isi = (
    <g transform={`translate(0 ${-ayun})`}>
      {/* lengan & kaki belakang */}
      <Kaki x={-pisahKaki * 0.6} sudut={-sudutKaki} belakang />
      <Lengan x={bahuBel} sudut={bel} belakang />
      <g transform={`rotate(${badanMiring} 0 ${pinggulY})`}>
        <RambutBelakang />
        <Kaki x={pisahKaki} sudut={sudutKaki} />
        {/* badan */}
        <g transform={`translate(0 ${bahuY}) scale(1 ${1 + napas}) translate(0 ${-bahuY})`}>
          <path d={pathBadan} fill={w.atasan} stroke={GARIS} strokeWidth={TEBAL} strokeLinejoin="round" />
          <clipPath id={`b${uid}`}>
            <path d={pathBadan} />
          </clipPath>
          <g clipPath={`url(#b${uid})`}>
            <rect x={-lebarBawah} y={atasBadan} width={lebarBawah * 0.68} height={bawahBadan - atasBadan} fill={gelap(w.atasan, 0.2)} />
            <rect x={lebarBadan * 0.22} y={atasBadan + 14} width={14} height={(bawahBadan - atasBadan) * 0.7} rx={7} fill={terang(w.atasan, 0.3)} />
            {k.pakaian === 'koko-kopiah' ? <path d={`M ${R * 0.08} ${atasBadan} V ${pinggulY}`} stroke={gelap(w.atasan, 0.35)} strokeWidth={6} /> : null}
            {jaket ? (
              <>
                {/* kemeja dalam (V) */}
                <path d={`M ${-R * 0.3} ${atasBadan} L ${R * 0.36} ${atasBadan} L ${R * 0.06} ${atasBadan + R * 1.0} Z`} fill={warnaDalam} />
                {/* kerah jaket (lapel) */}
                <path d={`M ${-R * 0.34} ${atasBadan - 2} L ${R * 0.04} ${atasBadan + R * 1.0} L ${-R * 0.18} ${atasBadan + R * 1.02} L ${-R * 0.56} ${atasBadan + R * 0.42} Z`} fill={terang(w.atasan, 0.12)} stroke={GARIS} strokeWidth={TEBAL * 0.8} strokeLinejoin="round" />
                <path d={`M ${R * 0.4} ${atasBadan - 2} L ${R * 0.08} ${atasBadan + R * 1.0} L ${R * 0.3} ${atasBadan + R * 1.02} L ${R * 0.62} ${atasBadan + R * 0.42} Z`} fill={terang(w.atasan, 0.18)} stroke={GARIS} strokeWidth={TEBAL * 0.8} strokeLinejoin="round" />
                {/* kancing & saku */}
                <circle cx={R * 0.1} cy={atasBadan + R * 1.18} r={R * 0.055} fill={gelap(w.atasan, 0.45)} />
                <circle cx={R * 0.1} cy={atasBadan + R * 1.45} r={R * 0.055} fill={gelap(w.atasan, 0.45)} />
                <path d={`M ${R * 0.2} ${pinggulY + R * 0.2} h ${R * 0.42}`} stroke={gelap(w.atasan, 0.4)} strokeWidth={6} strokeLinecap="round" />
                <path d={`M ${-R * 0.62} ${atasBadan + R * 0.62} h ${R * 0.34}`} stroke={gelap(w.atasan, 0.4)} strokeWidth={5} strokeLinecap="round" />
              </>
            ) : null}
            {k.pakaian === 'kemeja' ? (
              <>
                <path d={`M ${R * 0.05} ${atasBadan} V ${bawahBadan}`} stroke={gelap(w.atasan, 0.35)} strokeWidth={5} />
                <path d={`M ${-R * 0.35} ${atasBadan} L ${R * 0.05} ${atasBadan + R * 0.4} L ${R * 0.42} ${atasBadan}`} fill={terang(w.atasan, 0.4)} stroke={GARIS} strokeWidth={TEBAL * 0.8} />
              </>
            ) : null}
          </g>
          <path d={pathBadan} fill="none" stroke={GARIS} strokeWidth={TEBAL} strokeLinejoin="round" />
          {aks.has('buku-catatan') ? (
            <g>
              <rect x={-R * 0.6} y={atasBadan + R * 0.38} width={R * 0.26} height={R * 0.32} rx={3} fill="#c9b48a" stroke={GARIS} strokeWidth={TEBAL * 0.7} transform={`rotate(-6 ${-R * 0.47} ${atasBadan + R * 0.5})`} />
              <path d={`M ${-R * 0.66} ${atasBadan + R * 0.62} h ${R * 0.4}`} stroke={GARIS} strokeWidth={TEBAL * 0.8} />
            </g>
          ) : null}
          {aks.has('lencana') ? (
            <path
              d={`M ${R * 0.42} ${atasBadan + R * 0.5} l ${R * 0.13} ${-R * 0.06} l ${R * 0.13} ${R * 0.06} v ${R * 0.14} q 0 ${R * 0.14} ${-R * 0.13} ${R * 0.2} q ${-R * 0.13} ${-R * 0.06} ${-R * 0.13} ${-R * 0.2} Z`}
              fill="#d9b25a"
              stroke={GARIS}
              strokeWidth={TEBAL * 0.7}
              strokeLinejoin="round"
            />
          ) : null}
          {aks.has('senter-sabuk') ? (
            <g transform={`rotate(-8 ${R * 0.62} ${pinggulY + R * 0.05})`}>
              <rect x={R * 0.5} y={pinggulY - R * 0.1} width={R * 0.17} height={R * 0.5} rx={R * 0.05} fill="#3a3f46" stroke={GARIS} strokeWidth={TEBAL * 0.8} />
              <rect x={R * 0.47} y={pinggulY + R * 0.34} width={R * 0.23} height={R * 0.12} rx={R * 0.04} fill="#9aa3ad" stroke={GARIS} strokeWidth={TEBAL * 0.8} />
            </g>
          ) : null}
        </g>
        {/* leher */}
        <rect x={-R * 0.2} y={leherY - R * 0.2} width={R * 0.42} height={R * 0.4} rx={R * 0.15} fill={gelap(w.kulit, 0.12)} stroke={GARIS} strokeWidth={TEBAL} />
        {aks.has('kerah-tinggi') ? (
          <g fill={terang(w.atasan, 0.08)} stroke={GARIS} strokeWidth={TEBAL} strokeLinejoin="round">
            <path d={`M ${-R * 0.52} ${bahuY + R * 0.12} L ${-R * 0.42} ${leherY - R * 0.3} L ${-R * 0.12} ${leherY - R * 0.05} L ${-R * 0.16} ${bahuY + R * 0.2} Z`} />
            <path d={`M ${R * 0.58} ${bahuY + R * 0.12} L ${R * 0.5} ${leherY - R * 0.32} L ${R * 0.2} ${leherY - R * 0.05} L ${R * 0.22} ${bahuY + R * 0.2} Z`} />
          </g>
        ) : null}
        {/* kepala */}
        <g transform={`rotate(${kepalaMiring} 0 ${leherY})`}>
          {!hijab && putar === null ? <ellipse cx={-R * 0.72} cy={kepalaY + R * 0.12} rx={R * 0.16} ry={R * 0.2} fill={w.kulit} stroke={GARIS} strokeWidth={TEBAL} /> : null}
          {!hijab && putar !== null ? (
            <>
              {/* telinga ikut berputar: sisi belakang kepala berpindah saat menoleh */}
              {kPutar > -0.3 ? <ellipse cx={-R * (0.93 - 0.21 * Math.max(0, Math.min(1, kPutar)))} cy={kepalaY + R * 0.12} rx={R * 0.16} ry={R * 0.2} fill={w.kulit} stroke={GARIS} strokeWidth={TEBAL} /> : null}
              {kPutar < 0.3 ? <ellipse cx={R * (0.93 - 0.21 * Math.max(0, Math.min(1, -kPutar)))} cy={kepalaY + R * 0.12} rx={R * 0.16} ry={R * 0.2} fill={w.kulit} stroke={GARIS} strokeWidth={TEBAL} /> : null}
            </>
          ) : null}
          <circle cx={0} cy={kepalaY} r={R} fill={w.kulit} stroke={GARIS} strokeWidth={TEBAL} />
          <clipPath id={`k${uid}`}>
            <circle cx={0} cy={kepalaY} r={R} />
          </clipPath>
          <g clipPath={`url(#k${uid})`}>
            <circle cx={-R * 0.55} cy={kepalaY + R * 0.1} r={R * 0.9} fill={gelap(w.kulit, 0.1)} opacity={0.5} />
          </g>
          <circle cx={0} cy={kepalaY} r={R} fill="none" stroke={GARIS} strokeWidth={TEBAL} />
          {putar === null ? <Rambut /> : <g transform={`translate(${(fx - R * 0.14) * 0.45} 0)`}><Rambut /></g>}
          <Jenggot />
          {/* pipi */}
          <ellipse cx={fx - ex * jarakKiri - R * 0.08} cy={fy + R * 0.2} rx={R * 0.13} ry={R * 0.08} fill="#f07a8a" opacity={e.pipi * 0.6} />
          <ellipse cx={fx + ex * (jarakKanan + 0.08) + R * 0.04} cy={fy + R * 0.2} rx={R * 0.11} ry={R * 0.07} fill="#f07a8a" opacity={e.pipi * 0.6} />
          {putar === null ? <Mata cx={fx - ex} kecil /> : <Mata cx={fx - ex * jarakKiri} skala={ukuranKiri} skalaPupil={pupilKiri} sisi="k" />}
          {putar === null ? <Mata cx={fx + ex * 0.92} /> : <Mata cx={fx + ex * jarakKanan} skala={ukuranKanan} skalaPupil={pupilKanan} sisi="b" />}
          <Alis cx={fx - ex * jarakKiri} kiri />
          <Alis cx={fx + ex * jarakKanan} kiri={false} />
          {putar === null ? (
            <path d={`M ${fx + R * 0.06} ${fy + R * 0.08} q ${R * 0.08} ${R * 0.1} ${-R * 0.02} ${R * 0.15}`} stroke={gelap(w.kulit, 0.35)} strokeWidth={TEBAL * 0.8} fill="none" strokeLinecap="round" />
          ) : (
            (() => {
              // hidung: arah lengkung mengikuti arah wajah; menghadap kamera → lengkung kecil simetris
              const k = Math.max(-1, Math.min(1, kPutar));
              return <path d={`M ${fx + R * 0.06 * k} ${fy + R * 0.08} q ${R * 0.08 * k} ${R * 0.1} ${-R * 0.02 * k} ${R * 0.15}`} stroke={gelap(w.kulit, 0.35)} strokeWidth={TEBAL * 0.8} fill="none" strokeLinecap="round" />;
            })()
          )}
          <Mulut />
          <Hijab />
          <Kopiah />
        </g>
      </g>
      {/* lengan depan */}
      <g transform={`rotate(${badanMiring} 0 ${pinggulY})`}>
        <Lengan x={bahuDep} sudut={dep} />
      </g>
    </g>
  );

  return (
    <g>
      <ellipse cx={0} cy={4} rx={R * 1.15} ry={R * 0.18} fill="#000" opacity={s.siluet ? 0.25 : 0.14} />
      {s.siluet ? <g style={{ filter: 'brightness(0)' }} opacity={0.94}>{isi}</g> : isi}
    </g>
  );
};

/** Ukuran kotak gambar tokoh: viewBox tetap supaya semua usia sebanding. */
export const VIEWBOX = { x: -300, y: -960, w: 600, h: 1000 };

export const TokohSvg: React.FC<{ k: Karakter; s: StatusTokoh; hadap: 'kiri' | 'kanan'; style?: React.CSSProperties }> = ({ k, s, hadap, style }) => (
  <svg viewBox={`${VIEWBOX.x} ${VIEWBOX.y} ${VIEWBOX.w} ${VIEWBOX.h}`} style={{ overflow: 'visible', ...style }}>
    <g transform={hadap === 'kiri' ? 'scale(-1 1)' : undefined}>
      <TubuhTokoh k={k} s={s} />
    </g>
  </svg>
);
