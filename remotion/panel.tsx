// Komponen UI bertahap: panel (angka, daftar, petak, hitung, banding, tanya, catatan), stiker, judul adegan, label garis.
// Semuanya dirender mesin dari spec — tidak digambar di SVG — sehingga huruf & warna selalu mengikuti gaya.
import React from 'react';
import { Img, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import type { ButirPanel, Gaya, Label, Panel, Stiker } from '../shared/tipe';
import { TATA_BAWAAN, campurWarna } from '../shared/gaya-bawaan';
import { huruf, hurufMono } from './huruf';
import { useAdegan, useBerkas, useGaya } from './konteks';

const HIJAU = '#1fb573';
const MERAH = '#e5484d';
export const tataDari = (g: Gaya) => ({ ...TATA_BAWAAN, ...(g.tata ?? {}) });

/** Tampilan dasar kartu/panel mengikuti gaya (kaca neon · tegas beroutline · lembut melayang). */
export function gayaKartu(g: Gaya, aksen?: string): React.CSSProperties {
  const tepi = aksen ?? g.warna.merek;
  if (g.tata?.kaca)
    return {
      background: campurWarna(g.warna.latar, '#ffffff', 0.07) + 'e6',
      border: `3px solid ${tepi}b3`,
      boxShadow: `0 0 36px ${tepi}4d, inset 0 0 44px ${tepi}14`,
      color: g.warna.teks,
      borderRadius: g.bentuk.sudut,
    };
  return {
    background: g.gelap ? '#1f232b' : '#ffffff',
    color: g.warna.teks,
    border: g.bentuk.outline ? `${g.bentuk.outline}px solid ${aksen ?? (g.gelap ? '#3a3f4a' : '#1c1c1e')}` : `2px solid ${aksen ?? (g.gelap ? 'rgba(255,255,255,0.08)' : 'rgba(30,40,90,0.07)')}`,
    boxShadow: g.bentuk.bayangan ? '8px 8px 0 rgba(0,0,0,0.18)' : '0 16px 46px rgba(30,40,90,0.13)',
    borderRadius: g.bentuk.sudut,
  };
}

/** Teks dengan *kata* berwarna. */
export const TeksKaya: React.FC<{ teks: string; warna: string }> = ({ teks, warna }) => (
  <>
    {teks.split(/(\*[^*]+\*)/).map((s, i) =>
      /^\*[^*]+\*$/.test(s) ? (
        <span key={i} style={{ color: warna }}>
          {s.slice(1, -1)}
        </span>
      ) : (
        <React.Fragment key={i}>{s}</React.Fragment>
      ),
    )}
  </>
);

/** 0 sebelum `pada`, lalu pegas menuju 1. */
function usePegas(pada: number, kaku = 150) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const f = frame - pada * fps;
  return f < 0 ? 0 : spring({ frame: f, fps, config: { damping: 14, stiffness: kaku } });
}

/** Bungkus elemen yang muncul di detik `pada`. Ruangnya sudah dipesan sejak awal agar tata letak tidak loncat. */
const Muncul: React.FC<{ pada: number; cara?: 'naik' | 'pop'; style?: React.CSSProperties; children: React.ReactNode }> = ({ pada, cara = 'naik', style, children }) => {
  const sp = usePegas(pada);
  return (
    <div style={{ ...style, opacity: Math.min(1, sp * 1.6), transform: cara === 'pop' ? `scale(${0.7 + 0.3 * sp})` : `translateY(${(1 - sp) * 46}px)` }}>{children}</div>
  );
};

const Tag: React.FC<{ teks: string; latar?: string; warna?: string }> = ({ teks, latar, warna }) => {
  const g = useGaya();
  return (
    <span
      style={{
        display: 'inline-block',
        background: latar ?? g.warna.merek,
        color: warna ?? '#ffffff',
        fontFamily: hurufMono(),
        fontSize: 24,
        letterSpacing: 2,
        padding: '5px 14px',
        borderRadius: g.bentuk.label === 'pil' ? 999 : 6,
        textTransform: 'uppercase',
        whiteSpace: 'nowrap',
      }}
    >
      {teks}
    </span>
  );
};

