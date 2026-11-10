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
subtitle Montserrat kapital 2 kata di bawah tokoh (posisi 0,84; bisa diubah di tab Gaya Saya → Posisi), kata aktif & kata kunci lime.
Tetap pakai gaya yang dipilih pengguna di pesanan.

## Seri interaktif: pilihan penonton (Phase E)
Pola: tiap episode (kecuali terakhir) ditutup dilema → penonton memilih di komentar → episode berikutnya
menjalankan pilihan terbanyak.
- **Akhir episode:** adegan terakhir (±6–8 dtk) memakai `pilihan`. Narasi membacakan pertanyaannya:
  "Apa yang akan kamu lakukan? Menerima makanan dari temanmu, atau menolaknya?"
  ```json
  "pilihan": { "opsi": ["TERIMA MAKANAN", "TOLAK MAKANAN"] }
  ```
  Bawaan: judul "APA PILIHANMU?", ajakan "KOMENTAR DI BAWAH", badge "LANJUT EPISODE n+1" (dari `spec.episode`)
  yang muncul setelah narasi selesai dan menggantikan subtitle. `lanjut: null` = tanpa badge. Maks 3 opsi, ≤32 karakter.
  Opsi = dilema yang sama-sama masuk akal (bukan jelas benar/salah), berkaitan dengan pelajaran bersumber.
  Jangan pakai `kartuPenutup` di adegan yang sama.
- **Awal episode berikutnya:** `pesanan.lanjutan` berisi `episode`, `opsi`, dan `pilihanPenonton` (diisi pengguna
  dari komentar). Adegan 1–2 menjalankan pilihan itu ("Kamu memilih berbagi airnya…"), lalu konsekuensi + penilaian
  jujur ("Pilihanmu tepat, karena…" / "Ternyata…") beserta dalilnya. Tanpa `pilihanPenonton` → recap biasa.
- **Kartu kabar:** `kartuKabar: { "label": "KABAR WARGA", "teks": "Dajjal telah sampai di kota ini." }` (tengah atas).
- **Tokoh figuran bicara:** `namaPembicara: "TEMAN"` → label kecil di atas subtitle; tulis ucapannya dengan tanda kutip.
- Pergantian lokasi/waktu di tengah episode: `kartuWaktu` baru (mis. label "PASAR DEKAT RUMAH") atau `cap`.

## Pose & emosi (Phase B)
`tubuh`: `duduk-bersila` / `berlutut` / `berbaring`; pose `memeluk` / `merangkul` / `menyeka-mata`;
ekspresi `menangis` (air mata) / `terpejam` (doa, tidur). Aturan komposisi pelukan: lihat `panduan/cerita.md`.

## Kamera & cahaya (Phase C)
Kamera miring/genggam, menyusuri (parallax), dari balik bahu (`tampak: "belakang"`), lampu hangat berkedip,
api, asap, kilat. Rincian & angka siap pakai: `panduan/cerita.md` (Bahasa kamera, Suasana).

## Kerumunan (Phase D)
Rombongan berlari, warga gelisah di kejauhan, massa bersorak (siluet), orang lewat di latar depan:
`adegan.kerumunan` (lihat `panduan/cerita.md`).
