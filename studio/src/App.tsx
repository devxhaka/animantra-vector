import React from 'react';
import type { Status } from './api';
import { HalamanBeranda } from './halaman/HalamanBeranda';
import { HalamanBuat } from './halaman/HalamanBuat';
import { HalamanRiwayat } from './halaman/HalamanRiwayat';
import { HalamanDetail } from './halaman/HalamanDetail';
import { HalamanSeri } from './halaman/HalamanSeri';
import { HalamanGaya } from './halaman/HalamanGaya';
import { HalamanKarakter } from './halaman/HalamanKarakter';
import { KepalaHalaman } from './komponen/KartuVideo';
import { Ikon } from './komponen/Ikon';
import { PenyediaData, useData } from './data';
import { pergi, useRute } from './rute';

type ItemNav = { kunci: string; label: string; ikon: string };
const NAV: ItemNav[] = [
  { kunci: 'beranda', label: 'Beranda', ikon: 'beranda' },
  { kunci: 'buat', label: 'Buat Video', ikon: 'buat' },
  { kunci: 'riwayat', label: 'Riwayat', ikon: 'riwayat' },
  { kunci: 'seri', label: 'Seri', ikon: 'seri' },
  { kunci: 'gaya', label: 'Gaya', ikon: 'gaya' },
  { kunci: 'karakter', label: 'Karakter', ikon: 'karakter' },
];

function teksAgen(s: Status | null) {
  if (s == null) return { judul: 'Memeriksa…', ket: '' };
  const nama = s.agen === 'gemini' ? 'Gemini' : 'Claude';
  if (s.terhubung) return { judul: `${nama} terhubung`, ket: s.bekerja ? `${nama} sedang mengerjakan video` : 'Siap menerima pesanan' };
  return { judul: 'Agen terputus', ket: 'Buka Claude (tab Code) di folder ini lalu ketik "buka studio", atau jalankan Gemini CLI lalu ketik "/buka-studio".' };
}

function StatusAgen({ s, ringkas }: { s: Status | null; ringkas?: boolean }) {
  const t = teksAgen(s);
  const kelas = s == null ? 'cek' : s.terhubung ? (s.bekerja ? 'kerja' : 'ya') : 'tidak';
  if (ringkas)
    return (
      <div className={'agen-ringkas ' + kelas} title={t.ket}>
        <span className="titik" />
        {t.judul}
      </div>
    );
  return (
    <div className={'kartu-agen ' + kelas}>
      <div className="agen-judul">
        <span className="titik" />
        {t.judul}
      </div>
      {t.ket ? <p>{t.ket}</p> : null}
    </div>
  );
}

function Merek() {
  return (
    <a className="merek" href="#/">
      <span className="merek-ikon">A</span>
      <span>
        Animantra <b>Studio</b>
      </span>
    </a>
  );
}

function Isi() {
  const rute = useRute();
  const { status, jobs } = useData();
  const [menuLain, setMenuLain] = React.useState(false);
  const halaman = rute.halaman === 'video' && rute.param[0] ? 'video' : NAV.some((n) => n.kunci === rute.halaman) ? rute.halaman : 'beranda';
  const navAktif = halaman === 'video' ? 'riwayat' : halaman;
  const berjalan = (jobs ?? []).filter((j) => j.status === 'antre' || j.status === 'dikerjakan').length;
  React.useEffect(() => setMenuLain(false), [rute]);

  let isi: React.ReactNode;
  if (halaman === 'buat') isi = <HalamanBuat key={rute.param.join('/')} lanjutDari={rute.param[0] === 'lanjut' ? rute.param[1] : undefined} />;
  else if (halaman === 'riwayat') isi = <HalamanRiwayat />;
  else if (halaman === 'video') isi = <HalamanDetail slug={rute.param[0]} />;
  else if (halaman === 'seri') isi = <HalamanSeri />;
  else if (halaman === 'gaya')
    isi = (
      <div className="halaman">
        <KepalaHalaman judul="Gaya" ket="Warna, huruf, subtitle, dan logo yang dipakai video. Gaya dikunci per video saat dipesan." />
        <HalamanGaya />
      </div>
    );
  else if (halaman === 'karakter')
    isi = (
      <div className="halaman">
        <KepalaHalaman judul="Karakter" ket="Pemeran untuk format bertokoh: tampilan, sifat, dan suaranya." />
        <HalamanKarakter />
      </div>
    );
  else isi = <HalamanBeranda />;

  return (
    <div className="app">
      <aside className="sidebar">
        <Merek />
        <nav className="nav">
          {NAV.map((n) => (
            <button key={n.kunci} className={'nav-item' + (navAktif === n.kunci ? ' aktif' : '') + (n.kunci === 'buat' ? ' nav-buat' : '')} onClick={() => pergi(n.kunci)}>
              <Ikon nama={n.ikon} />
              {n.label}
              {n.kunci === 'beranda' && berjalan ? <span className="hitung">{berjalan}</span> : null}
            </button>
          ))}
        </nav>
        <div className="sidebar-bawah">
          <StatusAgen s={status} />
        </div>
      </aside>

      <header className="bar-atas">
        <Merek />
        <StatusAgen s={status} ringkas />
      </header>

      <main className="isi-utama">{isi}</main>

      <nav className="nav-bawah">
        {[NAV[0], NAV[2], NAV[1], NAV[3]].map((n) => (
          <button key={n.kunci} className={(navAktif === n.kunci ? 'aktif' : '') + (n.kunci === 'buat' ? ' buat' : '')} onClick={() => pergi(n.kunci)}>
            <span className="ikon-nav">
              <Ikon nama={n.ikon} ukuran={22} />
              {n.kunci === 'beranda' && berjalan ? <span className="hitung">{berjalan}</span> : null}
            </span>
            <span>{n.kunci === 'buat' ? 'Buat' : n.label}</span>
          </button>
        ))}
        <button className={navAktif === 'gaya' || navAktif === 'karakter' ? 'aktif' : ''} onClick={() => setMenuLain((x) => !x)} aria-expanded={menuLain}>
          <span className="ikon-nav">
            <Ikon nama="gaya" ukuran={22} />
          </span>
          <span>Lainnya</span>
        </button>
        {menuLain ? (
          <div className="menu-lain">
            {NAV.slice(4).map((n) => (
              <button key={n.kunci} onClick={() => pergi(n.kunci)}>
                <Ikon nama={n.ikon} /> {n.label}
              </button>
            ))}
          </div>
        ) : null}
      </nav>
    </div>
  );
}

export function App() {
  return (
    <PenyediaData>
      <Isi />
    </PenyediaData>
  );
}
