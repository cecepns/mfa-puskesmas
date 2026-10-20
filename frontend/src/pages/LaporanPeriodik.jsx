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
} from "lucide-react";
import { request } from "../utils/request";
import { API_ENDPOINTS } from "../utils/endpoints";
import toast from "react-hot-toast";

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
  const [periodType, setPeriodType] = useState("monthly");
  const [month, setMonth] = useState("10");
  const [year, setYear] = useState("2026");
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("inspeksi"); // "inspeksi" | "utilitas" | "insiden" | "pengesahan"

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

  const downloadCSV = () => {
    if (!reportData) return;
    const periodLabel =
      periodType === "monthly"
        ? `Bulan ${MONTHS.find((m) => m.value === month)?.label || month} ${year}`
        : `Tahun ${year}`;

    const rows = [
      ["LAPORAN PROGRAM MANAJEMEN FASILITAS DAN KESELAMATAN (MFK)"],
      ["UPTD PUSKESMAS"],
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
    ];

    const csvContent =
      "data:text/csv;charset=utf-8,\uFEFF" +
      rows.map((e) => e.map((c) => `"${String(c || "").replace(/"/g, '""')}"`).join(",")).join("\n");

    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", `Laporan_MFK_Puskesmas_${periodType}_${year}_${month}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Laporan CSV berhasil diunduh");
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
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={fetchReport}
            className="p-2.5 text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition cursor-pointer"
            title="Muat Ulang Data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          <button
            onClick={downloadCSV}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-sm rounded-xl shadow-md shadow-emerald-600/20 transition cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV (Excel)</span>
          </button>
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-medium text-sm rounded-xl shadow-md transition cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak PDF / Print</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
            <Filter className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Filter Periode</span>
            <div className="flex items-center gap-2 mt-1">
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
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {periodType === "monthly" && (
            <div className="flex items-center gap-2">
              <label className="text-xs font-medium text-slate-600">Bulan:</label>
              <select
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {MONTHS.map((m) => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </div>
          )}

          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-slate-600">Tahun:</label>
            <select
              value={year}
              onChange={(e) => setYear(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
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
        <div className="text-center space-y-1">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-600">
            PEMERINTAH KABUPATEN / KOTA • DINAS KESEHATAN
          </p>
          <h1 className="text-xl font-extrabold uppercase text-slate-900 tracking-wider">
            UPTD PUSKESMAS KELAS RAWAT INAP
          </h1>
          <p className="text-xs text-slate-500">
            Jl. Raya Kesehatan No. 01 • Telp: (021) 1234567 • Email: puskesmas@dinkes.go.id
          </p>
          <div className="mt-3 pt-2 border-t border-slate-400">
            <h2 className="text-base font-bold text-slate-900 uppercase">
              LAPORAN PROGRAM MANAJEMEN FASILITAS DAN KESELAMATAN (MFK)
            </h2>
            <p className="text-xs text-slate-600 font-medium">
              Periode: {periodType === "monthly" ? `${MONTHS.find((m) => m.value === month)?.label} ${year}` : `Tahun ${year}`}
            </p>
          </div>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Inspeksi */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              <ClipboardCheck className="w-4 h-4 text-emerald-600" />
              <span>Total Inspeksi</span>
            </div>
            <p className="text-2xl font-bold text-slate-900 mt-2">{inspectionsCount}</p>
            <p className="text-xs text-emerald-700 mt-1 font-medium flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> {goodInspections} Sesuai Standar
            </p>
          </div>
          <div className="p-3.5 rounded-2xl bg-emerald-50 text-emerald-600">
            <ClipboardCheck className="w-6 h-6" />
          </div>
        </div>

        {/* Card 2: Kerusakan Utilitas */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              <Wrench className="w-4 h-4 text-amber-600" />
              <span>Kerusakan Utilitas</span>
            </div>
            <p className="text-2xl font-bold text-slate-900 mt-2">{utilitiesCount}</p>
            <p className="text-xs text-amber-700 mt-1 font-medium flex items-center gap-1">
              <Flame className="w-3.5 h-3.5" />
              {reportData?.utilities?.filter((u) => u.urgency === "Segera").length || 0} Perlu Penanganan Segera
            </p>
          </div>
          <div className="p-3.5 rounded-2xl bg-amber-50 text-amber-600">
            <Wrench className="w-6 h-6" />
          </div>
        </div>

        {/* Card 3: Insiden Keselamatan */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              <ShieldAlert className="w-4 h-4 text-rose-600" />
              <span>Insiden Keselamatan</span>
            </div>
            <p className="text-2xl font-bold text-slate-900 mt-2">{incidentsCount}</p>
            <p className="text-xs text-rose-700 mt-1 font-medium flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5" /> Kasus K3 & Pasien
            </p>
          </div>
          <div className="p-3.5 rounded-2xl bg-rose-50 text-rose-600">
            <ShieldAlert className="w-6 h-6" />
          </div>
        </div>

        {/* Card 4: Kepatuhan Standar */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              <Award className="w-4 h-4 text-teal-600" />
              <span>Skor Standar MFK</span>
            </div>
            <p className="text-2xl font-bold text-slate-900 mt-2">{complianceRate}%</p>
            <p className="text-xs text-teal-700 mt-1 font-medium flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" /> Kepatuhan Sarpras
            </p>
          </div>
          <div className="p-3.5 rounded-2xl bg-teal-50 text-teal-600">
            <Award className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Navigation Tabs for detailed sections */}
      <div className="flex flex-wrap gap-2 print:hidden">
        <button
          onClick={() => setActiveTab("inspeksi")}
          className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition cursor-pointer ${
            activeTab === "inspeksi"
              ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20"
              : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
          }`}
        >
          <CheckSquare className="w-4 h-4" />
          <span>Rekap Inspeksi Ruangan ({reportData?.inspections?.length || 0})</span>
        </button>

        <button
          onClick={() => setActiveTab("utilitas")}
          className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition cursor-pointer ${
            activeTab === "utilitas"
              ? "bg-amber-600 text-white shadow-md shadow-amber-600/20"
              : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
          }`}
        >
          <Wrench className="w-4 h-4" />
          <span>Rekap Kerusakan Utilitas ({reportData?.utilities?.length || 0})</span>
        </button>

        <button
          onClick={() => setActiveTab("insiden")}
          className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition cursor-pointer ${
            activeTab === "insiden"
              ? "bg-rose-600 text-white shadow-md shadow-rose-600/20"
              : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
          }`}
        >
          <ShieldAlert className="w-4 h-4" />
          <span>Rekap Insiden & K3 ({reportData?.incidents?.length || 0})</span>
        </button>

        <button
          onClick={() => setActiveTab("pengesahan")}
          className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition cursor-pointer ${
            activeTab === "pengesahan"
              ? "bg-slate-900 text-white shadow-md"
              : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Lembar Pengesahan & Kop Resmi</span>
        </button>
      </div>

      {/* Main Table Container */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* TAB 1: INSPEKSI */}
        {(activeTab === "inspeksi" || window.matchMedia?.("print")?.matches) && (
          <div>
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
              <div className="flex items-center gap-2">
                <CheckSquare className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-slate-800 text-base">
                  Daftar Inspeksi Fasilitas, Sanitasi & Lingkungan
                </h3>
              </div>
              <span className="text-xs text-slate-500">
                Total: <b>{reportData?.inspections?.length || 0}</b> pemeriksaan
              </span>
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

        {/* TAB 4: LEMBAR PENGESAHAN */}
        {activeTab === "pengesahan" && (
          <div className="p-6 sm:p-8 space-y-6">
            <div className="border border-slate-200 rounded-2xl p-6 bg-slate-50/50 space-y-4">
              <div className="flex items-center gap-3 border-b border-slate-200 pb-3">
                <FileText className="w-6 h-6 text-emerald-600" />
                <div>
                  <h4 className="font-bold text-base text-slate-800">
                    Lembar Ringkasan Eksekutif & Bukti Kepatuhan Akreditasi
                  </h4>
                  <p className="text-xs text-slate-500">
                    Dokumen ini memvalidasi pemenuhan Standar Manajemen Fasilitas dan Keselamatan (MFK 1 - MFK 10)
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="space-y-2">
                  <div className="flex justify-between py-1.5 border-b border-slate-200">
                    <span className="text-slate-500">Nama Fasilitas Pelayanan:</span>
                    <span className="font-semibold text-slate-800">UPTD Puskesmas</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-200">
                    <span className="text-slate-500">Periode Evaluasi:</span>
                    <span className="font-semibold text-slate-800">
                      {periodType === "monthly" ? `Bulan ${MONTHS.find((m) => m.value === month)?.label} ${year}` : `Tahun ${year}`}
                    </span>
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
                    <span className="text-slate-500">Kejadian / Insiden K3:</span>
                    <span className="font-semibold text-slate-800">{incidentsCount} Kejadian</span>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-900 leading-relaxed">
                <b>Kesimpulan Evaluasi Tim MFK: </b>
                Secara umum pelaksanaan pemeliharaan sarana prasarana, sistem sanitasi, pengelolaan limbah B3, kalibrasi alkes, dan pencegahan insiden risiko telah berlangsung secara aktif sesuai dengan Standar MFK Puskesmas. Semua temuan yang berstatus "Perlu Perbaikan" sedang dalam tahap tindak lanjut oleh PJ Ruangan dan Bagian Pemeliharaan.
              </div>
            </div>

            {/* Official Signature Section */}
            <div className="grid grid-cols-2 gap-8 pt-6 border-t border-slate-200 text-center text-xs">
              <div className="space-y-16">
                <div>
                  <p className="text-slate-500">Mengetahui & Menyetujui,</p>
                  <p className="font-bold text-slate-800">Kepala UPTD Puskesmas</p>
                </div>
                <div>
                  <p className="font-bold text-slate-900 underline">dr. H. Ahmad Fauzi, M.Kes</p>
                  <p className="text-slate-500 text-[11px]">NIP. 19780512 200501 1 008</p>
                </div>
              </div>

              <div className="space-y-16">
                <div>
                  <p className="text-slate-500">Dilaporkan Oleh,</p>
                  <p className="font-bold text-slate-800">Penanggung Jawab MFK & K3</p>
                </div>
                <div>
                  <p className="font-bold text-slate-900 underline">Administrator MFK / Tim Sanitasi</p>
                  <p className="text-slate-500 text-[11px]">Koordinator Fasilitas & Keselamatan</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Signature in Print View */}
      <div className="hidden print:grid grid-cols-2 gap-8 pt-8 text-center text-xs">
        <div className="space-y-16">
          <div>
            <p className="text-slate-500">Mengetahui,</p>
            <p className="font-bold text-slate-900">Kepala UPTD Puskesmas</p>
          </div>
          <div>
            <p className="font-bold text-slate-900 underline">dr. H. Ahmad Fauzi, M.Kes</p>
            <p className="text-slate-500 text-[11px]">NIP. 19780512 200501 1 008</p>
          </div>
        </div>

        <div className="space-y-16">
          <div>
            <p className="text-slate-500">Dilaporkan Oleh,</p>
            <p className="font-bold text-slate-900">Penanggung Jawab MFK & K3</p>
          </div>
          <div>
            <p className="font-bold text-slate-900 underline">Administrator MFK / Tim Sanitasi</p>
            <p className="text-slate-500 text-[11px]">Koordinator Keselamatan Fasilitas</p>
          </div>
        </div>
      </div>
    </div>
  );
}
