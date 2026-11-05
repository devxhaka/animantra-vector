import React from 'react';
import { api, suaraBisaDipakai, tanggal, usePolling, useOpsi, type Opsi } from '../api';
import type { Gaya, Job, Karakter, VideoMeta } from '../../../shared/tipe';
import { formatDari } from '../../../shared/formats';
import { KartuProgres } from '../komponen/KartuProgres';
import { ModalVideo } from '../komponen/ModalVideo';
import { PilihSuara } from '../komponen/PilihSuara';

export function HalamanVideo({ terhubung }: { terhubung: boolean }) {
  const [videos, muatVideo] = usePolling(api.videos, 6000);
  const [jobs, muatJobs] = usePolling(api.jobs, 1500);
  const [cari, setCari] = React.useState('');
  const [buka, setBuka] = React.useState<string | null>(null);

  // muat ulang riwayat saat job berpindah dari aktif → selesai
  const aktifSebelum = React.useRef<string>('');
  React.useEffect(() => {
    const kunci = (jobs ?? []).map((j) => j.id + j.status).join();
    if (aktifSebelum.current && kunci !== aktifSebelum.current) muatVideo();
    aktifSebelum.current = kunci;
  }, [jobs, muatVideo]);

  const q = cari.trim().toLowerCase();
  const tampil = (videos ?? []).filter((v) => !q || v.judul.toLowerCase().includes(q) || v.topik.toLowerCase().includes(q));
  const jobPanel = (jobs ?? []).filter((j) => j.jenis !== 'render-ulang' || j.status !== 'selesai');

  return (
    <main className="tata">
      <FormBaru terhubung={terhubung} onDibuat={muatJobs} />
      <section className="kanan">
        {jobPanel.length ? (
          <>
            <h2 className="judul-bagian">Sedang dikerjakan</h2>
            <div className="daftar-progres">
              {jobPanel.map((j) => (
                <KartuProgres key={j.id} job={j} terhubung={terhubung} onBerubah={muatJobs} />
              ))}
            </div>
          </>
        ) : null}
        <div className="baris-riwayat">
          <h2 className="judul-bagian">Riwayat video</h2>
          <input className="cari" placeholder="Cari judul atau topik" value={cari} onChange={(e) => setCari(e.target.value)} />
        </div>
        {videos == null ? (
          <p className="kosong">Memuat…</p>
        ) : tampil.length === 0 ? (
          <div className="kosong">
            {q ? 'Tidak ada video yang cocok.' : 'Belum ada video. Pilih format di kiri, tulis topik, lalu klik "Buat Video Baru".'}
          </div>
        ) : (
          <div className="grid-video">
            {tampil.map((v) => (
              <KartuVideo key={v.slug} v={v} sibuk={(jobs ?? []).some((j) => j.slug === v.slug && (j.status === 'antre' || j.status === 'dikerjakan'))} onKlik={() => setBuka(v.slug)} />
            ))}
          </div>
        )}
      </section>
      {buka ? <ModalVideo slug={buka} jobs={jobs ?? []} onTutup={() => setBuka(null)} onBerubah={() => (muatJobs(), muatVideo())} /> : null}
    </main>
  );
}

function KartuVideo({ v, onKlik, sibuk }: { v: VideoMeta; onKlik: () => void; sibuk: boolean }) {
  const f = formatDari(v.format);
  return (
    <button className="kartu-video" onClick={onKlik}>
      <div className="sampul">
        {v.ada.cover ? <img src={`/media/${v.slug}/cover.jpg?v=${v.diperbarui}`} alt="" loading="lazy" /> : <div className="sampul-kosong">Belum ada sampul</div>}
        {sibuk ? <span className="lencana-sibuk">Direvisi…</span> : null}
      </div>
      <div className="info">
        <div className="judul">{v.judul}</div>
        <div className="meta">
          {f.nama.toUpperCase()} · {v.durasi} dtk · {tanggal(v.diperbarui)}
        </div>
      </div>
    </button>
  );
}

// ---------------------------------------------------------------------------

