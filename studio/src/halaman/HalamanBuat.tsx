import React from 'react';
import { api, suaraBisaDipakai, useOpsi, type Opsi } from '../api';
import type { Gaya, Karakter, VideoMeta } from '../../../shared/tipe';
import { formatBertokoh, formatDari, formatMisteri } from '../../../shared/formats';
import { PilihSuara } from '../komponen/PilihSuara';
import { KepalaHalaman } from '../komponen/KartuVideo';
import { Ikon } from '../komponen/Ikon';
import { useData } from '../data';
import { pergi } from '../rute';

type Form = {
  format: string;
  topik: string;
  durasi: number;
  suara: string;
  musik: string;
  gayaId: string;
  pemeran: string[];
  sudut: string;
  nuansa: string;
  lanjutan: string;
  pilihanPenonton: string;
};
const AWAL: Form = { format: 'kita-bongkar', topik: '', durasi: 50, suara: '', musik: 'otomatis', gayaId: '', pemeran: [], sudut: 'dialog', nuansa: '', lanjutan: '', pilihanPenonton: '' };
const KUNCI_DRAF = 'draf-buat-video';

const NUANSA = [
  ['', 'Otomatis (sesuai topik)'],
  ['tegang lalu menenangkan', 'Tegang lalu menenangkan'],
  ['hangat dan menyentuh', 'Hangat & menyentuh'],
  ['lucu dan ringan', 'Lucu & ringan'],
  ['misterius', 'Misterius'],
  ['khidmat dan religius', 'Khidmat & religius'],
  ['petualangan', 'Petualangan'],
];
const SUDUT = [
  ['dialog', 'Dialog antar tokoh'],
  ['pov', 'POV: penonton/tokoh pertama sebagai "aku/kamu"'],
  ['narator', 'Narator + dialog'],
];
const CONTOH_TOPIK: Record<string, string> = {
  'kita-bongkar': 'kenapa setrika bisa mati sendiri saat sudah panas',
  cerita: 'kakak menenangkan adik yang takut gelap saat mati lampu',
  'mystery-story': 'misteri kapal hantu Mary Celeste',
  'pov-bayangkan': 'bayangkan kamu dan adikmu terjebak banjir besar di malam hari',
};
const durasiSaran = (f: string) => (formatMisteri(f) ? [30, 60] : f === 'pov-bayangkan' ? [60, 120] : formatBertokoh(f) ? [60, 180] : [30, 60]);

function bacaDraf(): Form | null {
  try {
    const d = JSON.parse(localStorage.getItem(KUNCI_DRAF) ?? 'null');
    return d && typeof d === 'object' ? { ...AWAL, ...d } : null;
  } catch {
    return null;
  }
}

