import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

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

const drawKopSurat = (doc, kop = DEFAULT_KOP_CONFIG) => {
  // Kop Surat Pemerintah & Puskesmas
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(30, 41, 59);
  doc.text(kop.instansiInduk || DEFAULT_KOP_CONFIG.instansiInduk, 105, 14, { align: "center" });

  doc.setFontSize(13);
  doc.text(kop.dinasKesehatan || DEFAULT_KOP_CONFIG.dinasKesehatan, 105, 20, { align: "center" });

  doc.setFontSize(14);
  doc.setTextColor(15, 118, 110); // Emerald teal
  doc.text(kop.namaPuskesmas || DEFAULT_KOP_CONFIG.namaPuskesmas, 105, 26, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139);
  doc.text(
    kop.alamatKontak || DEFAULT_KOP_CONFIG.alamatKontak,
    105,
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

const drawSignatures = (doc, currentY, kop = DEFAULT_KOP_CONFIG) => {
  const pageHeight = doc.internal.pageSize.getHeight();
  let y = currentY;

  // Pastikan cukup ruang untuk 2 blok tanda tangan (tinggi ~45mm)
  if (y + 45 > pageHeight - 20) {
    doc.addPage();
    drawKopSurat(doc, kop);
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
  doc.text("Mengetahui & Menyetujui,", 45, y, { align: "center" });
  doc.setFont("helvetica", "bold");
  doc.text(kop.pimpinanJabatan || "Kepala UPTD Puskesmas", 45, y + 5, { align: "center" });

  // Kolom Kanan: Pelapor
  doc.setFont("helvetica", "normal");
  doc.text("Dilaporkan Oleh,", 165, y, { align: "center" });
  doc.setFont("helvetica", "bold");
  doc.text(kop.pelaporJabatan || "Penanggung Jawab MFK & K3", 165, y + 5, { align: "center" });

  // Ruang Tanda Tangan
  y += 26;

  // Nama Pejabat Kiri
  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42);
  doc.text(kop.pimpinanNama || "dr. H. Ahmad Fauzi, M.Kes", 45, y, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text(
    kop.pimpinanNip ? `NIP. ${kop.pimpinanNip}` : "-",
    45,
    y + 4.5,
    { align: "center" }
  );

  // Nama Pejabat Kanan
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text(kop.pelaporNama || "Administrator MFK / Tim Sanitasi", 165, y, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text(kop.pelaporKeterangan || "Koordinator Keselamatan Fasilitas", 165, y + 4.5, { align: "center" });
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
export const downloadMFKReportPDF = ({
  reportData,
  mode = "all", // "all" | inspectionCategory | "utilitas" | "insiden" | "inventaris"
  periodLabel = "",
  kopConfig = DEFAULT_KOP_CONFIG,
}) => {
  if (!reportData) return;

  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  drawKopSurat(doc, kopConfig);

  let startY = 42;

  // Title section
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
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
  } else if (mode === "inventaris") {
    title = "LAPORAN REKAPITULASI INVENTARISASI SARPRAS, B3 & ALKES";
    subtitle = "PENGELOLAAN SARANA PRASARANA, BAHAN B3, DAN KALIBRASI ALKES BERKALA";
    fileName = `Laporan_Inventarisasi_${periodLabel.replace(/\s+/g, "_")}.pdf`;
  } else if (mode !== "all") {
    title = `LAPORAN HASIL ${mode.toUpperCase()}`;
    subtitle = "DOKUMEN BUKTI KEPATUHAN INSPEKSI SARANA & FASILITAS BERKALA";
    fileName = `Laporan_${mode.replace(/\s+/g, "_")}_${periodLabel.replace(/\s+/g, "_")}.pdf`;
  }

  doc.text(title, 105, startY, { align: "center" });
  startY += 5;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(15, 118, 110);
  doc.text(subtitle, 105, startY, { align: "center" });
  startY += 5;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.text(`Periode: ${periodLabel} | Waktu Ekspor: ${formatDate(new Date())}`, 105, startY, {
    align: "center",
  });
  startY += 6;

  // Summary box
  let filteredInspections = reportData.inspections || [];
  if (mode !== "all" && mode !== "utilitas" && mode !== "insiden" && mode !== "inventaris") {
    filteredInspections = filteredInspections.filter((i) => i.inspection_type === mode);
  }

  const totalIns = filteredInspections.length;
  const baikCount = filteredInspections.filter((i) => i.result_status === "Baik").length;
  const perbaikanCount = filteredInspections.filter((i) => i.result_status === "Perlu Perbaikan").length;
  const tidakStandarCount = filteredInspections.filter(
    (i) => i.result_status === "Tidak Memenuhi Standar" || i.result_status === "Rusak Berat"
  ).length;
  const persentaseBaik = totalIns > 0 ? Math.round((baikCount / totalIns) * 100) : 100;

  // Box background
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.2);
  doc.roundedRect(14, startY, 182, 14, 2, 2, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(51, 65, 85);

  if (mode === "utilitas") {
    const totalUt = reportData.utilities?.length || 0;
    const urgenCount = reportData.utilities?.filter((u) => u.urgency === "Segera").length || 0;
    const selesaiCount = reportData.utilities?.filter((u) => u.status === "Selesai").length || 0;
    doc.text(`Total Laporan: ${totalUt} Kerusakan`, 20, startY + 6);
    doc.text(`Urgensi Kritis (Segera): ${urgenCount}`, 75, startY + 6);
    doc.text(`Penanganan Selesai: ${selesaiCount}`, 135, startY + 6);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 116, 139);
    doc.text("Status Sistem Utilitas Puskesmas Terpantau Aktif", 20, startY + 10.5);
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
  } else if (mode === "inventaris") {
    const invs = reportData.inventories || [];
    const totalInv = invs.length;
    const totalB3 = invs.filter((i) => i.category === "B3").length;
    const totalAlkes = invs.filter((i) => i.category === "Alkes" || i.category === "Kalibrasi").length;
    const totalSarpras = invs.filter((i) => i.category === "Sarpras").length;
    doc.text(`Total Aset Tercatat: ${totalInv} Item`, 20, startY + 6);
    doc.text(`Sarpras: ${totalSarpras} | B3 Medis: ${totalB3}`, 75, startY + 6);
    doc.text(`Alkes / Kalibrasi: ${totalAlkes} Item`, 135, startY + 6);
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
        fillColor: [180, 83, 9], // Amber dark
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
        1: { cellWidth: 22 },
        2: { cellWidth: 25 },
        3: { cellWidth: 25 },
        4: { cellWidth: 25 },
        5: { cellWidth: 47 },
        6: { cellWidth: 15, halign: "center" },
        7: { cellWidth: 15, halign: "center" },
      },
      margin: { left: 14, right: 14 },
    });
  } else if (mode === "insiden") {
    const tableBody = (reportData.incidents || []).map((inc, idx) => [
      idx + 1,
      inc.report_number || "-",
      formatDate(inc.incident_datetime),
      inc.location || "-",
      inc.category || "-",
      inc.risk_grading || "Biru",
      `Kronologi: ${inc.chronology || "-"}\n${inc.initial_action ? `Tindakan: ${inc.initial_action}` : ""}`,
      inc.status || "Selesai",
    ]);

    autoTable(doc, {
      startY,
      head: [["No", "No Laporan", "Waktu", "Lokasi", "Kategori", "Grading", "Kronologi & Tindakan", "Status"]],
      body: tableBody.length ? tableBody : [["-", "-", "-", "Tidak ada laporan insiden pada periode ini", "-", "-", "-", "-"]],
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
        1: { cellWidth: 22 },
        2: { cellWidth: 22 },
        3: { cellWidth: 24 },
        4: { cellWidth: 24 },
        5: { cellWidth: 16, halign: "center" },
        6: { cellWidth: 50 },
        7: { cellWidth: 16, halign: "center" },
      },
      margin: { left: 14, right: 14 },
    });
  } else if (mode === "inventaris") {
    const tableBody = (reportData.inventories || []).map((inv, idx) => [
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
        : "Tidak Perlu",
      inv.notes || "-",
    ]);

    autoTable(doc, {
      startY,
      head: [["No", "Nama Aset / Barang", "Kategori", "Ruangan", "Jumlah", "Kondisi", "Kalibrasi", "Catatan"]],
      body: tableBody.length ? tableBody : [["-", "-", "-", "Tidak ada data inventarisasi", "-", "-", "-", "-"]],
      theme: "grid",
      headStyles: {
        fillColor: [30, 64, 175], // Blue dark
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
  drawSignatures(doc, finalY + 8, kopConfig);
  addPageFooters(doc);

  // Simpan dan unduh file PDF
  doc.save(fileName);
};
