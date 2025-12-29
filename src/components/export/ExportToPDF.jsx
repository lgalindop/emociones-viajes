import { useState } from "react";
import jsPDF from "jspdf";
import { Download, Loader2 } from "lucide-react";
import { getCompanySettings } from "../../lib/useCompanySettings";

export default function ExportToPDF({ cotizacion, opciones }) {
  const [generating, setGenerating] = useState(false);

  function formatDateShort(dateString) {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("es-MX", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  }

  function formatDateLong(dateString) {
    if (!dateString) return "";
    const date = new Date(dateString);
    const day = date.getDate();
    const monthNames = [
      "ENERO",
      "FEBRERO",
      "MARZO",
      "ABRIL",
      "MAYO",
      "JUNIO",
      "JULIO",
      "AGOSTO",
      "SEPTIEMBRE",
      "OCTUBRE",
      "NOVIEMBRE",
      "DICIEMBRE",
    ];
    const month = monthNames[date.getMonth()];
    const year = date.getFullYear();
    return `${day} DE ${month} ${year}`;
  }

  async function handleExport() {
    setGenerating(true);

    try {
      // Fetch company settings from DB
      const companySettings = await getCompanySettings();
      if (!companySettings) {
        alert("Error: No se pudo cargar la información de la empresa");
        setGenerating(false);
        return;
      }

      const pdf = new jsPDF("p", "mm", "a4");
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 15;
      let yPos = margin;

      // HIGH-RES Logo
      try {
        const logoImg = new Image();
        logoImg.crossOrigin = "anonymous";
        logoImg.src = "/emociones-logo-icon.png";

        await new Promise((resolve, reject) => {
          logoImg.onload = resolve;
          logoImg.onerror = reject;
          setTimeout(reject, 2000);
        });

        const canvas = document.createElement("canvas");
        canvas.width = 1200; // Much higher resolution
        canvas.height = 1200;
        const ctx = canvas.getContext("2d");
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(logoImg, 0, 0, 1200, 1200);
        const compressedDataUrl = canvas.toDataURL("image/png", 1.0); // Max quality

        pdf.addImage(compressedDataUrl, "PNG", margin, yPos, 25, 25);
      } catch (e) {
        console.warn("Logo skipped:", e);
      }

      // Company header - CENTERED
      pdf.setFontSize(16);
      pdf.setFont("helvetica", "bold");
      pdf.text(
        companySettings.company_name || "EMOCIONES VIAJES BY FRAVEO",
        pageWidth / 2,
        yPos + 8,
        { align: "center" }
      );

      pdf.setFontSize(9);
      pdf.setFont("helvetica", "bold");
      pdf.text("Dirección:", pageWidth / 2 - 40, yPos + 14);
      pdf.setFont("helvetica", "normal");
      pdf.text(companySettings.address || "", pageWidth / 2 - 20, yPos + 14);

      pdf.setFont("helvetica", "bold");
      pdf.text("Correo:", pageWidth / 2 - 40, yPos + 18);
      pdf.setFont("helvetica", "normal");
      pdf.text(companySettings.email || "", pageWidth / 2 - 20, yPos + 18);

      pdf.setFont("helvetica", "bold");
      pdf.text("Teléfono:", pageWidth / 2 - 40, yPos + 22);
      pdf.setFont("helvetica", "normal");
      pdf.text(companySettings.phone || "", pageWidth / 2 - 20, yPos + 22);

      pdf.setFont("helvetica", "bold");
      pdf.text("RNT:", pageWidth / 2 - 40, yPos + 26);
      pdf.setFont("helvetica", "normal");
      pdf.text(companySettings.rnt || "", pageWidth / 2 - 20, yPos + 26);

      yPos += 40; // More space

      // Client info - LEFT with BOLD labels
      pdf.setFontSize(10);
      pdf.setFont("helvetica", "bold");
      pdf.text("Cliente:", margin, yPos);
      pdf.setFont("helvetica", "normal");
      pdf.text(cotizacion.cliente_nombre || "", margin + 18, yPos);
      yPos += 6;

      pdf.setFont("helvetica", "bold");
      pdf.text("Correo:", margin, yPos);
      pdf.setFont("helvetica", "normal");
      pdf.text(cotizacion.cliente_email || "", margin + 18, yPos);
      yPos += 6;

      pdf.setFont("helvetica", "bold");
      pdf.text("Teléfono:", margin, yPos);
      pdf.setFont("helvetica", "normal");
      pdf.text(cotizacion.cliente_telefono || "", margin + 22, yPos);

      // Folio - CENTER COLUMN
      const centerX = pageWidth / 2 - 30;
      let centerYPos = yPos - 12;
      pdf.setFont("helvetica", "bold");
      pdf.text("Folio cotización:", centerX, centerYPos);
      pdf.setFont("helvetica", "normal");
      pdf.text(` ${cotizacion.folio || ""}`, centerX + 28, centerYPos);
      centerYPos += 6;

      pdf.setFont("helvetica", "bold");
      pdf.text("Cotizado en:", centerX, centerYPos);
      pdf.setFont("helvetica", "normal");
      pdf.text(
        ` ${cotizacion.divisa === "MXN" ? "Peso Mexicano" : cotizacion.divisa}`,
        centerX + 22,
        centerYPos
      );

      // Dates - RIGHT COLUMN
      let rightYPos = yPos - 12;
      const rightX = pageWidth - margin - 60;

      if (cotizacion.fecha_registro) {
        pdf.setFont("helvetica", "bold");
        pdf.text("Fecha Registro:", rightX, rightYPos);
        pdf.setFont("helvetica", "normal");
        pdf.text(
          ` ${formatDateShort(cotizacion.fecha_registro)}`,
          rightX + 28,
          rightYPos
        );
        rightYPos += 6;
      }
      if (cotizacion.fecha_reserva) {
        pdf.setFont("helvetica", "bold");
        pdf.text("Fecha de Reserva:", rightX, rightYPos);
        pdf.setFont("helvetica", "normal");
        pdf.text(
          ` ${formatDateShort(cotizacion.fecha_reserva)}`,
          rightX + 32,
          rightYPos
        );
        rightYPos += 6;
      }
      if (cotizacion.vigente_hasta) {
        pdf.setFont("helvetica", "bold");
        pdf.text("Cotización vigente hasta:", rightX, rightYPos);
        pdf.setFont("helvetica", "normal");
        pdf.text(
          ` ${formatDateShort(cotizacion.vigente_hasta)}`,
          rightX + 45,
          rightYPos
        );
      }

      yPos += 15; // More space before table

      // Table header - WIDER IMPORTE COLUMN
      const colWidths = {
        cantidad: 18,
        fechaInicio: 22,
        fechaFin: 22,
        precio: 22,
        servicio: 78,
        importe: 28,
      };

      pdf.setFillColor(240, 240, 240);
      pdf.rect(margin, yPos, pageWidth - 2 * margin, 8, "F");
      pdf.setDrawColor(200, 200, 200);
      pdf.setLineWidth(0.3);
      pdf.rect(margin, yPos, pageWidth - 2 * margin, 8);

      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(9);
      let xPos = margin + 2;

      pdf.text("Cantidad", xPos, yPos + 5);
      xPos += colWidths.cantidad;
      pdf.line(xPos, yPos, xPos, yPos + 8);

      pdf.text("Fecha inicio", xPos + 2, yPos + 5);
      xPos += colWidths.fechaInicio;
      pdf.line(xPos, yPos, xPos, yPos + 8);

      pdf.text("Fecha fin", xPos + 2, yPos + 5);
      xPos += colWidths.fechaFin;
      pdf.line(xPos, yPos, xPos, yPos + 8);

      pdf.text("Precio", xPos + 2, yPos + 5);
      xPos += colWidths.precio;
      pdf.line(xPos, yPos, xPos, yPos + 8);

      pdf.text("Servicio", xPos + 2, yPos + 5);
      xPos += colWidths.servicio;
      pdf.line(xPos, yPos, xPos, yPos + 8);

      pdf.text("Importe", xPos + 2, yPos + 5);
      yPos += 8;

      // Table rows
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(8);

      for (let i = 0; i < opciones.length; i++) {
        const opcion = opciones[i];
        const precioTotal = parseFloat(opcion.precio_total) || 0;

        if (yPos > pageHeight - 60) {
          pdf.addPage();
          yPos = margin;
        }

        xPos = margin + 2;

        // Build service text - FULL TEXT with proper wrapping
        const servicioDesc =
          opcion.servicio_descripcion || opcion.nombre_paquete || "";
        const maxCharsPerLine = 52; // SHORTER to prevent overflow into Importe column

        // Split servicio description into lines
        let servicioLines = [];
        let currentLine = "Servicio: ";
        const words = servicioDesc.split(" ");

        for (const word of words) {
          if ((currentLine + word).length > maxCharsPerLine) {
            servicioLines.push(currentLine.trim());
            currentLine = word + " ";
          } else {
            currentLine += word + " ";
          }
        }
        if (currentLine.trim()) {
          servicioLines.push(currentLine.trim());
        }

        // Add hotel info as separate lines
        if (opcion.hotel_nombre) {
          let hotelLine = `Hotel: ${opcion.hotel_nombre}`;
          if (opcion.ocupacion) {
            hotelLine += `, Ocupación: ${opcion.ocupacion}`;
          }
          servicioLines.push(hotelLine);
        }

        // Calculate row height based on number of lines
        const rowHeight = servicioLines.length * 4 + 6; // 4mm per line + MORE padding

        // Draw row
        pdf.setDrawColor(200, 200, 200);
        pdf.rect(margin, yPos, pageWidth - 2 * margin, rowHeight);

        pdf.text("1", xPos, yPos + 5);
        xPos += colWidths.cantidad;
        pdf.line(xPos, yPos, xPos, yPos + rowHeight);

        pdf.text(
          formatDateShort(cotizacion.fecha_salida) || "",
          xPos + 2,
          yPos + 5
        );
        xPos += colWidths.fechaInicio;
        pdf.line(xPos, yPos, xPos, yPos + rowHeight);

        pdf.text(
          formatDateShort(cotizacion.fecha_regreso) || "",
          xPos + 2,
          yPos + 5
        );
        xPos += colWidths.fechaFin;
        pdf.line(xPos, yPos, xPos, yPos + rowHeight);

        pdf.text(`$${precioTotal.toLocaleString("es-MX")}`, xPos + 2, yPos + 5);
        xPos += colWidths.precio;
        pdf.line(xPos, yPos, xPos, yPos + rowHeight);

        // Service text - RENDER ALL LINES
        // Render all servicio lines
        let lineYPos = yPos + 5; // Start LOWER from top
        for (let i = 0; i < servicioLines.length; i++) {
          const line = servicioLines[i];

          // Hotel line in BLUE/BOLD
          if (line.startsWith("Hotel:")) {
            pdf.setTextColor(0, 0, 255);
            pdf.setFont("helvetica", "bold");
            pdf.text(line, xPos + 2, lineYPos);
            pdf.setTextColor(0, 0, 0);
            pdf.setFont("helvetica", "normal");
          } else {
            pdf.text(line, xPos + 2, lineYPos);
          }

          lineYPos += 4; // Move to next line
        }
        xPos += colWidths.servicio;
        pdf.line(xPos, yPos, xPos, yPos + rowHeight);

        // Importe - SMALLER FONT to prevent overflow
        pdf.setFontSize(7);
        pdf.text(`$${precioTotal.toLocaleString("es-MX")}`, xPos + 2, yPos + 5);
        pdf.setFontSize(8); // Reset
        yPos += rowHeight;

        // Flights - BOLD
        if (opcion.vuelo_ida_fecha || opcion.vuelo_regreso_fecha) {
          if (yPos > pageHeight - 30) {
            pdf.addPage();
            yPos = margin;
          }
          pdf.setFont("helvetica", "bold");
          pdf.setFontSize(8);

          if (opcion.vuelo_ida_fecha) {
            const prefix = opcion.vuelo_ida_directo
              ? "VUELO DIRECTO, "
              : "VUELO, ";
            pdf.text(
              `${prefix}SALIDA ${formatDateLong(opcion.vuelo_ida_fecha)} ${opcion.vuelo_ida_ruta || ""}: ${opcion.vuelo_ida_horario || ""}`,
              margin,
              yPos + 3
            );
            yPos += 5;
          }
          if (opcion.vuelo_regreso_fecha) {
            const prefix = opcion.vuelo_regreso_directo
              ? "VUELO DIRECTO, "
              : "VUELO, ";
            pdf.text(
              `${prefix}REGRESO ${formatDateLong(opcion.vuelo_regreso_fecha)} ${opcion.vuelo_regreso_ruta || ""}: ${opcion.vuelo_regreso_horario || ""}`,
              margin,
              yPos + 3
            );
            yPos += 5;
          }
          pdf.setFont("helvetica", "normal");
        }

        // Incluye - SINGLE LINE with BOLD label
        const incluyeArray = Array.isArray(opcion.incluye)
          ? opcion.incluye
          : [];
        const noIncluyeArray = Array.isArray(opcion.no_incluye)
          ? opcion.no_incluye
          : [];

        if (incluyeArray.length > 0 || noIncluyeArray.length > 0) {
          if (yPos > pageHeight - 20) {
            pdf.addPage();
            yPos = margin;
          }

          let fullLine = "";

          if (incluyeArray.length > 0) {
            const incluyeText = incluyeArray
              .slice(0, 10)
              .filter((item) => item && item.trim)
              .map((item) => item.trim())
              .join(", ");
            fullLine = incluyeText;
          }

          if (noIncluyeArray.length > 0) {
            const noIncluyeText = noIncluyeArray
              .slice(0, 10)
              .filter((item) => item && item.trim)
              .map((item) => item.trim())
              .join(", ");
            if (fullLine) fullLine += "   "; // Space between sections
            fullLine += noIncluyeText;
          }

          if (fullLine) {
            let xOffset = margin;

            // "Incluye:" label in bold
            if (incluyeArray.length > 0) {
              pdf.setFont("helvetica", "bold");
              pdf.text("Incluye:", xOffset, yPos + 3);
              pdf.setFont("helvetica", "normal");
              xOffset += 15;

              const incluyeText = incluyeArray
                .slice(0, 10)
                .filter((item) => item && item.trim)
                .map((item) => item.trim())
                .join(", ");
              pdf.text(incluyeText.substring(0, 80), xOffset, yPos + 3);
              xOffset += pdf.getTextWidth(incluyeText.substring(0, 80)) + 5;
            }

            // "No incluye:" label in bold
            if (noIncluyeArray.length > 0) {
              pdf.setFont("helvetica", "bold");
              pdf.text("No incluye:", xOffset, yPos + 3);
              pdf.setFont("helvetica", "normal");
              xOffset += 20;

              const noIncluyeText = noIncluyeArray
                .slice(0, 10)
                .filter((item) => item && item.trim)
                .map((item) => item.trim())
                .join(", ");
              pdf.text(noIncluyeText.substring(0, 60), xOffset, yPos + 3);
            }

            yPos += 5;
          }
        }

        // Tour link - BLUE
        if (opcion.tour_link) {
          if (yPos > pageHeight - 15) {
            pdf.addPage();
            yPos = margin;
          }
          pdf.setTextColor(0, 0, 255);
          pdf.text(opcion.tour_link.substring(0, 120), margin, yPos + 3);
          pdf.setTextColor(0, 0, 0);
          yPos += 6;
        }

        yPos += 4;
      }

      // General description - BOLD
      if (opciones.length > 0 && opciones[0].servicio_descripcion) {
        if (yPos > pageHeight - 40) {
          pdf.addPage();
          yPos = margin;
        }
        yPos += 5;
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(9);
        pdf.text(
          opciones[0].servicio_descripcion.substring(0, 150).toUpperCase(),
          margin,
          yPos
        );
        yPos += 12;
      }

      // Disclaimers
      if (yPos > pageHeight - 50) {
        pdf.addPage();
        yPos = margin;
      }

      // Green disclaimer (optional)
      if (cotizacion.disclaimer_green && cotizacion.disclaimer_green.trim()) {
        pdf.setFont("helvetica", "bolditalic");
        pdf.setFontSize(10);
        pdf.setTextColor(0, 128, 0);
        const greenLines = pdf.splitTextToSize(
          cotizacion.disclaimer_green.trim(),
          pageWidth - 2 * margin
        );
        greenLines.forEach((line) => {
          pdf.text(line, margin, yPos);
          yPos += 5;
        });
        yPos += 3;
      }

      // Blue disclaimer (optional)
      if (cotizacion.disclaimer_blue && cotizacion.disclaimer_blue.trim()) {
        pdf.setFont("helvetica", "bolditalic");
        pdf.setFontSize(10);
        pdf.setTextColor(0, 0, 255);
        const blueLines = pdf.splitTextToSize(
          cotizacion.disclaimer_blue.trim(),
          pageWidth - 2 * margin
        );
        blueLines.forEach((line) => {
          pdf.text(line, margin, yPos);
          yPos += 5;
        });
        yPos += 3;
      }

      // Red disclaimer (always present)
      pdf.setFont("helvetica", "bolditalic");
      pdf.setFontSize(10);
      pdf.setTextColor(255, 0, 0);
      pdf.text(
        "LOS PRECIOS ESTÁN SUJETOS A CAMBIO SIN PREVIO AVISO",
        margin,
        yPos
      );
      yPos += 12;

      pdf.save(`Cotizacion-${cotizacion.folio}.pdf`);
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