const Centang: React.FC<{ warna: string; ukuran?: number; silang?: boolean }> = ({ warna, ukuran = 34, silang }) => (
  <svg width={ukuran} height={ukuran} viewBox="0 0 24 24" style={{ flex: 'none' }}>
    <circle cx="12" cy="12" r="11" fill={warna} />
    {silang ? <path d="M8 8l8 8M16 8l-8 8" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" /> : <path d="M7 12.5l3.4 3.4L17 9" fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />}
  </svg>
);

// ---------------------------------------------------------------------------
// Panel

const PanelAngka: React.FC<{ p: Extract<Panel, { jenis: 'angka' }>; pada: number }> = ({ p, pada }) => {
  const g = useGaya();
  const f = huruf(g.huruf);
  const { fps } = useVideoConfig();
  const { durasi } = useAdegan();
  const t = useCurrentFrame() / fps;
  const akhir = Math.max(pada + 0.6, Math.min(durasi - 0.5, pada + 2.6));
  const n = Math.round(interpolate(t, [pada + 0.15, akhir], [p.dari ?? 0, p.ke], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }));
  return (
    <Muncul pada={pada} cara="pop" style={{ alignSelf: 'flex-start', transformOrigin: 'left top' }}>
      <div style={{ ...gayaKartu(g), padding: '20px 30px 22px', minWidth: 420, fontFamily: f.badan }}>
        {p.tag ? <Tag teks={p.tag} /> : null}
        <div style={{ fontFamily: f.judul, fontWeight: f.berat, fontSize: 92, lineHeight: 1.08, letterSpacing: -2, marginTop: 6, fontVariantNumeric: 'tabular-nums' }}>
          {p.awalan ?? ''}
          {n.toLocaleString('id-ID')}
          <span style={{ color: g.warna.merek }}>{p.akhiran ?? ''}</span>
        </div>
        {p.ket ? <div style={{ fontFamily: hurufMono(), fontSize: 24, letterSpacing: 1.5, opacity: 0.7, textTransform: 'uppercase' }}>{p.ket}</div> : null}
      </div>
    </Muncul>
  );
};

const Baris: React.FC<{ b: ButirPanel; pada: number; nomor?: number }> = ({ b, pada, nomor }) => {
  const g = useGaya();
  const f = huruf(g.huruf);
  const berkas = useBerkas();
  const coret = usePegas(pada + 0.7, 110);
  return (
    <Muncul pada={pada}>
      <div style={{ ...gayaKartu(g), padding: '24px 30px', display: 'flex', alignItems: 'center', gap: 24, fontFamily: f.badan, opacity: b.coret ? 1 - 0.45 * coret : 1 }}>
        {b.ikon ? (
          <Img src={berkas(b.ikon)} style={{ width: 76, height: 76, objectFit: 'contain', flex: 'none' }} />
        ) : nomor ? (
          <span style={{ width: 62, height: 62, borderRadius: 999, background: g.warna.sorot, color: g.warna.teksSorot, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 34, flex: 'none' }}>{nomor}</span>
        ) : null}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ position: 'relative', display: 'inline-block', fontSize: 46, fontWeight: 800, lineHeight: 1.18 }}>
            <TeksKaya teks={b.teks} warna={g.warna.merek} />
            {b.coret ? <span style={{ position: 'absolute', left: -4, top: '54%', height: 6, borderRadius: 3, background: MERAH, width: `calc(${coret * 100}% + 8px)` }} /> : null}
          </div>
          {b.ket ? <div style={{ fontSize: 28, fontWeight: 700, opacity: 0.68, marginTop: 4, lineHeight: 1.25 }}>{b.ket}</div> : null}
        </div>
        {b.coret ? <div style={{ opacity: coret, transform: `scale(${coret})` }}><Centang warna={MERAH} silang ukuran={46} /></div> : null}
      </div>
    </Muncul>
  );
};

const PanelDaftar: React.FC<{ p: Extract<Panel, { jenis: 'daftar' }>; pada: number }> = ({ p, pada }) => {
  const g = useGaya();
  const { kapan } = useAdegan();
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: p.panah ? 10 : 18 }}>
      {p.butir.map((b, i) => {
        const tb = kapan(b, pada + i * (p.jeda ?? 0.55));
        return (
          <React.Fragment key={i}>
            {p.panah && i > 0 ? (
              <Muncul pada={tb - 0.12} style={{ alignSelf: 'center', height: 44 }}>
                <svg width="44" height="44" viewBox="0 0 24 24">
                  <path d="M12 4v14M6 13l6 6 6-6" fill="none" stroke={g.warna.merek} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Muncul>
            ) : null}
            <Baris b={b} pada={tb} nomor={p.nomor ? i + 1 : undefined} />
          </React.Fragment>
        );
      })}
    </div>
  );
};

