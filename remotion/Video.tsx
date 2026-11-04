import React from 'react';
import {
  AbsoluteFill,
  Html5Audio,
  Img,
  Sequence,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
  Easing,
} from 'remotion';
import type { Adegan, Aset, Gaya, Keyframe, Label, Spec } from '../shared/tipe';
import { huruf, hurufMono, hurufTeks } from './huruf';
import { formatDari } from '../shared/formats';
import { TEKS_KLASIK, teksKontras } from '../shared/gaya-bawaan';
import { LapisanSuasana, TokohAdeganView, cariKarakter, guncangan, keadaanAkhir, type KeadaanAkhir } from './cerita';

export type PropsVideo = {
  spec: Spec;
  /** Kosong saat render (pakai staticFile). Di studio: "/media/<slug>/". */
  basis?: string;
};

const BerkasCtx = React.createContext<(p: string) => string>((p) => staticFile(p));
const useBerkas = () => React.useContext(BerkasCtx);
const GayaCtx = React.createContext<Gaya | null>(null);
const useGaya = () => React.useContext(GayaCtx)!;

export const totalFrame = (spec: Spec) =>
  Math.max(1, spec.adegan.reduce((s, a) => s + Math.max(1, Math.round(a.durasi * spec.fps)), 0));

export const VideoUtama: React.FC<PropsVideo> = ({ spec, basis }) => {
  const berkas = React.useCallback(
    (p: string) => (/^(https?:|data:|\/)/.test(p) ? p : basis ? basis + p : staticFile(p)),
    [basis],
  );
  let mulai = 0;
  // keadaan akhir tiap tokoh per adegan → titik awal di adegan berikutnya (pose tidak loncat)
  const awalPer = React.useMemo(() => {
    const hasil: Record<string, KeadaanAkhir>[] = [];
    let akhir: Record<string, KeadaanAkhir> = {};
    for (const a of spec.adegan) {
      hasil.push(akhir);
      akhir = { ...akhir };
      for (const t of a.tokoh ?? []) akhir[t.id] = keadaanAkhir(t);
    }
    return hasil;
  }, [spec.adegan]);
  return (
    <BerkasCtx.Provider value={berkas}>
      <GayaCtx.Provider value={spec.gaya}>
        <AbsoluteFill style={{ background: spec.gaya.warna.latar }}>
          {spec.adegan.map((a, i) => {
            const dur = Math.max(1, Math.round(a.durasi * spec.fps));
            const el = (
              <Sequence key={a.id + i} from={mulai} durationInFrames={dur} name={`${i + 1}. ${a.id}`}>
                <AdeganView spec={spec} adegan={a} indeks={i} awal={awalPer[i]} />
              </Sequence>
            );
            mulai += dur;
            return el;
          })}
          {spec.musik?.file ? <Html5Audio src={berkas(spec.musik.file)} volume={spec.musik.volume ?? 0.12} loop /> : null}
          {spec.logo && spec.gaya.logo ? <Logo file={spec.logo} /> : null}
        </AbsoluteFill>
      </GayaCtx.Provider>
    </BerkasCtx.Provider>
  );
};

// ---------------------------------------------------------------------------

