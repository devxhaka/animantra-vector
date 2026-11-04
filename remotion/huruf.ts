// Font lokal (offline) — tidak bergantung pada Google Fonts saat render.
import '@fontsource/inter/latin-700.css';
import '@fontsource/inter/latin-800.css';
import '@fontsource/nunito/latin-800.css';
import '@fontsource/nunito/latin-900.css';
import '@fontsource/archivo-black/latin-400.css';
import '@fontsource/fraunces/latin-700.css';
import '@fontsource/fraunces/latin-900.css';
import '@fontsource/space-mono/latin-700.css';
import '@fontsource/poppins/latin-800.css';
import '@fontsource/montserrat/latin-900.css';
import '@fontsource/bebas-neue/latin-400.css';
import '@fontsource/lilita-one/latin-400.css';
import '@fontsource/baloo-2/latin-800.css';
import { continueRender, delayRender } from 'remotion';
import type { HurufTeks, KunciHuruf } from '../shared/tipe';

const DATA: Record<KunciHuruf, { judul: string; badan: string; berat: number }> = {
  tegas: { judul: 'Inter', badan: 'Inter', berat: 800 },
  bulat: { judul: 'Nunito', badan: 'Nunito', berat: 900 },
  poster: { judul: 'Archivo Black', badan: 'Inter', berat: 400 },
  klasik: { judul: 'Fraunces', badan: 'Inter', berat: 900 },
};

const dimuat = new Set<string>();
function pastikan(spes: string) {
  if (dimuat.has(spes) || typeof document === 'undefined') return;
  dimuat.add(spes);
  const h = delayRender('Memuat font ' + spes);
  document.fonts
    .load(spes)
    .catch(() => {})
    .finally(() => continueRender(h));
}

export function huruf(k: KunciHuruf) {
  const d = DATA[k] ?? DATA.tegas;
  pastikan(`${d.berat} 40px "${d.judul}"`);
  pastikan(`800 40px "${d.badan}"`);
  return { judul: `"${d.judul}", sans-serif`, badan: `"${d.badan}", sans-serif`, berat: d.berat };
}

export function hurufMono() {
  pastikan('700 40px "Space Mono"');
  return '"Space Mono", monospace';
}

const DATA_TEKS: Record<Exclude<HurufTeks, KunciHuruf>, { nama: string; berat: number }> = {
  poppins: { nama: 'Poppins', berat: 800 },
  montserrat: { nama: 'Montserrat', berat: 900 },
  bebas: { nama: 'Bebas Neue', berat: 400 },
  lilita: { nama: 'Lilita One', berat: 400 },
  baloo: { nama: 'Baloo 2', berat: 800 },
};

/** Font subtitle/karaoke. 'ikut' = pakai huruf badan gaya. */
export function hurufTeks(k: HurufTeks | 'ikut', ikut: KunciHuruf): { keluarga: string; berat: number } {
  if (k === 'ikut' || k in DATA) {
    const d = huruf(k === 'ikut' ? ikut : (k as KunciHuruf));
    return { keluarga: k === 'ikut' ? d.badan : d.judul, berat: k === 'ikut' ? 800 : d.berat };
  }
  const d = DATA_TEKS[k as keyof typeof DATA_TEKS];
  pastikan(`${d.berat} 40px "${d.nama}"`);
  return { keluarga: `"${d.nama}", sans-serif`, berat: d.berat };
}
