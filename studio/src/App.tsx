import React from 'react';
import { api, usePolling } from './api';
import { HalamanVideo } from './halaman/HalamanVideo';
import { HalamanGaya } from './halaman/HalamanGaya';
import { HalamanKarakter } from './halaman/HalamanKarakter';

export function App() {
  const [tab, setTab] = React.useState<'video' | 'gaya' | 'karakter'>(() => (location.hash === '#gaya' ? 'gaya' : location.hash === '#karakter' ? 'karakter' : 'video'));
  const [status] = usePolling(api.status, 3000);
  React.useEffect(() => {
    history.replaceState(null, '', tab === 'video' ? '#' : '#' + tab);
  }, [tab]);

  return (
    <div className="app">
      <header className="kepala">
        <div className="merek">
          Animantra <span className="merek-kotak">Studio</span>
        </div>
        <nav className="tab">
          <button className={tab === 'video' ? 'aktif' : ''} onClick={() => setTab('video')}>
            Video
          </button>
          <button className={tab === 'gaya' ? 'aktif' : ''} onClick={() => setTab('gaya')}>
            Gaya Saya
          </button>
          <button className={tab === 'karakter' ? 'aktif' : ''} onClick={() => setTab('karakter')}>
            Karakter
          </button>
        </nav>
        <div className="jalur" title={status?.proyek}>
          {status?.proyek}
        </div>
        <div
          className={'koneksi ' + (status?.terhubung ? 'ya' : 'tidak')}
          title={
            status?.terhubung
              ? status.agen === 'gemini'
                ? status.bekerja
                  ? 'Gemini sedang mengerjakan video'
                  : 'Gemini siap menerima pesanan'
                : status.bekerja
                  ? 'Claude sedang mengerjakan video'
                  : 'Claude siap menerima pesanan'
              : 'Buka Claude (tab Code) di folder ini lalu ketik "buka studio", atau jalankan Gemini CLI lalu ketik "/buka-studio"'
          }
        >
          <span className="titik" />
          {status == null ? 'Memeriksa…' : status.terhubung ? (status.agen === 'gemini' ? 'Gemini terhubung' : 'Chat Claude terhubung') : 'Agen terputus'}
        </div>
      </header>
      {tab === 'video' ? <HalamanVideo terhubung={!!status?.terhubung} /> : tab === 'gaya' ? <HalamanGaya /> : <HalamanKarakter />}
    </div>
  );
}
