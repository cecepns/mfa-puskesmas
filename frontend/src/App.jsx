import React, { useState } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation, Outlet } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { Menu, LogOut } from "lucide-react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Sidebar from "./components/Layout/Sidebar";
import Dashboard from "./pages/Dashboard";
import Inventarisasi from "./pages/Inventarisasi";
import FasilitasUtilitas from "./pages/FasilitasUtilitas";
import InsidenRisiko from "./pages/InsidenRisiko";
import LaporanPeriodik from "./pages/LaporanPeriodik";
import ManajemenUser from "./pages/ManajemenUser";
import MasterRuangan from "./pages/MasterRuangan";
import Pengaturan from "./pages/Pengaturan";
import Login from "./pages/Login";

function ProtectedLayout() {
  const { isAuthenticated, user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
      <div className="flex-1 lg:ml-64 flex flex-col min-w-0">
        <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 px-6 py-3.5 flex items-center justify-between sticky top-0 z-20 shadow-xs">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 cursor-pointer"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex flex-col">
              <span className="text-sm font-bold text-slate-800 tracking-tight">
                SIKELA (Sistem Informasi Kelola Fasilitas dan Keselamatan)
              </span>
              <span className="text-xs text-slate-500">UPTD Puskesmas Muara Kulam • Akreditasi Standar MFK 1-10</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-xl text-xs border border-slate-200/60">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="font-semibold text-slate-700">{user?.name}</span>
              <span className="text-slate-400">•</span>
              <span className="font-bold text-emerald-700 uppercase text-[10px] bg-emerald-100 px-2 py-0.5 rounded-md">
                {user?.role}
              </span>
            </div>
            <button
              onClick={logout}
              title="Keluar dari sistem"
              className="flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-rose-600 px-2.5 py-1.5 rounded-xl border border-slate-200 hover:border-rose-200 hover:bg-rose-50 transition cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </header>

        <main className="p-4 sm:p-6 lg:p-8 flex-1 w-full">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster position="top-right" toastOptions={{ duration: 3500 }} />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route element={<ProtectedLayout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/ruangan" element={<MasterRuangan />} />
            <Route path="/inventarisasi" element={<Inventarisasi />} />
            <Route path="/fasilitas-utilitas" element={<FasilitasUtilitas />} />
            <Route path="/insiden-risiko" element={<InsidenRisiko />} />
            <Route path="/laporan-periodik" element={<LaporanPeriodik />} />
            <Route path="/users" element={<ManajemenUser />} />
            <Route path="/pengaturan" element={<Pengaturan />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
