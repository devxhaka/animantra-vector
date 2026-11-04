import React from 'react';
import { Player, Thumbnail } from '@remotion/player';
import { api, useOpsi } from '../api';
import { EKSPRESI, POSE, type Ekspresi, type Karakter, type Pose } from '../../../shared/tipe';
import { KARAKTER_CONTOH, PAKAIAN_PILIHAN, WARNA_KULIT, WARNA_RAMBUT } from '../../../shared/karakter-bawaan';
import { PratinjauTokoh } from '../../../remotion/karakter/Pratinjau';
import { PilihSuara } from '../komponen/PilihSuara';

const salin = <T,>(x: T): T => JSON.parse(JSON.stringify(x));
const baru = (): Karakter => ({ ...salin(KARAKTER_CONTOH[0]), id: '', nama: 'Tokoh baru', peran: '' });

const NAMA_USIA: Record<Karakter['usia'], string> = { anak: 'Anak', remaja: 'Remaja', dewasa: 'Dewasa', tua: 'Lansia' };
const NAMA_WARNA: { k: keyof Karakter['warna']; n: string }[] = [
  { k: 'atasan', n: 'Atasan' },
  { k: 'bawahan', n: 'Bawahan' },
  { k: 'penutup', n: 'Hijab / kopiah' },
  { k: 'rambut', n: 'Rambut' },
  { k: 'sepatu', n: 'Sepatu' },
];
const SAMPEL: { pose: Pose; ekspresi: Ekspresi; ket: string }[] = [
  { pose: 'diam', ekspresi: 'netral', ket: 'Netral' },
  { pose: 'melambai', ekspresi: 'senang', ket: 'Senang' },
  { pose: 'memeluk-diri', ekspresi: 'cemas', ket: 'Cemas' },
  { pose: 'kaget', ekspresi: 'kaget', ket: 'Kaget' },
  { pose: 'menenangkan', ekspresi: 'tenang', ket: 'Menenangkan' },
  { pose: 'berdoa', ekspresi: 'sedih', ket: 'Berdoa' },
  { pose: 'menunjuk', ekspresi: 'serius', ket: 'Menunjuk' },
  { pose: 'berpikir', ekspresi: 'bingung', ket: 'Berpikir' },
];

