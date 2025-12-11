import { useState } from "react";
import jsPDF from "jspdf";
import { Download, Loader2 } from "lucide-react";

export default function ExportToPDF({ cotizacion, opciones, operadores }) {
  const [generating, setGenerating] = useState(false);

  function getOperadorNombre(operadorId) {
    const op = operadores.find((o) => o.id === operadorId);
    return op?.nombre || "Operador";
  }

  function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString("es-MX", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }

  async function handleExport() {
    setGenerating(true);

    try {
      const pdf = new jsPDF("p", "mm", "a4");
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 20;
      let yPos = margin;

      // Header - Logo placeholder
      pdf.setFillColor(30, 58, 95);
      pdf.rect(0, 0, pageWidth, 40, "F");
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(24);
      pdf.setFont("helvetica", "bold");
      pdf.text("EMOCIONES VIAJES", pageWidth / 2, 20, { align: "center" });
      pdf.setFontSize(12);
      pdf.text("Propuesta de Viaje", pageWidth / 2, 30, { align: "center" });

      yPos = 50;

      // Folio
      pdf.setTextColor(94, 179, 212);
      pdf.setFontSize(14);
      pdf.setFont("helvetica", "bold");
      pdf.text(cotizacion.folio, pageWidth / 2, yPos, { align: "center" });
      yPos += 15;

      // Client Info
      pdf.setTextColor(0, 0, 0);
      pdf.setFontSize(12);
      pdf.setFont("helvetica", "bold");
      pdf.text("INFORMACIÓN DEL CLIENTE", margin, yPos);
      yPos += 8;

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(10);
      pdf.text(`Cliente: ${cotizacion.cliente_nombre}`, margin, yPos);
      yPos += 6;
      if (cotizacion.cliente_telefono) {
        pdf.text(`Teléfono: ${cotizacion.cliente_telefono}`, margin, yPos);
        yPos += 6;
      }
      if (cotizacion.cliente_email) {
        pdf.text(`Email: ${cotizacion.cliente_email}`, margin, yPos);
        yPos += 6;
      }
      yPos += 5;

      // Travel Details
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(12);
      pdf.text("DETALLES DEL VIAJE", margin, yPos);
      yPos += 8;

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(10);
      pdf.text(`Destino: ${cotizacion.destino}`, margin, yPos);
      yPos += 6;
      pdf.text(
        `Fechas: ${formatDate(cotizacion.fecha_salida)} - ${formatDate(cotizacion.fecha_regreso)}`,
        margin,
        yPos
      );
      yPos += 6;
      pdf.text(
        `Viajeros: ${cotizacion.num_adultos} adulto(s), ${cotizacion.num_ninos} niño(s)`,
        margin,
        yPos
      );
      yPos += 6;
      if (cotizacion.presupuesto_aprox) {
        pdf.text(
          `Presupuesto: $${parseFloat(cotizacion.presupuesto_aprox).toLocaleString("es-MX")}`,
          margin,
          yPos
        );
        yPos += 6;
      }
      yPos += 10;

      // Package Options
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(14);
      pdf.text("OPCIONES DE PAQUETES", pageWidth / 2, yPos, {
        align: "center",
      });
      yPos += 10;

      for (let i = 0; i < opciones.length; i++) {
        const opcion = opciones[i];

        // Check if we need a new page
        if (yPos > pageHeight - 60) {
          pdf.addPage();
          yPos = margin;
        }

        // Option header
        pdf.setFillColor(94, 179, 212);
        pdf.rect(margin, yPos - 5, pageWidth - 2 * margin, 10, "F");
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(12);
        pdf.setFont("helvetica", "bold");
        pdf.text(`OPCIÓN ${i + 1}`, margin + 5, yPos);
        yPos += 8;

        // Option details
        pdf.setTextColor(0, 0, 0);
        pdf.setFontSize(11);
        pdf.setFont("helvetica", "bold");
        pdf.text(opcion.nombre_paquete, margin, yPos);
        yPos += 6;

        pdf.setFontSize(9);
        pdf.setFont("helvetica", "italic");
        pdf.setTextColor(100, 100, 100);
        pdf.text(getOperadorNombre(opcion.operador_id), margin, yPos);
        yPos += 8;

        // Price box
        pdf.setFillColor(30, 58, 95);
        pdf.rect(margin, yPos - 5, 60, 15, "F");
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(10);
        pdf.setFont("helvetica", "normal");
        pdf.text("Precio Total", margin + 30, yPos, { align: "center" });
        pdf.setFontSize(14);
        pdf.setFont("helvetica", "bold");
        pdf.text(
          `$${parseFloat(opcion.precio_total).toLocaleString("es-MX")}`,
          margin + 30,
          yPos + 6,
          { align: "center" }
        );
        yPos += 18;

        // Inclusions
        pdf.setTextColor(34, 197, 94);
        pdf.setFontSize(10);
        pdf.setFont("helvetica", "bold");
        pdf.text("✓ Incluye:", margin, yPos);
        yPos += 5;

        pdf.setTextColor(0, 0, 0);
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(9);
        const incluyeArray = Array.isArray(opcion.incluye)
          ? opcion.incluye
          : [];
        for (const item of incluyeArray.slice(0, 8)) {
          if (yPos > pageHeight - 30) {
            pdf.addPage();
            yPos = margin;
          }
          pdf.text(`• ${item.trim()}`, margin + 5, yPos);
          yPos += 5;
        }
        yPos += 3;

        // Exclusions
        if (opcion.no_incluye && opcion.no_incluye.length > 0) {
          pdf.setTextColor(239, 68, 68);
          pdf.setFontSize(10);
          pdf.setFont("helvetica", "bold");
          pdf.text("✗ No incluye:", margin, yPos);
          yPos += 5;

          pdf.setTextColor(0, 0, 0);
          pdf.setFont("helvetica", "normal");
          pdf.setFontSize(9);
          const noIncluyeArray = Array.isArray(opcion.no_incluye)
            ? opcion.no_incluye
            : [];
          for (const item of noIncluyeArray.slice(0, 5)) {
            if (yPos > pageHeight - 30) {
              pdf.addPage();
              yPos = margin;
            }
            pdf.text(`• ${item.trim()}`, margin + 5, yPos);
            yPos += 5;
          }
        }

        yPos += 10;
      }

      // Footer
      if (yPos > pageHeight - 40) {
        pdf.addPage();
        yPos = margin;
      }

      pdf.setDrawColor(30, 58, 95);
      pdf.setLineWidth(0.5);
      pdf.line(margin, yPos, pageWidth - margin, yPos);
      yPos += 8;

      pdf.setTextColor(30, 58, 95);
      pdf.setFontSize(11);
      pdf.setFont("helvetica", "bold");
      pdf.text("¿Listo para tu próxima aventura?", pageWidth / 2, yPos, {
        align: "center",
      });
      yPos += 6;

      pdf.setFontSize(9);
      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(100, 100, 100);
      pdf.text(
        "Contáctanos para más información o reservar",
        pageWidth / 2,
        yPos,
        { align: "center" }
      );
      yPos += 5;

      pdf.setTextColor(94, 179, 212);
      pdf.setFont("helvetica", "bold");
      pdf.text(
        "Emociones Viajes - Creando momentos inolvidables",
        pageWidth / 2,
        yPos,
        { align: "center" }
      );

      // Save PDF
      pdf.save(`propuesta-${cotizacion.folio}-${Date.now()}.pdf`);
      setGenerating(false);
    } catch (error) {
      console.error("PDF export error:", error);
      alert("Error al generar PDF: " + error.message);
      setGenerating(false);
    }
  }

  return (
    <button
      onClick={handleExport}
      disabled={generating}
      className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
    >
      {generating ? (
        <>
          <Loader2 size={18} className="animate-spin" />
          Generando...
        </>
      ) : (
        <>
          <Download size={18} />
          PDF
        </>
      )}
    </button>
  );
}
