import React from 'react';
import { Thumbnail, Player } from '@remotion/player';
import { api } from '../api';
import type { EfekSorot, Gaya, GayaTeks } from '../../../shared/tipe';
import { GAYA_BAWAAN, HURUF_PILIHAN, HURUF_TEKS, PRESET_TEKS, PRESET_WARNA, TEKS_KLASIK, paletDariMerek, rasioKontras } from '../../../shared/gaya-bawaan';
import { SPEC_CONTOH } from '../../../shared/contoh-spec';
import { PratinjauTeks, VideoUtama, totalFrame } from '../../../remotion/Video';
import { huruf, hurufTeks } from '../../../remotion/huruf';

const salin = <T,>(x: T): T => JSON.parse(JSON.stringify(x));
const NAMA_WARNA: Record<keyof Gaya['warna'], string> = {
  latar: 'Latar',
  lantai: 'Lantai',
  teks: 'Teks judul',
  merek: 'Warna merek',
  sorot: 'Warna sorot',
  teksSorot: 'Teks di sorot',
  label: 'Label',
  teksLabel: 'Teks label',
};

export function HalamanGaya() {
  const [daftar, setDaftar] = React.useState<Gaya[]>([]);
  const [aktif, setAktif] = React.useState('bawaan');
  const [draf, setDraf] = React.useState<Gaya>(salin(GAYA_BAWAAN));
  const [pesan, setPesan] = React.useState('');
  const [putar, setPutar] = React.useState(false);

  const muat = React.useCallback(async (pilih?: string) => {
    const r = await api.gaya();
    setDaftar(r.daftar);
    setAktif(r.aktif);
    const g = r.daftar.find((x) => x.id === (pilih ?? r.aktif)) ?? r.daftar[0];
    if (g) setDraf(salin(g));
  }, []);
  React.useEffect(() => {
    muat();
    HURUF_PILIHAN.forEach((h) => huruf(h.kunci)); // muat font untuk kartu huruf
    HURUF_TEKS.forEach((h) => hurufTeks(h.kunci, 'tegas'));
  }, [muat]);

  const ubah = (fn: (g: Gaya) => void) =>
    setDraf((g) => {
      const n = salin(g);
      fn(n);
      return n;
    });
  const kabar = (t: string) => {
    setPesan(t);
    setTimeout(() => setPesan(''), 2200);
  };

  const T: GayaTeks = draf.teks ?? { ...TEKS_KLASIK, warnaKunci: draf.warna.sorot, warnaSorot: draf.warna.sorot };
  const ubahTeks = (fn: (t: GayaTeks) => void) =>
    ubah((g) => {
      const t = salin(g.teks ?? T);
      fn(t);
      g.teks = t;
    });

  const simpan = async (pakai: boolean) => {
    const g = await api.simpanGaya(draf, pakai);
    await muat(g.id);
    kabar(pakai ? 'Disimpan & dipakai untuk video berikutnya' : 'Disimpan');
  };
  const hapus = async () => {
    if (draf.id === 'bawaan' || draf.id === 'baru') return;
    if (!confirm(`Hapus gaya "${draf.nama}"?`)) return;
    await api.hapusGaya(draf.id);
    await muat();
  };
  const gayaBaru = () => {
    const g = salin(draf);
    g.id = 'baru';
    g.nama = 'Gaya baru';
    g.logo = null;
    setDraf(g);
  };
  const unggahLogo = async (f: File) => {
    const url = await new Promise<string>((r) => {
      const fr = new FileReader();
      fr.onload = () => r(String(fr.result));
      fr.readAsDataURL(f);
    });
    const { file } = await api.unggahLogo(url);
    ubah((g) => (g.logo = { file, posisi: g.logo?.posisi ?? 'kanan-atas', ukuran: g.logo?.ukuran ?? 0.16 }));
  };

  const spec = React.useMemo(() => ({ ...SPEC_CONTOH, gaya: draf, logo: draf.logo?.file ? `/gaya-media/${draf.logo.file}` : null }), [draf]);
  const frame2 = Math.round(SPEC_CONTOH.adegan[0].durasi * SPEC_CONTOH.fps) + 45;

  const w = draf.warna;
  const masalah = [
    rasioKontras(w.teks, w.latar) < 4.5 && 'Teks judul kurang kontras dengan latar',
    rasioKontras(w.teksSorot, w.sorot) < 4.5 && 'Teks di kotak sorot kurang kontras',
    rasioKontras(w.teksLabel, w.label) < 4.5 && 'Teks label kurang kontras',
    rasioKontras('#ffffff', w.merek) < 3 && 'Badge seri (teks putih) kurang kontras dengan warna merek',
  ].filter(Boolean) as string[];

  return (
    <main className="tata gaya">
      <aside className="panel kiri gaya-panel">
        <div className="gulir">
          <div className="eyebrow-kecil">Gaya tersimpan</div>
          <div className="chip-baris">
            {daftar.map((g) => (
              <button key={g.id} className={'chip' + (draf.id === g.id ? ' pilih' : '')} onClick={() => setDraf(salin(g))}>
                <Swatch w={g.warna} />
                {g.nama}
                {aktif === g.id ? <span className="tag-aktif">aktif</span> : null}
              </button>
            ))}
            {draf.id === 'baru' ? (
              <span className="chip pilih">
                <Swatch w={draf.warna} />
                {draf.nama} <span className="tag-aktif">belum disimpan</span>
              </span>
            ) : null}
          </div>
          <button className="chip tambah" onClick={gayaBaru}>
            + Gaya baru
          </button>

          <label className="label">Nama gaya</label>
          <input className="isian" value={draf.nama} disabled={draf.id === 'bawaan'} onChange={(e) => ubah((g) => (g.nama = e.target.value))} />
          <label className="label">Nama seri</label>
          <input className="isian" placeholder="Kosong = ikut nama format (mis. KITA BONGKAR)" value={draf.seri} onChange={(e) => ubah((g) => (g.seri = e.target.value.toUpperCase()))} />

          <div className="eyebrow-kecil jarak">Warna</div>
          <div className="label">Mulai dari contoh</div>
          <div className="grid-preset">
            {PRESET_WARNA.map((p) => (
              <button
                key={p.nama}
                className={'kartu-preset' + (JSON.stringify(p.warna) === JSON.stringify(w) ? ' pilih' : '')}
                onClick={() =>
                  ubah((g) => {
                    g.warna = salin(p.warna);
                    g.gelap = p.gelap;
                  })
                }
              >
                <Swatch w={p.warna} besar />
                <span>{p.nama}</span>
              </button>
            ))}
          </div>
          <div className="label">Atau dari satu warna merek</div>
          <div className="dua-kolom">
            <WarnaInput nama="Warna merek" nilai={w.merek} onUbah={(v) => ubah((g) => (g.warna = paletDariMerek(v, g.warna.sorot, g.gelap)))} />
            <WarnaInput nama="Warna sorot" nilai={w.sorot} onUbah={(v) => ubah((g) => (g.warna = paletDariMerek(g.warna.merek, v, g.gelap)))} />
          </div>
          <label className="centang">
            <input
              type="checkbox"
              checked={draf.gelap}
              onChange={(e) =>
                ubah((g) => {
                  g.gelap = e.target.checked;
                  g.warna = paletDariMerek(g.warna.merek, g.warna.sorot, g.gelap);
                })
              }
            />
            Latar gelap
          </label>
          <details className="rinci">
            <summary>Atur warna satu per satu</summary>
            <div className="dua-kolom">
              {(Object.keys(NAMA_WARNA) as (keyof Gaya['warna'])[]).map((k) => (
                <WarnaInput key={k} nama={NAMA_WARNA[k]} nilai={w[k]} onUbah={(v) => ubah((g) => (g.warna[k] = v))} />
              ))}
            </div>
          </details>

          <div className="eyebrow-kecil jarak">Huruf</div>
          <div className="grid-huruf">
            {HURUF_PILIHAN.map((h) => (
              <button key={h.kunci} className={'kartu-huruf' + (draf.huruf === h.kunci ? ' pilih' : '')} onClick={() => ubah((g) => (g.huruf = h.kunci))}>
                <span className="aa" style={{ fontFamily: huruf(h.kunci).judul, fontWeight: huruf(h.kunci).berat }}>
                  Aa Bongkar
                </span>
                <b>{h.nama}</b>
                <span className="redup kecil">{h.ket}</span>
              </button>
            ))}
          </div>

          <div className="eyebrow-kecil jarak">Bentuk</div>
          <label className="label">
            Sudut kotak: <b>{draf.bentuk.sudut === 0 ? 'tajam' : draf.bentuk.sudut + ' px'}</b>
          </label>
          <input type="range" min={0} max={28} value={draf.bentuk.sudut} onChange={(e) => ubah((g) => (g.bentuk.sudut = Number(e.target.value)))} />
          <label className="label">
            Garis tepi: <b>{draf.bentuk.outline ? draf.bentuk.outline + ' px' : 'tanpa'}</b>
          </label>
          <input type="range" min={0} max={8} value={draf.bentuk.outline} onChange={(e) => ubah((g) => (g.bentuk.outline = Number(e.target.value)))} />
          <div className="label">Bentuk label</div>
          <div className="segmen-pilih">
            {(['pil', 'kotak'] as const).map((b) => (
              <button key={b} className={draf.bentuk.label === b ? 'pilih' : ''} onClick={() => ubah((g) => (g.bentuk.label = b))}>
                {b === 'pil' ? 'Pil (bulat)' : 'Kotak'}
              </button>
            ))}
          </div>
          <label className="centang">
            <input type="checkbox" checked={draf.bentuk.bayangan} onChange={(e) => ubah((g) => (g.bentuk.bayangan = e.target.checked))} />
            Bayangan tegas
          </label>

          <div className="eyebrow-kecil jarak">Teks karaoke</div>
          <div className="label">Mulai dari contoh</div>
          <div className="grid-preset">
            {PRESET_TEKS.map((p) => (
              <button
                key={p.nama}
                className={'kartu-preset teks' + (JSON.stringify(p.teks) === JSON.stringify(draf.teks ?? null) ? ' pilih' : '')}
                onClick={() => ubah((g) => (g.teks = salin(p.teks)))}
              >
                <ContohTeks t={p.teks} />
                <span>{p.nama}</span>
              </button>
            ))}
          </div>

          <label className="label">Huruf</label>
          <select className="isian" value={T.huruf} onChange={(e) => ubahTeks((t) => (t.huruf = e.target.value as GayaTeks['huruf']))}>
            {HURUF_TEKS.map((h) => (
              <option key={h.kunci} value={h.kunci}>
                {h.nama}
              </option>
            ))}
          </select>
          <label className="label">
            Ukuran: <b>{T.ukuran}</b>
          </label>
          <input type="range" min={36} max={120} value={T.ukuran} onChange={(e) => ubahTeks((t) => (t.ukuran = Number(e.target.value)))} />
          <label className="centang">
            <input type="checkbox" checked={T.kapital} onChange={(e) => ubahTeks((t) => (t.kapital = e.target.checked))} />
            HURUF KAPITAL
          </label>

          <div className="label">Cara tampil</div>
          <div className="segmen-pilih penuh">
            {(
              [
                ['karaoke', 'Karaoke'],
                ['muncul', 'Muncul per kata'],
                ['statis', 'Diam'],
              ] as const
            ).map(([k, n]) => (
              <button key={k} className={T.mode === k ? 'pilih' : ''} onClick={() => ubahTeks((t) => (t.mode = k))}>
                {n}
              </button>
            ))}
          </div>
          {T.mode !== 'statis' ? (
            <>
              <div className="label">Efek kata yang sedang diucapkan</div>
              <div className="grid-efek">
                {(
                  [
                    ['warna', 'Ganti warna'],
                    ['stabilo', 'Stabilo'],
                    ['kotak', 'Kotak'],
                    ['garis-bawah', 'Garis bawah'],
                    ['membesar', 'Membesar'],
                    ['tidak', 'Tanpa efek'],
                  ] as [EfekSorot, string][]
                ).map(([k, n]) => (
                  <button key={k} className={'kartu-efek' + (T.efek === k ? ' pilih' : '')} onClick={() => ubahTeks((t) => (t.efek = k))}>
                    <ContohEfek efek={k} t={T} />
                    <span>{n}</span>
                  </button>
                ))}
              </div>
              <div className="dua-kolom" style={{ marginTop: 10 }}>
                <WarnaInput nama={T.efek === 'stabilo' ? 'Warna stabilo' : 'Warna sorot'} nilai={T.warnaSorot} onUbah={(v) => ubahTeks((t) => (t.warnaSorot = v))} />
                {T.efek === 'stabilo' || T.efek === 'kotak' ? <WarnaInput nama="Huruf di sorot" nilai={T.warnaTeksSorot} onUbah={(v) => ubahTeks((t) => (t.warnaTeksSorot = v))} /> : null}
              </div>
            </>
          ) : null}

          <div className="label">Warna & tepi huruf</div>
          <div className="dua-kolom">
            <WarnaInput nama="Warna teks" nilai={T.warna} onUbah={(v) => ubahTeks((t) => (t.warna = v))} />
            <WarnaInput nama="Warna tepi" nilai={T.garis.warna} onUbah={(v) => ubahTeks((t) => (t.garis.warna = v))} />
          </div>
          <label className="label">
            Tebal tepi: <b>{T.garis.tebal ? T.garis.tebal + ' px' : 'tanpa'}</b>
          </label>
          <input type="range" min={0} max={18} value={T.garis.tebal} onChange={(e) => ubahTeks((t) => (t.garis.tebal = Number(e.target.value)))} />
          <label className="centang">
            <input type="checkbox" checked={T.bayangan} onChange={(e) => ubahTeks((t) => (t.bayangan = e.target.checked))} />
            Bayangan
          </label>
          <label className="centang">
            <input type="checkbox" checked={T.latarBaris.aktif} onChange={(e) => ubahTeks((t) => (t.latarBaris.aktif = e.target.checked))} />
            Kotak di belakang baris
          </label>
          {T.latarBaris.aktif ? (
            <div className="dua-kolom" style={{ marginTop: 8, alignItems: 'center' }}>
              <WarnaInput nama="Warna kotak" nilai={T.latarBaris.warna} onUbah={(v) => ubahTeks((t) => (t.latarBaris.warna = v))} />
              <input type="range" min={10} max={100} value={Math.round(T.latarBaris.opasitas * 100)} onChange={(e) => ubahTeks((t) => (t.latarBaris.opasitas = Number(e.target.value) / 100))} title="Kepekatan kotak" />
            </div>
          ) : null}

          <div className="label">Kata kunci (*kata*)</div>
          <div className="segmen-pilih">
            {(
              [
                ['warna', 'Berwarna'],
                ['stabilo', 'Stabilo'],
                ['tidak', 'Biasa'],
              ] as const
            ).map(([k, n]) => (
              <button key={k} className={T.kataKunci === k ? 'pilih' : ''} onClick={() => ubahTeks((t) => (t.kataKunci = k))}>
                {n}
              </button>
            ))}
          </div>
          {T.kataKunci !== 'tidak' ? (
            <div style={{ marginTop: 8 }}>
              <WarnaInput nama="Warna kata kunci" nilai={T.warnaKunci} onUbah={(v) => ubahTeks((t) => (t.warnaKunci = v))} />
            </div>
          ) : null}

          <label className="label">
            Kata per baris: <b>{T.kataPerBaris}</b>
          </label>
          <input type="range" min={1} max={7} value={T.kataPerBaris} onChange={(e) => ubahTeks((t) => (t.kataPerBaris = Number(e.target.value)))} />
          <label className="label">
            Posisi: <b>{Math.round(T.posisi * 100)}% dari atas</b>
          </label>
          <input type="range" min={45} max={92} value={Math.round(T.posisi * 100)} onChange={(e) => ubahTeks((t) => (t.posisi = Number(e.target.value) / 100))} />
          <div className="label">Animasi baris baru</div>
          <div className="segmen-pilih">
            {(
              [
                ['pop', 'Pop'],
                ['naik', 'Naik'],
                ['fade', 'Pudar'],
                ['tidak', 'Tanpa'],
              ] as const
            ).map(([k, n]) => (
              <button key={k} className={T.masuk === k ? 'pilih' : ''} onClick={() => ubahTeks((t) => (t.masuk = k))}>
                {n}
              </button>
            ))}
          </div>

          <div className="eyebrow-kecil jarak">Logo</div>
          {draf.logo?.file ? (
            <div className="logo-baris">
              <img src={`/gaya-media/${draf.logo.file}`} alt="logo" />
              <button className="tombol" onClick={() => ubah((g) => (g.logo = null))}>
                Hapus logo
              </button>
            </div>
          ) : null}
          <label className="tombol unggah">
            {draf.logo?.file ? 'Ganti logo' : 'Unggah logo (PNG/SVG)'}
            <input type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" hidden onChange={(e) => e.target.files?.[0] && unggahLogo(e.target.files[0])} />
          </label>
          {draf.logo ? (
            <>
              <div className="label">Posisi</div>
              <select className="isian" value={draf.logo.posisi} onChange={(e) => ubah((g) => (g.logo!.posisi = e.target.value as any))}>
                <option value="kanan-atas">Kanan atas</option>
                <option value="kiri-atas">Kiri atas</option>
                <option value="kanan-bawah">Kanan bawah</option>
                <option value="kiri-bawah">Kiri bawah</option>
              </select>
              <label className="label">
                Ukuran: <b>{Math.round(draf.logo.ukuran * 100)}%</b>
              </label>
              <input type="range" min={6} max={35} value={Math.round(draf.logo.ukuran * 100)} onChange={(e) => ubah((g) => (g.logo!.ukuran = Number(e.target.value) / 100))} />
            </>
          ) : null}
        </div>
        <div className="kaki-panel">
          <button className="tombol utama" onClick={() => simpan(true)}>
            Simpan & pakai
          </button>
          <button className="tombol" onClick={() => simpan(false)}>
            Simpan
          </button>
          <button className="tombol" onClick={hapus} disabled={draf.id === 'bawaan' || draf.id === 'baru'}>
            Hapus
          </button>
          {pesan ? <span className="redup kecil">{pesan}</span> : null}
        </div>
      </aside>

      <section className="panel pratinjau">
        <div className="pratinjau-kepala">
          <b>Pratinjau</b>
          {masalah.length ? <span className="peringatan">{masalah.join(' · ')}</span> : <span className="redup">Semua teks mudah dibaca</span>}
          <button className="tombol kecil kanan-auto" onClick={() => setPutar((v) => !v)}>
            {putar ? 'Gambar diam' : 'Putar animasi'}
          </button>
        </div>
        <div className="pratinjau-grid">
          {putar ? (
            <div className="bingkai lebar">
              <Player
                component={VideoUtama}
                inputProps={{ spec, basis: '/' }}
                durationInFrames={totalFrame(spec)}
                fps={30}
                compositionWidth={1080}
                compositionHeight={1920}
                style={{ width: '100%', aspectRatio: '9 / 16' }}
                autoPlay
                loop
                controls
              />
            </div>
          ) : (
            [30, frame2].map((f) => (
              <div className="bingkai" key={f}>
                <Thumbnail
                  component={VideoUtama}
                  inputProps={{ spec, basis: '/' }}
                  frameToDisplay={f}
                  durationInFrames={totalFrame(spec)}
                  fps={30}
                  compositionWidth={1080}
                  compositionHeight={1920}
                  style={{ width: '100%', aspectRatio: '9 / 16' }}
                />
              </div>
            ))
          )}
        </div>
        <div className="pratinjau-teks">
          <div className="pratinjau-kepala">
            <b>Teks karaoke</b>
            <span className="redup">Kata menyala mengikuti suara</span>
          </div>
          <div className="bingkai teks">
            <Player
              component={PratinjauTeks}
              inputProps={{ gaya: draf }}
              durationInFrames={216}
              fps={30}
              compositionWidth={1080}
              compositionHeight={560}
              style={{ width: '100%', aspectRatio: '1080 / 560' }}
              autoPlay
              loop
            />
          </div>
        </div>
      </section>
    </main>
  );
}

