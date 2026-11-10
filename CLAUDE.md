# Animantra Studio: aturan kerja Claude

Folder ini adalah studio video animasi vertikal (1080×1920) berbasis Remotion.
Pengguna memesan video lewat **studio di browser** (lokal, `http://127.0.0.1:4321`).
**Kamu (Claude) adalah pekerjanya**: kamu menerima pesanan, menulis naskah, menggambar aset
vector, lalu merender. Progres yang kamu laporkan tampil langsung di studio.

Semua perintah dijalankan dengan `node studio.mjs <perintah>` (sama di Windows & Mac,
jangan pakai perintah khusus bash). Jalankan `node studio.mjs bantuan` untuk daftar lengkap.

## Saat pengguna mengetik "buka studio"

Ikuti skill `buka-studio` (`.claude/skills/buka-studio/SKILL.md`). Ringkasnya:
1. `node studio.mjs server` **di background**. Studio akan terbuka di browser.
2. `node studio.mjs listen` **di background**. Selama perintah ini jalan, studio menampilkan
   "Chat Claude terhubung".
3. Balas singkat ke pengguna bahwa studio sudah siap, lalu tunggu.
4. Saat `listen` selesai dan mencetak `=== PESANAN BARU ===`, kerjakan pesanan itu (lihat di bawah).
   Jika selesai dengan `TIDAK ADA PESANAN`, jalankan `listen` lagi di background tanpa komentar.
5. Setelah satu pesanan selesai (atau gagal), **selalu** jalankan `listen` lagi di background.

## Membuat video baru

Data pesanan ada di `videos/<slug>/pesanan.json`: format + panduannya, topik, durasi target,
suara, musik, dan **gaya yang wajib dipakai**. Kerjakan tahap demi tahap dan laporkan setiap tahap:

```
node studio.mjs progress --job <ID> --tahap <tahap> --status mulai --log "kalimat singkat"
node studio.mjs progress --job <ID> --tahap <tahap> --status selesai --log "hasilnya"
```

Tulis log sebagai satu kalimat yang enak dibaca pengguna, misalnya "Riset selesai: pegas utama, tombol pengunci".

| Tahap | Yang dikerjakan |
|---|---|
| `riset` | Cari fakta yang benar (WebSearch bila perlu). Catat poin & sumber di `riset.md`. Jangan mengarang angka. |
| `naskah` | Tulis `spec.json` (judul, adegan, narasi) + `caption.txt`. Lihat `panduan/spec.md`. Jalankan `node studio.mjs cek --job <ID>`. |
| `suara` | `node studio.mjs tts --job <ID>`. Perintah ini melapor sendiri dan mengisi `suara` & `durasi` tiap adegan. Penyedia (Edge tanpa key/Azure/ElevenLabs/Gemini) dipilih pengguna di form. Kredit dicek sebelum mulai; kalau kurang, otomatis pindah ke penyedia lain untuk **seluruh** video. Kalau keluar dengan `Semua penyedia suara gagal`, **jangan render tanpa suara diam-diam**: tandai `gagal` dengan alasan dari pesan itu (misal "Kredit ElevenLabs habis, pulih 6 Des"). |
| `model` | Gambar aset SVG di `aset/` mengikuti `panduan/aset-vector.md`, lalu isi `aset`, `label`, `kamera`, `animasi` di spec. |
| `cek` | `node studio.mjs still --job <ID> --detik 1,5,12,...` (1 titik per adegan). **Buka setiap PNG dengan Read** dan periksa (lihat "Cek gambar"). Perbaiki lalu ulangi bila perlu (maksimal 3 putaran). |
| `audio` | Pilih musik & SFX dari `node studio.mjs audio`. Isi `musik` dan `sfx` di spec. |
| `render` | `node studio.mjs render --job <ID>`. Perintah ini melapor %, membuat cover & cuplikan, lalu menandai job selesai. |

Durasi akhir sebaiknya berada dalam ±15% dari target. Kalau setelah `tts` terlalu panjang atau
pendek, ubah narasi lalu jalankan `tts` lagi.

### Format Cerita (tokoh & dialog)
Kalau `format.kunci` = `cerita`, **baca `panduan/cerita.md` dulu**. Tokoh dirender otomatis dari
`pemeran` (jangan digambar); kamu menulis skenario per baris ucapan, menggambar/memakai ulang latar,
dan mengarahkan pose/ekspresi/kamera/suasana. Tahap `model` = tokoh & latar.

### Format Mystery Storytelling (`mystery-story`)
Pipeline sama dengan Cerita. **Baca `panduan/mystery-files.md` dan `panduan/mystery-storytelling.md` dulu.**
Wajib `riset.md` dengan 5 kategori (fakta terverifikasi, hipotesis, legenda, spekulasi, tidak diketahui)
ditambah Sumber; `cek` menolak tanpa itu. Jangan menyajikan spekulasi sebagai fakta dan jangan mengarang kutipan.
Agent Morgan: `panduan/mystery-character.md`.