const PanelPetak: React.FC<{ p: Extract<Panel, { jenis: 'petak' }>; pada: number }> = ({ p, pada }) => {
  const g = useGaya();
  const f = huruf(g.huruf);
  const berkas = useBerkas();
  const { kapan } = useAdegan();
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${p.kolom ?? 2}, 1fr)`, gap: 22 }}>
      {p.butir.map((b, i) => (
        <Muncul key={i} pada={kapan(b, pada + i * (p.jeda ?? 0.5))} cara="pop">
          <div style={{ ...gayaKartu(g), padding: '34px 20px 28px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18, fontFamily: f.badan, textAlign: 'center', height: '100%', boxSizing: 'border-box' }}>
            {b.ikon ? <Img src={berkas(b.ikon)} style={{ width: 150, height: 150, objectFit: 'contain' }} /> : null}
            <div style={{ fontSize: 42, fontWeight: 800, lineHeight: 1.15 }}>
              <TeksKaya teks={b.teks} warna={g.warna.merek} />
            </div>
            {b.ket ? <div style={{ fontSize: 26, fontWeight: 700, opacity: 0.68 }}>{b.ket}</div> : null}
          </div>
        </Muncul>
      ))}
    </div>
  );
};

const PanelHitung: React.FC<{ p: Extract<Panel, { jenis: 'hitung' }>; pada: number }> = ({ p, pada }) => {
  const g = useGaya();
  const f = huruf(g.huruf);
  const { fps } = useVideoConfig();
  const { durasi } = useAdegan();
  const t = useCurrentFrame() / fps;
  const target = Math.min(p.jumlah, p.terisi ?? p.jumlah);
  const lama = Math.max(0.6, Math.min(2.4, durasi - pada - 1.2));
  const isi = Math.floor(interpolate(t, [pada + 0.35, pada + 0.35 + lama], [0, target + 0.999], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }));
  const kosong = g.gelap ? 'rgba(255,255,255,0.07)' : 'rgba(20,30,60,0.06)';
  return (
    <Muncul pada={pada}>
      <div style={{ ...gayaKartu(g), padding: 22, fontFamily: f.badan }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          {p.tag ? <Tag teks={p.tag} /> : <span />}
          <span style={{ fontFamily: hurufMono(), fontSize: 26, opacity: 0.85, fontVariantNumeric: 'tabular-nums' }}>
            {Math.min(isi, target)} / {p.jumlah}
          </span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${p.kolom ?? 4}, 1fr)`, gap: 12 }}>
          {Array.from({ length: p.jumlah }, (_, i) => {
            const penuh = i < isi && i < target;
            return (
              <div
                key={i}
                style={{
                  background: penuh ? g.warna.sorot : kosong,
                  color: penuh ? g.warna.teksSorot : g.warna.teks,
                  opacity: penuh ? 1 : 0.45,
                  borderRadius: Math.min(14, g.bentuk.sudut),
                  padding: '12px 0',
                  textAlign: 'center',
                  fontSize: 40,
                  fontWeight: 800,
                  fontVariantNumeric: 'tabular-nums',
                  transform: i === isi - 1 && isi <= target ? 'scale(1.08)' : undefined,
                }}
              >
                {i + 1}
              </div>
            );
          })}
        </div>
        {p.ket ? (
          <Muncul pada={pada + 0.35 + lama} style={{ marginTop: 16, textAlign: 'center', fontSize: 38, fontWeight: 800, lineHeight: 1.2 }}>
            <TeksKaya teks={p.ket} warna={g.warna.sorot} />
          </Muncul>
        ) : null}
      </div>
    </Muncul>
  );
};

const PanelBanding: React.FC<{ p: Extract<Panel, { jenis: 'banding' }>; pada: number }> = ({ p, pada }) => {
  const g = useGaya();
  const f = huruf(g.huruf);
  const { kapan } = useAdegan();
  const sisi = (s: { tag: string; teks: string }, warna: string, silang: boolean, mulai: number) => (
    <Muncul pada={mulai}>
      <div style={{ ...gayaKartu(g, warna), padding: '24px 28px', fontFamily: f.badan }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 12 }}>
          <Centang warna={warna} silang={silang} ukuran={44} />
          <span style={{ fontSize: 36, fontWeight: 800, color: warna, letterSpacing: 1, textTransform: 'uppercase' }}>{s.tag}</span>
        </div>
        <div style={{ fontSize: 40, fontWeight: 800, lineHeight: 1.25 }}>
          <TeksKaya teks={s.teks} warna={warna} />
        </div>
      </div>
    </Muncul>
  );
  const tBaik = kapan(p.baik, pada);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {sisi(p.baik, HIJAU, false, tBaik)}
      {sisi(p.buruk, MERAH, true, kapan(p.buruk, tBaik + 1.2))}
    </div>
  );
};

