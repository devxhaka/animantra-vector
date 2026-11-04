import type { Gaya, GayaTeks, HurufTeks } from './tipe';

export type PresetWarna = { nama: string; warna: Gaya['warna']; gelap: boolean };

const p = (
  nama: string,
  latar: string,
  lantai: string,
  teks: string,
  merek: string,
  sorot: string,
  teksSorot = '#111111',
  gelap = false,
): PresetWarna => ({
  nama,
  gelap,
  warna: { latar, lantai, teks, merek, sorot, teksSorot, label: gelap ? '#f4f1ea' : '#1c1c1e', teksLabel: gelap ? '#111111' : '#ffffff' },
});

export const PRESET_WARNA: PresetWarna[] = [
  p('Bawaan Kita Bongkar', '#e9e6df', '#d9d3c7', '#151515', '#a3243b', '#e8c25a'),
  p('Laut', '#e4ecf2', '#cfdbe4', '#10202c', '#1f5fbf', '#f2c94c'),
  p('Jeruk', '#f3ebe2', '#e4d6c6', '#1b1410', '#d2561e', '#ffd27a'),
  p('Hutan', '#e6e9e4', '#d3d8cf', '#121a14', '#2c6b4f', '#f08ee6'),
  p('Anggur', '#ece7f1', '#dad2e4', '#1a1222', '#6b3fa0', '#f5d34f'),
  p('Poster merah', '#f2ede6', '#e3dacd', '#161616', '#d62828', '#f7b538'),
  p('Malam', '#1d2128', '#151820', '#f4f1ea', '#f29e38', '#f6d365', '#111111', true),
  p('Neon', '#111317', '#0a0b0e', '#f4f4f4', '#18c3d6', '#c6ff3d', '#111111', true),
];

/** Tampilan subtitle lama (dipakai bila gaya belum punya pengaturan teks). */
export const TEKS_KLASIK: GayaTeks = {
  huruf: 'ikut',
  ukuran: 62,
  kapital: false,
  warna: '#ffffff',
  garis: { warna: '#111111', tebal: 10 },
  bayangan: true,
  latarBaris: { aktif: false, warna: '#000000', opasitas: 0.55 },
  posisi: 0.84,
  kataPerBaris: 4,
  mode: 'statis',
  efek: 'warna',
  warnaSorot: '#e8c25a',
  warnaTeksSorot: '#111111',
  kataKunci: 'warna',
  warnaKunci: '#e8c25a',
  masuk: 'tidak',
};

export const PRESET_TEKS: { nama: string; teks: GayaTeks }[] = [
  { nama: 'Klasik', teks: TEKS_KLASIK },
  { nama: 'Karaoke warna', teks: { ...TEKS_KLASIK, mode: 'karaoke', efek: 'warna', warnaSorot: '#ffd84a', masuk: 'pop' } },
  {
    nama: 'Stabilo',
    teks: { ...TEKS_KLASIK, huruf: 'poppins', ukuran: 60, garis: { warna: '#111111', tebal: 0 }, bayangan: false, latarBaris: { aktif: true, warna: '#ffffff', opasitas: 0.92 }, warna: '#151515', mode: 'karaoke', efek: 'stabilo', warnaSorot: '#ffe14d', warnaTeksSorot: '#151515', kataKunci: 'tidak', masuk: 'naik' },
  },
  {
    nama: 'Kotak CapCut',
    teks: { ...TEKS_KLASIK, huruf: 'montserrat', ukuran: 64, kapital: true, mode: 'karaoke', efek: 'kotak', warnaSorot: '#7c3aed', warnaTeksSorot: '#ffffff', kataKunci: 'warna', warnaKunci: '#7ee8fa', kataPerBaris: 3, masuk: 'pop' },
  },
  {
    nama: 'Pop besar',
    teks: { ...TEKS_KLASIK, huruf: 'bebas', ukuran: 96, kapital: true, garis: { warna: '#111111', tebal: 12 }, mode: 'karaoke', efek: 'membesar', warnaSorot: '#5cff7a', kataPerBaris: 2, posisi: 0.72, masuk: 'pop' },
  },
  {
    nama: 'Muncul per kata',
    teks: { ...TEKS_KLASIK, huruf: 'lilita', ukuran: 70, garis: { warna: '#1d1d1f', tebal: 12 }, mode: 'muncul', efek: 'warna', warnaSorot: '#ffd84a', kataPerBaris: 3, masuk: 'pop' },
  },
  {
    nama: 'Minimal',
    teks: { ...TEKS_KLASIK, huruf: 'poppins', ukuran: 50, garis: { warna: '#000000', tebal: 0 }, bayangan: true, latarBaris: { aktif: true, warna: '#000000', opasitas: 0.5 }, mode: 'karaoke', efek: 'garis-bawah', warnaSorot: '#ffffff', kataKunci: 'tidak', kataPerBaris: 5, masuk: 'fade' },
  },
];

