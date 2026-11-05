# Animantra Studio (animantra-vector)

Studio lokal untuk membuat video animasi vector vertikal (9:16) dengan **Remotion**.
**Claude (tab Code) adalah pekerjanya**: lo cukup mengisi form di browser.

## Pasang (sekali saja)

1. Pasang **Node.js 20 atau lebih baru** dari https://nodejs.org (Windows & Mac).
2. Buka folder ini di terminal, lalu jalankan:
   ```
   npm install
   ```
3. **Suara langsung jalan tanpa key**: suara neural Microsoft **Gadis & Ardi** lewat layanan
   Read Aloud Edge (otomatis aktif, bisa dimatikan dengan `EDGE_TTS=0`). Ini layanan **tidak resmi**:
   bisa berubah atau diblokir Microsoft sewaktu-waktu, dan hanya untuk pemakaian pribadi (bukan SaaS).
   Supaya tetap aman kalau Edge bermasalah, salin `.env.example` menjadi `.env`, lalu isi key cadangan:
   - **`AZURE_SPEECH_KEY` + `AZURE_SPEECH_REGION` (disarankan)**: suara penutur asli Indonesia
     **Gadis** & **Ardi**, gratis ±500 ribu karakter/bulan (paket F0), resmi, dan aman untuk SaaS.
     Cara dapat: portal.azure.com → *Create a resource* → **Speech service** → Pricing tier **Free F0**
     → setelah jadi, buka *Keys and Endpoint*, salin **KEY 1** dan **Location/Region**.
   - `ELEVENLABS_API_KEY` (https://elevenlabs.io → Profile → API Keys). Free tier ±10.000 karakter/bulan,
     non-komersial dan wajib atribusi. `ELEVENLABS_MODEL=eleven_flash_v2_5` menghemat ±50% kredit.
     Suara dari Voice Library (termasuk suara asli Indonesia) muncul di studio setelah ditambahkan ke "My Voices".
   - `GEMINI_API_KEY` (https://aistudio.google.com/apikey), kuota harian gratis.
   Urutan cadangannya: pilihan lo → Edge → Azure → ElevenLabs bawaan → Gemini.
   Satu video selalu memakai satu suara yang sama dari awal sampai akhir.
   Tanpa key, video tetap jadi tapi tanpa suara.
4. (Opsional) Taruh musik bebas royalti (MP3) di folder `musik/`. Beri nama sesuai suasana,
   misal `energik-pop.mp3` atau `santai-lofi.mp3`, supaya Claude bisa memilih otomatis.
   SFX contoh sudah ada di `sfx/` (pop, klik, ding, whoosh, naik). Tambahkan sendiri kalau mau.

Render pertama akan mengunduh Chrome Headless milik Remotion secara otomatis (±100 MB, sekali saja).

## Pemakaian sehari-hari

1. Buka aplikasi **Claude → tab Code**, pilih folder `animantra-vector`.
2. Ketik **buka studio**.
3. Browser membuka `http://127.0.0.1:4321`, dan di pojok kanan atas muncul **● Chat Claude terhubung**.
4. Di kolom kiri, pilih format, tulis topik, atur durasi, suara, musik, dan gaya, lalu klik **Buat Video Baru**.
5. Progres (Riset → Naskah → Suara → Model 3D → Cek gambar → SFX & musik → Render %) tampil di
   "Sedang dikerjakan". Detailnya bisa dilihat juga di chat Claude.
6. Klik sampul video untuk memutar, mengunduh, menyalin caption, **revisi**, atau render ulang.
7. Tab **Gaya Saya** untuk mengatur warna, huruf, bentuk, nama seri, dan logo. Klik
   **Simpan & pakai**, maka gaya itu otomatis dipakai di video berikutnya.

### Mystery Files (format **Mystery Storytelling**)
Video misteri sinematik dengan tokoh tetap **Agent Morgan** dan gaya gelap teal/amber "Mystery Files".
Setiap episode wajib riset bersumber yang memisahkan fakta, hipotesis, legenda, spekulasi, dan hal yang
belum diketahui. Lihat `panduan/mystery-files.md`.

### Mengatur teks karaoke (subtitle)
Tab **Gaya Saya → Teks karaoke**: pilih contoh (Klasik, Karaoke warna, Stabilo, Kotak CapCut,
Pop besar, Muncul per kata, Minimal) lalu atur sendiri:
- **Huruf** (10 pilihan, termasuk Poppins, Montserrat, Bebas Neue, Lilita One, Baloo 2), ukuran, HURUF KAPITAL.
- **Cara tampil**: karaoke (kata aktif menyala mengikuti suara), muncul per kata, atau diam.
- **Efek kata aktif**: ganti warna, stabilo (tersapu mengikuti ucapan), kotak, garis bawah, membesar.
- **Warna teks, tepi huruf, bayangan, kotak di belakang baris**, warna kata kunci (`*kata*`),
  jumlah kata per baris, posisi, dan animasi baris baru.
Pratinjau animasinya langsung tampil di kanan. **Simpan & pakai**, maka video berikutnya memakai gaya teks itu.
Waktu tiap kata dihitung otomatis dari suara saat tahap Suara.

### Video cerita dengan tokoh (format **Cerita**)
1. Tab **Karakter**: buat pemeran (nama, peran & sifat, jenis kelamin, usia, pakaian, warna, suara).
   Contoh "Kak Aisyah" & "Raka" sudah tersedia. Klik salah satu pose untuk melihat geraknya.
2. Tab **Video**: pilih format **Cerita**, tulis topik, centang pemeran, lalu pilih sudut cerita
   (dialog / POV / narator), nuansa, dan episode (cerita baru atau lanjutan).
3. Claude menulis skenario, memberi suara berbeda per tokoh, menggambar latar, lalu mengatur pose,
   ekspresi, kamera, dan suasana (malam, langit merah, kabut, hujan, guncangan, cahaya).
   Mulut tokoh bergerak mengikuti suaranya.
4. Latar yang pernah dibuat disimpan di `perpustakaan/latar/` dan dipakai ulang di video berikutnya.

Studio hanya berjalan di komputer lo (`127.0.0.1`). Tidak ada yang diunggah ke internet.
Pesanan yang dibuat saat Claude tertutup tetap tersimpan di antrean dan dikerjakan begitu kamu
mengetik "buka studio" lagi.

### Supaya Claude tidak minta izin di setiap perintah (opsional)
Buat file `.claude/settings.json` di folder ini:
```json
{ "permissions": { "allow": ["Bash(node studio.mjs:*)", "Bash(npm install)", "WebSearch"] } }
```

## Menjalankan di sesi cloud Claude Code

Buka sesi Claude Code (web) dengan repo ini, lalu ketik **buka studio**. CLI mengenali sesi cloud
otomatis: server menerima akses dari **panel pratinjau** app Claude dan render memakai Chromium
bawaan container. Studio dibuka lewat panel pratinjau, bukan `127.0.0.1`.
- Suara Edge (tanpa key) butuh host `api.msedgeservices.com` diizinkan di **Akses jaringan**.
- API key suara ditambahkan di pengaturan lingkungan cloud → **Variabel lingkungan**
  (`AZURE_SPEECH_KEY`, `AZURE_SPEECH_REGION`, dst.), dan domain layanannya di **Akses jaringan**.
  Berlaku di sesi baru.
- Container bersifat sementara: unduh video yang ingin disimpan sebelum sesi berakhir.

## Struktur

```
CLAUDE.md               aturan kerja Claude (alur tahap, naskah, revisi)
.claude/skills/         skill "buka studio"
panduan/                format spec.json & gaya aset vector 3D
studio/                 web app (React + Vite)
server/                 server lokal: antrean job, riwayat, gaya
cli/                    perintah `node studio.mjs ...` yang dipakai Claude
remotion/               komposisi video (membaca spec.json + gaya)
shared/                 tipe data, daftar format, preset gaya
data/                   gaya tersimpan, antrean job
videos/<slug>/          spec.json, aset/, suara/, caption.txt, final.mp4, cover.jpg, cuplikan/
musik/  sfx/            audio lokal
```

## Masalah umum

- **Badge "Chat Claude terputus"**: ketik `buka studio` lagi di Claude.
- **Port 4321 terpakai**: ubah `STUDIO_PORT` di `.env`.
- **Render gagal mengunduh browser** (jaringan kantor/proxy): isi `BROWSER_EXECUTABLE` di `.env`
  dengan path Chrome yang sudah terpasang.
- **Suara gagal / model TTS berganti nama**: ubah `GEMINI_TTS_MODEL` di `.env`.

## Catatan lisensi (sebelum jadi SaaS)

Remotion gratis untuk individu dan tim kecil. Penggunaan komersial oleh perusahaan, termasuk
SaaS, bisa memerlukan **Remotion Company License**. Cek https://www.remotion.dev/license.
