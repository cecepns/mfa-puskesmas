import React, { useState, useEffect, useRef } from "react";
import toast from "react-hot-toast";
import {
  QrCode,
  Search,
  Filter,
  RefreshCw,
  Star,
  Building,
  User,
  Clock,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  Printer,
  Download,
  Trash2,
  ExternalLink,
  Phone,
  Sparkles,
  Layers,
  Camera,
  Eye,
  CheckSquare,
  FileSpreadsheet,
} from "lucide-react";
import { Link } from "react-router-dom";
import { request } from "../utils/request";
import { API_ENDPOINTS } from "../utils/endpoints";
import { useDebounce } from "../hooks/useDebounce";
import Pagination from "../components/Common/Pagination";
import Modal from "../components/Common/Modal";
import { QRCodeSVG, downloadQRCodeImage } from "../utils/qrGenerator";
import { downloadFeedbackReportPDF, DEFAULT_KOP_CONFIG } from "../utils/pdfGenerator";
import defaultLogo from "../assets/logo-puskesmas.png";

const CATEGORIES = [
  "Semua",
  "Sarana dan Prasarana",
  "Kebersihan & Sanitasi",
  "Kualitas Pelayanan",
  "Petugas",
  "Lainnya",
];

const STATUSES = ["Semua", "Menunggu", "Diproses", "Selesai"];

