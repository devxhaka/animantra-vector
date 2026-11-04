import fs from 'node:fs';
import path from 'node:path';
import type { Job, Spec } from '../shared/tipe';
import { lapor } from './api';
import { azureSiap, ttsAzure } from '../server/azure';
import { daftarSuaraEleven, elevenSiap, faktorKredit, galatIzinSuara, infoSuaraEleven, modelEleven, sisaKreditEleven, ttsEleven } from '../server/elevenlabs';

const JEDA = 0.35; // detik napas di akhir tiap adegan

type Penyedia = 'azure' | 'elevenlabs' | 'gemini';
export function uraiSuara(nilai: string): { penyedia: Penyedia; id: string } {
  const [p, ...sisa] = (nilai || '').split(':');
  if ((p === 'azure' || p === 'elevenlabs' || p === 'gemini') && sisa.length) return { penyedia: p, id: sisa.join(':') };
  return { penyedia: 'gemini', id: nilai || 'Kore' }; // format lama: "Kore"
}
const siap = (p: Penyedia) => (p === 'azure' ? azureSiap() : p === 'elevenlabs' ? elevenSiap() : !!process.env.GEMINI_API_KEY);
const NAMA_PENYEDIA: Record<Penyedia, string> = { azure: 'Azure', elevenlabs: 'ElevenLabs', gemini: 'Gemini' };
const SUARA_CADANGAN: Record<Penyedia, string> = {
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
export async function ttsGemini(teks: string, suara: string) {
  const model = process.env.GEMINI_TTS_MODEL || 'gemini-2.5-flash-preview-tts';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
  const body = {
    contents: [{ parts: [{ text: `Bacakan dalam bahasa Indonesia dengan gaya kreator edukasi yang antusias, jelas, dan tidak terburu-buru: ${teks}` }] }],
    generationConfig: { responseModalities: ['AUDIO'], speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: suara } } } },
  };
  for (let coba = 0; coba < 4; coba++) {
    const r = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json', 'x-goog-api-key': process.env.GEMINI_API_KEY! }, body: JSON.stringify(body) });
    const t = await r.text();
    if (r.status === 429 && /quota|exhausted|per day/i.test(t)) throw new Error('Kuota harian Gemini TTS habis');
    if (r.status === 429 || r.status >= 500) {
      await new Promise((s) => setTimeout(s, 2000 * 2 ** coba));
      continue;
    }
    const j: any = JSON.parse(t || '{}');
    if (!r.ok) throw new Error(`Gemini TTS ${r.status}: ${j?.error?.message ?? t.slice(0, 200)}`);
    const part = j?.candidates?.[0]?.content?.parts?.find((p: any) => p.inlineData?.data);
    if (!part) throw new Error('Gemini TTS tidak mengembalikan audio');
    const rate = Number(String(part.inlineData.mimeType).match(/rate=(\d+)/)?.[1] ?? 24000);
    const pcm = Buffer.from(part.inlineData.data, 'base64');
    return { data: wav(pcm, rate), ext: 'wav', durasi: pcm.length / 2 / rate };
  }
  throw new Error('Gemini TTS: terlalu banyak percobaan');
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
  const r = u.penyedia === 'azure' ? await ttsAzure(teks, u.suara) : await ttsGemini(teks, u.suara);
  fs.writeFileSync(path.join(tmp, `${a.id}.wav`), r.data);
  const mulut = amplopWav(r.data, spec.fps);
  return { file: `suara/${a.id}.wav`, durasi: r.durasi, mulut, kata: kataDariAmplop(a.narasi, mulut, spec.fps) };
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

  const adaKey = (['azure', 'elevenlabs', 'gemini'] as Penyedia[]).some(siap);
  if (!adaKey) {
    for (const a of spec.adegan) {
      const kata = a.narasi.split(/\s+/).filter(Boolean).length;
      a.durasi = +(Math.max(2, kata / 2.6) + JEDA).toFixed(2);
      a.suara = null;
      a.kata = null; // subtitle membagi waktu rata
      a.mulut = a.pembicara && a.pembicara !== 'narator' ? amplopPerkiraan(a.narasi.replace(/\*/g, ''), a.durasi - JEDA, spec.fps) : null;
    }
    fs.writeFileSync(fSpec, JSON.stringify(spec, null, 2));
    await lapor(job.id, { tahap: 'suara', status: 'selesai', log: 'Belum ada API key suara (AZURE_SPEECH_KEY / ELEVENLABS_API_KEY / GEMINI_API_KEY): video tanpa suara' });
    console.log('⚠ Tidak ada API key suara di .env → video tanpa suara.');
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
  // rantai cadangan per kelompok: pilihan → Azure (sesuai jenis kelamin) → ElevenLabs bawaan → Gemini
  const rantai = (nilai: string, jenis?: 'perempuan' | 'laki') => {
    const r: Calon[] = [];
    const tambah = (u: Calon) => !r.some((x) => x.penyedia === u.penyedia && x.suara === u.suara) && r.push(u);
    const p = uraiSuara(nilai);
    if (p.penyedia === 'elevenlabs') {
      const info = semuaEleven.find((v) => v.id === p.id);
      if (siap('elevenlabs') && (!info || info.bisa)) tambah({ penyedia: 'elevenlabs', suara: p.id, nama: info?.nama });
    } else if (siap(p.penyedia)) tambah({ penyedia: p.penyedia, suara: p.id, nama: namaSuara(p.id) });
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
          for (const i of g.indeks) {
            sementara.set(i, await buatBaris(spec, i, u, tmp));
            await lapor(job.id, { persen: Math.round(((selesaiN + sementara.size) / spec.adegan.length) * 100) });
            console.log(`  ✓ ${spec.adegan[i].id} (${label}): ${sementara.get(i)!.durasi.toFixed(2)} dtk`);
          }
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
