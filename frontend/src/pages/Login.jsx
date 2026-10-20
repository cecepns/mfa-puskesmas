import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  Building2,
  ShieldCheck,
  Lock,
  User,
  Eye,
  EyeOff,
  ArrowRight,
  Sparkles,
} from "lucide-react";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const { login, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || "/";

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password) return;
    const res = await login(username, password);
    if (res.success) {
      navigate(from, { replace: true });
    }
  };

  const handleQuickLogin = (u, p) => {
    setUsername(u);
    setPassword(p);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative">
      <div className="sm:mx-auto sm:w-full sm:max-w-md px-4">
        {/* Brand Header */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl shadow-xs mb-4">
            <Building2 className="w-9 h-9 text-emerald-600" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            SIKELA
          </h1>
          <p className="mt-1 text-sm font-semibold text-emerald-800">
            Sistem Informasi Kelola Fasilitas dan Keselamatan
          </p>
          <p className="text-xs text-slate-500 mt-0.5">
            UPTD Puskesmas Muara Kulam
          </p>
          <div className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 border border-emerald-200/80 rounded-full text-xs font-semibold text-emerald-800">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            Standar Akreditasi Puskesmas Kemenkes RI
          </div>
        </div>

        {/* Clean White Card Form */}
        <div className="mt-8 bg-white py-8 px-6 shadow-sm rounded-3xl border border-slate-200 sm:px-10">
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                Username atau Email
              </label>
              <div className="relative rounded-xl shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="h-5 h-5" />
                </div>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Masukkan username atau email"
                  className="block w-full pl-11 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                Kata Sandi
              </label>
              <div className="relative rounded-xl shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="h-5 h-5" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan kata sandi"
                  className="block w-full pl-11 pr-11 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] shadow-md shadow-emerald-600/20 transition disabled:opacity-60 cursor-pointer"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  Memverifikasi...
                </span>
              ) : (
                <>
                  <span>Masuk ke Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Access */}
          <div className="mt-6 pt-6 border-t border-slate-100">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                Pilihan Cepat Demo Akun
              </span>
              <span className="text-[11px] text-slate-400">Klik untuk isi form</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => handleQuickLogin("admin", "admin123")}
                className="p-2.5 text-left border border-slate-200 rounded-xl hover:bg-emerald-50 hover:border-emerald-300 transition group cursor-pointer"
              >
                <div className="font-semibold text-slate-800 group-hover:text-emerald-700">Admin MFK</div>
                <div className="text-[10px] text-slate-400 font-mono">admin / admin123</div>
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin("pimpinan", "pimpinan123")}
                className="p-2.5 text-left border border-slate-200 rounded-xl hover:bg-blue-50 hover:border-blue-300 transition group cursor-pointer"
              >
                <div className="font-semibold text-slate-800 group-hover:text-blue-700">Kepala Puskesmas</div>
                <div className="text-[10px] text-slate-400 font-mono">pimpinan / pimpinan123</div>
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin("petugas1", "petugas123")}
                className="p-2.5 text-left border border-slate-200 rounded-xl hover:bg-teal-50 hover:border-teal-300 transition group cursor-pointer"
              >
                <div className="font-semibold text-slate-800 group-hover:text-teal-700">Petugas Sanitasi</div>
                <div className="text-[10px] text-slate-400 font-mono">petugas1 / petugas123</div>
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin("bidan_rina", "bidan123")}
                className="p-2.5 text-left border border-slate-200 rounded-xl hover:bg-purple-50 hover:border-purple-300 transition group cursor-pointer"
              >
                <div className="font-semibold text-slate-800 group-hover:text-purple-700">PJ Ruangan (KIA)</div>
                <div className="text-[10px] text-slate-400 font-mono">bidan_rina / bidan123</div>
              </button>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="mt-8 text-center text-xs text-slate-400">
          <p>© 2026 UPTD Puskesmas • Terintegrasi Dokumen Bukti Standar MFK 1-10.</p>
        </div>
      </div>
    </div>
  );
}
