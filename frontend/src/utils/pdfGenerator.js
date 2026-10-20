import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import defaultLogoPuskesmas from "../assets/logo-puskesmas.png";

export const INSPECTION_CATEGORIES = [
  "Inspeksi Ruangan",
  "Inspeksi Bangunan",
  "Inspeksi Listrik",
  "Inspeksi Air dan Sanitasi",
  "Inspeksi Kebakaran",
  "Inspeksi Limbah",
  "Inspeksi Gas Medis",
  "Inspeksi Lingkungan",
];

export const DEFAULT_KOP_CONFIG = {
  instansiInduk: "PEMERINTAH KABUPATEN / KOTA",
  dinasKesehatan: "DINAS KESEHATAN KABUPATEN / KOTA",
  namaPuskesmas: "UPTD PUSKESMAS MUARA KULAM",
  logoUrl: null,
  alamatKontak: "Jl. Lintas Muara Kulam, Telp. (0733) 123456 | Pos-el: pkm.muarakulam@dinkes.go.id",
  kotaDokumen: "Muara Kulam",
  pimpinanJabatan: "Kepala UPTD Puskesmas",
  pimpinanNama: "dr. H. Ahmad Fauzi, M.Kes",
  pimpinanNip: "19780512 200501 1 008",
  pelaporJabatan: "Penanggung Jawab MFK & K3",
  pelaporNama: "Administrator MFK / Tim Sanitasi",
  pelaporKeterangan: "Koordinator Fasilitas & Keselamatan",
};

const formatDate = (dateStr) => {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  return d.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

/**
 * Konversi image URL / asset path / data URL menjadi Base64 data URI
 */
export const loadImageAsDataUrl = (src) => {
  return new Promise((resolve) => {
    if (!src) return resolve(null);
    if (typeof src === "string" && src.startsWith("data:")) return resolve(src);
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL("image/png"));
      } catch {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = src;
  });
};

const drawKopSurat = (doc, kop = DEFAULT_KOP_CONFIG, logoDataUrl = null) => {
  // Gambar Logo Puskesmas di Kiri jika ada
  if (logoDataUrl) {
    try {
      doc.addImage(logoDataUrl, "PNG", 14, 10, 18, 20);
    } catch {
      // fallback jika ada format yang tidak didukung
    }
  }

  const textX = logoDataUrl ? 112 : 105;

  // Kop Surat Pemerintah & Puskesmas
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10.5);
  doc.setTextColor(30, 41, 59);
  doc.text(kop.instansiInduk || DEFAULT_KOP_CONFIG.instansiInduk, textX, 14, { align: "center" });

  doc.setFontSize(12.5);
  doc.text(kop.dinasKesehatan || DEFAULT_KOP_CONFIG.dinasKesehatan, textX, 20, { align: "center" });

  doc.setFontSize(13.5);
  doc.setTextColor(15, 118, 110); // Emerald teal
  doc.text(kop.namaPuskesmas || DEFAULT_KOP_CONFIG.namaPuskesmas, textX, 26, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text(
    kop.alamatKontak || DEFAULT_KOP_CONFIG.alamatKontak,
    textX,
    31,
    { align: "center" }
  );

  // Garis Pembatas Ganda Kop Surat
  doc.setDrawColor(15, 118, 110);
  doc.setLineWidth(0.8);
  doc.line(14, 34, 196, 34);

  doc.setDrawColor(100, 116, 139);
  doc.setLineWidth(0.2);
  doc.line(14, 35.2, 196, 35.2);
};

