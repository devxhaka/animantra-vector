// Klien ElevenLabs kecil (tanpa SDK): daftar suara, sisa kredit, dan TTS dengan timing.
const API = process.env.ELEVENLABS_API_BASE || 'https://api.elevenlabs.io/v1';
const kunci = () => process.env.ELEVENLABS_API_KEY || '';
export const elevenSiap = () => !!kunci();
export const modelEleven = () => process.env.ELEVENLABS_MODEL || 'eleven_multilingual_v2';

/** Suara premade ElevenLabs (cadangan bila daftar dari API gagal dimuat). Semua multibahasa. */
export const SUARA_ELEVEN_BAWAAN = [
  { id: 'EXAVITQu4vr4xnSDxMaL', nama: 'Sarah', ket: 'Perempuan, lembut' },
  { id: 'cgSgspJ2msm6clMCkdW9', nama: 'Jessica', ket: 'Perempuan, ceria' },
  { id: 'XrExE9yKIg1WjnnlVkGX', nama: 'Matilda', ket: 'Perempuan, hangat' },
  { id: 'TX3LPaxmHKxFdv7VOQHJ', nama: 'Liam', ket: 'Laki-laki, muda' },
  { id: 'nPczCjzI2devNBz1zQrb', nama: 'Brian', ket: 'Laki-laki, dalam' },
  { id: 'JBFqnCBsd6RMkjVDRZzb', nama: 'George', ket: 'Laki-laki, bercerita' },
];

async function minta(jalur: string, init?: RequestInit) {
  const r = await fetch(API + jalur, { ...init, headers: { 'xi-api-key': kunci(), 'content-type': 'application/json', ...(init?.headers ?? {}) } });
  if (!r.ok) {
    const t = await r.text();
    let pesan = t.slice(0, 300);
    try {
      const j = JSON.parse(t);
      pesan = j?.detail?.message ?? j?.detail?.status ?? (typeof j?.detail === 'string' ? j.detail : pesan);
    } catch {}
    const e = new Error(`ElevenLabs ${r.status}: ${pesan}`) as Error & { status: number; kuota: boolean };
    e.status = r.status;
    e.kuota = r.status === 429 || /quota|credit|limit/i.test(t);
    throw e;
  }
  return r.json();
}

export type SuaraEleven = { id: string; nama: string; ket: string; premade: boolean; indonesia: boolean; bisa: boolean };

let cacheSuara: { waktu: number; data: SuaraEleven[] } | null = null;
let cacheKredit: { waktu: number; data: Kredit | null } | null = null;
type Kredit = { sisa: number; batas: number; reset: string | null; tier: string; gratis: boolean };

/**
 * Suara yang ada di akun (premade + "My Voices"). Akun gratis hanya bisa memakai suara premade
 * lewat API, jadi suara Voice Library ditandai `bisa: false`.
 */
export async function daftarSuaraEleven(): Promise<SuaraEleven[]> {
  if (!elevenSiap()) return [];
  if (cacheSuara && Date.now() - cacheSuara.waktu < 5 * 60_000) return cacheSuara.data;
  const kredit = await sisaKreditEleven();
  const gratis = kredit?.gratis ?? false;
  try {
    const j: any = await minta('/voices');
    const data: SuaraEleven[] = (j.voices ?? []).map((v: any) => {
      const premade = v.category === 'premade';
      const bahasa = [v.labels?.language, v.labels?.accent, ...(v.verified_languages ?? []).flatMap((x: any) => [x.language, x.accent, x.locale])]
        .filter(Boolean)
        .map((x: string) => String(x).toLowerCase());
      const indonesia = bahasa.some((b) => b === 'id' || b.startsWith('id-') || b.includes('indonesia'));
      const gender = v.labels?.gender === 'female' ? 'Perempuan' : v.labels?.gender === 'male' ? 'Laki-laki' : '';
      return { id: v.voice_id, nama: v.name, ket: [gender, premade ? 'bawaan' : 'library'].filter(Boolean).join(', '), premade, indonesia, bisa: !gratis || premade };
    });
    data.sort((a, b) => Number(b.bisa) - Number(a.bisa) || Number(b.indonesia) - Number(a.indonesia) || a.nama.localeCompare(b.nama));
    cacheSuara = { waktu: Date.now(), data };
    return data;
  } catch {
    return SUARA_ELEVEN_BAWAAN.map((v) => ({ ...v, premade: true, indonesia: false, bisa: true }));
  }
}