export function HalamanBuat({ lanjutDari }: { lanjutDari?: string }) {
  const opsi = useOpsi();
  const { status, muatJobs } = useData();
  const [form, setForm] = React.useState<Form>(() => (lanjutDari ? { ...AWAL } : bacaDraf() ?? AWAL));
  const [langkah, setLangkah] = React.useState(0);
  const [gaya, setGaya] = React.useState<{ daftar: Gaya[]; aktif: string } | null>(null);
  const [karakter, setKarakter] = React.useState<Karakter[]>([]);
  const [episode, setEpisode] = React.useState<VideoMeta[]>([]);
  const [opsiLalu, setOpsiLalu] = React.useState<string[] | null>(null);
  const [kirim, setKirim] = React.useState<'diam' | 'kirim'>('diam');
  const [galat, setGalat] = React.useState('');
  const cerita = formatBertokoh(form.format);
  const atur = <K extends keyof Form>(k: K, v: Form[K]) => setForm((f) => ({ ...f, [k]: v }));

  // simpan draf (kecuali saat melanjutkan episode dari halaman Seri)
  React.useEffect(() => {
    if (lanjutDari) return;
    try {
      localStorage.setItem(KUNCI_DRAF, JSON.stringify(form));
    } catch {}
  }, [form, lanjutDari]);

  // "Buat episode berikutnya": isi otomatis dari pesanan episode sebelumnya
  React.useEffect(() => {
    if (!lanjutDari) return;
    api.video(lanjutDari).then((d) => {
      const p = d.pesanan ?? {};
      setForm((f) => ({
        ...f,
        format: d.meta.format,
        lanjutan: lanjutDari,
        pemeran: (p.pemeran ?? []).map((x: { id: string }) => x.id),
        sudut: p.sudut ?? f.sudut,
        nuansa: p.nuansa ?? f.nuansa,
        durasi: p.durasiTarget ?? f.durasi,
        musik: p.musik ?? f.musik,
        gayaId: p.gaya?.id ?? f.gayaId,
        suara: p.suara ?? f.suara,
      }));
      setLangkah(1);
    });
  }, [lanjutDari]);

  React.useEffect(() => {
    setOpsiLalu(null);
    if (!form.lanjutan) return;
    let batal = false;
    api.video(form.lanjutan).then((d) => !batal && setOpsiLalu(d.pilihan ?? null)).catch(() => undefined);
    return () => {
      batal = true;
    };
  }, [form.lanjutan]);

  React.useEffect(() => {
    if (!cerita) return;
    api.karakter().then((d) => {
      setKarakter(d);
      setForm((f) => {
        if (f.pemeran.length) return f;
        if (formatMisteri(f.format)) {
          const morgan = d.find((k) => k.id === 'morgan');
          return { ...f, pemeran: morgan ? [morgan.id] : d.slice(0, 1).map((k) => k.id), durasi: Math.min(Math.max(f.durasi, 30), 60) };
        }
        return { ...f, pemeran: d.filter((k) => k.id !== 'morgan').slice(0, 2).map((k) => k.id), durasi: Math.max(f.durasi, 60) };
      });
    });
    api.videos().then((v) => setEpisode(v.filter((x) => x.format === form.format)));
  }, [cerita, form.format]);

  React.useEffect(() => {
    if (!opsi) return;
    const semua = suaraBisaDipakai(opsi);
    setForm((f) => {
      if (f.suara && semua.includes(f.suara)) return f;
      let simpan = '';
      try {
        simpan = localStorage.getItem('suara') ?? '';
      } catch {}
      const pilih = semua.includes(simpan) ? simpan : semua[0];
      return pilih ? { ...f, suara: pilih } : f;
    });
  }, [opsi]);
  React.useEffect(() => {
    api.gaya().then((g) => {
      setGaya(g);
      setForm((f) => (f.gayaId && g.daftar.some((x) => x.id === f.gayaId) ? f : { ...f, gayaId: f.format === 'pov-bayangkan' && g.daftar.some((x) => x.id === 'sinematik') ? 'sinematik' : g.aktif }));
    });
  }, []);

  const LANGKAH = [
    { kunci: 'format', label: 'Format' },
    { kunci: 'cerita', label: 'Cerita' },
    ...(cerita ? [{ kunci: 'pemeran', label: 'Pemeran & seri' }] : []),
    { kunci: 'suara', label: 'Suara & musik' },
    { kunci: 'gaya', label: 'Gaya' },
    { kunci: 'ringkasan', label: 'Ringkasan' },
  ];
  const kini = LANGKAH[Math.min(langkah, LANGKAH.length - 1)].kunci;
  const kurang = (k: string) => (k === 'cerita' && !form.topik.trim() ? 'Tulis topiknya dulu.' : k === 'pemeran' && cerita && !form.pemeran.length ? 'Pilih minimal satu pemeran.' : '');
  const masalah = LANGKAH.map((l) => kurang(l.kunci)).find(Boolean) ?? '';
  const fmt = formatDari(form.format);
  const [dMin, dMaks] = durasiSaran(form.format);

  const maju = () => {
    const k = kurang(kini);
    if (k) return setGalat(k);
    setGalat('');
    setLangkah((x) => Math.min(LANGKAH.length - 1, x + 1));
  };
  const buat = async () => {
    if (masalah) return setGalat(masalah);
    setGalat('');
    setKirim('kirim');
    try {
      await api.buat({ ...form, lanjutan: form.lanjutan || null, pilihanPenonton: (form.lanjutan && form.pilihanPenonton.trim()) || null });
      try {
        localStorage.removeItem(KUNCI_DRAF);
      } catch {}
      muatJobs();
      pergi('beranda');
    } catch (e) {
      setGalat((e as Error).message);
      setKirim('diam');
    }
  };

  const gayaPilih = gaya?.daftar.find((g) => g.id === form.gayaId);
  const pemeranPilih = karakter.filter((k) => form.pemeran.includes(k.id));
  const namaSuara = (v: string) => opsi?.grupSuara.flatMap((g) => g.suara).find((s) => s.nilai === v)?.nama ?? (v || 'Tanpa suara');

  return (
    <div className="halaman">
      <KepalaHalaman judul={lanjutDari ? 'Episode berikutnya' : 'Buat video'} ket="Isi langkah demi langkah. Draf tersimpan otomatis.">
        {!lanjutDari ? (
          <button className="tombol" onClick={() => (setForm({ ...AWAL, suara: form.suara, gayaId: gaya?.aktif ?? '' }), setLangkah(0))}>
            Mulai ulang
          </button>
        ) : null}
      </KepalaHalaman>

      <div className="wizard">
        <ol className="langkah-daftar">
          {LANGKAH.map((l, i) => (
            <li key={l.kunci}>
              <button className={(i === langkah ? 'aktif' : '') + (i < langkah ? ' lewat' : '')} onClick={() => (setGalat(''), setLangkah(i))}>
                <span className="nomor">{i < langkah ? <Ikon nama="centang" ukuran={14} /> : i + 1}</span>
                {l.label}
              </button>
            </li>
          ))}
        </ol>

        <div className="panel langkah-isi">
          {kini === 'format' ? (
            <>
              <h2>Mau bikin video jenis apa?</h2>
              <div className="grid-format lebar">
                {(opsi?.formats ?? []).map((f) => (
                  <button
                    key={f.kunci}
                    className={'kartu-format' + (form.format === f.kunci ? ' pilih' : '')}
                    onClick={() => setForm((x) => ({ ...x, format: f.kunci, pemeran: x.format === f.kunci ? x.pemeran : [], lanjutan: x.format === f.kunci ? x.lanjutan : '' }))}
                  >
                    <b>{f.nama}</b>
                    <span>{f.deskripsi}</span>
                    {formatBertokoh(f.kunci) ? <em>Bertokoh</em> : null}
                  </button>
                ))}
              </div>
            </>
          ) : null}

          {kini === 'cerita' ? (
            <>
              <h2>{fmt.nama}: ceritanya tentang apa?</h2>
              <label className="label" htmlFor="topik">
                Topik
              </label>
              <textarea id="topik" className="isian" rows={4} autoFocus placeholder={CONTOH_TOPIK[form.format] ?? CONTOH_TOPIK['kita-bongkar']} value={form.topik} onChange={(e) => atur('topik', e.target.value)} />
              <p className="petunjuk">{fmt.panduan.split('. ')[0]}.</p>
              <label className="label">
                Durasi: <b>{form.durasi} detik</b> <span className="redup kecil">(disarankan {dMin}–{dMaks} dtk)</span>
              </label>
              <input type="range" min={20} max={cerita ? 180 : 90} step={5} value={form.durasi} onChange={(e) => atur('durasi', Number(e.target.value))} />
              {cerita ? (
                <div className="dua-kolom">
                  <div>
                    <label className="label">Sudut cerita</label>
                    <select className="isian" value={form.sudut} onChange={(e) => atur('sudut', e.target.value)}>
                      {SUDUT.map(([v, t]) => (
                        <option key={v} value={v}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="label">Nuansa</label>
                    <select className="isian" value={form.nuansa} onChange={(e) => atur('nuansa', e.target.value)}>
                      {NUANSA.map(([v, t]) => (
                        <option key={v} value={v}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              ) : null}
            </>
          ) : null}

          {kini === 'pemeran' ? (
            <>
              <h2>Siapa saja pemerannya?</h2>
              <div className="grid-pemeran">
                {karakter.map((k) => {
                  const ikut = form.pemeran.includes(k.id);
                  return (
                    <button key={k.id} className={'kartu-pemeran' + (ikut ? ' pilih' : '')} onClick={() => atur('pemeran', ikut ? form.pemeran.filter((x) => x !== k.id) : [...form.pemeran, k.id])}>
                      <span className="swatch">
                        <i style={{ background: k.warna.kulit }} />
                        <i style={{ background: k.warna.atasan }} />
                        <i style={{ background: k.warna.penutup }} />
                      </span>
                      <b>{k.nama}</b>
                      <span className="redup kecil">{k.peran}</span>
                      {ikut ? <span className="centang-pojok"><Ikon nama="centang" ukuran={14} /></span> : null}
                    </button>
                  );
                })}
                {!karakter.length ? <p className="redup">Belum ada tokoh. Buat dulu di halaman Karakter.</p> : null}
              </div>

              <h3 className="sub-judul">Seri</h3>
              <select className="isian" value={form.lanjutan} onChange={(e) => setForm((f) => ({ ...f, lanjutan: e.target.value, pilihanPenonton: '' }))}>
                <option value="">Cerita baru (episode 1 / tunggal)</option>
                {episode.map((v) => (
                  <option key={v.slug} value={v.slug}>
                    Lanjutan dari: {v.judul}
                  </option>
                ))}
              </select>
              {form.lanjutan ? (
                <div className="kotak-pilihan">
                  <label className="label">Pilihan penonton (dari komentar)</label>
                  {opsiLalu?.length ? (
                    <div className="pilih-opsi">
                      {opsiLalu.map((o) => (
                        <button key={o} type="button" className={'tombol kecil' + (form.pilihanPenonton === o ? ' aktif' : '')} onClick={() => atur('pilihanPenonton', form.pilihanPenonton === o ? '' : o)}>
                          {o}
                        </button>
                      ))}
                    </div>
                  ) : null}
                  <input
                    className="isian"
                    placeholder={opsiLalu?.length ? 'atau tulis pilihan lain…' : 'Kosongkan bila episode lalu tanpa pilihan'}
                    value={form.pilihanPenonton}
                    onChange={(e) => atur('pilihanPenonton', e.target.value)}
                  />
                  <p className="petunjuk">Claude membuka episode ini dengan menjalankan pilihan tersebut, lalu menunjukkan akibatnya.</p>
                </div>
              ) : null}
            </>
          ) : null}

          {kini === 'suara' ? (
            <>
              <h2>Suara & musik</h2>
              <label className="label">{cerita ? 'Suara narator' : 'Suara'}</label>
              <PilihSuara
                opsi={opsi}
                nilai={form.suara}
                onUbah={(v) => {
                  atur('suara', v);
                  try {
                    localStorage.setItem('suara', v);
                  } catch {}
                }}
              />
              {cerita ? <PeringatanSuara karakter={pemeranPilih} narator={form.sudut === 'narator' ? form.suara : ''} /> : null}
              {opsi && !opsi.grupSuara.length ? (
                <p className="catatan">
                  Suara nonaktif: suara Edge dimatikan (<code>EDGE_TTS=0</code>) dan belum ada <code>AZURE_SPEECH_KEY</code>, <code>ELEVENLABS_API_KEY</code>, atau <code>GEMINI_API_KEY</code> di <code>.env</code>. Tanpa itu video dibuat tanpa narasi suara.
                </p>
              ) : null}
              {opsi?.kreditEleven && form.suara.startsWith('elevenlabs:') ? <KreditEleven k={opsi.kreditEleven} durasi={form.durasi} /> : null}
              {opsi?.kreditEleven?.gratis && opsi.grupSuara.some((g) => g.penyedia === 'elevenlabs-berbayar') ? (
                <p className="catatan">Akun ElevenLabs gratis hanya bisa memakai suara <b>bawaan</b>. Suara dari Voice Library dinonaktifkan di daftar.</p>
              ) : null}
              <label className="label jarak">Musik</label>
              <select className="isian" value={form.musik} onChange={(e) => atur('musik', e.target.value)}>
                <option value="otomatis">Otomatis (dipilih sesuai suasana)</option>
                <option value="tanpa">Tanpa musik</option>
                {(opsi?.musik ?? []).map((m) => (
                  <option key={m} value={m}>
                    {m.replace(/\.[^.]+$/, '')}
                  </option>
                ))}
              </select>
              {opsi && !opsi.musik.length ? <p className="catatan">Folder <code>musik/</code> masih kosong. Taruh MP3 bebas royalti di sana agar bisa dipilih.</p> : null}
            </>
          ) : null}

          {kini === 'gaya' ? (
            <>
              <h2>Pilih gaya tampilan</h2>
              <div className="grid-gaya">
                {(gaya?.daftar ?? []).map((g) => (
                  <button key={g.id} className={'kartu-gaya' + (form.gayaId === g.id ? ' pilih' : '')} onClick={() => atur('gayaId', g.id)}>
                    <div className="contoh-gaya" style={{ background: `linear-gradient(180deg, ${g.warna.latar} 60%, ${g.warna.lantai} 60%)` }}>
                      <span className="badge-contoh" style={{ background: g.warna.merek }}>
                        {g.seri || 'SERI'}
                      </span>
                      <span className="sub-contoh" style={{ color: g.teks?.warna ?? g.warna.teks }}>
                        Contoh <span style={{ color: g.teks?.warnaSorot ?? g.warna.sorot }}>subtitle</span>
                      </span>
                    </div>
                    <b>{g.nama}</b>
                    {g.id === gaya?.aktif ? <span className="tag-aktif">aktif</span> : null}
                  </button>
                ))}
              </div>
              <p className="petunjuk">Ubah warna, huruf, dan subtitle di halaman Gaya.</p>
            </>
          ) : null}

          {kini === 'ringkasan' ? (
            <>
              <h2>Cek dulu sebelum dikirim</h2>
              <dl className="ringkasan">
                {[
                  ['Format', fmt.nama, 0],
                  ['Topik', form.topik || '— belum diisi —', 1],
                  ['Durasi', `${form.durasi} detik`, 1],
                  ...(cerita
                    ? ([
                        ['Pemeran', pemeranPilih.map((k) => k.nama).join(', ') || '— belum dipilih —', 2],
                        ['Seri', form.lanjutan ? `Lanjutan${form.pilihanPenonton ? ` · pilihan penonton: ${form.pilihanPenonton}` : ''}` : 'Cerita baru', 2],
                      ] as const)
                    : []),
                  ['Suara', namaSuara(form.suara), cerita ? 3 : 2],
                  ['Musik', form.musik === 'otomatis' ? 'Otomatis' : form.musik === 'tanpa' ? 'Tanpa musik' : form.musik, cerita ? 3 : 2],
                  ['Gaya', gayaPilih?.nama ?? '—', cerita ? 4 : 3],
                ].map(([k, v, i]) => (
                  <div key={k as string}>
                    <dt>{k}</dt>
                    <dd>{v}</dd>
                    <button className="tautan" onClick={() => setLangkah(i as number)}>
                      Ubah
                    </button>
                  </div>
                ))}
              </dl>
              {status && !status.terhubung ? (
                <p className="catatan">Agen belum terhubung. Pesanan tetap masuk antrean dan dikerjakan saat agen tersambung (atau pakai Salin prompt di Beranda).</p>
              ) : null}
            </>
          ) : null}

          {galat ? <p className="galat">{galat}</p> : null}
          <div className="kaki-wizard">
            <button className="tombol" onClick={() => (setGalat(''), setLangkah((x) => Math.max(0, x - 1)))} disabled={langkah === 0}>
              <Ikon nama="kembali" ukuran={16} /> Kembali
            </button>
            {kini === 'ringkasan' ? (
              <button className="tombol utama besar" onClick={buat} disabled={kirim === 'kirim' || !!masalah}>
                {kirim === 'kirim' ? 'Mengirim…' : 'Kirim ke agen'} <Ikon nama="petir" ukuran={16} />
              </button>
            ) : (
              <button className="tombol utama" onClick={maju}>
                Lanjut <Ikon nama="kanan" ukuran={16} />
              </button>
            )}
          </div>
        </div>

        <aside className="panel ringkas-samping">
          <div className="eyebrow">Pesanan</div>
          <b>{fmt.nama}</b>
          <p className="redup kecil">{form.topik || 'Topik belum diisi'}</p>
          <ul>
            <li>{form.durasi} detik</li>
            {cerita ? <li>{pemeranPilih.map((k) => k.nama).join(', ') || 'Pemeran belum dipilih'}</li> : null}
            {form.lanjutan ? <li>Episode lanjutan{form.pilihanPenonton ? ` · ${form.pilihanPenonton}` : ''}</li> : null}
            <li>{namaSuara(form.suara)}</li>
            <li>{gayaPilih?.nama ?? '—'}</li>
          </ul>
        </aside>
      </div>
    </div>
  );
}

function PeringatanSuara({ karakter, narator }: { karakter: Karakter[]; narator: string }) {
  const peran = [...karakter.map((k) => ({ nama: k.nama, suara: k.suara })), ...(narator ? [{ nama: 'Narator', suara: narator }] : [])];
  const kembar: string[] = [];
  peran.forEach((a, i) => peran.slice(i + 1).forEach((b) => a.suara === b.suara && kembar.push(`${a.nama} & ${b.nama}`)));
  if (!kembar.length) return null;
  return (
    <p className="catatan">
      Suara sama: <b>{kembar.join(', ')}</b>. Penonton bisa sulit membedakan siapa yang bicara. Ganti suara di halaman Karakter
      {narator ? ' atau pilih suara narator lain' : ''}. Azure hanya punya 2 suara Indonesia (Gadis & Ardi); ElevenLabs/Gemini bisa jadi suara ketiga.
    </p>
  );
}

function KreditEleven({ k, durasi }: { k: NonNullable<Opsi['kreditEleven']>; durasi: number }) {
  const butuh = Math.ceil(durasi * 15 * k.faktor); // ±15 karakter per detik narasi bahasa Indonesia
  const cukup = Math.floor(k.sisa / Math.max(1, butuh));
  const reset = k.reset ? new Date(k.reset).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }) : null;
  return (
    <p className={'catatan' + (cukup < 1 ? ' kurang' : '')}>
      Kredit ElevenLabs: <b>{k.sisa.toLocaleString('id-ID')}</b> / {k.batas.toLocaleString('id-ID')} karakter
      {reset ? ` (pulih ${reset})` : ''}. Cukup untuk ±{cukup} video {durasi} detik.
      {cukup < 1 ? ' Kredit tidak cukup: suara akan memakai Gemini kalau key-nya ada.' : ''}
    </p>
  );
}
