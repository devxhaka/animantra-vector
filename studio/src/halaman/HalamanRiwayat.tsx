import React from 'react';
import { useData } from '../data';
import { KartuVideo, KepalaHalaman } from '../komponen/KartuVideo';
import { Ikon } from '../komponen/Ikon';
import { formatDari } from '../../../shared/formats';
import { pergi } from '../rute';

export function HalamanRiwayat() {
  const { videos, jobAktif } = useData();
  const [cari, setCari] = React.useState('');
  const [format, setFormat] = React.useState('');
  const [urut, setUrut] = React.useState<'baru' | 'lama' | 'judul'>('baru');
  const adaFormat = [...new Set((videos ?? []).map((v) => v.format))];
  const q = cari.trim().toLowerCase();
  const tampil = (videos ?? [])
    .filter((v) => (!format || v.format === format) && (!q || v.judul.toLowerCase().includes(q) || v.topik.toLowerCase().includes(q)))
    .sort((a, b) => (urut === 'judul' ? a.judul.localeCompare(b.judul) : urut === 'lama' ? a.diperbarui.localeCompare(b.diperbarui) : b.diperbarui.localeCompare(a.diperbarui)));

  return (
    <div className="halaman">
      <KepalaHalaman judul="Riwayat video" ket={videos ? `${videos.length} video` : 'Memuat…'}>
        <button className="tombol utama" onClick={() => pergi('buat')}>
          <Ikon nama="buat" ukuran={18} /> Buat video
        </button>
      </KepalaHalaman>

      <div className="saringan">
        <label className="kotak-cari">
          <Ikon nama="cari" ukuran={18} />
          <input placeholder="Cari judul atau topik" value={cari} onChange={(e) => setCari(e.target.value)} />
        </label>
        <div className="chip-baris">
          <button className={'chip tambah' + (!format ? ' pilih' : '')} onClick={() => setFormat('')}>
            Semua
          </button>
          {adaFormat.map((f) => (
            <button key={f} className={'chip tambah' + (format === f ? ' pilih' : '')} onClick={() => setFormat(format === f ? '' : f)}>
              {formatDari(f).nama}
            </button>
          ))}
        </div>
        <select className="isian urut" value={urut} onChange={(e) => setUrut(e.target.value as typeof urut)} aria-label="Urutkan">
          <option value="baru">Terbaru</option>
          <option value="lama">Terlama</option>
          <option value="judul">Judul A–Z</option>
        </select>
      </div>

      {videos == null ? (
        <p className="kosong">Memuat…</p>
      ) : tampil.length === 0 ? (
        <div className="kosong">{q || format ? 'Tidak ada video yang cocok.' : 'Belum ada video. Klik "Buat video" untuk memesan yang pertama.'}</div>
      ) : (
        <div className="grid-video">
          {tampil.map((v) => (
            <KartuVideo key={v.slug} v={v} sibuk={!!jobAktif(v.slug)} label={v.seri?.episode ? `EP ${v.seri.episode}` : undefined} />
          ))}
        </div>
      )}
    </div>
  );
}
