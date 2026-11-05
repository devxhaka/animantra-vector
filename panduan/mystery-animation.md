# Animasi tokoh hibrida (Mystery Files)

Mesin tokoh lama (`remotion/karakter/Tokoh.tsx`) tetap jadi fondasi. **Aksi khusus** adalah lapisan
tambahan yang menimpa bagian tubuh tertentu selama aksi berjalan. Tidak ada renderer kedua.

## Status implementasi
| Aksi | Bagian tubuh | Status | Bila belum tersedia / disederhanakan |
|---|---|---|---|
| `turn-head` | kepala | **tersedia** (Phase 2B) | arah mata (+ ekspresi) saja; kepala tidak berputar |
| `flashlight-sweep` | lengan `dep`/`bel` | belum (Phase 2C) | pose `menunjuk` (selalu tangan depan); TANPA senter/sinar/gerak menyapu |
| `open-object` | lengan `dep`/`bel` | belum (Phase 2D) | pose `meraih` → `berpikir`; benda TIDAK digambar & TIDAK terbuka |

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

## Aturan umum
- **Satu bagian tubuh, satu aksi.** Bila dua aksi memakai bagian yang sama dan waktunya tumpang tindih,
  aksi yang **mulai belakangan** yang dipakai (seri → yang lebih akhir di daftar). `cek` memberi peringatan.
  Bagian berbeda boleh bersamaan (misalnya menoleh sambil menyorot senter).
- Keadaan akhir aksi **tidak terbawa** ke adegan berikutnya. Tulis lagi aksinya bila perlu.
- Event `urutan` biasa tetap berlaku. Bila sebuah aksi disederhanakan ke pose lama, event `urutan` di tengah
  rentang aksi bisa menimpa pose itu (digabung berdasarkan waktu).
- Semua animasi dihitung dari frame Remotion (deterministik, aman dirender tidak berurutan).

## Peringatan (`node studio.mjs cek` & log render)
| Kode | Tingkat | Akibat |
|---|---|---|
| `tidak-dikenal`, `parameter-invalid` | ✗ masalah (cek gagal) | aksi diabaikan, tetap dilaporkan |
| `belum-tersedia`, `rig-tidak-cocok` | ! peringatan | pose lama + keterangan apa yang tidak tampil |
| `disederhanakan` | · info | mode `existing` |
| `aset-hilang` | ! peringatan | memakai gambar bawaan |
| `tumpang-tindih`, `melewati-adegan`, `terlalu-singkat` | ! peringatan | tetap jalan |

## Lokasi kode
- `shared/aksi.ts`: registri (bagian tubuh, validasi, nilai bawaan, fallback)
- `remotion/karakter/aksi/resolver.ts`: routing & timeline (murni)
- `remotion/karakter/aksi/terapkan.ts`: menerapkan aksi aktif ke status tokoh (murni)
- `remotion/karakter/Tokoh.tsx`: `StatusTokoh.putarKepala` (opsional)
