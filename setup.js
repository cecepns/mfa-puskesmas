/**
 * AUTO-INSTALLER & GENERATOR PROJECT MFK PUSKESMAS
 * Jalankan dengan perintah: node setup-project.js
 */

const fs = require("fs");
const path = require("path");

const files = {
  // 1. ROOT GITIGNORE
  ".gitignore": `# Dependencies
node_modules/
frontend/node_modules/
backend/node_modules/

# Build outputs
dist/
build/
frontend/dist/

# Environment variables
.env
.env.local
.env.production
frontend/.env
backend/.env

# Logs & Cache
*.log
npm-debug.log*
.npm
.eslintcache
.vite/

# IDE
.vscode/
.idea/
*.swp
.DS_Store
`,

  // 2. DATABASE SQL
  "backend/sql/database.sql": `CREATE DATABASE IF NOT EXISTS db_mfk_puskesmas;
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
`,

  // 3. BACKEND PACKAGE.JSON & ENV
  "backend/package.json": JSON.stringify(
    {
      name: "backend-mfk-puskesmas",
      version: "1.0.0",
      main: "server.js",
      scripts: {
        start: "node server.js",
        dev: "nodemon server.js",
      },
      dependencies: {
        cors: "^2.8.5",
        dotenv: "^16.4.5",
        express: "^4.19.2",
        multer: "^1.4.5-lts.1",
        mysql2: "^3.11.0",
      },
      devDependencies: {
        nodemon: "^3.1.4",
      },
    },
    null,
    2
  ),

  "backend/.env": `PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASS=
DB_NAME=db_mfk_puskesmas
UPLOAD_DIR=uploads-mfk-puskesmas
`,

  // 4. BACKEND SERVER.JS
  "backend/server.js": `require("dotenv").config();
const express = require("express");
const mysql = require("mysql2/promise");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 5000;
const UPLOAD_DIR = process.env.UPLOAD_DIR || "uploads-mfk-puskesmas";

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

app.use(cors());
app.use(express.json());
app.use(\`/\${UPLOAD_DIR}\`, express.static(path.join(__dirname, UPLOAD_DIR)));

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, \`mfk-\${Date.now()}\${ext}\`);
  },
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASS || "",
  database: process.env.DB_NAME || "db_mfk_puskesmas",
  waitForConnections: true,
  connectionLimit: 10,
});

const getPaginationParams = (query) => {
  const page = Math.max(1, parseInt(query.page) || 1);
  const limit = [10, 25, 50, 100].includes(parseInt(query.limit)) ? parseInt(query.limit) : 10;
  const offset = (page - 1) * limit;
  const search = (query.search || "").trim();
  return { page, limit, offset, search };
};

const formatPaginatedResponse = (res, data, page, limit, total) => {
  return res.json({
    success: true,
    data,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 },
  });
};

app.get("/api/dashboard", async (req, res) => {
  try {
    const [[completedReports]] = await pool.query(
      \`SELECT 
        (SELECT COUNT(*) FROM inspections WHERE status_tindak_lanjut = 'Selesai') +
        (SELECT COUNT(*) FROM utility_reports WHERE status = 'Selesai') AS total_selesai,
        (SELECT COUNT(*) FROM inspections WHERE status_tindak_lanjut = 'Terlambat') +
        (SELECT COUNT(*) FROM utility_reports WHERE status = 'Terlambat') AS total_terlambat\`
    );
    const [roomStatuses] = await pool.query(\`SELECT id, name, category, pic_name, condition_status FROM rooms ORDER BY id ASC\`);
    const [[inspectionStats]] = await pool.query(\`SELECT COUNT(DISTINCT room_id) AS inspected_rooms, (SELECT COUNT(*) FROM rooms) AS total_rooms FROM inspections\`);
    const [[urgentDamages]] = await pool.query(\`SELECT COUNT(*) AS count FROM utility_reports WHERE urgency = 'Segera' AND status != 'Selesai'\`);
    const [[calibratedAlkes]] = await pool.query(\`SELECT COUNT(*) AS count FROM inventories WHERE (category = 'Kalibrasi' OR (category = 'Alkes' AND calibration_date IS NOT NULL))\`);
    const [[incidentCount]] = await pool.query(\`SELECT COUNT(*) AS total, SUM(CASE WHEN status = 'Selesai' THEN 1 ELSE 0 END) AS selesai FROM incident_reports\`);

    const inspectionPercentage = inspectionStats.total_rooms
      ? Math.round((inspectionStats.inspected_rooms / inspectionStats.total_rooms) * 100)
      : 0;

    res.json({
      success: true,
      data: {
        laporanSelesai: completedReports.total_selesai || 0,
        laporanTerlambat: completedReports.total_terlambat || 0,
        persentaseInspeksi: inspectionPercentage,
        kerusakanSegera: urgentDamages.count || 0,
        jumlahKalibrasi: calibratedAlkes.count || 0,
        totalInsiden: incidentCount.total || 0,
        insidenSelesai: incidentCount.selesai || 0,
        ruanganList: roomStatuses,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get("/api/rooms", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM rooms ORDER BY id ASC");
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get("/api/inventories", async (req, res) => {
  try {
    const { page, limit, offset, search } = getPaginationParams(req.query);
    const category = req.query.category || "";
    let whereClauses = ["1=1"];
    let params = [];

    if (category) {
      whereClauses.push("i.category = ?");
      params.push(category);
    }
    if (search) {
      whereClauses.push("(i.item_name LIKE ? OR r.name LIKE ? OR i.notes LIKE ?)");
      params.push(\`%\${search}%\`, \`%\${search}%\`, \`%\${search}%\`);
    }

    const whereSql = whereClauses.join(" AND ");
    const [[{ total }]] = await pool.query(\`SELECT COUNT(*) AS total FROM inventories i JOIN rooms r ON i.room_id = r.id WHERE \${whereSql}\`, params);
    const [rows] = await pool.query(
      \`SELECT i.*, r.name AS room_name FROM inventories i JOIN rooms r ON i.room_id = r.id WHERE \${whereSql} ORDER BY i.created_at DESC LIMIT ? OFFSET ?\`,
      [...params, limit, offset]
    );
    formatPaginatedResponse(res, rows, page, limit, total);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post("/api/inventories", async (req, res) => {
  try {
    const { category, room_id, item_name, quantity, unit, condition_status, needs_calibration, calibration_date, next_calibration_date, calibration_institution, notes } = req.body;
    const [result] = await pool.query(
      \`INSERT INTO inventories (category, room_id, item_name, quantity, unit, condition_status, needs_calibration, calibration_date, next_calibration_date, calibration_institution, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)\`,
      [category, room_id, item_name, quantity || 1, unit || "Unit", condition_status || "Baik", needs_calibration ? 1 : 0, calibration_date || null, next_calibration_date || null, calibration_institution || null, notes || ""]
    );
    res.json({ success: true, id: result.insertId });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.put("/api/inventories/:id", async (req, res) => {
  try {
    const { category, room_id, item_name, quantity, unit, condition_status, needs_calibration, calibration_date, next_calibration_date, calibration_institution, notes } = req.body;
    await pool.query(
      \`UPDATE inventories SET category=?, room_id=?, item_name=?, quantity=?, unit=?, condition_status=?, needs_calibration=?, calibration_date=?, next_calibration_date=?, calibration_institution=?, notes=? WHERE id=?\`,
      [category, room_id, item_name, quantity, unit, condition_status, needs_calibration ? 1 : 0, calibration_date || null, next_calibration_date || null, calibration_institution || null, notes, req.params.id]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.delete("/api/inventories/:id", async (req, res) => {
  try {
    await pool.query("DELETE FROM inventories WHERE id = ?", [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get("/api/inspections", async (req, res) => {
  try {
    const { page, limit, offset, search } = getPaginationParams(req.query);
    const type = req.query.inspection_type || "";
    let whereClauses = ["1=1"];
    let params = [];

    if (type) {
      whereClauses.push("ins.inspection_type = ?");
      params.push(type);
    }
    if (search) {
      whereClauses.push("(ins.officer_name LIKE ? OR r.name LIKE ? OR ins.finding_description LIKE ?)");
      params.push(\`%\${search}%\`, \`%\${search}%\`, \`%\${search}%\`);
    }

    const whereSql = whereClauses.join(" AND ");
    const [[{ total }]] = await pool.query(\`SELECT COUNT(*) AS total FROM inspections ins JOIN rooms r ON ins.room_id = r.id WHERE \${whereSql}\`, params);
    const [rows] = await pool.query(
      \`SELECT ins.*, r.name AS room_name FROM inspections ins JOIN rooms r ON ins.room_id = r.id WHERE \${whereSql} ORDER BY ins.inspection_datetime DESC LIMIT ? OFFSET ?\`,
      [...params, limit, offset]
    );
    formatPaginatedResponse(res, rows, page, limit, total);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post("/api/inspections", async (req, res) => {
  try {
    const { inspection_type, inspection_datetime, officer_name, work_unit, room_id, inspection_items, standard_condition, result_status, finding_description, risk_level, recommendation, status_tindak_lanjut } = req.body;
    const [result] = await pool.query(
      \`INSERT INTO inspections (inspection_type, inspection_datetime, officer_name, work_unit, room_id, inspection_items, standard_condition, result_status, finding_description, risk_level, recommendation, status_tindak_lanjut) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)\`,
      [inspection_type, inspection_datetime || new Date(), officer_name, work_unit, room_id, inspection_items, standard_condition, result_status || "Baik", finding_description || "", risk_level || "Rendah", recommendation || "", status_tindak_lanjut || "Selesai"]
    );
    if (result_status === "Perlu Perbaikan") {
      await pool.query("UPDATE rooms SET condition_status = 'Perlu Perbaikan' WHERE id = ?", [room_id]);
    } else if (result_status === "Tidak Memenuhi Standar") {
      await pool.query("UPDATE rooms SET condition_status = 'Rusak Berat' WHERE id = ?", [room_id]);
    }
    res.json({ success: true, id: result.insertId });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get("/api/utility-reports", async (req, res) => {
  try {
    const { page, limit, offset, search } = getPaginationParams(req.query);
    let whereClauses = ["1=1"];
    let params = [];
    if (search) {
      whereClauses.push("(u.officer_name LIKE ? OR r.name LIKE ? OR u.damage_description LIKE ?)");
      params.push(\`%\${search}%\`, \`%\${search}%\`, \`%\${search}%\`);
    }
    const whereSql = whereClauses.join(" AND ");
    const [[{ total }]] = await pool.query(\`SELECT COUNT(*) AS total FROM utility_reports u JOIN rooms r ON u.room_id = r.id WHERE \${whereSql}\`, params);
    const [rows] = await pool.query(
      \`SELECT u.*, r.name AS room_name FROM utility_reports u JOIN rooms r ON u.room_id = r.id WHERE \${whereSql} ORDER BY u.report_datetime DESC LIMIT ? OFFSET ?\`,
      [...params, limit, offset]
    );
    formatPaginatedResponse(res, rows, page, limit, total);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post("/api/utility-reports", upload.single("photo"), async (req, res) => {
  try {
    const { report_datetime, officer_name, work_unit, room_id, utility_system, damage_description, recommendation, urgency, status } = req.body;
    const photo_url = req.file ? \`/\${UPLOAD_DIR}/\${req.file.filename}\` : null;
    const [result] = await pool.query(
      \`INSERT INTO utility_reports (report_datetime, officer_name, work_unit, room_id, utility_system, damage_description, recommendation, urgency, status, photo_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)\`,
      [report_datetime || new Date(), officer_name, work_unit, room_id, utility_system, damage_description, recommendation, urgency || "Segera", status || "Menunggu", photo_url]
    );
    res.json({ success: true, id: result.insertId });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get("/api/incidents", async (req, res) => {
  try {
    const { page, limit, offset, search } = getPaginationParams(req.query);
    let whereClauses = ["1=1"];
    let params = [];
    if (search) {
      whereClauses.push("(report_number LIKE ? OR location LIKE ? OR reporter_name LIKE ? OR chronology LIKE ?)");
      params.push(\`%\${search}%\`, \`%\${search}%\`, \`%\${search}%\`, \`%\${search}%\`);
    }
    const whereSql = whereClauses.join(" AND ");
    const [[{ total }]] = await pool.query(\`SELECT COUNT(*) AS total FROM incident_reports WHERE \${whereSql}\`, params);
    const [rows] = await pool.query(\`SELECT * FROM incident_reports WHERE \${whereSql} ORDER BY incident_datetime DESC LIMIT ? OFFSET ?\`, [...params, limit, offset]);
    formatPaginatedResponse(res, rows, page, limit, total);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post("/api/incidents", async (req, res) => {
  try {
    const { incident_datetime, location, category, chronology, affected_party, actual_impact, potential_impact, initial_action, risk_grading, reporter_name, handler_pic, investigation_result, corrective_action, status } = req.body;
    const now = new Date();
    const prefix = \`INC-\${now.getFullYear()}\${String(now.getMonth() + 1).padStart(2, "0")}\`;
    const [[{ count }]] = await pool.query(\`SELECT COUNT(*) AS count FROM incident_reports WHERE report_number LIKE ?\`, [\`\${prefix}%\`]);
    const report_number = \`\${prefix}-\${String(count + 1).padStart(3, "0")}\`;

    const [result] = await pool.query(
      \`INSERT INTO incident_reports (report_number, incident_datetime, location, category, chronology, affected_party, actual_impact, potential_impact, initial_action, risk_grading, reporter_name, handler_pic, investigation_result, corrective_action, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)\`,
      [report_number, incident_datetime || now, location, category, chronology, affected_party, actual_impact, potential_impact, initial_action, risk_grading, reporter_name, handler_pic, investigation_result || "", corrective_action || "", status || "Investigasi"]
    );
    res.json({ success: true, report_number, id: result.insertId });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get("/api/periodic-reports", async (req, res) => {
  try {
    const { period_type = "monthly", month = "10", year = "2026" } = req.query;
    let dateFilterInspections = "YEAR(ins.inspection_datetime) = ?";
    let dateFilterUtility = "YEAR(u.report_datetime) = ?";
    let dateFilterIncident = "YEAR(incident_datetime) = ?";
    let params = [year];

    if (period_type === "monthly") {
      dateFilterInspections += " AND MONTH(ins.inspection_datetime) = ?";
      dateFilterUtility += " AND MONTH(u.report_datetime) = ?";
      dateFilterIncident += " AND MONTH(incident_datetime) = ?";
      params.push(month);
    }

    const [inspections] = await pool.query(\`SELECT ins.*, r.name AS room_name FROM inspections ins JOIN rooms r ON ins.room_id = r.id WHERE \${dateFilterInspections} ORDER BY ins.inspection_datetime DESC\`, params);
    const [utilities] = await pool.query(\`SELECT u.*, r.name AS room_name FROM utility_reports u JOIN rooms r ON u.room_id = r.id WHERE \${dateFilterUtility} ORDER BY u.report_datetime DESC\`, params);
    const [incidents] = await pool.query(\`SELECT * FROM incident_reports WHERE \${dateFilterIncident} ORDER BY incident_datetime DESC\`, params);

    res.json({
      success: true,
      data: {
        period_type, month, year,
        summary: {
          total_inspections: inspections.length,
          total_utility_damages: utilities.length,
          total_incidents: incidents.length,
        },
        inspections, utilities, incidents,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.listen(PORT, () => console.log(\`Server MFK Puskesmas berjalan di http://localhost:\${PORT}\`));
`,

  // 5. FRONTEND CONFIG FILES
  "frontend/package.json": JSON.stringify(
    {
      name: "frontend-mfk-puskesmas",
      private: true,
      version: "1.0.0",
      type: "module",
      scripts: {
        dev: "vite",
        build: "vite build",
        preview: "vite preview",
      },
      dependencies: {
        axios: "^1.7.2",
        "lucide-react": "^0.400.0",
        react: "^18.3.1",
        "react-dom": "^18.3.1",
        "react-hot-toast": "^2.4.1",
        "react-router-dom": "^6.24.0",
      },
      devDependencies: {
        "@vitejs/plugin-react": "^4.3.1",
        autoprefixer: "^10.4.19",
        postcss: "^8.4.38",
        tailwindcss: "^3.4.4",
        vite: "^5.3.1",
        "vite-plugin-pwa": "^0.20.0",
      },
    },
    null,
    2
  ),

  "frontend/.env": `VITE_API_URL=http://localhost:5000/api\n`,

  "frontend/vite.config.js": `import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      manifest: {
        name: "SIKELAK Puskesmas",
        short_name: "MFK Puskesmas",
        description: "Aplikasi Manajemen Fasilitas & Keselamatan Puskesmas",
        theme_color: "#047857",
        background_color: "#ffffff",
        display: "standalone",
        start_url: "/",
      },
    }),
  ],
});
`,

  "frontend/tailwind.config.js": `/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {},
  },
  plugins: [],
};
`,

  "frontend/postcss.config.js": `export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
`,

  "frontend/index.html": `<!DOCTYPE html>
<html lang="id">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>SIKELAK Puskesmas</title>
  </head>
  <body class="bg-slate-50 text-slate-800">
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
`,

  "frontend/src/index.css": `@tailwind base;
@tailwind components;
@tailwind utilities;
`,

  "frontend/src/main.jsx": `import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
`,

  // 6. FRONTEND UTILS (MANDATORY BY AGENTS.MD)
  "frontend/src/utils/endpoints.js": `export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: "/auth/login",
    REGISTER: "/auth/register",
    PROFILE: "/auth/profile",
  },
  DASHBOARD: {
    SUMMARY: "/dashboard",
  },
  ROOMS: {
    LIST: "/rooms",
  },
  INVENTORIES: {
    LIST: "/inventories",
    CREATE: "/inventories",
    UPDATE: (id) => \`/inventories/\${id}\`,
    DELETE: (id) => \`/inventories/\${id}\`,
  },
  INSPECTIONS: {
    LIST: "/inspections",
    CREATE: "/inspections",
    UPDATE: (id) => \`/inspections/\${id}\`,
    DELETE: (id) => \`/inspections/\${id}\`,
  },
  UTILITY_REPORTS: {
    LIST: "/utility-reports",
    CREATE: "/utility-reports",
    UPDATE: (id) => \`/utility-reports/\${id}\`,
    DELETE: (id) => \`/utility-reports/\${id}\`,
  },
  INCIDENTS: {
    LIST: "/incidents",
    CREATE: "/incidents",
    UPDATE: (id) => \`/incidents/\${id}\`,
    DELETE: (id) => \`/incidents/\${id}\`,
  },
  PERIODIC_REPORTS: {
    LIST: "/periodic-reports",
  },
};
`,

  "frontend/src/utils/api.js": `import axios from "axios";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  headers: {
    "Content-Type": "application/json",
  },
});
`,

  "frontend/src/utils/request.js": `import { api } from "./api";

export const request = {
  get: async (url, params = {}) => {
    const response = await api.get(url, { params });
    return response.data;
  },
  post: async (url, data = {}) => {
    const response = await api.post(url, data);
    return response.data;
  },
  put: async (url, data = {}) => {
    const response = await api.put(url, data);
    return response.data;
  },
  delete: async (url) => {
    const response = await api.delete(url);
    return response.data;
  },
};
`,

  "frontend/src/hooks/useDebounce.js": `import { useState, useEffect } from "react";

export function useDebounce(value, delay = 300) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debouncedValue;
}
`,

  // 7. FRONTEND REUSABLE COMPONENTS
  "frontend/src/components/Common/Pagination.jsx": `import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function Pagination({ pagination, onPageChange, onLimitChange }) {
  const { page, limit, total, totalPages } = pagination;
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-4 pt-4 border-t border-slate-200">
      <div className="flex items-center gap-2 text-sm text-slate-600">
        <span>Tampilkan</span>
        <select
          value={limit}
          onChange={(e) => onLimitChange(Number(e.target.value))}
          className="border border-slate-300 rounded-lg px-2 py-1"
        >
          {[10, 25, 50, 100].map((val) => (
            <option key={val} value={val}>{val}</option>
          ))}
        </select>
        <span>dari total <b>{total}</b> data</span>
      </div>
      <div className="flex items-center gap-1">
        <button
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg border text-sm disabled:opacity-40"
        >
          <ChevronLeft className="w-4 h-4" /> Prev
        </button>
        {pages.map((p) => (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            className={\`px-3 py-1.5 rounded-lg text-sm font-medium \${
              p === page ? "bg-emerald-600 text-white" : "border border-slate-200 text-slate-700"
            }\`}
          >
            {p}
          </button>
        ))}
        <button
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg border text-sm disabled:opacity-40"
        >
          Next <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
`,

  "frontend/src/components/Common/Modal.jsx": `import React from "react";
import { X } from "lucide-react";

export default function Modal({ isOpen, onClose, title, children }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 bg-emerald-700 text-white">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-emerald-600">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 max-h-[80vh] overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}
`,

  "frontend/src/components/Layout/Sidebar.jsx": `import React from "react";
import { NavLink } from "react-router-dom";
import { LayoutDashboard, PackageCheck, ShieldCheck, AlertTriangle, FileSpreadsheet, Building2, X } from "lucide-react";

const menus = [
  { name: "01. Dashboard", path: "/", icon: LayoutDashboard },
  { name: "02. Inventarisasi", path: "/inventarisasi", icon: PackageCheck },
  { name: "03. Fasilitas & Utilitas", path: "/fasilitas-utilitas", icon: ShieldCheck },
  { name: "04. Insiden & Risiko", path: "/insiden-risiko", icon: AlertTriangle },
  { name: "05. Laporan Periodik", path: "/laporan-periodik", icon: FileSpreadsheet },
];

export default function Sidebar({ isOpen, setIsOpen }) {
  return (
    <>
      {isOpen && <div onClick={() => setIsOpen(false)} className="fixed inset-0 bg-black/40 z-30 lg:hidden" />}
      <aside className={\`fixed top-0 left-0 z-40 h-screen w-64 bg-emerald-900 text-white transition-transform duration-300 lg:translate-x-0 \${isOpen ? "translate-x-0" : "-translate-x-full"}\`}>
        <div className="flex items-center justify-between px-6 py-5 border-b border-emerald-800">
          <div className="flex items-center gap-3">
            <Building2 className="w-7 h-7 text-emerald-400" />
            <div>
              <h1 className="font-bold text-base">SIKELAK</h1>
              <p className="text-xs text-emerald-300">Puskesmas Digital</p>
            </div>
          </div>
          <button onClick={() => setIsOpen(false)} className="lg:hidden"><X className="w-5 h-5" /></button>
        </div>
        <nav className="p-4 space-y-1.5">
          {menus.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setIsOpen(false)}
                className={({ isActive }) => \`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium \${isActive ? "bg-emerald-600 text-white" : "text-emerald-100 hover:bg-emerald-800"}\`}
              >
                <Icon className="w-5 h-5" />
                <span>{item.name}</span>
              </NavLink>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
`,

  // 8. FRONTEND PAGES
  "frontend/src/pages/Dashboard.jsx": `import React, { useEffect, useState } from "react";
import { request } from "../utils/request";
import { API_ENDPOINTS } from "../utils/endpoints";
import { CheckCircle2, Percent, Wrench, Activity, ShieldAlert, Building } from "lucide-react";

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    request.get(API_ENDPOINTS.DASHBOARD.SUMMARY)
      .then((res) => setData(res.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-8 text-center text-slate-500">Memuat ringkasan MFK Puskesmas...</div>;

  const statCards = [
    { title: "Laporan Selesai vs Terlambat", value: \`\${data.laporanSelesai} Selesai / \${data.laporanTerlambat} Terlambat\`, icon: CheckCircle2, color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
    { title: "Persentase Inspeksi Fasilitas", value: \`\${data.persentaseInspeksi}% Ruangan Diinspeksi\`, icon: Percent, color: "bg-blue-50 text-blue-700 border-blue-200" },
    { title: "Kerusakan Penanganan Segera", value: \`\${data.kerusakanSegera} Temuan Urgen\`, icon: Wrench, color: "bg-amber-50 text-amber-700 border-amber-200" },
    { title: "Alat Kesehatan Terkalibrasi", value: \`\${data.jumlahKalibrasi} Unit Alkes\`, icon: Activity, color: "bg-purple-50 text-purple-700 border-purple-200" },
    { title: "Rekap Insiden Keselamatan", value: \`\${data.totalInsiden} Insiden (\${data.insidenSelesai} Selesai)\`, icon: ShieldAlert, color: "bg-rose-50 text-rose-700 border-rose-200" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Dashboard Monitoring MFK Puskesmas</h2>
        <p className="text-sm text-slate-500">Ringkasan kondisi fasilitas per ruangan, inspeksi, kalibrasi, risiko, dan tindak lanjut.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {statCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <div key={i} className={\`p-5 rounded-2xl border \${card.color} flex items-center gap-4\`}>
              <div className="p-3 rounded-xl bg-white/80"><Icon className="w-6 h-6" /></div>
              <div>
                <p className="text-xs font-medium opacity-80">{card.title}</p>
                <p className="text-lg font-bold mt-0.5">{card.value}</p>
              </div>
            </div>
          );
        })}
      </div>
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Building className="w-5 h-5 text-emerald-600" />
          <h3 className="font-semibold text-slate-800">Status Kondisi Sarana & Prasarana Setiap Ruangan / Klaster</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-600 uppercase text-xs">
              <tr>
                <th className="p-3">No</th>
                <th className="p-3">Nama Ruangan / Klaster / Sanitasi</th>
                <th className="p-3">Kategori Area</th>
                <th className="p-3">Penanggung Jawab</th>
                <th className="p-3">Status Kondisi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {data.ruanganList.map((room, idx) => (
                <tr key={room.id}>
                  <td className="p-3">{idx + 1}</td>
                  <td className="p-3 font-medium">{room.name}</td>
                  <td className="p-3">{room.category.replace("_", " ")}</td>
                  <td className="p-3">{room.pic_name}</td>
                  <td className="p-3">
                    <span className={\`px-2.5 py-1 rounded-full text-xs font-semibold \${room.condition_status === "Baik" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}\`}>
                      {room.condition_status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
`,

  "frontend/src/pages/Inventarisasi.jsx": `import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { Plus, Search, Edit, Trash2 } from "lucide-react";
import { request } from "../utils/request";
import { API_ENDPOINTS } from "../utils/endpoints";
import { useDebounce } from "../hooks/useDebounce";
import Pagination from "../components/Common/Pagination";
import Modal from "../components/Common/Modal";

const TABS = [
  { key: "B3", label: "Bahan Kimia (B3)" },
  { key: "Sarpras", label: "Sarana & Prasarana" },
  { key: "Alkes", label: "Alat Kesehatan" },
  { key: "Kalibrasi", label: "Pencatatan Kalibrasi" },
];

export default function Inventarisasi() {
  const [activeTab, setActiveTab] = useState("B3");
  const [items, setItems] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    category: "B3", room_id: "", item_name: "", quantity: 1, unit: "Unit",
    condition_status: "Baik", needs_calibration: false, calibration_date: "",
    next_calibration_date: "", calibration_institution: "", notes: "",
  });

  useEffect(() => {
    request.get(API_ENDPOINTS.ROOMS.LIST).then((res) => setRooms(res.data || []));
  }, []);

  const fetchInventories = async () => {
    const res = await request.get(API_ENDPOINTS.INVENTORIES.LIST, {
      page: pagination.page, limit: pagination.limit, search: debouncedSearch, category: activeTab,
    });
    setItems(res.data);
    setPagination(res.pagination);
  };

  useEffect(() => {
    fetchInventories();
  }, [activeTab, pagination.page, pagination.limit, debouncedSearch]);

  const openCreateModal = () => {
    setEditingItem(null);
    setFormData({
      category: activeTab, room_id: rooms[0]?.id || "", item_name: "", quantity: 1, unit: "Unit",
      condition_status: "Baik", needs_calibration: activeTab === "Alkes" || activeTab === "Kalibrasi",
      calibration_date: "", next_calibration_date: "", calibration_institution: "", notes: "",
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (editingItem) {
      await request.put(API_ENDPOINTS.INVENTORIES.UPDATE(editingItem.id), formData);
      toast.success("Data diperbarui");
    } else {
      await request.post(API_ENDPOINTS.INVENTORIES.CREATE, formData);
      toast.success("Data ditambahkan");
    }
    setIsModalOpen(false);
    fetchInventories();
  };

  const handleDelete = async (id) => {
    await request.delete(API_ENDPOINTS.INVENTORIES.DELETE(id));
    toast.success("Data dihapus");
    fetchInventories();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">02. Inventarisasi Ruangan</h2>
        <button onClick={openCreateModal} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm">
          <Plus className="w-4 h-4" /> Tambah {activeTab}
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button key={t.key} onClick={() => setActiveTab(t.key)} className={\`px-4 py-2 rounded-xl text-sm font-medium \${activeTab === t.key ? "bg-emerald-600 text-white" : "bg-white border"}\`}>
            {t.label}
          </button>
        ))}
      </div>
      <div className="bg-white rounded-2xl border p-6">
        <div className="relative max-w-sm mb-4">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input type="text" placeholder="Cari inventaris..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-9 pr-4 py-2 border rounded-xl text-sm" />
        </div>
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 text-xs uppercase">
            <tr>
              <th className="p-3">Ruangan</th>
              <th className="p-3">Nama Item</th>
              <th className="p-3">Jumlah</th>
              <th className="p-3">Kondisi</th>
              <th className="p-3">Keterangan</th>
              <th className="p-3 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {items.map((item) => (
              <tr key={item.id}>
                <td className="p-3 font-medium">{item.room_name}</td>
                <td className="p-3">{item.item_name}</td>
                <td className="p-3">{item.quantity} {item.unit}</td>
                <td className="p-3">{item.condition_status}</td>
                <td className="p-3">{item.notes}</td>
                <td className="p-3 text-right space-x-2">
                  <button onClick={() => { setEditingItem(item); setFormData(item); setIsModalOpen(true); }} className="text-blue-600"><Edit className="w-4 h-4 inline" /></button>
                  <button onClick={() => handleDelete(item.id)} className="text-rose-600"><Trash2 className="w-4 h-4 inline" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <Pagination pagination={pagination} onPageChange={(page) => setPagination((p) => ({ ...p, page }))} onLimitChange={(limit) => setPagination((p) => ({ ...p, limit, page: 1 }))} />
      </div>
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={\`Form \${activeTab}\`}>
        <form onSubmit={handleSubmit} className="space-y-3 text-sm">
          <select value={formData.room_id} onChange={(e) => setFormData({ ...formData, room_id: e.target.value })} className="w-full border rounded-xl p-2">
            {rooms.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>
          <input type="text" required placeholder="Nama Item / Alat" value={formData.item_name} onChange={(e) => setFormData({ ...formData, item_name: e.target.value })} className="w-full border rounded-xl p-2" />
          <div className="grid grid-cols-2 gap-2">
            <input type="number" required value={formData.quantity} onChange={(e) => setFormData({ ...formData, quantity: e.target.value })} className="border rounded-xl p-2" />
            <input type="text" value={formData.unit} onChange={(e) => setFormData({ ...formData, unit: e.target.value })} className="border rounded-xl p-2" />
          </div>
          <textarea placeholder="Catatan" value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} className="w-full border rounded-xl p-2" />
          <div className="flex justify-end gap-2">
            <button type="submit" className="px-4 py-2 bg-emerald-600 text-white rounded-xl">Simpan</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
`,

  "frontend/src/pages/FasilitasUtilitas.jsx": `import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { Plus, Search, CheckSquare, Wrench } from "lucide-react";
import { request } from "../utils/request";
import { API_ENDPOINTS } from "../utils/endpoints";
import { useDebounce } from "../hooks/useDebounce";
import Pagination from "../components/Common/Pagination";
import Modal from "../components/Common/Modal";

const INSPECTION_TYPES = [
  { name: "Inspeksi Ruangan", freq: "Setiap Hari (PJ Ruangan)", defaultItems: "Kondisi kebersihan ruangan" },
  { name: "Inspeksi Bangunan", freq: "Setiap Hari (PJ Ruangan)", defaultItems: "Lantai, dinding, plafon, atap, pintu, jendela" },
  { name: "Inspeksi Listrik", freq: "Setiap Hari (PJ Ruangan)", defaultItems: "Panel listrik, kabel, stopkontak, grounding, UPS, genset" },
  { name: "Inspeksi Air dan Sanitasi", freq: "Setiap Hari (10 Toilet)", defaultItems: "Air bersih, kebersihan toilet, drainase, handsoap" },
  { name: "Inspeksi Kebakaran", freq: "1 Bulan Sekali", defaultItems: "APAR, alarm, detektor, rambu & jalur evakuasi" },
  { name: "Inspeksi Limbah", freq: "Setiap Hari (PJ Ruangan)", defaultItems: "Pemilahan limbah medis & non-medis, pengangkutan" },
  { name: "Inspeksi Gas Medis", freq: "1 Bulan Sekali", defaultItems: "Tabung oksigen, regulator, penyimpanan, kebocoran" },
  { name: "Inspeksi Lingkungan", freq: "1 Bulan Sekali", defaultItems: "NAB pencahayaan, ventilasi, suhu, kebisingan" },
];

const UTILITY_SYSTEMS = [
  "Sistem Kelistrikan", "Sistem Gas Medis", "Sistem Proteksi Kebakaran",
  "Sistem Komunikasi dan TI", "Sistem Pendinginan Khusus", "Sistem Tata Udara dan Ventilasi",
];

export default function FasilitasUtilitas() {
  const [mode, setMode] = useState("inspeksi");
  const [selectedType, setSelectedType] = useState(INSPECTION_TYPES[0].name);
  const [rooms, setRooms] = useState([]);
  const [list, setList] = useState([]);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [inspectionForm, setInspectionForm] = useState({
    inspection_type: INSPECTION_TYPES[0].name, inspection_datetime: new Date().toISOString().slice(0, 16),
    officer_name: "", work_unit: "", room_id: "", inspection_items: INSPECTION_TYPES[0].defaultItems,
    standard_condition: "Bersih, aman, sesuai standar", result_status: "Baik",
    finding_description: "", risk_level: "Rendah", recommendation: "",
  });

  const [utilityForm, setUtilityForm] = useState({
    report_datetime: new Date().toISOString().slice(0, 16), officer_name: "", work_unit: "",
    room_id: "", utility_system: UTILITY_SYSTEMS[0], damage_description: "", recommendation: "",
  });

  useEffect(() => {
    request.get(API_ENDPOINTS.ROOMS.LIST).then((res) => setRooms(res.data || []));
  }, []);

  const fetchData = async () => {
    if (mode === "inspeksi") {
      const res = await request.get(API_ENDPOINTS.INSPECTIONS.LIST, {
        page: pagination.page, limit: pagination.limit, search: debouncedSearch, inspection_type: selectedType,
      });
      setList(res.data);
      setPagination(res.pagination);
    } else {
      const res = await request.get(API_ENDPOINTS.UTILITY_REPORTS.LIST, {
        page: pagination.page, limit: pagination.limit, search: debouncedSearch,
      });
      setList(res.data);
      setPagination(res.pagination);
    }
  };

  useEffect(() => { fetchData(); }, [mode, selectedType, pagination.page, pagination.limit, debouncedSearch]);

  const handleSave = async (e) => {
    e.preventDefault();
    if (mode === "inspeksi") {
      await request.post(API_ENDPOINTS.INSPECTIONS.CREATE, { ...inspectionForm, inspection_type: selectedType, room_id: inspectionForm.room_id || rooms[0]?.id });
    } else {
      await request.post(API_ENDPOINTS.UTILITY_REPORTS.CREATE, { ...utilityForm, room_id: utilityForm.room_id || rooms[0]?.id });
    }
    toast.success("Data berhasil disimpan");
    setIsModalOpen(false);
    fetchData();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-2xl font-bold">03. Fasilitas dan Utilitas</h2>
        <div className="flex gap-2">
          <button onClick={() => setMode("inspeksi")} className={\`px-4 py-2 rounded-xl text-sm font-medium \${mode === "inspeksi" ? "bg-emerald-600 text-white" : "bg-white border"}\`}>
            <CheckSquare className="w-4 h-4 inline mr-1" /> Inspeksi Berkala
          </button>
          <button onClick={() => setMode("pelaporan")} className={\`px-4 py-2 rounded-xl text-sm font-medium \${mode === "pelaporan" ? "bg-amber-600 text-white" : "bg-white border"}\`}>
            <Wrench className="w-4 h-4 inline mr-1" /> Lapor Kerusakan Utilitas
          </button>
        </div>
      </div>

      {mode === "inspeksi" && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {INSPECTION_TYPES.map((t) => (
            <button key={t.name} onClick={() => setSelectedType(t.name)} className={\`p-3 rounded-xl border text-left \${selectedType === t.name ? "bg-emerald-50 border-emerald-600" : "bg-white"}\`}>
              <p className="font-semibold text-xs">{t.name}</p>
              <p className="text-[11px] text-slate-500">{t.freq}</p>
            </button>
          ))}
        </div>
      )}

      <div className="bg-white rounded-2xl border p-6">
        <div className="flex justify-between mb-4">
          <input type="text" placeholder="Cari..." value={search} onChange={(e) => setSearch(e.target.value)} className="border rounded-xl px-3 py-2 text-sm" />
          <button onClick={() => setIsModalOpen(true)} className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm">
            <Plus className="w-4 h-4 inline mr-1" /> Input Data
          </button>
        </div>
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 text-xs uppercase">
            <tr>
              <th className="p-3">Petugas & Unit</th>
              <th className="p-3">Ruangan / Lokasi</th>
              <th className="p-3">Detail / Hasil</th>
              <th className="p-3">Rekomendasi</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {list.map((row) => (
              <tr key={row.id}>
                <td className="p-3">{row.officer_name} ({row.work_unit})</td>
                <td className="p-3">{row.room_name}</td>
                <td className="p-3">{mode === "inspeksi" ? \`\${row.result_status} - \${row.finding_description}\` : \`\${row.utility_system}: \${row.damage_description}\`}</td>
                <td className="p-3">{row.recommendation}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <Pagination pagination={pagination} onPageChange={(page) => setPagination((p) => ({ ...p, page }))} onLimitChange={(limit) => setPagination((p) => ({ ...p, limit, page: 1 }))} />
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={mode === "inspeksi" ? selectedType : "Lapor Kerusakan Utilitas"}>
        <form onSubmit={handleSave} className="space-y-3 text-sm">
          <select onChange={(e) => mode === "inspeksi" ? setInspectionForm({ ...inspectionForm, room_id: e.target.value }) : setUtilityForm({ ...utilityForm, room_id: e.target.value })} className="w-full border rounded-xl p-2">
            {rooms.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>
          <input type="text" required placeholder="Nama Petugas" onChange={(e) => mode === "inspeksi" ? setInspectionForm({ ...inspectionForm, officer_name: e.target.value }) : setUtilityForm({ ...utilityForm, officer_name: e.target.value })} className="w-full border rounded-xl p-2" />
          <input type="text" required placeholder="Unit Kerja" onChange={(e) => mode === "inspeksi" ? setInspectionForm({ ...inspectionForm, work_unit: e.target.value }) : setUtilityForm({ ...utilityForm, work_unit: e.target.value })} className="w-full border rounded-xl p-2" />
          {mode === "inspeksi" ? (
            <>
              <select onChange={(e) => setInspectionForm({ ...inspectionForm, result_status: e.target.value })} className="w-full border rounded-xl p-2">
                <option value="Baik">Baik</option>
                <option value="Perlu Perbaikan">Perlu Perbaikan</option>
                <option value="Tidak Memenuhi Standar">Tidak Memenuhi Standar</option>
              </select>
              <textarea placeholder="Deskripsi Temuan" onChange={(e) => setInspectionForm({ ...inspectionForm, finding_description: e.target.value })} className="w-full border rounded-xl p-2" />
              <textarea placeholder="Rekomendasi Tindakan" onChange={(e) => setInspectionForm({ ...inspectionForm, recommendation: e.target.value })} className="w-full border rounded-xl p-2" />
            </>
          ) : (
            <>
              <select onChange={(e) => setUtilityForm({ ...utilityForm, utility_system: e.target.value })} className="w-full border rounded-xl p-2">
                {UTILITY_SYSTEMS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
              <textarea required placeholder="Deskripsi Kerusakan" onChange={(e) => setUtilityForm({ ...utilityForm, damage_description: e.target.value })} className="w-full border rounded-xl p-2" />
              <textarea required placeholder="Rekomendasi Tindakan" onChange={(e) => setUtilityForm({ ...utilityForm, recommendation: e.target.value })} className="w-full border rounded-xl p-2" />
            </>
          )}
          <button type="submit" className="w-full py-2 bg-emerald-600 text-white rounded-xl">Simpan</button>
        </form>
      </Modal>
    </div>
  );
}
`,

  "frontend/src/pages/InsidenRisiko.jsx": `import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { Plus } from "lucide-react";
import { request } from "../utils/request";
import { API_ENDPOINTS } from "../utils/endpoints";
import Pagination from "../components/Common/Pagination";
import Modal from "../components/Common/Modal";

export default function InsidenRisiko() {
  const [incidents, setIncidents] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({
    location: "", category: "Insiden Keselamatan Pasien dan Pengunjung", chronology: "",
    affected_party: "", actual_impact: "", potential_impact: "", initial_action: "",
    risk_grading: "Sedang (Hijau)", reporter_name: "", handler_pic: "Tim MFK",
    investigation_result: "", corrective_action: "",
  });

  const fetchIncidents = async () => {
    const res = await request.get(API_ENDPOINTS.INCIDENTS.LIST, { page: pagination.page, limit: pagination.limit });
    setIncidents(res.data);
    setPagination(res.pagination);
  };

  useEffect(() => { fetchIncidents(); }, [pagination.page, pagination.limit]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    await request.post(API_ENDPOINTS.INCIDENTS.CREATE, form);
    toast.success("Laporan insiden disimpan");
    setIsModalOpen(false);
    fetchIncidents();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">04. Pelaporan Insiden & Risiko</h2>
        <button onClick={() => setIsModalOpen(true)} className="px-4 py-2 bg-rose-600 text-white rounded-xl text-sm">
          <Plus className="w-4 h-4 inline mr-1" /> Lapor Insiden
        </button>
      </div>
      <div className="bg-white rounded-2xl border p-6">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 text-xs uppercase">
            <tr>
              <th className="p-3">No Laporan</th>
              <th className="p-3">Kategori & Lokasi</th>
              <th className="p-3">Kronologi</th>
              <th className="p-3">Risiko</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {incidents.map((inc) => (
              <tr key={inc.id}>
                <td className="p-3 font-bold text-rose-600">{inc.report_number}</td>
                <td className="p-3">{inc.category} - {inc.location}</td>
                <td className="p-3">{inc.chronology}</td>
                <td className="p-3">{inc.risk_grading}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <Pagination pagination={pagination} onPageChange={(page) => setPagination((p) => ({ ...p, page }))} onLimitChange={(limit) => setPagination((p) => ({ ...p, limit, page: 1 }))} />
      </div>
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Form Insiden Keselamatan">
        <form onSubmit={handleSubmit} className="space-y-3 text-sm">
          <input type="text" required placeholder="Lokasi Kejadian" onChange={(e) => setForm({ ...form, location: e.target.value })} className="w-full border rounded-xl p-2" />
          <textarea required placeholder="Kronologi" onChange={(e) => setForm({ ...form, chronology: e.target.value })} className="w-full border rounded-xl p-2" />
          <input type="text" required placeholder="Pihak Terdampak" onChange={(e) => setForm({ ...form, affected_party: e.target.value })} className="w-full border rounded-xl p-2" />
          <input type="text" required placeholder="Dampak Aktual" onChange={(e) => setForm({ ...form, actual_impact: e.target.value })} className="w-full border rounded-xl p-2" />
          <input type="text" required placeholder="Potensi Dampak" onChange={(e) => setForm({ ...form, potential_impact: e.target.value })} className="w-full border rounded-xl p-2" />
          <input type="text" required placeholder="Tindakan Pengamanan Awal" onChange={(e) => setForm({ ...form, initial_action: e.target.value })} className="w-full border rounded-xl p-2" />
          <input type="text" required placeholder="Nama Pelapor" onChange={(e) => setForm({ ...form, reporter_name: e.target.value })} className="w-full border rounded-xl p-2" />
          <button type="submit" className="w-full py-2 bg-rose-600 text-white rounded-xl">Simpan Laporan</button>
        </form>
      </Modal>
    </div>
  );
}
`,

  "frontend/src/pages/LaporanPeriodik.jsx": `import React, { useState, useEffect } from "react";
import { Download, Printer } from "lucide-react";
import { request } from "../utils/request";
import { API_ENDPOINTS } from "../utils/endpoints";
import toast from "react-hot-toast";

export default function LaporanPeriodik() {
  const [periodType, setPeriodType] = useState("monthly");
  const [month, setMonth] = useState("10");
  const [year, setYear] = useState("2026");
  const [reportData, setReportData] = useState(null);

  useEffect(() => {
    request.get(API_ENDPOINTS.PERIODIC_REPORTS.LIST, { period_type: periodType, month, year })
      .then((res) => setReportData(res.data));
  }, [periodType, month, year]);

  const downloadCSV = () => {
    if (!reportData) return;
    const rows = [
      ["LAPORAN MFK PUSKESMAS", periodType === "monthly" ? \`Bulan \${month}/\${year}\` : \`Tahun \${year}\`],
      [],
      ["Waktu", "Jenis Inspeksi", "Ruangan", "Petugas", "Hasil", "Temuan", "Rekomendasi"],
      ...reportData.inspections.map((i) => [i.inspection_datetime, i.inspection_type, i.room_name, i.officer_name, i.result_status, i.finding_description, i.recommendation]),
    ];
    const csvContent = "data:text/csv;charset=utf-8," + rows.map((e) => e.map((c) => \`"\${c || ""}"\`).join(",")).join("\\n");
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", \`Laporan_MFK_\${periodType}_\${year}_\${month}.csv\`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Laporan CSV berhasil didownload");
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">05. Laporan Periodik (Bulanan & Tahunan)</h2>
        <div className="flex gap-2">
          <button onClick={downloadCSV} className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm"><Download className="w-4 h-4 inline mr-1" /> Download CSV</button>
          <button onClick={() => window.print()} className="px-4 py-2 bg-slate-800 text-white rounded-xl text-sm"><Printer className="w-4 h-4 inline mr-1" /> Cetak PDF</button>
        </div>
      </div>
      {reportData && (
        <div className="bg-white p-6 rounded-2xl border grid grid-cols-3 gap-4">
          <div className="p-4 bg-emerald-50 rounded-xl">Total Inspeksi: <b>{reportData.summary.total_inspections}</b></div>
          <div className="p-4 bg-amber-50 rounded-xl">Total Kerusakan: <b>{reportData.summary.total_utility_damages}</b></div>
          <div className="p-4 bg-rose-50 rounded-xl">Total Insiden: <b>{reportData.summary.total_incidents}</b></div>
        </div>
      )}
    </div>
  );
}
`,

  "frontend/src/App.jsx": `import React, { useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { Menu } from "lucide-react";
import Sidebar from "./components/Layout/Sidebar";
import Dashboard from "./pages/Dashboard";
import Inventarisasi from "./pages/Inventarisasi";
import FasilitasUtilitas from "./pages/FasilitasUtilitas";
import InsidenRisiko from "./pages/InsidenRisiko";
import LaporanPeriodik from "./pages/LaporanPeriodik";

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  return (
    <BrowserRouter>
      <Toaster position="top-right" />
      <div className="min-h-screen bg-slate-50 flex">
        <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
        <div className="flex-1 lg:ml-64 flex flex-col min-w-0">
          <header className="bg-white border-b px-6 py-4 flex items-center justify-between">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 border rounded-lg"><Menu className="w-5 h-5" /></button>
            <div className="text-sm font-medium text-slate-600">Sistem Informasi Manajemen Fasilitas & Keselamatan (MFK) Puskesmas</div>
          </header>
          <main className="p-6 flex-1">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/inventarisasi" element={<Inventarisasi />} />
              <Route path="/fasilitas-utilitas" element={<FasilitasUtilitas />} />
              <Route path="/insiden-risiko" element={<InsidenRisiko />} />
              <Route path="/laporan-periodik" element={<LaporanPeriodik />} />
            </Routes>
          </main>
        </div>
      </div>
    </BrowserRouter>
  );
}
`,
};

// Buat semua folder dan file
Object.entries(files).forEach(([filePath, content]) => {
  const fullPath = path.join(__dirname, filePath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, content, "utf8");
  console.log("Created:", filePath);
});

// Buat folder upload khusus sesuai AGENTS.md
fs.mkdirSync(path.join(__dirname, "backend/uploads-mfk-puskesmas"), { recursive: true });
console.log("Created: backend/uploads-mfk-puskesmas/");
console.log("\n✅ Seluruh file project berhasil dibuat! Silakan zip folder ini atau langsung jalankan npm install.");