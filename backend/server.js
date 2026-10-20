require("dotenv").config();
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
app.use(`/${UPLOAD_DIR}`, express.static(path.join(__dirname, UPLOAD_DIR)));

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `mfk-${Date.now()}${ext}`);
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
      `SELECT 
        (SELECT COUNT(*) FROM inspections WHERE status_tindak_lanjut = 'Selesai') +
        (SELECT COUNT(*) FROM utility_reports WHERE status = 'Selesai') AS total_selesai,
        (SELECT COUNT(*) FROM inspections WHERE status_tindak_lanjut = 'Terlambat') +
        (SELECT COUNT(*) FROM utility_reports WHERE status = 'Terlambat') AS total_terlambat`
    );
    const [roomStatuses] = await pool.query(`SELECT id, name, category, pic_name, condition_status, damage_description FROM rooms ORDER BY id ASC`);
    const [[inspectionStats]] = await pool.query(`SELECT COUNT(DISTINCT room_id) AS inspected_rooms, (SELECT COUNT(*) FROM rooms) AS total_rooms FROM inspections`);
    const [[urgentDamages]] = await pool.query(`SELECT COUNT(*) AS count FROM utility_reports WHERE urgency = 'Segera' AND status != 'Selesai'`);
    const [[calibratedAlkes]] = await pool.query(`SELECT COUNT(*) AS count FROM inventories WHERE (category = 'Kalibrasi' OR (category = 'Alkes' AND calibration_date IS NOT NULL))`);
    const [[incidentCount]] = await pool.query(`SELECT COUNT(*) AS total, SUM(CASE WHEN status = 'Selesai' THEN 1 ELSE 0 END) AS selesai FROM incident_reports`);

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
    const search = (req.query.search || "").trim();
    const category = req.query.category || "";
    const condition = req.query.condition || "";
    let whereClauses = ["1=1"];
    let params = [];

    if (category && category !== "Semua") {
      whereClauses.push("category = ?");
      params.push(category);
    }
    if (condition && condition !== "Semua") {
      whereClauses.push("condition_status = ?");
      params.push(condition);
    }
    if (search) {
      whereClauses.push("(name LIKE ? OR pic_name LIKE ?)");
      params.push(`%${search}%`, `%${search}%`);
    }

    const whereSql = whereClauses.join(" AND ");

    if (req.query.page) {
      const { page, limit, offset } = getPaginationParams(req.query);
      const [[{ total }]] = await pool.query(`SELECT COUNT(*) AS total FROM rooms WHERE ${whereSql}`, params);
      const [rows] = await pool.query(
        `SELECT r.*, 
          (SELECT COUNT(*) FROM inventories WHERE room_id = r.id) AS total_inventaris,
          (SELECT COUNT(*) FROM inspections WHERE room_id = r.id) AS total_inspeksi,
          (SELECT COUNT(*) FROM utility_reports WHERE room_id = r.id) AS total_kerusakan
         FROM rooms r 
         WHERE ${whereSql} 
         ORDER BY r.id ASC 
         LIMIT ? OFFSET ?`,
        [...params, limit, offset]
      );
      return formatPaginatedResponse(res, rows, page, limit, total);
    }

    const [rows] = await pool.query(`SELECT * FROM rooms WHERE ${whereSql} ORDER BY id ASC`, params);
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post("/api/rooms", async (req, res) => {
  try {
    const { name, category, pic_name, pic_user_id, condition_status, damage_description } = req.body;
    if (!name || !category) {
      return res.status(400).json({ success: false, message: "Nama ruangan dan kategori wajib diisi" });
    }

    const [result] = await pool.query(
      `INSERT INTO rooms (name, category, pic_name, pic_user_id, condition_status, damage_description) VALUES (?, ?, ?, ?, ?, ?)`,
      [
        name.trim(),
        category,
        pic_name ? pic_name.trim() : "PJ Ruangan",
        pic_user_id ? parseInt(pic_user_id) : null,
        condition_status || "Baik",
        damage_description ? damage_description.trim() : null,
      ]
    );

    res.json({ success: true, id: result.insertId, message: "Ruangan berhasil ditambahkan" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.put("/api/rooms/:id", async (req, res) => {
  try {
    const { name, category, pic_name, pic_user_id, condition_status, damage_description } = req.body;
    const roomId = req.params.id;

    const [existing] = await pool.query("SELECT id FROM rooms WHERE id = ?", [roomId]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: "Ruangan tidak ditemukan" });
    }

    await pool.query(
      `UPDATE rooms SET name = ?, category = ?, pic_name = ?, pic_user_id = ?, condition_status = ?, damage_description = ? WHERE id = ?`,
      [
        name.trim(),
        category,
        pic_name ? pic_name.trim() : "PJ Ruangan",
        pic_user_id ? parseInt(pic_user_id) : null,
        condition_status || "Baik",
        damage_description ? damage_description.trim() : null,
        roomId,
      ]
    );

    res.json({ success: true, message: "Data ruangan berhasil diperbarui" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.delete("/api/rooms/:id", async (req, res) => {
  try {
    const roomId = req.params.id;

    const [existing] = await pool.query("SELECT id FROM rooms WHERE id = ?", [roomId]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: "Ruangan tidak ditemukan" });
    }

    await pool.query("DELETE FROM rooms WHERE id = ?", [roomId]);
    res.json({ success: true, message: "Ruangan berhasil dihapus" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});


app.get("/api/inventories", async (req, res) => {
  try {
    const { page, limit, offset, search } = getPaginationParams(req.query);
    const category = req.query.category || "";
    const roomId = req.query.room_id || "";
    const condition = req.query.condition_status || "";
    const calibrationOnly = req.query.calibration_only === "true";

    let whereClauses = ["1=1"];
    let params = [];

    if (category && category !== "Semua") {
      whereClauses.push("i.category = ?");
      params.push(category);
    }
    if (roomId) {
      whereClauses.push("i.room_id = ?");
      params.push(roomId);
    }
    if (condition) {
      whereClauses.push("i.condition_status = ?");
      params.push(condition);
    }
    if (calibrationOnly) {
      whereClauses.push("(i.category = 'Kalibrasi' OR i.needs_calibration = 1)");
    }
    if (search) {
      whereClauses.push("(i.item_name LIKE ? OR r.name LIKE ? OR i.notes LIKE ?)");
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    const whereSql = whereClauses.join(" AND ");
    const [[{ total }]] = await pool.query(`SELECT COUNT(*) AS total FROM inventories i JOIN rooms r ON i.room_id = r.id WHERE ${whereSql}`, params);
    const [rows] = await pool.query(
      `SELECT i.*, r.name AS room_name FROM inventories i JOIN rooms r ON i.room_id = r.id WHERE ${whereSql} ORDER BY i.created_at DESC LIMIT ? OFFSET ?`,
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
      `INSERT INTO inventories (category, room_id, item_name, quantity, unit, condition_status, needs_calibration, calibration_date, next_calibration_date, calibration_institution, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
      `UPDATE inventories SET category=?, room_id=?, item_name=?, quantity=?, unit=?, condition_status=?, needs_calibration=?, calibration_date=?, next_calibration_date=?, calibration_institution=?, notes=? WHERE id=?`,
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
    const roomId = req.query.room_id || "";
    const resultStatus = req.query.result_status || "";

    let whereClauses = ["1=1"];
    let params = [];

    if (type && type !== "Semua") {
      whereClauses.push("ins.inspection_type = ?");
      params.push(type);
    }
    if (roomId) {
      whereClauses.push("ins.room_id = ?");
      params.push(roomId);
    }
    if (resultStatus) {
      whereClauses.push("ins.result_status = ?");
      params.push(resultStatus);
    }
    if (search) {
      whereClauses.push("(ins.officer_name LIKE ? OR r.name LIKE ? OR ins.finding_description LIKE ?)");
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    const whereSql = whereClauses.join(" AND ");
    const [[{ total }]] = await pool.query(`SELECT COUNT(*) AS total FROM inspections ins JOIN rooms r ON ins.room_id = r.id WHERE ${whereSql}`, params);
    const [rows] = await pool.query(
      `SELECT ins.*, r.name AS room_name FROM inspections ins JOIN rooms r ON ins.room_id = r.id WHERE ${whereSql} ORDER BY ins.inspection_datetime DESC LIMIT ? OFFSET ?`,
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
      `INSERT INTO inspections (inspection_type, inspection_datetime, officer_name, work_unit, room_id, inspection_items, standard_condition, result_status, finding_description, risk_level, recommendation, status_tindak_lanjut) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
    const utilitySystem = req.query.utility_system || "";
    const urgency = req.query.urgency || "";
    const status = req.query.status || "";
    const roomId = req.query.room_id || "";

    let whereClauses = ["1=1"];
    let params = [];

    if (utilitySystem && utilitySystem !== "Semua") {
      whereClauses.push("u.utility_system = ?");
      params.push(utilitySystem);
    }
    if (urgency) {
      whereClauses.push("u.urgency = ?");
      params.push(urgency);
    }
    if (status) {
      whereClauses.push("u.status = ?");
      params.push(status);
    }
    if (roomId) {
      whereClauses.push("u.room_id = ?");
      params.push(roomId);
    }
    if (search) {
      whereClauses.push("(u.officer_name LIKE ? OR r.name LIKE ? OR u.damage_description LIKE ?)");
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    const whereSql = whereClauses.join(" AND ");
    const [[{ total }]] = await pool.query(`SELECT COUNT(*) AS total FROM utility_reports u JOIN rooms r ON u.room_id = r.id WHERE ${whereSql}`, params);
    const [rows] = await pool.query(
      `SELECT u.*, r.name AS room_name FROM utility_reports u JOIN rooms r ON u.room_id = r.id WHERE ${whereSql} ORDER BY u.report_datetime DESC LIMIT ? OFFSET ?`,
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
    const photo_url = req.file ? `/${UPLOAD_DIR}/${req.file.filename}` : null;
    const [result] = await pool.query(
      `INSERT INTO utility_reports (report_datetime, officer_name, work_unit, room_id, utility_system, damage_description, recommendation, urgency, status, photo_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
      params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }
    const whereSql = whereClauses.join(" AND ");
    const [[{ total }]] = await pool.query(`SELECT COUNT(*) AS total FROM incident_reports WHERE ${whereSql}`, params);
    const [rows] = await pool.query(`SELECT * FROM incident_reports WHERE ${whereSql} ORDER BY incident_datetime DESC LIMIT ? OFFSET ?`, [...params, limit, offset]);
    formatPaginatedResponse(res, rows, page, limit, total);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post("/api/incidents", async (req, res) => {
  try {
    const { incident_datetime, location, category, chronology, affected_party, actual_impact, potential_impact, initial_action, risk_grading, reporter_name, handler_pic, investigation_result, corrective_action, status } = req.body;
    const now = new Date();
    const prefix = `INC-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}`;
    const [[{ count }]] = await pool.query(`SELECT COUNT(*) AS count FROM incident_reports WHERE report_number LIKE ?`, [`${prefix}%`]);
    const report_number = `${prefix}-${String(count + 1).padStart(3, "0")}`;

    const [result] = await pool.query(
      `INSERT INTO incident_reports (report_number, incident_datetime, location, category, chronology, affected_party, actual_impact, potential_impact, initial_action, risk_grading, reporter_name, handler_pic, investigation_result, corrective_action, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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

    const [inspections] = await pool.query(`SELECT ins.*, r.name AS room_name FROM inspections ins JOIN rooms r ON ins.room_id = r.id WHERE ${dateFilterInspections} ORDER BY ins.inspection_datetime DESC`, params);
    const [utilities] = await pool.query(`SELECT u.*, r.name AS room_name FROM utility_reports u JOIN rooms r ON u.room_id = r.id WHERE ${dateFilterUtility} ORDER BY u.report_datetime DESC`, params);
    const [incidents] = await pool.query(`SELECT * FROM incident_reports WHERE ${dateFilterIncident} ORDER BY incident_datetime DESC`, params);
    const [inventories] = await pool.query(`SELECT i.*, r.name AS room_name FROM inventories i JOIN rooms r ON i.room_id = r.id ORDER BY i.category ASC, i.item_name ASC`);

    res.json({
      success: true,
      data: {
        period_type, month, year,
        summary: {
          total_inspections: inspections.length,
          total_utility_damages: utilities.length,
          total_incidents: incidents.length,
          total_inventories: inventories.length,
        },
        inspections, utilities, incidents, inventories,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ==================== AUTH & USER MANAGEMENT ====================
app.post("/api/auth/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ success: false, message: "Username dan password wajib diisi" });
    }

    const [rows] = await pool.query(
      "SELECT id, username, password, name, email, role, work_unit, phone, is_active FROM users WHERE username = ? OR email = ?",
      [username.trim(), username.trim()]
    );

    if (rows.length === 0) {
      return res.status(401).json({ success: false, message: "Username atau password salah" });
    }

    const user = rows[0];
    if (user.password !== password) {
      return res.status(401).json({ success: false, message: "Username atau password salah" });
    }

    if (!user.is_active) {
      return res.status(403).json({ success: false, message: "Akun Anda dinonaktifkan. Silakan hubungi Administrator MFK." });
    }

    // Clean user object (no password)
    const { password: _, ...userData } = user;
    const token = `mfk-token-${user.id}-${Date.now()}`;

    res.json({
      success: true,
      token,
      user: userData,
      message: `Selamat datang, ${userData.name}!`,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get("/api/auth/profile", async (req, res) => {
  try {
    const userId = req.headers["x-user-id"] || req.query.user_id;
    if (!userId) {
      return res.json({ success: false, message: "Unauthorized" });
    }
    const [rows] = await pool.query(
      "SELECT id, username, name, email, role, work_unit, phone, is_active, created_at FROM users WHERE id = ?",
      [userId]
    );
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: "User tidak ditemukan" });
    }
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get("/api/users", async (req, res) => {
  try {
    const role = req.query.role || "";
    const search = (req.query.search || "").trim();
    let whereClauses = ["1=1"];
    let params = [];

    if (role) {
      whereClauses.push("role = ?");
      params.push(role);
    }
    if (search) {
      whereClauses.push("(username LIKE ? OR name LIKE ? OR email LIKE ? OR work_unit LIKE ?)");
      params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }

    const whereSql = whereClauses.join(" AND ");

    if (req.query.all === "true") {
      const [rows] = await pool.query(
        `SELECT id, username, name, email, role, work_unit, phone, is_active, created_at, updated_at 
         FROM users 
         WHERE ${whereSql} 
         ORDER BY name ASC`,
        params
      );
      return res.json({ success: true, data: rows });
    }

    const { page, limit, offset } = getPaginationParams(req.query);
    const [[{ total }]] = await pool.query(`SELECT COUNT(*) AS total FROM users WHERE ${whereSql}`, params);
    const [rows] = await pool.query(
      `SELECT id, username, name, email, role, work_unit, phone, is_active, created_at, updated_at 
       FROM users 
       WHERE ${whereSql} 
       ORDER BY created_at DESC 
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );
    formatPaginatedResponse(res, rows, page, limit, total);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post("/api/users", async (req, res) => {
  try {
    const { username, password, name, email, role, work_unit, phone, is_active } = req.body;
    if (!username || !password || !name || !email) {
      return res.status(400).json({ success: false, message: "Username, password, nama, dan email wajib diisi!" });
    }

    // Check duplicate username or email
    const [existing] = await pool.query("SELECT id FROM users WHERE username = ? OR email = ?", [username.trim(), email.trim()]);
    if (existing.length > 0) {
      return res.status(400).json({ success: false, message: "Username atau email sudah terdaftar" });
    }

    const [result] = await pool.query(
      `INSERT INTO users (username, password, name, email, role, work_unit, phone, is_active) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        username.trim(),
        password,
        name.trim(),
        email.trim(),
        role || "petugas",
        work_unit || "Umum",
        phone || null,
        is_active !== undefined ? (is_active ? 1 : 0) : 1,
      ]
    );

    res.json({ success: true, id: result.insertId, message: "User berhasil ditambahkan" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.put("/api/users/:id", async (req, res) => {
  try {
    const { name, email, role, work_unit, phone, is_active, password } = req.body;
    const userId = req.params.id;

    // Check if user exists
    const [existing] = await pool.query("SELECT id FROM users WHERE id = ?", [userId]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: "User tidak ditemukan" });
    }

    // Check duplicate email
    if (email) {
      const [emailDup] = await pool.query("SELECT id FROM users WHERE email = ? AND id != ?", [email.trim(), userId]);
      if (emailDup.length > 0) {
        return res.status(400).json({ success: false, message: "Email sudah digunakan oleh user lain" });
      }
    }

    let updateFields = [];
    let params = [];

    if (name !== undefined) { updateFields.push("name = ?"); params.push(name.trim()); }
    if (email !== undefined) { updateFields.push("email = ?"); params.push(email.trim()); }
    if (role !== undefined) { updateFields.push("role = ?"); params.push(role); }
    if (work_unit !== undefined) { updateFields.push("work_unit = ?"); params.push(work_unit); }
    if (phone !== undefined) { updateFields.push("phone = ?"); params.push(phone); }
    if (is_active !== undefined) { updateFields.push("is_active = ?"); params.push(is_active ? 1 : 0); }
    if (password && password.trim() !== "") {
      updateFields.push("password = ?");
      params.push(password);
    }

    if (updateFields.length > 0) {
      params.push(userId);
      await pool.query(`UPDATE users SET ${updateFields.join(", ")} WHERE id = ?`, params);
    }

    res.json({ success: true, message: "User berhasil diperbarui" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.delete("/api/users/:id", async (req, res) => {
  try {
    const userId = req.params.id;

    // Prevent deleting the last admin
    const [[{ adminCount }]] = await pool.query("SELECT COUNT(*) AS adminCount FROM users WHERE role = 'admin'");
    const [target] = await pool.query("SELECT role FROM users WHERE id = ?", [userId]);
    if (target.length > 0 && target[0].role === "admin" && adminCount <= 1) {
      return res.status(400).json({ success: false, message: "Tidak dapat menghapus satu-satunya akun Administrator!" });
    }

    await pool.query("DELETE FROM users WHERE id = ?", [userId]);
    res.json({ success: true, message: "User berhasil dihapus" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ==================== APP SETTINGS (KOP & PIMPINAN) ====================
app.get("/api/settings", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM app_settings ORDER BY id ASC LIMIT 1");
    if (rows.length === 0) {
      await pool.query(`
        INSERT INTO app_settings (
          instansi_induk, dinas_kesehatan, nama_puskesmas, alamat_kontak, kota_dokumen,
          pimpinan_jabatan, pimpinan_nama, pimpinan_nip, pelapor_jabatan, pelapor_nama, pelapor_keterangan
        ) VALUES (
          'PEMERINTAH KABUPATEN / KOTA',
          'DINAS KESEHATAN KABUPATEN / KOTA',
          'UPTD PUSKESMAS KECAMATAN',
          'Jl. Kesehatan No. 01, Telp. (021) 1234567 | Pos-el: puskesmas@dinkes.go.id | Kode Pos 15412',
          'Puskesmas',
          'Kepala UPTD Puskesmas',
          'dr. H. Ahmad Fauzi, M.Kes',
          '19780512 200501 1 008',
          'Penanggung Jawab MFK & K3',
          'Administrator MFK / Tim Sanitasi',
          'Koordinator Fasilitas & Keselamatan'
        )
      `);
      const [newRows] = await pool.query("SELECT * FROM app_settings ORDER BY id ASC LIMIT 1");
      const r = newRows[0];
      return res.json({
        success: true,
        data: {
          id: r.id,
          instansiInduk: r.instansi_induk,
          dinasKesehatan: r.dinas_kesehatan,
          namaPuskesmas: r.nama_puskesmas,
          alamatKontak: r.alamat_kontak,
          kotaDokumen: r.kota_dokumen,
          pimpinanJabatan: r.pimpinan_jabatan,
          pimpinanNama: r.pimpinan_nama,
          pimpinanNip: r.pimpinan_nip,
          pelaporJabatan: r.pelapor_jabatan,
          pelaporNama: r.pelapor_nama,
          pelaporKeterangan: r.pelapor_keterangan,
        },
      });
    }

    const r = rows[0];
    res.json({
      success: true,
      data: {
        id: r.id,
        instansiInduk: r.instansi_induk,
        dinasKesehatan: r.dinas_kesehatan,
        namaPuskesmas: r.nama_puskesmas,
        logoUrl: r.logo_url || null,
        alamatKontak: r.alamat_kontak,
        kotaDokumen: r.kota_dokumen,
        pimpinanJabatan: r.pimpinan_jabatan,
        pimpinanNama: r.pimpinan_nama,
        pimpinanNip: r.pimpinan_nip,
        pelaporJabatan: r.pelapor_jabatan,
        pelaporNama: r.pelapor_nama,
        pelaporKeterangan: r.pelapor_keterangan,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.put("/api/settings", async (req, res) => {
  try {
    const {
      instansiInduk,
      dinasKesehatan,
      namaPuskesmas,
      logoUrl,
      alamatKontak,
      kotaDokumen,
      pimpinanJabatan,
      pimpinanNama,
      pimpinanNip,
      pelaporJabatan,
      pelaporNama,
      pelaporKeterangan,
    } = req.body;

    const [rows] = await pool.query("SELECT id FROM app_settings ORDER BY id ASC LIMIT 1");
    if (rows.length === 0) {
      await pool.query(
        `INSERT INTO app_settings (
          instansi_induk, dinas_kesehatan, nama_puskesmas, logo_url, alamat_kontak, kota_dokumen,
          pimpinan_jabatan, pimpinan_nama, pimpinan_nip, pelapor_jabatan, pelapor_nama, pelapor_keterangan
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          instansiInduk || "PEMERINTAH KABUPATEN / KOTA",
          dinasKesehatan || "DINAS KESEHATAN KABUPATEN / KOTA",
          namaPuskesmas || "UPTD PUSKESMAS KECAMATAN",
          logoUrl || null,
          alamatKontak || "",
          kotaDokumen || "Puskesmas",
          pimpinanJabatan || "Kepala UPTD Puskesmas",
          pimpinanNama || "dr. H. Ahmad Fauzi, M.Kes",
          pimpinanNip || "19780512 200501 1 008",
          pelaporJabatan || "Penanggung Jawab MFK & K3",
          pelaporNama || "Administrator MFK / Tim Sanitasi",
          pelaporKeterangan || "Koordinator Fasilitas & Keselamatan",
        ]
      );
    } else {
      await pool.query(
        `UPDATE app_settings SET 
          instansi_induk = ?,
          dinas_kesehatan = ?,
          nama_puskesmas = ?,
          logo_url = ?,
          alamat_kontak = ?,
          kota_dokumen = ?,
          pimpinan_jabatan = ?,
          pimpinan_nama = ?,
          pimpinan_nip = ?,
          pelapor_jabatan = ?,
          pelapor_nama = ?,
          pelapor_keterangan = ?
        WHERE id = ?`,
        [
          instansiInduk,
          dinasKesehatan,
          namaPuskesmas,
          logoUrl || null,
          alamatKontak,
          kotaDokumen,
          pimpinanJabatan,
          pimpinanNama,
          pimpinanNip,
          pelaporJabatan,
          pelaporNama,
          pelaporKeterangan,
          rows[0].id,
        ]
      );
    }

    res.json({
      success: true,
      message: "Pengaturan KOP & Pejabat Penandatangan berhasil disimpan ke database",
      data: req.body,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.listen(PORT, () => console.log(`Server MFK Puskesmas berjalan di http://localhost:${PORT}`));


