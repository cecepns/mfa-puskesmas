CREATE DATABASE IF NOT EXISTS db_mfk_puskesmas;
USE db_mfk_puskesmas;

CREATE TABLE rooms (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  category ENUM('Klaster_Ruangan', 'Sanitasi_Toilet', 'Area_Umum') NOT NULL,
  pic_name VARCHAR(100) DEFAULT 'PJ Ruangan',
  condition_status ENUM('Baik', 'Perlu Perbaikan', 'Rusak Berat') DEFAULT 'Baik',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO rooms (name, category, pic_name, condition_status) VALUES
('Manajemen', 'Klaster_Ruangan', 'Budi Santoso', 'Baik'),
('Klaster I Pendaftaran dan Rekam Medis', 'Klaster_Ruangan', 'Siti Aminah', 'Baik'),
('Klaster II Ibu dan Anak', 'Klaster_Ruangan', 'Bidan Rina', 'Baik'),
('Klaster II dan III Kesehatan Gigi dan Mulut', 'Klaster_Ruangan', 'drg. Hendra', 'Perlu Perbaikan'),
('Klaster III Usia Dewasa dan Lansia', 'Klaster_Ruangan', 'Ns. Joko', 'Baik'),
('Klaster IV Penanggulangan Penyakit Menular', 'Klaster_Ruangan', 'dr. Maya', 'Baik'),
('Lintas Klaster UGD', 'Klaster_Ruangan', 'Ns. Andi', 'Baik'),
('Lintas Klaster Laboratorium', 'Klaster_Ruangan', 'Analis Dedi', 'Perlu Perbaikan'),
('Lintas Klaster Farmasi', 'Klaster_Ruangan', 'Apt. Lestari', 'Baik'),
('Lintas Klaster Rawat Inap', 'Klaster_Ruangan', 'Ns. Putri', 'Baik'),
('Toilet LT. II Perempuan', 'Sanitasi_Toilet', 'Petugas Kebersihan A', 'Baik'),
('Toilet LT. II Laki-Laki', 'Sanitasi_Toilet', 'Petugas Kebersihan A', 'Baik'),
('Toilet LT. I Perempuan', 'Sanitasi_Toilet', 'Petugas Kebersihan B', 'Baik'),
('Toilet LT. I Laki-Laki', 'Sanitasi_Toilet', 'Petugas Kebersihan B', 'Perlu Perbaikan'),
('Toilet UGD Perempuan', 'Sanitasi_Toilet', 'Petugas Kebersihan C', 'Baik'),
('Toilet UGD Laki-Laki', 'Sanitasi_Toilet', 'Petugas Kebersihan C', 'Baik'),
('Toilet Klaster IV', 'Sanitasi_Toilet', 'Petugas Kebersihan C', 'Baik'),
('Toilet Ranap Anak', 'Sanitasi_Toilet', 'Petugas Kebersihan D', 'Baik'),
('Toilet Ranap Perempuan', 'Sanitasi_Toilet', 'Petugas Kebersihan D', 'Baik'),
('Toilet Ranap Laki-Laki', 'Sanitasi_Toilet', 'Petugas Kebersihan D', 'Baik');

CREATE TABLE inventories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  category ENUM('B3', 'Sarpras', 'Alkes', 'Kalibrasi') NOT NULL,
  room_id INT NOT NULL,
  item_name VARCHAR(150) NOT NULL,
  quantity INT DEFAULT 1,
  unit VARCHAR(50) DEFAULT 'Unit',
  condition_status ENUM('Baik', 'Rusak Ringan', 'Rusak Berat') DEFAULT 'Baik',
  needs_calibration BOOLEAN DEFAULT FALSE,
  calibration_date DATE NULL,
  next_calibration_date DATE NULL,
  calibration_institution VARCHAR(150) NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE
);

