// Suara neural Microsoft lewat layanan Read Aloud Edge (library msedge-tts) — TANPA API key.
// PERHATIAN: ini bukan API resmi. Bisa berubah/diblokir Microsoft sewaktu-waktu dan hanya untuk
// pemakaian pribadi. Untuk SaaS/komersial pakai Azure Speech resmi (suara sama: Gadis & Ardi).
import { MsEdgeTTS, OUTPUT_FORMAT } from 'msedge-tts';
import type { Agent } from 'node:http';

/** Matikan dengan EDGE_TTS=0 di .env */
export const edgeSiap = () => process.env.EDGE_TTS !== '0';

export const SUARA_EDGE = [
  { id: 'id-ID-GadisNeural', nama: 'Gadis', ket: 'Perempuan, Indonesia' },
  { id: 'id-ID-ArdiNeural', nama: 'Ardi', ket: 'Laki-laki, Indonesia' },
];

let agen: Agent | undefined | null = null;
async function agenProxy() {
  // di sesi cloud lalu lintas keluar lewat proxy; di komputer biasa tidak perlu
  if (agen !== null) return agen;
  const proxy = process.env.HTTPS_PROXY || process.env.https_proxy;
  agen = proxy ? new (await import('https-proxy-agent')).HttpsProxyAgent(proxy) : undefined;
  return agen;
}

const xml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export type HasilEdge = { mp3: Buffer; durasi: number; kata: { t: string; a: number; b: number }[] };

async function sekali(teks: string, suara: string): Promise<HasilEdge> {
  const tts = new MsEdgeTTS({ agent: await agenProxy(), connectionTimeoutMs: 15_000, synthesisTimeoutMs: 45_000 });
  try {
    await tts.setMetadata(suara, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3, { wordBoundaryEnabled: true });
    const { audioStream, metadataStream } = tts.toStream(xml(teks), { rate: process.env.EDGE_TTS_RATE || '+5%' });
    const potongan: Buffer[] = [];
    const kata: HasilEdge['kata'] = [];
    await Promise.all([
      new Promise<void>((ok, gagal) => {
        audioStream.on('data', (c: Buffer) => potongan.push(c));
        audioStream.once('close', () => ok());
        audioStream.once('error', gagal);
      }),
      new Promise<void>((ok) => {
        if (!metadataStream) return ok();
        metadataStream.on('data', (c: Buffer) => {
          try {
            for (const m of JSON.parse(c.toString()).Metadata ?? []) {
              if (m.Type !== 'WordBoundary') continue;
              const a = m.Data.Offset / 1e7; // satuan 100 ns → detik
              kata.push({ t: m.Data.text?.Text ?? '', a: +a.toFixed(3), b: +(a + m.Data.Duration / 1e7).toFixed(3) });
            }
          } catch {}
        });
        metadataStream.once('close', () => ok());
        metadataStream.once('error', () => ok());
      }),
    ]);
    const mp3 = Buffer.concat(potongan);
    if (!mp3.length) throw new Error('Edge TTS tidak mengembalikan audio');
    // MP3 48 kbps CBR → durasi dari ukuran; jaga-jaga pakai akhir kata terakhir
    const durasi = Math.max((mp3.length * 8) / 48_000, kata.length ? kata[kata.length - 1].b + 0.15 : 0);
    return { mp3, durasi, kata };
  } finally {
    tts.close();
  }
}

export async function ttsEdge(teks: string, suara: string): Promise<HasilEdge> {
  let galat: unknown;
  for (let coba = 0; coba < 3; coba++) {
    try {
      return await sekali(teks, suara);
    } catch (e) {
      galat = e;
      await new Promise((s) => setTimeout(s, 1500 * 2 ** coba));
    }
  }
  throw new Error(`Edge TTS gagal (layanan tidak resmi, mungkin sedang diblokir/berubah): ${(galat as Error)?.message ?? galat}`);
}
