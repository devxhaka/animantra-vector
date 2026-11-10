import React from 'react';
import { api, usePolling, type Status } from './api';
import type { Job, VideoMeta } from '../../shared/tipe';

type DataStudio = {
  status: Status | null;
  videos: VideoMeta[] | null;
  jobs: Job[] | null;
  muatVideo: () => void;
  muatJobs: () => void;
  /** job aktif (antre/dikerjakan) untuk sebuah video, bila ada */
  jobAktif: (slug: string) => Job | undefined;
};
const Ctx = React.createContext<DataStudio | null>(null);
export const useData = () => React.useContext(Ctx)!;

/** Satu sumber polling untuk semua halaman (tidak diulang tiap pindah halaman). */
export function PenyediaData({ children }: { children: React.ReactNode }) {
  const [status] = usePolling(api.status, 3000);
  const [videos, muatVideo] = usePolling(api.videos, 6000);
  const [jobs, muatJobs] = usePolling(api.jobs, 1500);
  // muat ulang riwayat saat status job berubah (mis. aktif → selesai)
  const kunciLalu = React.useRef('');
  React.useEffect(() => {
    const kunci = (jobs ?? []).map((j) => j.id + j.status).join();
    if (kunciLalu.current && kunci !== kunciLalu.current) muatVideo();
    kunciLalu.current = kunci;
  }, [jobs, muatVideo]);
  const jobAktif = React.useCallback((slug: string) => (jobs ?? []).find((j) => j.slug === slug && (j.status === 'antre' || j.status === 'dikerjakan')), [jobs]);
  return <Ctx.Provider value={{ status, videos, jobs, muatVideo, muatJobs, jobAktif }}>{children}</Ctx.Provider>;
}
