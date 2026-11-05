import type { Karakter } from './tipe';

export const WARNA_KULIT = ['#f6d3b3', '#ebbf98', '#dca57c', '#c98b5f', '#a86c45', '#7d4f33'];
export const WARNA_RAMBUT = ['#1f1a17', '#3b2a20', '#6b4a2f', '#a3753f', '#d9d4cc'];

export const PAKAIAN_PILIHAN: { kunci: Karakter['pakaian']; nama: string; untuk: Karakter['jenis'] | 'semua' }[] = [
  { kunci: 'hijab-gamis', nama: 'Hijab + gamis', untuk: 'perempuan' },
  { kunci: 'hijab-kasual', nama: 'Hijab + tunik & celana', untuk: 'perempuan' },
  { kunci: 'rambut-panjang', nama: 'Rambut terurai + tunik', untuk: 'perempuan' },
  { kunci: 'koko-kopiah', nama: 'Baju koko + kopiah', untuk: 'laki' },
  { kunci: 'jubah-sorban', nama: 'Jubah + sorban', untuk: 'laki' },
  { kunci: 'kasual', nama: 'Kaos & celana', untuk: 'semua' },
  { kunci: 'kemeja', nama: 'Kemeja & celana', untuk: 'semua' },
];

export const KARAKTER_CONTOH: Karakter[] = [
  {
    id: 'kakak',
    nama: 'Kak Aisyah',
    peran: 'Kakak sulung, 15 tahun. Tenang, sabar, suka menjelaskan dengan lembut, hafal 10 ayat awal Al-Kahfi.',
    jenis: 'perempuan',
    usia: 'remaja',
    pakaian: 'hijab-gamis',
    warna: { kulit: '#ebbf98', rambut: '#1f1a17', atasan: '#3f6e8c', bawahan: '#2c4a5e', penutup: '#e9e2d4', sepatu: '#3a2c25' },
    suara: 'edge:id-ID-GadisNeural',
  },
  {
    id: 'adik',
    nama: 'Raka',
    peran: 'Adik laki-laki, 8 tahun. Polos, banyak bertanya, mudah cemas tapi berani.',
    jenis: 'laki',
    usia: 'anak',
    pakaian: 'koko-kopiah',
    warna: { kulit: '#dca57c', rambut: '#1f1a17', atasan: '#f2efe6', bawahan: '#5b6b73', penutup: '#2b2b30', sepatu: '#4a3b30' },
    suara: 'edge:id-ID-ArdiNeural',
  },
];

export const KARAKTER_CADANGAN: Karakter = { ...KARAKTER_CONTOH[1], id: 'tokoh', nama: 'Tokoh', peran: '' };
