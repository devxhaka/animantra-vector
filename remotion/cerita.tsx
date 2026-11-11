import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, Easing } from 'remotion';
import type { Adegan, Ekspresi, Karakter, Lihat, PosisiTubuh, Pose, Suasana, TokohAdegan } from '../shared/tipe';
import { PARAM_EKSPRESI, PARAM_POSE, PARAM_TUBUH, TokohSvg, VIEWBOX, campurEkspresi, campurPose, campurTubuh, type StatusTokoh } from './karakter/Tokoh';
import { KARAKTER_CADANGAN } from '../shared/karakter-bawaan';
import { aksiAktifPada, gabungUrutanFallback, rencanakanAksi } from './karakter/aksi/resolver';
import { terapkanAksi } from './karakter/aksi/terapkan';
import { BendaAksi } from './karakter/aksi/Benda.tsx';
import { bentukBenda, sudutBuka } from './karakter/aksi/benda';
import { useGambarAksi } from './karakter/aksi/asetSvg';
import type { ModeAnimasi } from '../shared/tipe';

const TRANSISI = 0.32; // detik perpindahan pose/ekspresi
const TRANSISI_TUBUH = 0.6; // duduk/berdiri/berbaring lebih lambat dari gerak lengan

export type KeadaanAkhir = { pose: Pose; ekspresi: Ekspresi; lihat: Lihat; hadap: 'kiri' | 'kanan'; tubuh?: PosisiTubuh };

/** Keadaan tokoh di akhir adegan (dipakai sebagai titik awal di adegan berikutnya, agar tidak "loncat"). */
export function keadaanAkhir(t: TokohAdegan): KeadaanAkhir {
  const k: KeadaanAkhir = { pose: t.pose ?? 'diam', ekspresi: t.ekspresi ?? 'netral', lihat: t.lihat ?? 'depan', hadap: t.hadap ?? 'kanan', tubuh: t.tubuh ?? 'berdiri' };
  for (const u of [...(t.urutan ?? [])].sort((a, b) => a.pada - b.pada)) {
    if (u.pose) k.pose = u.pose;
    if (u.tubuh) k.tubuh = u.tubuh;
    if (u.ekspresi) k.ekspresi = u.ekspresi;
    if (u.lihat) k.lihat = u.lihat;
    if (u.hadap) k.hadap = u.hadap;
  }
  return k;
}

const LIHAT: Record<Lihat, [number, number]> = { depan: [0.35, 0], kiri: [-1, 0], kanan: [1, 0], atas: [0.3, -1], bawah: [0.3, 1] };
const halus = Easing.inOut(Easing.cubic);

function statusPada(t: TokohAdegan, detik: number, awal?: KeadaanAkhir) {
  const dasar = keadaanAkhir({ ...t, urutan: [] });
  // daftar kejadian: [waktu, keadaan baru]
  const kejadian: { pada: number; k: KeadaanAkhir }[] = [];
  let kini = { ...dasar };
  kejadian.push({ pada: 0, k: { ...kini } });
  for (const u of [...(t.urutan ?? [])].sort((a, b) => a.pada - b.pada)) {
    kini = { pose: u.pose ?? kini.pose, ekspresi: u.ekspresi ?? kini.ekspresi, lihat: u.lihat ?? kini.lihat, hadap: u.hadap ?? kini.hadap, tubuh: u.tubuh ?? kini.tubuh };
    kejadian.push({ pada: u.pada, k: { ...kini } });
  }
  let i = 0;
  for (let j = 0; j < kejadian.length; j++) if (kejadian[j].pada <= detik) i = j;
  const target = kejadian[i].k;
  const dari = i === 0 ? awal ?? target : kejadian[i - 1].k;
  const p = halus(Math.min(1, Math.max(0, (detik - kejadian[i].pada) / TRANSISI)));
  const la = LIHAT[dari.lihat], lb = LIHAT[target.lihat];
  // posisi tubuh: hanya diisi bila tidak berdiri (atau sedang berpindah) → tokoh berdiri memakai jalur gambar lama persis
  const ta = dari.tubuh ?? 'berdiri', tt = target.tubuh ?? 'berdiri';
  const pt = halus(Math.min(1, Math.max(0, (detik - kejadian[i].pada) / TRANSISI_TUBUH)));
  const tubuh = ta === 'berdiri' && tt === 'berdiri' ? undefined : campurTubuh(PARAM_TUBUH[ta], PARAM_TUBUH[tt], pt);
  return {
    tubuh,
    pose: campurPose(PARAM_POSE[dari.pose], PARAM_POSE[target.pose], p),
    ekspresi: campurEkspresi(PARAM_EKSPRESI[dari.ekspresi], PARAM_EKSPRESI[target.ekspresi], p),
    lihat: [la[0] + (lb[0] - la[0]) * p, la[1] + (lb[1] - la[1]) * p] as [number, number],
    hadap: p < 0.5 ? dari.hadap : target.hadap,
    berjalan: target.pose === 'jalan' && tt === 'berdiri',
  };
}

