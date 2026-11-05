import React from 'react';
import type { FormatDef, Gaya, Job, Karakter, VideoMeta } from '../../shared/tipe';

export type Status = { terhubung: boolean; mendengar: boolean; bekerja: boolean; proyek: string; platform: string };
export type Opsi = {
  formats: FormatDef[];
  grupSuara: { penyedia: string; nama: string; suara: { nilai: string; nama: string; ket: string; bisa: boolean }[] }[];
  kreditEleven: { sisa: number; batas: number; reset: string | null; model: string; faktor: number; gratis: boolean; tier: string } | null;
  musik: string[];
  sfx: string[];
  geminiSiap: boolean;
  elevenSiap: boolean;
  azureSiap: boolean;
  edgeSiap: boolean;
};
export type DetailVideo = { meta: VideoMeta; caption: string; cuplikan: string[]; pesanan: any };

async function minta<T>(url: string, init?: RequestInit & { json?: unknown }): Promise<T> {
  const r = await fetch(url, {
    ...init,
    method: init?.method ?? (init?.json !== undefined ? 'POST' : 'GET'),
    headers: init?.json !== undefined ? { 'content-type': 'application/json' } : undefined,
    body: init?.json !== undefined ? JSON.stringify(init.json) : undefined,
  });
  const data = await r.json().catch(() => null);
  if (!r.ok) throw new Error(data?.galat ?? `Galat ${r.status}`);
  return data as T;
}

export const api = {
  status: () => minta<Status>('/api/status'),
  opsi: () => minta<Opsi>('/api/opsi'),
  videos: () => minta<VideoMeta[]>('/api/videos'),
  video: (slug: string) => minta<DetailVideo>(`/api/videos/${slug}`),
  jobs: () => minta<Job[]>('/api/jobs'),
  buat: (form: unknown) => minta<Job>('/api/jobs', { json: form }),
  batal: (id: string) => minta<Job>(`/api/jobs/${id}/batal`, { json: {} }),
  ulangi: (id: string, suara?: string) => minta<Job>(`/api/jobs/${id}/ulangi`, { json: { suara } }),
  cobaSuara: (suara: string) => minta<{ url: string }>('/api/suara/coba', { json: { suara } }),
  tutupJob: (id: string) => minta(`/api/jobs/${id}/tutup`, { json: {} }),
  revisi: (slug: string, teks: string) => minta<Job>(`/api/videos/${slug}/revisi`, { json: { teks } }),
  renderUlang: (slug: string) => minta<Job>(`/api/videos/${slug}/render-ulang`, { json: {} }),
  finder: (slug: string) => minta(`/api/videos/${slug}/finder`, { json: {} }),
  karakter: () => minta<Karakter[]>('/api/karakter'),
  simpanKarakter: (k: Karakter, idLama?: string) => minta<Karakter>(`/api/karakter${idLama ? `?idLama=${encodeURIComponent(idLama)}` : ''}`, { json: k }),
  hapusKarakter: (id: string) => minta(`/api/karakter/${id}`, { method: 'DELETE' }),
  gaya: () => minta<{ daftar: Gaya[]; aktif: string }>('/api/gaya'),
  simpanGaya: (g: Gaya, pakai: boolean) => minta<Gaya>(`/api/gaya${pakai ? '?pakai=1' : ''}`, { json: g }),
  pakaiGaya: (id: string) => minta(`/api/gaya/${id}/aktif`, { json: {} }),
  hapusGaya: (id: string) => minta(`/api/gaya/${id}`, { method: 'DELETE' }),
  unggahLogo: (dataUrl: string) => minta<{ file: string }>('/api/gaya-logo', { json: { dataUrl } }),
};

export function usePolling<T>(fn: () => Promise<T>, ms: number, deps: unknown[] = []) {
  const [data, setData] = React.useState<T | null>(null);
  const muat = React.useCallback(() => fn().then(setData).catch(() => {}), deps);
  React.useEffect(() => {
    muat();
    const t = setInterval(muat, ms);
    return () => clearInterval(t);
  }, [muat, ms]);
  return [data, muat] as const;
}
export const tanggal = (iso: string) => new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });

// opsi dimuat sekali dan dibagi ke semua komponen
let janjiOpsi: Promise<Opsi> | null = null;
export function useOpsi() {
  const [o, setO] = React.useState<Opsi | null>(null);
  React.useEffect(() => {
    janjiOpsi ??= api.opsi().catch((e) => {
      janjiOpsi = null;
      throw e;
    });
    janjiOpsi.then(setO).catch(() => {});
  }, []);
  return o;
}
export const suaraBisaDipakai = (o: Opsi | null) => (o?.grupSuara ?? []).flatMap((g) => g.suara.filter((v) => v.bisa).map((v) => v.nilai));
