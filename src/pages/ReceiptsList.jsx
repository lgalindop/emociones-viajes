import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import {
  ArrowLeft,
  FileText,
  Search,
  Filter,
  Eye,
  Edit2,
  Trash2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import Toast from "../components/ui/Toast";

export default function ReceiptsList() {
  const navigate = useNavigate();
  const [receipts, setReceipts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStage, setFilterStage] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [toast, setToast] = useState(null);

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
          ventas!receipts_venta_id_fkey (
            folio_venta,
            precio_total,
            cotizaciones!ventas_cotizacion_id_fkey (
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
      setToast({ message: "Error al cargar recibos", type: "error" });
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(receipt) {
    const amount = receipt.amount ? parseFloat(receipt.amount) : 0;

    // Check if independent receipt
    if (!receipt.venta_id) {
      if (
        !confirm(`¿Eliminar recibo independiente ${receipt.receipt_number}?`)
      ) {
        return;
      }

      try {
        const { error: deleteError } = await supabase
          .from("receipts")
          .delete()
          .eq("id", receipt.id);

        if (deleteError) throw deleteError;

        setToast({ message: "Recibo eliminado", type: "success" });
        fetchReceipts();
      } catch (error) {
        console.error("Error:", error);
        setToast({ message: "Error al eliminar recibo: " + error.message, type: "error" });
      }
      return;
    }

    // Linked to sale - show financial impact
    if (
      !confirm(
        `¿Eliminar recibo ${receipt.receipt_number}?\n\nEsto revertirá:\n- Monto pagado en venta: $${amount.toLocaleString("es-MX")}\n- Estado del recibo\n- Balance financiero\n\n¿Continuar?`
      )
    ) {
      return;
    }

    try {
      // Get current venta data
      const { data: venta, error: ventaError } = await supabase
        .from("ventas")
        .select("monto_pagado, monto_pendiente, precio_total")
        .eq("id", receipt.venta_id)
        .single();

      if (ventaError) throw ventaError;

      // Calculate new balances
      const newMontoPagado =
        parseFloat(venta.monto_pagado || 0) - parseFloat(receipt.amount || 0);
      const newMontoPendiente = parseFloat(venta.precio_total) - newMontoPagado;

      // Update venta balances
      const { error: updateVentaError } = await supabase
        .from("ventas")
        .update({
          monto_pagado: newMontoPagado,
          monto_pendiente: newMontoPendiente,
        })
        .eq("id", receipt.venta_id);

      if (updateVentaError) throw updateVentaError;

      // Mark associated pago as cancelled if exists
      if (receipt.pago_id) {
        const { error: pagoError } = await supabase
          .from("pagos")
          .update({
            estado: "cancelado",
            notas: `Pago cancelado por eliminación de recibo ${receipt.receipt_number}`,
          })
          .eq("id", receipt.pago_id);

        if (pagoError) throw pagoError;
      }

      // Delete receipt
      const { error: deleteError } = await supabase
        .from("receipts")
        .delete()
        .eq("id", receipt.id);

      if (deleteError) throw deleteError;

      setToast({ message: "Recibo eliminado y finanzas actualizadas", type: "success" });
      fetchReceipts();
    } catch (error) {
      console.error("Error:", error);
      setToast({ message: "Error al eliminar recibo: " + error.message, type: "error" });
    }
  }

  function handleEdit(receipt) {
    navigate("/app/receipts/wizard", {
      state: {
        editMode: true,
        receiptId: receipt.id,
        ventaId: receipt.venta_id,
      },
    });
  }

  function handleView(receipt) {
    if (receipt.image_url) {
      window.open(receipt.image_url, "_blank");
    }
  }

  // Helper to format date with timezone fix
  function formatDate(dateStr) {
    if (!dateStr) return "";
    const dateOnly = dateStr.includes("T") ? dateStr.split("T")[0] : dateStr;
    const date = new Date(dateOnly + "T00:00:00");
    return date.toLocaleDateString("es-MX", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  }

  const filteredReceipts = receipts.filter((r) => {
    const matchesSearch =
      r.receipt_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.ventas?.cotizaciones?.cliente_nombre
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      r.ventas?.folio_venta?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStage =
      filterStage === "all" || r.receipt_stage === filterStage;

    const matchesDate = (() => {
      if (!startDate && !endDate) return true;
      const receiptDate = new Date(r.payment_date);
      if (startDate && !endDate) {
        return receiptDate >= new Date(startDate);
      }
      if (!startDate && endDate) {
        return receiptDate <= new Date(endDate);
      }
      return (
        receiptDate >= new Date(startDate) && receiptDate <= new Date(endDate)
      );
    })();

    return matchesSearch && matchesStage && matchesDate;
  });

  if (loading) {
    return <div className="p-8">Cargando...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate("/app/sales")}
            className="flex items-center gap-2 text-primary hover:text-primary/80 mb-4"
          >
            <ArrowLeft size={20} />
            Volver a Ventas
          </button>
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <FileText size={32} />
              Recibos
            </h1>
            <button
              onClick={() => navigate("/app/receipts/wizard")}
              className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 font-medium"
            >
              Nuevo Recibo
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                size={20}
              />
              <input
                type="text"
                placeholder="Buscar por número, cliente o folio..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary"
                placeholder="Desde"
              />
              <span className="text-gray-500">-</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary"
                placeholder="Hasta"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter size={20} className="text-gray-400" />
              <select
                value={filterStage}
                onChange={(e) => setFilterStage(e.target.value)}
                className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary"
              >
                <option value="all">Todos los estados</option>
                <option value="draft">Borradores</option>
                <option value="generated">Generados</option>
                <option value="sent">Enviados</option>
                <option value="confirmed">Confirmados</option>
              </select>
            </div>
          </div>
        </div>

        {/* Receipts List */}
        {filteredReceipts.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
            No se encontraron recibos
          </div>
        ) : (
          <>
            {/* Mobile Card View */}
            <div className="space-y-1 sm:hidden">
              {filteredReceipts.map((receipt) => (
                <div
                  key={receipt.id}
                  onClick={() => handleEdit(receipt)}
                  className="bg-white rounded-lg shadow hover:shadow-md transition-all cursor-pointer"
                >
                  <div className="p-2 flex items-center gap-3 text-xs">
                    <div className="flex flex-col items-center gap-0.5 min-w-[80px]">
                      <span className="font-semibold text-gray-900">
                        {receipt.receipt_number}
                      </span>
                      <span className="text-gray-500 text-[10px]">
                        {formatDate(receipt.payment_date)}
                      </span>
                    </div>

                    <div className="flex flex-col items-center min-w-0 flex-1">
                      <span className="font-bold text-gray-900 truncate w-full text-center">
                        {receipt.client_name ||
                          receipt.ventas?.cotizaciones?.cliente_nombre ||
                          "N/A"}
                      </span>
                      <span className="text-gray-500 truncate w-full text-center">
                        {receipt.destination ||
                          receipt.ventas?.cotizaciones?.destino ||
                          ""}
                      </span>
                    </div>

                    <div className="flex flex-col items-end min-w-[70px]">
                      <span className="font-semibold text-green-600">
                        $
                        {receipt.amount
                          ? parseFloat(receipt.amount).toLocaleString("es-MX")
                          : "0.00"}
                      </span>
                      <span className="text-gray-500 text-[10px]">
                        {receipt.payment_method}
                      </span>
                    </div>

                    <div className="flex flex-col gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleView(receipt);
                        }}
                        disabled={!receipt.image_url}
                        className="p-1 text-blue-600 hover:bg-blue-50 rounded disabled:opacity-50"
                        title="Ver Recibo"
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(receipt);
                        }}
                        className="p-1 text-red-600 hover:bg-red-50 rounded"
                        title="Eliminar"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Table View */}
            <div className="bg-white rounded-lg shadow overflow-hidden hidden sm:block">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Recibo
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cliente
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                      Venta
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                      Fecha
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Monto
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                      Método
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredReceipts.map((receipt) => (
                    <tr
                      key={receipt.id}
                      onClick={() => handleEdit(receipt)}
                      className="hover:bg-gray-50 cursor-pointer"
                    >
                      <td className="px-4 py-3">
                        <span className="font-semibold text-gray-900">
                          {receipt.receipt_number}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm">
                          <div className="font-medium text-gray-900">
                            {receipt.client_name ||
                              receipt.ventas?.cotizaciones?.cliente_nombre ||
                              "N/A"}
                          </div>
                          <div className="text-gray-500 text-xs">
                            {receipt.destination ||
                              receipt.ventas?.cotizaciones?.destino ||
                              ""}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 hidden md:table-cell">
                        {receipt.ventas?.folio_venta || "-"}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 hidden md:table-cell">
                        {formatDate(receipt.payment_date)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="font-semibold text-green-600">
                          $
                          {receipt.amount
                            ? parseFloat(receipt.amount).toLocaleString("es-MX")
                            : "0.00"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 hidden lg:table-cell">
                        {receipt.payment_method}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleView(receipt);
                            }}
                            disabled={!receipt.image_url}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Ver Recibo"
                          >
                            <Eye size={18} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEdit(receipt);
                            }}
                            className="p-1.5 text-yellow-600 hover:bg-yellow-50 rounded"
                            title="Editar"
                          >
                            <Edit2 size={18} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(receipt);
                            }}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                            title="Eliminar"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