### Format POV Bayangkan (`pov-bayangkan`)
Pipeline sama dengan Cerita. **Baca `panduan/pov-bayangkan.md` dulu.** Narasi orang kedua (penonton = tokoh utama),
berseri. Field khusus adegan: `cap`, `kartuWaktu`, `kartuPenutup`, `filter`, `pudarAkhir`, `transisi: "hitam"`,
plus `episode` di spec. Topik agama/sejarah: hanya dari sumber sahih (catat di `riset.md`).

### Naskah
- Bahasa Indonesia santai dan jelas, gaya kreator edukasi. Hook pertanyaan di 3 detik pertama.
- ±2,5 kata per detik bicara. Satu adegan = satu ide, 6–16 kata, durasi 2,5–7 detik.
- Tandai 1–2 kata kunci per adegan dengan `*kata*` (disorot di subtitle).
- Judul maksimal ±32 karakter dan selalu memancing rasa penasaran. `judulSorot` = potongan judul yang paling "menjual".
- Ikuti `panduan` format di `pesanan.json`. Seri (badge) diambil otomatis dari gaya/format.

### Caption (`caption.txt`)
```
=== CAPTION UTAMA ===
<kalimat hook + emoji>

<2–4 baris penjelasan / poin bernomor>

<ajakan komentar>

=== HASHTAG ===
#... (5–8 hashtag relevan)
```

### Musik
- `musik: "tanpa"` → `"musik": null`.
- `musik: "otomatis"` → pilih dari `node studio.mjs audio` sesuai suasana (nama file biasanya menggambarkan mood). Kalau folder kosong, `null`.
- Nama file → `"musik": { "file": "musik/<nama file>", "volume": 0.12 }`.
- Volume musik 0,08–0,2. Ada narasi → maksimal 0,14.

### Cek gambar
Periksa setiap PNG: teks tidak terpotong dan tidak menumpuk; label menunjuk bagian yang benar;
aset tidak menutupi judul/subtitle (zona aman: judul di 8–30% atas, subtitle di 82–88%,
kartu di sekitar 72–78%); warna mengikuti gaya; benda terbaca jelas di ukuran HP.

## Mengulang job yang gagal (`ulangan` > 0)

Pengguna menekan **Ulangi** di studio (kadang dengan suara baru di `suara`). `tahapSelesai` berisi
tahap yang sudah beres. **Jangan ulangi tahap itu**: pakai `riset.md`, `spec.json`, dan `aset/` yang
sudah ada, lalu lanjutkan dari tahap pertama yang belum selesai. Biasanya dimulai dari `tts`.

## Mengerjakan revisi (`jenis: "revisi"`)

`pesanan.json` berisi `revisi` (permintaan pengguna). Spec lama sudah dicadangkan di `riwayat/`.
1. Baca `spec.json` dan pahami permintaannya. Kerjakan **hanya** yang diminta.
2. Tandai tahap yang tidak disentuh dengan `--status lewati`. Contoh: revisi musik → lewati
   riset/naskah/suara/model, lalu jalankan `audio`, `cek` (cepat), dan `render`.
3. Kalau narasi berubah, wajib jalankan `tts` lagi. Kalau visual berubah, wajib `still` lalu cek.
4. Tutup dengan `render` (menaikkan versi video).

Panduan cepat untuk revisi yang sering muncul:
- "musik kurang nendang" → pilih track lebih energik dan naikkan volume, tambah SFX di momen kunci.
- "kamera terlalu dekat" → kecilkan `kamera.ke.zoom` atau `lebar` aset.
- "terlalu cepat" → tambah durasi adegan, atau pecah adegan.

## Aturan penting
- Kalau perintah apa pun keluar dengan kode 3 / `DIBATALKAN`: **hentikan job itu segera**, tanpa
  render. Langsung kembali ke `listen`.
- Kalau buntu setelah 3 kali coba: `node studio.mjs gagal --job <ID> --pesan "alasan singkat"`, lalu `listen`.
- Jangan ubah `gaya` di spec; salin apa adanya dari `pesanan.json` (gaya dikunci per video).
  Pengecualian: revisi yang jelas meminta perubahan tampilan teks/subtitle (misal "subtitlenya kebesaran",
  "pakai stabilo hijau") → ubah **hanya** `spec.gaya.teks` (lihat tipe `GayaTeks` di `shared/tipe.ts`).
- Subtitle karaoke memakai `adegan.kata` (waktu per kata) yang diisi otomatis oleh `tts`. Kalau narasi
  diubah setelah `tts`, jalankan `tts` lagi supaya karaoke tetap pas dengan suara.
- Jangan menyentuh folder video lain selain `videos/<slug>` milik job.
- Kode studio/Remotion hanya diubah kalau pengguna memintanya secara langsung di chat.
