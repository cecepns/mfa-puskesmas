import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
import {
  Building2,
  Plus,
  Search,
  Pencil,
  Trash2,
  Layers,
  User,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Package,
  Wrench,
  CheckSquare,
  Sparkles,
  RefreshCw,
} from "lucide-react";
import { request } from "../utils/request";
import { API_ENDPOINTS } from "../utils/endpoints";
import { useDebounce } from "../hooks/useDebounce";
import Pagination from "../components/Common/Pagination";
import Modal from "../components/Common/Modal";

const CATEGORY_OPTIONS = [
  { value: "Klaster_Ruangan", label: "Klaster Ruangan Pelayanan", color: "bg-blue-50 text-blue-700 border-blue-200" },
  { value: "Sanitasi_Toilet", label: "Sanitasi & Toilet", color: "bg-teal-50 text-teal-700 border-teal-200" },
  { value: "Area_Umum", label: "Area Umum & Penunjang", color: "bg-amber-50 text-amber-700 border-amber-200" },
];

export default function MasterRuangan() {
  const [rooms, setRooms] = useState([]);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const [selectedCategory, setSelectedCategory] = useState("Semua");
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(false);

  // Summary counts
  const [stats, setStats] = useState({ total: 0, klaster: 0, sanitasi: 0, umum: 0 });

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);
  const [deleteConfirmRoom, setDeleteConfirmRoom] = useState(null);

  const initialForm = {
    name: "",
    category: "Klaster_Ruangan",
    pic_name: "",
    condition_status: "Baik",
  };
  const [form, setForm] = useState(initialForm);

  const fetchRooms = async () => {
    setLoading(true);
    try {
      const res = await request.get(API_ENDPOINTS.ROOMS.LIST, {
        page: pagination.page,
        limit: pagination.limit,
        search: debouncedSearch,
        category: selectedCategory === "Semua" ? "" : selectedCategory,
      });

      setRooms(res.data || []);
      setPagination(res.pagination || { page: 1, limit: 10, total: 0, totalPages: 1 });
    } catch (err) {
      toast.error("Gagal memuat data ruangan");
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await request.get(API_ENDPOINTS.ROOMS.LIST);
      const all = res.data || [];
      setStats({
        total: all.length,
        klaster: all.filter((r) => r.category === "Klaster_Ruangan").length,
        sanitasi: all.filter((r) => r.category === "Sanitasi_Toilet").length,
        umum: all.filter((r) => r.category === "Area_Umum").length,
      });
    } catch {
      // fallback
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    fetchRooms();
  }, [selectedCategory, pagination.page, pagination.limit, debouncedSearch]);

  const handleOpenCreate = () => {
    setEditingRoom(null);
    setForm(initialForm);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (room) => {
    setEditingRoom(room);
    setForm({
      name: room.name,
      category: room.category,
      pic_name: room.pic_name || "",
      condition_status: room.condition_status || "Baik",
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    try {
      if (editingRoom) {
        await request.put(API_ENDPOINTS.ROOMS.UPDATE(editingRoom.id), form);
        toast.success("Data ruangan berhasil diperbarui");
      } else {
        await request.post(API_ENDPOINTS.ROOMS.CREATE, form);
        toast.success("Ruangan baru berhasil ditambahkan");
      }
      setIsModalOpen(false);
      fetchRooms();
      fetchStats();
    } catch (err) {
      toast.error(err.response?.data?.message || "Gagal menyimpan ruangan");
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirmRoom) return;
    try {
      await request.delete(API_ENDPOINTS.ROOMS.DELETE(deleteConfirmRoom.id));
      toast.success("Ruangan berhasil dihapus");
      setDeleteConfirmRoom(null);
      fetchRooms();
      fetchStats();
    } catch (err) {
      toast.error(err.response?.data?.message || "Gagal menghapus ruangan");
    }
  };

  const getCategoryBadge = (cat) => {
    const item = CATEGORY_OPTIONS.find((c) => c.value === cat) || {
      label: cat?.replace("_", " "),
      color: "bg-slate-100 text-slate-700 border-slate-200",
    };
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${item.color}`}>
        {item.label}
      </span>
    );
  };

  const getConditionBadge = (status) => {
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
        <XCircle className="w-3.5 h-3.5 text-rose-600" /> Rusak Berat
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Master Data Ruangan & Klaster</h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
              Fasilitas Puskesmas
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Kelola master data klaster pelayanan, toilet sanitasi, dan area umum untuk penugasan PJ dan inventarisasi.
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-sm rounded-xl shadow-md shadow-emerald-600/20 transition cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Ruangan Baru</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <div
          onClick={() => { setSelectedCategory("Semua"); setPagination((p) => ({ ...p, page: 1 })); }}
          className={`p-4 rounded-2xl border transition cursor-pointer ${
            selectedCategory === "Semua" ? "bg-slate-900 text-white border-slate-900 shadow-md" : "bg-white border-slate-200 hover:border-slate-300"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-xs font-semibold uppercase tracking-wider ${selectedCategory === "Semua" ? "text-slate-300" : "text-slate-500"}`}>
              Total Ruangan
            </span>
            <Building2 className={`w-4 h-4 ${selectedCategory === "Semua" ? "text-emerald-400" : "text-slate-400"}`} />
          </div>
          <p className="text-2xl font-bold mt-2">{stats.total}</p>
          <p className={`text-[11px] mt-0.5 ${selectedCategory === "Semua" ? "text-slate-400" : "text-slate-400"}`}>
            Seluruh area tercatat
          </p>
        </div>

        <div
          onClick={() => { setSelectedCategory("Klaster_Ruangan"); setPagination((p) => ({ ...p, page: 1 })); }}
          className={`p-4 rounded-2xl border transition cursor-pointer ${
            selectedCategory === "Klaster_Ruangan" ? "bg-blue-600 text-white border-blue-600 shadow-md" : "bg-white border-slate-200 hover:border-slate-300"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-xs font-semibold uppercase tracking-wider ${selectedCategory === "Klaster_Ruangan" ? "text-blue-100" : "text-slate-500"}`}>
              Klaster Pelayanan
            </span>
            <Layers className={`w-4 h-4 ${selectedCategory === "Klaster_Ruangan" ? "text-white" : "text-blue-500"}`} />
          </div>
          <p className="text-2xl font-bold mt-2">{stats.klaster}</p>
          <p className={`text-[11px] mt-0.5 ${selectedCategory === "Klaster_Ruangan" ? "text-blue-100" : "text-slate-400"}`}>
            UGD, Poli, KIA, Ranap, dll
          </p>
        </div>

        <div
          onClick={() => { setSelectedCategory("Sanitasi_Toilet"); setPagination((p) => ({ ...p, page: 1 })); }}
          className={`p-4 rounded-2xl border transition cursor-pointer ${
            selectedCategory === "Sanitasi_Toilet" ? "bg-teal-600 text-white border-teal-600 shadow-md" : "bg-white border-slate-200 hover:border-slate-300"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-xs font-semibold uppercase tracking-wider ${selectedCategory === "Sanitasi_Toilet" ? "text-teal-100" : "text-slate-500"}`}>
              Sanitasi & Toilet
            </span>
            <Sparkles className={`w-4 h-4 ${selectedCategory === "Sanitasi_Toilet" ? "text-white" : "text-teal-500"}`} />
          </div>
          <p className="text-2xl font-bold mt-2">{stats.sanitasi}</p>
          <p className={`text-[11px] mt-0.5 ${selectedCategory === "Sanitasi_Toilet" ? "text-teal-100" : "text-slate-400"}`}>
            Toilet LT. I, II, Ranap, dll
          </p>
        </div>

        <div
          onClick={() => { setSelectedCategory("Area_Umum"); setPagination((p) => ({ ...p, page: 1 })); }}
          className={`p-4 rounded-2xl border transition cursor-pointer ${
            selectedCategory === "Area_Umum" ? "bg-amber-600 text-white border-amber-600 shadow-md" : "bg-white border-slate-200 hover:border-slate-300"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-xs font-semibold uppercase tracking-wider ${selectedCategory === "Area_Umum" ? "text-amber-100" : "text-slate-500"}`}>
              Area Umum
            </span>
            <Building2 className={`w-4 h-4 ${selectedCategory === "Area_Umum" ? "text-white" : "text-amber-500"}`} />
          </div>
          <p className="text-2xl font-bold mt-2">{stats.umum}</p>
          <p className={`text-[11px] mt-0.5 ${selectedCategory === "Area_Umum" ? "text-amber-100" : "text-slate-400"}`}>
            Parkir, koridor, TPS B3
          </p>
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Search & Filter Bar */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between bg-slate-50/50">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Cari nama ruangan atau penanggung jawab..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setPagination((p) => ({ ...p, page: 1 }));
              }}
              className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="Semua">Semua Kategori Area</option>
              {CATEGORY_OPTIONS.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>

            <button
              onClick={() => {
                setSelectedCategory("Semua");
                setSearch("");
              }}
              className="p-2 text-slate-500 hover:text-slate-800 bg-white border border-slate-200 rounded-xl text-xs font-medium hover:bg-slate-100 transition"
              title="Reset Filter"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Responsive Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[760px]">
            <thead>
              <tr className="bg-slate-50/90 text-slate-600 text-xs font-semibold uppercase tracking-wider border-b border-slate-200">
                <th className="px-5 py-3.5 w-16 text-center">No</th>
                <th className="px-5 py-3.5 w-1/3">
                  <div className="flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-slate-400" />
                    <span>Nama Ruangan / Klaster</span>
                  </div>
                </th>
                <th className="px-5 py-3.5 w-1/4">Kategori Area</th>
                <th className="px-5 py-3.5 w-1/4">
                  <div className="flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span>Penanggung Jawab (PJ)</span>
                  </div>
                </th>
                <th className="px-5 py-3.5 w-36 text-center whitespace-nowrap">Status Kondisi</th>
                <th className="px-5 py-3.5 w-24 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-5 py-8 text-center text-slate-400">
                    Memuat data ruangan...
                  </td>
                </tr>
              ) : rooms.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-5 py-8 text-center text-slate-400">
                    Tidak ada ruangan yang sesuai filter.
                  </td>
                </tr>
              ) : (
                rooms.map((room, idx) => (
                  <tr key={room.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-5 py-4 text-center text-xs text-slate-400 font-medium">
                      {(pagination.page - 1) * pagination.limit + idx + 1}
                    </td>
                    <td className="px-5 py-4">
                      <div className="font-semibold text-slate-900">{room.name}</div>
                      <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-400">
                        <span className="flex items-center gap-1">
                          <Package className="w-3 h-3 text-slate-400" />
                          {room.total_inventaris || 0} Aset
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <CheckSquare className="w-3 h-3 text-slate-400" />
                          {room.total_inspeksi || 0} Inspeksi
                        </span>
                        {room.total_kerusakan > 0 && (
                          <>
                            <span>•</span>
                            <span className="flex items-center gap-1 text-amber-600 font-medium">
                              <Wrench className="w-3 h-3 text-amber-500" />
                              {room.total_kerusakan} Rusak
                            </span>
                          </>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      {getCategoryBadge(room.category)}
                    </td>
                    <td className="px-5 py-4 font-medium text-slate-700 text-xs">
                      {room.pic_name || "PJ Ruangan"}
                    </td>
                    <td className="px-5 py-4 text-center whitespace-nowrap">
                      {getConditionBadge(room.condition_status)}
                    </td>
                    <td className="px-5 py-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleOpenEdit(room)}
                          className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition cursor-pointer"
                          title="Edit Ruangan"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirmRoom(room)}
                          className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                          title="Hapus Ruangan"
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

      {/* Modal Tambah / Edit Ruangan */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingRoom ? `Edit Ruangan: ${editingRoom.name}` : "Tambah Ruangan / Klaster Baru"}
      >
        <form onSubmit={handleSubmit} className="space-y-4 text-sm">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Nama Ruangan / Fasilitas *
            </label>
            <input
              type="text"
              required
              placeholder="Contoh: Klaster II Ibu dan Anak / Toilet LT. I"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full border border-slate-300 rounded-xl px-3.5 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Kategori Area / Klaster *
            </label>
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="w-full border border-slate-300 rounded-xl px-3.5 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            >
              {CATEGORY_OPTIONS.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Penanggung Jawab (PJ Ruangan)
            </label>
            <input
              type="text"
              placeholder="Contoh: Bidan Rina / Petugas Kebersihan B"
              value={form.pic_name}
              onChange={(e) => setForm({ ...form, pic_name: e.target.value })}
              className="w-full border border-slate-300 rounded-xl px-3.5 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Status Kondisi Fisik
            </label>
            <select
              value={form.condition_status}
              onChange={(e) => setForm({ ...form, condition_status: e.target.value })}
              className="w-full border border-slate-300 rounded-xl px-3.5 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            >
              <option value="Baik">Baik (Laik Fungsi)</option>
              <option value="Perlu Perbaikan">Perlu Perbaikan</option>
              <option value="Rusak Berat">Rusak Berat</option>
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 font-medium cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl shadow-sm transition cursor-pointer"
            >
              {editingRoom ? "Simpan Perubahan" : "Tambah Ruangan"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Confirmation Modal Hapus */}
      <Modal
        isOpen={Boolean(deleteConfirmRoom)}
        onClose={() => setDeleteConfirmRoom(null)}
        title="Konfirmasi Hapus Ruangan"
      >
        <div className="space-y-4 text-sm">
          <p className="text-slate-600">
            Apakah Anda yakin ingin menghapus ruangan <b className="text-slate-900">{deleteConfirmRoom?.name}</b>?
          </p>
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700">
            Peringatan: Seluruh data inventarisasi dan riwayat inspeksi yang terhubung ke ruangan ini juga akan ikut terhapus secara permanen.
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setDeleteConfirmRoom(null)}
              className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 cursor-pointer"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleDelete}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-medium shadow-sm cursor-pointer"
            >
              Ya, Hapus Ruangan
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
