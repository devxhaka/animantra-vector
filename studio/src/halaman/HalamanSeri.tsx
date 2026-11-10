import React from 'react';
import { useData } from '../data';
import { KepalaHalaman } from '../komponen/KartuVideo';
import { Ikon } from '../komponen/Ikon';
import { formatDari } from '../../../shared/formats';
import { kelompokkanSeri, nomorEpisode } from '../seri';
import { pergi } from '../rute';
import { tanggal } from '../api';

export function HalamanSeri() {
  const { videos, jobAktif } = useData();
  const seri = kelompokkanSeri(videos ?? []);
  return (
    <div className="halaman">
      <KepalaHalaman judul="Seri" ket="Episode dikelompokkan per seri. Lanjutkan cerita dengan pilihan penonton dari komentar." />
      {videos == null ? (
        <p className="kosong">Memuat…</p>
      ) : !seri.length ? (
        <div className="kosong">
          Belum ada seri. Buat video bertokoh (Cerita, Mystery, atau POV Bayangkan), lalu di halaman videonya klik <b>Buat episode berikutnya</b>.
        </div>
      ) : (
        <div className="daftar-seri">
          {seri.map((s) => {
            const nAkhir = nomorEpisode(s, s.episode.length - 1);
            const opsiAkhir = s.terakhir.seri?.opsi;
            return (
              <section key={s.kunci} className="panel kartu-seri">
                <div className="kepala-bagian">
                  <div>
                    <div className="eyebrow">{formatDari(s.format).nama} · {s.episode.length} episode</div>
                    <h2>{s.nama}</h2>
                    <span className="redup kecil">Terakhir diperbarui {tanggal(s.terakhir.diperbarui)}</span>
                  </div>
                  <button className="tombol utama" onClick={() => pergi('buat', 'lanjut', s.terakhir.slug)}>
                    <Ikon nama="buat" ukuran={16} /> Episode {nAkhir + 1}
                  </button>
                </div>
                <div className="lintasan">
                  {s.episode.map((e, i) => (
                    <React.Fragment key={e.slug}>
                      {i > 0 ? (
                        <div className="sambungan">
                          <Ikon nama="kanan" ukuran={16} />
                          {e.seri?.pilihanPenonton ? <span className="pil-opsi pilih" title="Pilihan penonton yang dijalankan episode ini">{e.seri.pilihanPenonton}</span> : null}
                        </div>
                      ) : null}
                      <button className="kartu-episode" onClick={() => pergi('video', e.slug)}>
                        <div className="sampul">
                          {e.ada.cover ? <img src={`/media/${e.slug}/cover.jpg?v=${encodeURIComponent(e.diperbarui)}`} alt="" loading="lazy" /> : <div className="sampul-kosong">—</div>}
                          <span className="lencana-ep">EP {nomorEpisode(s, i)}</span>
                          {jobAktif(e.slug) ? <span className="lencana-sibuk">Diproses…</span> : null}
                        </div>
                        <span className="judul">{e.judul}</span>
                      </button>
                    </React.Fragment>
                  ))}
                  <div className="sambungan">
                    <Ikon nama="kanan" ukuran={16} />
                  </div>
                  <button className="kartu-episode berikut" onClick={() => pergi('buat', 'lanjut', s.terakhir.slug)}>
                    <div className="sampul kosong-ep">
                      <Ikon nama="buat" ukuran={28} />
                      <span>EP {nAkhir + 1}</span>
                    </div>
                    <span className="judul">{opsiAkhir?.length ? 'Pilihan penonton:' : 'Episode berikutnya'}</span>
                    {opsiAkhir?.length ? (
                      <span className="opsi-daftar">
                        {opsiAkhir.map((o) => (
                          <span key={o} className="pil-opsi">{o}</span>
                        ))}
                      </span>
                    ) : null}
                  </button>
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
