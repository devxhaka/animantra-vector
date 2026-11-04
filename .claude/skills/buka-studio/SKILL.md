---
name: buka-studio
description: Nyalakan Animantra Studio di browser dan hubungkan chat ini sebagai pekerja video. Pakai saat pengguna mengetik "buka studio", "jalankan studio", "nyalakan studio", atau meminta studio dihubungkan lagi.
---

# Buka studio

Langkahnya sama di komputer pengguna maupun di sesi cloud Claude Code. Perbedaannya hanya di cara
membuka UI (langkah 4). CLI mengenali sesi cloud sendiri lewat variabel `CLAUDE_CODE_REMOTE`:
mode pratinjau aktif otomatis dan Chromium bawaan container dipakai untuk render.

1. Pastikan dependensi sudah terpasang: kalau folder `node_modules` belum ada, jalankan
   `npm install` dulu (sekali saja; boleh agak lama).
2. Jalankan **di background** (run_in_background, timeout maksimal):
   ```
   node studio.mjs server
   ```
   Kalau studio ternyata sudah jalan, perintah ini hanya mencetak alamatnya lalu selesai. Itu normal.
3. Jalankan **di background** (run_in_background, timeout 30 menit):
   ```
   node studio.mjs listen
   ```
4. Buka UI:
   - **Komputer pengguna:** browser terbuka otomatis di `http://127.0.0.1:4321`.
   - **Sesi cloud** (output server mencetak `SESI CLOUD`): tidak ada browser di container dan
     pengguna tidak bisa membuka `127.0.0.1`. Laporkan port ke app dengan tool
     `report_preview_port` (port `4321`, nama `studio`; jika tool bernama `ReportPreviewPort`
     tersedia, pakai yang itu). Studio lalu dibuka lewat **panel pratinjau** app Claude.
5. Balas pengguna dengan satu-dua kalimat, misalnya: "Studio sudah terbuka dan terhubung. Silakan buat
   video dari form di kiri." Di sesi cloud, tambahkan bahwa studio dibuka lewat panel pratinjau.
   Jangan menunggu dengan polling; kamu akan dibangunkan otomatis saat `listen` selesai.

## Khusus sesi cloud
- Cek API key suara tanpa menampilkan nilainya (cukup "ada"/"belum") untuk `AZURE_SPEECH_KEY`,
  `ELEVENLABS_API_KEY`, `GEMINI_API_KEY`. Kalau semuanya belum ada, beri tahu pengguna bahwa video
  akan tanpa suara, dan key ditambahkan di pengaturan lingkungan cloud (Variabel lingkungan),
  berlaku di sesi baru. **Jangan pernah meminta key ditempel di chat.**
- Container bersifat sementara: video di `videos/` hilang saat sesi berakhir. Ingatkan pengguna
  sekali untuk mengunduh video lewat tombol **Unduh video**.
- Tombol "Tampilkan di Finder" tidak berfungsi di cloud.

## Saat `listen` selesai
- Output berisi `=== PESANAN BARU ===` → kerjakan sesuai `CLAUDE.md` (Membuat video baru /
  Mengerjakan revisi). Selesai atau gagal, jalankan lagi `node studio.mjs listen` di background.
- Output `TIDAK ADA PESANAN` → jalankan lagi `node studio.mjs listen` di background, tanpa pesan ke pengguna.
- Output `Studio belum jalan` → ulangi langkah 2, lalu 3 (dan di cloud, langkah 4 lagi).

Kalau pengguna bertanya kenapa badge "Chat Claude terputus": artinya `listen` tidak sedang jalan
dan tidak ada job aktif. Jalankan lagi langkah 3.
