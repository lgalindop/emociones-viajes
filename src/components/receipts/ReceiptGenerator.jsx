import { useState, useRef, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../contexts/AuthContext";
import { X, FileText, MessageSquare, Download, Send, Eye } from "lucide-react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import ProfessionalReceipt from "./ProfessionalReceipt";
import InformalReceipt from "./InformalReceipt";

export default function ReceiptGenerator({
  venta,
  pago,
  customData,
  onClose,
  onSuccess,
}) {
  const [template, setTemplate] = useState(
    customData?.template_type || "informal"
  );
  const [customText, setCustomText] = useState(customData?.custom_text || "");
  const [generating, setGenerating] = useState(false);
  const [preview, setPreview] = useState(false);
  const [receiptNumber, setReceiptNumber] = useState("REC-2025-XXXXX");
  const receiptRef = useRef();
  const { user } = useAuth();

  useEffect(() => {
    // Generate default custom text for informal receipt
    if (template === "informal") {
      generateDefaultText();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [template]);

  function generateDefaultText() {
    const amountText = convertNumberToWords(pago.monto);
    const text = `Se recibió un pago de $${pago.monto.toLocaleString("es-MX", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })} (${amountText} pesos 00/100 M.N.) como ${pago.numero_pago === 1 ? "abono inicial" : "abono"} para la reservación de ${venta.cotizaciones.destino || "viaje"}, a nombre de ${venta.cotizaciones.cliente_nombre}, con fecha de viaje del ${formatDate(venta.fecha_viaje)}.`;

    setCustomText(text);
  }

  function convertNumberToWords(num) {
    // Simple conversion for common amounts
    const units = [
      "",
      "un",
      "dos",
      "tres",
      "cuatro",
      "cinco",
      "seis",
      "siete",
      "ocho",
      "nueve",
    ];
    const teens = [
      "diez",
      "once",
      "doce",
      "trece",
      "catorce",
      "quince",
      "dieciséis",
      "diecisiete",
      "dieciocho",
      "diecinueve",
    ];
    const tens = [
      "",
      "",
      "veinte",
      "treinta",
      "cuarenta",
      "cincuenta",
      "sesenta",
      "setenta",
      "ochenta",
      "noventa",
    ];
    const hundreds = [
      "",
      "ciento",
      "doscientos",
      "trescientos",
      "cuatrocientos",
      "quinientos",
      "seiscientos",
      "setecientos",
      "ochocientos",
      "novecientos",
    ];

    const integer = Math.floor(num);

    if (integer < 10) return units[integer];
    if (integer < 20) return teens[integer - 10];
    if (integer < 100) {
      const ten = Math.floor(integer / 10);
      const unit = integer % 10;
      return tens[ten] + (unit > 0 ? ` y ${units[unit]}` : "");
    }
    if (integer < 1000) {
      const hundred = Math.floor(integer / 100);
      const rest = integer % 100;
      if (integer === 100) return "cien";
      return (
        hundreds[hundred] + (rest > 0 ? ` ${convertNumberToWords(rest)}` : "")
      );
    }
    if (integer < 1000000) {
      const thousands = Math.floor(integer / 1000);
      const rest = integer % 1000;
      const thousandText =
        thousands === 1 ? "mil" : `${convertNumberToWords(thousands)} mil`;
      return thousandText + (rest > 0 ? ` ${convertNumberToWords(rest)}` : "");
    }

    return integer.toLocaleString("es-MX");
  }

  function formatDate(dateStr) {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return date.toLocaleDateString("es-MX", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }

  async function generateReceipt() {
    setGenerating(true);
    try {
      // Generate receipt number FIRST
      const year = new Date().getFullYear();
      const { data: lastReceipt } = await supabase
        .from("receipts")
        .select("receipt_number")
        .like("receipt_number", `REC-${year}-%`)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      let nextNumber = 1;
      if (lastReceipt?.receipt_number) {
        const lastNum = parseInt(lastReceipt.receipt_number.split("-")[2]);
        nextNumber = lastNum + 1;
      }
      const generatedReceiptNumber = `REC-${year}-${String(nextNumber).padStart(5, "0")}`;
      setReceiptNumber(generatedReceiptNumber);

      // Wait for React to update state and re-render
      await new Promise((resolve) => setTimeout(resolve, 500));

      await document.fonts.ready;

      const element = receiptRef.current;

      // Create a clone for capturing
      const clone = element.cloneNode(true);
      clone.style.width = "800px";
      clone.style.minHeight = "auto";
      clone.style.height = "auto";
      clone.style.position = "absolute";
      clone.style.left = "-99999px";
      clone.style.top = "0";
      clone.style.zIndex = "-1";
      clone.style.transform = "none";
      clone.style.opacity = "1";
      clone.style.visibility = "visible";

      document.body.appendChild(clone);

      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Get actual rendered height
      const actualHeight = clone.scrollHeight;

      const canvas = await html2canvas(clone, {
        width: 800,
        height: actualHeight,
        windowWidth: 800,
        windowHeight: actualHeight,
        scale: 3,
        backgroundColor: "#ffffff",
        logging: false,
        useCORS: true,
        allowTaint: true,
      });

      // Remove clone
      document.body.removeChild(clone);

      // Convert to blob
      const blob = await new Promise((resolve) =>
        canvas.toBlob(resolve, "image/jpeg", 0.95)
      );

      // Upload image
      const timestamp = Date.now();
      const filename = `${venta.folio_venta}-${timestamp}.jpg`;
      const { error: uploadError, data: uploadData } = await supabase.storage
        .from("receipts")
        .upload(`${venta.id}/${filename}`, blob);

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl: imageUrl },
      } = supabase.storage.from("receipts").getPublicUrl(uploadData.path);

      // Generate PDF for professional template
      let pdfUrl = null;
      if (template === "professional") {
        const pdf = new jsPDF({
          orientation: "portrait",
          unit: "px",
          format: [800, actualHeight],
        });

        const imgData = canvas.toDataURL("image/jpeg", 0.95);
        pdf.addImage(imgData, "JPEG", 0, 0, 800, actualHeight);

        const pdfBlob = pdf.output("blob");
        const pdfFilename = `${venta.folio_venta}-${timestamp}.pdf`;

        const { error: pdfError, data: pdfData } = await supabase.storage
          .from("receipts")
          .upload(`${venta.id}/${pdfFilename}`, pdfBlob);

        if (!pdfError) {
          const {
            data: { publicUrl },
          } = supabase.storage.from("receipts").getPublicUrl(pdfData.path);
          pdfUrl = publicUrl;
        }
      }

      // Save receipt record
      const { data: receipt, error: dbError } = await supabase
        .from("receipts")
        .insert({
          receipt_number: generatedReceiptNumber,
          venta_id: venta.id,
          pago_id: pago.id,
          template_type: template,
          custom_text: template === "informal" ? customText : null,
          amount: pago.monto,
          payment_date:
            pago.fecha_pagado || new Date().toISOString().split("T")[0],
          payment_method: pago.metodo_pago,
          total_price: venta.precio_total,
          previous_payments: venta.monto_pagado - pago.monto,
          balance: venta.monto_pendiente,
          client_name: venta.cotizaciones.cliente_nombre,
          client_phone: venta.cotizaciones.cliente_telefono,
          folio_venta: venta.folio_venta,
          image_url: imageUrl,
          pdf_url: pdfUrl,
          created_by: user.id,
        })
        .select()
        .single();

      if (dbError) throw dbError;

      alert("✅ Recibo generado exitosamente");
      onSuccess(receipt);
      onClose();
    } catch (error) {
      console.error("Error generating receipt:", error);
      alert("Error al generar recibo: " + error.message);
    } finally {
      setGenerating(false);
    }
  }

  const receiptData = {
    receipt_number: receiptNumber,
    amount: pago.monto,
    payment_date: pago.fecha_pagado || new Date().toISOString().split("T")[0],
    payment_method: pago.metodo_pago || "Efectivo",
    client_name: venta.cotizaciones.cliente_nombre,
    folio_venta: venta.folio_venta,
    total_price: venta.precio_total,
    previous_payments: venta.monto_pagado - pago.monto,
    balance: venta.monto_pendiente,
    custom_text: customText,
    fecha_viaje: venta.fecha_viaje,
    line_items: customData?.line_items || [],
    show_comision: customData?.show_comision || false,
    show_fechas: customData?.show_fechas !== false,
    show_reserva_info: customData?.show_reserva_info !== false,
    comision: customData?.comision || "0.00",
    fecha_proximo_abono: customData?.fecha_proximo_abono || "",
    fecha_limite_pago: customData?.fecha_limite_pago || "",
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[95vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between z-10">
          <div>
            <h2 className="text-2xl font-bold text-primary">Generar Recibo</h2>
            <p className="text-sm text-gray-600">
              {venta.folio_venta} - Pago #{pago.numero_pago} - $
              {pago.monto.toLocaleString("es-MX")}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6">
          {/* Template Selector */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Tipo de Recibo
            </label>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setTemplate("informal")}
                className={`p-4 border-2 rounded-lg text-left transition-all ${
                  template === "informal"
                    ? "border-primary bg-primary/5"
                    : "border-gray-300 hover:border-primary/50"
                }`}
              >
                <MessageSquare size={24} className="text-primary mb-2" />
                <div className="font-semibold">Informal</div>
                <div className="text-sm text-gray-600">
                  Nota simple con texto personalizado
                </div>
              </button>

              <button
                onClick={() => setTemplate("professional")}
                className={`p-4 border-2 rounded-lg text-left transition-all ${
                  template === "professional"
                    ? "border-primary bg-primary/5"
                    : "border-gray-300 hover:border-primary/50"
                }`}
              >
                <FileText size={24} className="text-primary mb-2" />
                <div className="font-semibold">Profesional</div>
                <div className="text-sm text-gray-600">
                  Formato completo con detalles (+ PDF)
                </div>
              </button>
            </div>
          </div>

          {/* Custom Text Editor (Informal Only) */}
          {template === "informal" && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descripción del Pago
              </label>
              <textarea
                value={customText}
                onChange={(e) => setCustomText(e.target.value)}
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="Descripción detallada del pago..."
              />
              <p className="text-xs text-gray-500 mt-1">
                Edita el texto que aparecerá en el recibo
              </p>
            </div>
          )}

          {/* Preview */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium text-gray-700">
                Vista Previa
              </label>
              <button
                onClick={() => setPreview(!preview)}
                className="text-sm text-primary hover:underline flex items-center gap-1"
              >
                <Eye size={16} />
                {preview ? "Ocultar" : "Ver"} previa completa
              </button>
            </div>

            {preview && (
              <div className="border-2 border-gray-300 rounded-lg p-4 bg-gray-50 overflow-auto">
                <div
                  style={{
                    transform: "scale(0.5)",
                    transformOrigin: "top left",
                    width: "200%",
                  }}
                >
                  <div ref={receiptRef}>
                    {template === "informal" ? (
                      <InformalReceipt data={receiptData} />
                    ) : (
                      <ProfessionalReceipt data={receiptData} />
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Hidden full-size receipt for capture */}
          {!preview && (
            <div
              style={{
                position: "fixed",
                left: 0,
                top: 0,
                zIndex: -1,
                opacity: 0,
                pointerEvents: "none",
              }}
            >
              <div ref={receiptRef}>
                {template === "informal" ? (
                  <InformalReceipt data={receiptData} />
                ) : (
                  <ProfessionalReceipt data={receiptData} />
                )}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={generateReceipt}
              disabled={generating}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {generating ? (
                <>Generando...</>
              ) : (
                <>
                  <Download size={20} />
                  Generar Recibo
                </>
              )}
            </button>

            <button
              onClick={onClose}
              className="px-6 py-3 border-2 border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
