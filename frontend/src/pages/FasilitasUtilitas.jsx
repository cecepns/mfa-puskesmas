import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
import {
  Plus,
  Search,
  CheckSquare,
  Wrench,
  Building,
  Calendar,
  User,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Clock,
  Flame,
  Info,
  ShieldCheck,
  Zap,
  Wind,
  FlameKindling,
  Radio,
  Layers,
  Filter,
  RefreshCw,
  SlidersHorizontal,
} from "lucide-react";
import { request } from "../utils/request";
import { API_ENDPOINTS } from "../utils/endpoints";
import { useDebounce } from "../hooks/useDebounce";
import Pagination from "../components/Common/Pagination";
import Modal from "../components/Common/Modal";

const INSPECTION_TYPES = [
  "Inspeksi Ruangan",
  "Inspeksi Bangunan",
  "Inspeksi Listrik",
  "Inspeksi Air dan Sanitasi",
  "Inspeksi Kebakaran",
  "Inspeksi Limbah",
  "Inspeksi Gas Medis",
  "Inspeksi Lingkungan",
];

const UTILITY_SYSTEMS = [
  "Sistem Kelistrikan",
  "Sistem Gas Medis",
  "Sistem Proteksi Kebakaran",
  "Sistem Komunikasi dan TI",
  "Sistem Pendinginan Khusus",
  "Sistem Tata Udara dan Ventilasi",
];

