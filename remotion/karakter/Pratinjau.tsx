import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion';
import type { Ekspresi, Karakter, Pose } from '../../shared/tipe';
import { PARAM_EKSPRESI, PARAM_POSE, TokohSvg } from './Tokoh';

const TINGGI = { anak: 560, remaja: 700, dewasa: 800, tua: 770 } as const;
/** potong area kosong viewBox agar tokoh memenuhi bingkai (kepala s.d. kaki) */
function potong(usia: Karakter['usia'], W: number, Hpx: number): React.CSSProperties {
  const H = TINGGI[usia] ?? 700;
  const skala = Hpx / (H + 150);
  const w = 600 * skala;
  return { position: 'absolute', width: w, height: 1000 * skala, left: (W - w) / 2, top: -(960 - (H + 90)) * skala };
}

export type PropsPratinjauTokoh = { karakter: Karakter; pose: Pose; ekspresi: Ekspresi; bicara?: boolean; latar?: string };

/** Pratinjau satu tokoh untuk tab Karakter (diam/bicara, kedip & napas jalan). */
export const PratinjauTokoh: React.FC<PropsPratinjauTokoh> = ({ karakter, pose, ekspresi, bicara, latar }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const t = frame / fps;
  // amplop bicara tiruan: suku kata ±5 per detik, jeda tiap 2 detik
  const mulut = bicara && t % 2.4 < 1.8 ? Math.abs(Math.sin(t * Math.PI * 5)) * 0.9 : 0;
  return (
    <AbsoluteFill style={{ background: latar ?? '#ebe6dc' }}>
      <div style={{ position: 'absolute', left: 0, right: 0, top: '78%', bottom: 0, background: 'rgba(0,0,0,0.06)' }} />
      <TokohSvg
        k={karakter}
        hadap="kanan"
        s={{ pose: PARAM_POSE[pose], ekspresi: PARAM_EKSPRESI[ekspresi], lihat: [0.35, 0], t, bicara: mulut, jalan: pose === 'jalan' ? t * Math.PI * 3.2 : NaN }}
        style={potong(karakter.usia, width, height)}
      />
    </AbsoluteFill>
  );
};