INSERT INTO inventories (category, room_id, item_name, quantity, unit, condition_status, needs_calibration, calibration_date, next_calibration_date, calibration_institution, notes) VALUES
('B3', 8, 'Reagen Ziehl Neelsen', 5, 'Botol', 'Baik', FALSE, NULL, NULL, NULL, 'Disimpan di lemari B3 khusus'),
('B3', 7, 'Alkohol 70% & H2O2', 10, 'Liter', 'Baik', FALSE, NULL, NULL, NULL, 'Lengkap dengan MSDS'),
('Sarpras', 1, 'Meja Kerja & Kursi Ergonomis', 12, 'Set', 'Baik', FALSE, NULL, NULL, NULL, 'Kondisi layak pakai'),
('Alkes', 4, 'Dental Unit Chair', 2, 'Unit', 'Rusak Ringan', TRUE, '2025-10-01', '2026-10-01', 'BPFKK Kemenkes', 'Saluran air kumur agak mampet'),
('Alkes', 7, 'Defibrillator / AED', 1, 'Unit', 'Baik', TRUE, '2026-03-15', '2027-03-15', 'PT Kalibrasi Medika', 'Siap pakai'),
('Kalibrasi', 7, 'Tensimeter Digital UGD', 4, 'Unit', 'Baik', TRUE, '2026-05-10', '2027-05-10', 'BPFKK', 'Lulus kalibrasi sertifikat No. 992/KAL/2026');

CREATE TABLE inspections (
  id INT AUTO_INCREMENT PRIMARY KEY,
  inspection_type ENUM(
    'Inspeksi Ruangan',
    'Inspeksi Bangunan',
    'Inspeksi Listrik',
    'Inspeksi Air dan Sanitasi',
    'Inspeksi Kebakaran',
    'Inspeksi Limbah',
    'Inspeksi Gas Medis',
    'Inspeksi Lingkungan'
  ) NOT NULL,
  inspection_datetime DATETIME NOT NULL,
  officer_name VARCHAR(100) NOT NULL,
  work_unit VARCHAR(100) NOT NULL,
  room_id INT NOT NULL,
  inspection_items TEXT NOT NULL,
  standard_condition TEXT NOT NULL,
  result_status ENUM('Baik', 'Perlu Perbaikan', 'Tidak Memenuhi Standar') NOT NULL,
  finding_description TEXT,
  risk_level ENUM('Rendah', 'Sedang', 'Tinggi', 'Ekstrem') DEFAULT 'Rendah',
  recommendation TEXT,
  status_tindak_lanjut ENUM('Selesai', 'Dalam Proses', 'Terlambat') DEFAULT 'Selesai',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE
);

INSERT INTO inspections (inspection_type, inspection_datetime, officer_name, work_unit, room_id, inspection_items, standard_condition, result_status, finding_description, risk_level, recommendation, status_tindak_lanjut) VALUES
('Inspeksi Ruangan', '2026-10-19 08:00:00', 'Bidan Rina', 'Klaster II', 3, 'Lantai, meja periksa, tempat sampah, wastafel', 'Bersih, bebas debu, kering', 'Baik', 'Semua sudut ruangan bersih dan rapi', 'Rendah', 'Pertahankan kebersihan harian', 'Selesai'),
('Inspeksi Limbah', '2026-10-19 09:00:00', 'Ns. Andi', 'UGD', 7, 'Safety box, plastik kuning medis, plastik hitam domestik', 'Pemilahan tepat, maksimal 3/4 penuh', 'Baik', 'Pemilahan limbah tajam dan infeksius sesuai SOP', 'Rendah', 'Angkut ke TPS B3 setiap sore', 'Selesai'),
('Inspeksi Air dan Sanitasi', '2026-10-19 08:30:00', 'Petugas Kebersihan B', 'Sanitasi', 14, 'Air bersih, kloset, drainase, handsoap', 'Air mengalir jernih, tidak bau, handsoap terisi', 'Perlu Perbaikan', 'Kran wastafel agak longgar dan handsoap hampir habis', 'Sedang', 'Segera isi ulang handsoap dan kencangkan kran', 'Dalam Proses');

CREATE TABLE utility_reports (
  id INT AUTO_INCREMENT PRIMARY KEY,
  report_datetime DATETIME NOT NULL,
  officer_name VARCHAR(100) NOT NULL,
  work_unit VARCHAR(100) NOT NULL,
  room_id INT NOT NULL,
  utility_system ENUM(
    'Sistem Kelistrikan',
    'Sistem Gas Medis',
    'Sistem Proteksi Kebakaran',
    'Sistem Komunikasi dan TI',
    'Sistem Pendinginan Khusus',
    'Sistem Tata Udara dan Ventilasi'
  ) NOT NULL,
  damage_description TEXT NOT NULL,
  recommendation TEXT NOT NULL,
  urgency ENUM('Segera', 'Normal') DEFAULT 'Segera',
  status ENUM('Menunggu', 'Diproses', 'Selesai', 'Terlambat') DEFAULT 'Menunggu',
  photo_url VARCHAR(255) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE
);

