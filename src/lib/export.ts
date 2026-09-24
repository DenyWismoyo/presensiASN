import { jsPDF } from "jspdf";
import "jspdf-autotable";
import * as XLSX from "xlsx";

export interface ExportDataParams {
  title: string;
  filename: string;
  columns: string[];
  rows: any[][];
}

/**
 * Menghasilkan dan mendownload file PDF
 */
export function exportToPDF({ title, filename, columns, rows }: ExportDataParams) {
  const doc = new jsPDF("landscape");
  
  // Header
  doc.setFontSize(16);
  doc.text(title, 14, 15);
  doc.setFontSize(10);
  doc.text(`Dicetak pada: ${new Date().toLocaleString("id-ID")}`, 14, 22);

  // Table
  (doc as any).autoTable({
    startY: 28,
    head: [columns],
    body: rows,
    theme: "grid",
    styles: { fontSize: 8 },
    headStyles: { fillColor: [41, 128, 185] },
  });

  doc.save(`${filename}.pdf`);
}

/**
 * Menghasilkan dan mendownload file Excel (XLSX)
 */
export function exportToExcel({ title, filename, columns, rows }: ExportDataParams) {
  // Combine columns and rows
  const worksheetData = [columns, ...rows];
  
  const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Data");
  
  XLSX.writeFile(workbook, `${filename}.xlsx`);
}
