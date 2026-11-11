# Suara VoiceStudio (suara kloning, mis. suara Bos)

VoiceStudio adalah server TTS self-hosted (OpenAI-compatible) yang jalan di VM
terpisah dari studio. Studio memakainya sebagai penyedia suara seperti Edge /
Azure / ElevenLabs / Gemini — bedanya, suaranya suara kloning (mis. suara Bos),
dan API-nya **tidak boleh dibuka ke internet**.

## Arsitektur

```
VM studio (animantra-vector)            VM VoiceStudio
┌─────────────────────────┐            ┌──────────────────────────────┐
│ studio.mjs tts          │            │ container voicestudio        │
│  → VOICESTUDIO_URL      │  terowongan│  127.0.0.1:3900 (hanya       │
│    http://127.0.0.1:3900│───────────▶│  localhost, TIDAK dibuka     │
│  → VOICESTUDIO_API_KEY  │  SSH -L    │  ke internet)                │
└─────────────────────────┘            └──────────────────────────────┘
```

API key hanya lewat terowongan SSH terenkripsi (atau jaringan Tailscale).
Dokumentasi VoiceStudio mewajibkan HTTPS kalau API key dikirim dari luar —
dengan terowongan, pengiriman terjadi di dalam jaringan lokal, jadi HTTP lokal
sudah cukup dan key tidak pernah menyentuh internet terbuka.

## Konfigurasi (.env, bukan di kode)

Salin dari `.env.example`:

```env
VOICESTUDIO_URL=http://127.0.0.1:3900
VOICESTUDIO_API_KEY=<isi file .api-key di VM VoiceStudio>
VOICESTUDIO_VOICE=44d7b906            # voice ID utama (mis. suara Bos)
VOICESTUDIO_MODEL=tts-1
VOICESTUDIO_SSH_HOST=<user>@<host SSH VM VoiceStudio>
VOICESTUDIO_SSH_PORT=2222
VOICESTUDIO_KUNCI_SSH=~/.ssh/voicestudio-tunnel
```

Alamat + key **hanya di `.env`** (file ini di-`.gitignore`), tidak pernah di kode.
Daftar voice ID: `GET /v1/audio/voices` (profil kloning, mis. `Bos`, didahulukan
di daftar suara studio).

## Pasang terowongan SSH

Sekali saja (di VM studio & VM VoiceStudio):

```bash
# 1. Di VM studio: buat keypair khusus terowongan (tanpa passphrase)
ssh-keygen -t ed25519 -f ~/.ssh/voicestudio-tunnel -N ''

# 2. Taruh kunci PUBLIK ke VM VoiceStudio (sekali, lewat jalur yang sudah ada)
#    isi ~/.ssh/voicestudio-tunnel.pub -> ~/.ssh/authorized_keys di VM VoiceStudio

# 3. Di VM studio, dari folder repo, jalankan penjaga terowongan di background
setsid nohup bash scripts/terowongan-voicestudio.sh > /tmp/terowongan-voice.log 2>&1 < /dev/null &
```

Script menyambung ulang otomatis tiap 5 detik bila putus (mis. VM sempat tidur).
Cek terowongan jalan:

```bash
curl -s http://127.0.0.1:3900/v1/audio/voices
# tanpa key harus balas: {"detail":"API key required"} — itu bukti terowongan jalan
```

## Perilaku di pipeline

- **Job baru** tanpa suara eksplisit memakai `voicestudio:<VOICESTUDIO_VOICE>`
  bila `.env` terisi. Per job bisa di-override: `voicestudio:<id>`,
  `edge:id-ID-ArdiNeural`, dst. (lihat `POST /api/jobs`, `cli/tts.ts`).
- **Kalau VM VoiceStudio mati / terowongan putus**, tahap suara otomatis pindah
  ke Edge (Ardi/Gadis, tanpa key). `ttsVoiceStudio` gagal cepat (maks 2×15
  detik) supaya pindahnya tidak menunggu lama; log job mencatat
  `Suara gagal (..., voicestudio)` lalu `pindah ke Edge ...`.
- Suara VoiceStudio menghasilkan WAV (24 kHz mono) — gerak mulut & kata karaoke
  dihitung dari amplop audio, sama seperti Azure/Gemini.
- **Kecepatan**: sintesis di VM 4 vCPU lambat — diukur 2026-11-11, klip ~3 dtk
  butuh ~33 dtk, jadi 12 adegan bisa makan 7–12 menit (Edge cuma ~1 menit).
  Itu harga suara kloning di hardware ini; timeout TTS disetel 120 dtk per
  adegan supaya tidak kepotong di tengah jalan.

## Alternatif: Tailscale

Pasang `tailscale` di kedua VM, gabung ke tailnet yang sama, lalu:

```env
VOICESTUDIO_URL=http://<IP-Tailscale-VM-VoiceStudio>:3900
```

dan ikat VoiceStudio ke IP Tailscale itu (bukan `0.0.0.0`). Terowongan SSH
tidak diperlukan lagi; API key tetap hanya beredar di dalam tailnet.

## Tes

```bash
# 1. Tahap suara saja pada job uji (butuh studio jalan di localhost:4321)
node studio.mjs tts --job <id-job-uji>
#    log harus menyebut VoiceStudio + file suara/*.wav

# 2. Matikan terowongan (pkill -f terowongan-voicestudio), ulangi perintah yang sama
#    log harus menyebut "pindah ke Edge" + file suara/*.mp3
```
