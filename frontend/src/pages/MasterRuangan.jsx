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
  AlertTriangle,
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
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const [selectedCategory, setSelectedCategory] = useState("Semua");
  const [selectedCondition, setSelectedCondition] = useState("Semua");
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(false);

  // Summary counts
  const [stats, setStats] = useState({ total: 0, klaster: 0, sanitasi: 0, umum: 0, perbaikan: 0 });

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);
  const [deleteConfirmRoom, setDeleteConfirmRoom] = useState(null);

  const initialForm = {
    name: "",
    category: "Klaster_Ruangan",
    pic_name: "",
    pic_user_id: "",
    condition_status: "Baik",
    damage_description: "",
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
        condition: selectedCondition === "Semua" ? "" : selectedCondition,
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
        perbaikan: all.filter((r) => r.condition_status !== "Baik").length,
      });
    } catch {
      // fallback
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await request.get(API_ENDPOINTS.USERS.LIST, { all: "true", limit: 100 });
      setUsers(res.data || []);
    } catch {
      // fallback
    }
  };

  useEffect(() => {
    fetchStats();
    fetchUsers();
  }, []);

  useEffect(() => {
    fetchRooms();
  }, [selectedCategory, selectedCondition, pagination.page, pagination.limit, debouncedSearch]);

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
      pic_user_id: room.pic_user_id || "",
      condition_status: room.condition_status || "Baik",
      damage_description: room.damage_description || "",
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;

    // Validasi: Jika status Perlu Perbaikan atau Rusak Berat, wajib isi uraian kerusakan
    if (form.condition_status !== "Baik" && !form.damage_description?.trim()) {
      toast.error("Wajib mengisi uraian kerusakan untuk ruangan dengan status perlu perbaikan/rusak!");
      return;
    }

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
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Baik
        </span>
      );
    }
    if (status === "Perlu Perbaikan") {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-300 shadow-2xs">
          <AlertCircle className="w-3.5 h-3.5 text-amber-600" /> Perlu Perbaikan
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-300 shadow-2xs">
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
            Kelola data ruangan, penanggung jawab (PJ), dan pemantauan kondisi fasilitas.
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs sm:text-sm rounded-xl shadow-md shadow-emerald-600/20 transition cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Ruangan Baru</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <div
          onClick={() => { setSelectedCategory("Semua"); setSelectedCondition("Semua"); setPagination((p) => ({ ...p, page: 1 })); }}
          className={`p-3.5 sm:p-4 rounded-2xl border transition cursor-pointer flex flex-col justify-between h-full ${
            selectedCategory === "Semua" && selectedCondition === "Semua"
              ? "bg-slate-900 text-white border-slate-900 shadow-md"
              : "bg-white border-slate-200 hover:border-slate-300"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-[11px] font-bold uppercase tracking-wider truncate ${selectedCategory === "Semua" && selectedCondition === "Semua" ? "text-slate-300" : "text-slate-500"}`}>
              Total Ruangan
            </span>
            <Building2 className={`w-4 h-4 shrink-0 ${selectedCategory === "Semua" && selectedCondition === "Semua" ? "text-emerald-400" : "text-slate-400"}`} />
          </div>
          <p className="text-2xl font-black my-1">{stats.total}</p>
          <p className={`text-[11px] truncate ${selectedCategory === "Semua" && selectedCondition === "Semua" ? "text-slate-400" : "text-slate-400"}`}>
            Seluruh area
          </p>
        </div>

        <div
          onClick={() => { setSelectedCategory("Klaster_Ruangan"); setSelectedCondition("Semua"); setPagination((p) => ({ ...p, page: 1 })); }}
          className={`p-3.5 sm:p-4 rounded-2xl border transition cursor-pointer flex flex-col justify-between h-full ${
            selectedCategory === "Klaster_Ruangan" ? "bg-blue-600 text-white border-blue-600 shadow-md" : "bg-white border-slate-200 hover:border-slate-300"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-[11px] font-bold uppercase tracking-wider truncate ${selectedCategory === "Klaster_Ruangan" ? "text-blue-100" : "text-slate-500"}`}>
              Klaster Pelayanan
            </span>
            <Layers className={`w-4 h-4 shrink-0 ${selectedCategory === "Klaster_Ruangan" ? "text-white" : "text-blue-500"}`} />
          </div>
          <p className="text-2xl font-black my-1">{stats.klaster}</p>
          <p className={`text-[11px] truncate ${selectedCategory === "Klaster_Ruangan" ? "text-blue-100" : "text-slate-400"}`}>
            UGD, Poli, KIA, Ranap
          </p>
        </div>

        <div
          onClick={() => { setSelectedCategory("Sanitasi_Toilet"); setSelectedCondition("Semua"); setPagination((p) => ({ ...p, page: 1 })); }}
          className={`p-3.5 sm:p-4 rounded-2xl border transition cursor-pointer flex flex-col justify-between h-full ${
            selectedCategory === "Sanitasi_Toilet" ? "bg-teal-600 text-white border-teal-600 shadow-md" : "bg-white border-slate-200 hover:border-slate-300"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-[11px] font-bold uppercase tracking-wider truncate ${selectedCategory === "Sanitasi_Toilet" ? "text-teal-100" : "text-slate-500"}`}>
              Sanitasi & Toilet
            </span>
            <Sparkles className={`w-4 h-4 shrink-0 ${selectedCategory === "Sanitasi_Toilet" ? "text-white" : "text-teal-500"}`} />
          </div>
          <p className="text-2xl font-black my-1">{stats.sanitasi}</p>
          <p className={`text-[11px] truncate ${selectedCategory === "Sanitasi_Toilet" ? "text-teal-100" : "text-slate-400"}`}>
            Toilet & area sanitasi
          </p>
        </div>

        <div
          onClick={() => { setSelectedCategory("Area_Umum"); setSelectedCondition("Semua"); setPagination((p) => ({ ...p, page: 1 })); }}
          className={`p-3.5 sm:p-4 rounded-2xl border transition cursor-pointer flex flex-col justify-between h-full ${
            selectedCategory === "Area_Umum" ? "bg-amber-600 text-white border-amber-600 shadow-md" : "bg-white border-slate-200 hover:border-slate-300"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-[11px] font-bold uppercase tracking-wider truncate ${selectedCategory === "Area_Umum" ? "text-amber-100" : "text-slate-500"}`}>
              Area Umum
            </span>
            <Building2 className={`w-4 h-4 shrink-0 ${selectedCategory === "Area_Umum" ? "text-white" : "text-amber-500"}`} />
          </div>
          <p className="text-2xl font-black my-1">{stats.umum}</p>
          <p className={`text-[11px] truncate ${selectedCategory === "Area_Umum" ? "text-amber-100" : "text-slate-400"}`}>
            Parkir, koridor, TPS B3
          </p>
        </div>

        {/* Perlu Perbaikan Stat Card */}
        <div
          onClick={() => {
            setSelectedCondition("Perlu Perbaikan");
            setSelectedCategory("Semua");
            setPagination((p) => ({ ...p, page: 1 }));
          }}
          className={`p-3.5 sm:p-4 rounded-2xl border transition cursor-pointer flex flex-col justify-between h-full col-span-2 sm:col-span-1 lg:col-span-1 ${
            selectedCondition === "Perlu Perbaikan"
              ? "bg-rose-600 text-white border-rose-600 shadow-md"
              : "bg-white border-slate-200 hover:border-amber-300"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-[11px] font-bold uppercase tracking-wider truncate ${selectedCondition === "Perlu Perbaikan" ? "text-rose-100" : "text-amber-800"}`}>
              Perlu Perbaikan
            </span>
            <Wrench className={`w-4 h-4 shrink-0 ${selectedCondition === "Perlu Perbaikan" ? "text-white" : "text-amber-600"}`} />
          </div>
          <p className="text-2xl font-black my-1">{stats.perbaikan}</p>
          <p className={`text-[11px] truncate ${selectedCondition === "Perlu Perbaikan" ? "text-rose-100" : "text-amber-700"}`}>
            Kondisi tidak optimal
          </p>
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Search & Filter Bar */}
        <div className="p-3.5 sm:p-4 border-b border-slate-100 flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between bg-slate-50/50">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Cari nama ruangan, PJ, atau kerusakan..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-1.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setPagination((p) => ({ ...p, page: 1 }));
              }}
              className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="Semua">Semua Kategori Area</option>
              {CATEGORY_OPTIONS.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>

            {/* Condition Filter */}
            <select
              value={selectedCondition}
              onChange={(e) => {
                setSelectedCondition(e.target.value);
                setPagination((p) => ({ ...p, page: 1 }));
              }}
              className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="Semua">Semua Status Kondisi</option>
              <option value="Baik">Kondisi: Baik</option>
              <option value="Perlu Perbaikan">Kondisi: Perlu Perbaikan</option>
              <option value="Rusak Berat">Kondisi: Rusak Berat</option>
            </select>

            <button
              onClick={() => {
                setSelectedCategory("Semua");
                setSelectedCondition("Semua");
                setSearch("");
              }}
              className="p-2 text-slate-500 hover:text-slate-800 bg-white border border-slate-200 rounded-xl text-xs font-medium hover:bg-slate-100 transition cursor-pointer"
              title="Reset Filter"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Responsive Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-slate-50/90 text-slate-600 text-xs font-semibold uppercase tracking-wider border-b border-slate-200">
                <th className="px-5 py-3.5 w-14 text-center">No</th>
                <th className="px-5 py-3.5 w-2/5">
                  <div className="flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-slate-400" />
                    <span>Ruangan & Kondisi Fisik</span>
                  </div>
                </th>
                <th className="px-5 py-3.5 w-1/5">Kategori Area</th>
                <th className="px-5 py-3.5 w-1/5">
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
                    <td className="px-5 py-3.5 text-center text-xs text-slate-400 font-medium">
                      {(pagination.page - 1) * pagination.limit + idx + 1}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="font-semibold text-slate-900 text-sm sm:text-base">{room.name}</div>

                      {/* Uraian Kerusakan Display */}
                      {room.damage_description ? (
                        <div className="mt-1.5 flex items-start gap-1.5 px-2.5 py-1.5 rounded-xl bg-amber-50/90 border border-amber-200 text-xs text-amber-950 max-w-md shadow-2xs">
                          <Wrench className="w-3.5 h-3.5 text-amber-700 shrink-0 mt-0.5" />
                          <div className="flex-1 min-w-0">
                            <span className="font-bold text-amber-900 mr-1">Kerusakan:</span>
                            <span className="text-slate-800 leading-snug">{room.damage_description}</span>
                          </div>
                        </div>
                      ) : (
                        (room.condition_status === "Perlu Perbaikan" || room.condition_status === "Rusak Berat") && (
                          <div className="mt-1.5 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-50 border border-rose-200 text-[11px] text-rose-800">
                            <AlertTriangle className="w-3 h-3 text-rose-600 shrink-0" />
                            <span>Belum ada uraian kerusakan</span>
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(room)}
                              className="ml-1 font-semibold text-rose-800 underline hover:text-rose-900 cursor-pointer"
                            >
                              Isi
                            </button>
                          </div>
                        )
                      )}

                      {/* Meta counters */}
                      <div className="flex items-center gap-2 mt-1.5 text-[11px] text-slate-400">
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
                              {room.total_kerusakan} Kerusakan Utilitas
                            </span>
                          </>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      {getCategoryBadge(room.category)}
                    </td>
                    <td className="px-5 py-4 font-medium text-slate-700 text-xs">
                      <div className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{room.pic_name || "Belum Ditentukan"}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-center whitespace-nowrap">
                      {getConditionBadge(room.condition_status)}
                    </td>
                    <td className="px-5 py-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleOpenEdit(room)}
                          className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition cursor-pointer"
                          title="Edit Ruangan & Uraian Kerusakan"
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
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Penanggung Jawab (PJ Ruangan)
              </label>
              <span className="text-[11px] text-emerald-700 font-medium">
                Pilih dari Pengguna (Users)
              </span>
            </div>
            <select
              value={form.pic_name}
              onChange={(e) => {
                const selectedName = e.target.value;
                const foundUser = users.find((u) => u.name === selectedName);
                setForm({
                  ...form,
                  pic_name: selectedName,
                  pic_user_id: foundUser ? foundUser.id : "",
                });
              }}
              className="w-full border border-slate-300 rounded-xl px-3.5 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white cursor-pointer"
            >
              <option value="">-- Pilih Pengguna sebagai PJ Ruangan --</option>
              {users.map((u) => (
                <option key={u.id} value={u.name}>
                  {u.name} {u.work_unit ? `— ${u.work_unit}` : ""} ({u.role})
                </option>
              ))}
              {/* Jika data ruangan lama memiliki nama yang belum ada di daftar users, tetap sediakan opsinya agar tidak terhapus */}
              {form.pic_name && !users.some((u) => u.name === form.pic_name) && (
                <option value={form.pic_name}>
                  {form.pic_name} (Data Tersimpan)
                </option>
              )}
            </select>
            <p className="text-[11px] text-slate-400 mt-1">
              Data Penanggung Jawab otomatis diambil dari daftar akun pengguna (users) Puskesmas.
            </p>
          </div>

          {/* Kondisi Fisik Ruangan */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Status Kondisi Fisik Ruangan *
            </label>
            <select
              value={form.condition_status}
              onChange={(e) => setForm({ ...form, condition_status: e.target.value })}
              className="w-full border border-slate-300 rounded-xl px-3.5 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            >
              <option value="Baik">Baik (Laik Fungsi)</option>
              <option value="Perlu Perbaikan">Perlu Perbaikan (Ada Kerusakan / Tidak Optimal)</option>
              <option value="Rusak Berat">Rusak Berat (Tidak Dapat Digunakan)</option>
            </select>
          </div>

          {/* Uraian Kerusakan - Tampil Menarik & Wajib jika Kondisi Tidak Baik */}
          {form.condition_status !== "Baik" ? (
            <div className="p-3.5 bg-amber-50/90 border border-amber-300 rounded-2xl space-y-2 animate-fadeIn shadow-2xs">
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900 uppercase tracking-wider">
                <Wrench className="w-4 h-4 text-amber-700" />
                <span>Uraian / Rincian Kerusakan Ruangan *</span>
              </div>
              <p className="text-[11px] text-amber-800 leading-relaxed">
                Jelaskan apa saja yang rusak atau perlu diperbaiki agar petugas teknis/K3 dapat segera merencanakan perbaikan (contoh: kran wastafel bocor, lampu periksa mati, plafon bocor).
              </p>
              <textarea
                rows="3"
                required
                placeholder="Tuliskan rincian kerusakan ruangan secara jelas di sini..."
                value={form.damage_description}
                onChange={(e) => setForm({ ...form, damage_description: e.target.value })}
                className="w-full border border-amber-300 rounded-xl p-2.5 text-sm bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none placeholder:text-slate-400"
              />
            </div>
          ) : (
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Catatan Ruangan / Keterangan Tambahan (Opsional)
              </label>
              <textarea
                rows="2"
                placeholder="Catatan pemeliharaan atau keterangan tambahan ruangan (opsional)..."
                value={form.damage_description}
                onChange={(e) => setForm({ ...form, damage_description: e.target.value })}
                className="w-full border border-slate-300 rounded-xl p-2.5 text-sm bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none placeholder:text-slate-400"
              />
            </div>
          )}

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