const PanelTanya: React.FC<{ p: Extract<Panel, { jenis: 'tanya' }>; pada: number }> = ({ p, pada }) => {
  const g = useGaya();
  const f = huruf(g.huruf);
  const WARNA = ['#3b82f6', '#e2a514', MERAH];
  return (
    <Muncul pada={pada}>
      <div style={{ ...gayaKartu(g, g.tata?.kaca ? g.warna.sorot : undefined), padding: '26px 28px 28px', fontFamily: f.badan }}>
        {p.tag ? <Tag teks={p.tag} /> : null}
        <div style={{ fontSize: 46, fontWeight: 800, lineHeight: 1.22, marginTop: p.tag ? 14 : 0 }}>
          <TeksKaya teks={p.teks} warna={g.warna.merek} />
        </div>
        {p.pilihan?.length ? (
          <div style={{ display: 'flex', gap: 14, marginTop: 20 }}>
            {p.pilihan.map((c, i) => (
              <Muncul key={i} pada={pada + 0.4 + i * 0.22} cara="pop" style={{ flex: 1 }}>
                <div style={{ background: WARNA[i % 3], color: '#ffffff', borderRadius: Math.min(14, g.bentuk.sudut), border: g.bentuk.outline ? `${g.bentuk.outline}px solid #1c1c1e` : undefined, padding: '12px 6px', textAlign: 'center', fontSize: 30, fontWeight: 800, whiteSpace: 'nowrap' }}>{c}</div>
              </Muncul>
            ))}
          </div>
        ) : null}
      </div>
    </Muncul>
  );
};

const PanelCatatan: React.FC<{ p: Extract<Panel, { jenis: 'catatan' }>; pada: number }> = ({ p, pada }) => {
  const g = useGaya();
  const f = huruf(g.huruf);
  return (
    <Muncul pada={pada}>
      <div style={{ ...gayaKartu(g), padding: '20px 28px', fontFamily: f.badan, fontSize: 40, fontWeight: 800, lineHeight: 1.25, textAlign: 'center' }}>
        <TeksKaya teks={p.teks} warna={g.warna.sorot === g.warna.teks ? g.warna.merek : g.gelap ? g.warna.sorot : g.warna.merek} />
      </div>
    </Muncul>
  );
};

const PanelTerminal: React.FC<{ p: Extract<Panel, { jenis: 'terminal' }>; pada: number }> = ({ p, pada }) => {
  const g = useGaya();
  const { kapan } = useAdegan();
  const r = Math.max(14, Math.min(24, g.bentuk.sudut || 16));
  return (
    <Muncul pada={pada}>
      <div
        style={{
          background: '#141821',
          color: '#e5e9f0',
          borderRadius: r,
          border: g.bentuk.outline ? `${g.bentuk.outline}px solid #1c1c1e` : '2px solid rgba(255,255,255,0.14)',
          boxShadow: g.bentuk.bayangan ? '8px 8px 0 rgba(0,0,0,0.22)' : '0 20px 50px rgba(10,16,34,0.28)',
          overflow: 'hidden',
          fontFamily: hurufMono(),
        }}
      >
        <div style={{ background: '#1e2433', padding: '14px 22px', display: 'flex', alignItems: 'center', gap: 10, borderBottom: '2px solid rgba(255,255,255,0.08)' }}>
          <span style={{ width: 16, height: 16, borderRadius: 999, background: '#ff5f56' }} />
          <span style={{ width: 16, height: 16, borderRadius: 999, background: '#ffbd2e' }} />
          <span style={{ width: 16, height: 16, borderRadius: 999, background: '#27c93f' }} />
          <span style={{ marginLeft: 10, fontSize: 24, letterSpacing: 1, color: '#9ca3af' }}>{p.judul ?? 'terminal'}</span>
        </div>
        <div style={{ padding: '22px 26px 26px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {p.baris.map((item, i) => {
            const b = typeof item === 'string' ? { teks: item } : item;
            const tb = kapan(b, pada + 0.25 + i * (p.jeda ?? 0.45));
            const cmd = /^(\$|>)\s/.test(b.teks);
            const ok = /^\[(\+|✓|OK)\]/i.test(b.teks);
            const warn = /^\[(!|-|ERR)\]/i.test(b.teks);
            const warnaDasar = cmd ? '#4ade80' : ok ? '#38bdf8' : warn ? '#f87171' : '#e5e9f0';
            return (
              <Muncul key={i} pada={tb}>
                <div style={{ fontSize: 31, lineHeight: 1.32, color: warnaDasar, wordBreak: 'break-word' }}>
                  <TeksKaya teks={b.teks} warna={g.warna.sorot} />
                  {b.ket ? <div style={{ fontSize: 23, color: '#94a3b8', marginTop: 2 }}>{b.ket}</div> : null}
                </div>
              </Muncul>
            );
          })}
        </div>
      </div>
    </Muncul>
  );
};

