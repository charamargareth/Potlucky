"use client";

import { useState } from "react";
import { Download, FileSpreadsheet, FileText, ChevronDown } from "lucide-react";
import { formatCurrency, formatDateID } from "@/lib/utils";
import type { Contribution, SavingsGroup } from "@/types/database";

export default function ExportButton({
  group,
  contributions,
}: {
  group: SavingsGroup;
  contributions: Contribution[];
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState<"excel" | "pdf" | null>(null);

  const rows = contributions.map((c) => ({
    Tanggal: c.contributed_on,
    Nama: c.profile?.full_name ?? "Anggota",
    "Jumlah (Rp)": Number(c.amount),
    Catatan: c.note ?? "",
  }));

  const total = contributions.reduce((s, c) => s + Number(c.amount), 0);

  async function exportExcel() {
    setLoading("excel");
    setOpen(false);
    try {
      const XLSX = await import("xlsx");
      const ws = XLSX.utils.json_to_sheet([
        ...rows,
        {},
        { Tanggal: "TOTAL", Nama: "", "Jumlah (Rp)": total, Catatan: "" },
      ]);

      ws["!cols"] = [{ wch: 14 }, { wch: 22 }, { wch: 16 }, { wch: 30 }];

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, group.name.slice(0, 31));
      XLSX.writeFile(wb, `potlucky-${group.name.replace(/\s+/g, "-")}-riwayat.xlsx`);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(null);
    }
  }

  async function exportPDF() {
    setLoading("pdf");
    setOpen(false);
    try {
      const { jsPDF } = await import("jspdf");
      const { default: autoTable } = await import("jspdf-autotable");

      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.text("Potlucky — Riwayat Tabungan", 15, 18);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.text(`Pot: ${group.name}`, 15, 27);
      doc.text(`Target: ${formatCurrency(group.target_amount)}`, 15, 33);
      doc.text(`Diekspor: ${new Date().toLocaleDateString("id-ID")}`, 15, 39);

      autoTable(doc, {
        startY: 46,
        head: [["Tanggal", "Nama", "Jumlah", "Catatan"]],
        body: [
          ...rows.map((r) => [
            r["Tanggal"],
            r["Nama"],
            formatCurrency(r["Jumlah (Rp)"]),
            r["Catatan"],
          ]),
          ["", "TOTAL", formatCurrency(total), ""],
        ],
        styles: { fontSize: 9, cellPadding: 3 },
        headStyles: { fillColor: [224, 71, 106] },
        footStyles: { fontStyle: "bold" },
        columnStyles: { 2: { halign: "right" } },
        didParseCell: (data) => {
          if (data.row.index === rows.length && data.section === "body") {
            data.cell.styles.fontStyle = "bold";
          }
        },
      });

      doc.save(`potlucky-${group.name.replace(/\s+/g, "-")}-riwayat.pdf`);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        disabled={loading !== null || contributions.length === 0}
        className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-xl border border-pink-soft text-xs font-semibold text-ink-soft hover:bg-peach hover:text-ink transition-colors disabled:opacity-50"
      >
        <Download className="size-3.5" />
        {loading ? "Mengekspor…" : "Export"}
        <ChevronDown className="size-3" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-11 z-20 bg-glass border border-pink-soft rounded-2xl shadow-lg overflow-hidden min-w-[160px]">
            <button
              onClick={exportExcel}
              className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-ink hover:bg-peach transition-colors"
            >
              <FileSpreadsheet className="size-4 text-mint" />
              Excel (.xlsx)
            </button>
            <button
              onClick={exportPDF}
              className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-ink hover:bg-peach transition-colors border-t border-pink-soft/40"
            >
              <FileText className="size-4 text-pink-deep" />
              PDF (.pdf)
            </button>
          </div>
        </>
      )}
    </div>
  );
}