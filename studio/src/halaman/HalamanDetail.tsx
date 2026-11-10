import React from 'react';
import { api, tanggal, type DetailVideo } from '../api';
import { TAHAP } from '../../../shared/tipe';
import { formatDari } from '../../../shared/formats';
import { useData } from '../data';
import { Ikon } from '../komponen/Ikon';
import { pergi } from '../rute';

const CONTOH_REVISI = ['Musiknya kurang nendang', 'Subtitlenya kebesaran', 'Kamera terlalu dekat', 'Terlalu cepat, tambah jeda', 'Ganti suara narator'];

/** Pecah caption.txt menjadi bagian (=== JUDUL ===) supaya tiap bagian bisa disalin sendiri. */
function bagianCaption(teks: string) {
  const out: { judul: string; isi: string }[] = [];
  for (const blok of teks.split(/^===\s*(.+?)\s*===\s*$/m).slice(1).reduce<string[][]>((a, x, i) => (i % 2 ? (a[a.length - 1].push(x), a) : [...a, [x]]), [])) {
    const [judul, isi = ''] = blok;
    if (isi.trim()) out.push({ judul: judul.trim(), isi: isi.trim() });
  }
  return out.length ? out : teks.trim() ? [{ judul: 'Caption', isi: teks.trim() }] : [];
}

function TombolSalin({ teks, label = 'Salin' }: { teks: string; label?: string }) {
  const [ok, setOk] = React.useState(false);
  return (
    <button
      className="tombol kecil"
      onClick={() => {
        navigator.clipboard.writeText(teks);
        setOk(true);
        setTimeout(() => setOk(false), 1600);
      }}
    >
      <Ikon nama={ok ? 'centang' : 'salin'} ukuran={15} /> {ok ? 'Tersalin' : label}
    </button>
  );
}

