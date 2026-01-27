import { useState } from "react";
import jsPDF from "jspdf";
import { useToast } from "@/hooks/use-toast";

interface UsePdfExportOptions {
  filename?: string;
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
      clone.style.width = "210mm";
      clone.style.minHeight = "297mm";
      clone.style.padding = "15mm";
      clone.style.backgroundColor = "white";
      clone.style.color = "black";
      clone.style.position = "absolute";
      clone.style.left = "-9999px";
      clone.style.top = "0";
      clone.style.fontFamily = "Helvetica, Arial, sans-serif";
      clone.style.fontSize = "11pt";
      clone.style.lineHeight = "1.4";
      
      // Remove any print:hidden elements from clone
      clone.querySelectorAll('.print\\:hidden').forEach(el => el.remove());
      
      // Apply text colors for print - force all text to be visible
      clone.querySelectorAll('*').forEach(el => {
        const element = el as HTMLElement;
        
        // Force black text on most elements
        if (element.classList.contains('text-foreground') || 
            element.classList.contains('text-muted-foreground') ||
            element.classList.contains('text-gray-600') ||
            element.classList.contains('text-gray-700') ||
            element.classList.contains('text-gray-800')) {
          element.style.color = '#333333';
        }
        
        // Handle blue/primary elements
        if (element.classList.contains('text-primary') || 
            element.classList.contains('text-blue-600') ||
            element.classList.contains('text-blue-700')) {
          element.style.color = '#1d4ed8';
        }

        // Ensure headings are darker
        if (element.tagName === 'H1' || element.tagName === 'H2' || 
            element.tagName === 'H3' || element.tagName === 'H4') {
          element.style.color = '#111111';
        }
      });
      
      document.body.appendChild(clone);

      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
        compress: true,
      });

      // Use jsPDF's html method for proper text rendering (selectable text, smaller file)
      await pdf.html(clone, {
        callback: function (doc) {
          const filename = customFilename || options.filename || "documento.pdf";
          doc.save(filename);
          
          toast({
            title: "PDF exportado! ✓",
            description: `Arquivo "${filename}" baixado com sucesso.`,
          });
        },
        x: 0,
        y: 0,
        width: 210,
        windowWidth: 794,
        autoPaging: 'text',
        margin: [10, 10, 10, 10],
        html2canvas: {
          scale: 0.264583, // Convert px to mm (1mm = 3.78px, so 1/3.78 ≈ 0.264583)
          useCORS: true,
          logging: false,
          letterRendering: true,
        },
      });

      document.body.removeChild(clone);

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
