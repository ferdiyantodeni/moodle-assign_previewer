<?php
// This file is part of Moodle - http://moodle.org/
//
// Moodle is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// Moodle is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with Moodle.  If not, see <http://www.gnu.org/licenses/>.

/**
 * Strings for component 'assignsubmission_filepreview', language 'id'.
 *
 * @package    assignsubmission_filepreview
 * @copyright  2024
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

$string['pluginname'] = 'Pengumpulan Berkas dengan Pratinjau Dokumen';
$string['enabled'] = 'Pengumpulan berkas dengan pratinjau dokumen';
$string['enabled_help'] = 'Jika diaktifkan, siswa dapat mengunggah berkas dokumen (Office, PDF, TXT) dan pengajar dapat langsung melakukan pratinjau serta penilaian layar terpisah.';
$string['default'] = 'Diaktifkan secara default';
$string['default_help'] = 'Jika disetel, metode pengumpulan ini akan aktif secara default untuk semua tugas baru.';
$string['maxfilessubmission'] = 'Jumlah berkas maksimal yang diunggah';
$string['maxfilessubmission_help'] = 'Jumlah berkas maksimal yang dapat dikumpulkan oleh setiap siswa.';
$string['maxsubmissionsizebytes'] = 'Ukuran maksimal berkas pengumpulan';
$string['maxsubmissionsizebytes_help'] = 'Batas ukuran berkas maksimal yang diizinkan untuk diunggah.';
$string['acceptedfiletypes'] = 'Jenis berkas yang diterima';
$string['acceptedfiletypes_help'] = 'Tentukan ekstensi berkas yang diizinkan (contoh: .pdf, .docx, .pptx, .xlsx, .txt). Kosongkan untuk mengizinkan semua jenis dokumen standar.';
$string['filepreview'] = 'Pratinjau Berkas';
$string['filepreviewfilename'] = 'Berkas';
$string['numfilesforlog'] = 'Jumlah berkas: {$a}';
$string['countfiles'] = '{$a} berkas';

// Capabilities
$string['filepreview:view'] = 'Melihat pratinjau berkas pengumpulan tugas';
$string['filepreview:exportownsubmission'] = 'Mengekspor berkas pratinjau pengumpulan sendiri';

// Grader & Previewer UI
$string['preview'] = 'Pratinjau';
$string['preview_and_grade'] = 'Pratinjau & Nilai';
$string['split_screen'] = 'Penilaian Layar Terpisah';
$string['nofiles'] = 'Belum ada berkas yang dikumpulkan';
$string['loading_doc'] = 'Memuat dokumen...';
$string['loading_pdf'] = 'Memuat dokumen PDF...';
$string['close'] = 'Tutup';
$string['zoom_in'] = 'Perbesar';
$string['zoom_out'] = 'Perkecil';
$string['zoom_reset'] = 'Atur Ulang Zoom';
$string['fullscreen'] = 'Layar Penuh';
$string['download_fallback'] = 'Unduh Berkas';
$string['page'] = 'Halaman';
$string['slide'] = 'Slide';
$string['sheet'] = 'Sheet';
$string['select_file'] = 'Pilih berkas';
$string['unsupported_format'] = 'Pratinjau langsung tidak tersedia untuk format berkas ini. Silakan klik Unduh untuk melihatnya.';
$string['grade_panel_heading'] = 'Nilai & Umpan Balik';
$string['quick_grade_save'] = 'Simpan Nilai';
$string['open_in_new_tab'] = 'Buka di Tab Baru';
$string['invalid_pdf_response'] = 'Respon server bukan file PDF valid (kemungkinan sesi login atau izin akses).';
$string['error_loading_pdf'] = 'Gagal memuat dokumen PDF: {$a}';
$string['error_loading_word'] = 'Gagal memuat dokumen Word: {$a}';
$string['error_loading_excel'] = 'Gagal memuat Excel: {$a}';
$string['error_loading_pptx'] = 'Gagal memuat PowerPoint: {$a}';
$string['error_loading_text'] = 'Gagal memuat teks: {$a}';
$string['error_loading_script'] = 'Gagal memuat skrip: {$a}';

// Privacy Metadata
$string['privacy:metadata:filepurpose'] = 'Berkas yang diunggah untuk pengumpulan tugas dengan dukungan pratinjau.';
$string['privacy:metadata:assignment'] = 'ID tugas (assignment).';
$string['privacy:metadata:submission'] = 'ID pengumpulan (submission).';
$string['privacy:metadata:numfiles'] = 'Jumlah berkas yang diunggah pada pengumpulan ini.';
$string['privacy:path'] = 'submission_files';
