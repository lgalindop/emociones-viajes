import { useRef } from "react";
import { Download } from "lucide-react";
import html2canvas from "html2canvas";
import ProfessionalReceipt from "./ProfessionalReceipt";
import InformalReceipt from "./InformalReceipt";

export default function ReceiptPreview({ receiptData, onGenerate, loading, editMode }) {
  const receiptRef = useRef();

  async function handleGenerate() {
    if (!receiptData.clientName || !receiptData.amountPaid || !receiptData.destination) {
      alert("Completa todos los campos requeridos");
      return;
    }

    try {
      // Capture the receipt as image
      const element = receiptRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        backgroundColor: "#ffffff",
        logging: false,
      });

      canvas.toBlob((blob) => {
        if (blob) {
          onGenerate(blob);
        }
      }, "image/png");
    } catch (error) {
      console.error("Error:", error);
      alert("Error al generar imagen: " + error.message);
    }
  }

  const formattedData = {
    receipt_number: receiptData.receiptNumber,
    amount: parseFloat(receiptData.amountPaid || 0),
    payment_date: receiptData.paymentDate,
    payment_method: receiptData.paymentMethod,
    client_name: receiptData.clientName,
    destination: receiptData.destination,
    travelers: receiptData.travelers ? parseInt(receiptData.travelers) : null,
    custom_text: receiptData.notes || `Pago recibido por concepto de viaje a ${receiptData.destination}.`,
  };

  return (
    <div>
      {/* Preview */}
      <div className="mb-4 border-2 border-dashed border-gray-300 rounded-lg p-4 bg-gray-50">
        <div ref={receiptRef} className="bg-white">
          {receiptData.templateType === "professional" ? (
            <ProfessionalReceipt data={formattedData} />
          ) : (
            <InformalReceipt data={formattedData} />
          )}
        </div>
      </div>

      {/* Generate Button */}
      <button
        onClick={handleGenerate}
        disabled={loading}
        className="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 font-medium flex items-center justify-center gap-2"
      >
        <Download size={20} />
        {loading ? "Generando..." : editMode ? "Actualizar Recibo" : "Generar Recibo"}
      </button>
    </div>
  );
}
