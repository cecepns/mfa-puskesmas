import React, { useEffect, useState } from "react";
import { request } from "../utils/request";
import { API_ENDPOINTS } from "../utils/endpoints";
import {
  CheckCircle2,
  Percent,
  Wrench,
  Activity,
  ShieldAlert,
  Building,
  Building2,
  Layers,
  User,
  Search,
  CheckCircle,
  AlertCircle,
  XCircle,
  TrendingUp,
} from "lucide-react";

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [roomFilter, setRoomFilter] = useState("");

  useEffect(() => {
    request
      .get(API_ENDPOINTS.DASHBOARD.SUMMARY)
      .then((res) => setData(res.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="p-12 text-center text-slate-500">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-emerald-500 border-t-transparent mb-3"></div>
        <p className="font-medium text-sm">Memuat ringkasan MFK Puskesmas...</p>
      </div>
    );
  }

  const statCards = [
    {
      title: "Penyelesaian Laporan",
      value: `${data.laporanSelesai} Selesai / ${data.laporanTerlambat} Terlambat`,
      icon: CheckCircle2,
      color: "bg-emerald-50 text-emerald-800 border-emerald-200",
      iconBg: "bg-emerald-100 text-emerald-700",
    },
    {
      title: "Cakupan Inspeksi",
      value: `${data.persentaseInspeksi}% Ruangan Diperiksa`,
      icon: Percent,
      color: "bg-blue-50 text-blue-800 border-blue-200",
      iconBg: "bg-blue-100 text-blue-700",
    },
    {
      title: "Kerusakan Kritis (Segera)",
      value: `${data.kerusakanSegera} Kasus Urgen`,
      icon: Wrench,
      color: "bg-amber-50 text-amber-800 border-amber-200",
      iconBg: "bg-amber-100 text-amber-700",
    },
    {
      title: "Alat Medis Terkalibrasi",
      value: `${data.jumlahKalibrasi} Unit Alkes`,
      icon: Activity,
      color: "bg-teal-50 text-teal-800 border-teal-200",
      iconBg: "bg-teal-100 text-teal-700",
    },
    {
      title: "Rekap Insiden Keselamatan",
      value: `${data.totalInsiden} Insiden (${data.insidenSelesai} Selesai)`,
      icon: ShieldAlert,
      color: "bg-rose-50 text-rose-800 border-rose-200",
      iconBg: "bg-rose-100 text-rose-700",
    },
  ];

  const filteredRooms = (data.ruanganList || []).filter((r) =>
    (r.name || "").toLowerCase().includes((roomFilter || "").toLowerCase()) ||
    (r.category || "").toLowerCase().includes((roomFilter || "").toLowerCase()) ||
    (r.pic_name || "").toLowerCase().includes((roomFilter || "").toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Dashboard Monitoring SIM-MFK</h2>
        <p className="text-sm text-slate-500 mt-1">
          Ringkasan kondisi fasilitas per ruangan, kepatuhan inspeksi, kalibrasi alkes, dan manajemen risiko Puskesmas.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {statCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <div
              key={i}
              className={`p-4 rounded-2xl border ${card.color} flex flex-col justify-between shadow-xs transition hover:shadow-sm`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold uppercase tracking-wider opacity-80">{card.title}</span>
                <div className={`p-2 rounded-xl ${card.iconBg}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <p className="text-lg font-bold text-slate-900">{card.value}</p>
            </div>
          );
        })}
      </div>

      {/* Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <Building className="w-5 h-5 text-emerald-600" />
            <h3 className="font-bold text-slate-800 text-base">
              Status Kondisi Sarana & Prasarana Setiap Ruangan / Klaster
            </h3>
          </div>
          <div className="relative max-w-xs">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Cari ruangan..."
              value={roomFilter}
              onChange={(e) => setRoomFilter(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        {/* Responsive Table with clear column widths */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[760px]">
            <thead>
              <tr className="bg-slate-50/90 text-slate-600 text-xs font-semibold uppercase tracking-wider border-b border-slate-200">
                <th className="px-4 py-3.5 w-16 text-center">No</th>
                <th className="px-4 py-3.5 w-2/5">
                  <div className="flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-slate-400" />
                    <span>Nama Ruangan / Klaster / Sanitasi</span>
                  </div>
                </th>
                <th className="px-4 py-3.5 w-1/4">
                  <div className="flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-slate-400" />
                    <span>Kategori Area</span>
                  </div>
                </th>
                <th className="px-4 py-3.5 w-1/4">
                  <div className="flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span>Penanggung Jawab</span>
                  </div>
                </th>
                <th className="px-4 py-3.5 w-36 text-center whitespace-nowrap">Status Kondisi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
              {filteredRooms.map((room, idx) => (
                <tr key={room.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-4 py-3.5 text-center text-xs text-slate-400 font-medium">
                    {idx + 1}
                  </td>
                  <td className="px-4 py-3.5 font-semibold text-slate-900">
                    {room.name}
                  </td>
                  <td className="px-4 py-3.5 text-xs text-slate-600">
                    <span className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-md font-medium">
                      {room.category.replace("_", " ")}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-xs font-medium text-slate-700">
                    {room.pic_name}
                  </td>
                  <td className="px-4 py-3.5 text-center whitespace-nowrap">
                    {room.condition_status === "Baik" ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                        Baik
                      </span>
                    ) : room.condition_status === "Perlu Perbaikan" ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                        <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                        Perlu Perbaikan
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                        <XCircle className="w-3.5 h-3.5 text-rose-600" />
                        Rusak Berat
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
