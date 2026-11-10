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
| `pose` | `diam` `menunjuk` `melambai` `berpikir` `kaget` `berdoa` `tangan-di-dada` `memeluk-diri` `menenangkan` `meraih` `menjelaskan` `jalan` `memeluk` `merangkul` `menyeka-mata` |
| `ekspresi` | `netral` `senang` `tenang` `cemas` `takut` `kaget` `sedih` `serius` `bingung` `menangis` (air mata) `terpejam` (doa/tidur) |
| `tubuh` | `berdiri` (bawaan) `duduk-bersila` `berlutut` `berbaring` (telentang; `x` = tengah badan). Dipadu bebas dengan `pose` lengan, mis. bersila + `berdoa` |
| `lenganDiDepan` | `true` = lengan depan digambar di atas semua tokoh (untuk `memeluk`/`merangkul` tokoh di depannya) |
| `lihat` | `depan` `kiri` `kanan` `atas` `bawah` (arah bola mata) |
| `urutan` | perubahan di tengah baris: `[{ "pada": detik, "pose"?, "ekspresi"?, "lihat"?, "hadap"?, "tubuh"? }]` (duduk/berdiri berpindah halus ±0,6 dtk) |
| `jalan` | `{ "ke": x tujuan, "mulai": dtk, "selesai": dtk }`. Kaki melangkah otomatis |
| `siluet` | `true` = tampil sebagai bayangan hitam |

- Pose & ekspresi **tersambung halus** dari adegan sebelumnya; cukup tulis keadaan barunya.
- **Memeluk/merangkul**: tinggi bahu harus setara. Orang dewasa memeluk anak → yang memeluk `tubuh: "berlutut"`
  atau duduk. Yang dipeluk `z` lebih besar (di depan), yang memeluk `lenganDiDepan: true`, selisih `x` ±0,08–0,15.
  Merangkul: keduanya menghadap sama, yang merangkul di belakang-samping (selisih `x` ±0,14).
- Berbaring di pangkuan: yang duduk `duduk-bersila`, yang berbaring `y` sedikit lebih besar (±0,02) dan `x` di depannya.
- Aksi khusus (`aksi`: senter, membuka benda) dihitung untuk tokoh **berdiri**; jangan dipadukan dengan `tubuh` lain.
- Yang sedang bicara otomatis gerak mulut & mengangguk kecil. Pendengar beri reaksi (`urutan`).
- Tokoh yang bicara **wajib tampil** di adegannya (kecuali narator).
- Pemeran yang tidak sedang di lokasi tidak perlu dicantumkan.

### Bahasa kamera
- Buka tiap lokasi dengan **gambar lebar** (`zoom` 1). Baris emosional: zoom 1,2–1,45 ke wajah pembicara
  (geser `x` ke arah tokoh, `y` positif ±0,05–0,12 karena wajah ada di atas tengah).
- Bergantian sudut tiap 2–3 baris agar tidak monoton. Jangan zoom > 1,6.
- **Sinematik (opsional):** `kamera.dari/ke.rotasi` (derajat, miring ±3–8 untuk tegang/bingung) ·
  `kamera.easing` `halus`/`linear`/`masuk`/`keluar` · `kamera.goyang` 0..1 (kamera genggam; 0,2–0,4 halus, 0,6+ panik).
- **Menyusuri (parallax):** `latarParallax` < 1 (mis. 0,6) membuat latar bergerak lebih lambat dari tokoh; aset
  latar depan (tiang, daun, pagar) `parallax` > 1 (mis. 1,6) + `z` ≥ 5. Pakai dengan zoom/geser `x` yang terus berubah,
  `easing: "linear"`.
- **Dari balik bahu:** tokoh pengamat `tampak: "belakang"`, `skala` 2–2,5, `y` 1,25–1,35, `x` 0,25–0,3, `z` 5,
  `kabur` 2–4; tokoh yang dilihat kecil di kejauhan (`skala` 0,7, `y` ±0,72) di sisi lain layar.

### Suasana (`suasana`)
`gelap` 0..1 (malam) · `warnaLangit` (mis. `#8a1e1e` langit merah) · `kabut` · `hujan` ·
`gempa` 0..1 (guncangan) · `cahaya` `{x,y,warna}` (sorot cahaya dari langit) · `vinyet`.
Pakai bertahap: ketegangan naik → efek bertambah; resolusi → `cahaya`, efek dikurangi.
- **Lampu (malam di dalam ruangan):** `lampu: [{ x, y, jangkau?, warna?, kedip? }]` + `gelapLampu` (bawaan 0,78):
  di luar jangkauan gelap, dekat lampu hangat & bergetar. Koordinat dunia (ikut kamera). Taruh juga `efek` api kecil
  (`skala` 0,2–0,3) tepat di sumbu pelita/lilin.
- **Kilat:** `kilat: [detik, …]` (kilatan ganda); cocok dengan `hujan` + SFX guntur.
- **Efek (`adegan.efek`):** `[{ "jenis": "api" | "asap", x, y, skala?, z? }]`. `skala` 1 = obor, 2–3 = api unggun/kebakaran;
  `z` ≥ 5 di depan tokoh. `asap` diletakkan sedikit di atas api.

### Kerumunan (`adegan.kerumunan`)
Banyak figur sederhana (bukan pemeran, tidak bicara) untuk pasar, rombongan, massa:
```json
"kerumunan": [{ "jumlah": 60, "area": { "x1": 0, "x2": 1, "y1": 0.7, "y2": 0.86 }, "tinggi": [0.12, 0.2],
                "gerak": "lari", "arah": "kanan", "benih": 3 }]
```
- `area` = posisi kaki; `y1` baris terjauh, `y2` terdekat. `tinggi` [jauh, dekat] relatif tinggi layar
  (patokan: kerumunan di horizon [0,035, 0,06]; sejajar tokoh di y 0,8 [0,12, 0,2]).
- `gerak`: `diam` · `gelisah` (bawaan) · `jalan` · `lari` · `sorak` (tangan terangkat). `arah` `kiri`/`kanan`/`acak`.
- `hijab`, `kopiah` = peluang 0..1; `palet` = warna pakaian; `siluet: true` untuk massa gelap/jauh/misterius.
- `z` ≥ 5 + `tinggi` besar (±0,45) + `kabur` 3–6 = orang lewat di latar depan. Maks 200 figur per kelompok, 6 kelompok.
- Ganti `benih` bila susunan kebetulan menutupi tokoh. Kerumunan tidak boleh menutupi wajah pemeran yang bicara.

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
