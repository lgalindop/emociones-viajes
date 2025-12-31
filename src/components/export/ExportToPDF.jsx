import { useState } from "react";
import jsPDF from "jspdf";
import { Download, Loader2 } from "lucide-react";
import { getCompanySettings } from "../../lib/useCompanySettings";

export default function ExportToPDF({ cotizacion, opciones }) {
  const [generating, setGenerating] = useState(false);

  function formatDateShort(dateString) {
    if (!dateString) return "";
    // Handle both date-only strings and timestamps
    const date = dateString.includes("T")
      ? new Date(dateString)
      : new Date(dateString + "T12:00:00");
    return date.toLocaleDateString("es-MX", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  }

  function formatDateLong(dateString) {
    if (!dateString) return "";
    const date = new Date(dateString + "T00:00:00");
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

      // HIGH-RES Logo - CENTERED
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
        canvas.width = 1200;
        canvas.height = 1200;
        const ctx = canvas.getContext("2d");
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(logoImg, 0, 0, 1200, 1200);
        const compressedDataUrl = canvas.toDataURL("image/png", 1.0);

        // Center the logo
        const logoSize = 25;
        pdf.addImage(
          compressedDataUrl,
          "PNG",
          (pageWidth - logoSize) / 2,
          yPos,
          logoSize,
          logoSize
        );
        yPos += logoSize + 3;
      } catch (e) {
        console.warn("Logo skipped:", e);
        yPos += 3;
      }

      // Company details - CENTERED, SINGLE LINE (no company name)
      pdf.setFontSize(9);
      pdf.setFont("helvetica", "normal");
      const addressLine = `${companySettings.address || ""} • ${companySettings.email || ""}`;
      pdf.text(addressLine, pageWidth / 2, yPos, { align: "center" });
      yPos += 5;

      const contactLine = `${companySettings.phone || ""} • RNT: ${companySettings.rnt || ""}`;
      pdf.text(contactLine, pageWidth / 2, yPos, { align: "center" });
      yPos += 10;

      // Separator line
      pdf.setDrawColor(200, 200, 200);
      pdf.setLineWidth(0.5);
      pdf.line(margin, yPos, pageWidth - margin, yPos);
      yPos += 10;

      // Two-column layout: Cliente (left) + Cotización info (right)
      pdf.setFontSize(10);
      const leftX = margin;
      const rightX = pageWidth / 2 + 10;

      // LEFT COLUMN - Cliente
      let leftYPos = yPos;
      pdf.setFont("helvetica", "bold");
      pdf.text("Cliente:", leftX, leftYPos);
      pdf.setFont("helvetica", "normal");
      pdf.text(cotizacion.cliente_nombre || "", leftX + 16, leftYPos);
      leftYPos += 6;

      pdf.setFont("helvetica", "normal");
      pdf.text(cotizacion.cliente_email || "", leftX, leftYPos);
      leftYPos += 6;

      pdf.text(cotizacion.cliente_telefono || "", leftX, leftYPos);
      leftYPos += 6;

      // Add travelers info if exists
      const numAdultos = cotizacion.num_adultos || 0;
      const numNinos = cotizacion.num_ninos || 0;
      const numInfantes = cotizacion.num_infantes || 0;

      if (numAdultos > 0 || numNinos > 0 || numInfantes > 0) {
        let travelersText = "";
        if (numAdultos > 0) travelersText += `${numAdultos} adulto(s)`;
        if (numNinos > 0) {
          if (travelersText) travelersText += ", ";
          travelersText += `${numNinos} niño(s)`;
        }
        if (numInfantes > 0) {
          if (travelersText) travelersText += ", ";
          travelersText += `${numInfantes} infante(s)`;
        }
        pdf.text(travelersText, leftX, leftYPos);
      }

      // RIGHT COLUMN - Cotización info
      let rightYPos = yPos;
      pdf.setFont("helvetica", "bold");
      pdf.text("Folio:", rightX, rightYPos);
      pdf.setFont("helvetica", "normal");
      pdf.text(cotizacion.folio || "", rightX + 12, rightYPos);
      rightYPos += 6;

      pdf.setFont("helvetica", "bold");
      pdf.text("Divisa:", rightX, rightYPos);
      pdf.setFont("helvetica", "normal");
      pdf.text(
        cotizacion.divisa === "MXN" ? "Peso Mexicano" : cotizacion.divisa,
        rightX + 14,
        rightYPos
      );
      rightYPos += 6;

      if (cotizacion.vigente_hasta) {
        pdf.setFont("helvetica", "bold");
        pdf.text("Vigencia cotización:", rightX, rightYPos);
        pdf.setFont("helvetica", "normal");
        pdf.text(
          formatDateShort(cotizacion.vigente_hasta),
          rightX + 38,
          rightYPos
        );
        rightYPos += 6;
      }

      if (cotizacion.created_at) {
        pdf.setFont("helvetica", "bold");
        pdf.text("Cotización creada:", rightX, rightYPos);
        pdf.setFont("helvetica", "normal");
        pdf.text(
          formatDateShort(cotizacion.created_at),
          rightX + 35,
          rightYPos
        );
      }

      // Add grupo if exists
      if (cotizacion.grupos?.nombre) {
        leftYPos += 6;
        pdf.setFont("helvetica", "bold");
        pdf.text("Grupo:", leftX, leftYPos);
        pdf.setFont("helvetica", "normal");
        pdf.text(cotizacion.grupos.nombre, leftX + 14, leftYPos);
      }

      yPos = Math.max(leftYPos, rightYPos) + 10;

      // Table header - NO CANTIDAD OR PRECIO
      const colWidths = {
        fechaInicio: 30,
        fechaFin: 30,
        servicio: 100,
        importe: 30,
      };

      pdf.setFillColor(240, 240, 240);
      pdf.rect(margin, yPos, pageWidth - 2 * margin, 8, "F");
      pdf.setDrawColor(200, 200, 200);
      pdf.setLineWidth(0.3);
      pdf.rect(margin, yPos, pageWidth - 2 * margin, 8);

      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(9);
      let xPos = margin + 2;

      pdf.text("Fecha inicio", xPos, yPos + 5);
      xPos += colWidths.fechaInicio;
      pdf.line(xPos, yPos, xPos, yPos + 8);

      pdf.text("Fecha fin", xPos + 2, yPos + 5);
      xPos += colWidths.fechaFin;
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

        // Build service text - USE INDIVIDUAL OPCION TEXT
        const servicioDesc =
          opcion.servicio_descripcion || opcion.nombre_paquete || "";
        const maxCharsPerLine = 68;

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

        // Calculate row height
        const rowHeight = servicioLines.length * 4 + 6;

        // Draw row
        pdf.setDrawColor(200, 200, 200);
        pdf.rect(margin, yPos, pageWidth - 2 * margin, rowHeight);

        pdf.text(
          formatDateShort(cotizacion.fecha_salida) || "",
          xPos,
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

        // Service text - RENDER ALL LINES
        let lineYPos = yPos + 5;
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

          lineYPos += 4;
        }
        xPos += colWidths.servicio;
        pdf.line(xPos, yPos, xPos, yPos + rowHeight);

        // Importe
        pdf.setFontSize(8);
        pdf.text(`$${precioTotal.toLocaleString("es-MX")}`, xPos + 2, yPos + 5);
        yPos += rowHeight;

        // Flights - BOLD, SMALLER FONT
        if (opcion.vuelo_ida_fecha || opcion.vuelo_regreso_fecha) {
          if (yPos > pageHeight - 30) {
            pdf.addPage();
            yPos = margin;
          }
          pdf.setFont("helvetica", "bold");
          pdf.setFontSize(6); // Reduced from 8

          if (opcion.vuelo_ida_fecha) {
            const prefix = opcion.vuelo_ida_directo ? "VUELO DIRECTO" : "VUELO";
            pdf.text(
              `${prefix} SALIDA ${formatDateLong(opcion.vuelo_ida_fecha)} ${opcion.vuelo_ida_ruta || ""} ${opcion.vuelo_ida_horario || ""}`,
              margin,
              yPos + 3
            );
            yPos += 4; // Reduced spacing
          }
          if (opcion.vuelo_regreso_fecha) {
            const prefix = opcion.vuelo_regreso_directo
              ? "VUELO DIRECTO"
              : "VUELO";
            pdf.text(
              `${prefix} REGRESO ${formatDateLong(opcion.vuelo_regreso_fecha)} ${opcion.vuelo_regreso_ruta || ""} ${opcion.vuelo_regreso_horario || ""}`,
              margin,
              yPos + 3
            );
            yPos += 4; // Reduced spacing
          }
          pdf.setFont("helvetica", "normal");
          pdf.setFontSize(8); // Reset to normal
        }

        // Incluye - SMALLER FONT
        const incluyeArray = Array.isArray(opcion.incluye)
          ? opcion.incluye.filter((item) => item && item.trim())
          : [];
        const noIncluyeArray = Array.isArray(opcion.no_incluye)
          ? opcion.no_incluye.filter((item) => item && item.trim())
          : [];

        if (incluyeArray.length > 0 || noIncluyeArray.length > 0) {
          if (yPos > pageHeight - 20) {
            pdf.addPage();
            yPos = margin;
          }

          pdf.setFontSize(6); // Reduced from 8
          let xOffset = margin;

          // "Incluye:" label ONLY if has data
          if (incluyeArray.length > 0) {
            pdf.setFont("helvetica", "bold");
            pdf.text("Incluye:", xOffset, yPos + 3);
            pdf.setFont("helvetica", "normal");
            xOffset += 12; // Adjusted for smaller font

            const incluyeText = incluyeArray
              .slice(0, 10)
              .map((item) => item.trim())
              .join(", ");
            pdf.text(incluyeText.substring(0, 100), xOffset, yPos + 3); // More characters fit
            xOffset += pdf.getTextWidth(incluyeText.substring(0, 100)) + 4;
          }

          // "No incluye:" label ONLY if has data
          if (noIncluyeArray.length > 0) {
            pdf.setFont("helvetica", "bold");
            pdf.text("No incluye:", xOffset, yPos + 3);
            pdf.setFont("helvetica", "normal");
            xOffset += 16; // Adjusted for smaller font

            const noIncluyeText = noIncluyeArray
              .slice(0, 10)
              .map((item) => item.trim())
              .join(", ");
            pdf.text(noIncluyeText.substring(0, 80), xOffset, yPos + 3);
          }

          pdf.setFontSize(8); // Reset to normal
          yPos += 4; // Reduced spacing
        }

        // Tour link - BLUE, SMALLER
        if (opcion.tour_link) {
          if (yPos > pageHeight - 15) {
            pdf.addPage();
            yPos = margin;
          }
          pdf.setFontSize(6); // Reduced from 8
          pdf.setTextColor(0, 0, 255);
          pdf.text(opcion.tour_link.substring(0, 140), margin, yPos + 3);
          pdf.setTextColor(0, 0, 0);
          pdf.setFontSize(8); // Reset
          yPos += 5;
        }

        yPos += 3; // Reduced from 4
      }

      // REMOVED: General description section

      // Disclaimers - AT BOTTOM OF PAGE, SMALLER FONT
      const disclaimerFontSize = 7; // Smaller
      const disclaimerLineHeight = 4;
      let disclaimerYPos = pageHeight - margin;

      // Calculate total disclaimer height to position from bottom
      let disclaimerLines = [];

      // Green disclaimer (optional) - FIRST
      if (cotizacion.disclaimer_green && cotizacion.disclaimer_green.trim()) {
        const greenLines = pdf.splitTextToSize(
          cotizacion.disclaimer_green.trim(),
          pageWidth - 2 * margin
        );
        greenLines.forEach((line) => {
          disclaimerLines.push({
            text: line,
            color: [0, 128, 0],
            bold: true,
          });
        });
      }

      // Blue disclaimer (optional) - SECOND
      if (cotizacion.disclaimer_blue && cotizacion.disclaimer_blue.trim()) {
        const blueLines = pdf.splitTextToSize(
          cotizacion.disclaimer_blue.trim(),
          pageWidth - 2 * margin
        );
        blueLines.forEach((line) => {
          disclaimerLines.push({
            text: line,
            color: [0, 0, 255],
            bold: true,
          });
        });
      }

      // Red disclaimer (always present) - THIRD
      disclaimerLines.push({
        text: "LOS PRECIOS ESTÁN SUJETOS A CAMBIO SIN PREVIO AVISO",
        color: [255, 0, 0],
        bold: true,
      });

      // Position from bottom
      disclaimerYPos =
        pageHeight - margin - disclaimerLines.length * disclaimerLineHeight;

      // Check if we need a new page for disclaimers
      if (disclaimerYPos < yPos + 10) {
        pdf.addPage();
        disclaimerYPos =
          pageHeight - margin - disclaimerLines.length * disclaimerLineHeight;
      }

      // Print disclaimers in order (top to bottom)
      pdf.setFont("helvetica", "bolditalic");
      pdf.setFontSize(disclaimerFontSize);
      disclaimerLines.forEach((line) => {
        pdf.setTextColor(...line.color);
        pdf.text(line.text, margin, disclaimerYPos);
        disclaimerYPos += disclaimerLineHeight;
      });
      pdf.setTextColor(0, 0, 0); // Reset color

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
