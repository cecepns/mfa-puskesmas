import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
import {
  Users,
  UserPlus,
  Search,
  Pencil,
  Trash2,
  ShieldCheck,
  Shield,
  UserCheck,
  Building,
  Mail,
  Phone,
  CheckCircle2,
  XCircle,
  KeyRound,
  Filter,
} from "lucide-react";
import { request } from "../utils/request";
import { API_ENDPOINTS } from "../utils/endpoints";
import { useDebounce } from "../hooks/useDebounce";
import { useAuth } from "../context/AuthContext";
import Pagination from "../components/Common/Pagination";
import Modal from "../components/Common/Modal";

const ROLE_OPTIONS = [
  { value: "admin", label: "Administrator MFK", color: "bg-purple-100 text-purple-700 border-purple-200" },
  { value: "pimpinan", label: "Pimpinan / Kepala Puskesmas", color: "bg-blue-100 text-blue-700 border-blue-200" },
  { value: "petugas", label: "Petugas Lapangan / K3", color: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  { value: "pj_ruangan", label: "PJ Ruangan / Klaster", color: "bg-amber-100 text-amber-700 border-amber-200" },
];

export default function ManajemenUser() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const [roleFilter, setRoleFilter] = useState("");
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [deleteConfirmUser, setDeleteConfirmUser] = useState(null);

  const initialFormState = {
    username: "",
    password: "",
    name: "",
    email: "",
    role: "petugas",
    work_unit: "Sanitasi & Lingkungan",
    phone: "",
    is_active: true,
  };
  const [formData, setFormData] = useState(initialFormState);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await request.get(API_ENDPOINTS.USERS.LIST, {
        page: pagination.page,
        limit: pagination.limit,
        search: debouncedSearch,
        role: roleFilter,
      });
      setUsers(res.data || []);
      setPagination(res.pagination || { page: 1, limit: 10, total: 0, totalPages: 1 });
    } catch (err) {
      toast.error("Gagal memuat data pengguna");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [pagination.page, pagination.limit, debouncedSearch, roleFilter]);

  const handleOpenCreate = () => {
    setEditingUser(null);
    setFormData(initialFormState);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (user) => {
    setEditingUser(user);
    setFormData({
      username: user.username,
      password: "", // leave empty to not change
      name: user.name,
      email: user.email,
      role: user.role,
      work_unit: user.work_unit || "",
      phone: user.phone || "",
      is_active: Boolean(user.is_active),
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingUser) {
        const payload = { ...formData };
        if (!payload.password) delete payload.password;
        await request.put(API_ENDPOINTS.USERS.UPDATE(editingUser.id), payload);
        toast.success("Data pengguna berhasil diperbarui");
      } else {
        await request.post(API_ENDPOINTS.USERS.CREATE, formData);
        toast.success("Pengguna baru berhasil ditambahkan");
      }
      setIsModalOpen(false);
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || "Gagal menyimpan pengguna");
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirmUser) return;
    try {
      await request.delete(API_ENDPOINTS.USERS.DELETE(deleteConfirmUser.id));
      toast.success("Pengguna berhasil dihapus");
      setDeleteConfirmUser(null);
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || "Gagal menghapus pengguna");
    }
  };

  const getRoleBadge = (role) => {
    const r = ROLE_OPTIONS.find((item) => item.value === role) || {
      label: role,
      color: "bg-slate-100 text-slate-700 border-slate-200",
    };
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${r.color}`}>
        {role === "admin" && <ShieldCheck className="w-3.5 h-3.5" />}
        {role === "pimpinan" && <Shield className="w-3.5 h-3.5" />}
        {role === "petugas" && <UserCheck className="w-3.5 h-3.5" />}
        {role === "pj_ruangan" && <Building className="w-3.5 h-3.5" />}
        {r.label}
      </span>
    );
  };

  // Summary counts
  const totalUsers = pagination.total || users.length;
  const adminUsers = users.filter((u) => u.role === "admin").length;
  const officerUsers = users.filter((u) => u.role === "petugas").length;
  const pimpinanUsers = users.filter((u) => u.role === "pimpinan" || u.role === "pj_ruangan").length;

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold text-slate-800 tracking-tight">06. Manajemen Pengguna</h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
              Hak Akses MFK
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Kelola data staf, peran akses (Admin, Pimpinan, Petugas, PJ Ruangan), dan autentikasi sistem MFK Puskesmas.
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-sm rounded-xl shadow-md shadow-emerald-600/20 transition active:scale-[0.98] cursor-pointer"
        >
          <UserPlus className="w-4 h-4" />
          <span>Tambah Pengguna</span>
        </button>
      </div>

      {/* Quick Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Total Akun</p>
            <p className="text-xl font-bold text-slate-800">{totalUsers}</p>
          </div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Administrator</p>
            <p className="text-xl font-bold text-slate-800">{adminUsers}</p>
          </div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="p-3 bg-teal-50 text-teal-600 rounded-xl">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Petugas Lapangan</p>
            <p className="text-xl font-bold text-slate-800">{officerUsers}</p>
          </div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Pimpinan & PJ</p>
            <p className="text-xl font-bold text-slate-800">{pimpinanUsers}</p>
          </div>
        </div>
      </div>

      {/* Filter and Table Container */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Filter bar */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between bg-slate-50/50">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Cari nama, username, email, unit kerja..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400 hidden sm:block" />
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">Semua Peran Hak Akses</option>
              {ROLE_OPTIONS.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Table with proper overflow wrapper and fixed column styling */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[760px]">
            <thead>
              <tr className="bg-slate-50/90 text-slate-600 text-xs font-semibold uppercase tracking-wider border-b border-slate-200">
                <th className="px-5 py-3.5 w-1/4">Pengguna</th>
                <th className="px-5 py-3.5 w-1/5">Kontak</th>
                <th className="px-5 py-3.5 w-1/5">Unit Kerja</th>
                <th className="px-5 py-3.5 w-1/6">Peran Akses</th>
                <th className="px-5 py-3.5 w-24 text-center">Status</th>
                <th className="px-5 py-3.5 w-24 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-5 py-8 text-center text-slate-400">
                    Memuat data pengguna...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-5 py-8 text-center text-slate-400">
                    Tidak ada data pengguna yang sesuai.
                  </td>
                </tr>
              ) : (
                users.map((u) => {
                  const isCurrent = currentUser?.id === u.id;
                  const initials = u.name
                    ? u.name
                      .split(" ")
                      .map((n) => n[0])
                      .slice(0, 2)
                      .join("")
                      .toUpperCase()
                    : "U";

                  return (
                    <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white font-bold text-xs flex items-center justify-center shadow-sm">
                            {initials}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                              {u.name}
                              {isCurrent && (
                                <span className="px-1.5 py-0.5 text-[10px] font-medium bg-emerald-100 text-emerald-800 rounded">
                                  Anda
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-slate-400 font-mono">@{u.username}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 text-xs text-slate-600">
                            <Mail className="w-3.5 h-3.5 text-slate-400" />
                            <span>{u.email}</span>
                          </div>
                          {u.phone && (
                            <div className="flex items-center gap-1.5 text-xs text-slate-500">
                              <Phone className="w-3.5 h-3.5 text-slate-400" />
                              <span>{u.phone}</span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-4 font-medium text-slate-700">
                        {u.work_unit || "-"}
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        {getRoleBadge(u.role)}
                      </td>
                      <td className="px-5 py-4 text-center whitespace-nowrap">
                        {u.is_active ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                            Aktif
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200">
                            <XCircle className="w-3 h-3 text-rose-500" />
                            Nonaktif
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleOpenEdit(u)}
                            className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
                            title="Edit Pengguna"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteConfirmUser(u)}
                            disabled={isCurrent}
                            className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition disabled:opacity-30 disabled:cursor-not-allowed"
                            title={isCurrent ? "Tidak dapat menghapus akun sendiri" : "Hapus Pengguna"}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
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
        title={editingUser ? `Edit Pengguna: ${editingUser.name}` : "Tambah Pengguna Baru"}
      >
        <form onSubmit={handleSubmit} className="space-y-4 text-sm">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Nama Lengkap & Gelar *
            </label>
            <input
              type="text"
              required
              placeholder="Contoh: dr. Ahmad Fauzi, M.Kes"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full border border-slate-300 rounded-xl px-3.5 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Username *
              </label>
              <input
                type="text"
                required
                disabled={Boolean(editingUser)}
                placeholder="username unik"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                className="w-full border border-slate-300 rounded-xl px-3.5 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none disabled:bg-slate-100"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Email Aktif *
              </label>
              <input
                type="email"
                required
                placeholder="nama@puskesmas.go.id"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full border border-slate-300 rounded-xl px-3.5 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Kata Sandi {editingUser ? "(Kosongkan jika tidak diubah)" : "*"}
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="password"
                required={!editingUser}
                placeholder={editingUser ? "Biarkan kosong untuk mempertahankan kata sandi lama" : "Minimal 6 karakter"}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Peran Hak Akses *
              </label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              >
                {ROLE_OPTIONS.map((r) => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Nomor Telepon / WhatsApp
              </label>
              <input
                type="text"
                placeholder="08xxxxxxxxxx"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full border border-slate-300 rounded-xl px-3.5 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Unit Kerja / Klaster / Ruangan *
            </label>
            <input
              type="text"
              required
              placeholder="Contoh: Sanitasi & Lingkungan, UGD, Farmasi, Klaster II"
              value={formData.work_unit}
              onChange={(e) => setFormData({ ...formData, work_unit: e.target.value })}
              className="w-full border border-slate-300 rounded-xl px-3.5 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="is_active"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
            />
            <label htmlFor="is_active" className="text-sm font-medium text-slate-700 cursor-pointer">
              Akun Aktif (Dapat masuk ke dalam aplikasi SIKELAK)
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
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
              {editingUser ? "Simpan Perubahan" : "Buat Pengguna"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Confirmation Modal Hapus */}
      <Modal
        isOpen={Boolean(deleteConfirmUser)}
        onClose={() => setDeleteConfirmUser(null)}
        title="Konfirmasi Hapus Pengguna"
      >
        <div className="space-y-4 text-sm">
          <p className="text-slate-600">
            Apakah Anda yakin ingin menghapus akun pengguna{" "}
            <b className="text-slate-900">{deleteConfirmUser?.name}</b> (@{deleteConfirmUser?.username})?
          </p>
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700">
            Tindakan ini tidak dapat dibatalkan. Pengguna tidak akan dapat login lagi ke dalam sistem MFK.
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setDeleteConfirmUser(null)}
              className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleDelete}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-medium shadow-sm"
            >
              Ya, Hapus Pengguna
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
