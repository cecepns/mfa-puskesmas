import React, { useState, useEffect, useRef } from "react";
import {
  Building2,
  User,
  ShieldCheck,
  Save,
  RotateCcw,
  CheckCircle2,
  FileSpreadsheet,
  Printer,
  Sparkles,
  Info,
  Lock,
  Upload,
  Image as ImageIcon,
  Trash2,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { request } from "../utils/request";
import { API_ENDPOINTS } from "../utils/endpoints";
import toast from "react-hot-toast";
import { DEFAULT_KOP_CONFIG } from "../utils/pdfGenerator";
import defaultLogoPuskesmas from "../assets/logo-puskesmas.png";

export default function Pengaturan() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState(DEFAULT_KOP_CONFIG);
  const fileInputRef = useRef(null);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await request.get(API_ENDPOINTS.SETTINGS.GET);
      if (res.data) {
        setConfig({ ...DEFAULT_KOP_CONFIG, ...res.data });
      }
    } catch (err) {
      toast.error("Gagal memuat pengaturan dari server");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleChange = (field, value) => {
    setConfig((prev) => ({ ...prev, [field]: value }));
  };

  // Handle Logo Upload & Convert to clean base64 data URL
  const handleLogoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Format file harus berupa gambar (PNG, JPG, atau JPEG)");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        // Resize / compress inside canvas to max 400x400 to keep base64 lightweight (~25-40KB)
        const canvas = document.createElement("canvas");
        const maxDim = 400;
        let w = img.width;
        let h = img.height;
        if (w > maxDim || h > maxDim) {
          if (w > h) {
            h = Math.round((h * maxDim) / w);
            w = maxDim;
          } else {
            w = Math.round((w * maxDim) / h);
            h = maxDim;
          }
        }
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, w, h);
        const dataUrl = canvas.toDataURL("image/png");
        handleChange("logoUrl", dataUrl);
        toast.success("Logo KOP berhasil dimuat! Klik 'Simpan Pengaturan' untuk menyimpan ke database.");
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleResetLogo = () => {
    handleChange("logoUrl", null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    toast("Logo KOP dikembalikan ke logo default Puskesmas.");
  };

  const handleSave = async (e) => {
    e?.preventDefault();
    setSaving(true);
    try {
      await request.put(API_ENDPOINTS.SETTINGS.UPDATE, config);
      // Simpan juga ke localStorage sebagai cache sinkronisasi cepat
      try {
        localStorage.setItem("mfk_kop_config", JSON.stringify(config));
      } catch {}
      toast.success("Pengaturan KOP, Logo & Pimpinan berhasil disimpan ke database!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Gagal menyimpan pengaturan ke database");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (window.confirm("Kembalikan seluruh teks KOP, Logo dan Pejabat ke setelan awal Puskesmas?")) {
      setConfig(DEFAULT_KOP_CONFIG);
      if (fileInputRef.current) fileInputRef.current.value = "";
      toast("Pengaturan dikembalikan ke format default, klik 'Simpan Perubahan' untuk memperbarui database.");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-sm text-slate-500 font-medium">Memuat pengaturan dari database...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="max-w-xl mx-auto py-16 text-center space-y-4">
        <div className="p-4 bg-rose-50 text-rose-600 rounded-2xl border border-rose-200 inline-block">
          <Lock className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold text-slate-800">Akses Terbatas: Khusus Administrator</h3>
        <p className="text-sm text-slate-500 max-w-md mx-auto">
          Halaman konfigurasi KOP surat resmi dan pejabat penandatangan dokumen SIKELA hanya dapat diakses dan diubah oleh akun Administrator.
        </p>
      </div>
    );
  }

  const activeLogo = config.logoUrl || defaultLogoPuskesmas;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold text-slate-800 tracking-tight">
              08. Pengaturan KOP Surat & Pejabat
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> Database MySQL
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Konfigurasi identitas resmi Puskesmas, logo KOP surat laporan akreditasi, serta nama Kepala Puskesmas dan Penanggung Jawab MFK.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-semibold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition cursor-pointer"
          >
            <RotateCcw className="w-4 h-4 text-slate-400" />
            <span>Reset Default</span>
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm rounded-xl shadow-md shadow-emerald-600/20 transition cursor-pointer disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? "Menyimpan ke DB..." : "Simpan Perubahan"}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Form Fields (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <form onSubmit={handleSave} className="space-y-6">
            {/* CARD LOGO KOP SURAT */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="p-4 sm:p-5 border-b border-slate-100 bg-slate-50/70 flex items-center gap-2.5">
                <div className="p-2 bg-emerald-100 text-emerald-700 rounded-xl">
                  <ImageIcon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-sm">
                    Logo Resmi Instansi / Puskesmas (KOP Surat)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Akan dicetak di sudut kiri KOP Surat pada dokumen PDF, lembar pengesahan, dan print out
                  </p>
                </div>
              </div>

              <div className="p-5 sm:p-6 space-y-4">
                <div className="flex flex-col sm:flex-row items-center gap-5">
                  <div className="w-24 h-24 rounded-2xl bg-slate-50 border-2 border-dashed border-slate-300 p-2 flex items-center justify-center shrink-0 shadow-inner">
                    <img
                      src={activeLogo}
                      alt="Logo KOP Surat"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div className="space-y-2 text-center sm:text-left flex-1">
                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleLogoUpload}
                        accept="image/png, image/jpeg, image/jpg"
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs transition cursor-pointer"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>{config.logoUrl ? "Ganti Logo KOP" : "Upload Logo Baru"}</span>
                      </button>
                      {config.logoUrl && (
                        <button
                          type="button"
                          onClick={handleResetLogo}
                          className="inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 rounded-xl text-xs font-semibold transition cursor-pointer"
                        >
                          <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
                          <span>Gunakan Logo Default</span>
                        </button>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      {config.logoUrl ? (
                        <span className="text-emerald-700 font-medium">✓ Menggunakan logo kustom yang diunggah.</span>
                      ) : (
                        <span>Menggunakan logo default: <b className="text-slate-700">logo-puskesmas.png</b> (Kemenkes RI).</span>
                      )}
                      <br />
                      Format: PNG / JPG transparan. Logo otomatis diposisikan proporsional di kiri KOP surat.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* CARD 1: KOP SURAT RESMI */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="p-4 sm:p-5 border-b border-slate-100 bg-slate-50/70 flex items-center gap-2.5">
                <div className="p-2 bg-emerald-100 text-emerald-700 rounded-xl">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-sm">
                    Teks KOP Surat Resmi & Identitas Instansi
                  </h3>
                  <p className="text-xs text-slate-500">
                    Akan tercetak di bagian atas setiap PDF Laporan Periodik dan Print Out
                  </p>
                </div>
              </div>

              <div className="p-5 sm:p-6 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Pemerintah Daerah / Instansi Induk (Baris 1)
                  </label>
                  <input
                    type="text"
                    value={config.instansiInduk || ""}
                    onChange={(e) => handleChange("instansiInduk", e.target.value)}
                    placeholder="Contoh: PEMERINTAH DAERAH KABUPATEN BOGOR"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">Dicetak huruf kapital ukuran sedang</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Dinas Kesehatan (Baris 2)
                  </label>
                  <input
                    type="text"
                    value={config.dinasKesehatan || ""}
                    onChange={(e) => handleChange("dinasKesehatan", e.target.value)}
                    placeholder="Contoh: DINAS KESEHATAN KABUPATEN BOGOR"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Nama Unit Pelaksana Teknis / Puskesmas (Baris Utama)
                  </label>
                  <input
                    type="text"
                    value={config.namaPuskesmas || ""}
                    onChange={(e) => handleChange("namaPuskesmas", e.target.value)}
                    placeholder="Contoh: UPTD PUSKESMAS MUARA KULAM"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Alamat, Telepon & Pos-el (Sub-Header)
                    </label>
                    <input
                      type="text"
                      value={config.alamatKontak || ""}
                      onChange={(e) => handleChange("alamatKontak", e.target.value)}
                      placeholder="Jl. Kesehatan No. 01, Telp: (021) 1234567 | Pos-el: puskesmas@dinkes.go.id"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Kota Penetapan Laporan
                    </label>
                    <input
                      type="text"
                      value={config.kotaDokumen || ""}
                      onChange={(e) => handleChange("kotaDokumen", e.target.value)}
                      placeholder="Contoh: Muara Kulam"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* CARD 2: PIMPINAN (MENGETAHUI & MENYETUJUI) */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="p-4 sm:p-5 border-b border-slate-100 bg-slate-50/70 flex items-center gap-2.5">
                <div className="p-2 bg-blue-100 text-blue-700 rounded-xl">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-sm">
                    Pimpinan yang Mengetahui & Menyetujui (Kepala Puskesmas)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Posisi tanda tangan kiri pada lembar pengesahan dan footer laporan MFK
                  </p>
                </div>
              </div>

              <div className="p-5 sm:p-6 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Jabatan Pimpinan
                    </label>
                    <input
                      type="text"
                      value={config.pimpinanJabatan || ""}
                      onChange={(e) => handleChange("pimpinanJabatan", e.target.value)}
                      placeholder="Kepala UPTD Puskesmas"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      NIP Pimpinan
                    </label>
                    <input
                      type="text"
                      value={config.pimpinanNip || ""}
                      onChange={(e) => handleChange("pimpinanNip", e.target.value)}
                      placeholder="19780512 200501 1 008"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Nama Lengkap & Gelar Pimpinan
                  </label>
                  <input
                    type="text"
                    value={config.pimpinanNama || ""}
                    onChange={(e) => handleChange("pimpinanNama", e.target.value)}
                    placeholder="Contoh: dr. H. Ahmad Fauzi, M.Kes"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
            </div>

            {/* CARD 3: PENANGGUNG JAWAB MFK (PELAPOR) */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="p-4 sm:p-5 border-b border-slate-100 bg-slate-50/70 flex items-center gap-2.5">
                <div className="p-2 bg-purple-100 text-purple-700 rounded-xl">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-sm">
                    Penanggung Jawab Pelapor (Tim MFK & Sanitasi)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Posisi tanda tangan kanan pada lembar pengesahan dan footer dokumen
                  </p>
                </div>
              </div>

              <div className="p-5 sm:p-6 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Jabatan Pelapor
                    </label>
                    <input
                      type="text"
                      value={config.pelaporJabatan || ""}
                      onChange={(e) => handleChange("pelaporJabatan", e.target.value)}
                      placeholder="Penanggung Jawab MFK & K3"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Keterangan / Koordinator
                    </label>
                    <input
                      type="text"
                      value={config.pelaporKeterangan || ""}
                      onChange={(e) => handleChange("pelaporKeterangan", e.target.value)}
                      placeholder="Koordinator Fasilitas & Keselamatan"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Nama Pejabat / Pelapor
                  </label>
                  <input
                    type="text"
                    value={config.pelaporNama || ""}
                    onChange={(e) => handleChange("pelaporNama", e.target.value)}
                    placeholder="Contoh: Administrator MFK / Tim Sanitasi"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={handleReset}
                className="px-4 py-2.5 text-xs font-semibold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition cursor-pointer"
              >
                Reset Default
              </button>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm rounded-xl shadow-md shadow-emerald-600/20 transition cursor-pointer disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? "Menyimpan ke Server..." : "Simpan Pengaturan"}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Right Column: Live Document Preview (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="sticky top-24 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                <span>Live Preview KOP & Pengesahan</span>
              </h3>
              <span className="text-[11px] text-slate-400 font-medium">Format Dokumen Resmi</span>
            </div>

            {/* Document Preview Box */}
            <div className="bg-white rounded-2xl border-2 border-slate-200 p-6 shadow-md space-y-6">
              {/* KOP Surat Preview with Logo on Left */}
              <div className="pb-3 border-b-2 border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 shrink-0 flex items-center justify-center">
                    <img
                      src={activeLogo}
                      alt="Logo Puskesmas"
                      className="w-full h-full object-contain drop-shadow-2xs"
                    />
                  </div>
                  <div className="flex-1 text-center space-y-0.5">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-600">
                      {config.instansiInduk || "PEMERINTAH KABUPATEN / KOTA"}
                    </p>
                    <p className="text-xs font-extrabold uppercase tracking-wide text-slate-800">
                      {config.dinasKesehatan || "DINAS KESEHATAN"}
                    </p>
                    <h4 className="text-sm font-black uppercase text-emerald-700 tracking-wide">
                      {config.namaPuskesmas || "UPTD PUSKESMAS"}
                    </h4>
                    <p className="text-[8.5px] text-slate-500 leading-tight">
                      {config.alamatKontak || "Jl. Kesehatan No. 01"}
                    </p>
                  </div>
                </div>
                <div className="mt-2 pt-1 border-t border-slate-300 text-center">
                  <p className="text-[10px] font-bold text-slate-900 uppercase">
                    LAPORAN PROGRAM MANAJEMEN FASILITAS DAN KESELAMATAN (MFK)
                  </p>
                </div>
              </div>

              {/* Sample Table Mock */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-600 space-y-1">
                <div className="flex justify-between font-medium">
                  <span>Unit / Bagian:</span>
                  <span className="font-semibold text-slate-800">Standar MFK 1-10 Akreditasi</span>
                </div>
                <div className="flex justify-between">
                  <span>Ditetapkan di:</span>
                  <span className="font-semibold text-slate-800">{config.kotaDokumen || "Puskesmas"}</span>
                </div>
              </div>

              {/* Signature Preview */}
              <div className="pt-2 border-t border-slate-200 space-y-1">
                <p className="text-[10px] text-right text-slate-500">
                  {config.kotaDokumen || "Puskesmas"},{" "}
                  {new Date().toLocaleDateString("id-ID", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
                <div className="grid grid-cols-2 gap-4 text-center text-[10px] pt-3">
                  <div className="space-y-10">
                    <div>
                      <p className="text-slate-500">Mengetahui & Menyetujui,</p>
                      <p className="font-bold text-slate-800">{config.pimpinanJabatan || "Kepala Puskesmas"}</p>
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 underline">{config.pimpinanNama || "Nama Pimpinan"}</p>
                      <p className="text-slate-500 text-[9px]">NIP. {config.pimpinanNip || "-"}</p>
                    </div>
                  </div>

                  <div className="space-y-10">
                    <div>
                      <p className="text-slate-500">Dilaporkan Oleh,</p>
                      <p className="font-bold text-slate-800">{config.pelaporJabatan || "PJ MFK & K3"}</p>
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 underline">{config.pelaporNama || "Nama Pelapor"}</p>
                      <p className="text-slate-500 text-[9px]">{config.pelaporKeterangan || "Koordinator"}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Helper Info Card */}
            <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-900 flex items-start gap-2.5">
              <Info className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
              <div>
                <b>Tersinkronisasi Otomatis:</b> Setiap kali Anda menyimpan pengaturan ini, logo dan data instansi tersimpan di tabel <code className="bg-emerald-100 px-1 py-0.5 rounded text-[11px] font-mono">app_settings</code> MySQL dan secara otomatis dicetak pada PDF laporan gabungan, per inspeksi, per modul inventaris (Barang, B3, Alkes), serta print preview.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
