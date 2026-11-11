// VoiceStudio lokal (self-hosted, OpenAI-compatible) — suara kloning, mis. suara Bos.
// KEAMANAN: port 3900 TIDAK BOLEH dibuka ke internet. API key hanya boleh lewat
// jaringan lokal: terowongan SSH atau Tailscale dari VM studio ke VM VoiceStudio,
// sehingga dari studio alamatnya terlihat lokal (mis. http://127.0.0.1:3900).
// Kalau VM VoiceStudio mati / terowongan putus, pipeline otomatis pindah ke Edge
// (rantai cadangan di cli/tts.ts).
// CATATAN KECEPATAN (diukur 2026-11-11): sintesis di VM 4 vCPU lambat — klip ~3 dtk
// butuh ~33 dtk, adegan ~7 dtk bisa ~60-70 dtk. Jadi timeout sengaja longgar
// (120 dtk); kalau terowongan benar-benar mati, koneksi langsung ditolak
// (gagal cepat) dan baru pindah ke Edge — timeout panjang hanya terasa bila
// server menerima tapi tidak menjawab.
const dasar = () => (process.env.VOICESTUDIO_URL || '').replace(/\/$/, '');
const kunci = () => process.env.VOICESTUDIO_API_KEY || '';
export const voicestudioSiap = () => !!dasar() && !!kunci();
/** Voice ID utama (mis. suara Bos) untuk job baru bila tidak diisi eksplisit. */
export const suaraUtamaVoiceStudio = () => process.env.VOICESTUDIO_VOICE || '';

export type SuaraVoiceStudio = { id: string; nama: string; ket: string };

let cache: { waktu: number; data: SuaraVoiceStudio[] } | null = null;
/** Semua suara di VoiceStudio (profil kloning didahulukan, lalu alias OpenAI). */
export async function daftarSuaraVoiceStudio(): Promise<SuaraVoiceStudio[]> {
  if (!voicestudioSiap()) return [];
  if (cache && Date.now() - cache.waktu < 60 * 60_000) return cache.data;
  try {
    const r = await fetch(`${dasar()}/v1/audio/voices`, {
      headers: { Authorization: `Bearer ${kunci()}` },
      signal: AbortSignal.timeout(15_000),
    });
    if (!r.ok) throw new Error(String(r.status));
    const j: any = await r.json();
    const daftar: any[] = Array.isArray(j?.voices) ? j.voices : Array.isArray(j) ? j : [];
    const data = daftar
      .map((v) => ({
        id: String(v.voice_id || v.id || ''),
        nama: String(v.name || v.voice_id || v.id || ''),
        ket: v.type === 'profile' ? 'Suara kloning' : 'Alias OpenAI',
        profil: v.type === 'profile',
      }))
      .filter((v) => v.id)
      .sort((a, b) => Number(b.profil) - Number(a.profil))
      .map(({ id, nama, ket }) => ({ id, nama, ket }));
    cache = { waktu: Date.now(), data };
  } catch {
    cache = { waktu: Date.now(), data: [] };
  }
  return cache.data;
}

const tidur = (ms: number) => new Promise((s) => setTimeout(s, ms));

/** Durasi WAV PCM dari header (cari chunk "data" supaya tahan header non-standar). */
function durasiWav(buf: Buffer): number {
  const rate = buf.length >= 28 ? buf.readUInt32LE(24) || 24000 : 24000;
  let dataLen = buf.length > 44 ? buf.length - 44 : 0;
  for (let i = 12; i + 8 <= buf.length; i++) {
    if (buf.toString('ascii', i, i + 4) === 'data') {
      dataLen = buf.readUInt32LE(i + 4);
      break;
    }
  }
  return dataLen / 2 / rate;
}

/** TTS → WAV PCM mono. Timeout 120 dtk per percobaan (sintesis CPU lambat, lihat atas); maks 2 percobaan. */
export async function ttsVoiceStudio(teks: string, suara: string) {
  const url = `${dasar()}/v1/audio/speech`;
  for (let coba = 0; coba < 2; coba++) {
    try {
      const r = await fetch(url, {
        method: 'POST',
        headers: { 'content-type': 'application/json', Authorization: `Bearer ${kunci()}` },
        body: JSON.stringify({
          model: process.env.VOICESTUDIO_MODEL || 'tts-1',
          voice: suara,
          input: teks,
          response_format: 'wav',
        }),
        signal: AbortSignal.timeout(120_000),
      });
      if (r.status === 429 || r.status >= 500) {
        if (coba === 0) {
          await tidur(2000);
          continue;
        }
        throw new Error(`VoiceStudio ${r.status}: server sibuk`);
      }
      if (!r.ok) {
        const t = await r.text();
        if (r.status === 401) throw new Error('VoiceStudio 401: VOICESTUDIO_API_KEY salah');
        if (r.status === 404) throw new Error('VoiceStudio 404: voice tidak ditemukan atau VOICESTUDIO_URL salah');
        throw new Error(`VoiceStudio ${r.status}: ${t.slice(0, 200)}`);
      }
      const data = Buffer.from(await r.arrayBuffer());
      if (data.length < 44) throw new Error('VoiceStudio tidak mengembalikan audio');
      return { data, durasi: durasiWav(data) };
    } catch (e) {
      const m = (e as Error)?.message || '';
      if (coba === 0 && !/401|404/.test(m)) {
        await tidur(1000);
        continue; // galat jaringan / timeout (terowongan putus, VM mati): coba sekali lagi
      }
      throw e;
    }
  }
  throw new Error('VoiceStudio tidak terjangkau');
}
