# Animasi tokoh hibrida (Mystery Files)

Mesin tokoh lama (`remotion/karakter/Tokoh.tsx`) tetap jadi fondasi. **Aksi khusus** adalah lapisan
tambahan yang menimpa bagian tubuh tertentu selama aksi berjalan. Tidak ada renderer kedua.

## Status implementasi
| Aksi | Bagian tubuh | Status | Bila belum tersedia / disederhanakan |
|---|---|---|---|
| `turn-head` | kepala | **tersedia** (Phase 2B) | arah mata (+ ekspresi) saja; kepala tidak berputar |
| `flashlight-sweep` | lengan `dep`/`bel` | **tersedia** (Phase 2C) | pose `menunjuk` (selalu tangan depan); TANPA senter/sinar/gerak menyapu |
| `open-object` | lengan `dep`/`bel` | **tersedia** (Phase 2D) | pose `meraih` → `berpikir`; benda TIDAK digambar & TIDAK terbuka |

## Data (semua opsional, waktu dalam DETIK relatif awal adegan)
```jsonc
"modeAnimasi": "auto",                   // di Spec (bawaan video) — opsional
"tokoh": [{
  "id": "morgan", "x": 0.5, "pose": "diam", "ekspresi": "serius",
  "modeAnimasi": "auto",                 // opsional, menimpa Spec
  "aksi": [
    { "jenis": "turn-head", "mulai": 0.6, "durasi": 1.6, "arah": "kiri",
      "ekspresi": "cemas", "lihat": "kiri", "kembali": true }
  ]
}]
```
Mode efektif: `tokoh.modeAnimasi ?? spec.modeAnimasi ?? 'auto'`.

| Mode | Perilaku |
|---|---|
| `existing` | semua aksi disederhanakan ke pose lama (+ info jujur apa yang tidak tampil) |
| `special` | aksi khusus; bila tidak bisa → pose lama + peringatan |
| `auto` | aksi khusus bila tersedia & tokoh cocok; selain itu pose lama + peringatan |

## `turn-head`
| Field | Wajib | Nilai | Keterangan |
|---|---|---|---|
| `arah` | ya | `kiri` / `kanan` / `tengah` | arah **layar**. `tengah` = wajah menghadap kamera. Tokoh `hadap: "kiri"` otomatis dicerminkan |
| `mulai`, `durasi` | ya | detik | durasi minimum wajar 0,3 dtk |
| `ekspresi` | tidak | ekspresi biasa | dicampur halus selama aksi |
| `lihat` | tidak | `depan/kiri/kanan/atas/bawah` | arah bola mata **lokal** (sama seperti `tokoh.lihat`). Kosong = mata mengikuti arah wajah |
| `kembali` | tidak | bawaan `true` | `false` = tetap menoleh sampai adegan selesai |

Cara kerja: fitur wajah (mata, alis, hidung, mulut, pipi) bergeser kontinu, mata menyesuaikan jarak dan
ukuran (perspektif), telinga berpindah sisi, rambut sedikit ikut bergeser, dan bukaan hijab mengikuti wajah.
Proporsi kepala dan badan tidak berubah. Transisi masuk/keluar = min(0,3 dtk, 25% durasi) dengan kurva halus.
Pada detik `mulai` (amplop 0) wajah **identik piksel per piksel** dengan wajah tanpa aksi, jadi tidak ada lompatan.

Contoh akting:
- Mendengar suara di belakang: `arah` ke belakang punggung tokoh + `ekspresi: "cemas"`.
- Bicara langsung ke penonton: `arah: "tengah"`, `kembali: false`.
- Kaget menoleh: durasi pendek (0,6–0,8 dtk) + `ekspresi: "kaget"`.

