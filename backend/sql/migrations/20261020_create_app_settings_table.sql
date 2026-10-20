-- Migration: 20261020_create_app_settings_table.sql
-- Description: Tabel konfigurasi KOP surat resmi puskesmas dan pejabat penandatangan laporan MFK

USE db_mfk_puskesmas;

CREATE TABLE IF NOT EXISTS app_settings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  instansi_induk VARCHAR(255) NOT NULL DEFAULT 'PEMERINTAH KABUPATEN / KOTA',
  dinas_kesehatan VARCHAR(255) NOT NULL DEFAULT 'DINAS KESEHATAN KABUPATEN / KOTA',
  nama_puskesmas VARCHAR(255) NOT NULL DEFAULT 'UPTD PUSKESMAS MUARA KULAM',
  alamat_kontak TEXT NULL,
  kota_dokumen VARCHAR(100) DEFAULT 'Muara Kulam',
  pimpinan_jabatan VARCHAR(150) DEFAULT 'Kepala UPTD Puskesmas',
  pimpinan_nama VARCHAR(150) DEFAULT 'dr. H. Ahmad Fauzi, M.Kes',
  pimpinan_nip VARCHAR(100) DEFAULT '19780512 200501 1 008',
  pelapor_jabatan VARCHAR(150) DEFAULT 'Penanggung Jawab MFK & K3',
  pelapor_nama VARCHAR(150) DEFAULT 'Administrator MFK / Tim Sanitasi',
  pelapor_keterangan VARCHAR(200) DEFAULT 'Koordinator Fasilitas & Keselamatan',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Masukkan data konfigurasi default jika tabel masih kosong
INSERT INTO app_settings (
  instansi_induk,
  dinas_kesehatan,
  nama_puskesmas,
  alamat_kontak,
  kota_dokumen,
  pimpinan_jabatan,
  pimpinan_nama,
  pimpinan_nip,
  pelapor_jabatan,
  pelapor_nama,
  pelapor_keterangan
)
SELECT 
  'PEMERINTAH KABUPATEN / KOTA',
  'DINAS KESEHATAN KABUPATEN / KOTA',
  'UPTD PUSKESMAS MUARA KULAM',
  'Jl. Lintas Muara Kulam, Telp. (0733) 123456 | Pos-el: pkm.muarakulam@dinkes.go.id',
  'Muara Kulam',
  'Kepala UPTD Puskesmas',
  'dr. H. Ahmad Fauzi, M.Kes',
  '19780512 200501 1 008',
  'Penanggung Jawab MFK & K3',
  'Administrator MFK / Tim Sanitasi',
  'Koordinator Fasilitas & Keselamatan'
WHERE NOT EXISTS (SELECT 1 FROM app_settings);