const SatuPanel: React.FC<{ p: Panel; urut: number }> = ({ p, urut }) => {
  const { kapan } = useAdegan();
  const pada = kapan(p, 0.4 + urut * 0.9);
  switch (p.jenis) {
    case 'angka':
      return <PanelAngka p={p} pada={pada} />;
    case 'daftar':
      return <PanelDaftar p={p} pada={pada} />;
    case 'petak':
      return <PanelPetak p={p} pada={pada} />;
    case 'hitung':
      return <PanelHitung p={p} pada={pada} />;
    case 'banding':
      return <PanelBanding p={p} pada={pada} />;
    case 'tanya':
      return <PanelTanya p={p} pada={pada} />;
    case 'catatan':
      return <PanelCatatan p={p} pada={pada} />;
    case 'terminal':
      return <PanelTerminal p={p} pada={pada} />;
  }
};

export const LapisanPanel: React.FC<{ panel: Panel[]; panelY?: number }> = ({ panel, panelY }) => {
  const { height } = useVideoConfig();
  const alir = panel.filter((p) => p.y === undefined);
  const bebas = panel.filter((p) => p.y !== undefined);
  const sisiX = 64;
  return (
    <>
      {alir.length ? (
        <div style={{ position: 'absolute', left: sisiX, right: sisiX, top: (panelY ?? 0.34) * height, display: 'flex', flexDirection: 'column', gap: 22 }}>
          {alir.map((p, i) => (
            <SatuPanel key={i} p={p} urut={i} />
          ))}
        </div>
      ) : null}
      {bebas.map((p, i) => (
        <div key={'b' + i} style={{ position: 'absolute', left: sisiX, right: sisiX, top: p.y! * height, display: 'flex', flexDirection: 'column' }}>
          <SatuPanel p={p} urut={alir.length + i} />
        </div>
      ))}
    </>
  );
};

// ---------------------------------------------------------------------------
// Stiker ledakan

export const StikerView: React.FC<{ s: Stiker }> = ({ s }) => {
  const g = useGaya();
  const f = huruf(g.huruf);
  const { width, height } = useVideoConfig();
  const { kapan } = useAdegan();
  const pada = kapan(s, 0.6);
  const sp = usePegas(pada, 220);
  if (sp === 0) return null;
  const palet = s.warna === 'merah' ? { isi: MERAH, teks: '#ffffff' } : s.warna === 'hijau' ? { isi: HIJAU, teks: '#ffffff' } : { isi: g.warna.sorot, teks: g.warna.teksSorot };
  if (s.bentuk === 'stempel') {
    const skala = s.ukuran ?? 1;
    const warnaStempel = s.warna === 'hijau' ? HIJAU : s.warna === 'sorot' ? g.warna.merek : MERAH;
    return (
      <div
        style={{
          position: 'absolute',
          left: s.x * width,
          top: s.y * height,
          transform: `translate(-50%, -50%) scale(${(1.35 - 0.35 * sp) * skala}) rotate(-8deg)`,
          opacity: Math.min(1, sp * 1.5),
          border: `6px solid ${warnaStempel}`,
          borderRadius: 12,
          padding: '8px 20px',
          background: g.gelap ? 'rgba(15,18,26,0.9)' : 'rgba(255,250,248,0.94)',
          boxShadow: '0 10px 24px rgba(0,0,0,0.18)',
          pointerEvents: 'none',
        }}
      >
        <div
          style={{
            border: `2px dashed ${warnaStempel}`,
            borderRadius: 6,
            padding: '6px 18px',
            fontFamily: f.judul,
            fontWeight: f.berat,
            fontSize: 40,
            letterSpacing: 2,
            color: warnaStempel,
            whiteSpace: 'nowrap',
            textTransform: 'uppercase',
          }}
        >
          {s.teks}
        </div>
      </div>
    );
  }
  const w = (s.ukuran ?? 1) * Math.max(230, 90 + s.teks.length * 34);
  const h = w * 0.62;
  const N = 14;
  const titik = Array.from({ length: N * 2 }, (_, i) => {
    const r = i % 2 ? 0.78 : 1;
    const a = (i / (N * 2)) * Math.PI * 2;
    return `${50 + Math.cos(a) * 50 * r},${50 + Math.sin(a) * 50 * r}`;
  }).join(' ');
  return (
    <div style={{ position: 'absolute', left: s.x * width - w / 2, top: s.y * height - h / 2, width: w, height: h, transform: `scale(${sp}) rotate(${-7 + 3 * Math.sin(sp * 3)}deg)` }}>
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', overflow: 'visible' }}>
        <polygon points={titik} fill={palet.isi} stroke="#1c1c1e" strokeWidth={g.bentuk.outline ? 2.2 : 0} strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: f.judul, fontWeight: f.berat, fontSize: Math.min(58, (w * 0.62) / Math.max(3, s.teks.length) * 1.5), color: palet.teks, letterSpacing: -1, whiteSpace: 'nowrap' }}>{s.teks}</div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Label bergaris penunjuk (tata.label = 'garis')

