import React from 'react';
import { api, type Opsi } from '../api';

/** Dropdown suara (dikelompokkan per penyedia) + tombol ▶ Coba. */
export function PilihSuara({ opsi, nilai, onUbah }: { opsi: Opsi | null; nilai: string; onUbah: (v: string) => void }) {
  const [status, setStatus] = React.useState<'diam' | 'muat' | 'putar'>('diam');
  const [galat, setGalat] = React.useState('');
  const audio = React.useRef<HTMLAudioElement | null>(null);

  const coba = async () => {
    if (status === 'putar') {
      audio.current?.pause();
      return setStatus('diam');
    }
    setGalat('');
    setStatus('muat');
    try {
      const { url } = await api.cobaSuara(nilai);
      audio.current?.pause();
      const a = new Audio(url);
      audio.current = a;
      a.onended = () => setStatus('diam');
      await a.play();
      setStatus('putar');
    } catch (e) {
      setGalat((e as Error).message);
      setStatus('diam');
    }
  };
  React.useEffect(() => () => audio.current?.pause(), []);

  return (
    <div>
      <div className="baris-suara">
        <select className="isian" value={nilai} onChange={(e) => (onUbah(e.target.value), setGalat(''))}>
          {!opsi?.grupSuara.length ? <option value="">Tanpa suara</option> : null}
          {(opsi?.grupSuara ?? []).map((g) => (
            <optgroup key={g.penyedia} label={g.nama}>
              {g.suara.map((v) => (
                <option key={v.nilai} value={v.nilai} disabled={!v.bisa}>
                  {v.nama}
                  {v.ket ? ` · ${v.ket}` : ''}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
        <button className="tombol tombol-coba" onClick={coba} disabled={!nilai || status === 'muat'} title="Dengar contoh suara (memotong ±60 karakter kredit, sekali per suara)">
          {status === 'muat' ? '…' : status === 'putar' ? '■' : '▶'}
        </button>
      </div>
      {galat ? <p className="galat kecil">{galat}</p> : null}
    </div>
  );
}
