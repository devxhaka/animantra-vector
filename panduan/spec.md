# Format `spec.json`

Satu video = satu `videos/<slug>/spec.json`. Remotion merender file ini apa adanya
(`remotion/Video.tsx`). Tipe lengkap ada di `shared/tipe.ts` (`Spec`, `Adegan`, `Aset`, ...).

Koordinat: **0..1 relatif kanvas** (x dari kiri, y dari atas). Kanvas 1080×1920.
Waktu: **detik, relatif awal adegan**.

```jsonc
{
  "versi": 1,
  "format": "kita-bongkar",              // kunci format dari pesanan.json
  "judul": "Kok pulpen klik bisa gantian?",
  "judulSorot": "gantian?",              // potongan persis dari judul → kotak sorot
  "seri": "KISAH PENEMUAN · 1945",       // opsional, menimpa nama seri dari gaya/format
  "fps": 30, "lebar": 1080, "tinggi": 1920,
  "gaya": { ... },                       // SALIN dari pesanan.json, jangan diubah
  "logo": "logo.png",                    // isi dari pesanan.json "logo" (null bila tidak ada)
  "musik": { "file": "musik/energik-1.mp3", "volume": 0.12 },   // atau null
  "adegan": [
    {
      "id": "hook",                      // huruf kecil-angka-strip, unik
      "narasi": "Sekali klik keluar, klik lagi masuk. Kok bisa *gantian*?",
      "durasi": 3.5,                     // diisi ulang oleh `studio tts`
      "tampilJudul": true,               // badge seri + judul (biasanya adegan 1)
      "teksBesar": "KLIK!",              // teks kejutan besar (≤18 karakter), opsional
      "transisi": "fade",                // potong | fade | geser (adegan 1 selalu potong)
      "kamera": { "dari": { "zoom": 1 }, "ke": { "zoom": 1.25, "x": 0.1, "y": -0.05 } },
      "aset": [
        {
          "file": "aset/pulpen.svg",
          "x": 0.5, "y": 0.6,            // TITIK TENGAH aset
          "lebar": 0.9,                  // lebar relatif kanvas (tinggi mengikuti viewBox)
          "rotasi": -30,                 // derajat
          "masuk": "pop",                // pop | fade | geser-kiri | geser-kanan | geser-bawah | tidak
          "loop": "melayang",            // goyang | melayang | putar | denyut | null
          "z": 1,                        // urutan lapis (besar = depan)
          "animasi": [                   // keyframe; nilai ABSOLUT
            { "prop": "x", "dari": 0.5, "ke": 0.46, "mulai": 0.5, "selesai": 0.8, "easing": "pegas" }
          ]
        }
      ],
      "label": [
        { "teks": "Pegas", "x": 0.42, "y": 0.56, "arah": "kiri", "muncul": 0.7 }
      ],
      "kartu": { "tag": "Baik", "teks": "Ujung keluar", "nilai": "+4 mm" },
      "sfx": [{ "file": "sfx/klik.wav", "pada": 0.5, "volume": 0.6 }]
    }
  ]
}
```

## Catatan
- **Label**: `x,y` = titik yang ditunjuk. `arah: "kiri"` → label di kiri titik (`TEKS →`),
  `"kanan"` → label di kanan titik (`← TEKS`). Maks 5 label per adegan, ≤28 karakter.
  Beri jeda `muncul` 0,5–1 detik antar label agar sinkron dengan narasi.
- **Animasi** `prop`: `x`, `y` (0..1), `skala` (1 = normal), `rotasi` (derajat), `opasitas` (0..1).
  `easing`: `halus` (bawaan), `pegas`, `masuk`, `keluar`, `linear`. Beberapa keyframe untuk prop
  yang sama dijalankan berurutan.
- **Lapisan bergerak**: pecah benda menjadi beberapa SVG dengan **viewBox sama** dan `x,y,lebar`
  sama. Lapisan otomatis menumpuk pas, lalu gerakkan yang perlu (lihat contoh di `videos/`).
  Geser sepanjang sumbu benda = ubah `x` sebesar (piksel viewBox / lebar viewBox) × `lebar`.
- **Kamera**: `zoom` > 1 mendekat; `x,y` menggeser pusat pandang (0,1 = 10% kanvas).
  Hindari zoom > 1,6.
- **SFX & musik**: tulis `musik/...` atau `sfx/...` (folder proyek). Berkas otomatis disalin
  ke folder video saat render.
- **Zona aman**: judul 8–30% atas · teks besar ±22% · kartu ±72–78% · subtitle ±82–88%.
  Benda utama sebaiknya di y 0,35–0,7.
- Jalankan `node studio.mjs cek --job <ID>` setiap kali selesai mengubah spec.
