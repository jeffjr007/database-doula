import { useState } from "react";
import jsPDF from "jspdf";
import { useToast } from "@/hooks/use-toast";

export type PdfTextBlock =
  | { type: "title"; text: string }
  | { type: "heading"; text: string }
  | { type: "paragraph"; text: string }
  | { type: "bullet"; text: string };

interface UsePdfExportOptions {
  filename?: string;
}

type ExportTextPdfInput = {
  filename?: string;
  blocks: PdfTextBlock[];
};

export function usePdfExport(options: UsePdfExportOptions = {}) {
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  const exportTextPdf = async (input: ExportTextPdfInput) => {
    setIsExporting(true);

    try {
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
        compress: true,
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 14;
      const maxWidth = pageWidth - margin * 2;

      let y = margin;

      const ensureSpace = (neededMm: number) => {
        if (y + neededMm > pageHeight - margin) {
          pdf.addPage();
          y = margin;
        }
      };

      const writeLines = (lines: string[], lineHeight: number) => {
        for (const line of lines) {
          ensureSpace(lineHeight);
          pdf.text(line, margin, y);
          y += lineHeight;
        }
      };

      // Basic typography
      pdf.setTextColor(20, 20, 20);

      for (const block of input.blocks) {
        if (!block.text?.trim()) continue;

        if (block.type === "title") {
          pdf.setFont("helvetica", "bold");
          pdf.setFontSize(18);
          const lines = pdf.splitTextToSize(block.text.trim(), maxWidth);
          writeLines(lines, 8);
          y += 2;
          continue;
        }

        if (block.type === "heading") {
          pdf.setFont("helvetica", "bold");
          pdf.setFontSize(12);
          y += 2;
          const lines = pdf.splitTextToSize(block.text.trim().toUpperCase(), maxWidth);
          writeLines(lines, 6);
          y += 1;
          pdf.setDrawColor(200, 200, 200);
          ensureSpace(2);
          pdf.line(margin, y, pageWidth - margin, y);
          y += 4;
          continue;
        }

        if (block.type === "paragraph") {
          pdf.setFont("helvetica", "normal");
          pdf.setFontSize(11);
          const lines = pdf.splitTextToSize(block.text.trim(), maxWidth);
          writeLines(lines, 5.2);
          y += 2;
          continue;
        }

        // bullet
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(11);
        const bulletPrefix = "• ";
        const lines = pdf.splitTextToSize(bulletPrefix + block.text.trim(), maxWidth);
        writeLines(lines, 5.2);
      }

      const filename = input.filename || options.filename || "documento.pdf";
      pdf.save(filename);

      toast({
        title: "PDF exportado! ✓",
        description: `Arquivo "${filename}" baixado com sucesso.`,
      });
    } catch (error) {
      console.error("Error exporting PDF:", error);
      toast({
        title: "Erro ao exportar PDF",
        description: "Falha ao gerar o PDF. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  return { exportTextPdf, isExporting };
}