export const TokohAdeganView: React.FC<{
  tokoh: TokohAdegan;
  karakter: Karakter;
  adegan: Adegan;
  awal?: KeadaanAkhir;
  modeAnimasi?: ModeAnimasi;
  /** Lapisan gambar: tanpa lengan depan (badan) atau hanya lengan depan (di atas semua tokoh). Kosong = utuh. */
  lapis?: StatusTokoh['lapis'];
}> = ({ tokoh: tokohSpec, karakter, adegan, awal, modeAnimasi, lapis }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const t = frame / fps;
  // Aksi khusus: rencana statis (routing/fallback) dihitung sekali per adegan. Tanpa `aksi`
  // tidak ada rencana dan tokoh dipakai apa adanya → perilaku identik dengan sebelumnya.
  const rencana = React.useMemo(
    () => (tokohSpec.aksi?.length ? rencanakanAksi(tokohSpec, { modeBawaan: modeAnimasi, durasiAdegan: adegan.durasi, karakter }) : null),
    [tokohSpec, modeAnimasi, adegan.durasi, karakter],
  );
  const tokoh = React.useMemo(() => (rencana ? gabungUrutanFallback(tokohSpec, rencana) : tokohSpec), [tokohSpec, rencana]);
  const st = statusPada(tokoh, t, awal);
  const gambar = useGambarAksi(tokohSpec);

  let x = tokoh.x;
  let fase = st.berjalan ? t * Math.PI * 3.2 : NaN;
  if (tokoh.jalan) {
    const { ke, mulai, selesai } = tokoh.jalan;
    const p = Math.min(1, Math.max(0, (t - mulai) / Math.max(0.01, selesai - mulai)));
    x = tokoh.x + (ke - tokoh.x) * p;
    if (t >= mulai && t <= selesai) fase = (t - mulai) * Math.PI * 3.2;
  }
  const bicara = adegan.pembicara === tokoh.id && adegan.mulut?.length ? (adegan.mulut[frame] ?? 0) : 0;

  const dasar: StatusTokoh = {
    pose: st.pose, ekspresi: st.ekspresi, lihat: st.lihat, t, bicara, jalan: fase, siluet: tokoh.siluet,
    ...(st.tubuh ? { tubuh: st.tubuh, jalan: NaN } : {}),
    ...(lapis ? { lapis } : {}),
    ...(tokoh.tampak === 'belakang' ? { belakang: true } : {}),
  };
  // aksi khusus aktif di detik ini (murni dari t) → override bagian tubuh yang dipegang aksi
  const s = rencana
    ? terapkanAksi(dasar, aksiAktifPada(rencana, t), {
        hadap: st.hadap,
        karakter,
        penempatan: { x, y: tokoh.y ?? 0.8, skala: tokoh.skala ?? 1, lebarLayar: width, tinggiLayar: height, hadap: st.hadap },
        gambar,
      })
    : dasar;
  const lebar = width * 0.62 * (tokoh.skala ?? 1);
  const tinggi = (lebar * VIEWBOX.h) / VIEWBOX.w;
  const kakiY = (tokoh.y ?? 0.8) * height;
  // titik (0,0) viewBox = kaki → posisikan kotak svg
  const kiri = x * width - lebar * (-VIEWBOX.x / VIEWBOX.w);
  const atas = kakiY - tinggi * (-VIEWBOX.y / VIEWBOX.h);
  const tokohEl = (
    <TokohSvg
      k={karakter}
      s={s}
      hadap={st.hadap}
      style={{ position: 'absolute', left: kiri, top: atas, width: lebar, height: tinggi, ...(tokoh.kabur ? { filter: `blur(${tokoh.kabur}px)` } : {}) }}
    />
  );
  // benda open-object (hanya bila dijalankan sebagai aksi khusus): digambar DI BELAKANG tokoh supaya tangan
  // menutupi benda saat menyentuh. Tampil sepanjang adegan: tertutup sebelum aksi, terbuka sesudahnya.
  const benda = lapis === 'lengan-depan' ? [] : rencana?.khusus.filter((r) => r.aksi.jenis === 'open-object') ?? [];
  if (!benda.length) return tokohEl;
  return (
    <>
      {benda.map((r) => {
        const a = r.aksi as Extract<typeof r.aksi, { jenis: 'open-object' }>;
        const sampul = a.aset && !r.pakaiGambarBawaan ? gambar(a.aset) : undefined;
        return <BendaAksi key={r.indeks} aksi={a} bentuk={bentukBenda(a, { lebar: width, tinggi: height }, tokoh.x)} sudut={sudutBuka(a, t)} lebar={width} tinggi={height} sampul={sampul} />;
      })}
      {tokohEl}
    </>
  );
};

