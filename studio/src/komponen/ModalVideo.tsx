import React from 'react';
import { api, type DetailVideo } from '../api';
import type { Job } from '../../../shared/tipe';
import { TAHAP } from '../../../shared/tipe';
import { formatDari } from '../../../shared/formats';

export function ModalVideo({ slug, jobs, onTutup, onBerubah }: { slug: string; jobs: Job[]; onTutup: () => void; onBerubah: () => void }) {
  const [d, setD] = React.useState<DetailVideo | null>(null);
  const [revisi, setRevisi] = React.useState('');
  const [pesan, setPesan] = React.useState('');
  const [salin, setSalin] = React.useState(false);

  const jobVideo = jobs.find((j) => j.slug === slug && (j.status === 'antre' || j.status === 'dikerjakan'));
  const versi = React.useRef<string>('');

  const muat = React.useCallback(() => api.video(slug).then(setD).catch(() => {}), [slug]);
  React.useEffect(() => {
    muat();
  }, [muat]);
  // muat ulang ketika job untuk video ini selesai
  React.useEffect(() => {
    const k = jobVideo ? jobVideo.id : '';
    if (versi.current && !k) muat();
    versi.current = k;
  }, [jobVideo, muat]);

  React.useEffect(() => {
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && onTutup();
    addEventListener('keydown', esc);
    return () => removeEventListener('keydown', esc);
  }, [onTutup]);

  if (!d) return <div className="modal-latar" onClick={onTutup} />;
  const m = d.meta;
  const fmt = formatDari(m.format);
  const seri = d.pesanan?.format?.seri || fmt.seri;
  const v = encodeURIComponent(m.diperbarui);

  const kirimRevisi = async () => {
    if (!revisi.trim()) return;
    try {
      await api.revisi(slug, revisi);
      setRevisi('');
      setPesan('Revisi terkirim ke Claude. Progresnya tampil di "Sedang dikerjakan".');
      onBerubah();
    } catch (e) {
      setPesan((e as Error).message);
    }
  };

  return (
    <div className="modal-latar" onMouseDown={(e) => e.target === e.currentTarget && onTutup()}>
      <div className="modal" role="dialog" aria-label={m.judul}>
        <div className="modal-video">
          {m.ada.video ? (
            <video key={v} src={`/media/${slug}/final.mp4?v=${v}`} poster={m.ada.cover ? `/media/${slug}/cover.jpg?v=${v}` : undefined} controls autoPlay playsInline />
          ) : (
            <div className="sampul-kosong">Video belum dirender</div>
          )}
        </div>
        <div className="modal-isi">
          <div className="modal-atas">
            <div>
              <div className="eyebrow">{seri}</div>
              <h2 className="modal-judul">{m.judul}</h2>
              <div className="redup">
                {slug} · {m.durasi} detik{m.versi > 1 ? ` · versi ${m.versi}` : ''}
              </div>
            </div>
            <button className="tombol" onClick={onTutup}>
              Tutup
            </button>
          </div>

          <div className="baris-tombol">
            <button className="tombol" onClick={() => api.finder(slug)}>
              {navigator.platform.toLowerCase().includes('win') ? 'Tampilkan di Explorer' : 'Tampilkan di Finder'}
            </button>
            <a className="tombol" href={`/api/videos/${slug}/unduh`} download>
              Unduh video
            </a>
            <button
              className="tombol"
              disabled={!!jobVideo}
              onClick={() => api.renderUlang(slug).then(() => (setPesan('Render ulang dimulai.'), onBerubah())).catch((e) => setPesan(e.message))}
            >
              Render ulang
            </button>
          </div>

          {jobVideo ? (
            <div className="info-job">
              {jobVideo.jenis === 'revisi' ? 'Revisi' : 'Render ulang'} {jobVideo.status === 'antre' ? 'menunggu Claude' : 'sedang dikerjakan'}
              {jobVideo.tahapAktif ? ` · ${TAHAP.find((t) => t.kunci === jobVideo.tahapAktif)?.label}` : ''}
              {jobVideo.persen != null ? ` ${jobVideo.persen}%` : ''}
            </div>
          ) : null}

          <div className="label">Revisi</div>
          <textarea
            className="isian"
            rows={3}
            placeholder="musiknya kurang nendang, kamera terlalu dekat di bagian AC"
            value={revisi}
            onChange={(e) => setRevisi(e.target.value)}
            disabled={!!jobVideo}
          />
          <div className="baris-tombol">
            <button className="tombol" onClick={kirimRevisi} disabled={!revisi.trim() || !!jobVideo}>
              Kirim revisi
            </button>
            {pesan ? <span className="redup kecil">{pesan}</span> : null}
          </div>

          <div className="label jarak">Caption</div>
          <pre className="caption">{d.caption || 'Belum ada caption.'}</pre>
          <div className="baris-tombol">
            <button
              className="tombol"
              disabled={!d.caption}
              onClick={() => {
                navigator.clipboard.writeText(d.caption);
                setSalin(true);
                setTimeout(() => setSalin(false), 1600);
              }}
            >
              {salin ? 'Tersalin ✓' : 'Salin caption'}
            </button>
          </div>

          {d.cuplikan.length ? (
            <>
              <div className="label jarak">Cuplikan</div>
              <div className="cuplikan">
                {d.cuplikan.map((c) => (
                  <img key={c} src={`/media/${slug}/cuplikan/${c}?v=${v}`} alt="" />
                ))}
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
