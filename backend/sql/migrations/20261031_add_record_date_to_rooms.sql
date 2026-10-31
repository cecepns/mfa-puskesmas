-- Migration: Tambah kolom record_date pada tabel rooms untuk fitur backdate pendataan ruangan/klaster
USE db_mfk_puskesmas;

ALTER TABLE rooms 
ADD COLUMN record_date DATE NULL AFTER condition_status;

-- Inisialisasi data lama dengan tanggal dari created_at
UPDATE rooms 
SET record_date = DATE(created_at) 
WHERE record_date IS NULL;

