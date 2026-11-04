# Format Cerita: tokoh, dialog & suasana

Video cerita animasi 2D potongan (cut-out). Tokoh **tidak digambar ulang**: tokoh dirender oleh
`remotion/karakter/Tokoh.tsx` dari data pemeran di `pesanan.json`. Tugas Claude adalah menulis skenario,
menggambar **latar**, lalu mengarahkan tokoh (posisi, pose, ekspresi, arah pandang, jalan).

## Isi pesanan
- `pemeran`: daftar tokoh (id, nama, peran & sifat, jenis, usia, pakaian, warna, suara). **Salin apa
  adanya** ke `spec.pemeran`. Jangan ubah tampilan tokoh.
- `sudut`: `dialog` (hanya percakapan) · `pov` (tokoh pertama bercerita sebagai "aku": baris
  narasinya diisi `"pembicara": "<id tokoh pertama>"`) · `narator` (ada narator + dialog).
- `nuansa`: arah emosi cerita. Kosong = tentukan sendiri dari topik.
- `lanjutan`: kalau ada, ini episode lanjutan. Baca naskah episode sebelumnya, jaga kesinambungan
  (latar, sifat tokoh, apa yang sudah mereka ketahui), dan boleh pakai ulang latar dari foldernya.
- `latarPustaka`: latar yang sudah pernah dibuat (`perpustakaan/latar/*.svg`). **Pakai ulang** bila cocok
  (salin ke `videos/<slug>/latar/`).

## Skenario = daftar adegan
**Satu adegan = satu baris ucapan** dari satu pembicara (supaya suara & gerak mulut cocok).

```jsonc
{
  "id": "adik-tanya",
  "pembicara": "adik",                 // id pemeran, atau "narator"
  "narasi": "Kak, Dajjal itu *beneran* ada?",
  "durasi": 3,                         // diisi ulang `studio tts`
  "latar": "latar/teras-malam.svg",
  "suasana": { "gelap": 0.25 },
  "transisi": "potong",                // baris dalam satu tempat: "potong" (terasa bersambung)
  "kamera": { "dari": { "zoom": 1 }, "ke": { "zoom": 1.2, "x": -0.08, "y": 0.06 } },
  "tokoh": [
    { "id": "kakak", "x": 0.68, "hadap": "kiri", "pose": "diam", "ekspresi": "tenang", "lihat": "kiri" },
    { "id": "adik", "x": 0.30, "hadap": "kanan", "pose": "meraih", "ekspresi": "cemas", "lihat": "atas",
      "urutan": [{ "pada": 1.6, "ekspresi": "takut", "pose": "memeluk-diri" }] }
  ]
}
```

### Tokoh di adegan
| field | nilai |
|---|---|
| `x`, `y` | posisi **kaki** (0..1). `y` bawaan 0,8. Tokoh lebih jauh = `y` lebih kecil + `skala` lebih kecil |
| `skala` | 1 = normal. Tinggi sudah mengikuti usia (anak lebih pendek otomatis) |
| `hadap` | `kiri` / `kanan`. Dua tokoh yang bicara biasanya saling berhadapan |
| `pose` | `diam` `menunjuk` `melambai` `berpikir` `kaget` `berdoa` `tangan-di-dada` `memeluk-diri` `menenangkan` `meraih` `menjelaskan` `jalan` |
| `ekspresi` | `netral` `senang` `tenang` `cemas` `takut` `kaget` `sedih` `serius` `bingung` |
| `lihat` | `depan` `kiri` `kanan` `atas` `bawah` (arah bola mata) |
| `urutan` | perubahan di tengah baris: `[{ "pada": detik, "pose"?, "ekspresi"?, "lihat"?, "hadap"? }]` |
| `jalan` | `{ "ke": x tujuan, "mulai": dtk, "selesai": dtk }`. Kaki melangkah otomatis |
| `siluet` | `true` = tampil sebagai bayangan hitam |

- Pose & ekspresi **tersambung halus** dari adegan sebelumnya; cukup tulis keadaan barunya.
- Yang sedang bicara otomatis gerak mulut & mengangguk kecil. Pendengar beri reaksi (`urutan`).
- Tokoh yang bicara **wajib tampil** di adegannya (kecuali narator).
- Pemeran yang tidak sedang di lokasi tidak perlu dicantumkan.

### Bahasa kamera
- Buka tiap lokasi dengan **gambar lebar** (`zoom` 1). Baris emosional: zoom 1,2–1,45 ke wajah pembicara
  (geser `x` ke arah tokoh, `y` positif ±0,05–0,12 karena wajah ada di atas tengah).
- Bergantian sudut tiap 2–3 baris agar tidak monoton. Jangan zoom > 1,6.

### Suasana (`suasana`)
`gelap` 0..1 (malam) · `warnaLangit` (mis. `#8a1e1e` langit merah) · `kabut` · `hujan` ·
`gempa` 0..1 (guncangan) · `cahaya` `{x,y,warna}` (sorot cahaya dari langit) · `vinyet`.
Pakai bertahap: ketegangan naik → efek bertambah; resolusi → `cahaya`, efek dikurangi.

### Latar (`latar/*.svg`)
- SVG **1080×1920** (`viewBox="0 0 1080 1920"`), gaya sama dengan `panduan/aset-vector.md`
  (garis tepi `#1d1d1f` 6–8, 3 nada warna, tanpa `<text>`).
- Tinggi mata kamera: horizon / garis lantai di **y ±1350–1450**, karena kaki tokoh di y ±1536 (0,8).
- Area tengah (y 700–1500) jangan terlalu ramai: di situ tokoh berdiri.
- Latar terang; malam/merah/kabut diatur lewat `suasana`, sehingga satu latar bisa dipakai ulang.
- Setelah jadi, **salin ke `perpustakaan/latar/<nama-deskriptif>.svg`** supaya bisa dipakai ulang.
- Benda tambahan (mushaf, lampu, kendaraan) pakai `aset` biasa. `z` ≥ 5 = di depan tokoh.

## Aturan tema agama (Islam)
- Riset hanya dari sumber terpercaya: Al-Qur'an & hadits shahih/hasan dengan rujukan jelas
  (mis. "HR. Muslim no. 2937"). Hindari riwayat lemah/palsu dan cerita populer tanpa sumber.
  Cantumkan rujukan di `riset.md` dan caption.
- **Para nabi & malaikat tidak digambarkan wujudnya.** Tampilkan lewat `cahaya`, narasi, atau teks.
  Jangan memberi mereka baris dialog dengan tokoh yang terlihat.
- Sosok jahat/gaib (mis. Dajjal) tampil hanya sebagai **siluet** (`"siluet": true`) atau bayangan,
  dari jauh, tidak detail, dan tidak terlalu lama.
- Ayat & doa: kutip dengan benar. Tulis terjemahannya di `narasi`. Bila menampilkan teks Arab,
  gunakan `kartu` dengan teks pendek yang sudah dicek.
- Nada: membangun iman & ketenangan (apa yang bisa dilakukan), bukan menakut-nakuti.

## Alur tahap untuk Cerita
`riset` → `naskah` (skenario + caption, lalu `cek`) → `suara` (`tts`: suara per tokoh otomatis) →
`model` (= **tokoh & latar**: gambar/pakai ulang latar, atur tokoh, kamera, suasana) →
`cek` (`still` 1 titik per 2–3 adegan; periksa tokoh tidak tertutup subtitle, saling berhadapan,
ekspresi sesuai) → `audio` (musik sesuai nuansa, SFX: langkah, angin, guntur) → `render`.
