-- ========================================================
-- Migration: Add damage_description to rooms table
-- Tanggal: 2026-10-20
-- Deskripsi: Menambahkan kolom uraian kerusakan pada master data ruangan 
--            ketika kondisi ruangan 'Perlu Perbaikan' atau 'Rusak Berat'
-- ========================================================

USE db_mfk_puskesmas;

ALTER TABLE rooms 
ADD COLUMN damage_description TEXT NULL AFTER condition_status;
