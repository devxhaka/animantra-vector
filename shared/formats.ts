import type { FormatDef } from './tipe';

export const FORMATS: FormatDef[] = [
  {
    kunci: 'kita-bongkar',
    nama: 'Kita Bongkar',
    deskripsi: 'Cara kerja satu benda',
    seri: 'KITA BONGKAR',
    panduan:
      'Bongkar SATU benda. Adegan 1: hook berupa pertanyaan + judul + benda utuh. Lalu tampilan potongan (cutaway) yang memperlihatkan komponen dalam, dengan label panah per komponen. Tiap komponen bergerak sesuai fungsinya (pakai animasi/layer terpisah). Tutup dengan rangkuman 1 kalimat + ajakan.',
  },
  {
    kunci: 'cerita',
    nama: 'Cerita',
    deskripsi: 'Tokoh, dialog & suasana',
    seri: 'CERITA',
    panduan:
      'Cerita animasi dengan pemeran dari pesanan. Satu adegan = satu baris dialog/narasi (isi "pembicara"). Bangun 3 babak: pembuka (situasi + rasa penasaran) → konflik/ketegangan → resolusi + pesan. Pakai latar, suasana, dan bahasa kamera (lebar → dekat). Ikuti "sudut" (pov/dialog/narator) dan "nuansa" pesanan. Lihat panduan/cerita.md.',
  },
  {
    kunci: 'tur-lingkungan',
    nama: 'Tur Lingkungan',
    deskripsi: 'Beberapa benda, satu tempat',
    seri: 'TUR LINGKUNGAN',
    panduan:
      'Satu ruangan/tempat berisi 3-5 benda. Kamera berpindah (pan/zoom) dari benda ke benda; tiap benda 1 fakta singkat dengan label. Adegan terakhir zoom out ke seluruh ruangan.',
  },
  {
    kunci: 'story',
    nama: 'Story',
    deskripsi: 'Kisah penemuan',
    seri: 'KISAH PENEMUAN',
    panduan:
      'Kisah penemuan berurutan waktu: tokoh + tahun + kejadian kunci + eksperimen + dampak sekarang. Pakai kartu tahun/nama. Seri boleh ditambah tahun, misal "KISAH PENEMUAN · 1945".',
  },
  {
    kunci: 'pov',
    nama: 'POV',
    deskripsi: 'Perjalanan dari sudut benda',
    seri: 'POV',
    panduan:
      'Narasi orang pertama dari sudut sebuah benda/zat ("Aku air di sumur..."). Ikuti perjalanannya tahap demi tahap; tiap tahap 1 lokasi dengan label "AKU DI SINI".',
  },
  {
    kunci: 'tutorial',
    nama: 'Tutorial',
    deskripsi: 'Langkah aman dan benar',
    seri: 'TUTORIAL',
    panduan:
      'Langkah bernomor 3-5. Tiap langkah: kartu nomor + aksi + alasan keamanan singkat. Tandai larangan dengan jelas. Seri: "TUTORIAL · N LANGKAH".',
  },
  {
    kunci: 'mitos-fakta',
    nama: 'Mitos vs Fakta',
    deskripsi: 'Uji klaim populer',
    seri: 'MITOS VS FAKTA',
    panduan:
      'Mulai dari klaim populer (teksBesar "MITOS?"). Uji dengan penjelasan + visual. Vonis tegas: kartu tag "MITOS"/"FAKTA"/"SEBAGIAN". Tutup dengan tips praktis.',
  },
  {
    kunci: 'a-vs-b',
    nama: 'A vs B',
    deskripsi: 'Adu dua pilihan',
    seri: 'A VS B',
    panduan:
      'Dua benda berdampingan kiri-kanan. Adu 3 ronde (mis. harga, daya, umur) dengan kartu angka. teksBesar "SIAPA MENANG?" di awal. Akhiri pemenang + kapan pilih yang lain.',
  },
  {
    kunci: 'top-list',
    nama: 'Top List',
    deskripsi: 'Hitung mundur 3–5 hal',
    seri: 'TOP 5',
    panduan:
      'Hitung mundur 3-5 item dari nomor terbesar. Tiap item: teksBesar nomor, visual benda, 1 alasan + angka. Nomor 1 paling mengejutkan. Seri sesuaikan jumlah: "TOP 3"/"TOP 5".',
  },
  {
    kunci: 'apa-jadinya',
    nama: 'Apa Jadinya Kalau',
    deskripsi: 'Akibat salah pakai',
    seri: 'APA JADINYA KALAU…',
    panduan:
      'Skenario salah pakai. Tampilkan pemakaian salah → reaksi berantai bertahap (panas, korslet, dst.) dengan label → cara yang benar. Nada edukatif, bukan menakut-nakuti.',
  },
  {
    kunci: 'evolusi',
    nama: 'Evolusi',
    deskripsi: 'Dari masa ke masa',
    seri: 'EVOLUSI',
    panduan:
      'Garis waktu 4-6 era. Tiap era: kartu tahun + versi benda pada masa itu + 1 perubahan kunci. Benda berubah bentuk antar adegan (transisi geser).',
  },
  {
    kunci: 'kuis',
    nama: 'Kuis',
    deskripsi: 'Tebak, hitung mundur, jawab',
    seri: 'KUIS',
    panduan:
      'Pertanyaan + 3 pilihan (kartu A/B/C). Hitung mundur 3-2-1 dengan teksBesar. Ungkap jawaban + alasan singkat. Ajak penonton komentar jawabannya.',
  },
];

export const formatDari = (kunci: string) => FORMATS.find((f) => f.kunci === kunci) ?? FORMATS[0];

export const SUARA = [
  { nama: 'Kore', ket: 'Perempuan, tegas' },
  { nama: 'Aoede', ket: 'Perempuan, ringan' },
  { nama: 'Leda', ket: 'Perempuan, muda' },
  { nama: 'Zephyr', ket: 'Perempuan, cerah' },
  { nama: 'Puck', ket: 'Laki-laki, ceria' },
  { nama: 'Charon', ket: 'Laki-laki, informatif' },
  { nama: 'Fenrir', ket: 'Laki-laki, bersemangat' },
  { nama: 'Orus', ket: 'Laki-laki, mantap' },
];