function FormBaru({ terhubung, onDibuat }: { terhubung: boolean; onDibuat: () => void }) {
  const opsi = useOpsi();
  const [gaya, setGaya] = React.useState<{ daftar: Gaya[]; aktif: string } | null>(null);
  const [form, setForm] = React.useState({
    format: 'kita-bongkar',
    topik: '',
    durasi: 50,
    suara: '',
    musik: 'otomatis',
    gayaId: '',
    pemeran: [] as string[],
    sudut: 'dialog',
    nuansa: '',
    lanjutan: '',
  });
  const [karakter, setKarakter] = React.useState<Karakter[]>([]);
  const [episode, setEpisode] = React.useState<VideoMeta[]>([]);
  const cerita = form.format === 'cerita';
  React.useEffect(() => {
    if (!cerita) return;
    api.karakter().then((d) => {
      setKarakter(d);
      setForm((f) => (f.pemeran.length ? f : { ...f, pemeran: d.slice(0, 2).map((k) => k.id), durasi: Math.max(f.durasi, 90) }));
    });
    api.videos().then((v) => setEpisode(v.filter((x) => x.format === 'cerita')));
  }, [cerita]);
  const [kirim, setKirim] = React.useState<'diam' | 'kirim' | 'ok'>('diam');
  const [galat, setGalat] = React.useState('');

  React.useEffect(() => {
    if (!opsi) return;
    // pilih suara yang bisa dipakai; pertahankan pilihan tersimpan kalau masih valid
    const semua = suaraBisaDipakai(opsi);
    let simpan = '';
    try {
      simpan = localStorage.getItem('suara') ?? '';
    } catch {}
    const pilih = semua.includes(simpan) ? simpan : semua[0];
    if (pilih) setForm((f) => ({ ...f, suara: pilih }));
  }, [opsi]);
  React.useEffect(() => {
    api.gaya().then((g) => {
      setGaya(g);
      setForm((f) => ({ ...f, gayaId: g.aktif }));
    });
  }, []);
  const atur = (k: keyof typeof form, v: string | number) => setForm((f) => ({ ...f, [k]: v }));

  const buat = async () => {
    setGalat('');
    if (!form.topik.trim()) return setGalat('Tulis topiknya dulu.');
    if (cerita && !form.pemeran.length) return setGalat('Pilih minimal satu pemeran.');
    setKirim('kirim');
    try {
      await api.buat({ ...form, lanjutan: form.lanjutan || null });
      setForm((f) => ({ ...f, topik: '' }));
      setKirim('ok');
      onDibuat();
      setTimeout(() => setKirim('diam'), 2500);
    } catch (e) {
      setGalat((e as Error).message);
      setKirim('diam');
    }
  };

  return (
    <aside className="panel kiri">
      <h2 className="judul-panel">Video baru</h2>
      <div className="label">Format</div>
      <div className="grid-format">
        {(opsi?.formats ?? []).map((f) => (
          <button key={f.kunci} className={'kartu-format' + (form.format === f.kunci ? ' pilih' : '')} onClick={() => atur('format', f.kunci)}>
            <b>{f.nama}</b>
            <span>{f.deskripsi}</span>
          </button>
        ))}
      </div>

      <label className="label" htmlFor="topik">
        Topik
      </label>
      <textarea
        id="topik"
        className="isian"
        rows={3}
        placeholder="kenapa setrika bisa mati sendiri saat sudah panas"
        value={form.topik}
        onChange={(e) => atur('topik', e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) buat();
        }}
      />

      {cerita ? (
        <>
          <div className="label">Pemeran</div>
          <div className="pemeran-baris">
            {karakter.map((k) => {
              const ikut = form.pemeran.includes(k.id);
              return (
                <button
                  key={k.id}
                  className={'chip' + (ikut ? ' pilih' : '')}
                  onClick={() => setForm((f) => ({ ...f, pemeran: ikut ? f.pemeran.filter((x) => x !== k.id) : [...f.pemeran, k.id] }))}
                >
                  {ikut ? '✓ ' : ''}
                  {k.nama}
                </button>
              );
            })}
            {!karakter.length ? <span className="redup kecil">Belum ada tokoh. Buat di tab Karakter.</span> : null}
          </div>
          <label className="label">Sudut cerita</label>
          <select className="isian" value={form.sudut} onChange={(e) => atur('sudut', e.target.value)}>
            <option value="dialog">Dialog antar tokoh</option>
            <option value="pov">POV: tokoh pertama bercerita sebagai "aku"</option>
            <option value="narator">Dengan narator + dialog</option>
          </select>
          <label className="label">Nuansa</label>
          <select className="isian" value={form.nuansa} onChange={(e) => atur('nuansa', e.target.value)}>
            <option value="">Otomatis (sesuai topik)</option>
            <option value="tegang lalu menenangkan">Tegang lalu menenangkan</option>
            <option value="hangat dan menyentuh">Hangat & menyentuh</option>
            <option value="lucu dan ringan">Lucu & ringan</option>
            <option value="misterius">Misterius</option>
            <option value="khidmat dan religius">Khidmat & religius</option>
            <option value="petualangan">Petualangan</option>
          </select>
          <label className="label">Episode</label>
          <select className="isian" value={form.lanjutan} onChange={(e) => atur('lanjutan', e.target.value)}>
            <option value="">Cerita baru</option>
            {episode.map((v) => (
              <option key={v.slug} value={v.slug}>
                Lanjutan dari: {v.judul}
              </option>
            ))}
          </select>
        </>
      ) : null}

      <label className="label">
        Durasi: <b>{form.durasi} detik</b>
      </label>
      <input type="range" min={20} max={cerita ? 180 : 90} step={5} value={form.durasi} onChange={(e) => atur('durasi', Number(e.target.value))} />

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
      <label className="label">Musik</label>
      <select className="isian" value={form.musik} onChange={(e) => atur('musik', e.target.value)}>
        <option value="otomatis">Otomatis</option>
        <option value="tanpa">Tanpa musik</option>
        {(opsi?.musik ?? []).map((m) => (
          <option key={m} value={m}>
            {m.replace(/\.[^.]+$/, '')}
          </option>
        ))}
      </select>

      <label className="label">Gaya tampilan</label>
      <select className="isian" value={form.gayaId} onChange={(e) => atur('gayaId', e.target.value)}>
        {(gaya?.daftar ?? []).map((g) => (
          <option key={g.id} value={g.id}>
            {g.nama}
            {g.id === gaya?.aktif ? ' (aktif)' : ''}
          </option>
        ))}
      </select>

      {cerita ? <PeringatanSuara karakter={karakter.filter((k) => form.pemeran.includes(k.id))} narator={form.sudut === 'narator' ? form.suara : ''} /> : null}
      {opsi && !opsi.grupSuara.length ? (
        <p className="catatan">
          Suara nonaktif: suara Edge dimatikan (<code>EDGE_TTS=0</code>) dan belum ada <code>AZURE_SPEECH_KEY</code>, <code>ELEVENLABS_API_KEY</code>, atau <code>GEMINI_API_KEY</code> di <code>.env</code>. Tanpa itu video dibuat tanpa narasi suara.
        </p>
      ) : null}
      {opsi?.kreditEleven && form.suara.startsWith('elevenlabs:') ? <KreditEleven k={opsi.kreditEleven} durasi={form.durasi} /> : null}
      {opsi?.kreditEleven?.gratis && opsi.grupSuara.some((g) => g.penyedia === 'elevenlabs-berbayar') ? (
        <p className="catatan">Akun ElevenLabs gratis hanya bisa memakai suara <b>bawaan</b>. Suara dari Voice Library dinonaktifkan di daftar.</p>
      ) : null}
      {opsi && !opsi.musik.length ? <p className="catatan">Folder <code>musik/</code> masih kosong. Taruh MP3 bebas royalti di sana agar bisa dipilih.</p> : null}

      <button className="tombol utama penuh" onClick={buat} disabled={kirim === 'kirim'}>
        {kirim === 'kirim' ? 'Mengirim…' : kirim === 'ok' ? 'Terkirim ke Claude ✓' : 'Buat Video Baru'}
      </button>
      {galat ? <p className="galat">{galat}</p> : null}
      {!terhubung ? (
        <p className="catatan">
          Claude belum terhubung. Pesanan tetap masuk antrean. Buka Claude (tab Code) di folder <b>animantra-vector</b> lalu ketik <b>buka studio</b>.
        </p>
      ) : null}
    </aside>
  );
}

function PeringatanSuara({ karakter, narator }: { karakter: Karakter[]; narator: string }) {
  const peran = [...karakter.map((k) => ({ nama: k.nama, suara: k.suara })), ...(narator ? [{ nama: 'Narator', suara: narator }] : [])];
  const kembar: string[] = [];
  peran.forEach((a, i) => peran.slice(i + 1).forEach((b) => a.suara === b.suara && kembar.push(`${a.nama} & ${b.nama}`)));
  if (!kembar.length) return null;
  return (
    <p className="catatan">
      Suara sama: <b>{kembar.join(', ')}</b>. Penonton bisa sulit membedakan siapa yang bicara. Ganti suara di tab Karakter
      {narator ? ' atau pilih suara narator lain' : ''}. Azure hanya punya 2 suara Indonesia (Gadis & Ardi); ElevenLabs/Gemini bisa jadi suara ketiga.
    </p>
  );
}

function KreditEleven({ k, durasi }: { k: NonNullable<Opsi['kreditEleven']>; durasi: number }) {
  // ±15 karakter per detik narasi bahasa Indonesia
  const butuh = Math.ceil(durasi * 15 * k.faktor);
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

export type { Job };
