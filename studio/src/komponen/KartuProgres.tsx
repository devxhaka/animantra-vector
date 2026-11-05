import React from 'react';
import { api, suaraBisaDipakai, useOpsi } from '../api';
import { PilihSuara } from './PilihSuara';
import { TAHAP, type Job } from '../../../shared/tipe';
import { formatBertokoh, formatDari } from '../../../shared/formats';

const STATUS: Record<Job['status'], string> = {
  antre: 'menunggu agen',
  dikerjakan: 'dikerjakan',
  selesai: 'selesai',
  gagal: 'gagal',
  dibatalkan: 'dibatalkan',
};
const JENIS: Record<Job['jenis'], string> = { baru: '', revisi: 'Revisi · ', 'render-ulang': 'Render ulang · ' };

export function KartuProgres({ job, terhubung, onBerubah }: { job: Job; terhubung: boolean; onBerubah: () => void }) {
  const [logPenuh, setLogPenuh] = React.useState(false);
  const [tempelBuka, setTempelBuka] = React.useState(false);
  const [tempelan, setTempelan] = React.useState('');
  const [tempelGalat, setTempelGalat] = React.useState('');
  const [tempelSaran, setTempelSaran] = React.useState<string[]>([]);
  const [tempelKirim, setTempelKirim] = React.useState(false);
  const [salin, setSalin] = React.useState('');
  const opsi = useOpsi();
  const bisaTempel = job.jenis === 'baru' && job.status === 'antre';
  const siapRenderLokal = job.mode === 'tempel' && job.tahap.naskah === 'selesai' && job.status !== 'selesai';

  const salinPrompt = async () => {
    setTempelGalat('');
    try {
      const { prompt } = await api.promptTempel(job.id);
      await navigator.clipboard.writeText(prompt);
      setSalin('Prompt disalin — tempel ke Gemini / ChatGPT / Claude gratis ✓');
      setTimeout(() => setSalin(''), 4000);
    } catch (e) {
      setTempelGalat((e as Error).message);
    }
  };
  const kirimTempelan = async () => {
    setTempelGalat('');
    setTempelSaran([]);
    if (!tempelan.trim()) return setTempelGalat('Tempel dulu jawaban dari chat.');
    setTempelKirim(true);
    try {
      const r = await api.tempel(job.id, tempelan);
      setTempelSaran(r.saran);
      setTempelBuka(false);
      setTempelan('');
      onBerubah();
    } catch (e) {
      setTempelGalat((e as Error).message);
    } finally {
      setTempelKirim(false);
    }
  };
  const gagalSuara = job.status === 'gagal' && job.tahap.suara !== 'selesai' && job.tahap.naskah === 'selesai';
  const [suara, setSuara] = React.useState('');
  React.useEffect(() => {
    const semua = suaraBisaDipakai(opsi);
    setSuara(semua.includes(job.form.suara) ? job.form.suara : semua[0] ?? '');
  }, [opsi, job.form.suara]);
  const aktif = job.tahapAktif ? TAHAP.find((t) => t.kunci === job.tahapAktif) : null;
  const selesaiN = TAHAP.filter((t) => job.tahap[t.kunci] === 'selesai' || job.tahap[t.kunci] === 'lewati').length;
  const persenTotal = job.persen != null ? job.persen : Math.round((selesaiN / TAHAP.length) * 100);
  const log = [...job.log].reverse();
  const berakhir = job.status === 'gagal' || job.status === 'dibatalkan';
  const labelTahap = (k: string, l: string) => (formatBertokoh(job.form.format) && k === 'model' ? 'Tokoh & latar' : l);

  return (
    <div className={'panel kartu-progres' + (berakhir ? ' berakhir' : '')}>
      <div className="kp-kepala">
        <b>{job.judul}</b>
        <span className="redup">
          {JENIS[job.jenis]}
          {formatDari(job.form.format).nama} · {STATUS[job.status]}
        </span>
      </div>
      <div className="segmen">
        {TAHAP.map((t) => (
          <div key={t.kunci} className={'seg ' + job.tahap[t.kunci]} title={labelTahap(t.kunci, t.label)} />
        ))}
      </div>
      <div className="kp-tahap">
        {job.status === 'antre' ? (
          job.mode === 'tempel' ? (
            <>Naskah ditempel — siap render di komputer ini.</>
          ) : terhubung ? (
            'Menunggu giliran…'
          ) : (
            <>Menunggu agen. Ketik <b>buka studio</b> di Claude, <b>/buka-studio</b> di Gemini — atau pakai <b>Salin prompt</b> di bawah untuk chat gratis.</>
          )
        ) : job.status === 'gagal' ? (
          <span className="galat">Gagal: {job.pesanGagal}</span>
        ) : job.status === 'dibatalkan' ? (
          'Dibatalkan'
        ) : (
          <>
            Tahap: <b>{aktif ? labelTahap(aktif.kunci, aktif.label) : 'Persiapan'}</b>
            {job.persen != null ? ` · ${job.persen}%` : ''}
          </>
        )}
      </div>
      <div className="bilah">
        <div style={{ width: `${job.status === 'antre' ? 0 : persenTotal}%` }} />
      </div>
      <ul className={'kp-log' + (logPenuh ? ' penuh' : '')}>
        {(logPenuh ? log : log.slice(0, 5)).map((l, i) => (
          <li key={i}>
            {logPenuh ? <span className="redup">{new Date(l.waktu).toLocaleTimeString('id-ID')} · </span> : null}
            {l.teks}
          </li>
        ))}
      </ul>
      {gagalSuara ? (
        <div className="ulang-suara">
          <span className="label">Ulangi dengan suara (naskah tetap dipakai):</span>
          <PilihSuara opsi={opsi} nilai={suara} onUbah={setSuara} />
        </div>
      ) : null}
      {bisaTempel ? (
        <div className="tempel">
          <div className="label">Tanpa langganan? Pakai chat gratis (Mode Tempel):</div>
          <div className="baris-tombol">
            <button className="tombol" onClick={salinPrompt}>
              Salin prompt
            </button>
            <button className="tombol" onClick={() => setTempelBuka((v) => !v)}>
              {tempelBuka ? 'Tutup' : 'Tempel hasil'}
            </button>
          </div>
          {salin ? <p className="catatan">{salin}</p> : null}
          {tempelBuka ? (
            <div className="tempel-form">
              <textarea
                className="isian"
                rows={8}
                placeholder="Tempel jawaban dari Gemini / ChatGPT / Claude di sini (blok ```json spec, ```svg aset, ```text caption)…"
                value={tempelan}
                onChange={(e) => setTempelan(e.target.value)}
              />
              <div className="baris-tombol">
                <button className="tombol utama" onClick={kirimTempelan} disabled={tempelKirim}>
                  {tempelKirim ? 'Memeriksa…' : 'Simpan & cek'}
                </button>
              </div>
              <p className="catatan">Alurnya: salin prompt → tempel ke chat gratis → salin jawabannya → tempel di sini → render di komputer ini.</p>
            </div>
          ) : null}
          {tempelGalat ? <p className="galat">{tempelGalat}</p> : null}
        </div>
      ) : null}
      {tempelSaran.length ? <p className="catatan">Catatan: {tempelSaran.join(' · ')}</p> : null}
      {siapRenderLokal ? (
        <div className="baris-tombol">
          <button className="tombol utama" disabled={job.status === 'dikerjakan'} onClick={() => api.renderLokal(job.id).then(onBerubah).catch((e) => setTempelGalat((e as Error).message))}>
            {job.status === 'dikerjakan' ? 'Merender…' : 'Render di komputer ini'}
          </button>
        </div>
      ) : null}
      <div className="baris-tombol">
        <button className="tombol" onClick={() => setLogPenuh((v) => !v)}>
          {logPenuh ? 'Ringkas' : 'Log'}
        </button>
        {berakhir ? (
          <>
            <button className="tombol utama" onClick={() => api.ulangi(job.id, gagalSuara ? suara : undefined).then(onBerubah)}>
              Ulangi
            </button>
            <button className="tombol" onClick={() => api.tutupJob(job.id).then(onBerubah)}>
              Tutup
            </button>
          </>
        ) : (
          <button
            className="tombol"
            onClick={() => {
              if (confirm('Batalkan pekerjaan ini?')) api.batal(job.id).then(onBerubah);
            }}
          >
            Batalkan
          </button>
        )}
      </div>
    </div>
  );
}
