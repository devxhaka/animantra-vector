# Tampilan baru: judul per adegan, panel, stiker, label garis

Hasil bedah lima video referensi (VGA berkipas, cuti ditolak bos, media lokal, Gemini + Remotion, Metasploit WhatsApp).
Baca ini kalau `gaya.tata` atau `gaya.latar` terisi di `pesanan.json`, atau format = `boleh-nggak` / `kinetik`.

## Yang membuat kelima video itu enak ditonton

1. **Tiap 1–1,5 detik ada hal baru di layar.** Bukan potongan adegan (kelima video nyaris tanpa
   cut), tapi elemen yang *menumpuk* di adegan yang sama: label, kartu, angka, terminal, stiker.
2. **Elemen muncul tepat saat katanya diucapkan.** Kata "kipas" terdengar → stiker "3 KIPAS!" muncul.
   Pakai `saat: "kipas"`, bukan menebak detik.
3. **Judul berganti tiap adegan** dan merangkum satu ide dalam 3–7 kata, dengan satu potongan disorot
   (dan opsional lencana langkah `nomor: 1, 2, 3`). Penonton tanpa suara tetap paham alurnya.
4. **Subtitle pendek, 2–3 kata per baris**, satu kata menyala. Bukan kalimat penuh.
5. **Seperlima layar paling bawah kosong** (tertutup tombol Reels/TikTok). Semua isi ada di 8–80%.
6. **Angka bergerak, bukan diam**: 168 JUTA → 999 JUTA, kalender terisi 1 → 12.
7. **Penutup selalu pertanyaan ke penonton** dengan pilihan jawaban siap ketik.
8. **Satu benda dipakai ulang**: kamera mendekat ke benda yang sama, bukan gambar baru tiap adegan.

Struktur naskah yang dipakai kelimanya: hook pertanyaan (0–3 dtk) → masalah → cara kerja/aturan
dengan angka/langkah → akibat/vonis → ajakan komentar. Durasi 27–75 detik, 6–12 adegan.

## Lima tampilan siap pakai (studio → Gaya → Tampilan siap pakai)

| Tampilan | Cocok untuk | Ciri |
|---|---|---|
| Skema Hardware | kita-bongkar, apa-jadinya, evolusi | krem, outline tegas, judul `ringkas`, label kuning bergaris, stiker |
| Panel Neon | boleh-nggak, mitos-fakta, kuis | biru malam, visual di dalam `bingkai`, judul `pil`, kartu kaca |
| Presenter Neon | cerita (narator/pov), top-list | tokoh di tengah, lantai kisi, daftar bernomor |
| UI Pastel | kinetik, tutorial | putih berkisi, judul `tengah`, kartu melayang, tanpa subtitle |
| Kertas Kisi | tutorial, kita-bongkar (sistem/cyber) | kertas kotak-kotak teknis, garis tegas, langkah bernomor, panel `terminal` & stempel |

Gaya tetap **disalin apa adanya** dari `pesanan.json`. Kamu hanya menyesuaikan isi adegan.

## Field baru di adegan

```jsonc
{
  "id": "data",
  "narasi": "chip GPU memproses *jutaan* data visual setiap detik",
  "judul": { "tag": "Skala mikro · arus data", "teks": "Memproses Jutaan Data / Detik", "sorot": "Jutaan Data", "nomor": 1 },
  "panelY": 0.34,                       // tepi atas tumpukan panel tanpa "y"
  "panel": [
    { "jenis": "angka", "y": 0.27, "tag": "Beban GPU", "dari": 100, "ke": 999, "akhiran": " JUTA+", "ket": "data visual / detik", "saat": "jutaan" }
  ],
  "stiker": [{ "teks": "KLAK!", "x": 0.8, "y": 0.33, "bentuk": "ledakan", "saat": "klak" }],
  "label": [{ "teks": "Chip GPU", "x": 0.5, "y": 0.52, "arah": "bawah", "saat": "chip" }]
}
```

- `judul`: maks 48 karakter. `sorot` harus potongan persis dari `teks`. `nomor` (opsional, 1..99) menampilkan
  lencana lingkaran bernomor di depan judul (cocok untuk langkah 1, 2, 3). Pada tata `pil`, `tag` jadi
  isi pil dan `teks` baris di bawahnya; tanpa `tag`, `teks` yang masuk pil. Adegan dengan `judul`
  tidak perlu `tampilJudul`.
