-- Migration: 20261020_add_logo_url_to_app_settings.sql
-- Description: Menambahkan kolom logo_url untuk logo KOP surat instansi / puskesmas

USE db_mfk_puskesmas;

ALTER TABLE app_settings 
ADD COLUMN IF NOT EXISTS logo_url LONGTEXT NULL AFTER nama_puskesmas;
