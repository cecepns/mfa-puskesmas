-- Migration: Add stock_date to inventories and create public_feedbacks table
USE db_mfk_puskesmas;

-- 1. Add stock_date to inventories if not exists
ALTER TABLE inventories ADD COLUMN IF NOT EXISTS stock_date DATE NULL AFTER quantity;

-- 2. Create public_feedbacks table for visitor complaints & ratings via barcode
CREATE TABLE IF NOT EXISTS public_feedbacks (
  id INT AUTO_INCREMENT PRIMARY KEY,
  ticket_number VARCHAR(50) UNIQUE NOT NULL,
  category ENUM('Kualitas Pelayanan', 'Petugas', 'Sarana dan Prasarana', 'Kebersihan & Sanitasi', 'Lainnya') NOT NULL DEFAULT 'Sarana dan Prasarana',
  rating_pelayanan INT DEFAULT 5,
  rating_petugas INT DEFAULT 5,
  rating_sarpras INT DEFAULT 5,
  overall_rating INT DEFAULT 5,
  room_id INT NULL,
  room_name VARCHAR(150) NULL,
  visitor_name VARCHAR(100) NULL,
  visitor_phone VARCHAR(30) NULL,
  complaint_text TEXT NOT NULL,
  photo_url VARCHAR(255) NULL,
  status ENUM('Menunggu', 'Diproses', 'Selesai') DEFAULT 'Menunggu',
  admin_response TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE SET NULL
);

