// Seri interaktif (Phase E): fungsi murni untuk layar pilihan, dipakai renderer, cek & uji.
import type { Adegan, Spec } from './tipe';

/** Teks badge lanjutan: eksplisit, atau "LANJUT EPISODE n+1" dari spec.episode; null = tanpa badge. */
export function teksLanjut(p: NonNullable<Adegan['pilihan']>, spec: Pick<Spec, 'episode'>) {
  if (p.lanjut === null) return null;
  return p.lanjut ?? (spec.episode ? `LANJUT EPISODE ${spec.episode + 1}` : null);
}
/** Detik (relatif adegan) badge LANJUT muncul: setelah kata terakhir narasi diucapkan (+0,25), paling cepat 1,6 dtk setelah pilihan muncul. */
export function waktuLanjut(a: Pick<Adegan, 'kata' | 'durasi' | 'pilihan'>) {
  const akhirNarasi = a.kata?.length ? a.kata[a.kata.length - 1].b : a.durasi * 0.72;
  return Math.min(a.durasi - 0.6, Math.max((a.pilihan?.muncul ?? 0.3) + 1.6, akhirNarasi + 0.25));
}