export function cariKarakter(pemeran: Karakter[] | undefined, id: string): Karakter {
  return pemeran?.find((p) => p.id === id) ?? { ...KARAKTER_CADANGAN, id, nama: id };
}

// ---------------- Suasana ----------------
export function guncangan(s: Suasana | null | undefined, t: number) {
  if (!s?.gempa) return { x: 0, y: 0, r: 0 };
  const k = s.gempa;
  return { x: (Math.sin(t * 37) + Math.sin(t * 23.3)) * 9 * k, y: (Math.sin(t * 31.7) + Math.cos(t * 19.1)) * 7 * k, r: Math.sin(t * 13) * 0.6 * k };
}

export const LapisanSuasana: React.FC<{ s: Suasana }> = ({ s }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const t = frame / fps;
  const uid = React.useId().replace(/:/g, '');
  return (
    <AbsoluteFill style={{ pointerEvents: 'none' }}>
      {s.warnaLangit ? <AbsoluteFill style={{ background: `linear-gradient(180deg, ${s.warnaLangit} 0%, transparent 70%)`, mixBlendMode: 'multiply', opacity: 0.75 }} /> : null}
      {s.gelap ? <AbsoluteFill style={{ background: '#0b1230', mixBlendMode: 'multiply', opacity: Math.min(0.85, s.gelap) }} /> : null}
      {s.cahaya ? (
        <AbsoluteFill>
          <div
            style={{
              position: 'absolute',
              left: s.cahaya.x * width - width,
              top: s.cahaya.y * height - width,
              width: width * 2,
              height: width * 2,
              background: `radial-gradient(circle, ${s.cahaya.warna ?? '#fff3c4'}cc 0%, ${s.cahaya.warna ?? '#fff3c4'}44 25%, transparent 60%)`,
              opacity: 0.85 + Math.sin(t * 2) * 0.1,
              mixBlendMode: 'screen',
            }}
          />
          <svg width={width} height={height} style={{ position: 'absolute', inset: 0, mixBlendMode: 'screen', opacity: 0.35 }}>
            {Array.from({ length: 9 }, (_, i) => {
              const a = (-70 + i * 17.5 + Math.sin(t * 0.8 + i) * 3) * (Math.PI / 180);
              const cx = s.cahaya!.x * width, cy = s.cahaya!.y * height, L = height * 1.3;
              const x1 = cx + Math.sin(a - 0.04) * L, y1 = cy + Math.cos(a - 0.04) * L;
              const x2 = cx + Math.sin(a + 0.04) * L, y2 = cy + Math.cos(a + 0.04) * L;
              return <polygon key={i} points={`${cx},${cy} ${x1},${y1} ${x2},${y2}`} fill={s.cahaya!.warna ?? '#fff3c4'} />;
            })}
          </svg>
        </AbsoluteFill>
      ) : null}
      {s.kabut ? (
        <AbsoluteFill style={{ opacity: 0.55 }}>
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              style={{
                position: 'absolute',
                width: width * 1.4,
                height: height * 0.35,
                left: ((t * (18 + i * 9) + i * 400) % (width * 2.4)) - width * 1.4,
                top: height * (0.45 + i * 0.12),
                background: 'radial-gradient(ellipse, rgba(235,238,245,0.85) 0%, rgba(235,238,245,0) 65%)',
              }}
            />
          ))}
        </AbsoluteFill>
      ) : null}
      {s.hujan ? (
        <svg width={width} height={height} style={{ position: 'absolute', inset: 0 }}>
          <defs>
            <linearGradient id={`hj${uid}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#cfe0ff" stopOpacity="0" />
              <stop offset="1" stopColor="#cfe0ff" stopOpacity="0.7" />
            </linearGradient>
          </defs>
          {Array.from({ length: 90 }, (_, i) => {
            const kec = 1900 + (i % 7) * 140;
            const x0 = (i * 97.3) % width;
            const y0 = ((i * 211.7 + t * kec) % (height + 200)) - 200;
            return <line key={i} x1={x0} y1={y0} x2={x0 - 18} y2={y0 + 90} stroke={`url(#hj${uid})`} strokeWidth={3} />;
          })}
        </svg>
      ) : null}
      {s.vinyet || s.gelap ? <AbsoluteFill style={{ background: 'radial-gradient(ellipse at 50% 45%, transparent 45%, rgba(0,0,0,0.55) 100%)' }} /> : null}
      {s.kilat?.length ? <Kilat waktu={s.kilat} t={t} /> : null}
    </AbsoluteFill>
  );
};

