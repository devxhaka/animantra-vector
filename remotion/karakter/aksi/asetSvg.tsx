// Aset SVG kustom untuk aksi (senter, sampul benda): dimuat sebelum frame difoto lalu disisipkan
// sebagai VEKTOR inline (bukan <image>/<svg> bersarang) supaya rasterisasi deterministik.
import React from 'react';
import { continueRender, delayRender } from 'remotion';
import { useBerkas } from '../../berkas';
import type { TokohAdegan } from '../../../shared/tipe';
import type { SvgInline } from '../Tokoh';

/** Ambil viewBox & isi SVG, buang <script> dan atribut on* (aset lokal pengguna, tetap dibersihkan). */
export function bersihkanSvg(teks: string): SvgInline | null {
  const m = teks.match(/<svg\b([^>]*)>([\s\S]*)<\/svg>/i);
  if (!m) return null;
  const vb = m[1].match(/viewBox\s*=\s*["']([^"']+)["']/i)?.[1];
  if (!vb) return null;
  const isi = m[2]
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/\son[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    .replace(/(href\s*=\s*["'])\s*javascript:[^"']*/gi, '$1#');
  return { viewBox: vb, isi };
}

/**
 * Muat aset SVG kustom aksi (mis. senter) SEBELUM frame difoto (delayRender), lalu sisipkan sebagai
 * vektor inline — bukan <image> — supaya rasterisasi deterministik. Gagal/bukan SVG → gambar bawaan.
 */
export function useGambarAksi(tokoh: TokohAdegan): (aset: string) => SvgInline | undefined {
  const berkas = useBerkas();
  const daftar = React.useMemo(() => {
    const set = new Set<string>();
    for (const a of tokoh.aksi ?? []) {
      const aset = (a as { aset?: unknown }).aset;
      if (typeof aset === 'string' && aset) set.add(aset);
    }
    return [...set].sort();
  }, [tokoh.aksi]);
  const kunci = daftar.join('|');
  const [siap, setSiap] = React.useState<Record<string, SvgInline> | null>(null);
  const [tunda] = React.useState(() => (daftar.length ? delayRender('Memuat aset aksi: ' + kunci) : null));
  // Lepas delayRender SETELAH state baru ter-commit ke DOM (bukan langsung setelah setState),
  // supaya frame tidak pernah difoto sebelum senter kustom terpasang (race condition).
  React.useLayoutEffect(() => {
    if (siap !== null && tunda !== null) continueRender(tunda);
  }, [siap, tunda]);
  React.useEffect(() => {
    if (!daftar.length) return;
    let batal = false;
    Promise.all(
      daftar.map((aset) =>
        fetch(berkas(aset))
          .then((r) => (r.ok ? r.text() : ''))
          .then((t) => [aset, bersihkanSvg(t)] as const)
          .catch(() => [aset, null] as const),
      ),
    ).then((hasil) => {
      if (batal) return;
      const peta: Record<string, SvgInline> = {};
      for (const [aset, svg] of hasil) if (svg) peta[aset] = svg;
      setSiap(peta);
    });
    return () => {
      batal = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kunci]);
  return React.useCallback((aset: string) => siap?.[aset], [siap]);
}

