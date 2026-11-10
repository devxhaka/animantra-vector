// Mode Tempel: video dibuat lewat chat AI gratis apa saja (Gemini web, ChatGPT
// gratis, Claude gratis) dengan salin-tempel, tanpa agen lokal.
// - buatPromptTempel(): prompt yang disalin dari studio → ditempel ke chat.
// - uraiTempelan(): hasil chat (spec.json + SVG aset + caption) → berkas video.
//
// Dipakai server (server/server.ts) dan diuji di scripts/uji.ts. Format output
// yang diminta ke chat: satu blok ```json (spec), satu blok ```svg per aset,
// satu blok ```text (caption).

import type { FormatDef, Gaya, Karakter, Spec } from './tipe';

export type MasukanPrompt = {
  format: FormatDef;
  topik: string;
  durasiTarget: number;
  gaya: Gaya;
  suara: string;
  musik: string;
  pemeran?: Karakter[];
  sudut?: string;
  nuansa?: string;
  misteri?: boolean;
};

/** Prompt lengkap untuk ditempel ke chat AI gratis. */
export function buatPromptTempel(m: MasukanPrompt): string {
  const baris: string[] = [];
  baris.push('Kamu adalah penulis naskah video animasi vertikal 9:16 (1080x1920) untuk Animantra Studio.');
  baris.push('');
  baris.push(`Format: ${m.format.nama} (${m.format.kunci})`);
  baris.push(`Panduan format: ${m.format.panduan}`);
  baris.push(`Topik: ${m.topik}`);
  baris.push(`Durasi target: ${m.durasiTarget} detik (total durasi adegan sebaiknya dalam ±15% dari target).`);
  baris.push(`Suara narasi: ${m.suara} (sudah diatur di studio, jangan tulis di spec).`);
  baris.push(`Musik: ${m.musik === 'tanpa' ? 'tanpa musik (musik: null)' : m.musik === 'otomatis' ? 'pilih yang cocok dari daftar ini bila ada, kalau tidak ada tulis null' : m.musik}.`);
  if (m.pemeran?.length) {
    baris.push('');
    baris.push('Pemeran (tokoh dirender otomatis dari data ini, JANGAN digambar sebagai aset):');
    for (const p of m.pemeran)
      baris.push(`- ${p.id} (${p.nama}): ${p.peran}. Suara tokoh sudah diatur di studio.`);
    baris.push(`Sudut cerita: ${m.sudut ?? 'dialog'}.${m.nuansa ? ` Nuansa: ${m.nuansa}.` : ''}`);
    baris.push('Satu adegan = satu baris dialog/narasi. Isi "pembicara" dengan id tokoh atau "narator".');
  }
  if (m.misteri) {
    baris.push('');
    baris.push('Format ini wajib riset bersumber: sertakan juga satu blok ```md dengan judul "# Riset" dan bagian ## Fakta terverifikasi, ## Hipotesis, ## Legenda, ## Spekulasi, ## Tidak diketahui, ## Sumber (minimal satu tautan). Bedakan fakta, hipotesis, legenda, dan spekulasi; JANGAN pernah menyajikan spekulasi sebagai fakta dan JANGAN mengarang kutipan.');
  }
  if (m.format.kunci === 'pov-bayangkan') {
    baris.push('');
    baris.push('Field khusus format ini (semua opsional, per adegan): "cap" (label kecil kiri atas, misal "SEBELUMNYA…"), "kartuWaktu" {"label":"HARI KETIGA","jam":"11:51","hilang":3.8}, "kartuPenutup" {"atas":"BAYANGKAN","judul":"<judul seri>","bawah":"BERSAMBUNG"} (hanya adegan terakhir), "filter": "kilas-balik" | "hitam-putih", "pudarAkhir": 1.2 (detik memudar ke hitam di akhir), "transisi": "hitam". Di spec: "episode": <nomor>. Jangan pakai "cap" dan "kartuWaktu" di adegan yang sama.');
  }
  baris.push('');
  baris.push('ATURAN NASKAH:');
  baris.push('- Bahasa Indonesia santai dan jelas, gaya kreator edukasi. Hook berupa pertanyaan di 3 detik pertama.');
  baris.push('- ±2,5 kata per detik bicara. Satu adegan = satu ide, 6-16 kata, durasi 2,5-7 detik.');
  baris.push('- Tandai 1-2 kata kunci per adegan dengan *kata* (disorot di subtitle).');
  baris.push('- Judul maksimal ±32 karakter dan memancing rasa penasaran. "judulSorot" harus potongan persis dari judul.');
  baris.push('- JANGAN mengarang angka, tanggal, atau kutipan. Kalau tidak yakin dengan sebuah fakta, tulis kalimat yang aman tanpa angka spesifik.');
  baris.push('- Koordinat 0..1 relatif kanvas (x dari kiri, y dari atas). Zona aman: judul 8-30% atas, subtitle 82-88%, kartu 72-78%. Benda utama sebaiknya di y 0,35-0,7. Kamera: zoom > 1 mendekat, hindari zoom > 1,6.');
  baris.push('- "gaya" di bawah ini WAJIB disalin apa adanya ke dalam spec (jangan diubah).');
  baris.push('- "musik": null kalau tanpa musik, atau {"file": "musik/<nama file>", "volume": 0.12}.');
  baris.push('- Setiap aset visual harus ada blok SVG-nya sendiri (lihat bawah). SVG wajib punya viewBox, TANPA elemen <text> dan TANPA gambar eksternal. Nama file aset di spec harus sama persis dengan nama di blok SVG.');
  baris.push('');
  baris.push('GAYA (salin apa adanya ke field "gaya" di spec):');
  baris.push('```json');
  baris.push(JSON.stringify(m.gaya));
  baris.push('```');
  baris.push('');
  baris.push('CONTOH STRUKTUR SPEC (ikuti bentuk ini, isi dengan topik di atas):');
  baris.push('```json');
  baris.push(
    JSON.stringify(
      {
        versi: 1,
        format: m.format.kunci,
        judul: 'Judul yang memancing penasaran',
        judulSorot: 'penasaran',
        fps: 30,
        lebar: 1080,
        tinggi: 1920,
        gaya: m.gaya,
        musik: null,
        adegan: [
          {
            id: 'hook',
            narasi: 'Hook berupa pertanyaan dengan *kata* kunci?',
            durasi: 3.5,
            tampilJudul: true,
            teksBesar: 'KLIK!',
            transisi: 'potong',
            kamera: { dari: { zoom: 1 }, ke: { zoom: 1.2 } },
            aset: [{ file: 'aset/benda.svg', x: 0.5, y: 0.6, lebar: 0.9, rotasi: 0, masuk: 'pop', loop: 'melayang' }],
            label: [{ teks: 'Pegas', x: 0.42, y: 0.56, arah: 'kiri', muncul: 0.7 }],
            kartu: { tag: 'Baik', teks: 'Ujung keluar', nilai: '+4 mm' },
            sfx: [{ file: 'sfx/klik.wav', pada: 0.5, volume: 0.6 }],
          },
        ],
      },
      null,
      2,
    ),
  );
  baris.push('```');
  baris.push('');
  baris.push('JAWAB HANYA dengan blok-blok berikut, tanpa penjelasan di luar blok:');
  baris.push('1. Satu blok ```json berisi spec lengkap (field "gaya" = gaya di atas, "musik" sesuai aturan).');
  baris.push('2. Satu blok ```svg untuk SETIAP aset yang dirujuk di spec. Baris pertama blok harus komentar `<!-- file: aset/nama.svg -->`. Kalau sebuah adegan tidak butuh gambar (hanya teks/kartu), tidak perlu blok SVG untuk adegan itu.');
  baris.push('3. Satu blok ```text berisi caption dengan format:');
  baris.push('```text');
  baris.push('=== CAPTION UTAMA ===');
  baris.push('<kalimat hook + emoji>');
  baris.push('');
  baris.push('<2-4 baris penjelasan / poin bernomor>');
  baris.push('');
  baris.push('<ajakan komentar>');
  baris.push('');
  baris.push('=== HASHTAG ===');
  baris.push('#... (5-8 hashtag relevan)');
  baris.push('```');
  return baris.join('\n');
}

