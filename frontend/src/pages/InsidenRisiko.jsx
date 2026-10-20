import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
import {
  Plus,
  Search,
  AlertTriangle,
  ShieldAlert,
  Calendar,
  MapPin,
  User,
  Info,
  CheckCircle2,
  Clock,
  HelpCircle,
} from "lucide-react";
import { request } from "../utils/request";
import { API_ENDPOINTS } from "../utils/endpoints";
import { useDebounce } from "../hooks/useDebounce";
import Pagination from "../components/Common/Pagination";
import Modal from "../components/Common/Modal";

const INCIDENT_CATEGORIES = [
  "Insiden Keselamatan Pasien dan Pengunjung",
  "Insiden Keselamatan Fasilitas",
  "Kejadian Kebakaran atau Keadaan Darurat",
  "Insiden Keselamatan dan Kesehatan Kerja (K3)",
];

const RISK_GRADINGS = [
  { value: "Rendah (Biru)", label: "Rendah (Biru)", bg: "bg-blue-50 text-blue-700 border-blue-200" },
  { value: "Sedang (Hijau)", label: "Sedang (Hijau)", bg: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  { value: "Tinggi (Kuning)", label: "Tinggi (Kuning)", bg: "bg-amber-50 text-amber-700 border-amber-200" },
  { value: "Ekstrem (Merah)", label: "Ekstrem (Merah)", bg: "bg-rose-50 text-rose-700 border-rose-200" },
];

export default function InsidenRisiko() {
  const [incidents, setIncidents] = useState([]);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [detailItem, setDetailItem] = useState(null);

  const initialForm = {
    incident_datetime: new Date().toISOString().slice(0, 16),
    location: "",
    category: INCIDENT_CATEGORIES[0],
    chronology: "",
    affected_party: "",
    actual_impact: "",
    potential_impact: "",
    initial_action: "",
    risk_grading: "Sedang (Hijau)",
    reporter_name: "",
    handler_pic: "Tim K3 & MFK",
    investigation_result: "",
    corrective_action: "",
    status: "Investigasi",
  };
  const [form, setForm] = useState(initialForm);

  const fetchIncidents = async () => {
    setLoading(true);
    try {
      const res = await request.get(API_ENDPOINTS.INCIDENTS.LIST, {
        page: pagination.page,
        limit: pagination.limit,
        search: debouncedSearch,
      });
      setIncidents(res.data || []);
      setPagination(res.pagination || { page: 1, limit: 10, total: 0, totalPages: 1 });
    } catch (err) {
      toast.error("Gagal memuat laporan insiden");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncidents();
  }, [pagination.page, pagination.limit, debouncedSearch]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await request.post(API_ENDPOINTS.INCIDENTS.CREATE, form);
      toast.success(`Laporan insiden berhasil dibuat (#${res.report_number})`);
      setIsModalOpen(false);
      setForm(initialForm);
      fetchIncidents();
    } catch (err) {
      toast.error(err.response?.data?.message || "Gagal menyimpan laporan insiden");
    }
  };

  const getRiskBadge = (risk) => {
    const item = RISK_GRADINGS.find((r) => r.value === risk) || {
      label: risk,
      bg: "bg-slate-100 text-slate-700 border-slate-200",
    };
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${item.bg}`}>
        <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
        {item.label}
      </span>
    );
  };

  const getStatusBadge = (status) => {
    if (status === "Selesai") {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
          <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Selesai
        </span>
      );
    }
    if (status === "Tindak Lanjut") {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          <Clock className="w-3 h-3 text-blue-600" /> Tindak Lanjut
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
        <HelpCircle className="w-3 h-3 text-amber-600" /> Investigasi
      </span>
    );
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
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">04. Pelaporan Insiden & Risiko</h2>
          <p className="text-sm text-slate-500 mt-1">
            Manajemen insiden keselamatan pasien, pengunjung, staf K3, dan kecelakaan fasilitas Puskesmas.
          </p>
        </div>
        <button
          onClick={() => {
            setForm(initialForm);
            setIsModalOpen(true);
          }}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-medium text-sm rounded-xl shadow-md shadow-rose-600/20 transition cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Lapor Insiden Baru</span>
        </button>
      </div>

      {/* Table Container */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Search header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between bg-slate-50/50">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Cari nomor insiden, lokasi, pelapor, kronologi..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
          </div>
          <div className="text-xs text-slate-500">
            Total Insiden: <b>{pagination.total}</b> kasus
          </div>
        </div>

        {/* Responsive Table with clear column widths */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[860px]">
            <thead>
              <tr className="bg-slate-50/90 text-slate-600 text-xs font-semibold uppercase tracking-wider border-b border-slate-200">
                <th className="px-4 py-3.5 w-44 whitespace-nowrap">No Laporan & Waktu</th>
                <th className="px-4 py-3.5 w-60">Kategori & Lokasi</th>
                <th className="px-4 py-3.5 w-44">Pihak & Pelapor</th>
                <th className="px-4 py-3.5 w-36 whitespace-nowrap">Grading Risiko</th>
                <th className="px-4 py-3.5 min-w-[200px]">Kronologi & Tindakan</th>
                <th className="px-4 py-3.5 w-32 text-center whitespace-nowrap">Status</th>
                <th className="px-4 py-3.5 w-16 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan="7" className="px-4 py-8 text-center text-slate-400">
                    Memuat data insiden...
                  </td>
                </tr>
              ) : incidents.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-4 py-8 text-center text-slate-400">
                    Tidak ada laporan insiden yang tercatat.
                  </td>
                </tr>
              ) : (
                incidents.map((inc) => (
                  <tr key={inc.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3.5">
                      <div className="font-bold text-rose-600 font-mono text-xs">{inc.report_number}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">{formatDate(inc.incident_datetime)}</div>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="font-semibold text-slate-800 text-xs">{inc.category}</div>
                      <div className="flex items-center gap-1 text-xs text-slate-500 mt-1">
                        <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="truncate">{inc.location}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-xs">
                      <div className="text-slate-800 font-medium">Terdampak: {inc.affected_party}</div>
                      <div className="text-slate-400 mt-0.5">Pelapor: {inc.reporter_name}</div>
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      {getRiskBadge(inc.risk_grading)}
                    </td>
                    <td className="px-4 py-3.5 text-xs">
                      <div className="text-slate-700 font-medium line-clamp-2">{inc.chronology}</div>
                      {inc.initial_action && (
                        <div className="text-emerald-700 text-[11px] mt-1 font-medium">
                          Aksi Awal: {inc.initial_action}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-center whitespace-nowrap">
                      {getStatusBadge(inc.status)}
                    </td>
                    <td className="px-4 py-3.5 text-center whitespace-nowrap">
                      <button
                        onClick={() => setDetailItem(inc)}
                        className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                        title="Lihat Detail Insiden"
                      >
                        <Info className="w-4 h-4" />
                      </button>
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

      {/* Modal Input Insiden */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Formulir Laporan Insiden Keselamatan (K3 & MFK)"
      >
        <form onSubmit={handleSubmit} className="space-y-4 text-sm max-h-[75vh] overflow-y-auto pr-1">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Kategori Insiden *
            </label>
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="w-full border border-slate-300 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-rose-500 focus:outline-none"
            >
              {INCIDENT_CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Waktu Kejadian *
              </label>
              <input
                type="datetime-local"
                required
                value={form.incident_datetime}
                onChange={(e) => setForm({ ...form, incident_datetime: e.target.value })}
                className="w-full border border-slate-300 rounded-xl p-2.5 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Lokasi Kejadian *
              </label>
              <input
                type="text"
                required
                placeholder="Contoh: Koridor Toilet LT. I"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                className="w-full border border-slate-300 rounded-xl p-2.5 text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Pihak yang Terdampak *
              </label>
              <input
                type="text"
                required
                placeholder="Pasien Lansia / Petugas / Pengunjung"
                value={form.affected_party}
                onChange={(e) => setForm({ ...form, affected_party: e.target.value })}
                className="w-full border border-slate-300 rounded-xl p-2.5 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Grading Risiko *
              </label>
              <select
                value={form.risk_grading}
                onChange={(e) => setForm({ ...form, risk_grading: e.target.value })}
                className="w-full border border-slate-300 rounded-xl p-2.5 text-sm"
              >
                {RISK_GRADINGS.map((r) => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Kronologi Rinci Kejadian *
            </label>
            <textarea
              required
              rows="3"
              placeholder="Ceritakan urutan peristiwa secara faktual..."
              value={form.chronology}
              onChange={(e) => setForm({ ...form, chronology: e.target.value })}
              className="w-full border border-slate-300 rounded-xl p-2.5 text-sm"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Dampak Aktual
              </label>
              <input
                type="text"
                placeholder="Contoh: Tergores ringan / Near Miss"
                value={form.actual_impact}
                onChange={(e) => setForm({ ...form, actual_impact: e.target.value })}
                className="w-full border border-slate-300 rounded-xl p-2.5 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Potensi Dampak Lanjutan
              </label>
              <input
                type="text"
                placeholder="Contoh: Cedera fisik bila terulang"
                value={form.potential_impact}
                onChange={(e) => setForm({ ...form, potential_impact: e.target.value })}
                className="w-full border border-slate-300 rounded-xl p-2.5 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Tindakan Awal yang Sudah Diambil *
            </label>
            <textarea
              required
              rows="2"
              placeholder="Pertolongan pertama, pembersihan, isolasi area..."
              value={form.initial_action}
              onChange={(e) => setForm({ ...form, initial_action: e.target.value })}
              className="w-full border border-slate-300 rounded-xl p-2.5 text-sm"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Nama Pelapor *
              </label>
              <input
                type="text"
                required
                placeholder="Nama Anda / Staf"
                value={form.reporter_name}
                onChange={(e) => setForm({ ...form, reporter_name: e.target.value })}
                className="w-full border border-slate-300 rounded-xl p-2.5 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                PIC Penangan / Investigasi
              </label>
              <input
                type="text"
                placeholder="Tim K3 & MFK Puskesmas"
                value={form.handler_pic}
                onChange={(e) => setForm({ ...form, handler_pic: e.target.value })}
                className="w-full border border-slate-300 rounded-xl p-2.5 text-sm"
              />
            </div>
          </div>

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
              className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-medium rounded-xl shadow-sm transition"
            >
              Kirim Laporan Insiden
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Detail Insiden */}
      <Modal
        isOpen={Boolean(detailItem)}
        onClose={() => setDetailItem(null)}
        title={`Detail Insiden: ${detailItem?.report_number}`}
      >
        {detailItem && (
          <div className="space-y-4 text-sm max-h-[75vh] overflow-y-auto pr-1">
            <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div>
                <p className="text-xs text-slate-400">Nomor Registrasi</p>
                <p className="font-bold text-rose-600 font-mono">{detailItem.report_number}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Waktu Kejadian</p>
                <p className="font-semibold text-slate-800">{formatDate(detailItem.incident_datetime)}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Lokasi / Ruangan</p>
                <p className="font-semibold text-slate-800">{detailItem.location}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Grading Risiko</p>
                <div className="mt-0.5">{getRiskBadge(detailItem.risk_grading)}</div>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Kronologi Kejadian
              </p>
              <div className="p-3 bg-white rounded-xl border border-slate-200 text-slate-800 text-xs leading-relaxed">
                {detailItem.chronology}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  Dampak Aktual
                </p>
                <p className="text-xs text-slate-800">{detailItem.actual_impact || "-"}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  Potensi Bahaya
                </p>
                <p className="text-xs text-slate-800">{detailItem.potential_impact || "-"}</p>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Tindakan Awal & Koreksi
              </p>
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-900 text-xs">
                <p><b>Pengamanan Awal: </b>{detailItem.initial_action}</p>
                {detailItem.corrective_action && (
                  <p className="mt-1"><b>Tindakan Korektif: </b>{detailItem.corrective_action}</p>
                )}
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setDetailItem(null)}
                className="px-4 py-2 bg-slate-800 text-white rounded-xl text-sm font-medium hover:bg-slate-700 transition"
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