/** Sisa kredit karakter bulan ini + jenis paket. null bila tidak bisa dicek. */
export async function sisaKreditEleven(segar = false): Promise<Kredit | null> {
  if (!elevenSiap()) return null;
  if (!segar && cacheKredit && Date.now() - cacheKredit.waktu < 60_000) return cacheKredit.data;
  let data: Kredit | null = null;
  try {
    const j: any = await minta('/user/subscription');
    const tier = String(j.tier ?? '');
    data = {
      sisa: Math.max(0, (j.character_limit ?? 0) - (j.character_count ?? 0)),
      batas: j.character_limit ?? 0,
      reset: j.next_character_count_reset_unix ? new Date(j.next_character_count_reset_unix * 1000).toISOString() : null,
      tier,
      gratis: tier === 'free' || tier === '',
    };
  } catch {}
  cacheKredit = { waktu: Date.now(), data };
  return data;
}

/** Apakah voice ID ini suara premade (aman untuk akun gratis)? */
export async function infoSuaraEleven(id: string) {
  return (await daftarSuaraEleven()).find((v) => v.id === id) ?? null;
}

/** Galat karena suara tidak boleh dipakai paket ini (bukan karena kuota). */
export const galatIzinSuara = (m: string) => /library|free (users|tier|plan)|paid|subscription|not (allowed|permitted)|upgrade|voice_not_found|missing_permissions/i.test(m) && !/quota|exceed/i.test(m);

/** Model flash/turbo memakai ±setengah kredit per karakter. */
export const faktorKredit = (model = modelEleven()) => (/flash|turbo/.test(model) ? 0.5 : 1);

export async function ttsEleven(teks: string, voiceId: string, konteks: { sebelum?: string; sesudah?: string } = {}) {
  const model = modelEleven();
  const body: Record<string, unknown> = {
    text: teks,
    model_id: model,
    voice_settings: { stability: 0.45, similarity_boost: 0.8, style: 0.25, use_speaker_boost: true },
  };
  // konteks kalimat sebelum/sesudah → intonasi antar adegan tetap nyambung
  if (konteks.sebelum) body.previous_text = konteks.sebelum;
  if (konteks.sesudah) body.next_text = konteks.sesudah;
  if (/flash|turbo/.test(model)) body.language_code = 'id';
  for (let coba = 0; coba < 4; coba++) {
    try {
      const j: any = await minta(`/text-to-speech/${voiceId}/with-timestamps?output_format=mp3_44100_128`, { method: 'POST', body: JSON.stringify(body) });
      const akhir: number[] = j.alignment?.character_end_times_seconds ?? j.normalized_alignment?.character_end_times_seconds ?? [];
      const mulai: number[] = j.alignment?.character_start_times_seconds ?? [];
      const huruf: string[] = j.alignment?.characters ?? [];
      return { mp3: Buffer.from(j.audio_base64, 'base64'), durasi: akhir.length ? akhir[akhir.length - 1] : null, timing: { huruf, mulai, akhir } };
    } catch (e: any) {
      // 429 karena terlalu banyak permintaan bersamaan → tunggu; kuota habis → lempar
      if (e.status === 429 && !/quota/i.test(e.message) && coba < 3) {
        await new Promise((s) => setTimeout(s, 2000 * 2 ** coba));
        continue;
      }
      throw e;
    }
  }
  throw new Error('ElevenLabs: gagal setelah beberapa percobaan');
}
