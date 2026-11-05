# Mystery Files: ikhtisar modul

Mystery Files adalah seri video misteri sinematik 2D (1080×1920, 30 fps, **30–60 detik**, narasi
Bahasa Indonesia, untuk YouTube Shorts) yang dibawakan oleh tokoh tetap **Agent Morgan**.
Modul ini adalah **perluasan** pipeline Cerita, bukan aplikasi terpisah. Renderer Remotion, mesin
tokoh, TTS, subtitle karaoke, antrean job, dan pustaka aset semuanya dipakai ulang.

## Komponen (status per fase)
| Komponen | Lokasi | Status |
|---|---|---|
| Format `mystery-story` ("Mystery Storytelling", seri `MYSTERY FILES`) | `shared/formats.ts` | Phase 1 ✓ |
| Helper `formatBertokoh()` / `formatMisteri()` | `shared/formats.ts` | Phase 1 ✓ |
| Preset gaya "Mystery Files" (warna + teks karaoke) | `shared/gaya-bawaan.ts` → `GAYA_MYSTERY`, `data/gaya/mystery-files.json` | Phase 1 ✓ |
| Agent Morgan | `shared/karakter-bawaan.ts` → `AGENT_MORGAN`, `data/karakter/morgan.json` | Phase 1 ✓ |
| Validasi `riset.md` 5 kategori + sumber | `cli/cek.ts` → `cekRisetMisteri()` | Phase 1 ✓ |
| Animasi tokoh hibrida: fondasi, routing, fallback | `shared/aksi.ts`, `remotion/karakter/aksi/` | Phase 2A ✓ |
| Aksi `turn-head` | `remotion/karakter/aksi/terapkan.ts` | Phase 2B ✓ |
| Aksi `flashlight-sweep`, `open-object` | `remotion/karakter/aksi/` | Phase 2C/2D (belum; fallback pose lama) |
| Mesin sinematik (kamera, cahaya, parallax, bukti) | `remotion/sinematik/` | Phase 3 (belum) |
| Kontrol studio khusus mystery + tab Pustaka | `studio/src/` | Phase 4 (belum) |

## Alur produksi (sama dengan Cerita)
`riset` → `naskah` → `suara` → `model` (tokoh & latar) → `cek` → `audio` → `render`.
Perbedaan untuk format mystery:
1. **Riset wajib** di `videos/<slug>/riset.md` dengan 5 kategori + sumber
   (lihat `mystery-storytelling.md`). `node studio.mjs cek` **menolak** spec mystery tanpa ini.
2. **Struktur 5 babak**: hook → setup → investigation → revelation → closing.
3. **Gaya**: pakai gaya yang dipilih pengguna; bila pengguna memilih "Mystery Files", spec memakai
   palet gelap teal/amber. Seri badge: `MYSTERY FILES`.
4. **Pemeran**: biasanya Agent Morgan + narator; tokoh lain boleh (lihat `mystery-character.md`).

## Data model (Phase 1, semua opsional & kompatibel mundur)
| Tipe | Field baru | Bawaan bila kosong |
|---|---|---|
| `Gaya.warna` | `peringatan?`, `permukaan?` | `merek`, `label` |
| `Pakaian` | nilai baru `'jaket-detektif'` | (nilai lama tidak berubah) |
| `Karakter` | `rambut?: 'rapi'\|'berantakan'`, `aksesori?: ('lencana'\|'senter-sabuk'\|'buku-catatan'\|'kerah-tinggi')[]` | rambut bawaan pakaian, tanpa aksesori |
| `Karakter.warna` | `dalam?` (kemeja dalam jaket) | `#141414` |

Tidak ada field yang diganti nama atau dihapus. Spec lama tetap valid, dan render-nya terbukti identik
piksel per piksel sebelum dan sesudah perubahan.

## Pengujian
- `npm run typecheck`: TypeScript.
- `npm test`: uji otomatis (`scripts/uji.ts`), meliputi kompatibilitas spec lama, format, preset, Morgan, dan riset.
- `npm run build:studio`: cek kompilasi produksi UI.

## Pemecahan masalah
- **`cek` gagal: "riset.md wajib ada"**: tulis `riset.md` dengan 6 judul bagian (5 kategori + Sumber).
- **Morgan tidak muncul di tab Karakter**: data di-seed sekali (penanda `data/karakter/.seed-morgan`).
  Kalau Morgan pernah dihapus, buat ulang dari tab Karakter atau hapus penanda itu lalu restart studio.
- **Gaya "Mystery Files" tidak ada**: sama, penandanya `data/gaya/.seed-mystery-files`.