export function HalamanKarakter() {
  const opsi = useOpsi();
  const [daftar, setDaftar] = React.useState<Karakter[]>([]);
  const [draf, setDraf] = React.useState<Karakter>(baru());
  const [idLama, setIdLama] = React.useState<string | null>(null);
  const [pesan, setPesan] = React.useState('');
  const [coba, setCoba] = React.useState<{ pose: Pose; ekspresi: Ekspresi; bicara: boolean } | null>(null);

  const muat = React.useCallback(async (pilih?: string) => {
    const d = await api.karakter();
    setDaftar(d);
    const k = d.find((x) => x.id === pilih) ?? d[0];
    if (k) {
      setDraf(salin(k));
      setIdLama(k.id);
    } else {
      setDraf(baru());
      setIdLama(null);
    }
  }, []);
  React.useEffect(() => {
    muat();
  }, [muat]);

  const ubah = (fn: (k: Karakter) => void) =>
    setDraf((k) => {
      const n = salin(k);
      fn(n);
      return n;
    });
  const kabar = (t: string) => {
    setPesan(t);
    setTimeout(() => setPesan(''), 2200);
  };
  const simpan = async () => {
    try {
      const k = await api.simpanKarakter(draf, idLama ?? undefined);
      await muat(k.id);
      kabar('Tersimpan');
    } catch (e) {
      kabar((e as Error).message);
    }
  };
  const hapus = async () => {
    if (!idLama || !confirm(`Hapus tokoh "${draf.nama}"?`)) return;
    await api.hapusKarakter(idLama);
    await muat();
  };
  const pakaianCocok = PAKAIAN_PILIHAN.filter((p) => p.untuk === 'semua' || p.untuk === draf.jenis);

  return (
    <main className="tata gaya">
      <aside className="panel kiri gaya-panel">
        <div className="gulir">
          <div className="eyebrow-kecil">Pemeran tersimpan</div>
          <div className="chip-baris">
            {daftar.map((k) => (
              <button
                key={k.id}
                className={'chip' + (idLama === k.id ? ' pilih' : '')}
                onClick={() => {
                  setDraf(salin(k));
                  setIdLama(k.id);
                }}
              >
                <span className="swatch">
                  <i style={{ background: k.warna.kulit }} />
                  <i style={{ background: k.warna.atasan }} />
                  <i style={{ background: k.warna.penutup }} />
                </span>
                {k.nama}
              </button>
            ))}
            {idLama === null ? <span className="chip pilih">{draf.nama} <span className="tag-aktif">belum disimpan</span></span> : null}
          </div>
          <button
            className="chip tambah"
            onClick={() => {
              setDraf(baru());
              setIdLama(null);
            }}
          >
            + Tokoh baru
          </button>

          <label className="label">Nama (tampil di subtitle)</label>
          <input className="isian" value={draf.nama} onChange={(e) => ubah((k) => (k.nama = e.target.value))} />
          <label className="label">ID singkat (dipakai Claude di naskah)</label>
          <input className="isian" placeholder="kakak" value={draf.id} onChange={(e) => ubah((k) => (k.id = e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '')))} />
          <label className="label">Peran & sifat</label>
          <textarea className="isian" rows={3} placeholder="Kakak sulung, 15 tahun. Tenang, sabar…" value={draf.peran} onChange={(e) => ubah((k) => (k.peran = e.target.value))} />

          <div className="eyebrow-kecil jarak">Tubuh</div>
          <div className="label">Jenis kelamin</div>
          <div className="segmen-pilih">
            {(['perempuan', 'laki'] as const).map((j) => (
              <button
                key={j}
                className={draf.jenis === j ? 'pilih' : ''}
                onClick={() =>
                  ubah((k) => {
                    k.jenis = j;
                    if (!PAKAIAN_PILIHAN.some((p) => p.kunci === k.pakaian && (p.untuk === 'semua' || p.untuk === j))) k.pakaian = j === 'laki' ? 'koko-kopiah' : 'hijab-gamis';
                  })
                }
              >
                {j === 'laki' ? 'Laki-laki' : 'Perempuan'}
              </button>
            ))}
          </div>
          <div className="label">Usia</div>
          <div className="segmen-pilih">
            {(Object.keys(NAMA_USIA) as Karakter['usia'][]).map((u) => (
              <button key={u} className={draf.usia === u ? 'pilih' : ''} onClick={() => ubah((k) => (k.usia = u))}>
                {NAMA_USIA[u]}
              </button>
            ))}
          </div>
          <div className="label">Warna kulit</div>
          <div className="bulatan-baris">
            {WARNA_KULIT.map((c) => (
              <button key={c} className={'bulatan' + (draf.warna.kulit === c ? ' pilih' : '')} style={{ background: c }} onClick={() => ubah((k) => (k.warna.kulit = c))} aria-label={c} />
            ))}
          </div>

          <div className="eyebrow-kecil jarak">Pakaian</div>
          <select className="isian" value={draf.pakaian} onChange={(e) => ubah((k) => (k.pakaian = e.target.value as Karakter['pakaian']))}>
            {pakaianCocok.map((p) => (
              <option key={p.kunci} value={p.kunci}>
                {p.nama}
              </option>
            ))}
          </select>
          <div className="dua-kolom" style={{ marginTop: 10 }}>
            {NAMA_WARNA.map(({ k, n }) => (
              <label key={k} className="warna-input">
                <input type="color" value={draf.warna[k]} onChange={(e) => ubah((x) => (x.warna[k] = e.target.value))} />
                <span>{n}</span>
              </label>
            ))}
          </div>
          <div className="label">Warna rambut cepat</div>
          <div className="bulatan-baris">
            {WARNA_RAMBUT.map((c) => (
              <button key={c} className={'bulatan' + (draf.warna.rambut === c ? ' pilih' : '')} style={{ background: c }} onClick={() => ubah((k) => (k.warna.rambut = c))} aria-label={c} />
            ))}
          </div>

          <div className="eyebrow-kecil jarak">Suara</div>
          <div style={{ marginTop: 8 }}>
            <PilihSuara opsi={opsi} nilai={draf.suara} onUbah={(v) => ubah((k) => (k.suara = v))} />
          </div>
        </div>
        <div className="kaki-panel">
          <button className="tombol utama" onClick={simpan}>
            Simpan
          </button>
          <button className="tombol" onClick={hapus} disabled={!idLama}>
            Hapus
          </button>
          {pesan ? <span className="redup kecil">{pesan}</span> : null}
        </div>
      </aside>

      <section className="panel pratinjau">
        <div className="pratinjau-kepala">
          <b>Pratinjau</b>
          <span className="redup">Klik salah satu untuk melihat geraknya</span>
        </div>
        {coba ? (
          <div className="pratinjau-putar">
            <div className="bingkai">
              <Player
                component={PratinjauTokoh}
                inputProps={{ karakter: draf, pose: coba.pose, ekspresi: coba.ekspresi, bicara: coba.bicara }}
                durationInFrames={240}
                fps={30}
                compositionWidth={600}
                compositionHeight={800}
                style={{ width: '100%', aspectRatio: '3 / 4' }}
                autoPlay
                loop
              />
            </div>
            <div>
              <div className="label">Pose</div>
              <select className="isian" value={coba.pose} onChange={(e) => setCoba({ ...coba, pose: e.target.value as Pose })}>
                {POSE.map((p) => (
                  <option key={p}>{p}</option>
                ))}
              </select>
              <div className="label">Ekspresi</div>
              <select className="isian" value={coba.ekspresi} onChange={(e) => setCoba({ ...coba, ekspresi: e.target.value as Ekspresi })}>
                {EKSPRESI.map((p) => (
                  <option key={p}>{p}</option>
                ))}
              </select>
              <label className="centang">
                <input type="checkbox" checked={coba.bicara} onChange={(e) => setCoba({ ...coba, bicara: e.target.checked })} />
                Sedang bicara
              </label>
              <button className="tombol" style={{ marginTop: 14 }} onClick={() => setCoba(null)}>
                ← Semua pose
              </button>
            </div>
          </div>
        ) : (
          <div className="grid-tokoh">
            {SAMPEL.map((s) => (
              <button key={s.ket} className="kartu-tokoh" onClick={() => setCoba({ pose: s.pose, ekspresi: s.ekspresi, bicara: false })}>
                <Thumbnail
                  component={PratinjauTokoh}
                  inputProps={{ karakter: draf, pose: s.pose, ekspresi: s.ekspresi }}
                  frameToDisplay={12}
                  durationInFrames={30}
                  fps={30}
                  compositionWidth={600}
                  compositionHeight={800}
                  style={{ width: '100%', aspectRatio: '3 / 4' }}
                />
                <span>{s.ket}</span>
              </button>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
