# Moodle Plugin: File Submission with Document Preview (`assignsubmission_filepreview`)

Plugin subtipe **Assignment Submission** untuk **Moodle 4.2 s/d 5.x** yang memungkinkan siswa mengumpulkan tugas berupa berkas dokumen, sekaligus memberikan fitur **pratinjau interaktif (inline preview) dan penilaian layar terpisah (Split-Screen Grading)** bagi dosen/pengajar tanpa harus mendownload berkas satu per satu.

---

## 🚀 Fitur Unggulan

1. **Pratinjau Multi-Format Tanpa Download (Client-Side Rendering):**
   - **PDF:** Menggunakan PDF.js (Mozilla) dengan zoom, fit-to-width, dan render multi-halaman.
   - **Microsoft Word (.docx):** Render langsung ke HTML dengan format, heading, tabel, dan margin asli menggunakan `docx-preview`.
   - **Microsoft Excel (.xlsx, .xls, .csv):** Render tabel spreadsheet interaktif dengan navigasi antar sheet (tab lembar kerja) menggunakan SheetJS.
   - **Microsoft PowerPoint (.pptx):** Render slide presentasi responsif dengan tombol Next/Prev slide, thumbnail strip, dan fullscreen mode.
   - **Plain Text & Source Code (.txt, .md, .py, .java, .sql, .json, .xml, dll.):** Render teks dengan font monospace rapi dan line-wrapping.
   - **Gambar (.png, .jpg, .jpeg, .gif, .svg, .webp):** Pratinjau gambar beresolusi tinggi.

2. **Inline Split-Screen Grader (Penilaian Berdampingan):**
   - **Panel Kiri (65%):** Penampil dokumen interaktif (zoom in/out, reset, layar penuh, unduh fallback).
   - **Panel Kanan (35%):** Form nilai, rubrik, marking guide, dan umpan balik (feedback) Moodle.
   - Mempercepat koreksi tugas tanpa perlu berpindah-pindah tab browser atau membuka aplikasi desktop.

3. **100% Mandiri, Aman, dan Siap Intranet / Localhost:**
   - Semua pustaka JavaScript terpasang langsung di dalam plugin (`assets/vendor/`).
   - Tidak mengirimkan dokumen siswa ke API luar/cloud pihak ketiga.
   - Tidak memerlukan instalasi software server berat seperti LibreOffice, Unoconv, atau Ghostscript.

---

## 📁 Struktur Direktori Plugin

```text
filepreview/
├── amd/
│   ├── src/
│   │   └── viewer.js           # Modul AMD Moodle untuk renderer dokumen & split-screen
│   └── build/
│       └── viewer.min.js       # Versi produksi modul AMD
├── assets/
│   └── vendor/
│       ├── jszip.min.js        # Parser file zip (DOCX, XLSX, PPTX)
│       ├── docx-preview.min.js # Renderer dokumen Word
│       ├── xlsx.full.min.js    # Renderer spreadsheet Excel (SheetJS)
│       ├── pdf.min.js          # Renderer PDF (Mozilla PDF.js)
│       ├── pdf.worker.min.js   # Web worker untuk PDF.js
│       └── pptx-viewer.js      # Renderer slide presentasi PowerPoint bawaan
├── classes/
│   └── privacy/
│       └── provider.php        # Implementasi Moodle Privacy API (GDPR compliant)
├── db/
│   ├── access.php              # Definisi hak akses (capabilities)
│   ├── install.xml             # Skema tabel database XMLDB
│   └── upgrade.php             # Skrip upgrade database
├── lang/
│   ├── en/
│   │   └── assignsubmission_filepreview.php # Bahasa Inggris
│   └── id/
│       └── assignsubmission_filepreview.php # Bahasa Indonesia
├── pix/
│   └── icon.svg                # Ikon plugin
├── templates/
│   ├── summary.mustache        # Template ringkasan di tabel "View all submissions"
│   └── view.mustache           # Template rincian pengumpulan berkas
├── lib.php                     # Handler file streaming (pluginfile)
├── locallib.php                # Kelas inti assign_submission_filepreview
├── settings.php                # Konfigurasi administrator Moodle
├── styles.css                  # Tampilan CSS Split-Screen Workspace
├── version.php                 # Metadata versi plugin
└── README.md
```

---

## 🛠️ Cara Instalasi di Moodle

1. **Salin / Pindahkan Folder:**
   Pastikan folder plugin ini diletakkan pada direktori instalasi Moodle Anda di:
   ```text
   {MOODLE_DIRROOT}/mod/assign/submission/filepreview
   ```
   *(Pastikan nama folder adalah `filepreview`)*.

2. **Jalankan Upgrade Database:**
   - Masuk ke Moodle sebagai Administrator.
   - Buka menu **Site administration** > **Notifications**.
   - Moodle akan otomatis mendeteksi plugin baru `assignsubmission_filepreview`.
   - Klik **Upgrade Moodle database now**.

3. **Aktifkan Plugin:**
   - Buka **Site administration** > **Plugins** > **Activity modules** > **Assignment** > **Submission plugins** > **Manage assignment submission plugins**.
   - Pastikan **File Submission with Document Preview** dalam status aktif (ikon mata terbuka).

---

## 📖 Cara Penggunaan

1. Buka mata kuliah / kursus di Moodle, lalu aktifkan mode edit (*Edit mode*).
2. Tambahkan aktivitas baru: **Assignment** (Tugas).
3. Pada bagian **Submission types** (Jenis pengajuan):
   - Centang **File submission with document preview** (*Pengumpulan berkas dengan pratinjau dokumen*).
   - Tentukan jumlah berkas maksimal dan jenis berkas yang diizinkan (misal: `.pdf, .docx, .pptx, .xlsx, .txt`).
4. Klik **Save and display**.
5. Saat siswa mengumpulkan tugas, dosen dapat:
   - Di halaman daftar pengumpulan (*View all submissions*), klik tombol **🔍 Preview & Grade** untuk membuka tampilan split screen.
   - Dokumen langsung terbuka di layar sebelah kiri tanpa diunduh, dan dosen dapat langsung mengisi nilai serta umpan balik di sebelah kanan!

---

## 🔒 Privasi dan Lisensi
- Berlisensi **GNU GPL v3 or later**.
- Mendukung penuh Moodle Privacy API untuk ekspor dan penghapusan data pengguna sesuai regulasi privasi.

