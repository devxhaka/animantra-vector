# Mystery Storytelling: struktur cerita & aturan riset

## Struktur 5 babak (30–60 detik total)
| Babak | Durasi | Isi | Arah visual |
|---|---|---|---|
| **1. Hook** | 3–6 dtk | Satu kejanggalan atau pertanyaan tajam. Judul tampil (`tampilJudul`). | Gambar dekat, gelap, satu sumber cahaya |
| **2. Setup** | 6–12 dtk | Kapan, di mana, siapa (orang/tempat **nyata**). | Gambar lebar memperkenalkan lokasi, Morgan masuk |
| **3. Investigation** | 12–25 dtk | Bukti satu per satu: dokumen, foto, kesaksian. Morgan memeriksa. | Bergantian dekat ↔ lebar, sorot ke bukti |
| **4. Revelation** | 6–12 dtk | Apa yang **diketahui** vs **belum diketahui**. Teori disebut sebagai teori. | Tempo melambat, cahaya membuka |
| **5. Closing** | 3–6 dtk | Pertanyaan terbuka + ajakan komentar. | Morgan menatap kamera, gelap kembali |

Aturan naskah: satu adegan = satu baris ucapan (seperti Cerita). Narator untuk fakta, Morgan untuk
menalar ("Kalau ini benar, berarti…"). Kalimat pendek, ±2,5 kata/detik, 1–2 `*kata kunci*` per adegan.

## Riset: WAJIB `riset.md` per episode
Setiap informasi di naskah harus berasal dari salah satu kategori di bawah, dan **naskah harus
menyampaikannya sesuai kategorinya**.

```markdown
# Riset: <judul episode>

## Fakta terverifikasi
- <fakta> (sumber: [2])

## Hipotesis
- <penjelasan yang diajukan ahli/penyelidik, belum terbukti> (sumber: [3])

## Legenda
- <cerita rakyat / kisah turun-temurun yang beredar> (sumber: [4])

## Spekulasi
- <dugaan populer tanpa dasar kuat (misalnya teori internet)>

## Tidak diketahui
- <hal yang memang belum terjawab>

## Sumber
1. <judul, penerbit/penulis, tahun> https://...
2. ...
```

`node studio.mjs cek` menolak spec `mystery-story` bila salah satu dari 6 bagian ini tidak ada atau bagian
**Sumber** kosong. Bagian yang memang tidak relevan tetap ditulis, isinya "- (tidak ada)".

### Aturan wajib
1. **Fakta perlu sumber.** Utamakan arsip resmi, jurnal, buku, dan media kredibel. Wikipedia boleh
   sebagai pintu masuk, tapi telusuri rujukannya.
2. **Jangan pernah menyajikan spekulasi sebagai fakta.** Pakai penanda bahasa:
   "menurut catatan resmi…" (fakta), "para peneliti menduga…" (hipotesis), "konon…/menurut cerita
   warga…" (legenda), "sebagian orang percaya…" (spekulasi), "sampai sekarang belum diketahui…".
3. **Jangan mengarang kutipan.** Kutipan langsung hanya bila ada di sumber, ditulis apa adanya, dan
   sumbernya dicatat. Kalau ragu, parafrasekan tanpa tanda kutip.
4. **Rekonstruksi visual ≠ dokumentasi asli.** Semua visual adalah ilustrasi. Jangan meniru foto/arsip
   asli seolah-olah otentik, dan sebutkan "ilustrasi/rekonstruksi" di caption.
5. **Hormati korban & keluarga.** Tanpa detail kekerasan grafis, tanpa mengolok-olok, tanpa menuduh orang
   nyata yang tidak terbukti bersalah.
6. **Tanggal, angka, nama** harus dicek ulang di minimal 2 sumber bila memungkinkan.

### Caption (format sama dengan Cerita) ditambah:
```
=== CATATAN ===
Visual adalah ilustrasi/rekonstruksi. Sumber: <2–3 sumber utama singkat>
```