// ---------------- Phase C: kilat, lampu, efek api/asap ----------------

/** Kekuatan kilat 0..1 pada detik t: kilatan ganda yang cepat memudar. */
export function kuatKilat(waktu: number[], t: number) {
  let k = 0;
  for (const w of waktu) {
    const d = t - w;
    if (d < 0 || d > 0.6) continue;
    const a = Math.exp(-d / 0.07); // kilatan pertama
    const b = d > 0.14 ? 0.7 * Math.exp(-(d - 0.14) / 0.1) : 0; // kilatan susulan
    k = Math.max(k, a, b);
  }
  return Math.min(1, k);
}
const Kilat: React.FC<{ waktu: number[]; t: number }> = ({ waktu, t }) => {
  const k = kuatKilat(waktu, t);
  return k > 0.01 ? <AbsoluteFill style={{ background: '#eef3ff', opacity: k * 0.75, pointerEvents: 'none' }} /> : null;
};

/** Getar nyala api: deterministik dari t, berbeda per sumber (i). */
export const getarApi = (t: number, i: number) => 1 + Math.sin(t * 13 + i * 1.7) * 0.035 + Math.sin(t * 7.3 + i * 4.1) * 0.025 + Math.sin(t * 23.1 + i) * 0.015;

/**
 * Gelap di luar cahaya lampu + pendar hangat. Dipasang DI DALAM dunia (ikut kamera), dengan bidang
 * diperlebar supaya tepi tidak terlihat saat kamera menggeser/zoom. Tanpa mix-blend & tanpa opacity grup.
 */
export const LapisanLampu: React.FC<{ lampu: NonNullable<Suasana['lampu']>; gelap?: number }> = ({ lampu, gelap = 0.78 }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const t = frame / fps;
  const uid = React.useId().replace(/:/g, '');
  const L = lampu.map((l, i) => {
    const g = l.kedip === false ? 1 : getarApi(t, i);
    return { cx: l.x * width, cy: l.y * height, r: (l.jangkau ?? 0.45) * width * g, warna: l.warna ?? '#ffb347' };
  });
  return (
    <svg width={width} height={height} style={{ position: 'absolute', inset: 0, overflow: 'visible', pointerEvents: 'none' }}>
      <defs>
        <radialGradient id={`lg${uid}`}>
          <stop offset="0" stopColor="#000" stopOpacity="1" />
          <stop offset="0.35" stopColor="#000" stopOpacity="0.85" />
          <stop offset="1" stopColor="#000" stopOpacity="0" />
        </radialGradient>
        {L.map((l, i) => (
          <radialGradient key={i} id={`lw${uid}${i}`}>
            <stop offset="0" stopColor={l.warna} stopOpacity="0.42" />
            <stop offset="0.4" stopColor={l.warna} stopOpacity="0.14" />
            <stop offset="1" stopColor={l.warna} stopOpacity="0" />
          </radialGradient>
        ))}
        <mask id={`lm${uid}`} maskUnits="userSpaceOnUse" x={-width} y={-height} width={width * 3} height={height * 3}>
          <rect x={-width} y={-height} width={width * 3} height={height * 3} fill="#fff" />
          {L.map((l, i) => (
            <circle key={i} cx={l.cx} cy={l.cy} r={l.r} fill={`url(#lg${uid})`} />
          ))}
        </mask>
      </defs>
      <rect x={-width} y={-height} width={width * 3} height={height * 3} fill="#07060a" fillOpacity={gelap} mask={`url(#lm${uid})`} />
      {L.map((l, i) => (
        <circle key={i} cx={l.cx} cy={l.cy} r={l.r * 0.8} fill={`url(#lw${uid}${i})`} />
      ))}
    </svg>
  );
};

