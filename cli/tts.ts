import fs from 'node:fs';
import path from 'node:path';
import type { Job, Spec } from '../shared/tipe';
import { lapor } from './api';
import { azureSiap, ttsAzure } from '../server/azure';
import { edgeSiap, ttsEdge } from '../server/edge';
import { daftarSuaraEleven, elevenSiap, faktorKredit, galatIzinSuara, infoSuaraEleven, modelEleven, sisaKreditEleven, ttsEleven } from '../server/elevenlabs';
import { catatPermintaanGemini, modelGeminiTts, tandaiGeminiHabis } from '../server/gemini';

const JEDA = 0.35; // detik napas di akhir tiap adegan

type Penyedia = 'edge' | 'azure' | 'elevenlabs' | 'gemini';
export function uraiSuara(nilai: string): { penyedia: Penyedia; id: string } {
  const [p, ...sisa] = (nilai || '').split(':');
  if ((p === 'edge' || p === 'azure' || p === 'elevenlabs' || p === 'gemini') && sisa.length) return { penyedia: p, id: sisa.join(':') };
  return { penyedia: 'gemini', id: nilai || 'Kore' }; // format lama: "Kore"
}
const siap = (p: Penyedia) => (p === 'edge' ? edgeSiap() : p === 'azure' ? azureSiap() : p === 'elevenlabs' ? elevenSiap() : !!process.env.GEMINI_API_KEY);
const NAMA_PENYEDIA: Record<Penyedia, string> = { edge: 'Edge (tanpa key)', azure: 'Azure', elevenlabs: 'ElevenLabs', gemini: 'Gemini' };
const SUARA_CADANGAN: Record<Penyedia, string> = {
  edge: process.env.EDGE_VOICE_CADANGAN || 'id-ID-GadisNeural',
  azure: process.env.AZURE_SPEECH_VOICE_CADANGAN || 'id-ID-GadisNeural',
  elevenlabs: process.env.ELEVENLABS_VOICE_CADANGAN || 'EXAVITQu4vr4xnSDxMaL',
  gemini: 'Kore',
};

