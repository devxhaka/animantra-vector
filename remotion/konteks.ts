import React from 'react';
import { staticFile } from 'remotion';
import type { Adegan, Gaya } from '../shared/tipe';

export const BerkasCtx = React.createContext<(p: string) => string>((p) => staticFile(p));
export const useBerkas = () => React.useContext(BerkasCtx);
export const GayaCtx = React.createContext<Gaya | null>(null);
export const useGaya = () => React.useContext(GayaCtx)!;

/** Waktu tiap kata: dari `adegan.kata` (hasil `studio tts`), atau dibagi rata menurut panjang kata. */
export function waktuKata(kata: string[], durasi: number, data?: Adegan['kata']) {
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

const polos = (s: string) => s.toLowerCase().replace(/[^\p{L}\p{N}]/gu, '');

export type Kapan = (o: { muncul?: number; saat?: string }, bawaan: number) => number;

/**
 * Pembuat fungsi "kapan sebuah elemen muncul" untuk satu adegan.
 * `saat: "kipas"` → detik ketika kata itu diucapkan (awal kata pertama yang cocok);
 * `muncul: 1.2` → detik tetap; tanpa keduanya → nilai bawaan.
 */
export function buatKapan(adegan: Adegan): Kapan {
  const kata = adegan.narasi.split(/\s+/).filter(Boolean);
  const w = waktuKata(kata, adegan.durasi, adegan.kata);
  const bersih = kata.map(polos);
  return (o, bawaan) => {
    if (o.saat) {
      const cari = o.saat.split(/\s+/).map(polos).filter(Boolean);
      for (let i = 0; cari.length && i + cari.length <= bersih.length; i++) {
        if (cari.every((c, j) => bersih[i + j] === c || (j === cari.length - 1 && bersih[i + j].startsWith(c)))) return Math.max(0, w[i].a - 0.08);
      }
    }
    return o.muncul ?? bawaan;
  };
}

export const AdeganCtx = React.createContext<{ kapan: Kapan; durasi: number }>({ kapan: (o, b) => o.muncul ?? b, durasi: 4 });
export const useAdegan = () => React.useContext(AdeganCtx);