export default function FasilitasUtilitas() {
  const [mode, setMode] = useState("inspeksi"); // "inspeksi" | "pelaporan"
  const [selectedType, setSelectedType] = useState("Semua");
  const [selectedRoom, setSelectedRoom] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [selectedUtility, setSelectedUtility] = useState("Semua");
  const [selectedUrgency, setSelectedUrgency] = useState("");

  const [rooms, setRooms] = useState([]);
  const [list, setList] = useState([]);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [detailItem, setDetailItem] = useState(null);
  const [loading, setLoading] = useState(false);

  // Summary counts
  const [summary, setSummary] = useState({
    totalInspeksi: 0,
    perluPerbaikan: 0,
    totalUtilitas: 0,
    kerusakanUrgen: 0,
  });

  const [inspectionForm, setInspectionForm] = useState({
    inspection_type: INSPECTION_TYPES[0],
    inspection_datetime: new Date().toISOString().slice(0, 16),
    officer_name: "",
    work_unit: "",
    room_id: "",
    inspection_items: "Kondisi kebersihan, sarana, dan fasilitas ruangan",
    standard_condition: "Bersih, aman, dan berfungsi normal sesuai SOP",
    result_status: "Baik",
    finding_description: "",
    risk_level: "Rendah",
    recommendation: "",
    status_tindak_lanjut: "Selesai",
  });

  const [utilityForm, setUtilityForm] = useState({
    report_datetime: new Date().toISOString().slice(0, 16),
    officer_name: "",
    work_unit: "",
    room_id: "",
    utility_system: UTILITY_SYSTEMS[0],
    damage_description: "",
    recommendation: "",
    urgency: "Segera",
    status: "Menunggu",
  });

  useEffect(() => {
    request.get(API_ENDPOINTS.ROOMS.LIST).then((res) => setRooms(res.data || []));
  }, []);

  const fetchSummaryCounts = async () => {
    try {
      const [inspRes, utilRes] = await Promise.all([
        request.get(API_ENDPOINTS.INSPECTIONS.LIST, { limit: 100 }),
        request.get(API_ENDPOINTS.UTILITY_REPORTS.LIST, { limit: 100 }),
      ]);
      const insList = inspRes.data || [];
      const utList = utilRes.data || [];
      setSummary({
        totalInspeksi: inspRes.pagination?.total || insList.length,
        perluPerbaikan: insList.filter((i) => i.result_status !== "Baik").length,
        totalUtilitas: utilRes.pagination?.total || utList.length,
        kerusakanUrgen: utList.filter((u) => u.urgency === "Segera").length,
      });
    } catch {
      // fallback
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      if (mode === "inspeksi") {
        const res = await request.get(API_ENDPOINTS.INSPECTIONS.LIST, {
          page: pagination.page,
          limit: pagination.limit,
          search: debouncedSearch,
          inspection_type: selectedType === "Semua" ? "" : selectedType,
          room_id: selectedRoom,
          result_status: selectedStatus,
        });
        setList(res.data || []);
        setPagination(res.pagination || { page: 1, limit: 10, total: 0, totalPages: 1 });
      } else {
        const res = await request.get(API_ENDPOINTS.UTILITY_REPORTS.LIST, {
          page: pagination.page,
          limit: pagination.limit,
          search: debouncedSearch,
          utility_system: selectedUtility === "Semua" ? "" : selectedUtility,
          room_id: selectedRoom,
          urgency: selectedUrgency,
          status: selectedStatus,
        });
        setList(res.data || []);
        setPagination(res.pagination || { page: 1, limit: 10, total: 0, totalPages: 1 });
      }
    } catch (err) {
      toast.error("Gagal memuat data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummaryCounts();
  }, []);

  useEffect(() => {
    fetchData();
  }, [
    mode,
    selectedType,
    selectedUtility,
    selectedRoom,
    selectedStatus,
    selectedUrgency,
    pagination.page,
    pagination.limit,
    debouncedSearch,
  ]);

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (mode === "inspeksi") {
        await request.post(API_ENDPOINTS.INSPECTIONS.CREATE, {
          ...inspectionForm,
          room_id: inspectionForm.room_id || rooms[0]?.id,
        });
      } else {
        await request.post(API_ENDPOINTS.UTILITY_REPORTS.CREATE, {
          ...utilityForm,
          room_id: utilityForm.room_id || rooms[0]?.id,
        });
      }
      toast.success("Data berhasil disimpan");
      setIsModalOpen(false);
      fetchData();
      fetchSummaryCounts();
    } catch (err) {
      toast.error(err.response?.data?.message || "Gagal menyimpan data");
    }
  };

  const getResultBadge = (status) => {
    if (status === "Baik") {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Baik
        </span>
      );
    }
    if (status === "Perlu Perbaikan") {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
          <AlertCircle className="w-3.5 h-3.5 text-amber-600" /> Perlu Perbaikan
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
        <XCircle className="w-3.5 h-3.5 text-rose-600" /> Tidak Standar
      </span>
    );
  };

  const getTindakLanjutBadge = (status) => {
    if (status === "Selesai") {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-emerald-100 text-emerald-800">
          <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Selesai
        </span>
      );
    }
    if (status === "Dalam Proses" || status === "Diproses") {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-blue-100 text-blue-800">
          <Clock className="w-3 h-3 text-blue-600" /> Proses
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-amber-100 text-amber-800">
        <Clock className="w-3 h-3 text-amber-600" /> {status || "Menunggu"}
      </span>
    );
  };

  const getUtilityIcon = (sys) => {
    if (sys.includes("Listrik")) return <Zap className="w-3.5 h-3.5 text-amber-500" />;
    if (sys.includes("Gas Medis")) return <Layers className="w-3.5 h-3.5 text-teal-500" />;
    if (sys.includes("Kebakaran")) return <Flame className="w-3.5 h-3.5 text-rose-500" />;
    if (sys.includes("Tata Udara") || sys.includes("Pendingin")) return <Wind className="w-3.5 h-3.5 text-sky-500" />;
    return <Wrench className="w-3.5 h-3.5 text-slate-500" />;
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

  return (
    <div className="space-y-6">
      {/* Top Header & Dual Segmented View Control */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">03. Fasilitas & Utilitas</h2>
          <p className="text-sm text-slate-500 mt-1">
            Monitoring inspeksi sanitasi harian dan sistem pelaporan kerusakan utilitas Puskesmas.
          </p>
        </div>

        {/* Clean Segmented Control: only 2 primary views */}
        <div className="inline-flex p-1 bg-slate-200/80 rounded-2xl border border-slate-300/60 shadow-inner">
          <button
            onClick={() => {
              setMode("inspeksi");
              setSelectedStatus("");
              setPagination((p) => ({ ...p, page: 1 }));
            }}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              mode === "inspeksi"
                ? "bg-white text-emerald-800 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <CheckSquare className="w-4 h-4 text-emerald-600" />
            <span>Inspeksi Fasilitas</span>
          </button>
          <button
            onClick={() => {
              setMode("pelaporan");
              setSelectedStatus("");
              setPagination((p) => ({ ...p, page: 1 }));
            }}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              mode === "pelaporan"
                ? "bg-white text-amber-800 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Wrench className="w-4 h-4 text-amber-600" />
            <span>Kerusakan Utilitas</span>
          </button>
        </div>
      </div>

      {/* Top Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Inspeksi</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{summary.totalInspeksi}</p>
            <p className="text-[11px] text-emerald-600 font-medium mt-0.5">Fasilitas & Sanitasi</p>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <CheckSquare className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Perlu Perbaikan</p>
            <p className="text-2xl font-bold text-amber-600 mt-1">{summary.perluPerbaikan}</p>
            <p className="text-[11px] text-amber-700 font-medium mt-0.5">Temuan pemeriksa</p>
          </div>
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <AlertCircle className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Laporan Kerusakan</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{summary.totalUtilitas}</p>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5">Sistem teknis</p>
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <Wrench className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Kerusakan Kritis</p>
            <p className="text-2xl font-bold text-rose-600 mt-1">{summary.kerusakanUrgen}</p>
            <p className="text-[11px] text-rose-600 font-medium mt-0.5">Status Segera</p>
          </div>
          <div className="p-3 bg-rose-50 text-rose-600 rounded-xl">
            <Flame className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Simple & Clean Filter Header (No 8-grid buttons!) */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between bg-slate-50/50">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              placeholder={
                mode === "inspeksi"
                  ? "Cari petugas, ruangan, atau catatan temuan..."
                  : "Cari sistem, pelapor, atau deskripsi kerusakan..."
              }
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Clean Dropdown Filters */}
          <div className="flex flex-wrap items-center gap-2">
            {mode === "inspeksi" ? (
              <>
                <select
                  value={selectedType}
                  onChange={(e) => {
                    setSelectedType(e.target.value);
                    setPagination((p) => ({ ...p, page: 1 }));
                  }}
                  className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="Semua">Semua Jenis Inspeksi (8 Kategori)</option>
                  {INSPECTION_TYPES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>

                <select
                  value={selectedStatus}
                  onChange={(e) => {
                    setSelectedStatus(e.target.value);
                    setPagination((p) => ({ ...p, page: 1 }));
                  }}
                  className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">Semua Hasil</option>
                  <option value="Baik">Hasil Baik</option>
                  <option value="Perlu Perbaikan">Perlu Perbaikan</option>
                  <option value="Tidak Memenuhi Standar">Tidak Standar</option>
                </select>
              </>
            ) : (
              <>
                <select
                  value={selectedUtility}
                  onChange={(e) => {
                    setSelectedUtility(e.target.value);
                    setPagination((p) => ({ ...p, page: 1 }));
                  }}
                  className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="Semua">Semua Sistem Utilitas</option>
                  {UTILITY_SYSTEMS.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>

                <select
                  value={selectedUrgency}
                  onChange={(e) => {
                    setSelectedUrgency(e.target.value);
                    setPagination((p) => ({ ...p, page: 1 }));
                  }}
                  className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="">Semua Urgensi</option>
                  <option value="Segera">Segera (Kritis)</option>
                  <option value="Normal">Normal</option>
                </select>

                <select
                  value={selectedStatus}
                  onChange={(e) => {
                    setSelectedStatus(e.target.value);
                    setPagination((p) => ({ ...p, page: 1 }));
                  }}
                  className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="">Semua Status</option>
                  <option value="Menunggu">Menunggu</option>
                  <option value="Diproses">Diproses</option>
                  <option value="Selesai">Selesai</option>
                </select>
              </>
            )}

            <select
              value={selectedRoom}
              onChange={(e) => {
                setSelectedRoom(e.target.value);
                setPagination((p) => ({ ...p, page: 1 }));
              }}
              className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">Semua Ruangan</option>
              {rooms.map((r) => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>

            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs rounded-xl shadow-sm transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{mode === "inspeksi" ? "Input Inspeksi" : "Lapor Kerusakan"}</span>
            </button>
          </div>
        </div>

        {/* Responsive Table (No Offset) */}
        <div className="overflow-x-auto">
          {mode === "inspeksi" ? (
            <table className="w-full text-left border-collapse min-w-[850px]">
              <thead>
                <tr className="bg-slate-50/90 text-slate-600 text-xs font-semibold uppercase tracking-wider border-b border-slate-200">
                  <th className="px-4 py-3.5 w-40 whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>Waktu</span>
                    </div>
                  </th>
                  <th className="px-4 py-3.5 w-48 whitespace-nowrap">Jenis Inspeksi</th>
                  <th className="px-4 py-3.5 w-44">
                    <div className="flex items-center gap-1.5">
                      <Building className="w-3.5 h-3.5 text-slate-400" />
                      <span>Ruangan</span>
                    </div>
                  </th>
                  <th className="px-4 py-3.5 w-44">
                    <div className="flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      <span>Petugas</span>
                    </div>
                  </th>
                  <th className="px-4 py-3.5 w-36 whitespace-nowrap">Hasil Kondisi</th>
                  <th className="px-4 py-3.5 min-w-[200px]">Temuan & Rekomendasi</th>
                  <th className="px-4 py-3.5 w-28 text-center whitespace-nowrap">Tindak Lanjut</th>
                  <th className="px-4 py-3.5 w-16 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                {loading ? (
                  <tr>
                    <td colSpan="8" className="px-4 py-8 text-center text-slate-400">
                      Memuat data pemeriksaan...
                    </td>
                  </tr>
                ) : list.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="px-4 py-8 text-center text-slate-400">
                      Tidak ada data inspeksi yang sesuai dengan filter.
                    </td>
                  </tr>
                ) : (
                  list.map((row) => (
                    <tr key={row.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3.5 text-xs text-slate-500 whitespace-nowrap font-medium">
                        {formatDate(row.inspection_datetime)}
                      </td>
                      <td className="px-4 py-3.5 font-semibold text-slate-800 text-xs">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                          {row.inspection_type}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-xs font-semibold text-slate-900">
                        {row.room_name}
                      </td>
                      <td className="px-4 py-3.5 text-xs">
                        <div className="font-semibold text-slate-800">{row.officer_name}</div>
                        <div className="text-[11px] text-slate-400">{row.work_unit}</div>
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        {getResultBadge(row.result_status)}
                      </td>
                      <td className="px-4 py-3.5 text-xs">
                        {row.finding_description && (
                          <div className="text-slate-800 font-medium">
                            <span className="text-slate-500 font-normal">Temuan: </span>
                            {row.finding_description}
                          </div>
                        )}
                        {row.recommendation && (
                          <div className="text-emerald-700 mt-0.5">
                            <span className="font-semibold">Saran: </span>
                            {row.recommendation}
                          </div>
                        )}
                        {!row.finding_description && !row.recommendation && (
                          <span className="text-slate-400 italic">Sesuai standar operasional</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-center whitespace-nowrap">
                        {getTindakLanjutBadge(row.status_tindak_lanjut)}
                      </td>
                      <td className="px-4 py-3.5 text-center whitespace-nowrap">
                        <button
                          onClick={() => setDetailItem({ ...row, type: "inspeksi" })}
                          className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
                          title="Lihat Detail"
                        >
                          <Info className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          ) : (
            <table className="w-full text-left border-collapse min-w-[850px]">
              <thead>
                <tr className="bg-slate-50/90 text-slate-600 text-xs font-semibold uppercase tracking-wider border-b border-slate-200">
                  <th className="px-4 py-3.5 w-40 whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>Waktu Lapor</span>
                    </div>
                  </th>
                  <th className="px-4 py-3.5 w-48">Sistem Utilitas</th>
                  <th className="px-4 py-3.5 w-44">Ruangan</th>
                  <th className="px-4 py-3.5 w-40">Pelapor</th>
                  <th className="px-4 py-3.5 min-w-[200px]">Kerusakan & Rekomendasi</th>
                  <th className="px-4 py-3.5 w-28 text-center whitespace-nowrap">Urgensi</th>
                  <th className="px-4 py-3.5 w-28 text-center whitespace-nowrap">Status</th>
                  <th className="px-4 py-3.5 w-16 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                {loading ? (
                  <tr>
                    <td colSpan="8" className="px-4 py-8 text-center text-slate-400">
                      Memuat laporan kerusakan...
                    </td>
                  </tr>
                ) : list.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="px-4 py-8 text-center text-slate-400">
                      Tidak ada laporan kerusakan utilitas yang sesuai.
                    </td>
                  </tr>
                ) : (
                  list.map((row) => (
                    <tr key={row.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3.5 text-xs text-slate-500 whitespace-nowrap font-medium">
                        {formatDate(row.report_datetime)}
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-amber-50 text-amber-900 border border-amber-200">
                          {getUtilityIcon(row.utility_system)}
                          {row.utility_system}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 font-semibold text-slate-800 text-xs">
                        {row.room_name}
                      </td>
                      <td className="px-4 py-3.5 text-xs">
                        <div className="font-semibold text-slate-800">{row.officer_name}</div>
                        <div className="text-[11px] text-slate-400">{row.work_unit}</div>
                      </td>
                      <td className="px-4 py-3.5 text-xs">
                        <div className="font-medium text-slate-800">{row.damage_description}</div>
                        {row.recommendation && (
                          <div className="text-slate-500 mt-0.5">
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
                          <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                            Normal
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-center whitespace-nowrap">
                        {getTindakLanjutBadge(row.status)}
                      </td>
                      <td className="px-4 py-3.5 text-center whitespace-nowrap">
                        <button
                          onClick={() => setDetailItem({ ...row, type: "utilitas" })}
                          className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition"
                          title="Lihat Detail"
                        >
                          <Info className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        <div className="p-4 border-t border-slate-100">
          <Pagination
            pagination={pagination}
            onPageChange={(page) => setPagination((p) => ({ ...p, page }))}
            onLimitChange={(limit) => setPagination((p) => ({ ...p, limit, page: 1 }))}
          />
        </div>
      </div>

      {/* Modal Input Data */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={mode === "inspeksi" ? "Input Hasil Inspeksi Fasilitas" : "Lapor Kerusakan Sistem Utilitas"}
      >
        <form onSubmit={handleSave} className="space-y-4 text-sm max-h-[75vh] overflow-y-auto pr-1">
          {mode === "inspeksi" ? (
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Jenis Pemeriksaan *
              </label>
              <select
                value={inspectionForm.inspection_type}
                onChange={(e) => setInspectionForm({ ...inspectionForm, inspection_type: e.target.value })}
                className="w-full border border-slate-300 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              >
                {INSPECTION_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Sistem Utilitas *
              </label>
              <select
                value={utilityForm.utility_system}
                onChange={(e) => setUtilityForm({ ...utilityForm, utility_system: e.target.value })}
                className="w-full border border-slate-300 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
              >
                {UTILITY_SYSTEMS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Ruangan / Klaster Lokasi *
            </label>
            <select
              value={mode === "inspeksi" ? inspectionForm.room_id : utilityForm.room_id}
              onChange={(e) =>
                mode === "inspeksi"
                  ? setInspectionForm({ ...inspectionForm, room_id: e.target.value })
                  : setUtilityForm({ ...utilityForm, room_id: e.target.value })
              }
              className="w-full border border-slate-300 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            >
              {rooms.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name} ({r.category.replace("_", " ")})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Nama Petugas / Pelapor *
              </label>
              <input
                type="text"
                required
                placeholder="Nama staf"
                value={mode === "inspeksi" ? inspectionForm.officer_name : utilityForm.officer_name}
                onChange={(e) =>
                  mode === "inspeksi"
                    ? setInspectionForm({ ...inspectionForm, officer_name: e.target.value })
                    : setUtilityForm({ ...utilityForm, officer_name: e.target.value })
                }
                className="w-full border border-slate-300 rounded-xl p-2.5 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Unit Kerja *
              </label>
              <input
                type="text"
                required
                placeholder="Sanitasi, UGD, dll"
                value={mode === "inspeksi" ? inspectionForm.work_unit : utilityForm.work_unit}
                onChange={(e) =>
                  mode === "inspeksi"
                    ? setInspectionForm({ ...inspectionForm, work_unit: e.target.value })
                    : setUtilityForm({ ...utilityForm, work_unit: e.target.value })
                }
                className="w-full border border-slate-300 rounded-xl p-2.5 text-sm"
              />
            </div>
          </div>

          {mode === "inspeksi" ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Hasil Kondisi *
                  </label>
                  <select
                    value={inspectionForm.result_status}
                    onChange={(e) => setInspectionForm({ ...inspectionForm, result_status: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl p-2.5 text-sm"
                  >
                    <option value="Baik">Baik (Sesuai Standar)</option>
                    <option value="Perlu Perbaikan">Perlu Perbaikan</option>
                    <option value="Tidak Memenuhi Standar">Tidak Memenuhi Standar</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Tingkat Risiko
                  </label>
                  <select
                    value={inspectionForm.risk_level}
                    onChange={(e) => setInspectionForm({ ...inspectionForm, risk_level: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl p-2.5 text-sm"
                  >
                    <option value="Rendah">Rendah</option>
                    <option value="Sedang">Sedang</option>
                    <option value="Tinggi">Tinggi</option>
                    <option value="Ekstrem">Ekstrem</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Deskripsi Temuan Lapangan
                </label>
                <textarea
                  rows="2"
                  placeholder="Jelaskan temuan bila ada kerusakan / ketidaksesuaian..."
                  value={inspectionForm.finding_description}
                  onChange={(e) => setInspectionForm({ ...inspectionForm, finding_description: e.target.value })}
                  className="w-full border border-slate-300 rounded-xl p-2.5 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Rekomendasi Tindak Lanjut
                </label>
                <textarea
                  rows="2"
                  placeholder="Rekomendasi perbaikan sarana..."
                  value={inspectionForm.recommendation}
                  onChange={(e) => setInspectionForm({ ...inspectionForm, recommendation: e.target.value })}
                  className="w-full border border-slate-300 rounded-xl p-2.5 text-sm"
                />
              </div>
            </>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Tingkat Urgensi
                  </label>
                  <select
                    value={utilityForm.urgency}
                    onChange={(e) => setUtilityForm({ ...utilityForm, urgency: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl p-2.5 text-sm"
                  >
                    <option value="Segera">Segera (Kritis / Berbahaya)</option>
                    <option value="Normal">Normal</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Status Awal
                  </label>
                  <select
                    value={utilityForm.status}
                    onChange={(e) => setUtilityForm({ ...utilityForm, status: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl p-2.5 text-sm"
                  >
                    <option value="Menunggu">Menunggu</option>
                    <option value="Diproses">Diproses</option>
                    <option value="Selesai">Selesai</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Deskripsi Kerusakan *
                </label>
                <textarea
                  required
                  rows="2"
                  placeholder="Rincian kerusakan peralatan utilitas..."
                  value={utilityForm.damage_description}
                  onChange={(e) => setUtilityForm({ ...utilityForm, damage_description: e.target.value })}
                  className="w-full border border-slate-300 rounded-xl p-2.5 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Saran Penanganan
                </label>
                <textarea
                  rows="2"
                  placeholder="Saran teknis darurat atau suku cadang..."
                  value={utilityForm.recommendation}
                  onChange={(e) => setUtilityForm({ ...utilityForm, recommendation: e.target.value })}
                  className="w-full border border-slate-300 rounded-xl p-2.5 text-sm"
                />
              </div>
            </>
          )}

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 font-medium"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl shadow-sm transition"
            >
              Simpan Data
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Detail Item */}
      <Modal
        isOpen={Boolean(detailItem)}
        onClose={() => setDetailItem(null)}
        title={detailItem?.type === "inspeksi" ? "Detail Hasil Inspeksi Fasilitas" : "Detail Laporan Kerusakan Utilitas"}
      >
        {detailItem && (
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs">
              <div>
                <p className="text-slate-400">Ruangan / Klaster</p>
                <p className="font-bold text-slate-800 text-sm mt-0.5">{detailItem.room_name}</p>
              </div>
              <div>
                <p className="text-slate-400">Waktu Pelaksanaan</p>
                <p className="font-semibold text-slate-800 mt-0.5">
                  {formatDate(detailItem.inspection_datetime || detailItem.report_datetime)}
                </p>
              </div>
              <div>
                <p className="text-slate-400">Petugas / Pelapor</p>
                <p className="font-semibold text-slate-800 mt-0.5">
                  {detailItem.officer_name} ({detailItem.work_unit})
                </p>
              </div>
              <div>
                <p className="text-slate-400">Status</p>
                <div className="mt-1">
                  {detailItem.type === "inspeksi"
                    ? getResultBadge(detailItem.result_status)
                    : getTindakLanjutBadge(detailItem.status)}
                </div>
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                {detailItem.type === "inspeksi" ? "Catatan Temuan" : "Uraian Kerusakan"}
              </p>
              <div className="p-3 bg-white rounded-xl border border-slate-200 text-slate-800 text-xs leading-relaxed">
                {detailItem.finding_description || detailItem.damage_description || "Kondisi sesuai standar operasional."}
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                Rekomendasi Tindakan
              </p>
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-900 text-xs leading-relaxed">
                {detailItem.recommendation || "Pertahankan kondisi standar ruangan."}
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setDetailItem(null)}
                className="px-4 py-2 bg-slate-800 text-white rounded-xl text-xs font-semibold hover:bg-slate-700 transition"
              >
                Tutup
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