export function HalamanDetail({ slug }: { slug: string }) {
  const { videos, jobAktif, muatJobs, muatVideo } = useData();
  const [d, setD] = React.useState<DetailVideo | null>(null);
  const [galatMuat, setGalatMuat] = React.useState('');
  const [revisi, setRevisi] = React.useState('');
  const [pesan, setPesan] = React.useState('');
  const jobVideo = jobAktif(slug);
  const muat = React.useCallback(() => api.video(slug).then(setD).catch((e) => setGalatMuat(e.message)), [slug]);
  React.useEffect(() => {
    setD(null);
    muat();
  }, [muat]);
  // muat ulang ketika pekerjaan untuk video ini selesai
  const lalu = React.useRef('');
  React.useEffect(() => {
    const k = jobVideo?.id ?? '';
    if (lalu.current && !k) muat();
    lalu.current = k;
  }, [jobVideo, muat]);

  if (galatMuat) return <div className="halaman"><div className="kosong">{galatMuat}</div></div>;
  if (!d) return <div className="halaman"><p className="kosong">Memuat…</p></div>;
  const m = d.meta;
  const fmt = formatDari(m.format);
  const p = d.pesanan ?? {};
  const v = encodeURIComponent(m.diperbarui);
  const seriNama = m.seri?.nama || p.format?.seri || fmt.seri;
  const sebelum = m.seri?.lanjutan ? videos?.find((x) => x.slug === m.seri!.lanjutan) : undefined;
  const sesudah = videos?.filter((x) => x.seri?.lanjutan === slug) ?? [];
  const bertokoh = !!p.pemeran?.length;

  const kirimRevisi = async () => {
    if (!revisi.trim()) return;
    try {
      await api.revisi(slug, revisi);
      setRevisi('');
      setPesan('Revisi terkirim. Progresnya tampil di bawah dan di Beranda.');
      muatJobs();
    } catch (e) {
      setPesan((e as Error).message);
    }
  };

  return (
    <div className="halaman">
      <button className="tautan kembali" onClick={() => (history.length > 1 ? history.back() : pergi('riwayat'))}>
        <Ikon nama="kembali" ukuran={16} /> Kembali
      </button>
      <div className="detail">
        <div className="detail-video">
          <div className="pemutar">
            {m.ada.video ? (
              <video key={v} src={`/media/${slug}/final.mp4?v=${v}`} poster={m.ada.cover ? `/media/${slug}/cover.jpg?v=${v}` : undefined} controls playsInline />
            ) : (
              <div className="sampul-kosong">Video belum dirender</div>
            )}
          </div>
          <div className="baris-tombol">
            <a className="tombol utama" href={`/api/videos/${slug}/unduh`} download>
              <Ikon nama="unduh" ukuran={16} /> Unduh video
            </a>
            <button
              className="tombol"
              disabled={!!jobVideo}
              onClick={() => api.renderUlang(slug).then(() => (setPesan('Render ulang dimulai.'), muatJobs(), muatVideo())).catch((e) => setPesan(e.message))}
            >
              <Ikon nama="ulang" ukuran={16} /> Render ulang
            </button>
            <button className="tombol" onClick={() => api.finder(slug)} title="Buka folder video di komputer">
              {navigator.platform.toLowerCase().includes('win') ? 'Explorer' : 'Finder'}
            </button>
          </div>
        </div>

        <div className="detail-isi">
          <div className="eyebrow">{seriNama}{m.seri?.episode ? ` · EPISODE ${m.seri.episode}` : ''}</div>
          <h1 className="detail-judul">{m.judul}</h1>
          <div className="chip-info">
            <span>{fmt.nama}</span>
            <span>{m.durasi} detik</span>
            <span>{tanggal(m.diperbarui)}</span>
            {m.versi > 1 ? <span>versi {m.versi}</span> : null}
          </div>

          {jobVideo ? (
            <div className="info-job">
              {jobVideo.jenis === 'revisi' ? 'Revisi' : jobVideo.jenis === 'render-ulang' ? 'Render ulang' : 'Pengerjaan'} {jobVideo.status === 'antre' ? 'menunggu agen' : 'sedang berjalan'}
              {jobVideo.tahapAktif ? ` · ${TAHAP.find((t) => t.kunci === jobVideo.tahapAktif)?.label}` : ''}
              {jobVideo.persen != null ? ` ${jobVideo.persen}%` : ''}
            </div>
          ) : null}

          {m.seri && (sebelum || sesudah.length || m.seri.opsi?.length || m.seri.pilihanPenonton) ? (
            <section className="kartu-bagian">
              <h3>Seri</h3>
              {m.seri.pilihanPenonton ? <p className="kecil">Episode ini menjalankan pilihan penonton: <b>{m.seri.pilihanPenonton}</b></p> : null}
              {m.seri.opsi?.length ? <p className="kecil">Pilihan di akhir episode: {m.seri.opsi.map((o) => <span key={o} className="pil-opsi">{o}</span>)}</p> : null}
              <div className="baris-tombol">
                {sebelum ? (
                  <button className="tombol kecil" onClick={() => pergi('video', sebelum.slug)}>
                    <Ikon nama="kembali" ukuran={14} /> Episode sebelumnya
                  </button>
                ) : null}
                {sesudah.map((s) => (
                  <button key={s.slug} className="tombol kecil" onClick={() => pergi('video', s.slug)}>
                    Episode berikutnya <Ikon nama="kanan" ukuran={14} />
                  </button>
                ))}
                {!sesudah.length && bertokoh ? (
                  <button className="tombol kecil utama" onClick={() => pergi('buat', 'lanjut', slug)}>
                    Buat episode berikutnya <Ikon nama="kanan" ukuran={14} />
                  </button>
                ) : null}
              </div>
            </section>
          ) : bertokoh ? (
            <div className="baris-tombol">
              <button className="tombol kecil" onClick={() => pergi('buat', 'lanjut', slug)}>
                Jadikan seri: buat episode berikutnya <Ikon nama="kanan" ukuran={14} />
              </button>
            </div>
          ) : null}

          <section className="kartu-bagian">
            <h3>Revisi</h3>
            <div className="chip-baris">
              {CONTOH_REVISI.map((c) => (
                <button key={c} className="chip tambah" disabled={!!jobVideo} onClick={() => setRevisi((r) => (r ? r + ', ' : '') + c.toLowerCase())}>
                  {c}
                </button>
              ))}
            </div>
            <textarea className="isian" rows={3} placeholder="Tulis apa yang ingin diubah…" value={revisi} onChange={(e) => setRevisi(e.target.value)} disabled={!!jobVideo} />
            <div className="baris-tombol">
              <button className="tombol utama" onClick={kirimRevisi} disabled={!revisi.trim() || !!jobVideo}>
                <Ikon nama="pensil" ukuran={16} /> Kirim revisi
              </button>
              {pesan ? <span className="redup kecil">{pesan}</span> : null}
            </div>
          </section>

          <section className="kartu-bagian">
            <div className="kepala-bagian">
              <h3>Caption</h3>
              {d.caption ? <TombolSalin teks={d.caption} label="Salin semua" /> : null}
            </div>
            {bagianCaption(d.caption).map((b) => (
              <div key={b.judul} className="bagian-caption">
                <div className="kepala-bagian">
                  <span className="eyebrow-kecil">{b.judul}</span>
                  <TombolSalin teks={b.isi} />
                </div>
                <pre className="caption">{b.isi}</pre>
              </div>
            ))}
            {!d.caption ? <p className="redup kecil">Belum ada caption.</p> : null}
          </section>

          {d.cuplikan.length ? (
            <section className="kartu-bagian">
              <h3>Cuplikan</h3>
              <div className="cuplikan">
                {d.cuplikan.map((c) => (
                  <img key={c} src={`/media/${slug}/cuplikan/${c}?v=${v}`} alt="" />
                ))}
              </div>
            </section>
          ) : null}

          <section className="kartu-bagian">
            <h3>Info pesanan</h3>
            <dl className="ringkasan kecil-dl">
              <div>
                <dt>Topik</dt>
                <dd>{m.topik}</dd>
              </div>
              <div>
                <dt>Gaya</dt>
                <dd>{p.gaya?.nama ?? '—'}</dd>
              </div>
              {bertokoh ? (
                <div>
                  <dt>Pemeran</dt>
                  <dd>{p.pemeran.map((x: { nama: string }) => x.nama).join(', ')}</dd>
                </div>
              ) : null}
              <div>
                <dt>Suara</dt>
                <dd>{p.suara ?? '—'}</dd>
              </div>
              <div>
                <dt>Folder</dt>
                <dd className="mono">videos/{slug}</dd>
              </div>
            </dl>
          </section>
        </div>
      </div>
    </div>
  );
}