// ---------------- Gemini ----------------
function wav(pcm: Buffer, rate: number) {
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
const GAYA_GEMINI = 'Bacakan dalam bahasa Indonesia dengan gaya kreator edukasi yang antusias, jelas, dan tidak terburu-buru';

/** Satu permintaan ke Gemini TTS → PCM16 mono. Setiap permintaan yang diterima dicatat ke pemakaian harian. */
export async function mintaGemini(prompt: string, suara: string) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelGeminiTts()}:generateContent`;
  const body = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: { responseModalities: ['AUDIO'], speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: suara } } } },
  };
  for (let coba = 0; coba < 4; coba++) {
    const r = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json', 'x-goog-api-key': process.env.GEMINI_API_KEY! }, body: JSON.stringify(body) });
    const t = await r.text();
    // 429 harian → berhenti & tandai habis. 429 per menit → tunggu sesuai saran Google lalu coba lagi.
    if (r.status === 429 && /per ?day|PerDay|daily/i.test(t)) {
      tandaiGeminiHabis();
      throw new Error('Kuota harian Gemini TTS habis');
    }
    if (r.status === 429 || r.status >= 500) {
      const saran = Number(t.match(/"retryDelay":\s*"(\d+(?:\.\d+)?)s"/)?.[1] ?? 0);
      if (coba === 3 && r.status === 429) throw new Error('Kuota Gemini TTS habis (batas per menit terus tercapai)');
      await new Promise((s) => setTimeout(s, Math.min(65_000, Math.max(saran * 1000 + 500, 2000 * 2 ** coba))));
      continue;
    }
    const j: any = JSON.parse(t || '{}');
    if (!r.ok) throw new Error(`Gemini TTS ${r.status}: ${j?.error?.message ?? t.slice(0, 200)}`);
    catatPermintaanGemini();
    const part = j?.candidates?.[0]?.content?.parts?.find((p: any) => p.inlineData?.data);
    if (!part) throw new Error('Gemini TTS tidak mengembalikan audio');
    const rate = Number(String(part.inlineData.mimeType).match(/rate=(\d+)/)?.[1] ?? 24000);
    return { pcm: Buffer.from(part.inlineData.data, 'base64'), rate };
  }
  throw new Error('Gemini TTS: terlalu banyak percobaan');
}

export async function ttsGemini(teks: string, suara: string) {
  const { pcm, rate } = await mintaGemini(`${GAYA_GEMINI}: ${teks}`, suara);
  return { data: wav(pcm, rate), ext: 'wav', durasi: pcm.length / 2 / rate };
}

// ---- Gemini gabungan: satu permintaan untuk banyak baris, lalu dipotong di jeda hening ----
// Kuota gratis Gemini TTS dihitung per PERMINTAAN, jadi 1 permintaan per video jauh lebih hemat
// daripada 1 permintaan per adegan.
const MAKS_BARIS_GABUNG = 12;
const MAKS_HURUF_GABUNG = 1800;

/** Rentang hening (detik) di PCM16 mono, dari yang paling awal. */
export function cariHening(pcm: Buffer, rate: number, minimal = 0.24) {
  const per = Math.max(1, Math.round(rate * 0.01)); // jendela 10 ms
  const n = Math.floor(pcm.length / 2);
  const rms: number[] = [];
  for (let i = 0; i < n; i += per) {
    let s = 0;
    const akhir = Math.min(n, i + per);
    for (let j = i; j < akhir; j++) {
      const v = pcm.readInt16LE(j * 2) / 32768;
      s += v * v;
    }
    rms.push(Math.sqrt(s / Math.max(1, akhir - i)));
  }
  const urut = [...rms].sort((x, y) => x - y);
  const ambang = Math.max(0.006, (urut[Math.floor(urut.length * 0.9)] || 0.1) * 0.07);
  const hasil: { a: number; b: number }[] = [];
  let mulai = -1;
  for (let i = 0; i <= rms.length; i++) {
    const sunyi = i < rms.length && rms[i] < ambang;
    if (sunyi && mulai < 0) mulai = i;
    if (!sunyi && mulai >= 0) {
      if ((i - mulai) * 0.01 >= minimal || mulai === 0 || i === rms.length) hasil.push({ a: mulai * 0.01, b: i * 0.01 });
      mulai = -1;
    }
  }
  return { hening: hasil, total: n / rate };
}

/**
 * Tentukan potongan [a, b] (detik) untuk tiap baris dari satu rekaman gabungan.
 * `panjang` = jumlah huruf tiap baris; dipakai untuk memperkirakan letak batas, lalu dipilih jeda hening
 * terpanjang di dekat perkiraan itu. Mengembalikan null bila batasnya tidak meyakinkan.
 */
export function potongPerBaris(pcm: Buffer, rate: number, panjang: number[]): { a: number; b: number }[] | null {
  const { hening, total } = cariHening(pcm, rate);
  const s0 = hening.length && hening[0].a < 0.02 ? hening[0].b : 0;
  const s1 = hening.length && hening[hening.length - 1].b > total - 0.02 ? hening[hening.length - 1].a : total;
  const tengah = hening.filter((h) => h.a > s0 + 0.3 && h.b < s1 - 0.3);
  const N = panjang.length;
  if (tengah.length < N - 1) return null;
  const potong: { a: number; b: number }[] = [];
  let dari = s0;
  let iHening = 0;
  for (let k = 0; k < N - 1; k++) {
    const sisaHuruf = panjang.slice(k).reduce((x, y) => x + y, 0);
    const lama = ((s1 - dari) * panjang[k]) / sisaHuruf; // perkiraan durasi baris k
    const kira = dari + lama;
    let pilih = -1;
    let skorTerbaik = -Infinity;
    // sisakan cukup jeda untuk batas-batas berikutnya
    for (let i = iHening; i <= tengah.length - (N - 1 - k); i++) {
      const h = tengah[i];
      const mid = (h.a + h.b) / 2;
      if (h.a < dari + 0.3) continue;
      const selisih = Math.abs(mid - kira);
      if (selisih > Math.max(1.4, lama * 0.6)) continue;
      const skor = (h.b - h.a) - (0.7 * selisih) / Math.max(1, lama);
      if (skor > skorTerbaik) {
        skorTerbaik = skor;
        pilih = i;
      }
    }
    if (pilih < 0) return null;
    potong.push({ a: dari, b: tengah[pilih].a });
    dari = tengah[pilih].b;
    iHening = pilih + 1;
  }
  potong.push({ a: dari, b: s1 });
  // uji kewajaran: kecepatan bicara tiap baris tidak boleh jauh dari rata-rata
  const bicara = potong.reduce((s, p) => s + (p.b - p.a), 0);
  const perHuruf = bicara / panjang.reduce((x, y) => x + y, 0);
  for (let k = 0; k < N; k++) {
    const d = potong[k].b - potong[k].a;
    const rasio = d / Math.max(0.2, panjang[k] * perHuruf);
    if (d < 0.4 || rasio < 0.45 || rasio > 2.2) return null;
  }
  return potong.map((p) => ({ a: Math.max(0, p.a - 0.04), b: Math.min(total, p.b + 0.1) }));
}

/** Satu permintaan untuk beberapa baris. Mengembalikan WAV per baris, atau null bila pemotongan tidak meyakinkan. */
export async function ttsGeminiGabung(baris: string[], suara: string) {
  const prompt =
    `${GAYA_GEMINI}. Naskah di bawah terdiri dari ${baris.length} paragraf yang dipisah baris kosong. ` +
    `Beri jeda hening kira-kira satu detik setiap selesai satu paragraf, dan jangan beri jeda panjang di dalam paragraf. ` +
    `Bacakan hanya isi naskahnya:\n\n${baris.join('\n\n')}`;
  const { pcm, rate } = await mintaGemini(prompt, suara);
  const potong = potongPerBaris(pcm, rate, baris.map((b) => b.length));
  if (!potong) return null;
  return potong.map((p) => {
    const bagian = pcm.subarray(Math.floor(p.a * rate) * 2, Math.floor(p.b * rate) * 2);
    return { data: wav(bagian, rate), ext: 'wav', durasi: bagian.length / 2 / rate };
  });
}

// ---------------- Utama ----------------
// ---------------- Amplop gerak mulut ----------------
const VOKAL = /[aiueoAIUEOéè]/;
function haluskan(v: number[]) {
  const o: number[] = [];
  let x = 0;
  for (const n of v) {
    x = n > x ? x + (n - x) * 0.65 : x + (n - x) * 0.4; // buka cepat, tutup sedikit lebih lambat
    o.push(+x.toFixed(2));
  }
  return o;
}
/** dari WAV PCM16 mono: kenyaringan per frame */
function amplopWav(buf: Buffer, fps: number) {
  const rate = buf.readUInt32LE(24) || 24000;
  const n = Math.floor((buf.length - 44) / 2);
  const per = Math.max(1, Math.round(rate / fps));
  const rms: number[] = [];
  for (let i = 0; i < n; i += per) {
    let s = 0;
    const akhir = Math.min(n, i + per);
    for (let j = i; j < akhir; j++) {
      const v = buf.readInt16LE(44 + j * 2) / 32768;
      s += v * v;
    }
    rms.push(Math.sqrt(s / Math.max(1, akhir - i)));
  }
  const urut = [...rms].sort((x, y) => x - y);
  const p90 = urut[Math.floor(urut.length * 0.9)] || 1;
  return haluskan(rms.map((r) => Math.min(1, Math.max(0, (r / p90 - 0.18) / 0.82))));
}
/** dari timing huruf (ElevenLabs) atau perkiraan merata (tanpa audio) */
function amplopHuruf(huruf: string[], mulai: number[], akhir: number[], fps: number) {
  const total = akhir.length ? akhir[akhir.length - 1] : 0;
  const v: number[] = [];
  let i = 0;
  for (let f = 0; f / fps < total; f++) {
    const t = f / fps;
    while (i < akhir.length - 1 && akhir[i] < t) i++;
    const c = huruf[i] ?? ' ';
    v.push(mulai[i] <= t ? (VOKAL.test(c) ? 0.9 : /\p{L}/u.test(c) ? 0.35 : 0) : 0);
  }
  return haluskan(v);
}
function amplopPerkiraan(teks: string, durasi: number, fps: number) {
  const h = [...teks];
  const d = durasi / Math.max(1, h.length);
  return amplopHuruf(h, h.map((_, i) => i * d), h.map((_, i) => (i + 1) * d), fps);
}

// ---------------- Waktu per kata (karaoke) ----------------
type WaktuKata = { t: string; a: number; b: number };
const daftarKata = (narasi: string) => narasi.split(/\s+/).filter(Boolean);
const bulat = (x: number) => +x.toFixed(3);

/** ElevenLabs: kelompokkan waktu huruf menjadi kata (urutan sama dengan narasi). */
function kataDariHuruf(narasi: string, huruf: string[], mulai: number[], akhir: number[]): WaktuKata[] | null {
  const kata = daftarKata(narasi);
  const seg: { a: number; b: number }[] = [];
  let cur: { a: number; b: number } | null = null;
  huruf.forEach((c, i) => {
    if (/\s/.test(c)) {
      if (cur) seg.push(cur);
      cur = null;
    } else if (!cur) cur = { a: mulai[i], b: akhir[i] };
    else cur.b = akhir[i];
  });
  if (cur) seg.push(cur);
  if (seg.length !== kata.length) return null;
  return kata.map((t, i) => ({ t, a: bulat(seg[i].a), b: bulat(seg[i].b) }));
}

/** Azure/Gemini: petakan panjang huruf kumulatif ke energi suara kumulatif → jeda bicara ikut terhitung. */
function kataDariAmplop(narasi: string, amplop: number[], fps: number): WaktuKata[] {
  const kata = daftarKata(narasi);
  const kum: number[] = [0];
  for (const v of amplop) kum.push(kum[kum.length - 1] + v);
  const total = kum[kum.length - 1] || 1;
  const waktuPada = (fraksi: number) => {
    const target = fraksi * total;
    let i = 0;
    while (i < kum.length - 1 && kum[i + 1] < target) i++;
    const sisa = (target - kum[i]) / Math.max(1e-6, kum[i + 1] - kum[i]);
    return (i + Math.min(1, Math.max(0, sisa))) / fps;
  };
  const bobot = kata.map((k) => k.replace(/[*.,!?;:"]/g, '').length + 0.6);
  const jml = bobot.reduce((x, y) => x + y, 0);
  let acc = 0;
  return kata.map((t, i) => {
    const a = waktuPada(acc / jml);
    acc += bobot[i];
    return { t, a: bulat(a), b: bulat(waktuPada(acc / jml)) };
  });
}

// ---------------- Pembuatan suara ----------------
type Calon = { penyedia: Penyedia; suara: string; nama?: string };
type HasilBaris = { file: string; durasi: number; mulut: number[]; kata: WaktuKata[] | null };

async function buatBaris(spec: Spec, i: number, u: Calon, tmp: string): Promise<HasilBaris> {
  const a = spec.adegan[i];
  const teks = a.narasi.replace(/\*/g, '');
  if (u.penyedia === 'elevenlabs') {
    // konteks hanya dari baris pembicara yang sama, agar intonasi nyambung
    const bersih = (x?: string) => x?.replace(/\*/g, '');
    const sama = (j: number) => spec.adegan[j] && (spec.adegan[j].pembicara ?? null) === (a.pembicara ?? null);
    const r = await ttsEleven(teks, u.suara, { sebelum: sama(i - 1) ? bersih(spec.adegan[i - 1].narasi) : undefined, sesudah: sama(i + 1) ? bersih(spec.adegan[i + 1].narasi) : undefined });
    fs.writeFileSync(path.join(tmp, `${a.id}.mp3`), r.mp3);
    fs.writeFileSync(path.join(tmp, `${a.id}.timing.json`), JSON.stringify(r.timing));
    const durasi = r.durasi ?? (r.mp3.length * 8) / 128000;
    const mulut = r.timing.akhir.length ? amplopHuruf(r.timing.huruf, r.timing.mulai, r.timing.akhir, spec.fps) : amplopPerkiraan(teks, durasi, spec.fps);
    const kata = r.timing.akhir.length ? kataDariHuruf(a.narasi, r.timing.huruf, r.timing.mulai, r.timing.akhir) : null;
    return { file: `suara/${a.id}.mp3`, durasi, mulut, kata: kata ?? kataDariAmplop(a.narasi, mulut, spec.fps) };
  }
  if (u.penyedia === 'edge') {
    const r = await ttsEdge(teks, u.suara);
    fs.writeFileSync(path.join(tmp, `${a.id}.mp3`), r.mp3);
    // gerak mulut: huruf tiap kata disebar merata di dalam rentang waktu kata itu
    const huruf: string[] = [], mulai: number[] = [], akhir: number[] = [];
    for (const k of r.kata) {
      const h = [...k.t];
      const d = (k.b - k.a) / Math.max(1, h.length);
      h.forEach((c, j) => (huruf.push(c), mulai.push(k.a + j * d), akhir.push(k.a + (j + 1) * d)));
      huruf.push(' '), mulai.push(k.b), akhir.push(k.b + 0.01);
    }
    const mulut = huruf.length ? amplopHuruf(huruf, mulai, akhir, spec.fps) : amplopPerkiraan(teks, r.durasi, spec.fps);
    const kataNarasi = a.narasi.split(/\s+/).filter(Boolean);
    const kata =
      r.kata.length === kataNarasi.length ? kataNarasi.map((t, j) => ({ t, a: r.kata[j].a, b: r.kata[j].b })) : kataDariAmplop(a.narasi, mulut, spec.fps);
    return { file: `suara/${a.id}.mp3`, durasi: r.durasi, mulut, kata };
  }
  const r = u.penyedia === 'azure' ? await ttsAzure(teks, u.suara) : await ttsGemini(teks, u.suara);
  fs.writeFileSync(path.join(tmp, `${a.id}.wav`), r.data);
  const mulut = amplopWav(r.data, spec.fps);
  return { file: `suara/${a.id}.wav`, durasi: r.durasi, mulut, kata: kataDariAmplop(a.narasi, mulut, spec.fps) };
}

function simpanWav(spec: Spec, i: number, r: { data: Buffer; durasi: number }, tmp: string): HasilBaris {
  const a = spec.adegan[i];
  fs.writeFileSync(path.join(tmp, `${a.id}.wav`), r.data);
  const mulut = amplopWav(r.data, spec.fps);
  return { file: `suara/${a.id}.wav`, durasi: r.durasi, mulut, kata: kataDariAmplop(a.narasi, mulut, spec.fps) };
}

/**
 * Gemini untuk satu kelompok baris: digabung menjadi sesedikit mungkin permintaan.
 * Bila pemotongan sebuah gabungan tidak meyakinkan, gabungan itu diulang per baris (lebih boros, tapi karaoke tetap pas).
 */
async function buatKelompokGemini(spec: Spec, indeks: number[], suara: string, tmp: string, catat: (pesan: string) => Promise<void>, maju: (i: number, h: HasilBaris) => Promise<void>) {
  const tumpukan: number[][] = [];
  let kini: number[] = [];
  let huruf = 0;
  for (const i of indeks) {
    const n = spec.adegan[i].narasi.length;
    if (kini.length && (kini.length >= MAKS_BARIS_GABUNG || huruf + n > MAKS_HURUF_GABUNG)) {
      tumpukan.push(kini);
      kini = [];
      huruf = 0;
    }
    kini.push(i);
    huruf += n;
  }
  if (kini.length) tumpukan.push(kini);

  for (const t of tumpukan) {
    const teks = t.map((i) => spec.adegan[i].narasi.replace(/\*/g, ''));
    const gabung = t.length > 1 ? await ttsGeminiGabung(teks, suara) : null;
    if (gabung) {
      await catat(`Gemini: ${t.length} baris dibuat dalam 1 permintaan`);
      for (const [k, i] of t.entries()) await maju(i, simpanWav(spec, i, gabung[k], tmp));
      continue;
    }
    if (t.length > 1) await catat(`Gemini: jeda antar-baris tidak terbaca jelas, ${t.length} baris diulang satu per satu`);
    for (const [k, i] of t.entries()) await maju(i, simpanWav(spec, i, await ttsGemini(teks[k], suara), tmp));
  }
}

const namaSuara = (id: string) => id.replace(/^[a-z]{2}-[A-Z]{2}-|Neural$/g, '');

/** Suara pilihan per baris: suara tokoh (format Cerita) atau suara narator dari form. */
function suaraBaris(spec: Spec, job: Job, i: number): { nilai: string; label: string; jenis?: 'perempuan' | 'laki' } {
  const a = spec.adegan[i];
  const p = a.pembicara && a.pembicara !== 'narator' ? spec.pemeran?.find((x) => x.id === a.pembicara) : undefined;
  if (p?.suara) return { nilai: p.suara, label: p.nama, jenis: p.jenis };
  return { nilai: job.form.suara, label: spec.pemeran?.length ? 'Narator' : 'Narasi' };
}

export async function buatSuara(job: Job, dir: string) {
  const fSpec = path.join(dir, 'spec.json');
  const spec: Spec = JSON.parse(fs.readFileSync(fSpec, 'utf8'));
  const karakter = spec.adegan.reduce((s, a) => s + a.narasi.replace(/\*/g, '').length, 0);
  await lapor(job.id, { tahap: 'suara', status: 'mulai', log: `Membuat suara untuk ${spec.adegan.length} baris (${karakter} karakter)` });

  const adaKey = (['edge', 'azure', 'elevenlabs', 'gemini'] as Penyedia[]).some(siap);
  if (!adaKey) {
    for (const a of spec.adegan) {
      const kata = a.narasi.split(/\s+/).filter(Boolean).length;
      a.durasi = +(Math.max(2, kata / 2.6) + JEDA).toFixed(2);
      a.suara = null;
      a.kata = null; // subtitle membagi waktu rata
      a.mulut = a.pembicara && a.pembicara !== 'narator' ? amplopPerkiraan(a.narasi.replace(/\*/g, ''), a.durasi - JEDA, spec.fps) : null;
    }
    fs.writeFileSync(fSpec, JSON.stringify(spec, null, 2));
    await lapor(job.id, { tahap: 'suara', status: 'selesai', log: 'Semua penyedia suara nonaktif (EDGE_TTS=0 dan tidak ada API key): video tanpa suara' });
    console.log('⚠ Semua penyedia suara nonaktif → video tanpa suara.');
    return;
  }

  // kelompokkan baris per suara (satu kelompok = satu pembicara/suara)
  const kelompok = new Map<string, { label: Set<string>; jenis?: 'perempuan' | 'laki'; indeks: number[] }>();
  spec.adegan.forEach((_, i) => {
    const sb = suaraBaris(spec, job, i);
    const g = kelompok.get(sb.nilai) ?? { label: new Set<string>(), jenis: sb.jenis, indeks: [] };
    g.label.add(sb.label);
    g.indeks.push(i);
    kelompok.set(sb.nilai, g);
  });

  const semuaEleven = await daftarSuaraEleven();
  const premade = (jenis?: string) => {
    const env = semuaEleven.find((v) => v.id === SUARA_CADANGAN.elevenlabs && v.bisa);
    const cocok = semuaEleven.find((v) => v.premade && v.bisa && (!jenis || v.ket.toLowerCase().includes(jenis === 'laki' ? 'laki' : 'perempuan')));
    return (jenis ? cocok : env) ?? env ?? semuaEleven.find((v) => v.premade && v.bisa) ?? null;
  };
  // rantai cadangan per kelompok: pilihan → Edge (tanpa key) → Azure (sesuai jenis kelamin) → ElevenLabs bawaan → Gemini
  const rantai = (nilai: string, jenis?: 'perempuan' | 'laki') => {
    const r: Calon[] = [];
    const tambah = (u: Calon) => !r.some((x) => x.penyedia === u.penyedia && x.suara === u.suara) && r.push(u);
    const p = uraiSuara(nilai);
    if (p.penyedia === 'elevenlabs') {
      const info = semuaEleven.find((v) => v.id === p.id);
      if (siap('elevenlabs') && (!info || info.bisa)) tambah({ penyedia: 'elevenlabs', suara: p.id, nama: info?.nama });
    } else if (siap(p.penyedia)) tambah({ penyedia: p.penyedia, suara: p.id, nama: namaSuara(p.id) });
    if (siap('edge')) {
      const ed = jenis === 'laki' ? 'id-ID-ArdiNeural' : jenis === 'perempuan' ? 'id-ID-GadisNeural' : SUARA_CADANGAN.edge;
      tambah({ penyedia: 'edge', suara: ed, nama: namaSuara(ed) });
    }
    if (siap('azure')) {
      const az = jenis === 'laki' ? 'id-ID-ArdiNeural' : jenis === 'perempuan' ? 'id-ID-GadisNeural' : SUARA_CADANGAN.azure;
      tambah({ penyedia: 'azure', suara: az, nama: namaSuara(az) });
    }
    if (siap('elevenlabs')) {
      const c = premade(jenis);
      if (c) tambah({ penyedia: 'elevenlabs', suara: c.id, nama: c.nama });
    }
    if (siap('gemini')) tambah({ penyedia: 'gemini', suara: jenis === 'laki' ? 'Puck' : SUARA_CADANGAN.gemini, nama: jenis === 'laki' ? 'Puck' : SUARA_CADANGAN.gemini });
    return r;
  };

  // cek kredit ElevenLabs SEBELUM mulai (seluruh baris yang akan memakai ElevenLabs)
  let kreditKurang = false;
  const pakaiEleven = [...kelompok.entries()].filter(([n]) => rantai(n)[0]?.penyedia === 'elevenlabs');
  if (pakaiEleven.length) {
    const butuh = Math.ceil(pakaiEleven.reduce((s, [, g]) => s + g.indeks.reduce((t, i) => t + spec.adegan[i].narasi.length, 0), 0) * faktorKredit());
    const k = await sisaKreditEleven(true);
    if (k && k.sisa < butuh) {
      kreditKurang = true;
      const reset = k.reset ? ` (pulih ${new Date(k.reset).toLocaleDateString('id-ID')})` : '';
      await lapor(job.id, { log: `Kredit ElevenLabs tidak cukup: sisa ${k.sisa}, butuh ±${butuh}${reset}` });
    }
  }

  const tmp = path.join(dir, 'suara.tmp');
  fs.rmSync(tmp, { recursive: true, force: true });
  fs.mkdirSync(tmp, { recursive: true });
  const hasil = new Map<number, HasilBaris>();
  const alasan: string[] = [];
  let selesaiN = 0;
  try {
    for (const [nilai, g] of kelompok) {
      const label = [...g.label].join('/');
      const info = uraiSuara(nilai);
      if (info.penyedia === 'elevenlabs') {
        const v = semuaEleven.find((x) => x.id === info.id);
        if (v && !v.bisa) await lapor(job.id, { log: `${label}: suara "${v.nama}" dari Voice Library tidak bisa dipakai akun gratis → pakai cadangan` });
      }
      let berhasil = false;
      for (const [n, u] of rantai(nilai, g.jenis).entries()) {
        if (u.penyedia === 'elevenlabs' && kreditKurang) continue;
        try {
          if (n > 0) await lapor(job.id, { log: `${label}: pindah ke ${NAMA_PENYEDIA[u.penyedia]} "${u.nama ?? u.suara}" untuk SEMUA baris ${label} agar suaranya konsisten` });
          await lapor(job.id, { log: `Suara ${label}: ${u.penyedia === 'elevenlabs' ? `ElevenLabs (${modelEleven()})` : NAMA_PENYEDIA[u.penyedia]} · ${u.nama ?? u.suara}` });
          const sementara = new Map<number, HasilBaris>();
          const maju = async (i: number, h: HasilBaris) => {
            sementara.set(i, h);
            await lapor(job.id, { persen: Math.round(((selesaiN + sementara.size) / spec.adegan.length) * 100) });
            console.log(`  ✓ ${spec.adegan[i].id} (${label}): ${h.durasi.toFixed(2)} dtk`);
          };
          if (u.penyedia === 'gemini') await buatKelompokGemini(spec, g.indeks, u.suara, tmp, (pesan) => lapor(job.id, { log: pesan }), maju);
          else for (const i of g.indeks) await maju(i, await buatBaris(spec, i, u, tmp));
          for (const [i, h] of sementara) hasil.set(i, h);
          selesaiN += sementara.size;
          berhasil = true;
          break;
        } catch (e) {
          const m = (e as Error).message;
          alasan.push(`${label} · ${u.penyedia}${u.nama ? ` "${u.nama}"` : ''}: ${m}`);
          if (u.penyedia === 'elevenlabs' && /quota|exceed|credit/i.test(m)) kreditKurang = true;
          if (u.penyedia === 'elevenlabs' && galatIzinSuara(m)) await lapor(job.id, { log: 'Suara ini butuh paket berbayar ElevenLabs' });
          await lapor(job.id, { log: `Suara gagal (${label}, ${u.penyedia}): ${m}` });
        }
      }
      if (!berhasil) throw new Error(`Semua penyedia suara gagal untuk ${label} → ` + alasan.join(' | '));
    }
  } catch (e) {
    fs.rmSync(tmp, { recursive: true, force: true });
    throw e;
  }

  // semua baris berhasil → baru ganti folder suara & spec (tidak ada suara setengah jadi)
  const akhir = path.join(dir, 'suara');
  fs.rmSync(akhir, { recursive: true, force: true });
  fs.renameSync(tmp, akhir);
  spec.adegan.forEach((a, i) => {
    const h = hasil.get(i)!;
    a.suara = h.file;
    a.durasi = +(h.durasi + JEDA).toFixed(2);
    a.mulut = a.pembicara && a.pembicara !== 'narator' ? h.mulut : null;
    a.kata = h.kata;
  });
  fs.writeFileSync(fSpec, JSON.stringify(spec, null, 2));
  const total = spec.adegan.reduce((s, a) => s + a.durasi, 0);
  await lapor(job.id, { tahap: 'suara', status: 'selesai', log: `Suara siap (${Math.round(total)} dtk), target ${job.form.durasi} dtk` });
  console.log(`Total ${total.toFixed(1)} dtk (target ${job.form.durasi} dtk). Durasi & gerak mulut di spec.json sudah diperbarui.`);
}
