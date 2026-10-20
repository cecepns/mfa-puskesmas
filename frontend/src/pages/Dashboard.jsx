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
      title: "Laporan Selesai",
      value: data.laporanSelesai ?? 0,
      sub: `${data.laporanTerlambat || 0} Terlambat`,
      icon: CheckCircle2,
      iconColor: "text-emerald-600 bg-emerald-50",
      subColor: "text-emerald-700",
    },
    {
      title: "Cakupan Inspeksi",
      value: `${data.persentaseInspeksi ?? 0}%`,
      sub: "Ruangan Diperiksa",
      icon: Percent,
      iconColor: "text-blue-600 bg-blue-50",
      subColor: "text-blue-700",
    },
    {
      title: "Kerusakan Kritis",
      value: data.kerusakanSegera ?? 0,
      sub: "Urgensi Segera",
      icon: Wrench,
      iconColor: "text-amber-600 bg-amber-50",
      subColor: "text-amber-700",
    },
    {
      title: "Alat Terkalibrasi",
      value: data.jumlahKalibrasi ?? 0,
      sub: "Unit Alkes Laik",
      icon: Activity,
      iconColor: "text-teal-600 bg-teal-50",
      subColor: "text-teal-700",
    },
    {
      title: "Insiden K3",
      value: data.totalInsiden ?? 0,
      sub: `${data.insidenSelesai || 0} Kasus Ditangani`,
      icon: ShieldAlert,
      iconColor: "text-rose-600 bg-rose-50",
      subColor: "text-rose-700",
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
        <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Dashboard Monitoring SIKELA</h2>
        <p className="text-sm text-slate-500 mt-1">
          Ringkasan kondisi fasilitas per ruangan, kepatuhan inspeksi, kalibrasi alkes, dan manajemen risiko Puskesmas.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {statCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <div
              key={i}
              className={`p-3.5 sm:p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs flex flex-col justify-between h-full transition hover:shadow-sm ${
                i === 4 ? "col-span-2 sm:col-span-1 lg:col-span-1" : ""
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider truncate">
                  {card.title}
                </span>
                <div className={`w-7 h-7 rounded-xl ${card.iconColor} flex items-center justify-center shrink-0`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-black text-slate-900 tracking-tight my-1.5">{card.value}</p>
              <p className={`text-xs font-medium flex items-center gap-1 truncate ${card.subColor}`}>
                <Icon className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{card.sub}</span>
              </p>
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
                  <td className="px-4 py-3.5">
                    <div className="font-semibold text-slate-900">{room.name}</div>
                    {room.damage_description && (
                      <div className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-0.5 mt-1 inline-block">
                        Kerusakan: {room.damage_description}
                      </div>
                    )}
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
