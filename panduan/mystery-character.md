# Agent Morgan & tokoh Mystery Files

## Agent Morgan (tokoh tetap)
Didefinisikan **satu kali** di `shared/karakter-bawaan.ts` (`AGENT_MORGAN`) dan di-seed ke
`data/karakter/morgan.json`. Ia memakai mesin tokoh yang sama dengan pemeran lain
(`remotion/karakter/Tokoh.tsx`); tidak ada database atau renderer terpisah.

| Aspek | Nilai (jangan diubah per episode) |
|---|---|
| id | `morgan` (dipakai di `pembicara` dan `tokoh[].id`) |
| Identitas | laki-laki, dewasa muda (±27 th), penyelidik, pembawa acara seri |
| Rambut | hitam, **berantakan** (`rambut: 'berantakan'`), warna `#14110f` |
| Mata | gelap, ekspresif (mata standar rig) |
| Pakaian | `jaket-detektif`: jaket navy `#1c3346` + kemeja dalam hitam `#111111` |
| Aksesori | `kerah-tinggi`, `lencana` (emas), `buku-catatan` (saku dada), `senter-sabuk` |
| Kulit | `#e0b48c` |
| Suara | `edge:id-ID-ArdiNeural` (bisa diganti di tab Karakter) |
| Sifat | penasaran, analitis, tenang, sedikit jenaka; selalu membedakan fakta vs dugaan |

**Konsistensi:** salin `pemeran` dari `pesanan.json` apa adanya. Jangan mengubah warna, rambut,
pakaian, atau proporsi Morgan di spec. Ubah hanya lewat tab Karakter (berlaku untuk episode berikutnya).

## Akting Morgan dengan rig yang ada (Phase 1)
| Momen | Pose | Ekspresi | Lihat |
|---|---|---|---|
| Membuka kasus (hook) | `diam` → `berpikir` | `serius` | `depan` |
| Menunjuk bukti | `menunjuk` | `serius` | ke arah bukti |
| Menemukan kejanggalan | `kaget` | `kaget` | `atas`/ke bukti |
| Menalar | `berpikir` / `menjelaskan` | `bingung` → `tenang` | `depan` |
| Menutup episode | `menjelaskan` → `diam` | `tenang` | `depan` |

**Menoleh** (`turn-head`) dan **menyorot senter** (`flashlight-sweep`) sudah tersedia sebagai aksi khusus;
lihat `mystery-animation.md`. Membuka dokumen menyusul (Phase 2D). Sampai saat itu, aksi tersebut
otomatis disederhanakan ke pose terdekat dengan peringatan.

## Tokoh lain (saksi, tokoh sejarah)
- Buat di tab Karakter seperti biasa. Untuk tokoh nyata, hindari meniru wajah asli; cukup penanda umum
  (usia, pakaian era tersebut).
- Sosok misterius/tak dikenal: `siluet: true`, dari jauh, sebentar.
- Opsi baru yang bisa dipakai tokoh mana pun: pakaian `jaket-detektif`, `rambut: 'berantakan'`, `aksesori`.
