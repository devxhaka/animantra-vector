// Microsoft Azure Speech (resmi) — suara penutur asli Indonesia: Gadis & Ardi.
// Paket gratis F0: ±500 ribu karakter/bulan untuk suara neural.
const kunci = () => process.env.AZURE_SPEECH_KEY || '';
const wilayah = () => process.env.AZURE_SPEECH_REGION || 'southeastasia';
const dasar = () => process.env.AZURE_SPEECH_BASE || `https://${wilayah()}.tts.speech.microsoft.com`;
export const azureSiap = () => !!kunci();

export type SuaraAzure = { id: string; nama: string; ket: string };
export const SUARA_AZURE_BAWAAN: SuaraAzure[] = [
  { id: 'id-ID-GadisNeural', nama: 'Gadis', ket: 'Perempuan, Indonesia' },
  { id: 'id-ID-ArdiNeural', nama: 'Ardi', ket: 'Laki-laki, Indonesia' },
];

let cache: { waktu: number; data: SuaraAzure[] } | null = null;
/** Semua suara id-ID yang tersedia di wilayah ini (Microsoft kadang menambah suara baru). */
export async function daftarSuaraAzure(): Promise<SuaraAzure[]> {
  if (!azureSiap()) return [];
  if (cache && Date.now() - cache.waktu < 60 * 60_000) return cache.data;
  try {
    const r = await fetch(`${dasar()}/cognitiveservices/voices/list`, { headers: { 'Ocp-Apim-Subscription-Key': kunci() } });
    if (!r.ok) throw new Error(String(r.status));
    const j: any[] = await r.json();
    const data = j
      .filter((v) => v.Locale === 'id-ID')
      .map((v) => ({ id: v.ShortName, nama: v.LocalName || v.DisplayName, ket: `${v.Gender === 'Female' ? 'Perempuan' : 'Laki-laki'}, Indonesia` }));
    cache = { waktu: Date.now(), data: data.length ? data : SUARA_AZURE_BAWAAN };
  } catch {
    cache = { waktu: Date.now(), data: SUARA_AZURE_BAWAAN };
  }
  return cache.data;
}

const xml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** TTS → WAV PCM 24 kHz mono (durasi bisa dihitung persis dari ukuran data). */
export async function ttsAzure(teks: string, suara: string) {
  const laju = process.env.AZURE_SPEECH_RATE || '+5%';
  const ssml =
    `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="id-ID">` +
    `<voice name="${xml(suara)}"><prosody rate="${xml(laju)}">${xml(teks)}</prosody></voice></speak>`;
  for (let coba = 0; coba < 4; coba++) {
    const r = await fetch(`${dasar()}/cognitiveservices/v1`, {
      method: 'POST',
      headers: {
        'Ocp-Apim-Subscription-Key': kunci(),
        'Content-Type': 'application/ssml+xml',
        'X-Microsoft-OutputFormat': 'riff-24khz-16bit-mono-pcm',
        'User-Agent': 'animantra-studio',
      },
      body: ssml,
    });
    if (r.status === 429 || r.status >= 500) {
      // F0 membatasi jumlah permintaan per menit → tunggu sebentar
      await new Promise((s) => setTimeout(s, 3000 * 2 ** coba));
      continue;
    }
    if (!r.ok) {
      const t = await r.text();
      if (r.status === 401) throw new Error('Azure Speech 401: AZURE_SPEECH_KEY atau AZURE_SPEECH_REGION salah');
      if (r.status === 403) throw new Error('Azure Speech 403: kuota bulanan habis atau langganan nonaktif');
      throw new Error(`Azure Speech ${r.status}: ${t.slice(0, 200)}`);
    }
    const data = Buffer.from(await r.arrayBuffer());
    // header WAV 44 byte; 24000 sampel/dtk × 2 byte
    const durasi = Math.max(0, data.length - 44) / 2 / 24000;
    return { data, ext: 'wav', durasi };
  }
  throw new Error('Azure Speech: terlalu banyak permintaan, coba lagi sebentar');
}
