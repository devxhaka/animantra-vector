import fs from 'node:fs';
import path from 'node:path';
import { DIR, bacaJson, tulisJson } from './jalur';
import { TAHAP, type FormBaru, type Gaya, type Job, type Karakter, type KunciTahap, type Spec, type VideoMeta } from '../shared/tipe';
import { AGENT_MORGAN, KARAKTER_CONTOH } from '../shared/karakter-bawaan';
import { GAYA_BAWAAN, GAYA_MYSTERY, GAYA_PRESET_BARU, GAYA_SINEMATIK } from '../shared/gaya-bawaan';
import { formatBertokoh, formatDari } from '../shared/formats';

const sekarang = () => new Date().toISOString();
const idBaru = (awalan: string) => awalan + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);

export function slugify(s: string) {
  return (
    s
      .toLowerCase()
      .normalize('NFKD')
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .split(/\s+/)
      .slice(0, 6)
      .join('-')
      .slice(0, 48) || 'video'
  );
}

/**
 * Tulis data bawaan SEKALI: kalau sudah pernah di-seed (ada penanda) atau berkasnya sudah ada,
 * tidak ditimpa. Jadi gaya/tokoh yang diubah atau dihapus pengguna tidak muncul kembali.
 */
function benihSekali(penanda: string, file: string, data: unknown) {
  if (fs.existsSync(penanda)) return;
  if (!fs.existsSync(file)) tulisJson(file, data);
  fs.writeFileSync(penanda, '');
}

// ---------------- Gaya ----------------
const fileGaya = (id: string) => path.join(DIR.gaya, `${id}.json`);
const filePengaturan = path.join(DIR.data, 'pengaturan.json');

export function daftarGaya(): Gaya[] {
  if (!fs.existsSync(fileGaya('bawaan'))) tulisJson(fileGaya('bawaan'), GAYA_BAWAAN);
  benihSekali(path.join(DIR.gaya, '.seed-mystery-files'), fileGaya(GAYA_MYSTERY.id), GAYA_MYSTERY);
  benihSekali(path.join(DIR.gaya, '.seed-sinematik'), fileGaya(GAYA_SINEMATIK.id), GAYA_SINEMATIK);
  for (const gp of GAYA_PRESET_BARU) benihSekali(path.join(DIR.gaya, `.seed-${gp.id}`), fileGaya(gp.id), gp);
  return fs
    .readdirSync(DIR.gaya)
    .filter((f) => f.endsWith('.json'))
    .map((f) => bacaJson<Gaya | null>(path.join(DIR.gaya, f), null))
    .filter((g): g is Gaya => !!g?.id)
    .sort((a, b) => (a.id === 'bawaan' ? -1 : b.id === 'bawaan' ? 1 : a.nama.localeCompare(b.nama)));
}
/** Opsi "APA PILIHANMU?" di akhir sebuah video (seri interaktif), atau null. */
export function opsiPilihan(slug: string): string[] | null {
  const sp = bacaJson<Spec | null>(path.join(dirVideo(slug), 'spec.json'), null);
  return [...(sp?.adegan ?? [])].reverse().find((a) => a.pilihan?.opsi?.length)?.pilihan?.opsi ?? null;
}

export const ambilGaya = (id: string) => daftarGaya().find((g) => g.id === id) ?? null;
export function gayaAktifId(): string {
  const id = bacaJson<{ gayaAktif?: string }>(filePengaturan, {}).gayaAktif;
  return id && fs.existsSync(fileGaya(id)) ? id : 'bawaan';
}
export const setGayaAktif = (id: string) => tulisJson(filePengaturan, { ...bacaJson(filePengaturan, {}), gayaAktif: id });
export function simpanGaya(g: Gaya): Gaya {
  if (!g.id || g.id === 'baru') g.id = idBaru('g');
  tulisJson(fileGaya(g.id), g);
  return g;
}
export function hapusGaya(id: string) {
  if (id === 'bawaan') throw new Error('Gaya bawaan tidak bisa dihapus');
  const g = ambilGaya(id);
  if (g?.logo?.file) fs.rmSync(path.join(DIR.gaya, g.logo.file), { force: true });
  fs.rmSync(fileGaya(id), { force: true });
  if (gayaAktifId() === id) setGayaAktif('bawaan');
}

