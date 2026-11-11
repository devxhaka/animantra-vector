// Uji provider VoiceStudio tanpa VM asli: server mock menjawab seperti API asli
// (GET /v1/audio/voices + POST /v1/audio/speech -> WAV 24 kHz mono).
// Jalankan:  npx tsx scripts/uji-voicestudio.ts
// Uji juga gagal-cepat: URL mati harus melempar dalam < 35 detik (bukan menggantung),
// supaya rantai cadangan di cli/tts.ts segera pindah ke Edge.
import http from 'node:http';
import { daftarSuaraVoiceStudio, ttsVoiceStudio } from '../server/voicestudio';

/** WAV PCM16 mono 24 kHz, sinus 440 Hz sepanjang `detik` detik. */
function wavSinus(detik: number): Buffer {
  const rate = 24000;
  const n = Math.floor(rate * detik);
  const pcm = Buffer.alloc(n * 2);
  for (let i = 0; i < n; i++) pcm.writeInt16LE(Math.floor(Math.sin((2 * Math.PI * 440 * i) / rate) * 12000), i * 2);
  const h = Buffer.alloc(44);
  h.write('RIFF', 0);
  h.writeUInt32LE(36 + pcm.length, 4);
  h.write('WAVEfmt ', 8);
  h.writeUInt32LE(16, 16);
  h.writeUInt16LE(1, 20);
  h.writeUInt16LE(1, 22);
  h.writeUInt32LE(rate, 24);
  h.writeUInt32LE(rate * 2, 28);
  h.writeUInt16LE(2, 32);
  h.writeUInt16LE(16, 34);
  h.write('data', 36);
  h.writeUInt32LE(pcm.length, 40);
  return Buffer.concat([h, pcm]);
}

const SUARA_MOCK = {
  voices: [
    { voice_id: '44d7b906', name: 'Bos', type: 'profile', id: '44d7b906' },
    { voice_id: 'demo0001', name: 'Demo Voice', type: 'profile', id: 'demo0001' },
    { voice_id: 'alloy', name: 'Alloy', type: 'openai_alias', id: 'alloy' },
  ],
};

const server = http.createServer((req, res) => {
  const kunci = req.headers.authorization;
  if (kunci !== 'Bearer tes') {
    res.writeHead(401, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ detail: 'API key required' }));
    return;
  }
  if (req.url === '/v1/audio/voices') {
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end(JSON.stringify(SUARA_MOCK));
    return;
  }
  if (req.url === '/v1/audio/speech' && req.method === 'POST') {
    let badan = '';
    req.on('data', (c) => (badan += c));
    req.on('end', () => {
      const j = JSON.parse(badan || '{}');
      if (j.voice !== '44d7b906' || j.response_format !== 'wav') {
        res.writeHead(400, { 'content-type': 'application/json' });
        res.end(JSON.stringify({ detail: 'bad request' }));
        return;
      }
      res.writeHead(200, { 'content-type': 'audio/wav' });
      res.end(wavSinus(1));
    });
    return;
  }
  res.writeHead(404);
  res.end();
});

await new Promise<void>((ok) => server.listen(0, '127.0.0.1', ok));
const port = (server.address() as any).port;
process.env.VOICESTUDIO_URL = `http://127.0.0.1:${port}`;
process.env.VOICESTUDIO_API_KEY = 'tes';

let gagal = 0;
const cek = (nama: string, ok: boolean, info = '') => {
  console.log(`${ok ? '  ✓' : '  ✗'} ${nama}${info ? ` — ${info}` : ''}`);
  if (!ok) gagal++;
};

const daftar = await daftarSuaraVoiceStudio();
cek('daftar suara: 3 suara', daftar.length === 3, `dapat ${daftar.length}`);
cek('profil kloning didahulukan (Bos pertama)', daftar[0]?.id === '44d7b906' && daftar[0]?.nama === 'Bos', daftar[0]?.id ?? '-');

const r = await ttsVoiceStudio('Halo, ini tes suara Bos.', '44d7b906');
cek('TTS mengembalikan WAV', r.data.length > 44 && r.data.toString('ascii', 0, 4) === 'RIFF', `${r.data.length} byte`);
cek('durasi WAV benar (1,00 dtk)', Math.abs(r.durasi - 1) < 0.01, `${r.durasi.toFixed(3)} dtk`);

server.close();
process.env.VOICESTUDIO_URL = 'http://127.0.0.1:1'; // port mati
const mulai = Date.now();
try {
  await ttsVoiceStudio('Tes gagal cepat.', '44d7b906');
  cek('URL mati harus melempar', false);
} catch (e) {
  const dt = (Date.now() - mulai) / 1000;
  cek('URL mati melempar cepat (< 35 dtk)', dt < 35, `${dt.toFixed(1)} dtk: ${(e as Error).message.slice(0, 80)}`);
}

console.log(gagal ? `\n${gagal} UJI GAGAL` : '\nSemua uji VoiceStudio lolos.');
process.exit(gagal ? 1 : 0);
