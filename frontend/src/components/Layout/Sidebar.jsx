import React from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  PackageCheck,
  ShieldCheck,
  AlertTriangle,
  FileSpreadsheet,
  Users,
  Building2,
  X,
  LogOut,
  Shield,
  UserCheck,
  Settings,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";

const menus = [
  { name: "01. Dashboard", path: "/", icon: LayoutDashboard },
  { name: "02. Ruangan & Klaster", path: "/ruangan", icon: Building2 },
  { name: "03. Inventarisasi", path: "/inventarisasi", icon: PackageCheck },
  { name: "04. Fasilitas & Utilitas", path: "/fasilitas-utilitas", icon: ShieldCheck },
  { name: "05. Insiden & Risiko", path: "/insiden-risiko", icon: AlertTriangle },
  { name: "06. Laporan Periodik", path: "/laporan-periodik", icon: FileSpreadsheet },
  { name: "07. Manajemen User", path: "/users", icon: Users },
  { name: "08. Pengaturan KOP & Sistem", path: "/pengaturan", icon: Settings },
];

export default function Sidebar({ isOpen, setIsOpen }) {
  const { user, logout } = useAuth();

  const getRoleLabel = (role) => {
    switch (role) {
      case "admin":
        return "Admin MFK";
      case "pimpinan":
        return "Kepala Puskesmas";
      case "pj_ruangan":
        return "PJ Ruangan";
      default:
        return "Petugas Lapangan";
    }
  };

  return (
    <>
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 bg-black/50 backdrop-blur-xs z-30 lg:hidden"
        />
      )}
      <aside
        className={`fixed top-0 left-0 z-40 h-screen w-64 bg-slate-900 text-white flex flex-col justify-between transition-transform duration-300 lg:translate-x-0 border-r border-slate-800 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div>
          {/* Logo Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800 bg-slate-950/40">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                <Building2 className="w-6 h-6" />
              </div>
              <div>
                <h1 className="font-bold text-base tracking-wide text-white">SIKELA</h1>
                <p className="text-[11px] text-emerald-400 font-medium">UPTD Puskesmas Muara Kulam</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1.5">
            {menus
              .filter((item) => {
                if (item.path === "/users" || item.path === "/pengaturan") {
                  return user?.role === "admin";
                }
                return true;
              })
              .map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={() => setIsOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition ${
                        isActive
                          ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-900/30"
                          : "text-slate-300 hover:bg-slate-800/80 hover:text-white"
                      }`
                    }
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.name}</span>
                  </NavLink>
                );
              })}
          </nav>
        </div>

        {/* User Card & Logout Button */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/30">
          {user ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3 px-2 py-1">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 font-bold flex items-center justify-center text-sm shadow">
                  {user.name ? user.name.charAt(0).toUpperCase() : "U"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-white truncate">{user.name}</p>
                  <p className="text-[11px] text-emerald-400 font-medium truncate">
                    {getRoleLabel(user.role)}
                  </p>
                </div>
              </div>
              <button
                onClick={logout}
                className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-slate-800/80 hover:bg-rose-500/20 hover:text-rose-400 text-slate-300 text-xs font-medium border border-slate-700/60 hover:border-rose-500/30 transition cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Keluar (Logout)</span>
              </button>
            </div>
          ) : (
            <NavLink
              to="/login"
              className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium transition"
            >
              <span>Masuk (Login)</span>
            </NavLink>
          )}
        </div>
      </aside>
    </>
  );
}
