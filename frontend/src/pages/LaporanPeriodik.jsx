import React, { useState, useEffect } from "react";
import {
  FileSpreadsheet,
  Download,
  Printer,
  Calendar,
  Building,
  CheckCircle2,
  AlertTriangle,
  Wrench,
  ShieldAlert,
  ClipboardCheck,
  TrendingUp,
  Award,
  Layers,
  User,
  Clock,
  Flame,
  FileText,
  Filter,
  RefreshCw,
  CheckSquare,
  AlertCircle,
  XCircle,
  Package,
  Settings,
  Edit,
  RotateCcw,
  Lock,
  FlaskConical,
  Activity,
  Boxes,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { request } from "../utils/request";
import { API_ENDPOINTS } from "../utils/endpoints";
import toast from "react-hot-toast";
import Modal from "../components/Common/Modal";
import {
  downloadMFKReportPDF,
  INSPECTION_CATEGORIES,
  DEFAULT_KOP_CONFIG,
} from "../utils/pdfGenerator";
import defaultLogoPuskesmas from "../assets/logo-puskesmas.png";

const MONTHS = [
  { value: "01", label: "Januari" },
  { value: "02", label: "Februari" },
  { value: "03", label: "Maret" },
  { value: "04", label: "April" },
  { value: "05", label: "Mei" },
  { value: "06", label: "Juni" },
  { value: "07", label: "Juli" },
  { value: "08", label: "Agustus" },
  { value: "09", label: "September" },
  { value: "10", label: "Oktober" },
  { value: "11", label: "November" },
  { value: "12", label: "Desember" },
];

const YEARS = ["2024", "2025", "2026", "2027"];

export default function LaporanPeriodik() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const [periodType, setPeriodType] = useState("monthly");
  const [month, setMonth] = useState("10");
  const [year, setYear] = useState("2026");
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("inspeksi"); // "inspeksi" | "utilitas" | "insiden" | "inventaris" | "pengesahan"
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [isKopModalOpen, setIsKopModalOpen] = useState(false);

  // KOP & Tanda Tangan Configuration (Persisted in DB & localStorage)
  const [kopConfig, setKopConfig] = useState(() => {
    try {
      const saved = localStorage.getItem("mfk_kop_config");
      return saved ? { ...DEFAULT_KOP_CONFIG, ...JSON.parse(saved) } : DEFAULT_KOP_CONFIG;
    } catch {
      return DEFAULT_KOP_CONFIG;
    }
  });
  const [tempKopConfig, setTempKopConfig] = useState(kopConfig);

  const fetchKopSettings = async () => {
    try {
      const res = await request.get(API_ENDPOINTS.SETTINGS.GET);
      if (res.data) {
        const merged = { ...DEFAULT_KOP_CONFIG, ...res.data };
        setKopConfig(merged);
        setTempKopConfig(merged);
        try {
          localStorage.setItem("mfk_kop_config", JSON.stringify(merged));
        } catch {}
      }
    } catch (err) {
      console.warn("Using fallback/cached kop config:", err);
    }
  };

  const handleSaveKop = async (e) => {
    e?.preventDefault();
    try {
      await request.put(API_ENDPOINTS.SETTINGS.UPDATE, tempKopConfig);
      setKopConfig(tempKopConfig);
      try {
        localStorage.setItem("mfk_kop_config", JSON.stringify(tempKopConfig));
      } catch {}
      setIsKopModalOpen(false);
      toast.success("Pengaturan KOP & Tanda Tangan berhasil disimpan ke database!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Gagal menyimpan ke database");
    }
  };

  const handleResetKop = () => {
    setTempKopConfig(DEFAULT_KOP_CONFIG);
    toast("Form dikembalikan ke nilai default, klik 'Simpan Pengaturan' untuk menerapkan ke database.");
  };

  const fetchReport = async () => {
    setLoading(true);
    try {
      const res = await request.get(API_ENDPOINTS.PERIODIC_REPORTS.LIST, {
        period_type: periodType,
        month,
        year,
      });
      setReportData(res.data);
    } catch (err) {
      toast.error("Gagal memuat laporan periodik");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [periodType, month, year]);

  useEffect(() => {
    fetchKopSettings();
  }, []);

  const periodLabel =
    periodType === "monthly"
      ? `Bulan ${MONTHS.find((m) => m.value === month)?.label || month} ${year}`
      : `Tahun ${year}`;

  const downloadCSV = () => {
    if (!isAdmin) {
      toast.error("Akses ditolak: Unduh laporan CSV khusus untuk Administrator!");
      return;
    }
    if (!reportData) return;

    const rows = [
      [kopConfig.instansiInduk || "PEMERINTAH KABUPATEN / KOTA"],
      [kopConfig.dinasKesehatan || "DINAS KESEHATAN KABUPATEN / KOTA"],
      [kopConfig.namaPusKESMAS || kopConfig.namaPuskesmas || "UPTD PUSKESMAS MUARA KULAM"],
      [`Alamat: ${kopConfig.alamatKontak || "-"}`],
      ["LAPORAN PROGRAM MANAJEMEN FASILITAS DAN KESELAMATAN (MFK)"],
      [`Periode: ${periodLabel}`],
      [],
      ["I. REKAPITULASI INSPEKSI BERKALA FASILITAS & SANITASI"],
      ["No", "Waktu", "Jenis Inspeksi", "Ruangan", "Petugas", "Unit Kerja", "Hasil", "Temuan", "Rekomendasi", "Status Tindak Lanjut"],
      ...reportData.inspections.map((i, idx) => [
        idx + 1,
        i.inspection_datetime,
        i.inspection_type,
        i.room_name,
        i.officer_name,
        i.work_unit,
        i.result_status,
        i.finding_description || "-",
        i.recommendation || "-",
        i.status_tindak_lanjut || "-",
      ]),
      [],
      ["II. REKAPITULASI KERUSAKAN SISTEM UTILITAS"],
      ["No", "Waktu Lapor", "Ruangan", "Sistem Utilitas", "Pelapor", "Unit Kerja", "Kerusakan", "Rekomendasi", "Urgensi", "Status"],
      ...reportData.utilities.map((u, idx) => [
        idx + 1,
        u.report_datetime,
        u.room_name,
        u.utility_system,
        u.officer_name,
        u.work_unit,
        u.damage_description,
        u.recommendation || "-",
        u.urgency,
        u.status,
      ]),
      [],
      ["III. REKAPITULASI INSIDEN KESELAMATAN & K3"],
      ["No", "No Laporan", "Waktu Kejadian", "Lokasi", "Kategori", "Terdampak", "Grading Risiko", "Kronologi", "Aksi Awal", "Status"],
      ...reportData.incidents.map((inc, idx) => [
        idx + 1,
        inc.report_number,
        inc.incident_datetime,
        inc.location,
        inc.category,
        inc.affected_party,
        inc.risk_grading,
        inc.chronology,
        inc.initial_action,
        inc.status,
      ]),
      [],
      ["IV. REKAPITULASI INVENTARISASI SARPRAS, B3 & ALKES"],
      ["No", "Nama Aset / Barang", "Kategori", "Ruangan", "Jumlah", "Satuan", "Kondisi", "Kalibrasi Terakhir", "Jadwal Kalibrasi Berikutnya", "Lembaga Penguji", "Catatan"],
      ...(reportData.inventories || []).map((inv, idx) => [
        idx + 1,
        inv.item_name,
        inv.category,
        inv.room_name,
        inv.quantity,
        inv.unit,
        inv.condition_status,
        inv.calibration_date || "-",
        inv.next_calibration_date || "-",
        inv.calibration_institution || "-",
        inv.notes || "-",
      ]),
      [],
      ["LEMBAR PENGESAHAN"],
      [`Ditetapkan di: ${kopConfig.kotaDokumen || "Muara Kulam"}, Tanggal: ${new Date().toLocaleDateString("id-ID")}`],
      [`Mengetahui & Menyetujui: ${kopConfig.pimpinanJabatan} - ${kopConfig.pimpinanNama} (NIP. ${kopConfig.pimpinanNip})`],
      [`Dilaporkan Oleh: ${kopConfig.pelaporJabatan} - ${kopConfig.pelaporNama} (${kopConfig.pelaporKeterangan})`],
    ];

    const csvContent =
      "data:text/csv;charset=utf-8,\uFEFF" +
      rows.map((e) => e.map((c) => `"${String(c || "").replace(/"/g, '""')}"`).join(",")).join("\n");

    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", `Laporan_SIKELA_${(kopConfig.namaPuskesmas || "Puskesmas").replace(/\s+/g, "_")}_${periodType}_${year}_${month}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Laporan CSV berhasil diunduh");
  };

  const [inventarisFilter, setInventarisFilter] = useState("all"); // "all" | "barang" | "b3" | "alkes"

  const allInventories = reportData?.inventories || [];
  const barangInventories = allInventories.filter(
    (i) => i.category === "Sarpras" || i.category === "Barang" || (!i.category?.toUpperCase().includes("B3") && i.category !== "Alkes" && i.category !== "Kalibrasi" && i.category !== "Alat Medis")
  );
  const b3Inventories = allInventories.filter(
    (i) => i.category === "B3" || i.category?.toUpperCase().includes("B3")
  );
  const alkesInventories = allInventories.filter(
    (i) => i.category === "Alkes" || i.category === "Kalibrasi" || i.category === "Alat Medis"
  );

  const displayedInventories =
    inventarisFilter === "barang"
      ? barangInventories
      : inventarisFilter === "b3"
      ? b3Inventories
      : inventarisFilter === "alkes"
      ? alkesInventories
      : allInventories;

  const handleDownloadPDF = async (categoryMode = "all") => {
    if (!isAdmin) {
      toast.error("Akses ditolak: Unduh laporan PDF khusus untuk Administrator!");
      return;
    }
    if (!reportData) {
      toast.error("Data laporan belum siap");
      return;
    }
    setGeneratingPdf(true);
    try {
      await downloadMFKReportPDF({
        reportData,
        mode: categoryMode,
        periodLabel,
        kopConfig,
      });
      const label =
        categoryMode === "all"
          ? "Laporan Gabungan MFK"
          : categoryMode === "utilitas"
          ? "Laporan Kerusakan Utilitas"
          : categoryMode === "insiden"
          ? "Laporan Insiden K3"
          : categoryMode === "inventaris_barang"
          ? "Laporan Inventarisasi Barang & Sarpras"
          : categoryMode === "inventaris_b3"
          ? "Laporan Inventarisasi Bahan B3"
          : categoryMode === "inventaris_alkes"
          ? "Laporan Inventarisasi Alat Kesehatan"
          : categoryMode === "inventaris"
          ? "Laporan Gabungan Inventarisasi"
          : `Laporan ${categoryMode}`;
      toast.success(`${label} berhasil diunduh dalam format PDF`);
    } catch (err) {
      console.error("PDF generation error:", err);
      toast.error("Gagal membuat dokumen PDF");
    } finally {
      setGeneratingPdf(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    const d = new Date(dateStr);
    return d.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const inspectionsCount = reportData?.summary?.total_inspections || 0;
  const utilitiesCount = reportData?.summary?.total_utility_damages || 0;
  const incidentsCount = reportData?.summary?.total_incidents || 0;

  const goodInspections =
    reportData?.inspections?.filter((i) => i.result_status === "Baik").length || 0;
  const complianceRate =
    inspectionsCount > 0 ? Math.round((goodInspections / inspectionsCount) * 100) : 100;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold text-slate-800 tracking-tight">05. Laporan Periodik MFK</h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 flex items-center gap-1">
              <FileSpreadsheet className="w-3.5 h-3.5" /> Standar Akreditasi
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Rekapitulasi berkala inspeksi fasilitas, utilitas, insiden K3, dan kepatuhan standar MFK 1-10.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap shrink-0">
          <button
            onClick={fetchReport}
            className="p-2.5 text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition cursor-pointer shrink-0"
            title="Muat Ulang Data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>

          {isAdmin ? (
            <>
              <button
                onClick={() => {
                  setTempKopConfig(kopConfig);
                  setIsKopModalOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs sm:text-sm rounded-xl transition cursor-pointer shadow-xs shrink-0"
                title="Atur KOP Surat dan Pejabat Penandatangan"
              >
                <Settings className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Atur KOP</span>
              </button>
              <button
                onClick={downloadCSV}
                className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs sm:text-sm rounded-xl shadow-md shadow-emerald-600/20 transition cursor-pointer shrink-0"
              >
                <Download className="w-4 h-4 shrink-0" />
                <span>Export CSV</span>
              </button>
              <button
                onClick={() => setIsPdfModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs sm:text-sm rounded-xl shadow-md transition cursor-pointer shrink-0"
              >
                <FileText className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Download PDF</span>
              </button>
            </>
          ) : (
            <div
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 text-slate-500 rounded-xl text-xs font-medium border border-slate-200"
              title="Unduh laporan resmi PDF & CSV dibatasi khusus untuk Akun Administrator"
            >
              <Lock className="w-3.5 h-3.5 text-slate-400" />
              <span>Download Khusus Admin</span>
            </div>
          )}
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 px-4 py-3 sm:px-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 print:hidden">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
            <Filter className="w-4 h-4" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 mr-1">Periode:</span>
            <button
              onClick={() => setPeriodType("monthly")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                periodType === "monthly"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              Bulanan
            </button>
            <button
              onClick={() => setPeriodType("yearly")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                periodType === "yearly"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              Tahunan
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {periodType === "monthly" && (
            <div className="flex items-center gap-1.5">
              <label className="text-xs font-medium text-slate-500">Bulan:</label>
              <select
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {MONTHS.map((m) => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </div>
          )}

          <div className="flex items-center gap-1.5">
            <label className="text-xs font-medium text-slate-500">Tahun:</label>
            <select
              value={year}
              onChange={(e) => setYear(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {YEARS.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Official Header for Print Mode Only */}
      <div className="hidden print:block border-b-2 border-slate-800 pb-4 mb-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 shrink-0 flex items-center justify-center">
            <img
              src={kopConfig.logoUrl || defaultLogoPuskesmas}
              alt="Logo Puskesmas"
              className="w-full h-full object-contain"
            />
          </div>
          <div className="flex-1 text-center space-y-0.5">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-600">
              {kopConfig.instansiInduk || "PEMERINTAH KABUPATEN / KOTA"} • {kopConfig.dinasKesehatan || "DINAS KESEHATAN KABUPATEN / KOTA"}
            </p>
            <h1 className="text-xl font-extrabold uppercase text-slate-900 tracking-wider">
              {kopConfig.namaPuskesmas || "UPTD PUSKESMAS MUARA KULAM"}
            </h1>
            <p className="text-xs text-slate-500">
              {kopConfig.alamatKontak || "-"}
            </p>
          </div>
        </div>
        <div className="mt-3 pt-2 border-t border-slate-400 text-center">
          <h2 className="text-base font-bold text-slate-900 uppercase">
            LAPORAN PROGRAM MANAJEMEN FASILITAS DAN KESELAMATAN (MFK)
          </h2>
          <p className="text-xs text-slate-600 font-medium">
            Periode: {periodLabel}
          </p>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {/* Card 1: Inspeksi */}
        <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col justify-between h-full">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider truncate">
              Total Inspeksi
            </span>
            <div className="w-7 h-7 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <ClipboardCheck className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 tracking-tight my-1.5">{inspectionsCount}</p>
          <p className="text-xs text-emerald-700 font-medium flex items-center gap-1 truncate">
            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{goodInspections} Sesuai Standar</span>
          </p>
        </div>

        {/* Card 2: Kerusakan Utilitas */}
        <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col justify-between h-full">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider truncate">
              Kerusakan Utilitas
            </span>
            <div className="w-7 h-7 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <Wrench className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 tracking-tight my-1.5">{utilitiesCount}</p>
          <p className="text-xs text-amber-700 font-medium flex items-center gap-1 truncate">
            <Flame className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{reportData?.utilities?.filter((u) => u.urgency === "Segera").length || 0} Urgensi Segera</span>
          </p>
        </div>

        {/* Card 3: Insiden Keselamatan */}
        <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col justify-between h-full">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider truncate">
              Insiden K3
            </span>
            <div className="w-7 h-7 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 tracking-tight my-1.5">{incidentsCount}</p>
          <p className="text-xs text-rose-700 font-medium flex items-center gap-1 truncate">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{incidentsCount} Laporan Kasus</span>
          </p>
        </div>

        {/* Card 4: Inventarisasi Aset & Alkes */}
        <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col justify-between h-full">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider truncate">
              Aset & Sarpras
            </span>
            <div className="w-7 h-7 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 tracking-tight my-1.5">{reportData?.inventories?.length || 0}</p>
          <p className="text-xs text-blue-700 font-medium flex items-center gap-1 truncate">
            <Layers className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{reportData?.inventories?.length || 0} Terdata Aktif</span>
          </p>
        </div>

        {/* Card 5: Kepatuhan Standar */}
        <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col justify-between h-full col-span-2 sm:col-span-1 lg:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider truncate">
              Skor Kepatuhan
            </span>
            <div className="w-7 h-7 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center shrink-0">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 tracking-tight my-1.5">{complianceRate}%</p>
          <p className="text-xs text-teal-700 font-medium flex items-center gap-1 truncate">
            <TrendingUp className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Standar Akreditasi</span>
          </p>
        </div>
      </div>

      {/* Navigation Tabs for detailed sections */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 print:hidden">
        <button
          onClick={() => setActiveTab("inspeksi")}
          className={`w-full inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition cursor-pointer text-center ${
            activeTab === "inspeksi"
              ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20"
              : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
          }`}
        >
          <CheckSquare className="w-4 h-4 shrink-0" />
          <span className="truncate">Inspeksi ({reportData?.inspections?.length || 0})</span>
        </button>

        <button
          onClick={() => setActiveTab("utilitas")}
          className={`w-full inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition cursor-pointer text-center ${
            activeTab === "utilitas"
              ? "bg-amber-600 text-white shadow-md shadow-amber-600/20"
              : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
          }`}
        >
          <Wrench className="w-4 h-4 shrink-0" />
          <span className="truncate">Utilitas ({reportData?.utilities?.length || 0})</span>
        </button>

        <button
          onClick={() => setActiveTab("insiden")}
          className={`w-full inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition cursor-pointer text-center ${
            activeTab === "insiden"
              ? "bg-rose-600 text-white shadow-md shadow-rose-600/20"
              : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
          }`}
        >
          <ShieldAlert className="w-4 h-4 shrink-0" />
          <span className="truncate">Insiden K3 ({reportData?.incidents?.length || 0})</span>
        </button>

        <button
          onClick={() => setActiveTab("inventaris")}
          className={`w-full inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition cursor-pointer text-center ${
            activeTab === "inventaris"
              ? "bg-blue-600 text-white shadow-md shadow-blue-600/20"
              : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
          }`}
        >
          <Package className="w-4 h-4 shrink-0" />
          <span className="truncate">Aset & Sarpras ({reportData?.inventories?.length || 0})</span>
        </button>

        <button
          onClick={() => setActiveTab("pengesahan")}
          className={`w-full inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition cursor-pointer text-center col-span-2 sm:col-span-1 lg:col-span-1 ${
            activeTab === "pengesahan"
              ? "bg-slate-900 text-white shadow-md"
              : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
          }`}
        >
          <FileText className="w-4 h-4 shrink-0" />
          <span className="truncate">Pengesahan & KOP</span>
        </button>
      </div>

      {/* Main Table Container */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* TAB 1: INSPEKSI */}
        {(activeTab === "inspeksi" || window.matchMedia?.("print")?.matches) && (
          <div>
            <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row gap-3 sm:items-center justify-between bg-slate-50/60">
              <div className="flex items-center gap-2">
                <CheckSquare className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-slate-800 text-base">
                  Daftar Inspeksi Fasilitas, Sanitasi & Lingkungan
                </h3>
              </div>
              <div className="flex items-center gap-3">
                {isAdmin && (
                  <button
                    onClick={() => setIsPdfModalOpen(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-lg text-xs font-semibold border border-emerald-200 transition cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Download PDF Per Inspeksi</span>
                  </button>
                )}
                <span className="text-xs text-slate-500">
                  Total: <b>{reportData?.inspections?.length || 0}</b> pemeriksaan
                </span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[850px]">
                <thead>
                  <tr className="bg-slate-50/90 text-slate-600 text-xs font-semibold uppercase tracking-wider border-b border-slate-200">
                    <th className="px-4 py-3.5 w-14 text-center">No</th>
                    <th className="px-4 py-3.5 w-36 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>Waktu</span>
                      </div>
                    </th>
                    <th className="px-4 py-3.5 w-48">
                      <div className="flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-slate-400" />
                        <span>Jenis Inspeksi</span>
                      </div>
                    </th>
                    <th className="px-4 py-3.5 w-44">
                      <div className="flex items-center gap-1.5">
                        <Building className="w-3.5 h-3.5 text-slate-400" />
                        <span>Ruangan</span>
                      </div>
                    </th>
                    <th className="px-4 py-3.5 w-40">
                      <div className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        <span>Pemeriksa</span>
                      </div>
                    </th>
                    <th className="px-4 py-3.5 w-32 whitespace-nowrap">Hasil</th>
                    <th className="px-4 py-3.5 min-w-[200px]">Temuan & Rekomendasi</th>
                    <th className="px-4 py-3.5 w-28 text-center whitespace-nowrap">Tindak Lanjut</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                  {loading ? (
                    <tr>
                      <td colSpan="8" className="px-4 py-8 text-center text-slate-400">
                        Memuat data inspeksi...
                      </td>
                    </tr>
                  ) : !reportData?.inspections?.length ? (
                    <tr>
                      <td colSpan="8" className="px-4 py-8 text-center text-slate-400">
                        Tidak ada data inspeksi pada periode terpilih.
                      </td>
                    </tr>
                  ) : (
                    reportData.inspections.map((row, idx) => (
                      <tr key={row.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-4 py-3.5 text-center text-xs text-slate-400 font-medium">
                          {idx + 1}
                        </td>
                        <td className="px-4 py-3.5 text-xs text-slate-500 whitespace-nowrap font-medium">
                          {formatDate(row.inspection_datetime)}
                        </td>
                        <td className="px-4 py-3.5 font-medium text-slate-800 text-xs">
                          {row.inspection_type}
                        </td>
                        <td className="px-4 py-3.5 text-slate-700 text-xs font-semibold">
                          {row.room_name}
                        </td>
                        <td className="px-4 py-3.5 text-xs">
                          <div className="font-medium text-slate-800">{row.officer_name}</div>
                          <div className="text-[11px] text-slate-400">{row.work_unit}</div>
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          {row.result_status === "Baik" ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Baik
                            </span>
                          ) : row.result_status === "Perlu Perbaikan" ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                              <AlertCircle className="w-3.5 h-3.5 text-amber-600" /> Perlu Perbaikan
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                              <XCircle className="w-3.5 h-3.5 text-rose-600" /> Tidak Standar
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3.5 text-xs">
                          {row.finding_description && (
                            <p className="font-medium text-slate-800">
                              <span className="text-slate-500 font-normal">Temuan: </span>
                              {row.finding_description}
                            </p>
                          )}
                          {row.recommendation && (
                            <p className="text-emerald-700 mt-1 font-medium">
                              <span className="font-semibold">Rekomendasi: </span>
                              {row.recommendation}
                            </p>
                          )}
                          {!row.finding_description && !row.recommendation && (
                            <span className="text-slate-400 italic">Sesuai standar operasional</span>
                          )}
                        </td>
                        <td className="px-4 py-3.5 text-center whitespace-nowrap">
                          <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${
                            row.status_tindak_lanjut === "Selesai"
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-blue-100 text-blue-800"
                          }`}>
                            {row.status_tindak_lanjut || "Selesai"}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: UTILITAS */}
        {activeTab === "utilitas" && (
          <div>
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
              <div className="flex items-center gap-2">
                <Wrench className="w-5 h-5 text-amber-600" />
                <h3 className="font-bold text-slate-800 text-base">
                  Rekapitulasi Kerusakan Sistem Utilitas Puskesmas
                </h3>
              </div>
              <span className="text-xs text-slate-500">
                Total: <b>{reportData?.utilities?.length || 0}</b> laporan
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[850px]">
                <thead>
                  <tr className="bg-slate-50/90 text-slate-600 text-xs font-semibold uppercase tracking-wider border-b border-slate-200">
                    <th className="px-4 py-3.5 w-14 text-center">No</th>
                    <th className="px-4 py-3.5 w-36 whitespace-nowrap">Waktu Lapor</th>
                    <th className="px-4 py-3.5 w-44">Ruangan</th>
                    <th className="px-4 py-3.5 w-48">Sistem Utilitas</th>
                    <th className="px-4 py-3.5 w-40">Pelapor</th>
                    <th className="px-4 py-3.5 min-w-[200px]">Deskripsi & Rekomendasi</th>
                    <th className="px-4 py-3.5 w-28 text-center whitespace-nowrap">Urgensi</th>
                    <th className="px-4 py-3.5 w-28 text-center whitespace-nowrap">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                  {!reportData?.utilities?.length ? (
                    <tr>
                      <td colSpan="8" className="px-4 py-8 text-center text-slate-400">
                        Tidak ada laporan kerusakan utilitas pada periode ini.
                      </td>
                    </tr>
                  ) : (
                    reportData.utilities.map((row, idx) => (
                      <tr key={row.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-4 py-3.5 text-center text-xs text-slate-400 font-medium">
                          {idx + 1}
                        </td>
                        <td className="px-4 py-3.5 text-xs text-slate-500 whitespace-nowrap font-medium">
                          {formatDate(row.report_datetime)}
                        </td>
                        <td className="px-4 py-3.5 text-xs font-semibold text-slate-800">
                          {row.room_name}
                        </td>
                        <td className="px-4 py-3.5 text-xs">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                            <Wrench className="w-3 h-3 text-amber-600" />
                            {row.utility_system}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-xs">
                          <div className="font-semibold text-slate-800">{row.officer_name}</div>
                          <div className="text-[11px] text-slate-400">{row.work_unit}</div>
                        </td>
                        <td className="px-4 py-3.5 text-xs">
                          <div className="font-medium text-slate-800">{row.damage_description}</div>
                          {row.recommendation && (
                            <div className="text-slate-500 mt-1">
                              <span className="font-semibold text-amber-700">Saran: </span>
                              {row.recommendation}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3.5 text-center whitespace-nowrap">
                          {row.urgency === "Segera" ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-700">
                              <Flame className="w-3 h-3 text-rose-600" /> Segera
                            </span>
                          ) : (
                            <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                              Normal
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3.5 text-center whitespace-nowrap">
                          <span className={`inline-block px-2.5 py-0.5 rounded text-xs font-semibold ${
                            row.status === "Selesai"
                              ? "bg-emerald-100 text-emerald-800"
                              : row.status === "Diproses"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-amber-100 text-amber-800"
                          }`}>
                            {row.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: INSIDEN */}
        {activeTab === "insiden" && (
          <div>
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-rose-600" />
                <h3 className="font-bold text-slate-800 text-base">
                  Rekapitulasi Insiden Keselamatan Pasien & K3
                </h3>
              </div>
              <span className="text-xs text-slate-500">
                Total: <b>{reportData?.incidents?.length || 0}</b> insiden
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[850px]">
                <thead>
                  <tr className="bg-slate-50/90 text-slate-600 text-xs font-semibold uppercase tracking-wider border-b border-slate-200">
                    <th className="px-4 py-3.5 w-14 text-center">No</th>
                    <th className="px-4 py-3.5 w-36 whitespace-nowrap">No Laporan & Waktu</th>
                    <th className="px-4 py-3.5 w-52">Kategori Insiden</th>
                    <th className="px-4 py-3.5 w-44">Lokasi Kejadian</th>
                    <th className="px-4 py-3.5 w-36 whitespace-nowrap">Grading Risiko</th>
                    <th className="px-4 py-3.5 min-w-[200px]">Kronologi & Dampak</th>
                    <th className="px-4 py-3.5 w-32 text-center whitespace-nowrap">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                  {!reportData?.incidents?.length ? (
                    <tr>
                      <td colSpan="7" className="px-4 py-8 text-center text-slate-400">
                        Tidak ada laporan insiden keselamatan pada periode ini.
                      </td>
                    </tr>
                  ) : (
                    reportData.incidents.map((inc, idx) => (
                      <tr key={inc.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-4 py-3.5 text-center text-xs text-slate-400 font-medium">
                          {idx + 1}
                        </td>
                        <td className="px-4 py-3.5 text-xs">
                          <div className="font-bold text-rose-600 font-mono">{inc.report_number}</div>
                          <div className="text-[11px] text-slate-400 mt-0.5">{formatDate(inc.incident_datetime)}</div>
                        </td>
                        <td className="px-4 py-3.5 text-xs font-medium text-slate-800">
                          {inc.category}
                        </td>
                        <td className="px-4 py-3.5 text-xs text-slate-700 font-medium">
                          {inc.location}
                        </td>
                        <td className="px-4 py-3.5 text-xs whitespace-nowrap font-medium text-slate-800">
                          {inc.risk_grading}
                        </td>
                        <td className="px-4 py-3.5 text-xs text-slate-700">
                          <p className="line-clamp-2">{inc.chronology}</p>
                          {inc.initial_action && (
                            <p className="text-emerald-700 mt-1 font-medium text-[11px]">
                              Tindakan Awal: {inc.initial_action}
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-3.5 text-center whitespace-nowrap">
                          <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                            {inc.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: INVENTARIS */}
        {activeTab === "inventaris" && (
          <div>
            {/* Header */}
            <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row gap-3 sm:items-center justify-between bg-slate-50/60">
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-blue-600 shrink-0" />
                <div>
                  <h3 className="font-bold text-slate-800 text-base">
                    Rekapitulasi Inventarisasi Aset & Sarpras
                  </h3>
                  <p className="text-xs text-slate-500">
                    Monitoring terpisah: Barang/Sarpras, Bahan B3 Medis, serta Alat Kesehatan & Kalibrasi.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {isAdmin && (
                  <button
                    onClick={() => handleDownloadPDF("inventaris")}
                    disabled={generatingPdf}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-xs transition cursor-pointer disabled:opacity-50"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download PDF Gabungan Aset</span>
                  </button>
                )}
                <span className="text-xs text-slate-500 font-medium whitespace-nowrap">
                  Total: <b>{allInventories.length}</b> aset
                </span>
              </div>
            </div>

            {/* 3 Modul Cards: Barang/Sarpras, B3, Alkes */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-4 sm:p-5 bg-slate-50/50 border-b border-slate-100">
              {/* Card 1: Barang / Sarpras */}
              <div
                onClick={() => setInventarisFilter("barang")}
                className={`p-3.5 sm:p-4 rounded-2xl border transition cursor-pointer flex flex-col justify-between h-full ${
                  inventarisFilter === "barang"
                    ? "bg-blue-600 text-white border-blue-600 shadow-md"
                    : "bg-white border-slate-200 hover:border-blue-300"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Package className={`w-4 h-4 shrink-0 ${inventarisFilter === "barang" ? "text-white" : "text-blue-600"}`} />
                    <span className="text-xs font-bold uppercase tracking-wider">1. Barang & Sarpras</span>
                  </div>
                  {isAdmin && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDownloadPDF("inventaris_barang");
                      }}
                      disabled={generatingPdf}
                      className={`px-2 py-1 rounded-lg text-[11px] font-semibold flex items-center gap-1 transition ${
                        inventarisFilter === "barang"
                          ? "bg-white/20 hover:bg-white text-white hover:text-blue-700"
                          : "bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200"
                      }`}
                      title="Download PDF Laporan Barang & Sarpras"
                    >
                      <Download className="w-3 h-3" />
                      <span>PDF</span>
                    </button>
                  )}
                </div>
                <p className="text-2xl font-bold my-1">{barangInventories.length}</p>
                <p className={`text-[11px] truncate ${inventarisFilter === "barang" ? "text-blue-100" : "text-slate-500"}`}>
                  Baik: {barangInventories.filter((i) => i.condition_status === "Baik").length} • Rusak: {barangInventories.filter((i) => i.condition_status !== "Baik").length}
                </p>
              </div>

              {/* Card 2: Bahan B3 */}
              <div
                onClick={() => setInventarisFilter("b3")}
                className={`p-3.5 sm:p-4 rounded-2xl border transition cursor-pointer flex flex-col justify-between h-full ${
                  inventarisFilter === "b3"
                    ? "bg-purple-600 text-white border-purple-600 shadow-md"
                    : "bg-white border-slate-200 hover:border-purple-300"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FlaskConical className={`w-4 h-4 shrink-0 ${inventarisFilter === "b3" ? "text-white" : "text-purple-600"}`} />
                    <span className="text-xs font-bold uppercase tracking-wider">2. Bahan B3 Medis</span>
                  </div>
                  {isAdmin && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDownloadPDF("inventaris_b3");
                      }}
                      disabled={generatingPdf}
                      className={`px-2 py-1 rounded-lg text-[11px] font-semibold flex items-center gap-1 transition ${
                        inventarisFilter === "b3"
                          ? "bg-white/20 hover:bg-white text-white hover:text-purple-700"
                          : "bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200"
                      }`}
                      title="Download PDF Laporan Bahan B3"
                    >
                      <Download className="w-3 h-3" />
                      <span>PDF</span>
                    </button>
                  )}
                </div>
                <p className="text-2xl font-bold my-1">{b3Inventories.length}</p>
                <p className={`text-[11px] truncate ${inventarisFilter === "b3" ? "text-purple-100" : "text-slate-500"}`}>
                  Lemari B3 & Dokumen MSDS
                </p>
              </div>

              {/* Card 3: Alat Kesehatan & Kalibrasi */}
              <div
                onClick={() => setInventarisFilter("alkes")}
                className={`p-3.5 sm:p-4 rounded-2xl border transition cursor-pointer flex flex-col justify-between h-full ${
                  inventarisFilter === "alkes"
                    ? "bg-teal-600 text-white border-teal-600 shadow-md"
                    : "bg-white border-slate-200 hover:border-teal-300"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Activity className={`w-4 h-4 shrink-0 ${inventarisFilter === "alkes" ? "text-white" : "text-teal-600"}`} />
                    <span className="text-xs font-bold uppercase tracking-wider">3. Alat Kesehatan</span>
                  </div>
                  {isAdmin && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDownloadPDF("inventaris_alkes");
                      }}
                      disabled={generatingPdf}
                      className={`px-2 py-1 rounded-lg text-[11px] font-semibold flex items-center gap-1 transition ${
                        inventarisFilter === "alkes"
                          ? "bg-white/20 hover:bg-white text-white hover:text-teal-700"
                          : "bg-teal-50 hover:bg-teal-100 text-teal-700 border border-teal-200"
                      }`}
                      title="Download PDF Laporan Alkes & Kalibrasi"
                    >
                      <Download className="w-3 h-3" />
                      <span>PDF</span>
                    </button>
                  )}
                </div>
                <p className="text-2xl font-bold my-1">{alkesInventories.length}</p>
                <p className={`text-[11px] truncate ${inventarisFilter === "alkes" ? "text-teal-100" : "text-slate-500"}`}>
                  Kalibrasi: {alkesInventories.filter((i) => i.calibration_date).length} • Wajib: {alkesInventories.filter((i) => i.needs_calibration && !i.calibration_date).length}
                </p>
              </div>
            </div>

            {/* Sub-filter bar */}
            <div className="px-4 sm:px-5 py-3 bg-white border-b border-slate-100 flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-xs font-semibold text-slate-500 mr-1">Tampilkan:</span>
                <button
                  onClick={() => setInventarisFilter("all")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                    inventarisFilter === "all"
                      ? "bg-slate-900 text-white shadow-xs"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  Semua ({allInventories.length})
                </button>
                <button
                  onClick={() => setInventarisFilter("barang")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                    inventarisFilter === "barang"
                      ? "bg-blue-600 text-white shadow-xs"
                      : "bg-blue-50 text-blue-700 hover:bg-blue-100"
                  }`}
                >
                  Barang & Sarpras ({barangInventories.length})
                </button>
                <button
                  onClick={() => setInventarisFilter("b3")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                    inventarisFilter === "b3"
                      ? "bg-purple-600 text-white shadow-xs"
                      : "bg-purple-50 text-purple-700 hover:bg-purple-100"
                  }`}
                >
                  Bahan B3 ({b3Inventories.length})
                </button>
                <button
                  onClick={() => setInventarisFilter("alkes")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                    inventarisFilter === "alkes"
                      ? "bg-teal-600 text-white shadow-xs"
                      : "bg-teal-50 text-teal-700 hover:bg-teal-100"
                  }`}
                >
                  Alat Kesehatan ({alkesInventories.length})
                </button>
              </div>

              {isAdmin && (
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => {
                      const mode =
                        inventarisFilter === "barang"
                          ? "inventaris_barang"
                          : inventarisFilter === "b3"
                          ? "inventaris_b3"
                          : inventarisFilter === "alkes"
                          ? "inventaris_alkes"
                          : "inventaris";
                      handleDownloadPDF(mode);
                    }}
                    disabled={generatingPdf}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs transition cursor-pointer disabled:opacity-50"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>
                      {inventarisFilter === "all"
                        ? "Download PDF Gabungan"
                        : `Download PDF ${
                            inventarisFilter === "barang"
                              ? "Barang & Sarpras"
                              : inventarisFilter === "b3"
                              ? "Bahan B3"
                              : "Alat Kesehatan"
                          }`}
                    </span>
                  </button>
                </div>
              )}
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[900px]">
                <thead>
                  <tr className="bg-slate-50/90 text-slate-600 text-xs font-semibold uppercase tracking-wider border-b border-slate-200">
                    <th className="px-4 py-3.5 w-14 text-center">No</th>
                    <th className="px-4 py-3.5 min-w-[200px]">Nama Aset / Barang</th>
                    <th className="px-4 py-3.5 w-36">Kategori</th>
                    <th className="px-4 py-3.5 w-40">Ruangan</th>
                    <th className="px-4 py-3.5 w-28 text-center">Jumlah</th>
                    <th className="px-4 py-3.5 w-32 text-center">Kondisi</th>
                    <th className="px-4 py-3.5 w-44">Status Kalibrasi</th>
                    <th className="px-4 py-3.5 min-w-[150px]">Catatan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                  {!displayedInventories.length ? (
                    <tr>
                      <td colSpan="8" className="px-4 py-8 text-center text-slate-400">
                        Tidak ada data inventarisasi untuk filter kategori ini.
                      </td>
                    </tr>
                  ) : (
                    displayedInventories.map((inv, idx) => (
                      <tr key={inv.id || idx} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-4 py-3.5 text-center text-xs text-slate-400 font-medium">
                          {idx + 1}
                        </td>
                        <td className="px-4 py-3.5 text-xs font-semibold text-slate-800">
                          {inv.item_name}
                        </td>
                        <td className="px-4 py-3.5 text-xs">
                          <span className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                            inv.category === "Alat Medis" || inv.category === "Alkes" || inv.category === "Kalibrasi"
                              ? "bg-teal-100 text-teal-800"
                              : inv.category === "B3" || inv.category?.includes("B3")
                              ? "bg-purple-100 text-purple-800"
                              : "bg-blue-100 text-blue-800"
                          }`}>
                            {inv.category}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-xs text-slate-700 font-medium">
                          {inv.room_name || "-"}
                        </td>
                        <td className="px-4 py-3.5 text-center text-xs font-semibold text-slate-800">
                          {inv.quantity} <span className="text-slate-500 font-normal">{inv.unit || "Unit"}</span>
                        </td>
                        <td className="px-4 py-3.5 text-center whitespace-nowrap">
                          {inv.condition_status === "Baik" ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Baik
                            </span>
                          ) : inv.condition_status === "Perlu Perbaikan" || inv.condition_status === "Rusak Ringan" ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                              <AlertCircle className="w-3 h-3 text-amber-600" /> Rusak Ringan
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                              <XCircle className="w-3 h-3 text-rose-600" /> Rusak Berat
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3.5 text-xs">
                          {inv.calibration_date ? (
                            <div>
                              <div className="font-medium text-slate-800">
                                Terakhir: <span className="text-slate-600">{inv.calibration_date}</span>
                              </div>
                              {inv.next_calibration_date && (
                                <div className="text-[11px] text-blue-600 font-medium mt-0.5">
                                  Berikutnya: {inv.next_calibration_date}
                                </div>
                              )}
                              {inv.calibration_institution && (
                                <div className="text-[10px] text-slate-400">
                                  Oleh: {inv.calibration_institution}
                                </div>
                              )}
                            </div>
                          ) : inv.needs_calibration ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-100 text-amber-800">
                              <Clock className="w-3 h-3" /> Wajib Kalibrasi
                            </span>
                          ) : (
                            <span className="text-slate-400 text-xs">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3.5 text-xs text-slate-500">
                          {inv.notes || "-"}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 5: LEMBAR PENGESAHAN */}
        {activeTab === "pengesahan" && (
          <div className="p-6 sm:p-8 space-y-6">
            <div className="border border-slate-200 rounded-2xl p-6 bg-slate-50/50 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
                <div className="flex items-center gap-3">
                  <FileText className="w-6 h-6 text-emerald-600" />
                  <div>
                    <h4 className="font-bold text-base text-slate-800">
                      Lembar Ringkasan Eksekutif & Pengesahan Dokumen MFK
                    </h4>
                    <p className="text-xs text-slate-500">
                      KOP surat dan nama pejabat penandatangan resmi yang tersimpan di sistem
                    </p>
                  </div>
                </div>
                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => {
                      setTempKopConfig(kopConfig);
                      setIsKopModalOpen(true);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl text-xs font-semibold border border-emerald-200 transition cursor-pointer shrink-0"
                  >
                    <Edit className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Ubah KOP & Pejabat</span>
                  </button>
                )}
              </div>

              {/* KOP Surat Preview in Pengesahan with Logo */}
              <div className="bg-white p-4 rounded-xl border border-slate-200">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 shrink-0 flex items-center justify-center">
                    <img
                      src={kopConfig.logoUrl || defaultLogoPuskesmas}
                      alt="Logo Puskesmas"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div className="flex-1 text-center space-y-0.5">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-600">
                      {kopConfig.instansiInduk || "PEMERINTAH KABUPATEN / KOTA"}
                    </p>
                    <p className="text-xs font-extrabold uppercase tracking-wide text-slate-800">
                      {kopConfig.dinasKesehatan || "DINAS KESEHATAN KABUPATEN / KOTA"}
                    </p>
                    <h4 className="text-sm font-black uppercase text-emerald-700 tracking-wide">
                      {kopConfig.namaPuskesmas || "UPTD PUSKESMAS MUARA KULAM"}
                    </h4>
                    <p className="text-[9px] text-slate-500">
                      {kopConfig.alamatKontak || "-"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="space-y-2">
                  <div className="flex justify-between py-1.5 border-b border-slate-200">
                    <span className="text-slate-500">Nama Fasilitas Pelayanan:</span>
                    <span className="font-semibold text-slate-800">{kopConfig.namaPuskesmas || "UPTD Puskesmas"}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-200">
                    <span className="text-slate-500">Periode Evaluasi:</span>
                    <span className="font-semibold text-slate-800">{periodLabel}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-200">
                    <span className="text-slate-500">Tingkat Kepatuhan Fisik:</span>
                    <span className="font-bold text-emerald-700">{complianceRate}% Memenuhi Syarat</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between py-1.5 border-b border-slate-200">
                    <span className="text-slate-500">Total Inspeksi Terlaksana:</span>
                    <span className="font-semibold text-slate-800">{inspectionsCount} Kegiatan</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-200">
                    <span className="text-slate-500">Temuan Kerusakan Sistem:</span>
                    <span className="font-semibold text-slate-800">{utilitiesCount} Kasus</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-200">
                    <span className="text-slate-500">Aset & Sarpras Terdata:</span>
                    <span className="font-semibold text-slate-800">{reportData?.inventories?.length || 0} Barang</span>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-900 leading-relaxed">
                <b>Kesimpulan Evaluasi Tim MFK: </b>
                Secara umum pelaksanaan pemeliharaan sarana prasarana, sistem sanitasi, pengelolaan limbah B3, kalibrasi alkes, dan pencegahan insiden risiko telah berlangsung secara aktif sesuai dengan Standar MFK Puskesmas. Semua temuan yang berstatus "Perlu Perbaikan" sedang dalam tahap tindak lanjut oleh PJ Ruangan dan Bagian Pemeliharaan.
              </div>
            </div>

            {/* Official Signature Section */}
            <div className="pt-2">
              <p className="text-xs text-right text-slate-500 mb-4">
                Ditetapkan di: <span className="font-semibold text-slate-700">{kopConfig.kotaDokumen || "Puskesmas"}</span>, Tanggal: {new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
              </p>
              <div className="grid grid-cols-2 gap-8 pt-4 border-t border-slate-200 text-center text-xs">
                <div className="space-y-16">
                  <div>
                    <p className="text-slate-500">Mengetahui & Menyetujui,</p>
                    <p className="font-bold text-slate-800">{kopConfig.pimpinanJabatan || "Kepala UPTD Puskesmas"}</p>
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 underline text-sm">{kopConfig.pimpinanNama || "dr. H. Ahmad Fauzi, M.Kes"}</p>
                    <p className="text-slate-500 text-[11px] mt-0.5">NIP. {kopConfig.pimpinanNip || "-"}</p>
                  </div>
                </div>

                <div className="space-y-16">
                  <div>
                    <p className="text-slate-500">Dilaporkan Oleh,</p>
                    <p className="font-bold text-slate-800">{kopConfig.pelaporJabatan || "Penanggung Jawab MFK & K3"}</p>
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 underline text-sm">{kopConfig.pelaporNama || "Administrator MFK / Tim Sanitasi"}</p>
                    <p className="text-slate-500 text-[11px] mt-0.5">{kopConfig.pelaporKeterangan || "Koordinator Fasilitas & Keselamatan"}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Signature in Print View */}
      <div className="hidden print:block pt-8 text-xs">
        <p className="text-right text-slate-600 mb-4">
          Ditetapkan di: {kopConfig.kotaDokumen || "Puskesmas"}, Tanggal: {new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
        </p>
        <div className="grid grid-cols-2 gap-8 text-center">
          <div className="space-y-16">
            <div>
              <p className="text-slate-500">Mengetahui & Menyetujui,</p>
              <p className="font-bold text-slate-900">{kopConfig.pimpinanJabatan || "Kepala UPTD Puskesmas"}</p>
            </div>
            <div>
              <p className="font-bold text-slate-900 underline text-sm">{kopConfig.pimpinanNama || "dr. H. Ahmad Fauzi, M.Kes"}</p>
              <p className="text-slate-500 text-[11px]">NIP. {kopConfig.pimpinanNip || "-"}</p>
            </div>
          </div>

          <div className="space-y-16">
            <div>
              <p className="text-slate-500">Dilaporkan Oleh,</p>
              <p className="font-bold text-slate-900">{kopConfig.pelaporJabatan || "Penanggung Jawab MFK & K3"}</p>
            </div>
            <div>
              <p className="font-bold text-slate-900 underline text-sm">{kopConfig.pelaporNama || "Administrator MFK / Tim Sanitasi"}</p>
              <p className="text-slate-500 text-[11px]">{kopConfig.pelaporKeterangan || "Koordinator Fasilitas & Keselamatan"}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Cetak & Download PDF Laporan */}
      <Modal
        isOpen={isPdfModalOpen}
        onClose={() => setIsPdfModalOpen(false)}
        title="Download Laporan PDF (Akreditasi MFK)"
      >
        <div className="space-y-5 text-sm">
          {/* Periode Info Banner */}
          <div className="p-3.5 bg-emerald-50/80 border border-emerald-200 rounded-xl flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-emerald-800 uppercase tracking-wider">
                Periode Laporan Terpilih
              </p>
              <p className="font-bold text-slate-800 text-sm mt-0.5">
                {periodLabel}
              </p>
            </div>
            <span className="px-2.5 py-1 bg-white text-emerald-700 text-xs font-bold rounded-lg border border-emerald-200 shadow-xs">
              Resmi Puskesmas
            </span>
          </div>

          {/* Opsi 1: Laporan Gabungan */}
          <div className="p-4 bg-slate-900 text-white rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-md">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-500 text-slate-950">
                  Lengkap
                </span>
                <h4 className="font-bold text-sm text-white">Laporan Gabungan MFK</h4>
              </div>
              <p className="text-xs text-slate-300 mt-1 max-w-md">
                Seluruh rekapitulasi 8 jenis inspeksi sarana fasilitas, pelaporan kerusakan utilitas, dan insiden K3 dalam satu dokumen resmi ber-KOP & lembar pengesahan.
              </p>
            </div>
            <button
              onClick={() => handleDownloadPDF("all")}
              disabled={generatingPdf}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl transition shadow cursor-pointer shrink-0 disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>{generatingPdf ? "Memproses..." : "Download PDF Gabungan"}</span>
            </button>
          </div>

          {/* Opsi 2: Download Terpisah Per Jenis Inspeksi (8 Kategori) */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-emerald-600" />
                <span>Download Terpisah Per Jenis Inspeksi (8 Kategori)</span>
              </h4>
              <span className="text-xs text-slate-400">Pilih kategori spesifik</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[260px] overflow-y-auto pr-1">
              {INSPECTION_CATEGORIES.map((catName) => {
                const count = (reportData?.inspections || []).filter(
                  (i) => i.inspection_type === catName
                ).length;
                return (
                  <div
                    key={catName}
                    className="p-2.5 bg-white border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/20 rounded-xl flex items-center justify-between transition gap-2"
                  >
                    <div>
                      <p className="font-semibold text-slate-800 text-xs">{catName}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {count > 0 ? (
                          <span className="text-emerald-600 font-medium">{count} data pemeriksaan</span>
                        ) : (
                          "0 data pada periode ini"
                        )}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDownloadPDF(catName)}
                      disabled={generatingPdf}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 hover:bg-emerald-600 hover:text-white text-slate-700 text-xs font-semibold rounded-lg transition cursor-pointer shrink-0 disabled:opacity-50"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>PDF</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Opsi 3: Download Terpisah Rekapitulasi Inventarisasi (Barang, B3, Alkes) */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1.5">
                <Package className="w-4 h-4 text-blue-600" />
                <span>Download Terpisah Inventarisasi (3 Modul)</span>
              </h4>
              <span className="text-xs text-slate-400">Pilih modul aset</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div className="p-2.5 bg-white border border-slate-200 hover:border-blue-300 rounded-xl flex items-center justify-between gap-2">
                <div>
                  <p className="font-semibold text-slate-800 text-xs">1. Barang & Sarpras</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">{barangInventories.length} item fisik</p>
                </div>
                <button
                  onClick={() => handleDownloadPDF("inventaris_barang")}
                  disabled={generatingPdf}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-blue-50 hover:bg-blue-600 hover:text-white text-blue-800 text-xs font-semibold rounded-lg transition cursor-pointer shrink-0 disabled:opacity-50"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>PDF</span>
                </button>
              </div>

              <div className="p-2.5 bg-white border border-slate-200 hover:border-purple-300 rounded-xl flex items-center justify-between gap-2">
                <div>
                  <p className="font-semibold text-slate-800 text-xs">2. Bahan B3 Medis</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">{b3Inventories.length} bahan B3 terdata</p>
                </div>
                <button
                  onClick={() => handleDownloadPDF("inventaris_b3")}
                  disabled={generatingPdf}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-purple-50 hover:bg-purple-600 hover:text-white text-purple-800 text-xs font-semibold rounded-lg transition cursor-pointer shrink-0 disabled:opacity-50"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>PDF</span>
                </button>
              </div>

              <div className="p-2.5 bg-white border border-slate-200 hover:border-teal-300 rounded-xl flex items-center justify-between gap-2">
                <div>
                  <p className="font-semibold text-slate-800 text-xs">3. Alat Kesehatan & Kalibrasi</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">{alkesInventories.length} alat medis</p>
                </div>
                <button
                  onClick={() => handleDownloadPDF("inventaris_alkes")}
                  disabled={generatingPdf}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-teal-50 hover:bg-teal-600 hover:text-white text-teal-800 text-xs font-semibold rounded-lg transition cursor-pointer shrink-0 disabled:opacity-50"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>PDF</span>
                </button>
              </div>

              <div className="p-2.5 bg-white border border-slate-200 hover:border-slate-300 rounded-xl flex items-center justify-between gap-2">
                <div>
                  <p className="font-semibold text-slate-800 text-xs">Gabungan Semua Inventaris</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">{allInventories.length} total seluruh aset</p>
                </div>
                <button
                  onClick={() => handleDownloadPDF("inventaris")}
                  disabled={generatingPdf}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-800 hover:text-white text-slate-700 text-xs font-semibold rounded-lg transition cursor-pointer shrink-0 disabled:opacity-50"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>PDF</span>
                </button>
              </div>
            </div>
          </div>

          {/* Opsi 4: Laporan Khusus Utilitas & Insiden */}
          <div>
            <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Wrench className="w-4 h-4 text-amber-600" />
              <span>Laporan Khusus Utilitas & Insiden K3</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div className="p-2.5 bg-white border border-slate-200 rounded-xl flex items-center justify-between gap-2">
                <div>
                  <p className="font-semibold text-slate-800 text-xs">Utilitas</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {reportData?.utilities?.length || 0} laporan
                  </p>
                </div>
                <button
                  onClick={() => handleDownloadPDF("utilitas")}
                  disabled={generatingPdf}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-amber-50 text-amber-800 hover:bg-amber-600 hover:text-white border border-amber-200 text-xs font-semibold rounded-lg transition cursor-pointer shrink-0 disabled:opacity-50"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>PDF</span>
                </button>
              </div>

              <div className="p-2.5 bg-white border border-slate-200 rounded-xl flex items-center justify-between gap-2">
                <div>
                  <p className="font-semibold text-slate-800 text-xs">Insiden K3</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {reportData?.incidents?.length || 0} kasus
                  </p>
                </div>
                <button
                  onClick={() => handleDownloadPDF("insiden")}
                  disabled={generatingPdf}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-rose-50 text-rose-800 hover:bg-rose-600 hover:text-white border border-rose-200 text-xs font-semibold rounded-lg transition cursor-pointer shrink-0 disabled:opacity-50"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>PDF</span>
                </button>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 font-medium cursor-pointer"
            >
              <Printer className="w-4 h-4 text-slate-400" />
              <span>Buka Print Preview Browser (Ctrl+P)</span>
            </button>
            <button
              type="button"
              onClick={() => setIsPdfModalOpen(false)}
              className="w-full sm:w-auto px-5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition cursor-pointer"
            >
              Tutup
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal Pengaturan KOP Surat & Pejabat Penandatangan */}
      <Modal
        isOpen={isKopModalOpen}
        onClose={() => setIsKopModalOpen(false)}
        title="Pengaturan KOP Surat & Pejabat Penandatangan"
      >
        <form onSubmit={handleSaveKop} className="space-y-5 text-sm">
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800">
            Perubahan KOP dan nama pejabat akan disimpan ke <b>Database MySQL Server</b> dan otomatis diterapkan pada <b>Cetak PDF</b>, <b>Print Out Browser</b>, dan <b>Export CSV Excel</b>.
          </div>

          {/* Section 1: KOP Surat */}
          <div className="space-y-3">
            <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-200 pb-1.5">
              <Building className="w-4 h-4 text-emerald-600" />
              <span>Format KOP Surat Resmi Puskesmas</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Instansi Induk / Pemerintah Daerah
                </label>
                <input
                  type="text"
                  value={tempKopConfig.instansiInduk || ""}
                  onChange={(e) => setTempKopConfig({ ...tempKopConfig, instansiInduk: e.target.value })}
                  placeholder="PEMERINTAH KABUPATEN / KOTA"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Dinas Kesehatan
                </label>
                <input
                  type="text"
                  value={tempKopConfig.dinasKesehatan || ""}
                  onChange={(e) => setTempKopConfig({ ...tempKopConfig, dinasKesehatan: e.target.value })}
                  placeholder="DINAS KESEHATAN KABUPATEN / KOTA"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Satuan Kerja / Puskesmas
                </label>
                <input
                  type="text"
                  value={tempKopConfig.namaPuskesmas || ""}
                  onChange={(e) => setTempKopConfig({ ...tempKopConfig, namaPuskesmas: e.target.value })}
                  placeholder="UPTD PUSKESMAS KECAMATAN"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold text-emerald-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Kota / Wilayah Dokumen
                </label>
                <input
                  type="text"
                  value={tempKopConfig.kotaDokumen || ""}
                  onChange={(e) => setTempKopConfig({ ...tempKopConfig, kotaDokumen: e.target.value })}
                  placeholder="Contoh: Cibinong / Bogor"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Alamat & Kontak Puskesmas (Baris Sub-Header)
                </label>
                <input
                  type="text"
                  value={tempKopConfig.alamatKontak || ""}
                  onChange={(e) => setTempKopConfig({ ...tempKopConfig, alamatKontak: e.target.value })}
                  placeholder="Jl. Raya Kesehatan No. 01, Telp. (021) 1234567 | Pos-el: puskesmas@dinkes.go.id"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Pimpinan (Mengetahui) */}
          <div className="space-y-3">
            <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-200 pb-1.5">
              <User className="w-4 h-4 text-emerald-600" />
              <span>Pejabat Menyetujui (Pimpinan Puskesmas)</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Jabatan Pimpinan
                </label>
                <input
                  type="text"
                  value={tempKopConfig.pimpinanJabatan || ""}
                  onChange={(e) => setTempKopConfig({ ...tempKopConfig, pimpinanJabatan: e.target.value })}
                  placeholder="Kepala UPTD Puskesmas"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Lengkap & Gelar Pimpinan
                </label>
                <input
                  type="text"
                  value={tempKopConfig.pimpinanNama || ""}
                  onChange={(e) => setTempKopConfig({ ...tempKopConfig, pimpinanNama: e.target.value })}
                  placeholder="dr. H. Ahmad Fauzi, M.Kes"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  NIP Pimpinan
                </label>
                <input
                  type="text"
                  value={tempKopConfig.pimpinanNip || ""}
                  onChange={(e) => setTempKopConfig({ ...tempKopConfig, pimpinanNip: e.target.value })}
                  placeholder="19780512 200501 1 008"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Pelapor (Penanggung Jawab MFK & K3) */}
          <div className="space-y-3">
            <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-200 pb-1.5">
              <ClipboardCheck className="w-4 h-4 text-emerald-600" />
              <span>Pejabat Pelapor (Penanggung Jawab MFK / Sanitasi)</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Jabatan Pelapor
                </label>
                <input
                  type="text"
                  value={tempKopConfig.pelaporJabatan || ""}
                  onChange={(e) => setTempKopConfig({ ...tempKopConfig, pelaporJabatan: e.target.value })}
                  placeholder="Penanggung Jawab MFK & K3"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Pejabat / Pelapor
                </label>
                <input
                  type="text"
                  value={tempKopConfig.pelaporNama || ""}
                  onChange={(e) => setTempKopConfig({ ...tempKopConfig, pelaporNama: e.target.value })}
                  placeholder="Administrator MFK / Tim Sanitasi"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Unit Kerja / Keterangan
                </label>
                <input
                  type="text"
                  value={tempKopConfig.pelaporKeterangan || ""}
                  onChange={(e) => setTempKopConfig({ ...tempKopConfig, pelaporKeterangan: e.target.value })}
                  placeholder="Koordinator Fasilitas & Keselamatan"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons in Modal */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={handleResetKop}
              className="inline-flex items-center gap-1.5 text-xs text-rose-600 hover:text-rose-700 font-semibold cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset ke Default</span>
            </button>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setIsKopModalOpen(false)}
                className="flex-1 sm:flex-none px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-xs shadow-md shadow-emerald-600/20 transition cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Simpan Pengaturan</span>
              </button>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
}