export const LabelGaris: React.FC<{ label: Label }> = ({ label }) => {
  const g = useGaya();
  const f = huruf(g.huruf);
  const { width, height } = useVideoConfig();
  const { kapan } = useAdegan();
  const sp = usePegas(kapan(label, 0.4), 170);
  if (sp === 0) return null;
  const arah = label.arah ?? 'bawah';
  const px = label.x * width;
  const py = label.y * height;
  const JARAK = 96;
  const perkiraanLebar = label.teks.length * 21 + 56;
  // pusat pil
  let cx = px;
  let cy = py;
  if (arah === 'atas') cy = py - JARAK;
  if (arah === 'bawah') cy = py + JARAK;
  if (arah === 'kiri') cx = px - JARAK - perkiraanLebar / 2;
  if (arah === 'kanan') cx = px + JARAK + perkiraanLebar / 2;
  cx = Math.min(width - 40 - perkiraanLebar / 2, Math.max(40 + perkiraanLebar / 2, cx));
  const garis = g.gelap ? g.warna.merek : '#1c1c1e';
  const ujungX = px + (cx - px) * sp;
  const ujungY = py + (cy - py) * sp;
  return (
    <>
      <svg width={width} height={height} style={{ position: 'absolute', inset: 0, overflow: 'visible' }}>
        <line x1={px} y1={py} x2={ujungX} y2={ujungY} stroke={garis} strokeWidth={4} strokeLinecap="round" />
        <circle cx={px} cy={py} r={9 * sp} fill={g.gelap ? g.warna.sorot : '#ffffff'} stroke={garis} strokeWidth={4} />
      </svg>
      <div
        style={{
          position: 'absolute',
          left: cx,
          top: cy,
          transform: `translate(-50%, -50%) scale(${sp})`,
          ...(g.tata?.kaca
            ? { background: campurWarna(g.warna.label, '#000000', 0.15) + 'f2', color: g.warna.teksLabel, border: `3px solid ${g.warna.merek}`, boxShadow: `0 0 24px ${g.warna.merek}66` }
            : { background: g.warna.label, color: g.warna.teksLabel, border: g.bentuk.outline ? `${g.bentuk.outline}px solid #1c1c1e` : undefined, boxShadow: g.bentuk.bayangan ? '5px 5px 0 rgba(0,0,0,0.2)' : '0 10px 30px rgba(30,40,90,0.16)' }),
          fontFamily: f.badan,
          fontWeight: 800,
          fontSize: 32,
          letterSpacing: 0.5,
          padding: '10px 24px',
          borderRadius: g.bentuk.label === 'pil' ? 999 : Math.min(g.bentuk.sudut, 12),
          whiteSpace: 'nowrap',
          textTransform: 'uppercase',
        }}
      >
        {label.teks}
      </div>
    </>
  );
};

// ---------------------------------------------------------------------------
// Judul (tata.judul = ringkas | pil | tengah)