const drawSignatures = (doc, currentY, kop = DEFAULT_KOP_CONFIG, logoDataUrl = null) => {
  const pageHeight = doc.internal.pageSize.getHeight();
  let y = currentY;

  // Pastikan cukup ruang untuk 2 blok tanda tangan (tinggi ~45mm)
  if (y + 45 > pageHeight - 20) {
    doc.addPage();
    drawKopSurat(doc, kop, logoDataUrl);
    y = 44;
  }

  doc.setFontSize(9);
  doc.setTextColor(51, 65, 85);

  // Tanggal pengesahan
  const todayStr = new Date().toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  doc.text(`Ditetapkan di: ${kop.kotaDokumen || "Puskesmas"}, Tanggal: ${todayStr}`, 196, y, { align: "right" });

  y += 7;

  // Kolom Kiri: Mengetahui
  doc.setFont("helvetica", "normal");
  doc.text("Mengetahui & Menyetujui,", 30, y);
  doc.setFont("helvetica", "bold");
  doc.text(kop.pimpinanJabatan || "Kepala UPTD Puskesmas", 30, y + 5);

  // Kolom Kanan: Dilaporkan Oleh
  doc.setFont("helvetica", "normal");
  doc.text("Dilaporkan Oleh,", 140, y);
  doc.setFont("helvetica", "bold");
  doc.text(kop.pelaporJabatan || "Penanggung Jawab MFK & K3", 140, y + 5);

  // Ruang Tanda Tangan
  y += 24;

  // Tanda Tangan Kiri
  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42);
  doc.text(kop.pimpinanNama || "dr. H. Ahmad Fauzi, M.Kes", 30, y);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text(`NIP. ${kop.pimpinanNip || "19780512 200501 1 008"}`, 30, y + 4.5);

  // Tanda Tangan Kanan
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text(kop.pelaporNama || "Administrator MFK / Tim Sanitasi", 140, y);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text(kop.pelaporKeterangan || "Koordinator Fasilitas & Keselamatan", 140, y + 4.5);
};

const addPageFooters = (doc) => {
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);

    // Garis tipis footer
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.1);
    doc.line(14, 285, 196, 285);

    doc.text(
      "SIKELA (Sistem Informasi Kelola Fasilitas dan Keselamatan) • UPTD Puskesmas Muara Kulam",
      14,
      289
    );
    doc.text(`Halaman ${i} dari ${totalPages}`, 196, 289, { align: "right" });
  }
};

/**
 * Download Laporan PDF Gabungan (Semua MFK) atau Per Kategori Inspeksi / Inventarisasi / Utilitas / Insiden
 */
