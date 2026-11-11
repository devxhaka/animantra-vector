// Catatan pemakaian Gemini TTS per hari.
// Google tidak menyediakan API untuk membaca sisa kuota, jadi studio menghitung sendiri setiap permintaan
// yang dikirim dari komputer ini. Angkanya PERKIRAAN: permintaan dari tempat lain dengan kunci yang sama tidak terhitung.
import fs from 'node:fs';
import path from 'node:path';
import { DIR } from './jalur';

const FILE = path.join(DIR.data, 'pemakaian-gemini.json');
const ZONA = 'America/Los_Angeles'; // kuota harian Gemini pulih tengah malam waktu Pasifik

export const geminiSiap = () => !!process.env.GEMINI_API_KEY;
export const modelGeminiTts = () => process.env.GEMINI_TTS_MODEL || 'gemini-2.5-flash-preview-tts';
/** Batas permintaan per hari paket gratis. Ubah lewat GEMINI_TTS_BATAS_HARIAN bila kuota akunmu berbeda. */
export const batasHarianGemini = () => Math.max(1, Number(process.env.GEMINI_TTS_BATAS_HARIAN) || 15);

type Catatan = { tanggal: string; model: string; permintaan: number; habis: boolean; terakhir: string | null };

function bagianPasifik(d = new Date()) {
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-CA', { timeZone: ZONA, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' }).formatToParts(d).map((x) => [x.type, x.value]));
  return { tanggal: `${p.year}-${p.month}-${p.day}`, detik: Number(p.hour) * 3600 + Number(p.minute) * 60 + Number(p.second) };
}

function baca(): Catatan {
  const kosong: Catatan = { tanggal: bagianPasifik().tanggal, model: modelGeminiTts(), permintaan: 0, habis: false, terakhir: null };
  try {
    const c = JSON.parse(fs.readFileSync(FILE, 'utf8')) as Catatan;
    // hari baru atau model diganti → hitungan mulai dari nol (kuota dihitung per model)
    return c.tanggal === kosong.tanggal && c.model === kosong.model ? c : kosong;
  } catch {
    return kosong;
  }
}
function tulis(c: Catatan) {
  try {
    fs.mkdirSync(path.dirname(FILE), { recursive: true });
    fs.writeFileSync(FILE, JSON.stringify(c, null, 2));
  } catch {
    /* catatan pemakaian tidak boleh menggagalkan pembuatan suara */
  }
}

/** Panggil setiap kali satu permintaan TTS diterima Gemini (berhasil). */
export function catatPermintaanGemini() {
  const c = baca();
  c.permintaan += 1;
  c.terakhir = new Date().toISOString();
  tulis(c);
}
/** Panggil saat Gemini menolak dengan "kuota harian habis". */
export function tandaiGeminiHabis() {
  const c = baca();
  c.habis = true;
  c.terakhir = new Date().toISOString();
  tulis(c);
}

export type PemakaianGemini = { model: string; dipakai: number; batas: number; sisa: number; habis: boolean; pulih: string; terakhir: string | null };

export function pemakaianGemini(): PemakaianGemini | null {
  if (!geminiSiap()) return null;
  const c = baca();
  const batas = batasHarianGemini();
  const pulih = new Date(Date.now() + (86400 - bagianPasifik().detik) * 1000).toISOString();
  return { model: c.model, dipakai: c.permintaan, batas, sisa: c.habis ? 0 : Math.max(0, batas - c.permintaan), habis: c.habis, pulih, terakhir: c.terakhir };
}