/** Api (nyala berlapis + bara naik) atau asap (gumpalan naik & melebar). Koordinat dunia, ikut kamera. */
export const EfekView: React.FC<{ e: NonNullable<Adegan['efek']>[number]; i: number }> = ({ e, i }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const t = frame / fps;
  const S = (e.skala ?? 1) * width * 0.1; // tinggi nyala dasar
  const cx = e.x * width, cy = e.y * height;
  if (e.jenis === 'api') {
    const lidah = (k: number, lebar: number, tinggi: number, fase: number) => {
      const g = getarApi(t, i * 3 + fase);
      const goyang = Math.sin(t * 9 + fase * 2 + i) * lebar * 0.18;
      const h = tinggi * g, w = lebar * (2 - g);
      return `M ${-w / 2} 0 C ${-w / 2} ${-h * 0.45} ${-w * 0.15 + goyang * 0.5} ${-h * 0.6} ${goyang} ${-h} C ${w * 0.2 + goyang * 0.5} ${-h * 0.6} ${w / 2} ${-h * 0.45} ${w / 2} 0 Q 0 ${w * 0.28 * k} ${-w / 2} 0 Z`;
    };
    return (
      <svg width={width} height={height} style={{ position: 'absolute', inset: 0, overflow: 'visible', pointerEvents: 'none' }}>
        <g transform={`translate(${cx} ${cy})`}>
          <circle cx={0} cy={-S * 0.4} r={S * 1.4 * getarApi(t, i)} fill="#ffb347" fillOpacity={0.16} />
          <path d={lidah(1, S * 0.62, S * 1.15, 0)} fill="#e8562a" stroke="#1d1d1f" strokeWidth={Math.max(2, S * 0.035)} strokeLinejoin="round" />
          <path d={lidah(0.8, S * 0.44, S * 0.85, 1)} fill="#ffa53a" />
          <path d={lidah(0.6, S * 0.24, S * 0.5, 2)} fill="#fff1b8" />
          {Array.from({ length: 5 }, (_, j) => {
            const f = (t * (0.7 + j * 0.13) + j * 0.37 + i * 0.21) % 1;
            return <circle key={j} cx={Math.sin(t * 3 + j * 2.3) * S * 0.3} cy={-S * (0.9 + f * 1.4)} r={S * 0.035 * (1 - f)} fill="#ffcf6b" fillOpacity={1 - f} />;
          })}
        </g>
      </svg>
    );
  }
  // asap
  return (
    <svg width={width} height={height} style={{ position: 'absolute', inset: 0, overflow: 'visible', pointerEvents: 'none' }}>
      <g transform={`translate(${cx} ${cy})`}>
        {Array.from({ length: 7 }, (_, j) => {
          const f = (t * 0.22 + j / 7 + i * 0.13) % 1;
          return (
            <circle
              key={j}
              cx={Math.sin(f * 5 + j) * S * 0.35 + f * S * 0.4}
              cy={-f * S * 3.2}
              r={S * (0.25 + f * 0.75)}
              fill="#8b8f96"
              fillOpacity={0.38 * Math.sin(Math.PI * f)}
            />
          );
        })}
      </g>
    </svg>
  );
};