// ---------------------------------------------------------------------------

export type HasilTempelan = {
  spec: Spec | null;
  aset: { file: string; isi: string }[];
  caption: string;
  riset: string;
  galat: string[];
};

/** Ambil semua blok kode ```bahasa ... ``` dari teks tempelan. */
function blokKode(teks: string): { bahasa: string; isi: string }[] {
  const hasil: { bahasa: string; isi: string }[] = [];
  const pola = /```(\w*)\s*\n([\s\S]*?)```/g;
  let cocok: RegExpExecArray | null;
  while ((cocok = pola.exec(teks)) !== null) hasil.push({ bahasa: (cocok[1] || '').toLowerCase(), isi: cocok[2].trim() });
  return hasil;
}

/**
 * Urai hasil tempelan dari chat gratis. Menerima: blok json (spec), blok svg
 * (satu per aset, nama dari `<!-- file: ... -->`), blok text (caption), dan
 * blok md riset (format Mystery). Mengembalikan galat yang bisa dibaca pengguna
 * bila spec tidak ditemukan / bukan JSON valid.
 */
export function uraiTempelan(teks: string): HasilTempelan {
  const hasil: HasilTempelan = { spec: null, aset: [], caption: '', riset: '', galat: [] };
  const blok = blokKode(teks);
  if (!blok.length) {
    hasil.galat.push('Tidak ada blok kode (```) yang ditemukan. Tempel jawaban chat apa adanya, termasuk blok ```json, ```svg, dan ```text.');
    return hasil;
  }
  let nomorAset = 0;
  for (const b of blok) {
    if (b.bahasa === 'json') {
      if (hasil.spec) continue; // blok json pertama = spec; blok json gaya di prompt tidak ikut ditempel
      try {
        const data = JSON.parse(b.isi);
        if (data && typeof data === 'object' && Array.isArray((data as Spec).adegan)) hasil.spec = data as Spec;
        else hasil.galat.push('Blok ```json ditemukan tapi isinya bukan spec video (tidak ada daftar "adegan").');
      } catch (e) {
        hasil.galat.push('Blok ```json bukan JSON valid: ' + (e as Error).message);
      }
    } else if (b.bahasa === 'svg') {
      const nama = b.isi.match(/<!--\s*file:\s*([^\s]+)\s*-->/)?.[1] ?? `aset/aset-${++nomorAset}.svg`;
      hasil.aset.push({ file: nama, isi: b.isi });
    } else if (b.bahasa === 'text' || b.bahasa === 'caption') {
      if (!hasil.caption) hasil.caption = b.isi;
    } else if (b.bahasa === 'md' || b.bahasa === 'markdown') {
      if (!hasil.riset && /^#\s+riset/im.test(b.isi)) hasil.riset = b.isi;
    }
  }
  if (!hasil.spec && !hasil.galat.length)
    hasil.galat.push('Blok ```json dengan spec video tidak ditemukan. Pastikan chat menjawab dengan satu blok ```json berisi spec lengkap.');
  return hasil;
}
