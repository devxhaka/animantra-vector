import type { VideoMeta } from '../../shared/tipe';

export type Seri = { kunci: string; nama: string; format: string; episode: VideoMeta[]; terakhir: VideoMeta };

/**
 * Kelompokkan video menjadi seri lewat rantai `seri.lanjutan` (episode → episode sebelumnya).
 * Seri = rantai ≥ 2 video, atau video tunggal yang punya nomor episode / pilihan penonton.
 */
export function kelompokkanSeri(videos: VideoMeta[]): Seri[] {
  const per = new Map(videos.map((v) => [v.slug, v]));
  const anak = new Map<string, VideoMeta[]>();
  for (const v of videos) {
    const induk = v.seri?.lanjutan;
    if (induk && per.has(induk)) anak.set(induk, [...(anak.get(induk) ?? []), v]);
  }
  const akar = videos.filter((v) => !v.seri?.lanjutan || !per.has(v.seri.lanjutan));
  const hasil: Seri[] = [];
  for (const a of akar) {
    const rantai: VideoMeta[] = [a];
    let kini = a;
    const dilihat = new Set([a.slug]);
    for (;;) {
      // bila satu episode punya beberapa lanjutan (mis. dibuat ulang), ambil yang terbaru
      const berikut = (anak.get(kini.slug) ?? []).filter((x) => !dilihat.has(x.slug)).sort((x, y) => y.dibuat.localeCompare(x.dibuat))[0];
      if (!berikut) break;
      rantai.push(berikut);
      dilihat.add(berikut.slug);
      kini = berikut;
    }
    const bermakna = rantai.length > 1 || a.seri?.episode != null || !!a.seri?.opsi?.length;
    if (!bermakna) continue;
    const terakhir = rantai[rantai.length - 1];
    hasil.push({ kunci: a.slug, nama: rantai.find((x) => x.seri?.nama)?.seri?.nama ?? a.judul, format: a.format, episode: rantai, terakhir });
  }
  return hasil.sort((x, y) => y.terakhir.diperbarui.localeCompare(x.terakhir.diperbarui));
}

/** Nomor episode untuk ditampilkan: dari spec, atau urutan di rantai. */
export const nomorEpisode = (s: Seri, i: number) => s.episode[i].seri?.episode ?? i + 1;
