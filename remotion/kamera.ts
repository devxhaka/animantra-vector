// Kamera sinematik (Phase C): fungsi murni, dipakai renderer & uji.

/** Guncangan kamera genggam: jumlah sinus tak sebanding (halus, deterministik). k = 0 → tepat nol. */
export function goyangKamera(k: number, t: number) {
  if (!k) return { x: 0, y: 0, r: 0 };
  return {
    x: k * (Math.sin(t * 1.7) * 9 + Math.sin(t * 2.9 + 1) * 5),
    y: k * (Math.sin(t * 1.3 + 2) * 7 + Math.sin(t * 3.7) * 4),
    r: k * Math.sin(t * 1.1 + 0.5) * 0.45,
  };
}

/**
 * Parallax: lapisan di kedalaman p digerakkan kamera sebesar p (zoom 1+(Z-1)p, geser p·k) walau berada
 * di dalam dunia yang sudah ditransformasi kamera. Koreksi C = T⁻¹∘Tₚ (lihat panduan). p kosong/1 → tanpa pembungkus.
 */
export function transformParallax(p: number, kam: { Z: number; kx: number; ky: number }, width: number, height: number) {
  const Zp = 1 + (kam.Z - 1) * p;
  return `translate(${kam.kx * width}px, ${kam.ky * height}px) scale(${Zp / kam.Z}) translate(${-p * kam.kx * width}px, ${-p * kam.ky * height}px)`;
}
