import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import {
  Star,
  Send,
  Building,
  User,
  Phone,
  Camera,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Sparkles,
  HeartHandshake,
  MessageSquare,
  ChevronRight,
  ArrowLeft,
  X,
} from "lucide-react";
import axios from "axios";
import { api } from "../utils/api";
import { API_ENDPOINTS } from "../utils/endpoints";
import defaultLogo from "../assets/logo-puskesmas.png";

const CATEGORIES = [
  "Sarana dan Prasarana",
  "Kebersihan & Sanitasi",
  "Kualitas Pelayanan",
  "Petugas",
  "Lainnya",
];

export default function PengaduanPublik() {
  const [searchParams] = useSearchParams();
  const preselectedRoomId = searchParams.get("room_id") || "";

  const [info, setInfo] = useState({
    namaPuskesmas: "UPTD PUSKESMAS MUARA KULAM",
    dinasKesehatan: "DINAS KESEHATAN KABUPATEN / KOTA",
    instansiInduk: "PEMERINTAH KABUPATEN / KOTA",
    alamatKontak: "Jl. Lintas Muara Kulam",
    logoUrl: null,
  });

  const [rooms, setRooms] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [submittedTicket, setSubmittedTicket] = useState(null);

  // Form State
  const [ratingPelayanan, setRatingPelayanan] = useState(5);
  const [ratingPetugas, setRatingPetugas] = useState(5);
  const [ratingSarpras, setRatingSarpras] = useState(5);
  const [category, setCategory] = useState("Sarana dan Prasarana");
  const [roomId, setRoomId] = useState(preselectedRoomId);
  const [visitorName, setVisitorName] = useState("");
  const [visitorPhone, setVisitorPhone] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [complaintText, setComplaintText] = useState("");
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);

  useEffect(() => {
    // Fetch public puskesmas info
    api
      .get(API_ENDPOINTS.FEEDBACKS.PUBLIC_INFO)
      .then((res) => {
        if (res.data?.data) setInfo((prev) => ({ ...prev, ...res.data.data }));
      })
      .catch(() => {});

    // Fetch public room list
    api
      .get(API_ENDPOINTS.FEEDBACKS.PUBLIC_ROOMS)
      .then((res) => {
        if (res.data?.data) {
          setRooms(res.data.data);
          if (preselectedRoomId && res.data.data.some((r) => String(r.id) === String(preselectedRoomId))) {
            setRoomId(preselectedRoomId);
          }
        }
      })
      .catch(() => {});
  }, [preselectedRoomId]);

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Ukuran foto maksimal 5 MB");
        return;
      }
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const removePhoto = () => {
    setPhotoFile(null);
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setPhotoPreview(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!complaintText.trim()) {
      toast.error("Mohon isi saran, masukan, atau keluhan Anda");
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("category", category);
      formData.append("rating_pelayanan", ratingPelayanan);
      formData.append("rating_petugas", ratingPetugas);
      formData.append("rating_sarpras", ratingSarpras);
      if (roomId) formData.append("room_id", roomId);
      formData.append("visitor_name", isAnonymous ? "Pengunjung Anonim" : visitorName);
      if (!isAnonymous && visitorPhone) formData.append("visitor_phone", visitorPhone);
      formData.append("complaint_text", complaintText.trim());
      if (photoFile) formData.append("photo", photoFile);

      const res = await api.post(API_ENDPOINTS.FEEDBACKS.PUBLIC_SUBMIT, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (res.data?.success) {
        setSubmittedTicket(res.data.ticket_number || "ADU-OK");
        toast.success("Pengaduan & penilaian berhasil dikirim!");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Gagal mengirim pengaduan. Silakan coba lagi.");
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setSubmittedTicket(null);
    setRatingPelayanan(5);
    setRatingPetugas(5);
    setRatingSarpras(5);
    setCategory("Sarana dan Prasarana");
    setRoomId("");
    setVisitorName("");
    setVisitorPhone("");
    setIsAnonymous(false);
    setComplaintText("");
    removePhoto();
  };

  const renderStarRating = (label, sublabel, value, onChange) => {
    return (
      <div className="bg-slate-50/80 border border-slate-200/80 rounded-2xl p-4 transition-all">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-2.5">
          <div>
            <p className="font-bold text-slate-800 text-sm">{label}</p>
            <p className="text-[11px] text-slate-500">{sublabel}</p>
          </div>
          <span className="text-xs font-bold text-emerald-700 bg-emerald-100/80 px-2.5 py-0.5 rounded-full self-start sm:self-auto">
            {value === 5
              ? "Sangat Baik (5/5)"
              : value === 4
              ? "Baik (4/5)"
              : value === 3
              ? "Cukup (3/5)"
              : value === 2
              ? "Kurang (2/5)"
              : "Sangat Buruk (1/5)"}
          </span>
        </div>
        <div className="flex items-center gap-2 pt-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              type="button"
              key={star}
              onClick={() => onChange(star)}
              className="p-1 text-slate-300 hover:text-amber-400 focus:outline-none transition-transform active:scale-125 cursor-pointer"
            >
              <Star
                className={`w-7 h-7 sm:w-8 sm:h-8 transition-colors ${
                  star <= value
                    ? "text-amber-400 fill-amber-400 drop-shadow-xs"
                    : "text-slate-300"
                }`}
              />
            </button>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-slate-50 to-teal-50 py-6 px-3 sm:px-6">
      <div className="max-w-xl mx-auto space-y-4">
        {/* Header Kartu Profil Puskesmas */}
        <div className="bg-white/95 backdrop-blur-md rounded-3xl p-5 sm:p-6 border border-emerald-100 shadow-sm text-center relative overflow-hidden">
          <div className="absolute -top-12 -right-12 w-32 h-32 bg-emerald-500/10 rounded-full blur-xl pointer-events-none" />
          <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-teal-500/10 rounded-full blur-xl pointer-events-none" />

          <div className="flex flex-col items-center relative z-10">
            <div className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-200 p-2 shadow-xs mb-3 flex items-center justify-center">
              <img
                src={info.logoUrl || defaultLogo}
                alt="Logo Puskesmas"
                className="w-full h-full object-contain"
                onError={(e) => {
                  e.target.src = defaultLogo;
                }}
              />
            </div>
            <span className="text-[11px] font-bold tracking-wider uppercase text-emerald-700 bg-emerald-100/70 px-3 py-1 rounded-full mb-1">
              Survei & Pengaduan Fasilitas Publik
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {info.namaPuskesmas}
            </h1>
            <p className="text-xs text-slate-500 mt-1 max-w-sm">
              Sistem Informasi Kelola Fasilitas, Sanitasi & Keselamatan (SIKELA). Masukan Anda sangat berarti bagi peningkatan kenyamanan bersama.
            </p>
          </div>
        </div>

        {/* TAMPILAN JIKA BERHASIL KIRIM (SUCCESS STATE) */}
        {submittedTicket ? (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-emerald-200 shadow-sm text-center space-y-5 animate-in fade-in duration-300">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-extrabold text-slate-900">
                Terima Kasih Atas Masukan Anda!
              </h2>
              <p className="text-sm text-slate-600">
                Penilaian dan pengaduan Anda telah kami terima dan langsung diteruskan kepada tim Manajemen Fasilitas dan Keselamatan (MFK) Puskesmas.
              </p>
            </div>

            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl inline-block max-w-xs w-full">
              <p className="text-[11px] font-semibold text-emerald-800 uppercase tracking-wider">
                Nomor Tiket Pengaduan
              </p>
              <p className="text-xl font-mono font-black text-emerald-950 mt-1">
                {submittedTicket}
              </p>
              <p className="text-[11px] text-emerald-700 mt-1">
                Simpan nomor tiket ini untuk pengecekan status tindak lanjut.
              </p>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={resetForm}
                className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-2xl shadow-md shadow-emerald-600/20 transition cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Kirim Masukan Baru</span>
              </button>
            </div>
          </div>
        ) : (
          /* FORMULIR PENGADUAN & PENILAIAN */
          <form
            onSubmit={handleSubmit}
            className="bg-white rounded-3xl p-5 sm:p-7 border border-slate-200 shadow-sm space-y-6"
          >
            {/* Bagian 1: Bintang Penilaian 3 Aspek Utama */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 pb-1 border-b border-slate-100">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                <h3 className="font-extrabold text-slate-900 text-sm uppercase tracking-wide">
                  Penilaian Kepuasan Fasilitas
                </h3>
              </div>

              {renderStarRating(
                "1. Kualitas Pelayanan Puskesmas",
                "Kecepatan, ketertiban, dan kejelasan alur layanan",
                ratingPelayanan,
                setRatingPelayanan
              )}

              {renderStarRating(
                "2. Sikap & Keramahan Petugas",
                "Kesigapan, kepedulian, dan komunikasi staf di ruangan",
                ratingPetugas,
                setRatingPetugas
              )}

              {renderStarRating(
                "3. Sarana, Prasarana & Kebersihan",
                "Kelayakan toilet, kebersihan lantai, air bersih & fasilitas tunggu",
                ratingSarpras,
                setRatingSarpras
              )}
            </div>

            {/* Bagian 2: Kategori & Lokasi */}
            <div className="space-y-4 pt-2 border-t border-slate-100">
              <div className="flex items-center gap-2 pb-1 border-b border-slate-100">
                <MessageSquare className="w-4 h-4 text-emerald-600" />
                <h3 className="font-extrabold text-slate-900 text-sm uppercase tracking-wide">
                  Detail Saran atau Keluhan
                </h3>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Topik Masukan *
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setCategory(cat)}
                      className={`p-2.5 rounded-xl text-xs font-semibold text-center border transition cursor-pointer ${
                        category === cat
                          ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                          : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Building className="w-3.5 h-3.5 text-slate-400" />
                    <span>Ruangan / Lokasi Terkait</span>
                  </span>
                  <span className="text-[11px] text-slate-400 font-normal lowercase">(opsional)</span>
                </label>
                <select
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl p-3 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-slate-50/50"
                >
                  <option value="">-- Pilih Ruangan / Lokasi (Jika ada) --</option>
                  {rooms.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name} ({r.category.replace("_", " ")})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Isi Saran, Keluhan, atau Masukan *
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Contoh: Toilet LT 1 kran air wastafel tidak mengalir dan lantai licin. Mohon segera dibersihkan demi kenyamanan pasien..."
                  value={complaintText}
                  onChange={(e) => setComplaintText(e.target.value)}
                  className="w-full border border-slate-300 rounded-2xl p-3 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              {/* Upload Foto Bukti */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Camera className="w-3.5 h-3.5 text-slate-400" />
                    <span>Unggah Foto Bukti Keluhan</span>
                  </span>
                  <span className="text-[11px] text-slate-400 font-normal lowercase">(opsional)</span>
                </label>

                {photoPreview ? (
                  <div className="relative inline-block border-2 border-emerald-300 rounded-2xl overflow-hidden shadow-xs">
                    <img
                      src={photoPreview}
                      alt="Preview"
                      className="w-36 h-36 object-cover"
                    />
                    <button
                      type="button"
                      onClick={removePhoto}
                      className="absolute top-1.5 right-1.5 p-1 bg-rose-600 text-white rounded-full shadow hover:bg-rose-700 cursor-pointer"
                      title="Hapus foto"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-2xl bg-slate-50 hover:bg-emerald-50/30 transition cursor-pointer">
                    <Camera className="w-6 h-6 text-slate-400 mb-1" />
                    <span className="text-xs font-semibold text-slate-700">
                      Ambil Foto atau Pilih Gambar dari Galeri
                    </span>
                    <span className="text-[11px] text-slate-400 mt-0.5">
                      JPG, PNG maksimal 5 MB
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={handlePhotoChange}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            </div>

            {/* Bagian 3: Identitas Pengunjung (Opsional) */}
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Identitas Pengunjung
                </span>
                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-emerald-700">
                  <input
                    type="checkbox"
                    checked={isAnonymous}
                    onChange={(e) => setIsAnonymous(e.target.checked)}
                    className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                  />
                  <span>Kirim Sebagai Anonim</span>
                </label>
              </div>

              {!isAnonymous && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Nama Anda (Opsional)
                    </label>
                    <input
                      type="text"
                      placeholder="Nama Anda"
                      value={visitorName}
                      onChange={(e) => setVisitorName(e.target.value)}
                      className="w-full border border-slate-300 rounded-xl p-2.5 text-xs bg-slate-50/50"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      No. WhatsApp / HP (Opsional)
                    </label>
                    <input
                      type="tel"
                      placeholder="08xxxxxxxxxx"
                      value={visitorPhone}
                      onChange={(e) => setVisitorPhone(e.target.value)}
                      className="w-full border border-slate-300 rounded-xl p-2.5 text-xs bg-slate-50/50"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Tombol Kirim */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="w-full inline-flex items-center justify-center gap-2 py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold text-sm sm:text-base rounded-2xl shadow-lg shadow-emerald-600/30 transition transform active:scale-[0.99] cursor-pointer disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                <span>{submitting ? "Mengirim Laporan..." : "Kirim Penilaian & Pengaduan"}</span>
              </button>
            </div>
          </form>
        )}

        {/* Footer */}
        <p className="text-center text-[11px] text-slate-400 py-2">
          © {new Date().getFullYear()} SIKELA • UPTD Puskesmas Muara Kulam
        </p>
      </div>
    </div>
  );
}

