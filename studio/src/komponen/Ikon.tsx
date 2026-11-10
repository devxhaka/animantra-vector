import React from 'react';

// Ikon garis sederhana (24×24, stroke = currentColor). Tanpa library tambahan.
const JALUR: Record<string, React.ReactNode> = {
  beranda: <path d="M3 10.5 12 3l9 7.5V21h-6v-6H9v6H3z" />,
  buat: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v8M8 12h8" />
    </>
  ),
  riwayat: (
    <>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="m10 9 5 3-5 3z" />
    </>
  ),
  seri: (
    <>
      <rect x="3" y="6" width="6" height="12" rx="1.5" />
      <rect x="10.5" y="6" width="6" height="12" rx="1.5" />
      <path d="M19 7v10" />
    </>
  ),
  gaya: (
    <>
      <path d="M12 3a9 9 0 1 0 0 18c1.1 0 1.6-.8 1.6-1.6 0-1.3-1.1-1.6-1.1-2.6 0-.9.7-1.6 1.6-1.6H17a4 4 0 0 0 4-4C21 6.6 17 3 12 3z" />
      <circle cx="7.5" cy="11" r="1.2" />
      <circle cx="10.5" cy="7.5" r="1.2" />
      <circle cx="15" cy="7.8" r="1.2" />
    </>
  ),
  karakter: (
    <>
      <circle cx="12" cy="7.5" r="4" />
      <path d="M4 21c.8-4.2 4-6.5 8-6.5s7.2 2.3 8 6.5" />
    </>
  ),
  kembali: <path d="M15 5 8 12l7 7" />,
  kanan: <path d="m9 5 7 7-7 7" />,
  tutup: <path d="M6 6l12 12M18 6 6 18" />,
  unduh: <path d="M12 4v11m-5-5 5 5 5-5M5 20h14" />,
  salin: (
    <>
      <rect x="8" y="8" width="12" height="12" rx="2" />
      <path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3" />
    </>
  ),
  centang: <path d="m5 12.5 4.5 4.5L19 7.5" />,
  petir: <path d="M13 3 5 14h6l-1 7 8-11h-6z" />,
  cari: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </>
  ),
  ulang: <path d="M4 12a8 8 0 1 0 2.4-5.7M4 4v4.5h4.5" />,
  pensil: <path d="M4 20h4L19 9l-4-4L4 16zM13.5 6.5l4 4" />,
  info: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v6M12 7.5v.5" />
    </>
  ),
};

export function Ikon({ nama, ukuran = 20, className }: { nama: keyof typeof JALUR | string; ukuran?: number; className?: string }) {
  return (
    <svg className={className} width={ukuran} height={ukuran} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {JALUR[nama] ?? null}
    </svg>
  );
}
