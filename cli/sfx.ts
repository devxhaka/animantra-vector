import fs from 'node:fs';
import path from 'node:path';

const RATE = 44100;
function tulisWav(file: string, sampel: Float32Array) {
  const pcm = Buffer.alloc(sampel.length * 2);
  sampel.forEach((v, i) => pcm.writeInt16LE(Math.max(-1, Math.min(1, v)) * 32767, i * 2));
  const h = Buffer.alloc(44);
  h.write('RIFF', 0); h.writeUInt32LE(36 + pcm.length, 4); h.write('WAVEfmt ', 8);
  h.writeUInt32LE(16, 16); h.writeUInt16LE(1, 20); h.writeUInt16LE(1, 22);
  h.writeUInt32LE(RATE, 24); h.writeUInt32LE(RATE * 2, 28); h.writeUInt16LE(2, 32); h.writeUInt16LE(16, 34);
  h.write('data', 36); h.writeUInt32LE(pcm.length, 40);
  fs.writeFileSync(file, Buffer.concat([h, pcm]));
}
const buat = (detik: number, f: (t: number, p: number) => number) => {
  const n = Math.round(detik * RATE);
  const s = new Float32Array(n);
  for (let i = 0; i < n; i++) s[i] = f(i / RATE, i / n);
  return s;
};

/** SFX sintetis sederhana supaya proyek langsung bisa dipakai. Ganti dengan SFX favorit kapan saja. */
export function buatSfxContoh(dir: string) {
  let lp = 0;
  const sfx: Record<string, Float32Array> = {
    'pop.wav': buat(0.18, (t, p) => Math.sin(2 * Math.PI * (300 + 900 * (1 - p)) * t) * Math.exp(-p * 7) * 0.8),
    'klik.wav': buat(0.06, (_t, p) => (Math.random() * 2 - 1) * Math.exp(-p * 18) * 0.9),
    'ding.wav': buat(0.9, (t, p) => (Math.sin(2 * Math.PI * 1318 * t) + 0.4 * Math.sin(2 * Math.PI * 2637 * t)) * Math.exp(-p * 5) * 0.45),
    'whoosh.wav': buat(0.5, (_t, p) => {
      lp += (Math.random() * 2 - 1 - lp) * (0.05 + 0.3 * Math.sin(Math.PI * p));
      return lp * Math.sin(Math.PI * p) * 1.6;
    }),
    'naik.wav': buat(0.35, (t, p) => Math.sin(2 * Math.PI * (400 + 700 * p) * t) * Math.sin(Math.PI * p) * 0.5),
  };
  fs.mkdirSync(dir, { recursive: true });
  for (const [nama, s] of Object.entries(sfx)) {
    tulisWav(path.join(dir, nama), s);
    console.log('  sfx/' + nama);
  }
}
