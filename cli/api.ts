import { URL_STUDIO } from '../server/jalur';

export async function api<T = any>(jalur: string, body?: unknown, metode?: string): Promise<{ status: number; data: T }> {
  const r = await fetch(URL_STUDIO + jalur, {
    method: metode ?? (body === undefined ? 'GET' : 'POST'),
    headers: body === undefined ? undefined : { 'content-type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const teks = await r.text();
  let data: any = null;
  try {
    data = teks ? JSON.parse(teks) : null;
  } catch {
    data = teks;
  }
  return { status: r.status, data };
}

export async function studioJalan() {
  try {
    return (await api('/api/status')).status === 200;
  } catch {
    return false;
  }
}

/** Lapor progres; keluar dengan kode 3 bila job dibatalkan pengguna. */
export async function lapor(job: string, isi: { tahap?: string; status?: string; log?: string; persen?: number | null }) {
  try {
    const r = await api('/api/claude/progress', { job, ...isi });
    if (r.status === 409) {
      console.error('\n⛔ ' + r.data?.galat);
      process.exit(3);
    }
    if (r.status >= 400) console.error('Peringatan progres:', r.data?.galat ?? r.status);
  } catch {
    console.error('Peringatan: studio tidak bisa dihubungi (progres tidak tampil). Jalankan `node studio.mjs server`.');
  }
}
