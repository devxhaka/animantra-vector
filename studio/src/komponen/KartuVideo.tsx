import React from 'react';
import { tanggal } from '../api';
import type { VideoMeta } from '../../../shared/tipe';
import { formatDari } from '../../../shared/formats';
import { pergi } from '../rute';

export function KartuVideo({ v, sibuk, label }: { v: VideoMeta; sibuk?: boolean; label?: string }) {
  const f = formatDari(v.format);
  return (
    <button className="kartu-video" onClick={() => pergi('video', v.slug)}>
      <div className="sampul">
        {v.ada.cover ? <img src={`/media/${v.slug}/cover.jpg?v=${encodeURIComponent(v.diperbarui)}`} alt="" loading="lazy" /> : <div className="sampul-kosong">Belum ada sampul</div>}
        {sibuk ? <span className="lencana-sibuk">Diproses…</span> : null}
        {label ? <span className="lencana-ep">{label}</span> : null}
        <span className="lencana-durasi">{v.durasi} dtk</span>
      </div>
      <div className="info">
        <div className="judul">{v.judul}</div>
        <div className="meta">
          {f.nama} · {tanggal(v.diperbarui)}
          {v.versi > 1 ? ` · v${v.versi}` : ''}
        </div>
      </div>
    </button>
  );
}

/** Kepala halaman yang seragam: judul, keterangan, dan aksi di kanan. */
export function KepalaHalaman({ judul, ket, children }: { judul: string; ket?: string; children?: React.ReactNode }) {
  return (
    <div className="kepala-halaman">
      <div>
        <h1>{judul}</h1>
        {ket ? <p>{ket}</p> : null}
      </div>
      {children ? <div className="aksi-halaman">{children}</div> : null}
    </div>
  );
}