/** Contoh mini gaya teks untuk kartu preset. */
function ContohTeks({ t }: { t: GayaTeks }) {
  const f = hurufTeks(t.huruf, 'tegas');
  const sorot: React.CSSProperties =
    t.mode === 'statis'
      ? { color: t.warnaKunci }
      : t.efek === 'stabilo'
        ? { background: `linear-gradient(transparent 15%, ${t.warnaSorot} 15%, ${t.warnaSorot} 88%, transparent 88%)`, color: t.warnaTeksSorot, WebkitTextStroke: 0 }
        : t.efek === 'kotak'
          ? { background: t.warnaSorot, color: t.warnaTeksSorot, borderRadius: 4, WebkitTextStroke: 0 }
          : t.efek === 'garis-bawah'
            ? { borderBottom: `3px solid ${t.warnaSorot}` }
            : { color: t.warnaSorot };
  return (
    <span
      className="contoh-teks"
      style={{
        fontFamily: f.keluarga,
        fontWeight: f.berat,
        color: t.warna,
        textTransform: t.kapital ? 'uppercase' : undefined,
        WebkitTextStroke: t.garis.tebal ? `${Math.min(3, t.garis.tebal / 4)}px ${t.garis.warna}` : undefined,
        paintOrder: 'stroke fill',
        background: t.latarBaris.aktif ? t.latarBaris.warna : '#6b7280',
      }}
    >
      Aa <span style={{ padding: '0 2px', ...sorot }}>Bongkar</span>
    </span>
  );
}

function ContohEfek({ efek, t }: { efek: EfekSorot; t: GayaTeks }) {
  return <ContohTeks t={{ ...t, mode: efek === 'tidak' ? 'statis' : 'karaoke', efek, warnaKunci: efek === 'tidak' ? t.warna : t.warnaKunci }} />;
}

function Swatch({ w, besar }: { w: Gaya['warna']; besar?: boolean }) {
  return (
    <span className={'swatch' + (besar ? ' besar' : '')}>
      {[w.latar, w.merek, w.sorot, w.teks].map((c, i) => (
        <i key={i} style={{ background: c }} />
      ))}
    </span>
  );
}

function WarnaInput({ nama, nilai, onUbah }: { nama: string; nilai: string; onUbah: (v: string) => void }) {
  return (
    <label className="warna-input">
      <input type="color" value={nilai} onChange={(e) => onUbah(e.target.value)} />
      <span>{nama}</span>
    </label>
  );
}
