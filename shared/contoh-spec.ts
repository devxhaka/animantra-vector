import type { Spec } from './tipe';
import { GAYA_BAWAAN } from './gaya-bawaan';

/** Spec contoh: dipakai pratinjau tab Gaya Saya & komposisi bawaan Remotion. */
export const SPEC_CONTOH: Spec = {
  versi: 1,
  format: 'kita-bongkar',
  judul: 'Kok pulpen klik bisa gantian?',
  judulSorot: 'gantian?',
  fps: 30,
  lebar: 1080,
  tinggi: 1920,
  gaya: GAYA_BAWAAN,
  adegan: [
    {
      id: 'hook',
      narasi: 'Sekali klik keluar, klik lagi masuk. Kok bisa *gantian*?',
      durasi: 3.5,
      tampilJudul: true,
      aset: [{ file: 'contoh/pulpen.svg', x: 0.5, y: 0.6, lebar: 1.05, rotasi: -32, masuk: 'pop', loop: 'melayang' }],
    },
    {
      id: 'dalam',
      narasi: 'Pegasnya tertekan, *cincin* berputar sedikit',
      durasi: 3.5,
      teksBesar: 'KLIK!',
      aset: [{ file: 'contoh/pulpen.svg', x: 0.55, y: 0.6, lebar: 1.05, rotasi: -32, masuk: 'tidak' }],
      label: [
        { teks: 'Cincin gigi', x: 0.82, y: 0.44, arah: 'kiri', muncul: 0.3 },
        { teks: 'Pegas', x: 0.42, y: 0.56, arah: 'kiri', muncul: 0.7 },
      ],
      kartu: { tag: 'Baik', teks: 'Ujung keluar', nilai: '+4 mm' },
    },
  ],
};
