import React, { useState, useEffect } from "react";
import { jsPDF } from "jspdf";
import { parseMoneyToNumber } from "../lib/money";
import { getCompanySettings } from "../lib/useCompanySettings";

export default function PropuestaPDF({ cotizacion, onBack }) {
  const [companySettings, setCompanySettings] = useState(null);
  const opciones = cotizacion.opciones_cotizacion || [];

  useEffect(() => {
    getCompanySettings().then(setCompanySettings);
  }, []);

  async function generarPDF() {
    // Wait for company settings if not loaded
    let settings = companySettings;
    if (!settings) {
      settings = await getCompanySettings();
    }

    const doc = new jsPDF("p", "pt", "a4");
    const margin = 40;
    let y = margin;

    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text(settings?.company_name || "EMOCIONES VIAJES", 210, y, {
      align: "center",
    });
    y += 26;

    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text("Cotización profesional", 210, y, { align: "center" });
    y += 26;

    doc.setFont("helvetica", "bold");
    doc.text("Cliente:", margin, y);
    doc.setFont("helvetica", "normal");
    doc.text(cotizacion.cliente_nombre || "-", margin + 70, y);
    y += 18;

    if (cotizacion.cliente_telefono) {
      doc.text(`Tel: ${cotizacion.cliente_telefono}`, margin, y);
      y += 14;
    }
    if (cotizacion.cliente_email) {
      doc.text(`Email: ${cotizacion.cliente_email}`, margin, y);
      y += 14;
    }
    y += 6;

    doc.setFont("helvetica", "bold");
    doc.text("Viaje:", margin, y);
    doc.setFont("helvetica", "normal");
    doc.text(
      `${cotizacion.destino || "-"} (${cotizacion.fecha_salida} → ${cotizacion.fecha_regreso})`,
      margin + 50,
      y,
      { maxWidth: 450 }
    );
    y += 18;

    doc.setFont("helvetica", "bold");
    doc.text("Opciones:", margin, y);
    y += 14;

    doc.setFont("helvetica", "normal");
    let total = 0;
    opciones.forEach((op, idx) => {
      const precio =
        op.precio_total ?? parseMoneyToNumber(op.precio_total_raw) ?? 0;
      total += precio;

      doc.setFont("helvetica", "bold");
      doc.text(`${idx + 1}. ${op.nombre_paquete}`, margin, y);
      doc.setFont("helvetica", "normal");
      doc.text(
        `${cotizacion.divisa || "MXN"} ${Number(precio).toLocaleString("es-MX")}`,
        520,
        y,
        { align: "right" }
      );
      y += 14;

      if (op.incluye && op.incluye.length > 0) {
        doc.setFontSize(10);
        doc.text(`Incluye: ${op.incluye.join(", ")}`, margin + 10, y, {
          maxWidth: 480,
        });
        doc.setFontSize(12);
        y += 12;
      }
      if (op.no_incluye && op.no_incluye.length > 0) {
        doc.setFontSize(10);
        doc.text(`No incluye: ${op.no_incluye.join(", ")}`, margin + 10, y, {
          maxWidth: 480,
        });
        doc.setFontSize(12);
        y += 12;
      }
      if (op.notas) {
        doc.setFontSize(10);
        doc.text(`Notas: ${op.notas}`, margin + 10, y, { maxWidth: 480 });
        doc.setFontSize(12);
        y += 14;
      }

      if (y > 730) {
        doc.addPage();
        y = margin;
      }
    });

    y += 18;
    doc.setFont("helvetica", "bold");
    doc.text(
      `Total: ${cotizacion.divisa || "MXN"} ${Number(total).toLocaleString("es-MX")}`,
      margin,
      y
    );
    y += 30;

    if (cotizacion.notas) {
      doc.setFont("helvetica", "bold");
      doc.text("Notas:", margin, y);
      y += 14;
      doc.setFont("helvetica", "normal");
      doc.text(cotizacion.notas, margin, y, { maxWidth: 500 });
    }

    doc.save(`${cotizacion.folio || "cotizacion"}.pdf`);
  }

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <button
        onClick={onBack}
        className="mb-4 text-gray-600 hover:text-gray-900"
      >
        ← Volver
      </button>
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-bold mb-4">Generar Propuesta (PDF)</h2>
        <p className="text-sm text-gray-600 mb-4">
          Incluye lista de opciones, incluye/no incluye y totales.
        </p>
        <div className="mt-4 flex gap-2">
          <button
            onClick={generarPDF}
            className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
          >
            Generar PDF
          </button>
          <button onClick={onBack} className="bg-gray-200 px-4 py-2 rounded">
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
