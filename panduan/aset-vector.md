# Gaya aset: ilustrasi vector bergaya 3D

Semua aset adalah **SVG buatan Claude** di `videos/<slug>/aset/`. Targetnya: ilustrasi flat
dengan kesan volume (2.5D) seperti poster edukasi. Bukan render 3D, bukan foto.

## Aturan wajib
- Wajib `viewBox`. Tanpa `width/height` tetap, tanpa `<text>` (teks pakai label spec),
  tanpa gambar eksternal, tanpa font.
- Garis tepi gelap tegas: `stroke="#1d1d1f"`, tebal **6–9** di viewBox ±1000, `stroke-linejoin="round"`.
- Setiap permukaan pakai **3 nada**: warna dasar, sisi bayangan (±25% lebih gelap) sebagai
  potongan bentuk di sisi bawah/kanan, dan satu **kilau** tipis (±25% lebih terang) di sisi atas.
  Gradien boleh, tapi lebih baik blok warna rata.
- Sudut pandang **3/4 atau isometrik ringan**. Silinder = persegi panjang membulat + elips
  ujung; kotak = 3 sisi (depan, atas lebih terang, samping lebih gelap).
- Bayangan jatuh: elips hitam `opacity 0.08–0.14` di bawah benda.
- Bentuk sederhana dan terbaca di layar HP: detail kecil < 12 unit viewBox dihapus.
- Palet benda **tidak** wajib ikut gaya (warna asli benda boleh), tapi aksen boleh memakai
  `warna.merek` / `warna.sorot` dari gaya agar senada.
- Komponen dalam (cutaway): badan luar dibuat transparan (`fill-opacity 0.15–0.3`) agar bagian
  dalam terlihat. Bagian yang bergerak dijadikan **SVG terpisah** dengan viewBox yang sama.

## Kerangka contoh
```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 600">
  <ellipse cx="500" cy="560" rx="380" ry="26" fill="#000" opacity="0.1"/>
  <g stroke="#1d1d1f" stroke-width="8" stroke-linejoin="round" stroke-linecap="round">
    <!-- badan: dasar -->
    <rect x="200" y="120" width="600" height="400" rx="40" fill="#5b8def"/>
    <!-- sisi bayangan (tanpa stroke) -->
    <rect x="212" y="420" width="576" height="88" rx="28" fill="#3e6bc4" stroke="none"/>
    <!-- kilau -->
    <rect x="240" y="146" width="420" height="22" rx="11" fill="#9bbcff" stroke="none"/>
    <!-- garis tepi digambar ulang di atas agar tegas -->
    <rect x="200" y="120" width="600" height="400" rx="40" fill="none"/>
  </g>
</svg>
```

## Alur kerja yang disarankan
1. Daftar komponen dari riset → tentukan mana yang perlu bergerak.
2. Gambar benda utuh (`<benda>.svg`) untuk hook & penutup.
3. Gambar versi potongan: `rangka.svg` (statis) + satu SVG per komponen bergerak.
4. Render `still` lalu periksa: proporsi benar? garis konsisten? terbaca di HP?
