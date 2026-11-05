import React from 'react';
import { staticFile } from 'remotion';

/** Resolver path berkas video (aset/latar/suara) → URL. Saat render: staticFile; di studio: /media/<slug>/. */
export const BerkasCtx = React.createContext<(p: string) => string>((p) => staticFile(p));
export const useBerkas = () => React.useContext(BerkasCtx);
