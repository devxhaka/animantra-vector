// Tipe data bersama: dipakai studio (browser), server, CLI, dan Remotion.

export type KunciHuruf = 'tegas' | 'bulat' | 'poster' | 'klasik';

export type Gaya = {
  id: string;
  nama: string;
  /** Nama seri: badge kecil di atas judul, misal "KITA BONGKAR". Kosong = pakai nama format. */
  seri: string;
  warna: {
    latar: string; // dinding / latar atas
    lantai: string; // latar bawah
    teks: string; // judul & teks utama
    merek: string; // badge seri, aksen
    sorot: string; // kotak sorot judul, kata penting
    teksSorot: string; // teks di atas kotak sorot
    label: string; // latar label panah
    teksLabel: string;
  };
  gelap: boolean;
  huruf: KunciHuruf;
  bentuk: {
    sudut: number; // radius sudut px (0 = tajam)
    label: 'kotak' | 'pil';
    outline: number; // tebal garis tepi kotak sorot / kartu (px)
    bayangan: boolean;
  };
  /** Tampilan teks karaoke/subtitle. Kosong = tampilan lama (TEKS_KLASIK). */
  teks?: GayaTeks;
  logo?: {
    file: string; // nama file di data/gaya/
    posisi: 'kiri-atas' | 'kanan-atas' | 'kiri-bawah' | 'kanan-bawah';
    ukuran: number; // lebar relatif kanvas 0..1
  } | null;
};

export type HurufTeks = KunciHuruf | 'poppins' | 'montserrat' | 'bebas' | 'lilita' | 'baloo';
export type EfekSorot = 'warna' | 'stabilo' | 'kotak' | 'garis-bawah' | 'membesar' | 'tidak';

export type GayaTeks = {
  huruf: HurufTeks | 'ikut'; // 'ikut' = sama dengan huruf gaya
  ukuran: number; // px di kanvas 1080 lebar
  kapital: boolean;
  warna: string;
  garis: { warna: string; tebal: number }; // tepi huruf (0 = tanpa)
  bayangan: boolean;
  latarBaris: { aktif: boolean; warna: string; opasitas: number }; // kotak di belakang seluruh baris
  posisi: number; // 0..1 dari atas (tengah teks)
  kataPerBaris: number;
  mode: 'karaoke' | 'muncul' | 'statis'; // karaoke = kata aktif disorot; muncul = kata muncul satu per satu
  efek: EfekSorot; // efek untuk kata yang sedang diucapkan
  warnaSorot: string; // warna stabilo/kotak/garis/teks aktif
  warnaTeksSorot: string; // warna huruf di atas stabilo/kotak
  kataKunci: 'warna' | 'stabilo' | 'tidak'; // gaya untuk *kata* penting
  warnaKunci: string;
  masuk: 'pop' | 'naik' | 'fade' | 'tidak'; // animasi saat baris baru tampil
};

export const TAHAP = [
  { kunci: 'riset', label: 'Riset' },
  { kunci: 'naskah', label: 'Naskah' },
  { kunci: 'suara', label: 'Suara' },
  { kunci: 'model', label: 'Model 3D' },
  { kunci: 'cek', label: 'Cek gambar' },
  { kunci: 'audio', label: 'SFX & musik' },
  { kunci: 'render', label: 'Render' },
] as const;
export type KunciTahap = (typeof TAHAP)[number]['kunci'];

export type StatusTahap = 'belum' | 'jalan' | 'selesai' | 'lewati';

export type JenisJob = 'baru' | 'revisi' | 'render-ulang';
export type StatusJob = 'antre' | 'dikerjakan' | 'selesai' | 'gagal' | 'dibatalkan';

export type FormBaru = {
  format: string;
  topik: string;
  durasi: number; // detik
  suara: string; // nama voice Gemini
  musik: string; // 'otomatis' | 'tanpa' | nama file di musik/
  gayaId: string;
  // ---- format Cerita ----
  pemeran?: string[]; // id karakter
  sudut?: 'pov' | 'dialog' | 'narator';
  nuansa?: string;
  lanjutan?: string | null; // slug video sebelumnya (episode lanjutan)
};

export type Job = {
  id: string;
  jenis: JenisJob;
  status: StatusJob;
  dibuat: string;
  diperbarui: string;
  slug: string; // folder videos/<slug>
  judul: string; // judul sementara (topik) → diganti judul video
  form: FormBaru;
  revisi?: string;
  tahap: Record<KunciTahap, StatusTahap>;
  tahapAktif: KunciTahap | null;
  persen: number | null; // progres tahap aktif (render)
  log: { waktu: string; teks: string }[];
  pesanGagal?: string;
  ulangan?: number; // berapa kali job diulang setelah gagal
  ditutup?: boolean; // kartu gagal/batal disembunyikan pengguna
};

export type VideoMeta = {
  slug: string;
  judul: string;
  format: string;
  topik: string;
  durasi: number; // detik hasil akhir
  dibuat: string;
  diperbarui: string;
  versi: number;
  ada: { video: boolean; cover: boolean; caption: boolean; cuplikan: number };
};

// ---------- Spec video (ditulis Claude di videos/<slug>/spec.json) ----------

export type Keyframe = {
  prop: 'x' | 'y' | 'skala' | 'rotasi' | 'opasitas';
  dari: number;
  ke: number;
  mulai: number; // detik relatif adegan
  selesai: number;
  easing?: 'linear' | 'halus' | 'pegas' | 'masuk' | 'keluar';
};