- `saat`: satu kata (atau beberapa kata berurutan) dari narasi. Elemen muncul saat kata itu mulai
  diucapkan (waktunya diambil dari hasil `tts`). `muncul` (detik) tetap bisa dipakai. `cek` memberi
  peringatan kalau katanya tidak ada di narasi.
- `label.arah`: tata label `garis` menerima `atas | bawah | kiri | kanan` (bawaan `bawah`).
- `stiker`: maks 2 per adegan, ≤24 karakter. `bentuk`: `"ledakan"` (bintang komik, bawaan) atau `"stempel"`
  (stempel kotak miring ala `"KERENTANAN DITEMUKAN"` / `"DITOLAK!"`). `warna`: `"sorot"` | `"merah"` | `"hijau"`.

## Jenis panel (maks 3 per adegan)

| `jenis` | Isi | Dipakai untuk |
|---|---|---|
| `angka` | `ke`, `dari?`, `awalan?`, `akhiran?`, `tag?`, `ket?` | angka yang menghitung naik |
| `daftar` | `butir[]` (`teks`, `ket?`, `ikon?`, `coret?`, `saat?`), `nomor?`, `panah?`, `jeda?` | poin bernomor · alur bertahap (`panah`) · hal yang ditinggalkan (`coret`) |
| `petak` | `butir[]`, `kolom?` (2–3) | kisi 2×2 fitur/contoh, tiap petak punya ikon |
| `hitung` | `jumlah`, `terisi?`, `kolom?`, `tag?`, `ket?` | kalender/kuota yang terisi satu per satu |
| `banding` | `baik {tag, teks}`, `buruk {tag, teks}` | vonis BOLEH vs TIDAK BOLEH |
| `tanya` | `teks`, `tag?`, `pilihan?` (maks 3, ≤16 karakter) | ajakan komentar di adegan penutup |
| `catatan` | `teks` | satu kalimat penegasan |
| `terminal` | `judul?` (mis. `"msfconsole"`), `baris[]` (string atau `{teks, ket?, saat?}`), `jeda?` | jendela konsol gelap yang menampilkan perintah (`$ ...`), hasil (`[+] ...`), atau peringatan (`[!] ...`) baris demi baris |

`*kata*` di `teks`/`ket` panel diwarnai. `ikon` = SVG kecil di `aset/` (viewBox persegi, tanpa teks).
Butir `daftar`/`petak` muncul berurutan (`jeda` 0,55 dtk) atau masing-masing dengan `saat`.

## Tata letak (kanvas 1080×1920)

| Tata judul | Judul | Benda/aset | Panel | Subtitle |
|---|---|---|---|---|
| `ringkas` | 9–17% | y 0,36–0,52 | `y` 0,26 (di atas benda) atau 0,47+ (di bawah) | 69% |
| `pil` + `bingkai` | 13–16% (menempel tepi bingkai) | di dalam bingkai: x 0,06–0,94 · y 0,17–0,62 | `y` 0,18–0,2 | 76% |
| `pil` penuh | 13–19% | y 0,35–0,5 | `panelY` 0,33 atau `y` 0,6 | 76% |
| `tengah` | 11–16% | y 0,35–0,6 | `panelY` 0,28–0,3 | tidak ada |

- Bingkai memotong apa pun di luarnya: aset, tokoh, dan label harus berada di dalam wilayah itu.
  Panel tidak ikut terpotong.
- Kosongkan y > 0,8. Jangan pakai `kartu` lama bersama tata baru (posisinya menabrak subtitle);
  pakai `panel` `catatan`/`angka`.
- Satu adegan = satu benda + paling banyak 3 label + 1 panel, atau 1 panel besar tanpa benda.

## Naskah untuk tampilan ini

- Adegan 4–6 detik dengan 2–3 elemen ber-`saat`, supaya layar berubah tiap ±1,5 detik.
- Tata `pil` (neon): tulis narasi huruf kecil tanpa titik, gaya ngobrol ("mau *ngajuin* cuti tapi malah ditolak").
- Tata `tengah` (UI Pastel): subtitle disembunyikan, jadi `judul` adegan wajib ada di **setiap** adegan
  dan harus mewakili narasinya.
- Angka di panel harus berasal dari `riset.md`. Kalau hanya ilustrasi skala, tulis di `tag`
  ("Ilustrasi beban GPU").