// ---------------- Karakter ----------------
const fileKarakter = (id: string) => path.join(DIR.karakter, `${id}.json`);
export function daftarKarakter(): Karakter[] {
  const ada = fs.readdirSync(DIR.karakter).filter((f) => f.endsWith('.json'));
  if (!ada.length && !fs.existsSync(path.join(DIR.karakter, '.awal'))) {
    // pertama kali: isi dengan contoh Kakak & Adik
    for (const k of KARAKTER_CONTOH) tulisJson(fileKarakter(k.id), k);
    fs.writeFileSync(path.join(DIR.karakter, '.awal'), '');
  }
  benihSekali(path.join(DIR.karakter, '.seed-morgan'), fileKarakter(AGENT_MORGAN.id), AGENT_MORGAN);
  return fs
    .readdirSync(DIR.karakter)
    .filter((f) => f.endsWith('.json'))
    .map((f) => bacaJson<Karakter | null>(path.join(DIR.karakter, f), null))
    .filter((k): k is Karakter => !!k?.id)
    .sort((a, b) => a.nama.localeCompare(b.nama));
}
export function simpanKarakter(k: Karakter, idLama?: string): Karakter {
  k.id = slugify(k.id || k.nama).replace(/-/g, '').slice(0, 20) || 'tokoh';
  if (idLama && idLama !== k.id) fs.rmSync(fileKarakter(idLama), { force: true });
  tulisJson(fileKarakter(k.id), k);
  return k;
}
export const hapusKarakter = (id: string) => fs.rmSync(fileKarakter(id), { force: true });

// ---------------- Video ----------------
export const dirVideo = (slug: string) => path.join(DIR.videos, slug);

export function metaVideo(slug: string): VideoMeta | null {
  const d = dirVideo(slug);
  const m = bacaJson<VideoMeta | null>(path.join(d, 'meta.json'), null);
  if (!m) return null;
  const ada = (f: string) => fs.existsSync(path.join(d, f));
  const cuplikan = fs.existsSync(path.join(d, 'cuplikan')) ? fs.readdirSync(path.join(d, 'cuplikan')).filter((f) => f.endsWith('.jpg')).length : 0;
  const pes = bacaJson<{ lanjutan?: { slug?: string; pilihanPenonton?: string | null } | null } | null>(path.join(d, 'pesanan.json'), null);
  const sp = bacaJson<Spec | null>(path.join(d, 'spec.json'), null);
  const seri = {
    lanjutan: pes?.lanjutan?.slug ?? null,
    episode: sp?.episode ?? null,
    nama: sp?.seri ?? null,
    opsi: [...(sp?.adegan ?? [])].reverse().find((a) => a.pilihan?.opsi?.length)?.pilihan?.opsi ?? null,
    pilihanPenonton: pes?.lanjutan?.pilihanPenonton ?? null,
  };
  return { ...m, ada: { video: ada('final.mp4'), cover: ada('cover.jpg'), caption: ada('caption.txt'), cuplikan }, seri };
}
export function daftarVideo(): VideoMeta[] {
  return fs
    .readdirSync(DIR.videos, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => metaVideo(e.name))
    .filter((m): m is VideoMeta => !!m && m.versi > 0)
    .sort((a, b) => b.diperbarui.localeCompare(a.diperbarui));
}

// ---------------- Job ----------------
const fileJob = (id: string) => path.join(DIR.jobs, `${id}.json`);
export const ambilJob = (id: string) => bacaJson<Job | null>(fileJob(id), null);
export const simpanJob = (j: Job) => {
  j.diperbarui = sekarang();
  tulisJson(fileJob(j.id), j);
  return j;
};
export function daftarJob(): Job[] {
  return fs
    .readdirSync(DIR.jobs)
    .filter((f) => f.endsWith('.json'))
    .map((f) => bacaJson<Job | null>(path.join(DIR.jobs, f), null))
    .filter((j): j is Job => !!j)
    .sort((a, b) => a.dibuat.localeCompare(b.dibuat));
}
const tahapKosong = () => Object.fromEntries(TAHAP.map((t) => [t.kunci, 'belum'])) as Job['tahap'];

export function buatJob(jenis: Job['jenis'], form: FormBaru, opsi: { slug?: string; judul?: string; revisi?: string } = {}): Job {
  const id = idBaru('j');
  const j: Job = {
    id,
    jenis,
    status: 'antre',
    dibuat: sekarang(),
    diperbarui: sekarang(),
    slug: opsi.slug ?? `${slugify(form.topik)}-${id.slice(-4)}`,
    judul: opsi.judul ?? form.topik,
    form,
    revisi: opsi.revisi,
    tahap: tahapKosong(),
    tahapAktif: null,
    persen: null,
    log: [{ waktu: sekarang(), teks: jenis === 'revisi' ? `Revisi diminta: ${opsi.revisi}` : 'Masuk antrean, menunggu Claude' }],
  };
  return simpanJob(j);
}

export function tambahLog(j: Job, teks: string) {
  j.log.push({ waktu: sekarang(), teks });
  if (j.log.length > 300) j.log = j.log.slice(-300);
}

export function aturTahap(j: Job, tahap: KunciTahap, status: 'mulai' | 'selesai' | 'lewati', persen?: number | null) {
  if (status === 'mulai') {
    j.tahap[tahap] = 'jalan';
    j.tahapAktif = tahap;
    j.persen = persen ?? null;
  } else if (status === 'selesai') {
    j.tahap[tahap] = 'selesai';
    if (j.tahapAktif === tahap) j.persen = null;
  } else j.tahap[tahap] = 'lewati';
  if (persen != null && status !== 'selesai') j.persen = persen;
}