export type Aset = {
  file: string; // relatif folder video, misal "aset/pulpen.svg"
  x: number; // 0..1 posisi tengah aset di kanvas
  y: number;
  lebar: number; // 0..1 lebar relatif kanvas
  rotasi?: number;
  masuk?: 'pop' | 'fade' | 'geser-kiri' | 'geser-kanan' | 'geser-bawah' | 'tidak';
  animasi?: Keyframe[];
  loop?: 'goyang' | 'melayang' | 'putar' | 'denyut' | null;
  z?: number;
};

export type Label = {
  teks: string;
  x: number; // titik yang ditunjuk 0..1
  y: number;
  arah?: 'kiri' | 'kanan'; // label di kiri titik (panah →) atau kanan (panah ←)
  muncul?: number; // detik relatif adegan
};

export type Adegan = {
  id: string;
  narasi: string; // *kata* = disorot di subtitle
  durasi: number; // detik (diisi ulang oleh `studio tts`)
  suara?: string | null; // file audio relatif, diisi `studio tts`
  tampilJudul?: boolean; // tampilkan judul + badge seri
  teksBesar?: string | null; // teks kejutan besar, misal "KLIK!"
  aset?: Aset[];
  label?: Label[];
  kartu?: { tag?: string; teks: string; nilai?: string } | null;
  kamera?: { dari?: { zoom?: number; x?: number; y?: number }; ke?: { zoom?: number; x?: number; y?: number } } | null;
  sfx?: { file: string; pada: number; volume?: number }[];
  transisi?: 'potong' | 'fade' | 'geser';
  // ---- format Cerita ----
  /** id pemeran yang bicara di adegan ini, atau "narator". Menentukan suara & gerak mulut. */
  pembicara?: string | null;
  /** SVG latar penuh 1080×1920 (relatif folder video), ikut bergerak bersama kamera. */
  latar?: string | null;
  suasana?: Suasana | null;
  tokoh?: TokohAdegan[];
  /** Amplop gerak mulut per frame (0..1), diisi otomatis oleh `studio tts`. */
  mulut?: number[] | null;
  /** Waktu tiap kata (detik relatif adegan) untuk karaoke, diisi otomatis oleh `studio tts`. */
  kata?: { t: string; a: number; b: number }[] | null;
};

// ---------------- Karakter ----------------
export type JenisKelamin = 'perempuan' | 'laki';
export type Usia = 'anak' | 'remaja' | 'dewasa' | 'tua';
export type Pakaian = 'hijab-gamis' | 'hijab-kasual' | 'rambut-panjang' | 'koko-kopiah' | 'kasual' | 'kemeja' | 'jubah-sorban';

export type Karakter = {
  id: string; // huruf kecil, dipakai di spec, misal "kakak"
  nama: string; // tampil di subtitle, misal "Kak Aisyah"
  peran: string; // keterangan untuk Claude, misal "kakak sulung, tenang, hafal Al-Kahfi"
  jenis: JenisKelamin;
  usia: Usia;
  pakaian: Pakaian;
  warna: { kulit: string; rambut: string; atasan: string; bawahan: string; penutup: string; sepatu: string };
  suara: string; // "azure:id-ID-GadisNeural" dst.
};

export const POSE = ['diam', 'menunjuk', 'melambai', 'berpikir', 'kaget', 'berdoa', 'tangan-di-dada', 'memeluk-diri', 'menenangkan', 'meraih', 'menjelaskan', 'jalan'] as const;
export type Pose = (typeof POSE)[number];
export const EKSPRESI = ['netral', 'senang', 'tenang', 'cemas', 'takut', 'kaget', 'sedih', 'serius', 'bingung'] as const;
export type Ekspresi = (typeof EKSPRESI)[number];
export type Lihat = 'depan' | 'kiri' | 'kanan' | 'atas' | 'bawah';

export type TokohAdegan = {
  id: string; // id Karakter
  x: number; // posisi kaki 0..1
  y?: number; // posisi kaki 0..1 (bawaan 0.8)
  skala?: number; // 1 = tinggi normal
  hadap?: 'kiri' | 'kanan';
  pose?: Pose;
  ekspresi?: Ekspresi;
  lihat?: Lihat;
  /** perubahan di tengah adegan (detik relatif adegan) */
  urutan?: { pada: number; pose?: Pose; ekspresi?: Ekspresi; lihat?: Lihat; hadap?: 'kiri' | 'kanan' }[];
  jalan?: { ke: number; mulai: number; selesai: number } | null;
  z?: number;
  siluet?: boolean; // tampil sebagai bayangan hitam (sosok yang tidak boleh/tidak perlu digambar jelas)
};

export type Suasana = {
  gelap?: number; // 0..1 lapisan malam
  warnaLangit?: string | null; // rona warna, misal "#7a1f1f" untuk langit merah
  kabut?: boolean;
  hujan?: boolean;
  gempa?: number; // 0..1 kekuatan guncangan
  cahaya?: { x: number; y: number; warna?: string } | null; // sorot cahaya dari langit
  vinyet?: boolean;
};

export type Spec = {
  versi: 1;
  format: string;
  judul: string;
  judulSorot?: string; // bagian judul yang diberi kotak sorot
  seri?: string; // menimpa nama seri dari gaya
  fps: number;
  lebar: number;
  tinggi: number;
  gaya: Gaya;
  logo?: string | null; // file logo relatif folder video
  musik?: { file: string; volume?: number } | null;
  /** snapshot pemeran (format Cerita), disalin dari pesanan.json */
  pemeran?: Karakter[];
  adegan: Adegan[];
};

export type FormatDef = {
  kunci: string;
  nama: string;
  deskripsi: string;
  seri: string;
  panduan: string; // instruksi struktur untuk Claude
};