INSERT INTO utility_reports (report_datetime, officer_name, work_unit, room_id, utility_system, damage_description, recommendation, urgency, status) VALUES
('2026-10-18 14:20:00', 'Apt. Lestari', 'Farmasi', 9, 'Sistem Pendinginan Khusus', 'Suhu Chiller Vaksin naik ke 9 derajat Celcius, alarm berbunyi', 'Cek thermostat dan pindahkan sementara vaksin ke coldbox cadangan', 'Segera', 'Diproses'),
('2026-10-17 10:00:00', 'drg. Hendra', 'Poli Gigi', 4, 'Sistem Tata Udara dan Ventilasi', 'Exhaust fan poli gigi berbunyi kasar dan hisapan lemah', 'Bersihkan baling-baling atau ganti motor fan', 'Segera', 'Terlambat');

CREATE TABLE incident_reports (
  id INT AUTO_INCREMENT PRIMARY KEY,
  report_number VARCHAR(50) UNIQUE NOT NULL,
  incident_datetime DATETIME NOT NULL,
  location VARCHAR(150) NOT NULL,
  category ENUM(
    'Insiden Keselamatan Pasien dan Pengunjung',
    'Insiden Keselamatan Fasilitas',
    'Kejadian Kebakaran atau Keadaan Darurat',
    'Insiden Keselamatan dan Kesehatan Kerja (K3)'
  ) NOT NULL,
  chronology TEXT NOT NULL,
  affected_party VARCHAR(150) NOT NULL,
  actual_impact TEXT NOT NULL,
  potential_impact TEXT NOT NULL,
  initial_action TEXT NOT NULL,
  risk_grading ENUM('Rendah (Biru)', 'Sedang (Hijau)', 'Tinggi (Kuning)', 'Ekstrem (Merah)') NOT NULL,
  reporter_name VARCHAR(100) NOT NULL,
  handler_pic VARCHAR(100) NOT NULL,
  investigation_result TEXT,
  corrective_action TEXT,
  status ENUM('Investigasi', 'Tindak Lanjut', 'Selesai') DEFAULT 'Investigasi',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO incident_reports (
  report_number, incident_datetime, location, category, chronology, affected_party,
  actual_impact, potential_impact, initial_action, risk_grading, reporter_name,
  handler_pic, investigation_result, corrective_action, status
) VALUES (
  'INC-202610-001', '2026-10-15 11:15:00', 'Koridor Depan Toilet LT. I Laki-Laki',
  'Insiden Keselamatan Pasien dan Pengunjung',
  'Pengunjung hampir terpeleset karena lantai basah terkena rembesan air wastafel',
  'Pengunjung Lansia', 'Tidak cedera (Near Miss / KNC)', 'Risiko fraktur akibat jatuh',
  'Mengeringkan lantai dan memasang rambu Wet Floor', 'Sedang (Hijau)',
  'Siti Aminah', 'Tim K3 & MFK', 'Seal pipa bawah wastafel getas dan menetes',
  'Penggantian seal pipa dan pengecekan rutin setiap 2 jam', 'Selesai'
);

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  role ENUM('admin', 'petugas', 'pimpinan', 'pj_ruangan') DEFAULT 'petugas',
  work_unit VARCHAR(100) DEFAULT 'Umum',
  phone VARCHAR(20) NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

INSERT INTO users (username, password, name, email, role, work_unit, phone, is_active) VALUES
('admin', 'admin123', 'Administrator MFK', 'admin.mfk@puskesmas.go.id', 'admin', 'Sekretariat MFK & K3', '081234567890', 1),
('pimpinan', 'pimpinan123', 'dr. H. Ahmad Fauzi, M.Kes', 'kepala@puskesmas.go.id', 'pimpinan', 'Kepala Puskesmas', '081298765432', 1),
('petugas1', 'petugas123', 'Petugas Kebersihan B', 'kebersihan@puskesmas.go.id', 'petugas', 'Sanitasi & Lingkungan', '081311223344', 1),
('bidan_rina', 'bidan123', 'Bidan Rina, S.Tr.Keb', 'rina@puskesmas.go.id', 'pj_ruangan', 'Klaster II Ibu dan Anak', '081355667788', 1),
('ns_andi', 'andi123', 'Ns. Andi Pratama, S.Kep', 'andi@puskesmas.go.id', 'petugas', 'Lintas Klaster UGD', '081399887766', 1);
