import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  Building,
  Package,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Activity,
  Layers,
  FlaskConical,
  Award,
  Filter,
  RefreshCw,
  Boxes,
  Minus,
  MinusCircle,
  Calendar,
} from "lucide-react";
import { request } from "../utils/request";
import { API_ENDPOINTS } from "../utils/endpoints";
import { useDebounce } from "../hooks/useDebounce";
import Pagination from "../components/Common/Pagination";
import Modal from "../components/Common/Modal";

const CATEGORIES = [
  { key: "Semua", label: "Semua Kategori", icon: Boxes },
  { key: "B3", label: "Bahan B3", icon: FlaskConical },
  { key: "Sarpras", label: "Sarana Prasarana", icon: Layers },
  { key: "Alkes", label: "Alat Kesehatan", icon: Activity },
  { key: "Kalibrasi", label: "Wajib Kalibrasi", icon: Award },
];

export default function Inventarisasi() {
  const [selectedCategory, setSelectedCategory] = useState("Semua");
  const [selectedRoom, setSelectedRoom] = useState("");
  const [selectedCondition, setSelectedCondition] = useState("");
  const [items, setItems] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [deleteConfirmItem, setDeleteConfirmItem] = useState(null);
  const [quickStockItem, setQuickStockItem] = useState(null);
  const [decreaseAmount, setDecreaseAmount] = useState(1);
  const [decreaseDate, setDecreaseDate] = useState(new Date().toISOString().slice(0, 10));

  // Stats
  const [stats, setStats] = useState({ total: 0, b3: 0, sarpras: 0, alkes: 0, kalibrasi: 0 });

  const [formData, setFormData] = useState({
    category: "B3",
    room_id: "",
    item_name: "",
    quantity: 1,
    stock_date: new Date().toISOString().slice(0, 10),
    unit: "Botol",
    condition_status: "Baik",
    needs_calibration: false,
    calibration_date: "",
    next_calibration_date: "",
    calibration_institution: "",
    notes: "",
  });

  useEffect(() => {
    request.get(API_ENDPOINTS.ROOMS.LIST).then((res) => setRooms(res.data || []));
  }, []);

  const fetchStats = async () => {
    try {
      const res = await request.get(API_ENDPOINTS.INVENTORIES.LIST, { limit: 100 });
      const allItems = res.data || [];
      setStats({
        total: res.pagination?.total || allItems.length,
        b3: allItems.filter((i) => i.category === "B3").length,
        sarpras: allItems.filter((i) => i.category === "Sarpras").length,
        alkes: allItems.filter((i) => i.category === "Alkes").length,
        kalibrasi: allItems.filter((i) => i.category === "Kalibrasi" || i.needs_calibration).length,
      });
    } catch {
      // stats fallback
    }
  };

  const fetchInventories = async () => {
    setLoading(true);
    try {
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        search: debouncedSearch,
        room_id: selectedRoom,
        condition_status: selectedCondition,
      };

      if (selectedCategory === "Kalibrasi") {
        params.calibration_only = "true";
      } else if (selectedCategory !== "Semua") {
        params.category = selectedCategory;
      }

      const res = await request.get(API_ENDPOINTS.INVENTORIES.LIST, params);
      setItems(res.data || []);
      setPagination(res.pagination || { page: 1, limit: 10, total: 0, totalPages: 1 });
    } catch (err) {
      toast.error("Gagal memuat inventarisasi");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    fetchInventories();
  }, [selectedCategory, selectedRoom, selectedCondition, pagination.page, pagination.limit, debouncedSearch]);

  const openCreateModal = () => {
    setEditingItem(null);
    setFormData({
      category: selectedCategory === "Semua" ? "B3" : selectedCategory,
      room_id: rooms[0]?.id || "",
      item_name: "",
      quantity: 1,
      stock_date: new Date().toISOString().slice(0, 10),
      unit: selectedCategory === "B3" ? "Botol" : "Unit",
      condition_status: "Baik",
      needs_calibration: selectedCategory === "Alkes" || selectedCategory === "Kalibrasi",
      calibration_date: "",
      next_calibration_date: "",
      calibration_institution: "",
      notes: "",
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item) => {
    setEditingItem(item);
    setFormData({
      category: item.category,
      room_id: item.room_id,
      item_name: item.item_name,
      quantity: item.quantity,
      stock_date: item.stock_date ? item.stock_date.slice(0, 10) : item.created_at ? item.created_at.slice(0, 10) : new Date().toISOString().slice(0, 10),
      unit: item.unit,
      condition_status: item.condition_status,
      needs_calibration: Boolean(item.needs_calibration),
      calibration_date: item.calibration_date ? item.calibration_date.slice(0, 10) : "",
      next_calibration_date: item.next_calibration_date ? item.next_calibration_date.slice(0, 10) : "",
      calibration_institution: item.calibration_institution || "",
      notes: item.notes || "",
    });
    setIsModalOpen(true);
  };

  // Cepat kurangi/tambah 1 stok langsung di baris tabel
  const handleQuickAdjust = async (item, delta) => {
    const newQty = Math.max(0, item.quantity + delta);
    const today = new Date().toISOString().slice(0, 10);
    try {
      await request.patch(API_ENDPOINTS.INVENTORIES.UPDATE_STOCK(item.id), {
        quantity: newQty,
        stock_date: today,
      });
      setItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, quantity: newQty, stock_date: today } : i))
      );
      if (delta < 0) {
        toast.success(`Stok ${item.item_name} berkurang menjadi ${newQty} ${item.unit}`);
      } else {
        toast.success(`Stok ${item.item_name} bertambah menjadi ${newQty} ${item.unit}`);
      }
    } catch (err) {
      toast.error("Gagal memperbarui stok");
    }
  };

  // Kurangi stok bulanan via dialog pemakaian
  const handleApplyMonthlyDecrease = async (e) => {
    e.preventDefault();
    if (!quickStockItem) return;
    const amount = parseInt(decreaseAmount) || 0;
    if (amount <= 0) {
      toast.error("Jumlah pemakaian harus lebih dari 0");
      return;
    }
    const newQty = Math.max(0, quickStockItem.quantity - amount);
    try {
      await request.patch(API_ENDPOINTS.INVENTORIES.UPDATE_STOCK(quickStockItem.id), {
        quantity: newQty,
        stock_date: decreaseDate,
      });
      toast.success(
        `Pemakaian berhasil dicatat! Sisa stok ${quickStockItem.item_name}: ${newQty} ${quickStockItem.unit}`
      );
      setQuickStockItem(null);
      fetchInventories();
      fetchStats();
    } catch (err) {
      toast.error("Gagal mengurangi stok");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingItem) {
        await request.put(API_ENDPOINTS.INVENTORIES.UPDATE(editingItem.id), formData);
        toast.success("Data inventaris diperbarui");
      } else {
        await request.post(API_ENDPOINTS.INVENTORIES.CREATE, formData);
        toast.success("Data inventaris ditambahkan");
      }
      setIsModalOpen(false);
      fetchInventories();
      fetchStats();
    } catch (err) {
      toast.error(err.response?.data?.message || "Gagal menyimpan data");
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirmItem) return;
    try {
      await request.delete(API_ENDPOINTS.INVENTORIES.DELETE(deleteConfirmItem.id));
      toast.success("Data inventaris berhasil dihapus");
      setDeleteConfirmItem(null);
      fetchInventories();
      fetchStats();
    } catch (err) {
      toast.error(err.response?.data?.message || "Gagal menghapus data");
    }
  };

  const getCategoryBadge = (category) => {
    switch (category) {
      case "B3":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
            <FlaskConical className="w-3 h-3 text-amber-600" /> B3
          </span>
        );
      case "Sarpras":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-semibold bg-indigo-50 text-indigo-800 border border-indigo-200">
            <Layers className="w-3 h-3 text-indigo-600" /> Sarpras
          </span>
        );
      case "Alkes":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
            <Activity className="w-3 h-3 text-emerald-600" /> Alkes
          </span>
        );
      case "Kalibrasi":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-semibold bg-purple-50 text-purple-800 border border-purple-200">
            <Award className="w-3 h-3 text-purple-600" /> Kalibrasi
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-slate-100 text-slate-700">
            {category}
          </span>
        );
    }
  };

  const getConditionBadge = (status) => {
    if (status === "Baik") {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Baik
        </span>
      );
    }
    if (status === "Rusak Ringan") {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
          <AlertTriangle className="w-3 h-3 text-amber-600" /> Rusak Ringan
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
        <XCircle className="w-3 h-3 text-rose-600" /> Rusak Berat
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">02. Inventarisasi Ruangan</h2>
          <p className="text-sm text-slate-500 mt-1">
            Daftar terpadu bahan B3, sarana prasarana, alat kesehatan, dan pemantauan kalibrasi per ruangan.
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-sm rounded-xl shadow-md shadow-emerald-600/20 transition cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Item Inventaris</span>
        </button>
      </div>

      {/* Quick Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <div
          onClick={() => { setSelectedCategory("Semua"); setPagination((p) => ({ ...p, page: 1 })); }}
          className={`p-4 rounded-2xl border transition cursor-pointer ${
            selectedCategory === "Semua" ? "bg-slate-900 text-white border-slate-900 shadow-md" : "bg-white border-slate-200 hover:border-slate-300"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-xs font-semibold uppercase tracking-wider ${selectedCategory === "Semua" ? "text-slate-300" : "text-slate-500"}`}>
              Total Semua Aset
            </span>
            <Boxes className={`w-4 h-4 ${selectedCategory === "Semua" ? "text-emerald-400" : "text-slate-400"}`} />
          </div>
          <p className="text-2xl font-bold mt-2">{stats.total || pagination.total}</p>
          <p className={`text-[11px] mt-0.5 ${selectedCategory === "Semua" ? "text-slate-400" : "text-slate-400"}`}>
            Seluruh kategori
          </p>
        </div>

        <div
          onClick={() => { setSelectedCategory("B3"); setPagination((p) => ({ ...p, page: 1 })); }}
          className={`p-4 rounded-2xl border transition cursor-pointer ${
            selectedCategory === "B3" ? "bg-amber-600 text-white border-amber-600 shadow-md" : "bg-white border-slate-200 hover:border-slate-300"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-xs font-semibold uppercase tracking-wider ${selectedCategory === "B3" ? "text-amber-100" : "text-slate-500"}`}>
              Bahan B3 Medis
            </span>
            <FlaskConical className={`w-4 h-4 ${selectedCategory === "B3" ? "text-white" : "text-amber-500"}`} />
          </div>
          <p className="text-2xl font-bold mt-2">{stats.b3}</p>
          <p className={`text-[11px] mt-0.5 ${selectedCategory === "B3" ? "text-amber-100" : "text-slate-400"}`}>
            Reagen & desinfektan
          </p>
        </div>

        <div
          onClick={() => { setSelectedCategory("Alkes"); setPagination((p) => ({ ...p, page: 1 })); }}
          className={`p-4 rounded-2xl border transition cursor-pointer ${
            selectedCategory === "Alkes" ? "bg-emerald-600 text-white border-emerald-600 shadow-md" : "bg-white border-slate-200 hover:border-slate-300"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-xs font-semibold uppercase tracking-wider ${selectedCategory === "Alkes" ? "text-emerald-100" : "text-slate-500"}`}>
              Alat Kesehatan
            </span>
            <Activity className={`w-4 h-4 ${selectedCategory === "Alkes" ? "text-white" : "text-emerald-500"}`} />
          </div>
          <p className="text-2xl font-bold mt-2">{stats.alkes}</p>
          <p className={`text-[11px] mt-0.5 ${selectedCategory === "Alkes" ? "text-emerald-100" : "text-slate-400"}`}>
            Unit medis & poli
          </p>
        </div>

        <div
          onClick={() => { setSelectedCategory("Kalibrasi"); setPagination((p) => ({ ...p, page: 1 })); }}
          className={`p-4 rounded-2xl border transition cursor-pointer ${
            selectedCategory === "Kalibrasi" ? "bg-purple-600 text-white border-purple-600 shadow-md" : "bg-white border-slate-200 hover:border-slate-300"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-xs font-semibold uppercase tracking-wider ${selectedCategory === "Kalibrasi" ? "text-purple-100" : "text-slate-500"}`}>
              Kalibrasi Rutin
            </span>
            <Award className={`w-4 h-4 ${selectedCategory === "Kalibrasi" ? "text-white" : "text-purple-500"}`} />
          </div>
          <p className="text-2xl font-bold mt-2">{stats.kalibrasi}</p>
          <p className={`text-[11px] mt-0.5 ${selectedCategory === "Kalibrasi" ? "text-purple-100" : "text-slate-400"}`}>
            Bersertifikat BPFKK
          </p>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Filter bar */}
        <div className="p-4 sm:p-5 border-b border-slate-100 space-y-3 bg-slate-50/50">
          {/* Quick Category Segmented Buttons */}
          <div className="flex flex-wrap items-center gap-1.5">
            {CATEGORIES.map((c) => {
              const Icon = c.icon;
              const isSelected = selectedCategory === c.key;
              return (
                <button
                  key={c.key}
                  onClick={() => {
                    setSelectedCategory(c.key);
                    setPagination((p) => ({ ...p, page: 1 }));
                  }}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                    isSelected
                      ? "bg-slate-900 text-white shadow-xs"
                      : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{c.label}</span>
                </button>
              );
            })}
          </div>

          {/* Search & Select Filters */}
          <div className="flex flex-col md:flex-row gap-2.5 items-stretch md:items-center justify-between pt-1">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Cari nama barang, nomor seri, ruangan..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
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

              <select
                value={selectedCondition}
                onChange={(e) => {
                  setSelectedCondition(e.target.value);
                  setPagination((p) => ({ ...p, page: 1 }));
                }}
                className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">Semua Kondisi</option>
                <option value="Baik">Kondisi Baik</option>
                <option value="Rusak Ringan">Rusak Ringan</option>
                <option value="Rusak Berat">Rusak Berat</option>
              </select>

              <button
                onClick={() => {
                  setSelectedCategory("Semua");
                  setSelectedRoom("");
                  setSelectedCondition("");
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
          <table className="w-full text-left border-collapse min-w-[950px]">
            <thead>
              <tr className="bg-slate-50/90 text-slate-600 text-xs font-semibold uppercase tracking-wider border-b border-slate-200">
                <th className="px-4 py-3.5 w-56">Nama Item / Aset</th>
                <th className="px-4 py-3.5 w-24 whitespace-nowrap">Kategori</th>
                <th className="px-4 py-3.5 w-40">
                  <div className="flex items-center gap-1.5">
                    <Building className="w-3.5 h-3.5 text-slate-400" />
                    <span>Ruangan</span>
                  </div>
                </th>
                <th className="px-4 py-3.5 w-44 text-center whitespace-nowrap">
                  <span>Stok & Pemakaian</span>
                </th>
                <th className="px-4 py-3.5 w-32 whitespace-nowrap">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>Tgl Stok / Update</span>
                  </div>
                </th>
                <th className="px-4 py-3.5 w-32 whitespace-nowrap">Kondisi</th>
                <th className="px-4 py-3.5 w-44 whitespace-nowrap">Kalibrasi</th>
                <th className="px-4 py-3.5 min-w-[140px]">Keterangan</th>
                <th className="px-4 py-3.5 w-24 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan="9" className="px-4 py-8 text-center text-slate-400">
                    Memuat data inventaris...
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan="9" className="px-4 py-8 text-center text-slate-400">
                    Tidak ada barang inventaris yang sesuai dengan filter.
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3.5">
                      <div className="font-semibold text-slate-900">{item.item_name}</div>
                      {item.notes && <div className="text-xs text-slate-400 truncate max-w-xs">{item.notes}</div>}
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      {getCategoryBadge(item.category)}
                    </td>
                    <td className="px-4 py-3.5 font-medium text-slate-800 text-xs">
                      {item.room_name}
                    </td>
                    <td className="px-4 py-3.5 text-center whitespace-nowrap">
                      <div className="inline-flex flex-col items-center gap-1">
                        <div className="inline-flex items-center gap-1 bg-slate-100/90 border border-slate-200/90 rounded-xl p-1 shadow-2xs">
                          <button
                            type="button"
                            onClick={() => handleQuickAdjust(item, -1)}
                            disabled={item.quantity <= 0}
                            title="Kurangi stok 1"
                            className="w-6 h-6 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-rose-600 hover:border-rose-200 flex items-center justify-center text-xs font-bold transition disabled:opacity-30 cursor-pointer shadow-2xs"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span
                            className={`px-2 py-0.5 text-xs font-bold rounded-md ${
                              item.quantity <= 2
                                ? "text-amber-700 bg-amber-50"
                                : "text-slate-800"
                            }`}
                          >
                            {item.quantity} {item.unit}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleQuickAdjust(item, 1)}
                            title="Tambah stok 1"
                            className="w-6 h-6 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-emerald-600 hover:border-emerald-200 flex items-center justify-center text-xs font-bold transition cursor-pointer shadow-2xs"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                        {item.category === "B3" && (
                          <button
                            type="button"
                            onClick={() => {
                              setQuickStockItem(item);
                              setDecreaseAmount(1);
                              setDecreaseDate(new Date().toISOString().slice(0, 10));
                            }}
                            className="text-[10px] text-amber-700 hover:text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200/80 px-2 py-0.5 rounded-md font-semibold inline-flex items-center gap-1 cursor-pointer transition shadow-2xs"
                            title="Kurangi stok pemakaian bulanan"
                          >
                            <MinusCircle className="w-2.5 h-2.5 text-amber-600" />
                            <span>Kurangi Pemakaian</span>
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-xs text-slate-600 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 font-medium text-slate-700">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>
                          {item.stock_date
                            ? new Date(item.stock_date).toLocaleDateString("id-ID", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              })
                            : item.created_at
                            ? new Date(item.created_at).toLocaleDateString("id-ID", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              })
                            : "-"}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      {getConditionBadge(item.condition_status)}
                    </td>
                    <td className="px-4 py-3.5 text-xs">
                      {item.needs_calibration || item.category === "Kalibrasi" ? (
                        <div className="space-y-0.5">
                          <span className="inline-flex items-center gap-1 font-semibold text-purple-700">
                            <Award className="w-3 h-3 text-purple-600" /> Terkalibrasi
                          </span>
                          {item.next_calibration_date && (
                            <p className="text-[11px] text-slate-400">
                              Exp: {item.next_calibration_date.slice(0, 10)}
                            </p>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-400 text-xs">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-xs text-slate-600">
                      {item.notes || "-"}
                    </td>
                    <td className="px-4 py-3.5 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleOpenEdit(item)}
                          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                          title="Edit Item"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirmItem(item)}
                          className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                          title="Hapus Item"
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

      {/* Modal Form Tambah / Edit */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingItem ? `Edit Inventaris: ${editingItem.item_name}` : "Tambah Barang Inventaris Baru"}
      >
        <form onSubmit={handleSubmit} className="space-y-4 text-sm">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Kategori Aset *
              </label>
              <select
                value={formData.category}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    category: e.target.value,
                    needs_calibration: e.target.value === "Alkes" || e.target.value === "Kalibrasi",
                  })
                }
                className="w-full border border-slate-300 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              >
                <option value="B3">Bahan Berbahaya & Beracun (B3)</option>
                <option value="Sarpras">Sarana & Prasarana</option>
                <option value="Alkes">Alat Kesehatan (Alkes)</option>
                <option value="Kalibrasi">Pencatatan Kalibrasi</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Ruangan / Klaster *
              </label>
              <select
                value={formData.room_id}
                onChange={(e) => setFormData({ ...formData, room_id: e.target.value })}
                className="w-full border border-slate-300 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              >
                {rooms.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Nama Item / Alat / Bahan Kimia *
            </label>
            <input
              type="text"
              required
              placeholder="Contoh: Reagen Ziehl Neelsen / Dental Chair"
              value={formData.item_name}
              onChange={(e) => setFormData({ ...formData, item_name: e.target.value })}
              className="w-full border border-slate-300 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Jumlah / Sisa Stok *
              </label>
              <input
                type="number"
                required
                min="0"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })}
                className="w-full border border-slate-300 rounded-xl p-2.5 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Satuan
              </label>
              <input
                type="text"
                placeholder="Botol, Liter, Unit, Set"
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                className="w-full border border-slate-300 rounded-xl p-2.5 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1 flex items-center justify-between">
                <span>Tanggal Stok</span>
                <span className="text-[10px] text-emerald-600 font-normal lowercase">bisa backdate</span>
              </label>
              <input
                type="date"
                required
                value={formData.stock_date}
                onChange={(e) => setFormData({ ...formData, stock_date: e.target.value })}
                className="w-full border border-slate-300 rounded-xl p-2.5 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Kondisi Fisik
            </label>
            <select
              value={formData.condition_status}
              onChange={(e) => setFormData({ ...formData, condition_status: e.target.value })}
              className="w-full border border-slate-300 rounded-xl p-2.5 text-sm"
            >
              <option value="Baik">Baik (Siap Pakai)</option>
              <option value="Rusak Ringan">Rusak Ringan</option>
              <option value="Rusak Berat">Rusak Berat</option>
            </select>
          </div>

          {(formData.category === "Alkes" || formData.category === "Kalibrasi") && (
            <div className="p-3.5 bg-purple-50/60 border border-purple-200 rounded-xl space-y-3">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="needs_calibration"
                  checked={formData.needs_calibration}
                  onChange={(e) => setFormData({ ...formData, needs_calibration: e.target.checked })}
                  className="w-4 h-4 text-purple-600 rounded border-slate-300"
                />
                <label htmlFor="needs_calibration" className="text-xs font-semibold text-purple-900 cursor-pointer">
                  Item Wajib Kalibrasi Rutin
                </label>
              </div>

              {formData.needs_calibration && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-[11px] font-medium text-purple-900 mb-1">
                      Tanggal Kalibrasi Terakhir
                    </label>
                    <input
                      type="date"
                      value={formData.calibration_date}
                      onChange={(e) => setFormData({ ...formData, calibration_date: e.target.value })}
                      className="w-full bg-white border border-purple-200 rounded-lg p-2 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-purple-900 mb-1">
                      Jatuh Tempo Kalibrasi Berikutnya
                    </label>
                    <input
                      type="date"
                      value={formData.next_calibration_date}
                      onChange={(e) => setFormData({ ...formData, next_calibration_date: e.target.value })}
                      className="w-full bg-white border border-purple-200 rounded-lg p-2 text-xs"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-[11px] font-medium text-purple-900 mb-1">
                      Lembaga Penguji / No. Sertifikat
                    </label>
                    <input
                      type="text"
                      placeholder="Contoh: BPFKK Kemenkes RI No. 883/KAL/2026"
                      value={formData.calibration_institution}
                      onChange={(e) => setFormData({ ...formData, calibration_institution: e.target.value })}
                      className="w-full bg-white border border-purple-200 rounded-lg p-2 text-xs"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Catatan Khusus / Keterangan Tambahan
            </label>
            <textarea
              rows="2"
              placeholder="Nomor seri, merk, lokasi lemari simpan B3..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full border border-slate-300 rounded-xl p-2.5 text-sm"
            />
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
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl shadow-sm transition"
            >
              {editingItem ? "Simpan Perubahan" : "Simpan Item"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Confirmation Modal Hapus */}
      <Modal
        isOpen={Boolean(deleteConfirmItem)}
        onClose={() => setDeleteConfirmItem(null)}
        title="Konfirmasi Hapus Inventaris"
      >
        <div className="space-y-4 text-sm">
          <p className="text-slate-600">
            Apakah Anda yakin ingin menghapus barang aset{" "}
            <b className="text-slate-900">{deleteConfirmItem?.item_name}</b> di ruangan{" "}
            <b className="text-slate-900">{deleteConfirmItem?.room_name}</b>?
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
      {/* Modal Cepat Kurangi Stok Pemakaian Bulanan (Khususnya B3) */}
      <Modal
        isOpen={Boolean(quickStockItem)}
        onClose={() => setQuickStockItem(null)}
        title="Catat Pemakaian / Kurangi Stok Bulanan"
      >
        <form onSubmit={handleApplyMonthlyDecrease} className="space-y-4 text-sm">
          <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-900">{quickStockItem?.item_name}</span>
              <span className="text-[11px] font-semibold text-amber-700 bg-amber-100/80 px-2 py-0.5 rounded-md">
                {quickStockItem?.room_name}
              </span>
            </div>
            <p className="text-xs text-amber-800">
              Stok saat ini: <b className="text-amber-950 font-bold">{quickStockItem?.quantity} {quickStockItem?.unit}</b>
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1 flex items-center justify-between">
                <span>Tanggal Pemakaian</span>
                <span className="text-[10px] text-emerald-600 font-normal lowercase">bisa pilih bulan lalu</span>
              </label>
              <input
                type="date"
                required
                value={decreaseDate}
                onChange={(e) => setDecreaseDate(e.target.value)}
                className="w-full border border-slate-300 rounded-xl p-2.5 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Jumlah Pemakaian ({quickStockItem?.unit}) *
              </label>
              <input
                type="number"
                required
                min="1"
                max={quickStockItem?.quantity || 9999}
                value={decreaseAmount}
                onChange={(e) => setDecreaseAmount(parseInt(e.target.value) || 0)}
                className="w-full border border-slate-300 rounded-xl p-2.5 text-sm font-semibold"
              />
            </div>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
            <span className="text-xs text-slate-600">Sisa Stok Setelah Dikurangi:</span>
            <span className="text-sm font-bold text-slate-900">
              {Math.max(0, (quickStockItem?.quantity || 0) - (parseInt(decreaseAmount) || 0))} {quickStockItem?.unit}
            </span>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setQuickStockItem(null)}
              className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 font-medium"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-medium rounded-xl shadow-sm transition"
            >
              Simpan Pengurangan Stok
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
