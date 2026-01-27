import { useState } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { useToast } from "@/hooks/use-toast";

interface UsePdfExportOptions {
  filename?: string;
  scale?: number;
}

export function usePdfExport(options: UsePdfExportOptions = {}) {
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  const exportToPdf = async (elementRef: HTMLElement | null, customFilename?: string) => {
    if (!elementRef) {
      toast({
        title: "Erro ao exportar",
        description: "Elemento não encontrado para exportar.",
        variant: "destructive",
      });
      return;
    }

    setIsExporting(true);

    try {
      // Clone the element to avoid modifying the original
      const clone = elementRef.cloneNode(true) as HTMLElement;
      
      // Apply print-like styles to the clone
      clone.style.width = "794px"; // A4 width in pixels at 96dpi
      clone.style.padding = "40px";
      clone.style.backgroundColor = "white";
      clone.style.color = "black";
      clone.style.position = "absolute";
      clone.style.left = "-9999px";
      clone.style.top = "0";
      
      // Remove any print:hidden elements from clone
      clone.querySelectorAll('.print\\:hidden').forEach(el => el.remove());
      
      // Apply text colors for print
      clone.querySelectorAll('*').forEach(el => {
        const element = el as HTMLElement;
        const computedStyle = window.getComputedStyle(element);
        
        // Force black text on elements that need it
        if (element.classList.contains('text-foreground') || 
            element.classList.contains('text-muted-foreground')) {
          element.style.color = '#000000';
        }
        
        // Handle blue elements
        if (element.classList.contains('text-primary') || 
            element.classList.contains('text-blue-600')) {
          element.style.color = '#2563eb';
        }
      });
      
      document.body.appendChild(clone);

      const canvas = await html2canvas(clone, {
        scale: options.scale || 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
        windowWidth: 794,
      });

      document.body.removeChild(clone);

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pdfWidth;
      const imgHeight = (canvas.height * pdfWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 0;

      // Add first page
      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pdfHeight;

      // Add additional pages if content is longer than one page
      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
        heightLeft -= pdfHeight;
      }

      const filename = customFilename || options.filename || "documento.pdf";
      pdf.save(filename);

      toast({
        title: "PDF exportado! ✓",
        description: `Arquivo "${filename}" baixado com sucesso.`,
      });
    } catch (error) {
      console.error("Error exporting PDF:", error);
      toast({
        title: "Erro ao exportar PDF",
        description: "Tente novamente. Se o problema persistir, use Ctrl+P para imprimir.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  return { exportToPdf, isExporting };
}