export const JudulTata: React.FC<{ tag?: string; teks: string; sorot?: string | null; nomor?: number }> = ({ tag, teks, sorot, nomor }) => {
  const g = useGaya();
  const f = huruf(g.huruf);
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const sp = spring({ frame, fps, config: { damping: 15, stiffness: 140 } });
  const tata = tataDari(g).judul;
  const ada = sorot && teks.includes(sorot) ? sorot : null;
  const [a, b] = ada ? [teks.slice(0, teks.indexOf(ada)), teks.slice(teks.indexOf(ada) + ada.length)] : [teks, ''];
  const masuk: React.CSSProperties = { opacity: Math.min(1, sp * 1.4), transform: `translateY(${(1 - sp) * 26}px)` };
  const lencanaNomor = nomor ? (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 64,
        height: 64,
        borderRadius: 999,
        background: g.warna.merek,
        color: '#ffffff',
        fontFamily: f.judul,
        fontWeight: f.berat,
        fontSize: 38,
        marginRight: 18,
        verticalAlign: 'middle',
        border: g.bentuk.outline ? `${g.bentuk.outline}px solid #1c1c1e` : undefined,
        boxShadow: g.bentuk.bayangan ? '4px 4px 0 rgba(0,0,0,0.2)' : undefined,
      }}
    >
      {nomor}
    </span>
  ) : null;

  if (tata === 'ringkas')
    return (
      <div style={{ position: 'absolute', top: 168, left: 64, right: 64, ...masuk }}>
        {tag ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontFamily: hurufMono(), fontSize: 25, letterSpacing: 3, color: g.warna.teks, opacity: 0.78, textTransform: 'uppercase', marginBottom: 10 }}>
            <span style={{ width: 8, height: 28, background: g.warna.merek, borderRadius: 2, flex: 'none' }} />
            {tag}
          </div>
        ) : null}
        <div style={{ fontFamily: f.judul, fontWeight: f.berat, fontSize: 66, lineHeight: 1.1, letterSpacing: -1.5, color: g.warna.teks }}>
          {lencanaNomor}
          {a}
          {ada ? <span style={{ color: g.warna.merek }}>{ada}</span> : null}
          {b}
        </div>
      </div>
    );

  if (tata === 'pil')
    return (
      <div style={{ position: 'absolute', top: 250, left: 50, right: 50, textAlign: 'center', ...masuk }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 14,
            background: g.warna.sorot,
            color: g.warna.teksSorot,
            fontFamily: f.badan,
            fontWeight: 800,
            fontSize: 36,
            letterSpacing: 0.5,
            textTransform: 'uppercase',
            padding: '12px 30px',
            borderRadius: 999,
            boxShadow: `0 0 34px ${g.warna.sorot}80`,
          }}
        >
          <span style={{ width: 18, height: 18, borderRadius: 999, border: `5px solid ${g.warna.teksSorot}`, flex: 'none' }} />
          {tag ?? teks}
        </div>
        {tag ? (
          <div style={{ marginTop: 16, fontFamily: f.badan, fontWeight: 800, fontSize: 44, lineHeight: 1.2, color: g.warna.teks }}>
            {lencanaNomor}
            {a}
            {ada ? <span style={{ color: g.warna.sorot }}>{ada}</span> : null}
            {b}
          </div>
        ) : null}
      </div>
    );

  // tengah
  return (
    <div style={{ position: 'absolute', top: 205, left: 60, right: 60, textAlign: 'center', ...masuk }}>
      {tag ? <div style={{ fontFamily: f.badan, fontWeight: 800, fontSize: 30, letterSpacing: 1, color: g.warna.merek, marginBottom: 8 }}>{tag}</div> : null}
      <div style={{ fontFamily: f.judul, fontWeight: f.berat, fontSize: 88, lineHeight: 1.1, letterSpacing: -2.5, color: g.warna.teks }}>
        {lencanaNomor}
        {a}
        {ada ? <span style={{ backgroundImage: `linear-gradient(90deg, ${g.warna.merek}, ${g.warna.sorot})`, WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>{ada}</span> : null}
        {b}
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Latar & bingkai panggung

export const LatarGaya: React.FC = () => {
  const g = useGaya();
  const L = g.latar ?? { jenis: 'dua-nada' as const, pola: 'tidak' as const };
  const w = g.warna;
  const garisPola = g.gelap ? 'rgba(255,255,255,0.07)' : 'rgba(40,60,120,0.075)';
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      {L.jenis === 'dua-nada' ? (
        <>
          <div style={{ position: 'absolute', inset: 0, background: w.latar }} />
          <div style={{ position: 'absolute', left: 0, right: 0, top: '62%', bottom: 0, background: w.lantai, boxShadow: `inset 0 14px 0 ${g.gelap ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)'}` }} />
        </>
      ) : L.jenis === 'gradien' ? (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `radial-gradient(60% 34% at 88% 6%, ${w.merek}2e, transparent 70%), radial-gradient(70% 36% at 8% 78%, ${w.sorot}24, transparent 72%), linear-gradient(180deg, ${w.latar} 0%, ${campurWarna(w.latar, w.lantai, 0.5)} 55%, ${w.lantai} 100%)`,
          }}
        />
      ) : (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `radial-gradient(75% 42% at 50% 36%, ${campurWarna(w.latar, w.merek, 0.22)} 0%, ${w.latar} 55%, ${w.lantai} 100%)`,
          }}
        />
      )}
      {L.pola === 'kisi' ? (
        <div style={{ position: 'absolute', inset: 0, backgroundImage: `linear-gradient(${garisPola} 2px, transparent 2px), linear-gradient(90deg, ${garisPola} 2px, transparent 2px)`, backgroundSize: '54px 54px' }} />
      ) : null}
      {L.pola === 'wajik' ? (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `linear-gradient(26deg, ${garisPola} 2px, transparent 2px), linear-gradient(-26deg, ${garisPola} 2px, transparent 2px)`,
            backgroundSize: '180px 88px',
            opacity: 0.8,
          }}
        />
      ) : null}
      {L.pola === 'lantai-kisi' ? (
        <div style={{ position: 'absolute', left: 0, right: 0, top: '66%', bottom: 0, perspective: 900, overflow: 'hidden' }}>
          <div
            style={{
              position: 'absolute',
              left: '-50%',
              right: '-50%',
              top: 0,
              height: '220%',
              transform: 'rotateX(62deg)',
              transformOrigin: '50% 0%',
              backgroundImage: `linear-gradient(${w.merek}55 3px, transparent 3px), linear-gradient(90deg, ${w.merek}55 3px, transparent 3px)`,
              backgroundSize: '120px 120px',
              maskImage: 'linear-gradient(180deg, #000 0%, transparent 78%)',
              WebkitMaskImage: 'linear-gradient(180deg, #000 0%, transparent 78%)',
            }}
          />
          <div style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 4, background: `${w.merek}99`, boxShadow: `0 0 26px ${w.merek}` }} />
        </div>
      ) : null}
      {L.jenis === 'sorot' ? <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(90% 60% at 50% 42%, transparent 55%, rgba(0,0,0,0.42) 100%)' }} /> : null}
    </div>
  );
};