export const HURUF_TEKS: { kunci: HurufTeks | 'ikut'; nama: string }[] = [
  { kunci: 'ikut', nama: 'Ikut huruf gaya' },
  { kunci: 'tegas', nama: 'Inter (tegas)' },
  { kunci: 'poppins', nama: 'Poppins' },
  { kunci: 'montserrat', nama: 'Montserrat' },
  { kunci: 'bulat', nama: 'Nunito (bulat)' },
  { kunci: 'baloo', nama: 'Baloo 2 (ceria)' },
  { kunci: 'lilita', nama: 'Lilita One (kartun)' },
  { kunci: 'bebas', nama: 'Bebas Neue (tinggi)' },
  { kunci: 'poster', nama: 'Archivo Black (poster)' },
  { kunci: 'klasik', nama: 'Fraunces (serif)' },
];

export const GAYA_BAWAAN: Gaya = {
  id: 'bawaan',
  nama: 'Bawaan',
  seri: '',
  warna: PRESET_WARNA[0].warna,
  gelap: false,
  huruf: 'tegas',
  bentuk: { sudut: 10, label: 'pil', outline: 4, bayangan: true },
  logo: null,
};

export const HURUF_PILIHAN: { kunci: Gaya['huruf']; nama: string; ket: string }[] = [
  { kunci: 'tegas', nama: 'Tegas', ket: 'Inter tebal, bersih (bawaan)' },
  { kunci: 'bulat', nama: 'Bulat ramah', ket: 'Nunito: membulat, hangat, cocok untuk anak & keluarga' },
  { kunci: 'poster', nama: 'Poster', ket: 'Archivo Black: padat, kuat, gaya poster' },
  { kunci: 'klasik', nama: 'Klasik', ket: 'Fraunces: serif elegan untuk kisah & sejarah' },
];

/** Bikin palet lengkap dari satu warna merek + satu warna sorot. */
export function paletDariMerek(merek: string, sorot: string, gelap: boolean): Gaya['warna'] {
  const campur = (a: string, b: string, t: number) => {
    const ha = a.replace('#', ''), hb = b.replace('#', '');
    const c = [0, 2, 4].map((i) => Math.round(parseInt(ha.slice(i, i + 2), 16) * (1 - t) + parseInt(hb.slice(i, i + 2), 16) * t));
    return '#' + c.map((v) => v.toString(16).padStart(2, '0')).join('');
  };
  return gelap
    ? { latar: campur(merek, '#0d0f12', 0.85), lantai: campur(merek, '#08090b', 0.9), teks: '#f4f1ea', merek, sorot, teksSorot: teksKontras(sorot), label: '#f4f1ea', teksLabel: '#111111' }
    : { latar: campur(merek, '#f1efe9', 0.9), lantai: campur(merek, '#ddd8cd', 0.86), teks: '#151515', merek, sorot, teksSorot: teksKontras(sorot), label: '#1c1c1e', teksLabel: '#ffffff' };
}

export function luminansi(hex: string) {
  const h = hex.replace('#', '');
  const [r, g, b] = [0, 2, 4].map((i) => {
    const v = parseInt(h.slice(i, i + 2), 16) / 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
export function rasioKontras(a: string, b: string) {
  const [l1, l2] = [luminansi(a), luminansi(b)].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
}
export const teksKontras = (bg: string) => (rasioKontras(bg, '#111111') >= rasioKontras(bg, '#ffffff') ? '#111111' : '#ffffff');