const AdeganView: React.FC<{ spec: Spec; adegan: Adegan; indeks: number; awal?: Record<string, KeadaanAkhir> }> = ({ spec, adegan, indeks, awal }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames, width } = useVideoConfig();
  const berkas = useBerkas();
  const t = frame / fps;

  const transisi = indeks === 0 ? 'potong' : adegan.transisi ?? 'fade';
  const masukT = interpolate(frame, [0, 8], [0, 1], { extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic) });
  const opasitas = transisi === 'fade' ? masukT : 1;
  const geser = transisi === 'geser' ? (1 - masukT) * width : 0;

  // Kamera
  const k0 = { zoom: 1, x: 0, y: 0, ...(adegan.kamera?.dari ?? {}) };
  const k1 = { ...k0, ...(adegan.kamera?.ke ?? {}) };
  const kp = interpolate(frame, [0, durationInFrames], [0, 1], { extrapolateRight: 'clamp', easing: Easing.inOut(Easing.cubic) });
  const zoom = k0.zoom + (k1.zoom - k0.zoom) * kp;
  const kx = k0.x + (k1.x - k0.x) * kp;
  const ky = k0.y + (k1.y - k0.y) * kp;

  const aset = [...(adegan.aset ?? [])].sort((a, b) => (a.z ?? 0) - (b.z ?? 0));
  const tokoh = [...(adegan.tokoh ?? [])].sort((a, b) => (a.z ?? 0) - (b.z ?? 0) || (a.y ?? 0.8) - (b.y ?? 0.8));
  const g = guncangan(adegan.suasana, t);
  const pembicara = adegan.pembicara && adegan.pembicara !== 'narator' ? cariKarakter(spec.pemeran, adegan.pembicara) : null;

  return (
    <AbsoluteFill style={{ opacity: opasitas, transform: `translateX(${geser}px)` }}>
      {adegan.latar ? null : <Latar />}
      <AbsoluteFill
        style={{
          transform: `translate(${g.x}px, ${g.y}px) rotate(${g.r}deg) scale(${zoom * (adegan.suasana?.gempa ? 1.03 : 1)}) translate(${-kx * 100}%, ${-ky * 100}%)`,
          transformOrigin: '50% 50%',
        }}
      >
        {adegan.latar ? <Img src={berkas(adegan.latar)} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} /> : null}
        {aset.filter((a) => (a.z ?? 0) < 5).map((a, i) => (
          <AsetView key={'a' + i} aset={a} t={t} />
        ))}
        {tokoh.map((tk) => (
          <TokohAdeganView key={tk.id} tokoh={tk} karakter={cariKarakter(spec.pemeran, tk.id)} adegan={adegan} awal={awal?.[tk.id]} />
        ))}
        {aset.filter((a) => (a.z ?? 0) >= 5).map((a, i) => (
          <AsetView key={'d' + i} aset={a} t={t} />
        ))}
        {(adegan.label ?? []).map((l, i) => (
          <LabelView key={i} label={l} t={t} />
        ))}
      </AbsoluteFill>
      {adegan.suasana ? <LapisanSuasana s={adegan.suasana} /> : null}
      {adegan.tampilJudul ? <Judul spec={spec} terang={!!adegan.latar} /> : null}
      {adegan.teksBesar ? <TeksBesar teks={adegan.teksBesar} /> : null}
      {adegan.kartu ? <Kartu {...adegan.kartu} atas={!!adegan.tokoh?.length} /> : null}
      <Subtitle narasi={adegan.narasi} kata={adegan.kata} nama={pembicara?.nama} warnaNama={pembicara?.warna.atasan} />
      {adegan.suara ? <Html5Audio src={berkas(adegan.suara)} /> : null}
      {(adegan.sfx ?? []).map((s, i) => (
        <Sequence key={i} from={Math.round(s.pada * fps)} layout="none">
          <Html5Audio src={berkas(s.file)} volume={s.volume ?? 0.6} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};

const Latar: React.FC = () => {
  const g = useGaya();
  return (
    <AbsoluteFill>
      <div style={{ position: 'absolute', inset: 0, background: g.warna.latar }} />
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: '62%',
          bottom: 0,
          background: g.warna.lantai,
          boxShadow: `inset 0 14px 0 ${g.gelap ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)'}`,
        }}
      />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------

const easingDari = (e: Keyframe['easing']) =>
  e === 'linear'
    ? Easing.linear
    : e === 'masuk'
      ? Easing.in(Easing.cubic)
      : e === 'keluar'
        ? Easing.out(Easing.cubic)
        : e === 'pegas'
          ? Easing.out(Easing.back(1.8))
          : Easing.inOut(Easing.cubic);

function nilaiKeyframe(daftar: Keyframe[], prop: Keyframe['prop'], t: number, awal: number) {
  const k = daftar.filter((x) => x.prop === prop).sort((a, b) => a.mulai - b.mulai);
  if (!k.length) return awal;
  if (t <= k[0].mulai) return k[0].dari;
  let aktif = k[0];
  for (const x of k) if (x.mulai <= t) aktif = x;
  if (t >= aktif.selesai) return aktif.ke;
  const p = (t - aktif.mulai) / Math.max(0.001, aktif.selesai - aktif.mulai);
  return aktif.dari + (aktif.ke - aktif.dari) * easingDari(aktif.easing)(p);
}

const AsetView: React.FC<{ aset: Aset; t: number }> = ({ aset, t }) => {
  const { fps, width, height } = useVideoConfig();
  const berkas = useBerkas();
  const anim = aset.animasi ?? [];
  let x = nilaiKeyframe(anim, 'x', t, aset.x);
  let y = nilaiKeyframe(anim, 'y', t, aset.y);
  let skala = nilaiKeyframe(anim, 'skala', t, 1);
  let rot = nilaiKeyframe(anim, 'rotasi', t, aset.rotasi ?? 0);
  let op = nilaiKeyframe(anim, 'opasitas', t, 1);

  const masuk = aset.masuk ?? 'pop';
  const sp = spring({ frame: t * fps, fps, config: { damping: 13, stiffness: 140 } });
  if (masuk === 'pop') {
    skala *= 0.6 + 0.4 * sp;
    op *= Math.min(1, sp * 1.6);
  }
  if (masuk === 'fade') op *= Math.min(1, t / 0.4);
  if (masuk === 'geser-kiri') x -= (1 - sp) * 0.7;
  if (masuk === 'geser-kanan') x += (1 - sp) * 0.7;
  if (masuk === 'geser-bawah') y += (1 - sp) * 0.5;

  if (aset.loop === 'goyang') rot += Math.sin(t * 3.2) * 2.5;
  if (aset.loop === 'melayang') y += Math.sin(t * 2.2) * 0.006;
  if (aset.loop === 'putar') rot += t * 120;
  if (aset.loop === 'denyut') skala *= 1 + Math.sin(t * 5) * 0.025;

  const w = aset.lebar * width;
  return (
    <Img
      src={berkas(aset.file)}
      style={{
        position: 'absolute',
        width: w,
        left: x * width - w / 2,
        top: y * height,
        transform: `translateY(-50%) rotate(${rot}deg) scale(${skala})`,
        opacity: op,
      }}
    />
  );
};

const LabelView: React.FC<{ label: Label; t: number }> = ({ label, t }) => {
  const { fps, width, height } = useVideoConfig();
  const g = useGaya();
  const f = huruf(g.huruf);
  const mulai = label.muncul ?? 0.4;
  const sp = spring({ frame: (t - mulai) * fps, fps, config: { damping: 12, stiffness: 160 } });
  if (t < mulai) return null;
  const kiri = (label.arah ?? 'kiri') === 'kiri';
  const radius = g.bentuk.label === 'pil' ? 999 : Math.min(g.bentuk.sudut, 12);
  return (
    <div
      style={{
        position: 'absolute',
        top: label.y * height,
        left: kiri ? undefined : label.x * width + 12,
        right: kiri ? width - label.x * width + 12 : undefined,
        transform: `translateY(-50%) scale(${sp})`,
        transformOrigin: kiri ? 'right center' : 'left center',
        background: g.warna.label,
        color: g.warna.teksLabel,
        fontFamily: f.badan,
        fontWeight: 800,
        fontSize: 38,
        letterSpacing: 0.5,
        padding: '14px 26px',
        borderRadius: radius,
        whiteSpace: 'nowrap',
        boxShadow: g.bentuk.bayangan ? '0 8px 0 rgba(0,0,0,0.18)' : undefined,
        textTransform: 'uppercase',
      }}
    >
      {kiri ? `${label.teks} →` : `← ${label.teks}`}
    </div>
  );
};

// ---------------------------------------------------------------------------

export const KotakSorot: React.FC<{ children: React.ReactNode; besar?: number }> = ({ children, besar = 1 }) => {
  const g = useGaya();
  return (
    <span
      style={{
        background: g.warna.sorot,
        color: g.warna.teksSorot,
        WebkitTextStroke: '0px',
        textShadow: 'none',
        borderRadius: g.bentuk.sudut * besar,
        border: g.bentuk.outline ? `${g.bentuk.outline * besar}px solid #111` : undefined,
        padding: `0 ${14 * besar}px`,
        boxDecorationBreak: 'clone',
        WebkitBoxDecorationBreak: 'clone',
        boxShadow: g.bentuk.bayangan ? `${6 * besar}px ${6 * besar}px 0 rgba(0,0,0,0.22)` : undefined,
      }}
    >
      {children}
    </span>
  );
};

export const BadgeSeri: React.FC<{ teks: string }> = ({ teks }) => {
  const g = useGaya();
  return (
    <div
      style={{
        display: 'inline-block',
        background: g.warna.merek,
        color: '#fff',
        fontFamily: hurufMono(),
        fontSize: 30,
        letterSpacing: 4,
        padding: '8px 18px',
        borderRadius: Math.min(g.bentuk.sudut, 8),
        textTransform: 'uppercase',
      }}
    >
      {teks}
    </div>
  );
};

const Judul: React.FC<{ spec: Spec; terang?: boolean }> = ({ spec, terang }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const g = useGaya();
  const f = huruf(g.huruf);
  const sp = spring({ frame, fps, config: { damping: 14 } });
  const seri = spec.seri || g.seri || formatDari(spec.format).seri;
  const judul = spec.judul;
  const sorot = spec.judulSorot && judul.includes(spec.judulSorot) ? spec.judulSorot : null;
  const [a, b] = sorot ? [judul.slice(0, judul.indexOf(sorot)), judul.slice(judul.indexOf(sorot) + sorot.length)] : [judul, ''];
  return (
    <div style={{ position: 'absolute', top: 150, left: 70, right: 70, opacity: sp, transform: `translateY(${(1 - sp) * 30}px)` }}>
      <BadgeSeri teks={seri} />
      <div
        style={{
          marginTop: 26,
          fontFamily: f.judul,
          fontWeight: f.berat,
          fontSize: 108,
          lineHeight: 1.12,
          letterSpacing: -2,
          color: terang ? '#ffffff' : g.warna.teks,
          ...(terang ? { WebkitTextStroke: '12px #111', paintOrder: 'stroke fill', textShadow: '0 6px 0 rgba(0,0,0,0.35)' } : {}),
        }}
      >
        {a}
        {sorot ? <KotakSorot>{sorot}</KotakSorot> : null}
        {b}
      </div>
    </div>
  );
};

const TeksBesar: React.FC<{ teks: string }> = ({ teks }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const g = useGaya();
  const f = huruf(g.huruf);
  const sp = spring({ frame, fps, config: { damping: 9, stiffness: 180 } });
  return (
    <div
      style={{
        position: 'absolute',
        top: '22%',
        width: '100%',
        textAlign: 'center',
        transform: `scale(${sp}) rotate(${-3 * sp}deg)`,
        fontFamily: f.judul,
        fontWeight: f.berat,
        fontSize: 150,
        letterSpacing: -2,
      }}
    >
      <KotakSorot besar={1.4}>{teks}</KotakSorot>
    </div>
  );
};

const Kartu: React.FC<{ tag?: string; teks: string; nilai?: string; atas?: boolean }> = ({ tag, teks, nilai, atas }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const g = useGaya();
  const f = huruf(g.huruf);
  const sp = spring({ frame: frame - 6, fps, config: { damping: 14 } });
  return (
    <div
      style={{
        position: 'absolute',
        left: 70,
        right: 70,
        ...(atas ? { top: 170 } : { bottom: 470 }),
        transform: `translateY(${(1 - sp) * (atas ? -80 : 80)}px)`,
        opacity: sp,
        background: g.gelap ? '#1f232b' : '#fffdf8',
        color: g.warna.teks,
        border: `${Math.max(2, g.bentuk.outline)}px solid ${g.gelap ? '#3a3f4a' : '#1c1c1e'}`,
        borderRadius: g.bentuk.sudut,
        padding: '26px 30px',
        display: 'flex',
        alignItems: 'center',
        gap: 22,
        fontFamily: f.badan,
        boxShadow: g.bentuk.bayangan ? '8px 8px 0 rgba(0,0,0,0.18)' : undefined,
      }}
    >
      {tag ? (
        <span
          style={{
            background: g.warna.sorot,
            color: g.warna.teksSorot,
            fontFamily: hurufMono(),
            fontSize: 28,
            padding: '6px 14px',
            borderRadius: g.bentuk.label === 'pil' ? 999 : 6,
            textTransform: 'uppercase',
          }}
        >
          {tag}
        </span>
      ) : null}
      <span style={{ fontSize: 50, fontWeight: 800, flex: 1 }}>{teks}</span>
      {nilai ? <span style={{ fontFamily: hurufMono(), fontSize: 34, color: g.warna.merek }}>{nilai}</span> : null}
    </div>
  );
};

/** Waktu tiap kata: dari `adegan.kata` (hasil `studio tts`), atau dibagi rata menurut panjang kata. */
function waktuKata(kata: string[], durasi: number, data?: Adegan['kata']) {
  if (data && data.length === kata.length) return data.map((d) => ({ a: d.a, b: d.b }));
  const bobot = kata.map((k) => k.replace(/\*/g, '').length + 1);
  const total = bobot.reduce((x, y) => x + y, 0);
  const pakai = Math.max(0.5, durasi - 0.35);
  let t = 0;
  return bobot.map((w) => {
    const a = t;
    t += (w / total) * pakai;
    return { a, b: t };
  });
}

/** Subtitle karaoke: tampilan diatur di Gaya Saya → Teks karaoke. *kata* = kata kunci. */
export const Subtitle: React.FC<{ narasi: string; kata?: Adegan['kata']; nama?: string; warnaNama?: string; paksaPosisi?: number }> = ({ narasi, kata: dataKata, nama, warnaNama, paksaPosisi }) => {
  const frame = useCurrentFrame();
  const { durationInFrames, fps, height } = useVideoConfig();
  const g = useGaya();
  const T = g.teks ?? { ...TEKS_KLASIK, warnaKunci: g.warna.sorot, warnaSorot: g.warna.sorot };
  const f = hurufTeks(T.huruf, g.huruf);
  const t = frame / fps;
  const kata = narasi.split(/\s+/).filter(Boolean);
  if (!kata.length) return null;
  const w = waktuKata(kata, durationInFrames / fps, dataKata);

  // kata aktif = kata terakhir yang sudah mulai diucapkan
  let aktif = 0;
  for (let i = 0; i < w.length; i++) if (w[i].a <= t) aktif = i;
  const per = Math.max(1, Math.round(T.kataPerBaris));
  const mulaiBaris = Math.floor(aktif / per) * per;
  const baris = kata.slice(mulaiBaris, mulaiBaris + per);
  const tBaris = w[mulaiBaris].a;
  const spBaris = spring({ frame: (t - tBaris) * fps, fps, config: { damping: 14, stiffness: 170 } });
  const masuk: React.CSSProperties =
    T.masuk === 'pop' ? { transform: `scale(${0.85 + 0.15 * spBaris})` } : T.masuk === 'naik' ? { transform: `translateY(${(1 - spBaris) * 34}px)`, opacity: Math.min(1, spBaris * 1.5) } : T.masuk === 'fade' ? { opacity: Math.min(1, (t - tBaris) / 0.18) } : {};
  const garis: React.CSSProperties = T.garis.tebal > 0 ? { WebkitTextStroke: `${T.garis.tebal}px ${T.garis.warna}`, paintOrder: 'stroke fill' } : {};
  const tanpaGaris: React.CSSProperties = { WebkitTextStroke: '0px', textShadow: 'none' };

  return (
    <div style={{ position: 'absolute', left: 50, right: 50, top: (paksaPosisi ?? T.posisi) * height, transform: 'translateY(-50%)', textAlign: 'center' }}>
      {nama ? (
        <div style={{ marginBottom: 14 }}>
          <span
            style={{
              display: 'inline-block',
              background: warnaNama ?? g.warna.merek,
              color: teksKontras(warnaNama ?? g.warna.merek),
              fontFamily: f.keluarga,
              fontWeight: 800,
              fontSize: 34,
              padding: '6px 20px',
              borderRadius: 999,
              border: '4px solid #111',
              letterSpacing: 0.5,
            }}
          >
            {nama}
          </span>
        </div>
      ) : null}
      <div
        style={{
          display: 'inline-block',
          fontFamily: f.keluarga,
          fontWeight: f.berat,
          fontSize: T.ukuran,
          lineHeight: 1.28,
          color: T.warna,
          textTransform: T.kapital ? 'uppercase' : undefined,
          textShadow: T.bayangan ? '0 5px 0 rgba(0,0,0,0.35)' : undefined,
          ...(T.latarBaris.aktif
            ? { background: `${T.latarBaris.warna}${Math.round(T.latarBaris.opasitas * 255).toString(16).padStart(2, '0')}`, padding: '12px 24px', borderRadius: 22 }
            : {}),
          ...masuk,
        }}
      >
        {baris.map((k, j) => {
          const i = mulaiBaris + j;
          const kunci = /^\*.*\*[.,!?;:]*$/.test(k) || /^\*/.test(k);
          const bersih = k.replace(/\*/g, '');
          const sedang = T.mode !== 'statis' && i === aktif && t <= w[i].b + 0.25;
          const sudah = i < aktif || (i === aktif && !sedang);
          if (T.mode === 'muncul' && i > aktif) return null;
          const p = Math.min(1, Math.max(0, (t - w[i].a) / Math.max(0.12, Math.min(0.3, w[i].b - w[i].a))));
          const sp = spring({ frame: (t - w[i].a) * fps, fps, config: { damping: 11, stiffness: 220 } });
          let gayaKata: React.CSSProperties = { ...garis };
          // kata kunci (statis)
          if (kunci && T.kataKunci === 'warna') gayaKata.color = T.warnaKunci;
          if (kunci && T.kataKunci === 'stabilo')
            gayaKata = { ...gayaKata, ...tanpaGaris, color: T.warnaTeksSorot, background: `linear-gradient(transparent 14%, ${T.warnaKunci} 14%, ${T.warnaKunci} 90%, transparent 90%)`, borderRadius: 8 };
          // kata yang sedang diucapkan
          if (sedang) {
            if (T.efek === 'warna') gayaKata = { ...gayaKata, color: T.warnaSorot, transform: `scale(${1 + 0.06 * sp})` };
            if (T.efek === 'membesar') gayaKata = { ...gayaKata, color: T.warnaSorot, transform: `scale(${1 + 0.22 * sp}) rotate(${-2 * sp}deg)` };
            if (T.efek === 'stabilo')
              gayaKata = {
                ...gayaKata,
                ...tanpaGaris,
                color: T.warnaTeksSorot,
                backgroundImage: `linear-gradient(transparent 12%, ${T.warnaSorot} 12%, ${T.warnaSorot} 90%, transparent 90%)`,
                backgroundSize: `${p * 100}% 100%`,
                backgroundRepeat: 'no-repeat',
                borderRadius: 8,
                transform: 'rotate(-1.2deg)',
              };
            if (T.efek === 'kotak') gayaKata = { ...gayaKata, ...tanpaGaris, color: T.warnaTeksSorot, background: T.warnaSorot, borderRadius: 14, transform: `scale(${0.92 + 0.12 * sp})` };
            if (T.efek === 'garis-bawah')
              gayaKata = { ...gayaKata, backgroundImage: `linear-gradient(${T.warnaSorot}, ${T.warnaSorot})`, backgroundSize: `${p * 100}% 0.13em`, backgroundPosition: 'left 96%', backgroundRepeat: 'no-repeat' };
          }
          if (T.mode === 'muncul') gayaKata.transform = `${gayaKata.transform ?? ''} scale(${0.6 + 0.4 * sp})`;
          if (T.mode === 'karaoke' && !sedang && !sudah && T.efek === 'warna' && !kunci) gayaKata.opacity = 0.92;
          return (
            <span key={i} style={{ display: 'inline-block', margin: '0 0.12em', padding: '0 0.1em', ...gayaKata }}>
              {bersih}
            </span>
          );
        })}
      </div>
    </div>
  );
};

/** Pratinjau teks karaoke untuk tab Gaya Saya. */
export const PratinjauTeks: React.FC<{ gaya: Gaya; latar?: string }> = ({ gaya, latar }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const kalimat = ['Pegasnya tertekan, lalu *cincin* berputar sedikit', 'Klik lagi, dan ujungnya *masuk* kembali'];
  const durasi = 3.6;
  const idx = Math.floor(frame / (durasi * fps)) % kalimat.length;
  const lokal = frame - Math.floor(frame / (durasi * fps)) * durasi * fps;
  return (
    <GayaCtx.Provider value={gaya}>
      <AbsoluteFill style={{ background: latar ?? `linear-gradient(180deg, ${gaya.warna.latar} 0%, ${gaya.warna.latar} 55%, ${gaya.warna.lantai} 55%)` }}>
        <Sequence from={frame - lokal} durationInFrames={durasi * fps} layout="none">
          <Subtitle narasi={kalimat[idx]} paksaPosisi={0.5} />
        </Sequence>
      </AbsoluteFill>
    </GayaCtx.Provider>
  );
};

const Logo: React.FC<{ file: string }> = ({ file }) => {
  const g = useGaya();
  const berkas = useBerkas();
  const { width } = useVideoConfig();
  const l = g.logo!;
  const pos: React.CSSProperties = {
    position: 'absolute',
    width: l.ukuran * width,
    [l.posisi.includes('kiri') ? 'left' : 'right']: 60,
    [l.posisi.includes('atas') ? 'top' : 'bottom']: l.posisi.includes('atas') ? 60 : 90,
  };
  return <Img src={berkas(file)} style={pos} />;
};