/** Saat Claude mengambil job: siapkan folder video & pesanan.json */
export function siapkanFolder(j: Job) {
  const d = dirVideo(j.slug);
  fs.mkdirSync(path.join(d, 'aset'), { recursive: true });
  const gaya = ambilGaya(j.form.gayaId) ?? ambilGaya(gayaAktifId()) ?? GAYA_BAWAAN;
  let logo: string | null = null;
  if (gaya.logo?.file && fs.existsSync(path.join(DIR.gaya, gaya.logo.file))) {
    logo = 'logo' + path.extname(gaya.logo.file);
    fs.copyFileSync(path.join(DIR.gaya, gaya.logo.file), path.join(d, logo));
  }
  if (j.jenis === 'baru') {
    const meta: VideoMeta = {
      slug: j.slug,
      judul: j.form.topik,
      format: j.form.format,
      topik: j.form.topik,
      durasi: 0,
      dibuat: sekarang(),
      diperbarui: sekarang(),
      versi: 0,
      ada: { video: false, cover: false, caption: false, cuplikan: 0 },
    };
    if (!fs.existsSync(path.join(d, 'meta.json'))) tulisJson(path.join(d, 'meta.json'), meta);
  } else if (j.jenis === 'revisi') {
    const spec = path.join(d, 'spec.json');
    if (fs.existsSync(spec)) {
      const v = metaVideo(j.slug)?.versi ?? 1;
      fs.mkdirSync(path.join(d, 'riwayat'), { recursive: true });
      fs.copyFileSync(spec, path.join(d, 'riwayat', `spec-v${v}.json`));
    }
  }
  const fmt = formatDari(j.form.format);
  // format Cerita: snapshot pemeran + ringkasan episode sebelumnya
  const semuaKarakter = daftarKarakter();
  const pemeran = (j.form.pemeran ?? []).map((id) => semuaKarakter.find((k) => k.id === id)).filter(Boolean) as Karakter[];
  let lanjutan: unknown = null;
  if (j.form.lanjutan) {
    const sp = bacaJson<Spec | null>(path.join(dirVideo(j.form.lanjutan), 'spec.json'), null);
    if (sp)
      lanjutan = {
        slug: j.form.lanjutan,
        judul: sp.judul,
        folder: `videos/${j.form.lanjutan}`,
        naskah: sp.adegan.map((a) => `${a.pembicara ?? 'narasi'}: ${a.narasi}`),
        // seri interaktif: nomor episode lalu, opsi di akhir episode lalu, dan pilihan penonton (dari komentar)
        episode: sp.episode ?? null,
        opsi: [...sp.adegan].reverse().find((a) => a.pilihan?.opsi?.length)?.pilihan?.opsi ?? null,
        pilihanPenonton: j.form.pilihanPenonton ?? null,
      };
  }
  const latarPustaka = fs.existsSync(path.join(DIR.perpustakaan, 'latar')) ? fs.readdirSync(path.join(DIR.perpustakaan, 'latar')).filter((f) => f.endsWith('.svg')).map((f) => `perpustakaan/latar/${f}`) : [];
  const pesanan = {
    job: j.id,
    jenis: j.jenis,
    folder: path.relative(process.cwd(), d) || d,
    format: { kunci: fmt.kunci, nama: fmt.nama, seri: gaya.seri || fmt.seri, panduan: fmt.panduan },
    topik: j.form.topik,
    durasiTarget: j.form.durasi,
    suara: j.form.suara,
    musik: j.form.musik,
    revisi: j.revisi ?? null,
    // job diulang setelah gagal: lanjutkan dari tahap pertama yang belum selesai, pakai berkas yang sudah ada
    ulangan: j.ulangan ?? 0,
    tahapSelesai: Object.entries(j.tahap).filter(([, v]) => v === 'selesai').map(([k]) => k),
    gaya,
    logo,
    ...(formatBertokoh(fmt.kunci) || pemeran.length
      ? { pemeran, sudut: j.form.sudut ?? 'dialog', nuansa: j.form.nuansa ?? '', lanjutan, latarPustaka }
      : {}),
  };
  tulisJson(path.join(d, 'pesanan.json'), pesanan);
  return pesanan;
}

export function tandaiVideoSelesai(slug: string) {
  const d = dirVideo(slug);
  const m = bacaJson<VideoMeta | null>(path.join(d, 'meta.json'), null);
  const spec = bacaJson<Spec | null>(path.join(d, 'spec.json'), null);
  if (!m) return;
  if (spec) {
    m.judul = spec.judul || m.judul;
    m.durasi = Math.round(spec.adegan.reduce((s, a) => s + a.durasi, 0));
  }
  m.versi = (m.versi ?? 0) + 1;
  m.diperbarui = sekarang();
  tulisJson(path.join(d, 'meta.json'), m);
}
