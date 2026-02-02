import { useState } from "react";
import jsPDF from "jspdf";
import { useToast } from "@/hooks/use-toast";

export type PdfTextBlock =
  | { type: "title"; text: string }
  | { type: "subtitle"; text: string }
  | { type: "heading"; text: string }
  | { type: "subheading"; text: string }
  | { type: "paragraph"; text: string }
  | { type: "bullet"; text: string }
  | { type: "spacer"; size?: number }
  | { type: "separator" }
  | { type: "right-align"; lines: string[] }
  | { type: "contact-line"; text: string }
  | { type: "three-columns"; columns: { title: string; items: string[] }[] };

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
      const margin = 15;
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

      const writeRightAligned = (lines: string[], lineHeight: number) => {
        for (const line of lines) {
          ensureSpace(lineHeight);
          const textWidth = pdf.getTextWidth(line);
          pdf.text(line, pageWidth - margin - textWidth, y);
          y += lineHeight;
        }
      };

      // Colors
      const black = [20, 20, 20] as const;
      const blue = [29, 78, 216] as const;
      const gray = [100, 100, 100] as const;

      for (const block of input.blocks) {
        if (block.type === "spacer") {
          y += block.size || 4;
          continue;
        }

        if (block.type === "separator") {
          ensureSpace(3);
          pdf.setDrawColor(0, 0, 0);
          pdf.setLineWidth(0.5);
          pdf.line(margin, y, pageWidth - margin, y);
          y += 4;
          continue;
        }

        if (block.type === "right-align") {
          pdf.setFont("helvetica", "normal");
          pdf.setFontSize(10);
          pdf.setTextColor(...black);
          writeRightAligned(block.lines, 4.5);
          continue;
        }

        if (block.type === "contact-line") {
          pdf.setFont("helvetica", "normal");
          pdf.setFontSize(10);
          pdf.setTextColor(...blue);
          const lines = pdf.splitTextToSize(block.text.trim(), maxWidth);
          writeLines(lines, 4.5);
          y += 2;
          continue;
        }

        if (block.type === "three-columns") {
          // Render three columns side by side (SISTEMAS | SKILLS | COMPETÊNCIAS)
          y += 4;
          ensureSpace(50); // Reserve space for the 3-column section
          
          const columnWidth = (maxWidth - 8) / 3; // 8mm gap total between columns
          const startY = y;
          
          // Draw each column
          block.columns.forEach((col, colIndex) => {
            const colX = margin + colIndex * (columnWidth + 4);
            let colY = startY;
            
            // Column heading (blue, bold)
            pdf.setFont("helvetica", "bold");
            pdf.setFontSize(11);
            pdf.setTextColor(...blue);
            pdf.text(col.title.toUpperCase(), colX, colY);
            colY += 6;
            
            // Column items (bullets)
            pdf.setFont("helvetica", "normal");
            pdf.setFontSize(9);
            pdf.setTextColor(...black);
            
            for (const item of col.items) {
              const bulletLines = pdf.splitTextToSize(item, columnWidth - 4);
              for (let i = 0; i < bulletLines.length; i++) {
                if (i === 0) {
                  pdf.text("•", colX, colY);
                  pdf.text(bulletLines[i], colX + 3, colY);
                } else {
                  pdf.text(bulletLines[i], colX + 3, colY);
                }
                colY += 4;
              }
            }
          });
          
          // Calculate max height used by columns
          const maxColHeight = Math.max(
            ...block.columns.map(col => {
              let h = 6; // heading height
              col.items.forEach(item => {
                const lines = pdf.splitTextToSize(item, columnWidth - 4);
                h += lines.length * 4;
              });
              return h;
            })
          );
          
          y = startY + maxColHeight + 2;
          continue;
        }

        if (!("text" in block) || !block.text?.trim()) continue;

        if (block.type === "title") {
          pdf.setFont("helvetica", "bold");
          pdf.setFontSize(18);
          pdf.setTextColor(...black);
          const lines = pdf.splitTextToSize(block.text.trim().toUpperCase(), maxWidth);
          writeLines(lines, 7);
          y += 1;
          continue;
        }

        if (block.type === "subtitle") {
          pdf.setFont("helvetica", "normal");
          pdf.setFontSize(11);
          pdf.setTextColor(...black);
          const lines = pdf.splitTextToSize(block.text.trim(), maxWidth);
          writeLines(lines, 5);
          y += 1;
          continue;
        }

        if (block.type === "heading") {
          y += 5; // Space before heading
          pdf.setFont("helvetica", "bold");
          pdf.setFontSize(12);
          pdf.setTextColor(...blue); // Blue headings like in the model
          const lines = pdf.splitTextToSize(block.text.trim().toUpperCase(), maxWidth);
          writeLines(lines, 6);
          y += 1;
          continue;
        }

        if (block.type === "subheading") {
          y += 4; // Space before subheading (experience header)
          pdf.setFont("helvetica", "normal");
          pdf.setFontSize(10);
          pdf.setTextColor(...black);
          const lines = pdf.splitTextToSize(block.text.trim(), maxWidth);
          writeLines(lines, 5);
          continue;
        }

        if (block.type === "paragraph") {
          pdf.setFont("helvetica", "normal");
          pdf.setFontSize(10);
          pdf.setTextColor(...black);
          const lines = pdf.splitTextToSize(block.text.trim(), maxWidth);
          writeLines(lines, 4.5);
          y += 1;
          continue;
        }

        // bullet
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(10);
        pdf.setTextColor(...black);
        const bulletText = block.text.trim();
        const bulletLines = pdf.splitTextToSize(bulletText, maxWidth - 4);
        for (let i = 0; i < bulletLines.length; i++) {
          ensureSpace(4.5);
          if (i === 0) {
            pdf.text("•", margin, y);
            pdf.text(bulletLines[i], margin + 4, y);
          } else {
            pdf.text(bulletLines[i], margin + 4, y);
          }
          y += 4.5;
        }
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