export default function PengaduanAdmin() {
  const [feedbacks, setFeedbacks] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const [selectedCategory, setSelectedCategory] = useState("Semua");
  const [selectedStatus, setSelectedStatus] = useState("Semua");
  const [selectedRoom, setSelectedRoom] = useState("");
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    avgPelayanan: 5.0,
    avgPetugas: 5.0,
    avgSarpras: 5.0,
    avgOverall: 5.0,
    menunggu: 0,
    diproses: 0,
    selesai: 0,
  });

  // Modal Detail & Tindak Lanjut
  const [detailItem, setDetailItem] = useState(null);
  const [followupStatus, setFollowupStatus] = useState("Menunggu");
  const [adminResponse, setAdminResponse] = useState("");
  const [savingResponse, setSavingResponse] = useState(false);

  // Modal Hapus
  const [deleteConfirmItem, setDeleteConfirmItem] = useState(null);

  // Modal Barcode / QR Code Poster
  const [isBarcodeModalOpen, setIsBarcodeModalOpen] = useState(false);
  const [barcodeRoomId, setBarcodeRoomId] = useState("");
  const [barcodeBaseUrl, setBarcodeBaseUrl] = useState(() => {
    try {
      return window.location.origin;
    } catch {
      return "https://sikela-puskesmas.vercel.app";
    }
  });

  const qrRef = useRef(null);

  // Fetch Rooms & Stats
  useEffect(() => {
    request.get(API_ENDPOINTS.ROOMS.LIST).then((res) => setRooms(res.data || []));
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await request.get(API_ENDPOINTS.FEEDBACKS.STATS);
      if (res.data) setStats(res.data);
    } catch {
      // fallback
    }
  };

  const fetchFeedbacks = async () => {
    setLoading(true);
    try {
      const res = await request.get(API_ENDPOINTS.FEEDBACKS.LIST, {
        page: pagination.page,
        limit: pagination.limit,
        search: debouncedSearch,
        category: selectedCategory === "Semua" ? "" : selectedCategory,
        status: selectedStatus === "Semua" ? "" : selectedStatus,
        room_id: selectedRoom,
      });
      setFeedbacks(res.data || []);
      setPagination(res.pagination || { page: 1, limit: 10, total: 0, totalPages: 1 });
    } catch (err) {
      toast.error("Gagal memuat daftar pengaduan");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeedbacks();
  }, [
    selectedCategory,
    selectedStatus,
    selectedRoom,
    pagination.page,
    pagination.limit,
    debouncedSearch,
  ]);

  const handleOpenDetail = (item) => {
    setDetailItem(item);
    setFollowupStatus(item.status || "Menunggu");
    setAdminResponse(item.admin_response || "");
  };

  const handleSaveFollowup = async (e) => {
    e.preventDefault();
    if (!detailItem) return;
    setSavingResponse(true);
    try {
      await request.put(API_ENDPOINTS.FEEDBACKS.UPDATE(detailItem.id), {
        status: followupStatus,
        admin_response: adminResponse,
      });
      toast.success("Tindak lanjut pengaduan berhasil disimpan");
      setDetailItem(null);
      fetchFeedbacks();
      fetchStats();
    } catch (err) {
      toast.error("Gagal menyimpan tindak lanjut");
    } finally {
      setSavingResponse(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirmItem) return;
    try {
      await request.delete(API_ENDPOINTS.FEEDBACKS.DELETE(deleteConfirmItem.id));
      toast.success("Pengaduan berhasil dihapus");
      setDeleteConfirmItem(null);
      fetchFeedbacks();
      fetchStats();
    } catch (err) {
      toast.error("Gagal menghapus pengaduan");
    }
  };

  const getTargetUrl = () => {
    const base = (barcodeBaseUrl || "").trim().replace(/\/+$/, "");
    let url = `${base}/pengaduan`;
    if (barcodeRoomId) {
      url += `?room_id=${barcodeRoomId}`;
    }
    return url;
  };

  const selectedBarcodeRoom = rooms.find((r) => String(r.id) === String(barcodeRoomId));

  const handlePrintPoster = () => {
    window.print();
  };

  const handleDownloadQrPng = () => {
    const svg = qrRef.current?.querySelector("svg");
    if (!svg) return;
    const roomName = selectedBarcodeRoom
      ? selectedBarcodeRoom.name.replace(/\s+/g, "_")
      : "Umum";
    downloadQRCodeImage(svg, `QR_Pengaduan_SIKELA_${roomName}.png`);
    toast.success("Gambar Barcode QR berhasil diunduh");
  };

  const [downloadingPdf, setDownloadingPdf] = useState(false);

  const handleDownloadPDF = async () => {
    setDownloadingPdf(true);
    try {
      const res = await request.get(API_ENDPOINTS.FEEDBACKS.LIST, {
        all: "true",
        category: selectedCategory === "Semua" ? "" : selectedCategory,
        status: selectedStatus === "Semua" ? "" : selectedStatus,
        room_id: selectedRoom,
      });
      const data = res.data || [];
      if (data.length === 0) {
        toast.error("Tidak ada data pengaduan untuk diunduh");
        return;
      }

      let kopConfig = DEFAULT_KOP_CONFIG;
      try {
        const saved = localStorage.getItem("mfk_kop_config");
        if (saved) kopConfig = { ...DEFAULT_KOP_CONFIG, ...JSON.parse(saved) };
      } catch {}

      await downloadFeedbackReportPDF({
        feedbacks: data,
        periodLabel: new Date().toLocaleDateString("id-ID", { month: "long", year: "numeric" }),
        kopConfig,
        summary: stats,
      });
      toast.success("Laporan PDF Pengaduan berhasil diunduh");
    } catch (err) {
      toast.error("Gagal membuat laporan PDF");
    } finally {
      setDownloadingPdf(false);
    }
  };

  const handleDownloadCSV = async () => {
    try {
      const res = await request.get(API_ENDPOINTS.FEEDBACKS.LIST, {
        all: "true",
        category: selectedCategory === "Semua" ? "" : selectedCategory,
        status: selectedStatus === "Semua" ? "" : selectedStatus,
        room_id: selectedRoom,
      });
      const data = res.data || [];
      if (data.length === 0) {
        toast.error("Tidak ada data pengaduan untuk diunduh");
        return;
      }

      let kopConfig = DEFAULT_KOP_CONFIG;
      try {
        const saved = localStorage.getItem("mfk_kop_config");
        if (saved) kopConfig = { ...DEFAULT_KOP_CONFIG, ...JSON.parse(saved) };
      } catch {}

      const rows = [
        [kopConfig.instansiInduk || "PEMERINTAH KABUPATEN / KOTA"],
        [kopConfig.dinasKesehatan || "DINAS KESEHATAN KABUPATEN / KOTA"],
        [kopConfig.namaPuskesmas || "UPTD PUSKESMAS MUARA KULAM"],
        ["LAPORAN REKAPITULASI SURVEI KEPUASAN & PENGADUAN FASILITAS PENGUNJUNG"],
        [`Waktu Unduh: ${new Date().toLocaleString("id-ID")}`],
        [],
        [
          "No",
          "Nomor Tiket",
          "Tanggal Masuk",
          "Nama Pengunjung",
          "No WhatsApp / Kontak",
          "Lokasi Ruangan",
          "Kategori",
          "Rating Pelayanan (1-5)",
          "Rating Petugas (1-5)",
          "Rating Sarpras (1-5)",
          "Rating Keseluruhan",
          "Uraian Keluhan / Saran",
          "Status",
          "Catatan Tindak Lanjut Petugas",
        ],
        ...data.map((f, idx) => [
          idx + 1,
          f.ticket_number,
          new Date(f.created_at).toLocaleString("id-ID"),
          f.visitor_name || "Anonim",
          f.visitor_phone || "-",
          f.display_room_name || f.room_name || "Puskesmas Umum",
          f.category,
          f.rating_pelayanan || 5,
          f.rating_petugas || 5,
          f.rating_sarpras || 5,
          `${f.overall_rating || 5}.0`,
          f.complaint_text,
          f.status,
          f.admin_response || "-",
        ]),
        [],
        ["LEMBAR PENGESAHAN"],
        [`Ditetapkan di: ${kopConfig.kotaDokumen || "Muara Kulam"}, Tanggal: ${new Date().toLocaleDateString("id-ID")}`],
        [`Mengetahui & Menyetujui: ${kopConfig.pimpinanJabatan} - ${kopConfig.pimpinanNama}`],
        [`Dilaporkan Oleh: ${kopConfig.pelaporJabatan} - ${kopConfig.pelaporNama}`],
      ];

      const csvContent =
        "data:text/csv;charset=utf-8,\uFEFF" +
        rows.map((e) => e.map((c) => `"${String(c || "").replace(/"/g, '""')}"`).join(",")).join("\n");

      const link = document.createElement("a");
      link.setAttribute("href", encodeURI(csvContent));
      link.setAttribute("download", `Laporan_Pengaduan_SIKELA_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("Laporan CSV berhasil diunduh");
    } catch {
      toast.error("Gagal mengunduh file CSV");
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "Selesai":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Selesai
          </span>
        );
      case "Diproses":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200">
            <Clock className="w-3 h-3 text-blue-600" /> Diproses
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
            <AlertCircle className="w-3 h-3 text-amber-600" /> Menunggu
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold text-slate-800 tracking-tight">
              07. Pengaduan & Barcode Pengunjung
            </h2>
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-md">
              Akses Umum
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Monitoring penilaian kepuasan pengunjung, keluhan kebersihan fasilitas, dan pembuatan poster barcode QR code.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            to="/laporan-periodik"
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs sm:text-sm rounded-xl transition shadow-xs"
            title="Buka Halaman Laporan Periodik Bulanan"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Rekap Bulanan di Laporan</span>
          </Link>
          <button
            onClick={handleDownloadCSV}
            className="inline-flex items-center gap-1.5 px-3 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs sm:text-sm rounded-xl transition shadow-xs cursor-pointer"
            title="Unduh Spreadsheet CSV"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>CSV</span>
          </button>
          <button
            onClick={handleDownloadPDF}
            disabled={downloadingPdf}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs sm:text-sm rounded-xl shadow-sm transition cursor-pointer disabled:opacity-50"
            title="Unduh Dokumen PDF Ber-KOP Resmi"
          >
            <Download className="w-4 h-4" />
            <span>{downloadingPdf ? "Memproses..." : "Unduh PDF"}</span>
          </button>
          <button
            onClick={() => setIsBarcodeModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold text-xs sm:text-sm rounded-xl shadow-md shadow-emerald-600/20 transition cursor-pointer"
          >
            <QrCode className="w-4 h-4" />
            <span>Cetak Poster Barcode</span>
          </button>
        </div>
      </div>

      {/* Stat Cards Kepuasan & Pengaduan */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Kualitas Layanan
            </span>
            <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-extrabold text-slate-900">{stats.avgPelayanan}</span>
            <span className="text-xs text-slate-400">/ 5.0</span>
          </div>
          <p className="text-[11px] text-emerald-600 font-medium mt-1">
            Penilaian kecepatan & ketertiban
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Sikap Petugas
            </span>
            <User className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-extrabold text-slate-900">{stats.avgPetugas}</span>
            <span className="text-xs text-slate-400">/ 5.0</span>
          </div>
          <p className="text-[11px] text-emerald-600 font-medium mt-1">
            Keramahan & kesigapan staf
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Sarana & Kebersihan
            </span>
            <Building className="w-4 h-4 text-teal-500" />
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-extrabold text-slate-900">{stats.avgSarpras}</span>
            <span className="text-xs text-slate-400">/ 5.0</span>
          </div>
          <p className="text-[11px] text-teal-600 font-medium mt-1">
            Fasilitas toilet & kebersihan
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 text-white shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Total Pengaduan
            </span>
            <MessageSquare className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-extrabold text-white">{stats.total}</span>
            <span className="text-xs text-slate-400">laporan</span>
          </div>
          <div className="flex items-center gap-2 mt-1 text-[11px]">
            <span className="text-amber-300 font-semibold">{stats.menunggu} menunggu</span>
            <span>•</span>
            <span className="text-emerald-400 font-semibold">{stats.selesai} selesai</span>
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Filter bar */}
        <div className="p-4 sm:p-5 border-b border-slate-100 space-y-3 bg-slate-50/50">
          <div className="flex flex-col md:flex-row gap-2.5 items-stretch md:items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Cari nomor tiket, nama pengunjung, keluhan..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={selectedCategory}
                onChange={(e) => {
                  setSelectedCategory(e.target.value);
                  setPagination((p) => ({ ...p, page: 1 }));
                }}
                className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat === "Semua" ? "Semua Kategori" : cat}
                  </option>
                ))}
              </select>

              <select
                value={selectedStatus}
                onChange={(e) => {
                  setSelectedStatus(e.target.value);
                  setPagination((p) => ({ ...p, page: 1 }));
                }}
                className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {STATUSES.map((st) => (
                  <option key={st} value={st}>
                    {st === "Semua" ? "Semua Status" : st}
                  </option>
                ))}
              </select>

              <select
                value={selectedRoom}
                onChange={(e) => {
                  setSelectedRoom(e.target.value);
                  setPagination((p) => ({ ...p, page: 1 }));
                }}
                className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 max-w-[150px] truncate"
              >
                <option value="">Semua Lokasi</option>
                {rooms.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>

              <button
                onClick={() => {
                  setSelectedCategory("Semua");
                  setSelectedStatus("Semua");
                  setSelectedRoom("");
                  setSearch("");
                }}
                className="p-2 text-slate-500 hover:text-slate-800 bg-white border border-slate-200 rounded-xl text-xs font-medium hover:bg-slate-100 transition"
                title="Reset Filter"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Responsive Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr className="bg-slate-50/90 text-slate-600 text-xs font-semibold uppercase tracking-wider border-b border-slate-200">
                <th className="px-4 py-3.5 w-36 whitespace-nowrap">No. Tiket</th>
                <th className="px-4 py-3.5 w-36 whitespace-nowrap">Waktu</th>
                <th className="px-4 py-3.5 w-44">Pengunjung</th>
                <th className="px-4 py-3.5 w-40">Lokasi / Ruangan</th>
                <th className="px-4 py-3.5 w-36 text-center">Penilaian</th>
                <th className="px-4 py-3.5 min-w-[200px]">Isi Keluhan & Saran</th>
                <th className="px-4 py-3.5 w-28 text-center whitespace-nowrap">Status</th>
                <th className="px-4 py-3.5 w-24 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan="8" className="px-4 py-8 text-center text-slate-400">
                    Memuat daftar pengaduan...
                  </td>
                </tr>
              ) : feedbacks.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-4 py-8 text-center text-slate-400">
                    Belum ada pengaduan atau penilaian pengunjung yang sesuai dengan filter.
                  </td>
                </tr>
              ) : (
                feedbacks.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <span className="font-mono font-bold text-xs text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        {item.ticket_number}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-xs text-slate-500 whitespace-nowrap">
                      {new Date(item.created_at).toLocaleDateString("id-ID", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="font-semibold text-slate-900 text-xs flex items-center gap-1.5">
                        <User className="w-3 h-3 text-slate-400" />
                        <span>{item.visitor_name || "Anonim"}</span>
                      </div>
                      {item.visitor_phone && (
                        <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                          <Phone className="w-2.5 h-2.5" />
                          <span>{item.visitor_phone}</span>
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-xs font-medium text-slate-700">
                      <div className="flex items-center gap-1.5">
                        <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate max-w-[140px]">
                          {item.display_room_name || "Puskesmas Umum"}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <div className="inline-flex items-center gap-1 bg-amber-50 border border-amber-200 text-amber-900 px-2 py-0.5 rounded-lg text-xs font-bold">
                        <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                        <span>{item.overall_rating || 5}.0</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-xs text-slate-700">
                      <p className="font-semibold text-slate-800 line-clamp-1">
                        [{item.category}]
                      </p>
                      <p className="line-clamp-2 text-slate-600 mt-0.5">
                        {item.complaint_text}
                      </p>
                      {item.photo_url && (
                        <span className="inline-flex items-center gap-1 text-[10px] text-emerald-700 font-semibold mt-1">
                          <Camera className="w-3 h-3" /> Ada lampiran foto
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-center whitespace-nowrap">
                      {getStatusBadge(item.status)}
                    </td>
                    <td className="px-4 py-3.5 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleOpenDetail(item)}
                          className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-600 hover:text-white text-emerald-800 text-xs font-semibold rounded-lg border border-emerald-200 transition cursor-pointer"
                          title="Tindak Lanjut & Respon"
                        >
                          Tindak Lanjut
                        </button>
                        <button
                          onClick={() => setDeleteConfirmItem(item)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                          title="Hapus"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-4 border-t border-slate-100">
          <Pagination
            pagination={pagination}
            onPageChange={(page) => setPagination((prev) => ({ ...prev, page }))}
            onLimitChange={(limit) => setPagination((prev) => ({ ...prev, limit, page: 1 }))}
          />
        </div>
      </div>

      {/* Modal Detail & Respon Petugas */}
      <Modal
        isOpen={Boolean(detailItem)}
        onClose={() => setDetailItem(null)}
        title={`Tindak Lanjut Pengaduan: ${detailItem?.ticket_number}`}
      >
        {detailItem && (
          <form onSubmit={handleSaveFollowup} className="space-y-4 text-sm">
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <div>
                  <span className="font-mono font-bold text-xs text-emerald-800">
                    {detailItem.ticket_number}
                  </span>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Pengirim: <b className="text-slate-800">{detailItem.visitor_name || "Anonim"}</b>
                    {detailItem.visitor_phone && ` (${detailItem.visitor_phone})`}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-400">
                    {new Date(detailItem.created_at).toLocaleDateString("id-ID", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                </div>
              </div>

              {/* Rincian 3 Rating Bintang */}
              <div className="grid grid-cols-3 gap-2 text-center pt-1">
                <div className="p-2 bg-white rounded-xl border border-slate-200">
                  <p className="text-[10px] text-slate-500 font-semibold">Pelayanan</p>
                  <p className="text-sm font-bold text-amber-500 flex items-center justify-center gap-1 mt-0.5">
                    <Star className="w-3.5 h-3.5 fill-amber-400" />
                    <span>{detailItem.rating_pelayanan || 5}/5</span>
                  </p>
                </div>
                <div className="p-2 bg-white rounded-xl border border-slate-200">
                  <p className="text-[10px] text-slate-500 font-semibold">Petugas</p>
                  <p className="text-sm font-bold text-emerald-600 flex items-center justify-center gap-1 mt-0.5">
                    <Star className="w-3.5 h-3.5 fill-emerald-400" />
                    <span>{detailItem.rating_petugas || 5}/5</span>
                  </p>
                </div>
                <div className="p-2 bg-white rounded-xl border border-slate-200">
                  <p className="text-[10px] text-slate-500 font-semibold">Sarana/Kebersihan</p>
                  <p className="text-sm font-bold text-teal-600 flex items-center justify-center gap-1 mt-0.5">
                    <Star className="w-3.5 h-3.5 fill-teal-400" />
                    <span>{detailItem.rating_sarpras || 5}/5</span>
                  </p>
                </div>
              </div>

              <div className="pt-1">
                <p className="text-xs text-slate-500 font-semibold">
                  Lokasi / Ruangan: <span className="text-slate-800">{detailItem.display_room_name || "Puskesmas Umum"}</span>
                </p>
                <div className="mt-2 p-3 bg-white rounded-xl border border-slate-200 text-xs text-slate-800">
                  <p className="font-bold text-emerald-800 mb-1">Pesan / Keluhan:</p>
                  <p className="whitespace-pre-wrap">{detailItem.complaint_text}</p>
                </div>
              </div>

              {detailItem.photo_url && (
                <div className="pt-2">
                  <p className="text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                    <Camera className="w-3.5 h-3.5 text-slate-400" />
                    Foto Bukti Kondisi Lapangan:
                  </p>
                  <a
                    href={detailItem.photo_url}
                    target="_blank"
                    rel="noreferrer"
                    className="block relative rounded-xl overflow-hidden border border-slate-300 max-w-xs group"
                  >
                    <img
                      src={detailItem.photo_url}
                      alt="Bukti Pengaduan"
                      className="w-full h-44 object-cover group-hover:scale-105 transition"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-bold transition">
                      <ExternalLink className="w-4 h-4 mr-1" /> Buka Foto Asli
                    </div>
                  </a>
                </div>
              )}
            </div>

            {/* Form Respon & Tindak Lanjut */}
            <div className="space-y-3 pt-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Status Penanganan *
                </label>
                <select
                  value={followupStatus}
                  onChange={(e) => setFollowupStatus(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl p-2.5 text-sm font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  <option value="Menunggu">Menunggu (Belum Ditindaklanjuti)</option>
                  <option value="Diproses">Diproses (Petugas Sedang Menangani)</option>
                  <option value="Selesai">Selesai (Fasilitas Sudah Diperbaiki / Bersih)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Catatan Tindak Lanjut & Respon Petugas
                </label>
                <textarea
                  rows={3}
                  placeholder="Contoh: Petugas kebersihan B telah menguras dan membersihkan wastafel serta kran air sudah diganti kran baru oleh tim utilitas."
                  value={adminResponse}
                  onChange={(e) => setAdminResponse(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDetailItem(null)}
                className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 font-medium"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={savingResponse}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-sm transition disabled:opacity-50 cursor-pointer"
              >
                {savingResponse ? "Menyimpan..." : "Simpan Tindak Lanjut"}
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* Modal Hapus */}
      <Modal
        isOpen={Boolean(deleteConfirmItem)}
        onClose={() => setDeleteConfirmItem(null)}
        title="Konfirmasi Hapus Pengaduan"
      >
        <div className="space-y-4 text-sm">
          <p className="text-slate-600">
            Apakah Anda yakin ingin menghapus tiket pengaduan{" "}
            <b className="text-slate-900">{deleteConfirmItem?.ticket_number}</b> dari{" "}
            <b className="text-slate-900">{deleteConfirmItem?.visitor_name}</b>?
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setDeleteConfirmItem(null)}
              className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleDelete}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-medium shadow-sm"
            >
              Ya, Hapus
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal Poster Barcode QR Code Siap Cetak (A4) */}
      <Modal
        isOpen={isBarcodeModalOpen}
        onClose={() => setIsBarcodeModalOpen(false)}
        title="Poster Barcode Survei & Pengaduan Fasilitas (Standar Akreditasi)"
      >
        <div className="space-y-4 text-sm">
          {/* Setting Target Barcode */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Target Tempel Barcode:
                </label>
                <select
                  value={barcodeRoomId}
                  onChange={(e) => setBarcodeRoomId(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl p-2 text-xs font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white"
                >
                  <option value="">Barcode Umum (Seluruh Puskesmas)</option>
                  {rooms.map((r) => (
                    <option key={r.id} value={r.id}>
                      Ruangan: {r.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Domain / URL Publik Aplikasi:
                </label>
                <input
                  type="text"
                  value={barcodeBaseUrl}
                  onChange={(e) => setBarcodeBaseUrl(e.target.value)}
                  placeholder="https://sikela-puskesmas.vercel.app"
                  className="w-full border border-slate-300 rounded-xl p-2 text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white"
                />
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="text-[10px] text-slate-400 font-semibold">Preset Cepat:</span>
                  <button
                    type="button"
                    onClick={() => setBarcodeBaseUrl(window.location.origin)}
                    className="text-[10px] px-2 py-0.5 rounded-md bg-slate-200/80 hover:bg-slate-300 text-slate-700 font-medium transition cursor-pointer"
                  >
                    Domain Saat Ini
                  </button>
                  <button
                    type="button"
                    onClick={() => setBarcodeBaseUrl("https://sikela-puskesmas.vercel.app")}
                    className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-100 hover:bg-emerald-200 text-emerald-800 font-semibold transition cursor-pointer"
                  >
                    Vercel Produksi
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-200">
              <span className="truncate max-w-md font-mono text-emerald-800">
                URL Scan: <b>{getTargetUrl()}</b>
              </span>
              <a
                href={getTargetUrl()}
                target="_blank"
                rel="noreferrer"
                className="text-emerald-600 hover:text-emerald-700 font-semibold inline-flex items-center gap-1 shrink-0"
              >
                <span>Uji Buka Form</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          {/* PREVIEW POSTER SIAP CETAK (A4 STANDAR PUSKESMAS) */}
          <div
            id="print-poster-area"
            ref={qrRef}
            className="p-6 bg-white border-2 border-emerald-600 rounded-3xl text-center space-y-4 shadow-sm relative overflow-hidden"
          >
            {/* Kop Puskesmas Poster */}
            <div className="flex items-center justify-center gap-3 border-b-2 border-emerald-600 pb-3">
              <div className="w-12 h-12 rounded-xl border border-slate-200 p-1 flex items-center justify-center">
                <img src={defaultLogo} alt="Logo" className="w-full h-full object-contain" />
              </div>
              <div className="text-left">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                  UPTD PUSKESMAS MUARA KULAM
                </h3>
                <h2 className="text-base font-black text-slate-900 tracking-tight">
                  SURVEI KEPUASAN & PENGADUAN FASILITAS
                </h2>
                <p className="text-[10px] text-emerald-700 font-bold">
                  Standar Manajemen Fasilitas & Keselamatan (MFK)
                </p>
              </div>
            </div>

            {selectedBarcodeRoom && (
              <div className="inline-block px-3 py-1 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-full text-xs font-bold">
                Lokasi: {selectedBarcodeRoom.name}
              </div>
            )}

            {/* QR Code SVG */}
            <div className="flex flex-col items-center justify-center py-2">
              <div className="p-3 bg-white border-2 border-slate-900 rounded-2xl shadow-sm inline-block">
                <QRCodeSVG
                  value={getTargetUrl()}
                  size={220}
                  level="H"
                  includeMargin={true}
                  fgColor="#0f172a"
                  bgColor="#ffffff"
                />
              </div>
              <p className="text-xs font-extrabold text-slate-900 mt-2 tracking-wide uppercase">
                SCAN BARCODE DI ATAS
              </p>
              <p className="text-[11px] text-slate-500 max-w-xs mt-0.5">
                Gunakan kamera smartphone Anda untuk memberikan penilaian pelayanan atau melaporkan keluhan kebersihan & fasilitas yang kurang layak.
              </p>
            </div>

            {/* 3 Aspek Masukan */}
            <div className="grid grid-cols-3 gap-2 text-center border-t border-slate-200 pt-3 text-[11px]">
              <div className="p-1.5 bg-slate-50 rounded-lg">
                <p className="font-bold text-slate-800">1. Pelayanan</p>
                <p className="text-[10px] text-slate-500">Ketertiban layanan</p>
              </div>
              <div className="p-1.5 bg-slate-50 rounded-lg">
                <p className="font-bold text-slate-800">2. Petugas</p>
                <p className="text-[10px] text-slate-500">Keramahan staf</p>
              </div>
              <div className="p-1.5 bg-slate-50 rounded-lg">
                <p className="font-bold text-slate-800">3. Sarana</p>
                <p className="text-[10px] text-slate-500">Kebersihan toilet & poli</p>
              </div>
            </div>

            <p className="text-[10px] text-slate-400">
              SIKELA • Sistem Informasi Kelola Fasilitas & Keselamatan Puskesmas
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={handleDownloadQrPng}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold rounded-xl text-xs transition cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Unduh Gambar QR (PNG)</span>
            </button>
            <button
              type="button"
              onClick={handlePrintPoster}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-md transition cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak Poster (Print)</span>
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