## `flashlight-sweep`
| Field | Wajib | Nilai | Keterangan |
|---|---|---|---|
| `dari`, `ke` | ya | `kiri`/`kanan`/`atas`/`bawah` atau `{x, y}` | arah **layar**; `{x,y}` = titik di layar (0..1) yang dibidik tepat |
| `mulai`, `durasi` | ya | detik | durasi minimum wajar 0,6 dtk |
| `tangan` | tidak | `dep` (bawaan) / `bel` | lengan depan atau belakang |
| `sinar` | tidak | bawaan `true` | `false` = senter dipegang tanpa sinar |
| `aset` | tidak | path SVG | senter kustom (relatif folder video). Hilang/gagal dimuat → senter bawaan + peringatan |

Timeline: angkat (transisi masuk) → **menyapu** dari `dari` ke `ke` pada 15–85% durasi → tahan → turun.
- Senter dipegang di ujung lengan bawah dan **sinar memakai rantai transform yang sama**, jadi arah sinar
  selalu sama dengan arah senter. Target `{x,y}` dibidik dari **tangan**, jadi sinar benar-benar mengenai titik itu.
- Arti arah untuk tokoh menghadap kanan: `kanan` = depan, `kiri` = belakang (lengan terayun ke belakang),
  `atas` = ke atas sedikit ke depan, `bawah` = ke bawah sedikit ke depan. Menghadap kiri: dicerminkan.
- Sapuan depan ↔ belakang (tepat 180°) lewat **atas** kepala.
- Rig tidak punya pergelangan: membidik tinggi berarti seluruh lengan bawah ikut naik.
- Sinar belum "menembus gelap" (`suasana.gelap` digambar di atas tokoh sehingga ikut meredupkan sinar).
  Pencahayaan senter yang menerangi latar adalah bagian Phase 3.

Contoh:
```json
{ "jenis": "flashlight-sweep", "mulai": 0.4, "durasi": 2.6, "dari": { "x": 0.9, "y": 0.32 }, "ke": { "x": 0.78, "y": 0.62 } }
```

## `open-object`
| Field | Wajib | Nilai | Keterangan |
|---|---|---|---|
| `benda` | ya | `buku` / `map` / `dokumen` | gambar bawaan prosedural |
| `posisi` | ya | `{x, y}` layar 0..1 | **pusat benda saat terbuka** (= engsel) |
| `mulai`, `durasi` | ya | detik | durasi minimum wajar 0,8 dtk |
| `skala` | tidak | bawaan 1 | ukuran benda |
| `tangan` | tidak | `dep` (bawaan) / `bel` | lengan belakang jangkauannya lebih pendek |
| `aset` | tidak | path SVG | gambar **sampul** kustom. Hilang/gagal dimuat → sampul bawaan + peringatan |
| `tetapTerbuka` | tidak | bawaan `true` | `false` = menutup lagi di akhir aksi |

Urutan (porsi durasi): **jangkau** 0–35% → **sentuh** tepi panel 35–45% → **buka**: panel berputar 0→180°
dan tangan mengikuti tepinya 45–85% → **lepas** 85–100%.
- Saat tertutup, benda menempati separuh sisi yang **jauh** dari tokoh; panel terbuka ke arah tokoh.
- Benda tampil **sepanjang adegan** (tertutup sebelum aksi, terbuka sesudahnya bila `tetapTerbuka`) dan
  digambar **di belakang** tokoh, sehingga tangan menutupi benda saat menyentuh.
- Bila disederhanakan ke pose lama (mode `existing`/fallback), benda **tidak** digambar (sesuai peringatan).
- **Jangkauan:** `cek` menghitung apakah tangan bisa mencapai tepi panel tertutup & terbuka. Bila tidak:
  peringatan `di-luar-jangkauan`, dan saat render IK di-clamp (lengan lurus ke arah benda, tidak menyentuh).
  Patokan untuk Agent Morgan (skala 1, tangan depan, benda bawaan): benda setinggi **dada sampai perut**
  (`posisi.y` kira-kira kaki − 0,3 s.d. kaki − 0,26) dan **dekat badan** (sekitar 0,12–0,18 lebar layar dari kaki).
  Benda di atas meja: letakkan meja sebagai `aset` dengan bagian atas sejajar sisi bawah benda.