export const downloadMFKReportPDF = async ({
  reportData,
  mode = "all", // "all" | inspectionCategory | "utilitas" | "insiden" | "inventaris" | "inventaris_barang" | "inventaris_b3" | "inventaris_alkes"
  periodLabel = "",
  kopConfig = DEFAULT_KOP_CONFIG,
}) => {
  if (!reportData) return;

  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  // Resolve logo image (custom upload or default logo-puskesmas.png)
  const rawLogo = kopConfig.logoUrl || defaultLogoPuskesmas;
  const logoDataUrl = await loadImageAsDataUrl(rawLogo);

  drawKopSurat(doc, kopConfig, logoDataUrl);

  let startY = 42;

  // Title section
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11.5);
  doc.setTextColor(15, 23, 42);

  let title = "LAPORAN PROGRAM MANAJEMEN FASILITAS & KESELAMATAN (MFK)";
  let subtitle = "REKAPITULASI GABUNGAN STANDAR MFK 1-10";
  let fileName = `Laporan_MFK_Gabungan_${periodLabel.replace(/\s+/g, "_")}.pdf`;

  if (mode === "utilitas") {
    title = "LAPORAN REKAPITULASI KERUSAKAN SISTEM UTILITAS";
    subtitle = "SISTEM LISTRIK, GAS MEDIS, TATA UDARA, KEBAKARAN & KOMUNIKASI";
    fileName = `Laporan_Kerusakan_Utilitas_${periodLabel.replace(/\s+/g, "_")}.pdf`;
  } else if (mode === "insiden") {
    title = "LAPORAN REKAPITULASI INSIDEN KESELAMATAN & K3";
    subtitle = "MONITORING KTD, KNC, KTC & MANAJEMEN RISIKO PUSKESMAS";
    fileName = `Laporan_Insiden_K3_${periodLabel.replace(/\s+/g, "_")}.pdf`;
  } else if (mode === "inventaris_barang" || mode === "inventaris_sarpras") {
    title = "LAPORAN REKAPITULASI INVENTARISASI BARANG & SARPRAS";
    subtitle = "PENGELOLAAN SARANA PRASARANA, PERALATAN FASILITAS & MEUBELAIR PUSKESMAS";
    fileName = `Laporan_Inventaris_Barang_Sarpras_${periodLabel.replace(/\s+/g, "_")}.pdf`;
  } else if (mode === "inventaris_b3") {
    title = "LAPORAN REKAPITULASI INVENTARISASI BAHAN BERBAHAYA & BERACUN (B3)";
    subtitle = "LOGISTIK B3, DOKUMEN MSDS & PEMANTAUAN BAHAN BERBAHAYA PUSKESMAS";
    fileName = `Laporan_Inventaris_B3_${periodLabel.replace(/\s+/g, "_")}.pdf`;
  } else if (mode === "inventaris_alkes") {
    title = "LAPORAN REKAPITULASI INVENTARISASI ALAT KESEHATAN (ALKES) & KALIBRASI";
    subtitle = "MONITORING KELAIKAN ALAT MEDIS, JADWAL & SERTIFIKASI KALIBRASI";
    fileName = `Laporan_Inventaris_Alkes_${periodLabel.replace(/\s+/g, "_")}.pdf`;
  } else if (mode === "inventaris") {
    title = "LAPORAN REKAPITULASI INVENTARISASI SARPRAS, B3 & ALKES";
    subtitle = "PENGELOLAAN SARANA PRASARANA, BAHAN B3, DAN KALIBRASI ALKES BERKALA";
    fileName = `Laporan_Inventaris_Gabungan_${periodLabel.replace(/\s+/g, "_")}.pdf`;
  } else if (mode !== "all") {
    title = `LAPORAN HASIL ${mode.toUpperCase()}`;
    subtitle = "DOKUMEN BUKTI KEPATUHAN INSPEKSI SARANA & FASILITAS BERKALA";
    fileName = `Laporan_${mode.replace(/\s+/g, "_")}_${periodLabel.replace(/\s+/g, "_")}.pdf`;
  }

  doc.text(title, 105, startY, { align: "center" });
  startY += 5;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(15, 118, 110);
  doc.text(subtitle, 105, startY, { align: "center" });
  startY += 5;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text(`Periode: ${periodLabel} | Waktu Ekspor: ${formatDate(new Date())}`, 105, startY, {
    align: "center",
  });
  startY += 6;

  // Summary box
  let filteredInspections = reportData.inspections || [];
  const isInventarisMode =
    mode === "inventaris" ||
    mode === "inventaris_barang" ||
    mode === "inventaris_sarpras" ||
    mode === "inventaris_b3" ||
    mode === "inventaris_alkes";

  if (!isInventarisMode && mode !== "all" && mode !== "utilitas" && mode !== "insiden") {
    filteredInspections = filteredInspections.filter((i) => i.inspection_type === mode);
  }

  const totalIns = filteredInspections.length;
  const baikCount = filteredInspections.filter((i) => i.result_status === "Baik").length;
  const perbaikanCount = filteredInspections.filter((i) => i.result_status === "Perlu Perbaikan").length;
  const tidakStandarCount = filteredInspections.filter((i) => i.result_status === "Tidak Standar").length;
  const persentaseBaik = totalIns ? Math.round((baikCount / totalIns) * 100) : 0;

  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, startY, 182, 14, 2, 2, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(30, 41, 59);

  if (mode === "utilitas") {
    const totalUtl = reportData.utilities?.length || 0;
    const segeraUtl = reportData.utilities?.filter((u) => u.urgency === "Segera").length || 0;
    const selesaiUtl = reportData.utilities?.filter((u) => u.status === "Selesai").length || 0;
    doc.text(`Total Laporan Utilitas: ${totalUtl} Kasus`, 20, startY + 6);
    doc.text(`Tingkat Urgensi Segera: ${segeraUtl}`, 80, startY + 6);
    doc.text(`Telah Diperbaiki / Selesai: ${selesaiUtl}`, 135, startY + 6);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 116, 139);
    doc.text("Monitoring Kesiapan Sistem Utilitas Utama Puskesmas", 20, startY + 10.5);
  } else if (mode === "insiden") {
    const totalInc = reportData.incidents?.length || 0;
    const gradingMerah = reportData.incidents?.filter((i) => i.risk_grading === "Merah").length || 0;
    const selesaiInc = reportData.incidents?.filter((i) => i.status === "Selesai").length || 0;
    doc.text(`Total Laporan: ${totalInc} Kejadian`, 20, startY + 6);
    doc.text(`Grading Merah/Kritis: ${gradingMerah}`, 75, startY + 6);
    doc.text(`Investigasi Selesai: ${selesaiInc}`, 135, startY + 6);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 116, 139);
    doc.text("Laporan Investigasi Insiden Keselamatan Pasien & K3", 20, startY + 10.5);
  } else if (mode === "inventaris_barang" || mode === "inventaris_sarpras") {
    const invs = (reportData.inventories || []).filter(
      (i) => i.category === "Sarpras" || i.category === "Barang" || (!i.category?.toUpperCase().includes("B3") && i.category !== "Alkes" && i.category !== "Kalibrasi" && i.category !== "Alat Medis")
    );
    const baik = invs.filter((i) => i.condition_status === "Baik").length;
    const rusak = invs.filter((i) => i.condition_status !== "Baik").length;
    doc.text(`Total Barang / Sarpras: ${invs.length} Item`, 20, startY + 6);
    doc.text(`Kondisi Baik: ${baik} Unit`, 80, startY + 6);
    doc.text(`Perlu Perbaikan / Rusak: ${rusak} Unit`, 135, startY + 6);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 116, 139);
    doc.text("Rekapitulasi Sarana Prasarana Fisik & Meubelair Ruangan Puskesmas", 20, startY + 10.5);
  } else if (mode === "inventaris_b3") {
    const invs = (reportData.inventories || []).filter(
      (i) => i.category === "B3" || i.category?.toUpperCase().includes("B3")
    );
    const msdsCount = invs.filter((i) => i.notes && i.notes.toUpperCase().includes("MSDS")).length;
    doc.text(`Total Bahan B3: ${invs.length} Macam`, 20, startY + 6);
    doc.text(`Kelengkapan Dokumen MSDS: ${msdsCount} Item`, 80, startY + 6);
    doc.text(`Status: Terdata di Lemari B3`, 135, startY + 6);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 116, 139);
    doc.text("Monitoring Bahan Berbahaya & Beracun (B3) Sesuai Standar MFK 5", 20, startY + 10.5);
  } else if (mode === "inventaris_alkes") {
    const invs = (reportData.inventories || []).filter(
      (i) => i.category === "Alkes" || i.category === "Kalibrasi" || i.category === "Alat Medis"
    );
    const terkalibrasi = invs.filter((i) => i.calibration_date).length;
    const wajibKalibrasi = invs.filter((i) => i.needs_calibration && !i.calibration_date).length;
    doc.text(`Total Alat Kesehatan: ${invs.length} Unit`, 20, startY + 6);
    doc.text(`Lulus Kalibrasi: ${terkalibrasi} Unit`, 80, startY + 6);
    doc.text(`Wajib/Perlu Kalibrasi: ${wajibKalibrasi} Unit`, 135, startY + 6);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 116, 139);
    doc.text("Rekapitulasi Kelaikan & Sertifikasi Kalibrasi Alat Medis (MFK 8)", 20, startY + 10.5);
  } else if (mode === "inventaris") {
    const invs = reportData.inventories || [];
    const totalInv = invs.length;
    const totalB3 = invs.filter((i) => i.category === "B3" || i.category?.toUpperCase().includes("B3")).length;
    const totalAlkes = invs.filter((i) => i.category === "Alkes" || i.category === "Kalibrasi" || i.category === "Alat Medis").length;
    const totalSarpras = invs.filter((i) => i.category === "Sarpras" || i.category === "Barang").length;
    doc.text(`Total Aset: ${totalInv} Item`, 20, startY + 6);
    doc.text(`Barang/Sarpras: ${totalSarpras} | B3: ${totalB3}`, 75, startY + 6);
    doc.text(`Alat Kesehatan: ${totalAlkes} Item`, 135, startY + 6);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 116, 139);
    doc.text("Data Inventarisasi Aktif Sarana, Prasarana, B3 & Alat Kesehatan", 20, startY + 10.5);
  } else {
    doc.text(`Total Pemeriksaan: ${totalIns} Kegiatan`, 20, startY + 6);
    doc.text(`Kondisi Baik: ${baikCount}`, 75, startY + 6);
    doc.text(`Perlu Perbaikan: ${perbaikanCount} | Tidak Standar: ${tidakStandarCount}`, 120, startY + 6);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(15, 118, 110);
    doc.text(`Tingkat Kepatuhan Fisik: ${persentaseBaik}%`, 20, startY + 10.5);
  }

  startY += 18;

  // TABEL DATA
  if (mode === "utilitas") {
    const tableBody = (reportData.utilities || []).map((u, idx) => [
      idx + 1,
      formatDate(u.report_datetime),
      u.room_name || "-",
      u.utility_system || "-",
      `${u.officer_name || "-"}\n(${u.work_unit || "-"})`,
      `Kerusakan: ${u.damage_description || "-"}\n${u.recommendation ? `Saran: ${u.recommendation}` : ""}`,
      u.urgency || "Normal",
      u.status || "Menunggu",
    ]);

    autoTable(doc, {
      startY,
      head: [["No", "Waktu Lapor", "Ruangan", "Sistem Utilitas", "Pelapor", "Kerusakan & Rekomendasi", "Urgensi", "Status"]],
      body: tableBody.length ? tableBody : [["-", "-", "-", "Tidak ada laporan kerusakan utilitas pada periode ini", "-", "-", "-", "-"]],
      theme: "grid",
      headStyles: {
        fillColor: [217, 119, 6], // Amber dark
        textColor: [255, 255, 255],
        fontSize: 8,
        fontStyle: "bold",
        halign: "center",
      },
      styles: {
        fontSize: 7.5,
        cellPadding: 2,
        valign: "middle",
        lineColor: [226, 232, 240],
      },
      columnStyles: {
        0: { cellWidth: 8, halign: "center" },
        1: { cellWidth: 23 },
        2: { cellWidth: 28 },
        3: { cellWidth: 26 },
        4: { cellWidth: 28 },
        5: { cellWidth: 43 },
        6: { cellWidth: 14, halign: "center" },
        7: { cellWidth: 14, halign: "center" },
      },
      margin: { left: 14, right: 14 },
    });
  } else if (mode === "insiden") {
    const tableBody = (reportData.incidents || []).map((inc, idx) => [
      idx + 1,
      formatDate(inc.incident_datetime),
      inc.room_name || "-",
      inc.incident_type || "-",
      inc.chronology || "-",
      inc.risk_grading || "-",
      `${inc.action_taken || "-"}\n${inc.investigation_result ? `Investigasi: ${inc.investigation_result}` : ""}`,
      inc.status || "Baru",
    ]);

    autoTable(doc, {
      startY,
      head: [["No", "Waktu Insiden", "Lokasi", "Jenis Insiden", "Kronologi", "Grading", "Tindakan & Investigasi", "Status"]],
      body: tableBody.length ? tableBody : [["-", "-", "-", "Tidak ada laporan insiden keselamatan pada periode ini", "-", "-", "-", "-"]],
      theme: "grid",
      headStyles: {
        fillColor: [225, 29, 72], // Rose dark
        textColor: [255, 255, 255],
        fontSize: 8,
        fontStyle: "bold",
        halign: "center",
      },
      styles: {
        fontSize: 7.5,
        cellPadding: 2,
        valign: "middle",
        lineColor: [226, 232, 240],
      },
      columnStyles: {
        0: { cellWidth: 8, halign: "center" },
        1: { cellWidth: 23 },
        2: { cellWidth: 26 },
        3: { cellWidth: 24 },
        4: { cellWidth: 24 },
        5: { cellWidth: 16, halign: "center" },
        6: { cellWidth: 50 },
        7: { cellWidth: 16, halign: "center" },
      },
      margin: { left: 14, right: 14 },
    });
  } else if (isInventarisMode) {
    let filteredInv = reportData.inventories || [];
    let headerColor = [30, 64, 175]; // Blue default

    if (mode === "inventaris_barang" || mode === "inventaris_sarpras") {
      filteredInv = filteredInv.filter(
        (i) => i.category === "Sarpras" || i.category === "Barang" || (!i.category?.toUpperCase().includes("B3") && i.category !== "Alkes" && i.category !== "Kalibrasi" && i.category !== "Alat Medis")
      );
      headerColor = [30, 64, 175]; // Blue
    } else if (mode === "inventaris_b3") {
      filteredInv = filteredInv.filter((i) => i.category === "B3" || i.category?.toUpperCase().includes("B3"));
      headerColor = [126, 34, 206]; // Purple
    } else if (mode === "inventaris_alkes") {
      filteredInv = filteredInv.filter((i) => i.category === "Alkes" || i.category === "Kalibrasi" || i.category === "Alat Medis");
      headerColor = [13, 148, 136]; // Teal
    }

    const tableBody = filteredInv.map((inv, idx) => [
      idx + 1,
      inv.item_name || "-",
      inv.category || "-",
      inv.room_name || "-",
      `${inv.quantity || 1} ${inv.unit || "Unit"}`,
      inv.condition_status || "Baik",
      inv.calibration_date
        ? `Lalu: ${inv.calibration_date}\nNext: ${inv.next_calibration_date || "-"}`
        : inv.needs_calibration
        ? "Wajib Kalibrasi"
        : "-",
      inv.notes || "-",
    ]);

    autoTable(doc, {
      startY,
      head: [["No", "Nama Aset / Barang", "Kategori", "Ruangan", "Jumlah", "Kondisi", "Kalibrasi", "Catatan"]],
      body: tableBody.length ? tableBody : [["-", "-", "-", "Tidak ada data inventarisasi untuk kategori ini", "-", "-", "-", "-"]],
      theme: "grid",
      headStyles: {
        fillColor: headerColor,
        textColor: [255, 255, 255],
        fontSize: 8,
        fontStyle: "bold",
        halign: "center",
      },
      styles: {
        fontSize: 7.5,
        cellPadding: 2,
        valign: "middle",
        lineColor: [226, 232, 240],
      },
      columnStyles: {
        0: { cellWidth: 8, halign: "center" },
        1: { cellWidth: 40 },
        2: { cellWidth: 20 },
        3: { cellWidth: 28 },
        4: { cellWidth: 18, halign: "center" },
        5: { cellWidth: 18, halign: "center" },
        6: { cellWidth: 24 },
        7: { cellWidth: 26 },
      },
      margin: { left: 14, right: 14 },
    });
  } else {
    // Mode all atau salah satu dari 8 kategori inspeksi
    const tableBody = filteredInspections.map((i, idx) => [
      idx + 1,
      formatDate(i.inspection_datetime),
      mode === "all" ? `${i.inspection_type}\n(${i.room_name || "-"})` : i.room_name || "-",
      `${i.officer_name || "-"}\n(${i.work_unit || "-"})`,
      i.result_status || "Baik",
      `${i.finding_description ? `Temuan: ${i.finding_description}\n` : ""}${
        i.recommendation ? `Saran: ${i.recommendation}` : "Sesuai standar operasional"
      }`,
      i.status_tindak_lanjut || "Selesai",
    ]);

    autoTable(doc, {
      startY,
      head: [
        [
          "No",
          "Waktu Periksa",
          mode === "all" ? "Jenis & Ruangan" : "Ruangan / Area",
          "Petugas / Unit",
          "Hasil",
          "Temuan & Rekomendasi",
          "Tindak Lanjut",
        ],
      ],
      body:
        tableBody.length > 0
          ? tableBody
          : [
              [
                "-",
                "-",
                "-",
                `Tidak ada data pemeriksaan untuk ${mode === "all" ? "seluruh inspeksi" : mode} pada periode ini`,
                "-",
                "-",
                "-",
              ],
            ],
      theme: "grid",
      headStyles: {
        fillColor: [15, 118, 110], // Emerald dark
        textColor: [255, 255, 255],
        fontSize: 8,
        fontStyle: "bold",
        halign: "center",
      },
      styles: {
        fontSize: 7.5,
        cellPadding: 2,
        valign: "middle",
        lineColor: [226, 232, 240],
      },
      columnStyles: {
        0: { cellWidth: 8, halign: "center" },
        1: { cellWidth: 23 },
        2: { cellWidth: 32 },
        3: { cellWidth: 28 },
        4: { cellWidth: 22, halign: "center" },
        5: { cellWidth: 51 },
        6: { cellWidth: 18, halign: "center" },
      },
      margin: { left: 14, right: 14 },
    });
  }

  // Tanda tangan & Footer
  const finalY = doc.lastAutoTable?.finalY || startY + 20;
  drawSignatures(doc, finalY + 8, kopConfig, logoDataUrl);
  addPageFooters(doc);

  // Simpan dan unduh file PDF
  doc.save(fileName);
};
