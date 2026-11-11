#!/usr/bin/env bash
# Terowongan SSH: VM studio -> VM VoiceStudio, supaya API VoiceStudio (port 3900)
# terlihat lokal di 127.0.0.1:3900. Port 3900 TIDAK dibuka ke internet; API key
# hanya lewat terowongan terenkripsi ini.
#
# Siapkan sekali:
#   1. Di VM studio: ssh-keygen -t ed25519 -f ~/.ssh/voicestudio-tunnel -N ''
#   2. Taruh isi ~/.ssh/voicestudio-tunnel.pub ke ~/.ssh/authorized_keys di VM VoiceStudio
#   3. Isi VOICESTUDIO_SSH_HOST / VOICESTUDIO_SSH_PORT di .env (repo ini)
# Jalankan di background (dari folder repo):
#   setsid nohup bash scripts/terowongan-voicestudio.sh > /tmp/terowongan-voice.log 2>&1 < /dev/null &
# Script menjaga terowongan tetap hidup (sambung ulang tiap 5 detik bila putus).
# Cek: curl -s http://127.0.0.1:3900/v1/audio/voices -H "Authorization: Bearer $KEY"
#      tanpa key harus balas {"detail":"API key required"} — itu bukti terowongan jalan.
set -u
cd "$(dirname "$0")/.." || exit 1
# Muat .env sederhana (tanpa menimpa env yang sudah ada)
if [ -f .env ]; then
  set -a
  # shellcheck disable=SC1091
  . ./.env
  set +a
fi
: "${VOICESTUDIO_SSH_HOST:?VOICESTUDIO_SSH_HOST belum diisi di .env (endpoint SSH VM VoiceStudio)}"
KUNCI="${VOICESTUDIO_KUNCI_SSH:-$HOME/.ssh/voicestudio-tunnel}"
PORT_SSH="${VOICESTUDIO_SSH_PORT:-22}"
PORT_LOKAL="${VOICESTUDIO_PORT_LOKAL:-3900}"
# ~ di tengah nilai tidak mengembang otomatis -> ganti manual
KUNCI="${KUNCI/#\~/$HOME}"
echo "Terowongan VoiceStudio: 127.0.0.1:${PORT_LOKAL} -> 127.0.0.1:3900 via ${VOICESTUDIO_SSH_HOST}:${PORT_SSH}"
while true; do
  ssh -N -L "127.0.0.1:${PORT_LOKAL}:127.0.0.1:3900" \
    -i "$KUNCI" -p "$PORT_SSH" -o ExitOnForwardFailure=yes \
    -o ServerAliveInterval=15 -o ServerAliveCountMax=3 \
    -o StrictHostKeyChecking=accept-new "$VOICESTUDIO_SSH_HOST"
  echo "Terowongan putus (kode $?), sambung ulang dalam 5 detik..."
  sleep 5
done
