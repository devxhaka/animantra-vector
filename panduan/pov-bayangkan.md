# POV Bayangkan: kisah orang kedua berseri

Format cerita sinematik yang menjadikan **penonton sebagai tokoh utama** ("kamu", "kalian", "adikmu").
Biasanya berseri (episode bersambung), 60–120 detik, emosional, dengan subtitle besar 1–2 kata.
Pipeline sama dengan Cerita (`panduan/cerita.md`): pemeran dirender otomatis, kamu mengarahkan
latar, pose, ekspresi, kamera, dan suasana. Format ini hanya menambah **kartu cerita** dan **efek layar**.

## Struktur episode
| Bagian | Isi | Perangkat |
|---|---|---|
| Recap (bila `lanjutan`) | 1–2 kalimat inti episode lalu | `cap: "SEBELUMNYA…"` + `filter: "kilas-balik"` |
| Pembuka | tempat & waktu, situasi mencekam | `transisi: "hitam"` + `kartuWaktu` |
| Rangkaian kejadian | emosi naik-turun, satu kejadian per adegan | kamera dekat (zoom 1,3–1,5) saat emosional, `suasana` |
| Kilas balik (opsional) | kenangan yang memberi makna | `filter: "kilas-balik"` atau `"hitam-putih"` |
| Hening / doa | jeda sebelum penutup | pose `berdoa`, cahaya lembut |
| Penutup | judul seri + status | `kartuPenutup` + `pudarAkhir` (adegan terakhir) |

Naskah: kalimat pendek dan indrawi ("dinginnya lantai", "bau hujan"). Sapa penonton langsung.
Satu adegan = satu kalimat. Untuk topik agama/sejarah, isi hanya dari sumber sahih (catat di `riset.md`),
sampaikan sebagai **gambaran**, dan sosok yang tidak boleh/tidak perlu digambar jelas pakai `siluet: true`.

## Field (semua opsional, kompatibel mundur)
```jsonc
// di Spec
"episode": 2,                          // dipakai kartuWaktu bila "seri" kosong → "BAYANGKAN - EPISODE 2"
// di Adegan
"cap": "SEBELUMNYA…",                  // label kecil kiri atas (maks 32 karakter)
"kartuWaktu": { "label": "HARI KETIGA", "jam": "11:51", "seri": "…", "muncul": 0.3, "hilang": 3.8 },
"kartuPenutup": { "atas": "BAYANGKAN", "judul": "Malam Tanpa Cahaya", "bawah": "BERSAMBUNG", "muncul": 0.2 },
"filter": "kilas-balik",               // atau "hitam-putih"; hanya dunia adegan, teks tidak ikut
"pudarAkhir": 1.2,                     // detik terakhir memudar ke hitam (termasuk teks)
"transisi": "hitam"                    // masuk dari layar hitam (±0,4 dtk)
```
- `kartuWaktu` & `cap` sama-sama di kiri atas: jangan dipakai di adegan yang sama.
- `kartuPenutup` menyembunyikan subtitle adegan itu (suara tetap diputar). Taruh di adegan terakhir.
- Waktu `muncul`/`hilang` dalam detik relatif awal adegan.

## Gaya
Gaya bawaan **"Sinematik"** (di-seed sekali, penanda `data/gaya/.seed-sinematik`): latar gelap hangat,
subtitle Montserrat kapital 2 kata di tengah layar (posisi 0,6), kata aktif & kata kunci lime.
Tetap pakai gaya yang dipilih pengguna di pesanan.

## Belum tersedia (tahap berikutnya)
Pose duduk/berlutut/berbaring/berpelukan/menangis, kamera menyusuri & dari balik bahu, cahaya lampu hangat,
api, kerumunan. Jangan menjanjikan visual itu di naskah; pakai pose & suasana yang sudah ada.
