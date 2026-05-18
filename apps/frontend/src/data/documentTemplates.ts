/**
 * Document Templates
 *
 * Template dokumen dengan format HTML inline styles
 * Mirip dengan format output yang diinginkan
 */

export interface DocumentTemplate {
  id: string
  name: string
  category: string
  description: string
  thumbnail?: string
  content: string
}

export const documentTemplates: DocumentTemplate[] = [
  {
    id: 'surat-resmi',
    name: 'Surat Resmi',
    category: 'Administrasi',
    description: 'Template surat resmi dengan kop surat dan format formal',
    content: `
<div>
  <div style="clear:both;">
    <p style="margin-top:0pt; margin-bottom:0pt; text-align:center;">
      <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==" style="width:100px; height:100px" alt="Logo" />
    </p>
    <p style="margin-top:0pt; margin-bottom:0pt; text-align:center; font-weight:bold; font-size:16pt;">
      LEMBAGA PELATIHAN PROFESIONAL
    </p>
    <p style="margin-top:0pt; margin-bottom:0pt; text-align:center; font-size:10pt;">
      Jl. Contoh No. 123, Jakarta Pusat 10110
    </p>
    <p style="margin-top:0pt; margin-bottom:0pt; text-align:center; font-size:10pt;">
      Telp: (021) 1234567 | Email: info@contoh.com
    </p>
    <p style="margin-top:12pt; margin-bottom:12pt; border-bottom:2px solid #000000;"></p>
    
    <p style="margin-top:12pt; margin-bottom:0pt;">Nomor: 001/DIR/I/2024</p>
    <p style="margin-top:0pt; margin-bottom:0pt;">Lampiran: -</p>
    <p style="margin-top:0pt; margin-bottom:0pt;">Perihal: <strong>Undangan Pelatihan</strong></p>
    
    <p style="margin-top:24pt; margin-bottom:12pt;">
      Kepada Yth.<br/>
      Bapak/Ibu Peserta<br/>
      Di Tempat
    </p>
    
    <p style="margin-top:12pt; margin-bottom:12pt; text-align:justify;">
      Dengan hormat,
    </p>
    
    <p style="margin-top:0pt; margin-bottom:12pt; text-align:justify; text-indent:36pt;">
      Sehubungan dengan akan dilaksanakannya program pelatihan, kami mengundang Bapak/Ibu untuk mengikuti kegiatan tersebut dengan rincian sebagai berikut:
    </p>
    
    <table style="border-collapse:collapse; width:100%; margin:12pt 0pt;">
      <tr>
        <td style="border:1px solid #000000; padding:6pt; width:30%;">Hari/Tanggal</td>
        <td style="border:1px solid #000000; padding:6pt;">Senin, 15 Januari 2024</td>
      </tr>
      <tr>
        <td style="border:1px solid #000000; padding:6pt;">Waktu</td>
        <td style="border:1px solid #000000; padding:6pt;">08.00 - 16.00 WIB</td>
      </tr>
      <tr>
        <td style="border:1px solid #000000; padding:6pt;">Tempat</td>
        <td style="border:1px solid #000000; padding:6pt;">Aula Utama Gedung A</td>
      </tr>
      <tr>
        <td style="border:1px solid #000000; padding:6pt;">Acara</td>
        <td style="border:1px solid #000000; padding:6pt;">Pelatihan Manajemen Modern</td>
      </tr>
    </table>
    
    <p style="margin-top:12pt; margin-bottom:12pt; text-align:justify; text-indent:36pt;">
      Demikian surat undangan ini kami sampaikan. Atas perhatian dan kehadirannya, kami ucapkan terima kasih.
    </p>
    
    <p style="margin-top:24pt; margin-bottom:0pt; text-align:right;">
      Jakarta, 10 Januari 2024
    </p>
    <p style="margin-top:0pt; margin-bottom:0pt; text-align:right;">
      Hormat kami,
    </p>
    
    <p style="margin-top:48pt; margin-bottom:0pt; text-align:right; font-weight:bold;">
      Direktur Pelatihan
    </p>
  </div>
</div>
    `.trim(),
  },

  {
    id: 'laporan-pelatihan',
    name: 'Laporan Pelatihan',
    category: 'Pelatihan',
    description: 'Template laporan hasil pelatihan dengan tabel dan grafik',
    content: `
<div>
  <div style="clear:both;">
    <p style="margin-top:0pt; margin-bottom:0pt; text-align:center; font-weight:bold; font-size:18pt;">
      LAPORAN PELAKSANAAN PELATIHAN
    </p>
    <p style="margin-top:6pt; margin-bottom:24pt; text-align:center; font-size:14pt;">
      Periode Januari - Desember 2024
    </p>
    
    <h2 style="margin-top:18pt; margin-bottom:12pt; font-size:14pt; font-weight:bold;">
      I. PENDAHULUAN
    </h2>
    
    <p style="margin-top:0pt; margin-bottom:12pt; text-align:justify; text-indent:36pt;">
      Laporan ini disusun sebagai pertanggungjawaban pelaksanaan program pelatihan yang telah dilaksanakan pada periode Januari - Desember 2024. Program pelatihan ini bertujuan untuk meningkatkan kompetensi dan keterampilan para peserta dalam bidangnya masing-masing.
    </p>
    
    <h2 style="margin-top:18pt; margin-bottom:12pt; font-size:14pt; font-weight:bold;">
      II. DATA PELAKSANAAN
    </h2>
    
    <table style="border-collapse:collapse; width:100%; margin:12pt 0pt;">
      <thead>
        <tr style="background-color:#4472C4;">
          <th style="border:1px solid #000000; padding:8pt; color:#ffffff; font-weight:bold;">No</th>
          <th style="border:1px solid #000000; padding:8pt; color:#ffffff; font-weight:bold;">Nama Pelatihan</th>
          <th style="border:1px solid #000000; padding:8pt; color:#ffffff; font-weight:bold;">Jumlah Peserta</th>
          <th style="border:1px solid #000000; padding:8pt; color:#ffffff; font-weight:bold;">Tingkat Kelulusan</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td style="border:1px solid #000000; padding:6pt; text-align:center;">1</td>
          <td style="border:1px solid #000000; padding:6pt;">Manajemen Proyek</td>
          <td style="border:1px solid #000000; padding:6pt; text-align:center;">45</td>
          <td style="border:1px solid #000000; padding:6pt; text-align:center;">95%</td>
        </tr>
        <tr style="background-color:#F2F2F2;">
          <td style="border:1px solid #000000; padding:6pt; text-align:center;">2</td>
          <td style="border:1px solid #000000; padding:6pt;">Digital Marketing</td>
          <td style="border:1px solid #000000; padding:6pt; text-align:center;">38</td>
          <td style="border:1px solid #000000; padding:6pt; text-align:center;">92%</td>
        </tr>
        <tr>
          <td style="border:1px solid #000000; padding:6pt; text-align:center;">3</td>
          <td style="border:1px solid #000000; padding:6pt;">Leadership Development</td>
          <td style="border:1px solid #000000; padding:6pt; text-align:center;">52</td>
          <td style="border:1px solid #000000; padding:6pt; text-align:center;">98%</td>
        </tr>
        <tr style="background-color:#F2F2F2;">
          <td style="border:1px solid #000000; padding:6pt; text-align:center;">4</td>
          <td style="border:1px solid #000000; padding:6pt;">Data Analytics</td>
          <td style="border:1px solid #000000; padding:6pt; text-align:center;">30</td>
          <td style="border:1px solid #000000; padding:6pt; text-align:center;">90%</td>
        </tr>
        <tr style="font-weight:bold; background-color:#D9E1F2;">
          <td colspan="2" style="border:1px solid #000000; padding:6pt; text-align:right;">Total</td>
          <td style="border:1px solid #000000; padding:6pt; text-align:center;">165</td>
          <td style="border:1px solid #000000; padding:6pt; text-align:center;">93.75%</td>
        </tr>
      </tbody>
    </table>
    
    <h2 style="margin-top:18pt; margin-bottom:12pt; font-size:14pt; font-weight:bold;">
      III. ANALISIS HASIL
    </h2>
    
    <p style="margin-top:0pt; margin-bottom:12pt; text-align:justify; text-indent:36pt;">
      Berdasarkan data di atas, dapat disimpulkan bahwa program pelatihan berjalan dengan baik dengan tingkat kelulusan rata-rata mencapai 93.75%. Hal ini menunjukkan antusiasme dan dedikasi peserta dalam mengikuti program pelatihan.
    </p>
    
    <h3 style="margin-top:12pt; margin-bottom:8pt; font-size:12pt; font-weight:bold;">
      Poin-poin Penting:
    </h3>
    
    <ul style="margin-top:0pt; margin-bottom:12pt;">
      <li style="margin-bottom:6pt;">Total peserta yang mengikuti pelatihan: <strong>165 orang</strong></li>
      <li style="margin-bottom:6pt;">Tingkat kelulusan tertinggi: <strong>Leadership Development (98%)</strong></li>
      <li style="margin-bottom:6pt;">Program paling diminati: <strong>Leadership Development (52 peserta)</strong></li>
      <li style="margin-bottom:6pt;">Evaluasi keseluruhan: <strong>Sangat Baik</strong></li>
    </ul>
    
    <h2 style="margin-top:18pt; margin-bottom:12pt; font-size:14pt; font-weight:bold;">
      IV. KESIMPULAN DAN REKOMENDASI
    </h2>
    
    <p style="margin-top:0pt; margin-bottom:12pt; text-align:justify; text-indent:36pt;">
      Program pelatihan tahun 2024 telah berjalan dengan sukses. Untuk periode selanjutnya, kami merekomendasikan untuk menambah kuota peserta dan variasi topik pelatihan sesuai dengan kebutuhan industri terkini.
    </p>
    
    <p style="margin-top:36pt; margin-bottom:0pt; text-align:right;">
      Jakarta, 31 Desember 2024
    </p>
    <p style="margin-top:0pt; margin-bottom:0pt; text-align:right;">
      Manager Pelatihan
    </p>
  </div>
</div>
    `.trim(),
  },

  {
    id: 'sertifikat',
    name: 'Sertifikat Pelatihan',
    category: 'Pelatihan',
    description: 'Template sertifikat dengan border dan desain formal',
    content: `
<div>
  <div style="clear:both;">
    <div style="border:8px double #4472C4; padding:24pt; margin:12pt;">
      <p style="margin-top:0pt; margin-bottom:0pt; text-align:center;">
        <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==" style="width:80px; height:80px" alt="Logo" />
      </p>
      
      <p style="margin-top:12pt; margin-bottom:0pt; text-align:center; font-size:24pt; font-weight:bold; color:#4472C4;">
        SERTIFIKAT
      </p>
      <p style="margin-top:6pt; margin-bottom:24pt; text-align:center; font-size:14pt; font-style:italic;">
        Certificate of Completion
      </p>
      
      <p style="margin-top:24pt; margin-bottom:12pt; text-align:center; font-size:11pt;">
        Diberikan kepada / Presented to
      </p>
      
      <p style="margin-top:0pt; margin-bottom:12pt; text-align:center; font-size:20pt; font-weight:bold; border-bottom:2px solid #000000; padding-bottom:6pt; margin-left:48pt; margin-right:48pt;">
        [NAMA PESERTA]
      </p>
      
      <p style="margin-top:24pt; margin-bottom:12pt; text-align:center; font-size:11pt; line-height:1.6;">
        Telah menyelesaikan program pelatihan<br/>
        <strong style="font-size:14pt;">MANAJEMEN PROYEK PROFESIONAL</strong><br/>
        yang dilaksanakan pada tanggal <strong>15-17 Januari 2024</strong><br/>
        dengan predikat <strong style="color:#4472C4;">LULUS</strong>
      </p>
      
      <table style="width:100%; margin-top:48pt; border:none;">
        <tr>
          <td style="width:50%; text-align:center; padding:12pt; border:none;">
            <p style="margin:0pt; font-size:10pt;">Jakarta, 17 Januari 2024</p>
            <p style="margin:48pt 0pt 0pt 0pt; border-top:1px solid #000000; padding-top:6pt; font-weight:bold;">
              Direktur Pelatihan
            </p>
          </td>
          <td style="width:50%; text-align:center; padding:12pt; border:none;">
            <p style="margin:0pt; font-size:10pt;">Instruktur</p>
            <p style="margin:48pt 0pt 0pt 0pt; border-top:1px solid #000000; padding-top:6pt; font-weight:bold;">
              Nama Instruktur
            </p>
          </td>
        </tr>
      </table>
      
      <p style="margin-top:24pt; margin-bottom:0pt; text-align:center; font-size:9pt; color:#666666;">
        No. Sertifikat: CERT/2024/001
      </p>
    </div>
  </div>
</div>
    `.trim(),
  },

  {
    id: 'proposal',
    name: 'Proposal Kegiatan',
    category: 'Administrasi',
    description: 'Template proposal kegiatan dengan struktur lengkap',
    content: `
<div>
  <div style="clear:both;">
    <p style="margin-top:0pt; margin-bottom:0pt; text-align:center; font-weight:bold; font-size:16pt; text-transform:uppercase;">
      PROPOSAL KEGIATAN
    </p>
    <p style="margin-top:6pt; margin-bottom:24pt; text-align:center; font-weight:bold; font-size:14pt;">
      PELATIHAN DIGITAL MARKETING 2024
    </p>
    
    <table style="width:100%; margin:24pt 0pt; border:none;">
      <tr>
        <td style="width:30%; padding:4pt; border:none;">Nama Kegiatan</td>
        <td style="width:5%; padding:4pt; border:none;">:</td>
        <td style="padding:4pt; border:none; font-weight:bold;">Pelatihan Digital Marketing</td>
      </tr>
      <tr>
        <td style="padding:4pt; border:none;">Tema</td>
        <td style="padding:4pt; border:none;">:</td>
        <td style="padding:4pt; border:none;">Meningkatkan Kompetensi Digital Marketing di Era Modern</td>
      </tr>
      <tr>
        <td style="padding:4pt; border:none;">Waktu Pelaksanaan</td>
        <td style="padding:4pt; border:none;">:</td>
        <td style="padding:4pt; border:none;">15-20 Februari 2024</td>
      </tr>
      <tr>
        <td style="padding:4pt; border:none;">Tempat</td>
        <td style="padding:4pt; border:none;">:</td>
        <td style="padding:4pt; border:none;">Hotel Grand Indonesia, Jakarta</td>
      </tr>
      <tr>
        <td style="padding:4pt; border:none;">Peserta</td>
        <td style="padding:4pt; border:none;">:</td>
        <td style="padding:4pt; border:none;">50 Orang</td>
      </tr>
    </table>
    
    <h2 style="margin-top:24pt; margin-bottom:12pt; font-size:13pt; font-weight:bold;">
      A. LATAR BELAKANG
    </h2>
    
    <p style="margin-top:0pt; margin-bottom:12pt; text-align:justify; text-indent:36pt;">
      Di era digital saat ini, kemampuan digital marketing menjadi keterampilan yang sangat penting bagi setiap profesional. Pelatihan ini dirancang untuk memberikan pemahaman mendalam tentang strategi dan teknik digital marketing yang efektif.
    </p>
    
    <h2 style="margin-top:18pt; margin-bottom:12pt; font-size:13pt; font-weight:bold;">
      B. TUJUAN KEGIATAN
    </h2>
    
    <ol style="margin-top:0pt; margin-bottom:12pt;">
      <li style="margin-bottom:6pt;">Meningkatkan pemahaman peserta tentang digital marketing</li>
      <li style="margin-bottom:6pt;">Memberikan keterampilan praktis dalam mengelola kampanye digital</li>
      <li style="margin-bottom:6pt;">Membangun networking antar profesional di bidang marketing</li>
    </ol>
    
    <h2 style="margin-top:18pt; margin-bottom:12pt; font-size:13pt; font-weight:bold;">
      C. SUSUNAN ACARA
    </h2>
    
    <table style="border-collapse:collapse; width:100%; margin:12pt 0pt;">
      <thead>
        <tr style="background-color:#4472C4;">
          <th style="border:1px solid #000000; padding:8pt; color:#ffffff; font-weight:bold; width:15%;">Hari/Tanggal</th>
          <th style="border:1px solid #000000; padding:8pt; color:#ffffff; font-weight:bold; width:20%;">Waktu</th>
          <th style="border:1px solid #000000; padding:8pt; color:#ffffff; font-weight:bold;">Materi</th>
          <th style="border:1px solid #000000; padding:8pt; color:#ffffff; font-weight:bold; width:25%;">Pembicara</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td style="border:1px solid #000000; padding:6pt; text-align:center;" rowspan="3">Senin<br/>15 Feb 2024</td>
          <td style="border:1px solid #000000; padding:6pt; text-align:center;">08.00-09.00</td>
          <td style="border:1px solid #000000; padding:6pt;">Registrasi & Pembukaan</td>
          <td style="border:1px solid #000000; padding:6pt;">Panitia</td>
        </tr>
        <tr>
          <td style="border:1px solid #000000; padding:6pt; text-align:center;">09.00-12.00</td>
          <td style="border:1px solid #000000; padding:6pt;">Fundamental Digital Marketing</td>
          <td style="border:1px solid #000000; padding:6pt;">Dr. Ahmad Rizki</td>
        </tr>
        <tr>
          <td style="border:1px solid #000000; padding:6pt; text-align:center;">13.00-16.00</td>
          <td style="border:1px solid #000000; padding:6pt;">Social Media Marketing</td>
          <td style="border:1px solid #000000; padding:6pt;">Sarah Wijaya, M.M.</td>
        </tr>
      </tbody>
    </table>
    
    <h2 style="margin-top:18pt; margin-bottom:12pt; font-size:13pt; font-weight:bold;">
      D. ANGGARAN BIAYA
    </h2>
    
    <table style="border-collapse:collapse; width:100%; margin:12pt 0pt;">
      <thead>
        <tr style="background-color:#4472C4;">
          <th style="border:1px solid #000000; padding:8pt; color:#ffffff; font-weight:bold; width:10%;">No</th>
          <th style="border:1px solid #000000; padding:8pt; color:#ffffff; font-weight:bold;">Uraian</th>
          <th style="border:1px solid #000000; padding:8pt; color:#ffffff; font-weight:bold; width:25%;">Jumlah (Rp)</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td style="border:1px solid #000000; padding:6pt; text-align:center;">1</td>
          <td style="border:1px solid #000000; padding:6pt;">Sewa Tempat</td>
          <td style="border:1px solid #000000; padding:6pt; text-align:right;">25.000.000</td>
        </tr>
        <tr style="background-color:#F2F2F2;">
          <td style="border:1px solid #000000; padding:6pt; text-align:center;">2</td>
          <td style="border:1px solid #000000; padding:6pt;">Konsumsi</td>
          <td style="border:1px solid #000000; padding:6pt; text-align:right;">15.000.000</td>
        </tr>
        <tr>
          <td style="border:1px solid #000000; padding:6pt; text-align:center;">3</td>
          <td style="border:1px solid #000000; padding:6pt;">Honorarium Pembicara</td>
          <td style="border:1px solid #000000; padding:6pt; text-align:right;">30.000.000</td>
        </tr>
        <tr style="background-color:#F2F2F2;">
          <td style="border:1px solid #000000; padding:6pt; text-align:center;">4</td>
          <td style="border:1px solid #000000; padding:6pt;">Materi & Sertifikat</td>
          <td style="border:1px solid #000000; padding:6pt; text-align:right;">10.000.000</td>
        </tr>
        <tr style="font-weight:bold; background-color:#D9E1F2;">
          <td colspan="2" style="border:1px solid #000000; padding:6pt; text-align:center;">TOTAL</td>
          <td style="border:1px solid #000000; padding:6pt; text-align:right;">80.000.000</td>
        </tr>
      </tbody>
    </table>
    
    <h2 style="margin-top:18pt; margin-bottom:12pt; font-size:13pt; font-weight:bold;">
      E. PENUTUP
    </h2>
    
    <p style="margin-top:0pt; margin-bottom:12pt; text-align:justify; text-indent:36pt;">
      Demikian proposal ini kami sampaikan. Atas perhatian dan dukungannya, kami ucapkan terima kasih.
    </p>
    
    <p style="margin-top:36pt; margin-bottom:0pt; text-align:right;">
      Jakarta, 1 Februari 2024
    </p>
    <p style="margin-top:0pt; margin-bottom:0pt; text-align:right;">
      Ketua Panitia,
    </p>
    <p style="margin-top:48pt; margin-bottom:0pt; text-align:right; font-weight:bold;">
      John Doe
    </p>
  </div>
</div>
    `.trim(),
  },

  {
    id: 'blank',
    name: 'Dokumen Kosong',
    category: 'Template',
    description: 'Mulai dengan dokumen kosong',
    content: `
<div>
  <div style="clear:both;">
    <p style="margin-top:0pt; margin-bottom:0pt;">Mulai menulis di sini...</p>
  </div>
</div>
    `.trim(),
  },
]

export const getTemplateById = (id: string): DocumentTemplate | undefined => {
  return documentTemplates.find((template) => template.id === id)
}

export const getTemplatesByCategory = (category: string): DocumentTemplate[] => {
  return documentTemplates.filter((template) => template.category === category)
}

export const getAllCategories = (): string[] => {
  const categories = documentTemplates.map((template) => template.category)
  return Array.from(new Set(categories))
}
