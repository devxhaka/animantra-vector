import React from 'react';

// Router hash kecil: "#/", "#/gaya", "#/video/<slug>" … (tombol back browser bekerja).
export type Rute = { halaman: string; param: string[] };

function urai(hash: string): Rute {
  const h = hash.replace(/^#\/?/, '');
  // kompatibel dengan alamat lama: "#gaya", "#karakter"
  const [halaman = '', ...param] = h.split('/').filter(Boolean).map(decodeURIComponent);
  return { halaman: halaman || 'beranda', param };
}

export function pergi(halaman: string, ...param: string[]) {
  const tujuan = '#/' + [halaman, ...param].map(encodeURIComponent).join('/');
  if (location.hash !== tujuan) location.hash = tujuan;
}

export function useRute(): Rute {
  const [rute, setRute] = React.useState(() => urai(location.hash));
  React.useEffect(() => {
    const ubah = () => {
      setRute(urai(location.hash));
      window.scrollTo(0, 0);
    };
    window.addEventListener('hashchange', ubah);
    return () => window.removeEventListener('hashchange', ubah);
  }, []);
  return rute;
}
