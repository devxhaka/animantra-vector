---
name: buka-studio
description: Nyalakan Animantra Studio di browser dan hubungkan chat ini sebagai pekerja video. Pakai saat pengguna mengetik "buka studio", "jalankan studio", "nyalakan studio", atau meminta studio dihubungkan lagi.
---

# Buka studio

1. Pastikan dependensi sudah terpasang: kalau folder `node_modules` belum ada, jalankan
   `npm install` dulu (sekali saja; boleh agak lama).
2. Jalankan **di background** (run_in_background):
   ```
   node studio.mjs server
   ```
   Studio terbuka otomatis di browser (`http://127.0.0.1:4321`). Kalau studio ternyata sudah jalan,
   perintah ini hanya membuka browser lalu selesai. Itu normal.
3. Jalankan **di background** (run_in_background, timeout 30 menit):
   ```
   node studio.mjs listen
   ```
4. Balas pengguna dengan satu kalimat, misalnya: "Studio sudah terbuka dan terhubung. Silakan buat
   video dari form di kiri." Jangan menunggu dengan polling; kamu akan dibangunkan otomatis
   saat `listen` selesai.

Saat `listen` selesai:
- Output berisi `=== PESANAN BARU ===` → kerjakan sesuai `CLAUDE.md` (Membuat video baru /
  Mengerjakan revisi). Selesai atau gagal, jalankan lagi `node studio.mjs listen` di background.
- Output `TIDAK ADA PESANAN` → jalankan lagi `node studio.mjs listen` di background, tanpa pesan ke pengguna.
- Output `Studio belum jalan` → ulangi langkah 2, lalu 3.

Kalau pengguna bertanya kenapa badge "Chat Claude terputus": artinya `listen` tidak sedang jalan
dan tidak ada job aktif. Jalankan lagi langkah 3.
