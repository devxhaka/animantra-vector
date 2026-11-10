import React from 'react';
import { useData } from '../data';
import { KartuProgres } from '../komponen/KartuProgres';
import { KartuVideo, KepalaHalaman } from '../komponen/KartuVideo';
import { Ikon } from '../komponen/Ikon';
import { kelompokkanSeri, nomorEpisode } from '../seri';
import { pergi } from '../rute';

export function HalamanBeranda() {
  const { status, videos, jobs, muatJobs, jobAktif } = useData();
  const terhubung = !!status?.terhubung;
  const antrean = (jobs ?? []).filter((j) => j.jenis !== 'render-ulang' || j.status !== 'selesai');
  const aktif = antrean.filter((j) => j.status === 'antre' || j.status === 'dikerjakan').length;
  const seri = kelompokkanSeri(videos ?? []).slice(0, 3);
  const totalDetik = (videos ?? []).reduce((s, v) => s + v.durasi, 0);

  return (
    <div className="halaman">
      <KepalaHalaman judul="Beranda" ket="Pesan video, pantau pengerjaannya, dan lanjutkan seri dari sini.">
        <button className="tombol utama besar" onClick={() => pergi('buat')}>
          <Ikon nama="buat" ukuran={18} /> Buat video
        </button>
      </KepalaHalaman>

      <div className="statistik">
        <div className="kartu-stat">
          <span>Video jadi</span>
          <b>{videos?.length ?? '–'}</b>
        </div>
        <div className="kartu-stat">
          <span>Total durasi</span>
          <b>{videos ? `${Math.floor(totalDetik / 60)}m ${totalDetik % 60}d` : '–'}</b>
        </div>
        <div className="kartu-stat">
          <span>Sedang dikerjakan</span>
          <b>{jobs ? aktif : '–'}</b>
        </div>
        <div className={'kartu-stat agen ' + (status == null ? '' : terhubung ? 'ya' : 'tidak')}>
          <span>Agen</span>
          <b>
            <span className="titik" /> {status == null ? 'Memeriksa…' : terhubung ? (status.agen === 'gemini' ? 'Gemini siap' : 'Claude siap') : 'Terputus'}
          </b>
        </div>
      </div>

      {status && !terhubung ? (
        <div className="kotak-info peringatan-agen">
          <Ikon nama="info" />
          <div>
            <b>Agen belum terhubung.</b> Pesanan tetap masuk antrean dan dikerjakan begitu agen tersambung. Buka Claude (tab Code) di folder
            proyek lalu ketik <code>buka studio</code>, atau jalankan Gemini CLI lalu ketik <code>/buka-studio</code>. Tanpa langganan, pakai{' '}
            <b>Salin prompt</b> di kartu pesanan (Mode Tempel).
          </div>
        </div>
      ) : null}

      <section className="bagian">
        <div className="kepala-bagian">
          <h2>Antrean pengerjaan</h2>
          {aktif ? <span className="lencana-aksen">{aktif} berjalan</span> : null}
        </div>
        {jobs == null ? (
          <p className="kosong">Memuat…</p>
        ) : antrean.length ? (
          <div className="daftar-progres">
            {antrean.map((j) => (
              <KartuProgres key={j.id} job={j} terhubung={terhubung} onBerubah={muatJobs} />
            ))}
          </div>
        ) : (
          <div className="kosong kecil-kosong">
            Tidak ada pekerjaan berjalan.{' '}
            <button className="tautan" onClick={() => pergi('buat')}>
              Buat video baru →
            </button>
          </div>
        )}
      </section>

      {seri.length ? (
        <section className="bagian">
          <div className="kepala-bagian">
            <h2>Seri berjalan</h2>
            <button className="tautan" onClick={() => pergi('seri')}>
              Semua seri →
            </button>
          </div>
          <div className="grid-seri-ringkas">
            {seri.map((s) => {
              const n = nomorEpisode(s, s.episode.length - 1);
              return (
                <div key={s.kunci} className="kartu-seri-ringkas">
                  <img src={`/media/${s.terakhir.slug}/cover.jpg?v=${encodeURIComponent(s.terakhir.diperbarui)}`} alt="" />
                  <div className="isi">
                    <div className="eyebrow">{s.episode.length} episode</div>
                    <b>{s.nama}</b>
                    <span className="redup kecil">Terakhir: EP {n} · {s.terakhir.judul}</span>
                    {s.terakhir.seri?.opsi?.length ? <span className="kecil">Menunggu pilihan: {s.terakhir.seri.opsi.join(' / ')}</span> : null}
                    <button className="tombol kecil utama" onClick={() => pergi('buat', 'lanjut', s.terakhir.slug)}>
                      Episode {n + 1} →
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ) : null}

      <section className="bagian">
        <div className="kepala-bagian">
          <h2>Video terbaru</h2>
          {videos?.length ? (
            <button className="tautan" onClick={() => pergi('riwayat')}>
              Lihat semua →
            </button>
          ) : null}
        </div>
        {videos == null ? (
          <p className="kosong">Memuat…</p>
        ) : videos.length ? (
          <div className="grid-video">
            {videos.slice(0, 6).map((v) => (
              <KartuVideo key={v.slug} v={v} sibuk={!!jobAktif(v.slug)} />
            ))}
          </div>
        ) : (
          <div className="kosong">Belum ada video. Klik "Buat video" untuk memesan yang pertama.</div>
        )}
      </section>
    </div>
  );
}
