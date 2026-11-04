import React from 'react';
import { api, suaraBisaDipakai, useOpsi } from '../api';
import { PilihSuara } from './PilihSuara';
import { TAHAP, type Job } from '../../../shared/tipe';
import { formatDari } from '../../../shared/formats';

const STATUS: Record<Job['status'], string> = {
  antre: 'menunggu Claude',
  dikerjakan: 'dikerjakan',
  selesai: 'selesai',
  gagal: 'gagal',
  dibatalkan: 'dibatalkan',
};
const JENIS: Record<Job['jenis'], string> = { baru: '', revisi: 'Revisi · ', 'render-ulang': 'Render ulang · ' };

export function KartuProgres({ job, terhubung, onBerubah }: { job: Job; terhubung: boolean; onBerubah: () => void }) {
  const [logPenuh, setLogPenuh] = React.useState(false);
  const opsi = useOpsi();
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
  const labelTahap = (k: string, l: string) => (job.form.format === 'cerita' && k === 'model' ? 'Tokoh & latar' : l);

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
          terhubung ? (
            'Menunggu giliran…'
          ) : (
            <>Menunggu Claude. Ketik <b>buka studio</b> di Claude (tab Code).</>
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
