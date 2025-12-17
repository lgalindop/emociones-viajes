import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import {
  Download,
  Eye,
  Send,
  FileText,
  MessageSquare,
  Search,
  Filter,
  Plus,
  X,
} from "lucide-react";
import ReceiptWizard from "./ReceiptWizard";

export default function ReceiptsList() {
  const [receipts, setReceipts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterTemplate, setFilterTemplate] = useState("all");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");
  const [showWizard, setShowWizard] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState(null);

  useEffect(() => {
    fetchReceipts();
  }, []);

  async function fetchReceipts() {
    try {
      const { data, error } = await supabase
        .from("receipts")
        .select(
          `
          *,
          ventas (
            folio_venta,
            cotizaciones (
              cliente_nombre,
              destino
            )
          )
        `
        )
        .order("created_at", { ascending: false });

      if (error) throw error;
      setReceipts(data || []);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  }

  async function shareViaWhatsApp(receipt) {
    const message = encodeURIComponent(
      `Recibo de pago ${receipt.receipt_number}\nFolio: ${receipt.folio_venta}\nMonto: $${receipt.amount.toLocaleString("es-MX")}`
    );

    // Try native share first (mobile)
    if (navigator.share) {
      try {
        const response = await fetch(receipt.image_url);
        const blob = await response.blob();
        const file = new File([blob], `${receipt.receipt_number}.jpg`, {
          type: "image/jpeg",
        });

        await navigator.share({
          title: "Recibo de Pago",
          text: `Recibo ${receipt.receipt_number}`,
          files: [file],
        });

        // Mark as sent
        await supabase
          .from("receipts")
          .update({
            sent_via_whatsapp: true,
            sent_at: new Date().toISOString(),
          })
          .eq("id", receipt.id);

        fetchReceipts();
        return;
      } catch (error) {
        console.log("Native share failed, falling back to WhatsApp Web");
      }
    }

    // Fallback: WhatsApp Web
    const phone = receipt.client_phone?.replace(/\D/g, "");
    if (phone) {
      const whatsappUrl = `https://wa.me/${phone}?text=${message}`;
      window.open(whatsappUrl, "_blank");

      await supabase
        .from("receipts")
        .update({
          sent_via_whatsapp: true,
          sent_at: new Date().toISOString(),
        })
        .eq("id", receipt.id);

      fetchReceipts();
    } else {
      alert("No hay número de teléfono registrado");
    }
  }

  const filteredReceipts = receipts.filter((r) => {
    const matchesSearch =
      r.client_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.folio_venta?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.receipt_number?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter =
      filterTemplate === "all" || r.template_type === filterTemplate;

    const receiptDate = new Date(r.created_at);
    const matchesDateFrom =
      !filterDateFrom || receiptDate >= new Date(filterDateFrom);
    const matchesDateTo =
      !filterDateTo || receiptDate <= new Date(filterDateTo + "T23:59:59");

    return matchesSearch && matchesFilter && matchesDateFrom && matchesDateTo;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-600">Cargando recibos...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-primary">Recibos</h1>
            <p className="text-gray-600">{receipts.length} recibos generados</p>
          </div>
          <button
            onClick={() => setShowWizard(true)}
            className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 font-medium shadow-lg"
          >
            <Plus size={20} />
            Nuevo Recibo
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-4 mb-6 space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={20}
              />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por cliente, folio o número de recibo..."
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary"
              />
            </div>

            <div className="flex items-center gap-2">
              <Filter size={20} className="text-gray-400" />
              <select
                value={filterTemplate}
                onChange={(e) => setFilterTemplate(e.target.value)}
                className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary"
              >
                <option value="all">Todos los tipos</option>
                <option value="informal">Informal</option>
                <option value="professional">Profesional</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm text-gray-600 mb-1">Desde</label>
              <input
                type="date"
                value={filterDateFrom}
                onChange={(e) => setFilterDateFrom(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm text-gray-600 mb-1">Hasta</label>
              <input
                type="date"
                value={filterDateTo}
                onChange={(e) => setFilterDateTo(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary"
              />
            </div>
            {(filterDateFrom || filterDateTo) && (
              <button
                onClick={() => {
                  setFilterDateFrom("");
                  setFilterDateTo("");
                }}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 self-end"
              >
                Limpiar fechas
              </button>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-600">Total Recibido</div>
            <div className="text-2xl font-bold text-green-600">
              $
              {receipts
                .reduce((sum, r) => sum + parseFloat(r.amount || 0), 0)
                .toLocaleString("es-MX")}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-600">Enviados por WhatsApp</div>
            <div className="text-2xl font-bold text-primary">
              {receipts.filter((r) => r.sent_via_whatsapp).length}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-600">Este Mes</div>
            <div className="text-2xl font-bold text-blue-600">
              {
                receipts.filter((r) => {
                  const date = new Date(r.created_at);
                  const now = new Date();
                  return (
                    date.getMonth() === now.getMonth() &&
                    date.getFullYear() === now.getFullYear()
                  );
                }).length
              }
            </div>
          </div>
        </div>

        {/* Receipts Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Recibo #
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Cliente
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Folio Venta
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Monto
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Tipo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Fecha
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredReceipts.map((receipt) => (
                <tr
                  key={receipt.id}
                  onClick={() => setSelectedReceipt(receipt)}
                  className="hover:bg-gray-50 cursor-pointer"
                >
                  <td className="px-6 py-4">
                    <span className="font-mono text-sm font-medium">
                      {receipt.receipt_number}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium">
                      {receipt.client_name}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-mono text-sm">
                      {receipt.folio_venta}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-semibold text-green-600">
                      ${parseFloat(receipt.amount).toLocaleString("es-MX")}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {receipt.template_type === "informal" ? (
                        <>
                          <MessageSquare size={16} className="text-blue-500" />
                          <span className="text-sm">Informal</span>
                        </>
                      ) : (
                        <>
                          <FileText size={16} className="text-purple-500" />
                          <span className="text-sm">Profesional</span>
                        </>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm">
                      {new Date(receipt.created_at).toLocaleDateString("es-MX")}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => window.open(receipt.image_url, "_blank")}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                        title="Ver recibo"
                      >
                        <Eye size={18} />
                      </button>
                      <button
                        onClick={() => {
                          const link = document.createElement("a");
                          link.href = receipt.image_url;
                          link.download = `${receipt.receipt_number}.jpg`;
                          link.click();
                        }}
                        className="p-2 text-green-600 hover:bg-green-50 rounded"
                        title="Descargar"
                      >
                        <Download size={18} />
                      </button>
                      <button
                        onClick={() => shareViaWhatsApp(receipt)}
                        className="p-2 text-green-600 hover:bg-green-50 rounded"
                        title="Enviar por WhatsApp"
                      >
                        <Send size={18} />
                      </button>
                      {receipt.pdf_url && (
                        <button
                          onClick={() => window.open(receipt.pdf_url, "_blank")}
                          className="p-2 text-red-600 hover:bg-red-50 rounded"
                          title="Ver PDF"
                        >
                          <FileText size={18} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredReceipts.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              {searchTerm || filterTemplate !== "all"
                ? "No se encontraron recibos con esos criterios"
                : "No hay recibos generados"}
            </div>
          )}
        </div>
      </div>

      {/* Receipt Wizard */}
      {showWizard && (
        <ReceiptWizard
          onClose={() => setShowWizard(false)}
          onSuccess={(receipt) => {
            fetchReceipts();
            setShowWizard(false);
            alert("✅ Recibo generado exitosamente");
          }}
        />
      )}

      {/* Receipt Detail Modal */}
      {selectedReceipt && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedReceipt(null)}
        >
          <div
            className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-primary">
                {selectedReceipt.receipt_number}
              </h2>
              <button
                onClick={() => setSelectedReceipt(null)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-gray-600">Cliente</div>
                  <div className="font-semibold">
                    {selectedReceipt.client_name}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Folio</div>
                  <div className="font-semibold">
                    {selectedReceipt.folio_venta}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Monto</div>
                  <div className="font-semibold text-green-600 text-xl">
                    $
                    {parseFloat(selectedReceipt.amount).toLocaleString("es-MX")}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Fecha</div>
                  <div className="font-semibold">
                    {new Date(selectedReceipt.payment_date).toLocaleDateString(
                      "es-MX"
                    )}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Método</div>
                  <div className="font-semibold">
                    {selectedReceipt.payment_method}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Tipo</div>
                  <div className="flex items-center gap-2">
                    {selectedReceipt.template_type === "informal" ? (
                      <>
                        <MessageSquare size={16} className="text-blue-500" />
                        <span>Informal</span>
                      </>
                    ) : (
                      <>
                        <FileText size={16} className="text-purple-500" />
                        <span>Profesional</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="border-t pt-4 flex gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    window.open(selectedReceipt.image_url, "_blank");
                  }}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <Eye size={20} />
                  Ver Recibo
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    const link = document.createElement("a");
                    link.href = selectedReceipt.image_url;
                    link.download = `${selectedReceipt.receipt_number}.jpg`;
                    link.click();
                  }}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  <Download size={20} />
                  Descargar
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    shareViaWhatsApp(selectedReceipt);
                  }}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  <Send size={20} />
                  WhatsApp
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