Contoh (Morgan di x 0,42, menghadap kanan):
```json
{ "jenis": "open-object", "mulai": 0.3, "durasi": 2.4, "benda": "buku", "posisi": { "x": 0.58, "y": 0.53 } }
```

## Aturan umum
- **Satu bagian tubuh, satu aksi.** Bila dua aksi memakai bagian yang sama dan waktunya tumpang tindih,
  aksi yang **mulai belakangan** yang dipakai (seri → yang lebih akhir di daftar). `cek` memberi peringatan.
  Bagian berbeda boleh bersamaan (misalnya menoleh sambil menyorot senter).
- Keadaan akhir aksi **tidak terbawa** ke adegan berikutnya. Tulis lagi aksinya bila perlu.
- Event `urutan` biasa tetap berlaku. Bila sebuah aksi disederhanakan ke pose lama, event `urutan` di tengah
  rentang aksi bisa menimpa pose itu (digabung berdasarkan waktu).
- Semua animasi dihitung dari frame Remotion (deterministik, aman dirender tidak berurutan).

## Catatan determinisme render (hasil pengujian Phase 2C)
Diukur dengan 10 render terpisah per frame, dibandingkan piksel per piksel:
- **Jangan pakai `mix-blend-mode` atau `opacity` pada grup SVG** di tokoh/aksi: keduanya memaksa lapisan
  komposit yang menggeser anti-aliasing antar render (terukur ≤5/255 di sekitar latar). Masukkan intensitas
  ke `fill-opacity`/`stop-opacity` per elemen.
- **Jangan pakai `<image>` atau `<svg>` bersarang** untuk aset di dalam tokoh: aset SVG kustom dimuat lalu
  disisipkan sebagai vektor di dalam `<g transform>` (`bersihkanSvg` membuang `<script>`/`on*`).
- **Lepas `delayRender` setelah state ter-commit ke DOM** (`useLayoutEffect`), bukan langsung setelah `setState`.
  Kalau tidak, kadang frame dipotret sebelum aset terpasang.

## Peringatan (`node studio.mjs cek` & log render)
| Kode | Tingkat | Akibat |
|---|---|---|
| `tidak-dikenal`, `parameter-invalid` | ✗ masalah (cek gagal) | aksi diabaikan, tetap dilaporkan |
| `belum-tersedia`, `rig-tidak-cocok` | ! peringatan | pose lama + keterangan apa yang tidak tampil |
| `disederhanakan` | · info | mode `existing` |
| `aset-hilang` | ! peringatan | memakai gambar bawaan |
| `tumpang-tindih`, `melewati-adegan`, `terlalu-singkat` | ! peringatan | tetap jalan |
| `di-luar-jangkauan` | ! peringatan | IK di-clamp; tangan tidak menyentuh benda |

## Lokasi kode
- `shared/aksi.ts`: registri (bagian tubuh, validasi, nilai bawaan, fallback)
- `remotion/karakter/aksi/resolver.ts`: routing & timeline (murni)
- `remotion/karakter/aksi/terapkan.ts`: menerapkan aksi aktif ke status tokoh (murni)
- `remotion/karakter/aksi/ik.ts`: FK, IK dua sendi (clamp), layar↔lokal, bidikan (murni)
- `remotion/karakter/aksi/benda.ts`: geometri & timeline benda (satu sumber untuk gambar & target tangan)
- `remotion/karakter/aksi/Benda.tsx`: gambar buku/map/dokumen
- `remotion/karakter/aksi/asetSvg.tsx`: muat & bersihkan SVG kustom (senter, sampul)
- `remotion/karakter/Tokoh.tsx`: `geometriRig`, `sudutLenganDasar`, `StatusTokoh.putarKepala/lengan/pegang` (opsional)