/** Wilayah bingkai panggung (pecahan kanvas). */
export const BINGKAI = { kiri: 0.055, atas: 0.165, kanan: 0.055, bawah: 0.375 };

/** Kartu membulat tempat visual adegan tampil (tata.panggung = 'bingkai'). `depan` = hanya garis tepi di atas isi. */
export const BingkaiPanggung: React.FC<{ depan?: boolean }> = ({ depan }) => {
  const g = useGaya();
  const r = Math.max(28, g.bentuk.sudut * 1.4);
  const pos: React.CSSProperties = { position: 'absolute', left: `${BINGKAI.kiri * 100}%`, right: `${BINGKAI.kanan * 100}%`, top: `${BINGKAI.atas * 100}%`, bottom: `${BINGKAI.bawah * 100}%`, borderRadius: r };
  if (depan) return <div style={{ ...pos, border: `3px solid ${g.gelap ? g.warna.merek + '80' : 'rgba(20,30,60,0.14)'}`, boxShadow: g.gelap ? `0 0 44px ${g.warna.merek}40, inset 0 0 60px rgba(0,0,0,0.25)` : '0 24px 60px rgba(30,40,90,0.16)' }} />;
  return <div style={{ ...pos, background: g.gelap ? campurWarna(g.warna.lantai, '#000000', 0.25) : '#ffffff' }} />;
};

export const klipBingkai = (g: Gaya): React.CSSProperties => ({
  clipPath: `inset(${BINGKAI.atas * 100}% ${BINGKAI.kanan * 100}% ${BINGKAI.bawah * 100}% ${BINGKAI.kiri * 100}% round ${Math.max(28, g.bentuk.sudut * 1.4)}px)`,
});
