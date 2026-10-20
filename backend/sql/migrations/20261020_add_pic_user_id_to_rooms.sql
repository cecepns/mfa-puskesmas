-- ========================================================
-- Migration: Add pic_user_id to rooms table
-- Tanggal: 2026-10-20
-- Deskripsi: Menambahkan kolom pic_user_id untuk menghubungkan
--            Penanggung Jawab (PJ Ruangan) ke tabel users
-- ========================================================

USE db_mfk_puskesmas;

ALTER TABLE rooms 
ADD COLUMN pic_user_id INT NULL AFTER pic_name;
