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
    kunci: 'mystery-story',
    nama: 'Mystery Storytelling',
    deskripsi: 'Kasus misteri sinematik',
    seri: 'MYSTERY FILES',
    panduan:
      'Kisah misteri sinematik dibawakan pemeran (biasanya Agent Morgan) + narator. 5 babak: HOOK (pertanyaan/kejanggalan, ≤5 dtk) → SETUP (tempat, waktu, tokoh asli) → INVESTIGATION (bukti satu per satu) → REVELATION (apa yang diketahui vs belum) → CLOSING (pertanyaan terbuka + ajakan). Bedakan fakta terverifikasi, hipotesis, legenda, spekulasi, dan yang tidak diketahui; jangan pernah menyajikan spekulasi sebagai fakta. Wajib riset.md bersumber. Baca panduan/mystery-files.md.',
  },
  {
    kunci: 'pov-bayangkan',
    nama: 'POV Bayangkan',
    deskripsi: 'Kisah orang kedua berseri',
    seri: 'BAYANGKAN',
    panduan:
      'Kisah sinematik orang kedua: PENONTON adalah tokoh utama ("kamu/kalian", "adikmu"), narator berbicara langsung kepadanya; pemeran dari pesanan menjadi tokoh yang menemani penonton. Berseri: bila ada "lanjutan", buka dengan adegan recap 1-2 kalimat ber-cap "SEBELUMNYA…" (+ filter kilas-balik), lalu adegan pertama episode ini memakai kartuWaktu (label hari, jam, seri - episode). Alur: situasi mencekam → kejadian demi kejadian dengan emosi naik-turun (close-up dengan kamera zoom saat emosional) → kilas balik pakai filter "kilas-balik" → momen hening/doa → penutup kartuPenutup (atas "BAYANGKAN", judul seri, bawah "BERSAMBUNG"/"TAMAT") + pudarAkhir. Kalimat pendek, indrawi, 60-120 dtk. Topik agama/sejarah: hanya dari sumber sahih (catat di riset.md), sampaikan sebagai gambaran/ilustrasi, dan sosok yang tidak boleh/tidak perlu digambar jelas pakai siluet. Lihat panduan/pov-bayangkan.md.',
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

/** Format yang memakai pemeran/tokoh (pipeline Cerita): isian pemeran, suara per tokoh, dst. */
export const FORMAT_BERTOKOH = ['cerita', 'mystery-story', 'pov-bayangkan'];
export const formatBertokoh = (kunci: string | undefined) => !!kunci && FORMAT_BERTOKOH.includes(kunci);
export const formatMisteri = (kunci: string | undefined) => kunci === 'mystery-story';

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
