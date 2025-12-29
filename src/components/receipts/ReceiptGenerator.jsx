import { useState, useRef, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../contexts/AuthContext";
import { getCompanySettings } from "../../lib/useCompanySettings";
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
  const [companySettings, setCompanySettings] = useState(null);
  const receiptRef = useRef();
  const { user } = useAuth();

  useEffect(() => {
    // Fetch company settings
    getCompanySettings().then(setCompanySettings);
  }, []);

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

    const thousands = Math.floor(num / 1000);
    const remainder = num % 1000;
    const hundredsDigit = Math.floor(remainder / 100);
    const tensDigit = Math.floor((remainder % 100) / 10);
    const unitsDigit = remainder % 10;

    let result = "";

    if (thousands > 0) {
      result += thousands === 1 ? "mil" : `${units[thousands]} mil`;
    }

    if (hundredsDigit > 0) {
      result +=
        " " +
        (hundredsDigit === 1 && remainder === 100
          ? "cien"
          : hundreds[hundredsDigit]);
    }

    if (tensDigit > 0) {
      result += " " + tens[tensDigit];
    }

    if (unitsDigit > 0 && tensDigit !== 2) {
      result += " " + units[unitsDigit];
    }

    return result.trim();
  }

  function formatDate(dateStr) {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return date.toLocaleDateString("es-MX", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  }

  async function generateReceiptImage() {
    setGenerating(true);

    try {
      const element = receiptRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        backgroundColor: template === "informal" ? null : "#ffffff",
        logging: false,
      });

      return new Promise((resolve) => {
        canvas.toBlob((blob) => {
          if (blob) {
            resolve(blob);
          }
        }, "image/png");
      });
    } catch (error) {
      console.error("Error generating image:", error);
      throw error;
    }
  }

  async function generateReceiptPDF() {
    try {
      const element = receiptRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        backgroundColor: template === "informal" ? null : "#ffffff",
        logging: false,
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: template === "informal" ? "portrait" : "portrait",
        unit: "px",
        format: [canvas.width / 2, canvas.height / 2],
      });

      pdf.addImage(imgData, "PNG", 0, 0, canvas.width / 2, canvas.height / 2);
      return pdf;
    } catch (error) {
      console.error("Error generating PDF:", error);
      throw error;
    }
  }

  async function handleGenerate() {
    try {
      const imageBlob = await generateReceiptImage();
      const pdf = await generateReceiptPDF();

      const { data: fileData, error: uploadError } = await supabase.storage
        .from("receipts")
        .upload(`${Date.now()}-${pago.id}.png`, imageBlob, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("receipts")
        .getPublicUrl(fileData.path);

      const receiptData = {
        receipt_number: receiptNumber,
        venta_id: venta.id,
        pago_id: pago.id,
        template_type: template,
        custom_text: template === "informal" ? customText : null,
        amount: pago.monto,
        payment_date: pago.fecha_pagado || pago.fecha_programada,
        payment_method: pago.metodo_pago,
        total_price: venta.precio_total,
        previous_payments: venta.monto_pagado - pago.monto,
        balance: venta.monto_pendiente,
        client_name: venta.cotizaciones.cliente_nombre,
        client_phone: venta.cotizaciones.cliente_telefono,
        client_email: venta.cotizaciones.cliente_email,
        folio_venta: venta.folio_venta,
        image_url: urlData.publicUrl,
        created_by: user.id,
        receipt_stage: "generated",
        destination: venta.cotizaciones.destino,
        travelers:
          venta.cotizaciones.num_adultos + venta.cotizaciones.num_ninos,
      };

      const { data: receipt, error: insertError } = await supabase
        .from("receipts")
        .insert([receiptData])
        .select()
        .single();

      if (insertError) throw insertError;

      if (onSuccess) {
        onSuccess(receipt, pdf);
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Error al generar recibo: " + error.message);
    } finally {
      setGenerating(false);
    }
  }

  const receiptData = {
    receipt_number: receiptNumber,
    amount: pago.monto,
    payment_date: pago.fecha_pagado || pago.fecha_programada,
    payment_method: pago.metodo_pago,
    total_price: venta.precio_total,
    previous_payments: venta.monto_pagado - pago.monto,
    balance: venta.monto_pendiente,
    client_name: venta.cotizaciones.cliente_nombre,
    folio_venta: venta.folio_venta,
    custom_text: customText,
    fecha_viaje: venta.fecha_viaje,
    destino: venta.cotizaciones.destino,
  };

  // Format company info for professional receipt
  const companyInfo = companySettings
    ? {
        email: companySettings.email,
        phone: companySettings.phone,
        address:
          companySettings.address ||
          `${companySettings.city}, ${companySettings.state}, ${companySettings.country}`,
      }
    : null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b p-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">Generar Recibo</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
          {/* Template Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de Recibo
            </label>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setTemplate("informal")}
                className={`p-4 border-2 rounded-lg flex flex-col items-center gap-2 ${
                  template === "informal"
                    ? "border-primary bg-primary/5"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <MessageSquare size={24} />
                <span className="font-medium">Informal</span>
                <span className="text-xs text-gray-600">
                  Para WhatsApp/redes
                </span>
              </button>
              <button
                onClick={() => setTemplate("professional")}
                className={`p-4 border-2 rounded-lg flex flex-col items-center gap-2 ${
                  template === "professional"
                    ? "border-primary bg-primary/5"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <FileText size={24} />
                <span className="font-medium">Profesional</span>
                <span className="text-xs text-gray-600">Para email/PDF</span>
              </button>
            </div>
          </div>

          {/* Custom Text for Informal */}
          {template === "informal" && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Texto del Recibo
              </label>
              <textarea
                value={customText}
                onChange={(e) => setCustomText(e.target.value)}
                rows={6}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary"
              />
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
                      <ProfessionalReceipt
                        data={receiptData}
                        companyInfo={companyInfo}
                      />
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
                  <ProfessionalReceipt
                    data={receiptData}
                    companyInfo={companyInfo}
                  />
                )}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="flex-1 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 font-medium flex items-center justify-center gap-2"
            >
              <Download size={20} />
              {generating ? "Generando..." : "Generar Recibo"}
            </button>
            <button
              onClick={onClose}
              className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
