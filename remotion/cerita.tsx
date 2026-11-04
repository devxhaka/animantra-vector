import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, Easing } from 'remotion';
import type { Adegan, Ekspresi, Karakter, Lihat, Pose, Suasana, TokohAdegan } from '../shared/tipe';
import { PARAM_EKSPRESI, PARAM_POSE, TokohSvg, VIEWBOX, campurEkspresi, campurPose, type StatusTokoh } from './karakter/Tokoh';
import { KARAKTER_CADANGAN } from '../shared/karakter-bawaan';

const TRANSISI = 0.32; // detik perpindahan pose/ekspresi

export type KeadaanAkhir = { pose: Pose; ekspresi: Ekspresi; lihat: Lihat; hadap: 'kiri' | 'kanan' };

/** Keadaan tokoh di akhir adegan (dipakai sebagai titik awal di adegan berikutnya, agar tidak "loncat"). */
export function keadaanAkhir(t: TokohAdegan): KeadaanAkhir {
  const k: KeadaanAkhir = { pose: t.pose ?? 'diam', ekspresi: t.ekspresi ?? 'netral', lihat: t.lihat ?? 'depan', hadap: t.hadap ?? 'kanan' };
  for (const u of [...(t.urutan ?? [])].sort((a, b) => a.pada - b.pada)) {
    if (u.pose) k.pose = u.pose;
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
    kini = { pose: u.pose ?? kini.pose, ekspresi: u.ekspresi ?? kini.ekspresi, lihat: u.lihat ?? kini.lihat, hadap: u.hadap ?? kini.hadap };
    kejadian.push({ pada: u.pada, k: { ...kini } });
  }
  let i = 0;
  for (let j = 0; j < kejadian.length; j++) if (kejadian[j].pada <= detik) i = j;
  const target = kejadian[i].k;
  const dari = i === 0 ? awal ?? target : kejadian[i - 1].k;
  const p = halus(Math.min(1, Math.max(0, (detik - kejadian[i].pada) / TRANSISI)));
  const la = LIHAT[dari.lihat], lb = LIHAT[target.lihat];
  return {
    pose: campurPose(PARAM_POSE[dari.pose], PARAM_POSE[target.pose], p),
    ekspresi: campurEkspresi(PARAM_EKSPRESI[dari.ekspresi], PARAM_EKSPRESI[target.ekspresi], p),
    lihat: [la[0] + (lb[0] - la[0]) * p, la[1] + (lb[1] - la[1]) * p] as [number, number],
    hadap: p < 0.5 ? dari.hadap : target.hadap,
    berjalan: target.pose === 'jalan',
  };
}

export const TokohAdeganView: React.FC<{
  tokoh: TokohAdegan;
  karakter: Karakter;
  adegan: Adegan;
  awal?: KeadaanAkhir;
}> = ({ tokoh, karakter, adegan, awal }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const t = frame / fps;
  const st = statusPada(tokoh, t, awal);

  let x = tokoh.x;
  let fase = st.berjalan ? t * Math.PI * 3.2 : NaN;
  if (tokoh.jalan) {
    const { ke, mulai, selesai } = tokoh.jalan;
    const p = Math.min(1, Math.max(0, (t - mulai) / Math.max(0.01, selesai - mulai)));
    x = tokoh.x + (ke - tokoh.x) * p;
    if (t >= mulai && t <= selesai) fase = (t - mulai) * Math.PI * 3.2;
  }
  const bicara = adegan.pembicara === tokoh.id && adegan.mulut?.length ? (adegan.mulut[frame] ?? 0) : 0;

  const s: StatusTokoh = { pose: st.pose, ekspresi: st.ekspresi, lihat: st.lihat, t, bicara, jalan: fase, siluet: tokoh.siluet };
  const lebar = width * 0.62 * (tokoh.skala ?? 1);
  const tinggi = (lebar * VIEWBOX.h) / VIEWBOX.w;
  const kakiY = (tokoh.y ?? 0.8) * height;
  // titik (0,0) viewBox = kaki → posisikan kotak svg
  const kiri = x * width - lebar * (-VIEWBOX.x / VIEWBOX.w);
  const atas = kakiY - tinggi * (-VIEWBOX.y / VIEWBOX.h);
  return <TokohSvg k={karakter} s={s} hadap={st.hadap} style={{ position: 'absolute', left: kiri, top: atas, width: lebar, height: tinggi }} />;
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
    </AbsoluteFill>
  );
};
