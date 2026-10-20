import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  ShieldCheck,
  Lock,
  User,
  Eye,
  EyeOff,
  ArrowRight,
  Sparkles,
  Download,
  Smartphone,
  CheckCircle2,
  Share,
  PlusSquare,
  X,
  HelpCircle,
} from "lucide-react";
import logoImg from "../assets/logo.png";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const { login, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // PWA Install State
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showIosGuide, setShowIosGuide] = useState(false);

  const from = location.state?.from?.pathname || "/";

  useEffect(() => {
    // Check if app is already running as PWA / installed
    const isStandaloneMode =
      window.matchMedia("(display-mode: standalone)").matches ||
      window.navigator.standalone === true;
    setIsStandalone(Boolean(isStandaloneMode));

    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setIsInstallable(false);
      }
      setDeferredPrompt(null);
    } else {
      // Show manual guide modal (especially for iOS Safari or browsers where prompt event isn't supported)
      setShowIosGuide(true);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password) return;
    const res = await login(username, password);
    if (res.success) {
      navigate(from, { replace: true });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-10 sm:px-6 lg:px-8 relative">
      <div className="sm:mx-auto sm:w-full sm:max-w-md px-4">
        {/* Brand Header with Logo */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center p-2.5 bg-white border border-slate-200/90 rounded-2xl shadow-sm mb-3">
            <img
              src={logoImg}
              alt="Logo Puskesmas Muara Kulam"
              className="w-16 h-16 sm:w-20 sm:h-20 object-contain drop-shadow-xs"
            />
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
        <div className="mt-7 bg-white py-8 px-6 shadow-sm rounded-3xl border border-slate-200 sm:px-10">
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

          {/* PWA Install Banner */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            {isStandalone ? (
              <div className="flex items-center justify-center gap-2 p-3 bg-emerald-50/70 border border-emerald-200/60 rounded-2xl text-xs text-emerald-800 font-medium">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Aplikasi SIKELA telah terpasang di perangkat</span>
              </div>
            ) : (
              <div className="bg-gradient-to-r from-emerald-50/80 via-teal-50/60 to-emerald-50/80 border border-emerald-200/80 rounded-2xl p-3.5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 p-1 bg-white border border-slate-200/90 rounded-xl shadow-xs shrink-0 flex items-center justify-center">
                      <img src={logoImg} alt="SIKELA Logo" className="w-full h-full object-contain" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900">
                        Install Aplikasi SIKELA (PWA)
                      </div>
                      <p className="text-[11px] text-slate-600 mt-0.5">
                        Akses lebih cepat langsung dari layar utama HP atau Laptop tanpa browser bar.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleInstallClick}
                    className="flex-1 inline-flex items-center justify-center gap-2 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white text-xs font-semibold rounded-xl shadow-xs transition cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Install Aplikasi Sekarang</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowIosGuide(true)}
                    className="p-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 rounded-xl text-xs transition cursor-pointer"
                    title="Petunjuk Install di iPhone / Browser Lain"
                  >
                    <HelpCircle className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer info */}
        <div className="mt-8 text-center text-xs text-slate-400">
          <p>© 2026 UPTD Puskesmas Muara Kulam • SIKELA</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Terintegrasi Dokumen Bukti Standar MFK 1-10 Kemenkes RI</p>
        </div>
      </div>

      {/* iOS / Browser Install Guide Modal */}
      {showIosGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-xl border border-slate-100 relative">
            <button
              onClick={() => setShowIosGuide(false)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-11 h-11 p-1 bg-white border border-slate-200/90 rounded-2xl shadow-xs shrink-0 flex items-center justify-center">
                <img src={logoImg} alt="SIKELA Logo" className="w-full h-full object-contain" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Cara Pasang SIKELA di HP</h3>
                <p className="text-xs text-slate-500">Panduan Tambah ke Layar Utama</p>
              </div>
            </div>

            <div className="space-y-3 text-xs text-slate-600">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70 flex items-start gap-2.5">
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-600 text-white text-[11px] font-bold shrink-0 mt-0.5">
                  1
                </span>
                <div>
                  <div className="font-semibold text-slate-800">Di iPhone / iPad (Safari):</div>
                  <p className="mt-0.5 flex items-center gap-1 text-[11px]">
                    Ketuk tombol Bagikan <Share className="w-3.5 h-3.5 inline text-blue-600" /> di bilah bawah browser.
                  </p>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70 flex items-start gap-2.5">
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-600 text-white text-[11px] font-bold shrink-0 mt-0.5">
                  2
                </span>
                <div>
                  <div className="font-semibold text-slate-800">Pilih Tambah ke Layar Utama:</div>
                  <p className="mt-0.5 flex items-center gap-1 text-[11px]">
                    Pilih menu <PlusSquare className="w-3.5 h-3.5 inline text-slate-700" /> <b>"Add to Home Screen"</b>.
                  </p>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70 flex items-start gap-2.5">
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-600 text-white text-[11px] font-bold shrink-0 mt-0.5">
                  3
                </span>
                <div>
                  <div className="font-semibold text-slate-800">Di Android (Chrome / Edge):</div>
                  <p className="mt-0.5 text-[11px]">
                    Ketuk tombol titik tiga di sudut kanan atas, lalu pilih <b>"Install App"</b> atau <b>"Tambahkan ke Layar Utama"</b>.
                  </p>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowIosGuide(false)}
              className="mt-5 w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs rounded-xl transition cursor-pointer"
            >
              Mengerti, Tutup Panduan
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
