import { z } from 'zod';
import { EKSPRESI, POSE, POSISI_TUBUH } from '../shared/tipe';

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
  parallax: z.number().min(0).max(3).optional(),
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
const tubuh = z.enum(POSISI_TUBUH as unknown as [string, ...string[]]);
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
  urutan: z.array(z.object({ pada: z.number().min(0), pose: pose.optional(), ekspresi: ekspresi.optional(), lihat: lihat.optional(), hadap: z.enum(['kiri', 'kanan']).optional(), tubuh: tubuh.optional() })).optional(),
  tubuh: tubuh.optional(),
  lenganDiDepan: z.boolean().optional(),
  tampak: z.enum(['depan', 'belakang']).optional(),
  kabur: z.number().min(0).max(40).optional(),
  jalan: z.object({ ke: z.number(), mulai: z.number(), selesai: z.number() }).nullable().optional(),
  z: z.number().optional(),
  siluet: z.boolean().optional(),
  modeAnimasi: modeAnimasi.optional(),
  // detail tiap aksi divalidasi oleh validasiAksi() di shared/aksi.ts (satu sumber aturan), lewat `studio cek`
  aksi: z.array(z.object({ jenis: z.string() }).passthrough()).optional(),
});
const titikKamera = z.object({ zoom: z.number().positive().optional(), x: z.number().optional(), y: z.number().optional(), rotasi: z.number().min(-30).max(30).optional() });
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
      dari: titikKamera.optional(),
      ke: titikKamera.optional(),
      easing: z.enum(['halus', 'linear', 'masuk', 'keluar']).optional(),
      goyang: z.number().min(0).max(1).optional(),
    })
    .nullable()
    .optional(),
  sfx: z.array(z.object({ file: z.string(), pada: z.number().min(0), volume: z.number().optional() })).optional(),
  transisi: z.enum(['potong', 'fade', 'geser', 'hitam']).optional(),
  cap: z.string().max(32, 'cap maksimal 32 karakter').nullable().optional(),
  kartuWaktu: z
    .object({
      label: z.string().max(24).optional(),
      jam: z.string().min(1).max(12, 'jam maksimal 12 karakter'),
      seri: z.string().max(40).optional(),
      muncul: z.number().min(0).optional(),
      hilang: z.number().min(0).nullable().optional(),
    })
    .nullable()
    .optional(),
  kartuPenutup: z
    .object({ atas: z.string().max(24).optional(), judul: z.string().min(1).max(40), bawah: z.string().max(24).optional(), muncul: z.number().min(0).optional() })
    .nullable()
    .optional(),
  filter: z.enum(['kilas-balik', 'hitam-putih']).nullable().optional(),
  pudarAkhir: z.number().min(0).nullable().optional(),
  latarParallax: z.number().min(0).max(3).optional(),
  pilihan: z
    .object({
      judul: z.string().max(28).optional(),
      opsi: z.array(z.string().min(1).max(32, 'opsi pilihan maksimal 32 karakter')).min(2, 'pilihan minimal 2 opsi').max(3, 'pilihan maksimal 3 opsi'),
      ajakan: z.string().max(32).optional(),
      lanjut: z.string().max(28).nullable().optional(),
      muncul: z.number().min(0).optional(),
    })
    .nullable()
    .optional(),
  kartuKabar: z
    .object({ label: z.string().max(24).optional(), teks: z.string().min(1).max(80), muncul: z.number().min(0).optional(), hilang: z.number().min(0).nullable().optional() })
    .nullable()
    .optional(),
  namaPembicara: z.string().max(18).nullable().optional(),
  kerumunan: z
    .array(
      z.object({
        jumlah: z.number().int().min(1).max(200, 'kerumunan maksimal 200 figur per kelompok'),
        area: z
          .object({ x1: z.number(), x2: z.number(), y1: z.number().min(0).max(1.5), y2: z.number().min(0).max(1.5) })
          .refine((a) => a.x1 < a.x2 && a.y1 <= a.y2, 'area: x1 < x2 dan y1 <= y2'),
        tinggi: z.tuple([z.number().positive().max(1), z.number().positive().max(1)]).optional(),
        gerak: z.enum(['diam', 'gelisah', 'jalan', 'lari', 'sorak']).optional(),
        arah: z.enum(['kiri', 'kanan', 'acak']).optional(),
        kecepatan: z.number().min(0).max(1).optional(),
        palet: z.array(z.string()).max(16).optional(),
        hijab: z.number().min(0).max(1).optional(),
        kopiah: z.number().min(0).max(1).optional(),
        siluet: z.boolean().optional(),
        benih: z.number().int().optional(),
        z: z.number().optional(),
        kabur: z.number().min(0).max(40).optional(),
      }),
    )
    .max(6)
    .optional(),
  efek: z.array(z.object({ jenis: z.enum(['api', 'asap']), x: z.number(), y: z.number(), skala: z.number().positive().max(6).optional(), z: z.number().optional() })).max(12).optional(),
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
      lampu: z
        .array(z.object({ x: z.number(), y: z.number(), warna: z.string().optional(), jangkau: z.number().positive().max(2).optional(), kedip: z.boolean().optional() }))
        .max(6)
        .nullable()
        .optional(),
      gelapLampu: z.number().min(0).max(1).optional(),
      kilat: z.array(z.number().min(0)).nullable().optional(),
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
  episode: z.number().int().positive().optional(),
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
