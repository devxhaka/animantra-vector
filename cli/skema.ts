import { z } from 'zod';
import { EKSPRESI, POSE } from '../shared/tipe';

const kf = z.object({
  prop: z.enum(['x', 'y', 'skala', 'rotasi', 'opasitas']),
  dari: z.number(),
  ke: z.number(),
  mulai: z.number().min(0),
  selesai: z.number().min(0),
  easing: z.enum(['linear', 'halus', 'pegas', 'masuk', 'keluar']).optional(),
});
const aset = z.object({
  file: z.string(),
  x: z.number(),
  y: z.number(),
  lebar: z.number().positive(),
  rotasi: z.number().optional(),
  masuk: z.enum(['pop', 'fade', 'geser-kiri', 'geser-kanan', 'geser-bawah', 'tidak']).optional(),
  animasi: z.array(kf).optional(),
  loop: z.enum(['goyang', 'melayang', 'putar', 'denyut']).nullable().optional(),
  z: z.number().optional(),
});
const label = z.object({
  teks: z.string().max(28, 'label maksimal 28 karakter'),
  x: z.number().min(0).max(1),
  y: z.number().min(0).max(1),
  arah: z.enum(['kiri', 'kanan']).optional(),
  muncul: z.number().optional(),
});
const pose = z.enum(POSE as unknown as [string, ...string[]]);
const ekspresi = z.enum(EKSPRESI as unknown as [string, ...string[]]);
const lihat = z.enum(['depan', 'kiri', 'kanan', 'atas', 'bawah']);
const modeAnimasi = z.enum(['existing', 'special', 'auto']);
const tokoh = z.object({
  id: z.string(),
  x: z.number(),
  y: z.number().optional(),
  skala: z.number().positive().optional(),
  hadap: z.enum(['kiri', 'kanan']).optional(),
  pose: pose.optional(),
  ekspresi: ekspresi.optional(),
  lihat: lihat.optional(),
  urutan: z.array(z.object({ pada: z.number().min(0), pose: pose.optional(), ekspresi: ekspresi.optional(), lihat: lihat.optional(), hadap: z.enum(['kiri', 'kanan']).optional() })).optional(),
  jalan: z.object({ ke: z.number(), mulai: z.number(), selesai: z.number() }).nullable().optional(),
  z: z.number().optional(),
  siluet: z.boolean().optional(),
  modeAnimasi: modeAnimasi.optional(),
  // detail tiap aksi divalidasi oleh validasiAksi() di shared/aksi.ts (satu sumber aturan), lewat `studio cek`
  aksi: z.array(z.object({ jenis: z.string() }).passthrough()).optional(),
});
export const skemaAdegan = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/, 'id adegan: huruf kecil/angka/strip'),
  narasi: z.string().min(1),
  durasi: z.number().positive(),
  suara: z.string().nullable().optional(),
  tampilJudul: z.boolean().optional(),
  teksBesar: z.string().max(18).nullable().optional(),
  aset: z.array(aset).optional(),
  label: z.array(label).max(5).optional(),
  kartu: z.object({ tag: z.string().optional(), teks: z.string().max(30), nilai: z.string().optional() }).nullable().optional(),
  kamera: z
    .object({
      dari: z.object({ zoom: z.number().optional(), x: z.number().optional(), y: z.number().optional() }).optional(),
      ke: z.object({ zoom: z.number().optional(), x: z.number().optional(), y: z.number().optional() }).optional(),
    })
    .nullable()
    .optional(),
  sfx: z.array(z.object({ file: z.string(), pada: z.number().min(0), volume: z.number().optional() })).optional(),
  transisi: z.enum(['potong', 'fade', 'geser']).optional(),
  pembicara: z.string().nullable().optional(),
  latar: z.string().nullable().optional(),
  suasana: z
    .object({
      gelap: z.number().min(0).max(1).optional(),
      warnaLangit: z.string().nullable().optional(),
      kabut: z.boolean().optional(),
      hujan: z.boolean().optional(),
      gempa: z.number().min(0).max(1).optional(),
      cahaya: z.object({ x: z.number(), y: z.number(), warna: z.string().optional() }).nullable().optional(),
      vinyet: z.boolean().optional(),
    })
    .nullable()
    .optional(),
  tokoh: z.array(tokoh).max(6).optional(),
  mulut: z.array(z.number()).nullable().optional(),
  kata: z.array(z.object({ t: z.string(), a: z.number(), b: z.number() })).nullable().optional(),
});
export const skemaSpec = z.object({
  versi: z.literal(1),
  format: z.string(),
  judul: z.string().min(3).max(60),
  judulSorot: z.string().optional(),
  seri: z.string().optional(),
  fps: z.number().int(),
  lebar: z.number().int(),
  tinggi: z.number().int(),
  gaya: z.any(),
  logo: z.string().nullable().optional(),
  musik: z.object({ file: z.string(), volume: z.number().optional() }).nullable().optional(),
  pemeran: z.array(z.any()).optional(),
  modeAnimasi: modeAnimasi.optional(),
  adegan: z.array(skemaAdegan).min(1),
});
