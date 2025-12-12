import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import {
  Eye,
  Calendar,
  DollarSign,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import PaymentSchedule from "../components/sales/PaymentSchedule";

export default function SalesList() {
  const [ventas, setVentas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedVenta, setSelectedVenta] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    fetchVentas();
  }, []);

  async function fetchVentas() {
    try {
      const { data, error } = await supabase
        .from("ventas")
        .select(
          `
          *,
          cotizaciones (
            folio,
            cliente_nombre,
            destino,
            cliente_telefono,
            cliente_email
          )
        `
        )
        .order("created_at", { ascending: false });

      if (error) throw error;
      setVentas(data || []);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  }

  function getPaymentStatus(venta) {
    if (venta.monto_pendiente === 0) return "pagado";
    if (venta.monto_pagado > 0) return "parcial";
    return "pendiente";
  }

  function getStatusColor(estado) {
    const colors = {
      confirmada: "bg-green-100 text-green-800",
      cancelada: "bg-red-100 text-red-800",
      completada: "bg-blue-100 text-blue-800",
    };
    return colors[estado] || "bg-gray-100 text-gray-800";
  }

  function getPaymentStatusColor(status) {
    const colors = {
      pagado: "text-green-600",
      parcial: "text-yellow-600",
      pendiente: "text-red-600",
    };
    return colors[status] || "text-gray-600";
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-600">Cargando ventas...</div>
      </div>
    );
  }

  if (selectedVenta) {
    return (
      <PaymentSchedule
        venta={selectedVenta}
        onBack={() => setSelectedVenta(null)}
        onUpdate={fetchVentas}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-primary">Ventas</h1>
          <p className="text-gray-600">{ventas.length} ventas registradas</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-600">Total Ventas</p>
            <p className="text-2xl font-bold text-primary">
              $
              {ventas
                .reduce((sum, v) => sum + parseFloat(v.precio_total || 0), 0)
                .toLocaleString("es-MX")}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-600">Cobrado</p>
            <p className="text-2xl font-bold text-green-600">
              $
              {ventas
                .reduce((sum, v) => sum + parseFloat(v.monto_pagado || 0), 0)
                .toLocaleString("es-MX")}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-600">Pendiente</p>
            <p className="text-2xl font-bold text-red-600">
              $
              {ventas
                .reduce((sum, v) => sum + parseFloat(v.monto_pendiente || 0), 0)
                .toLocaleString("es-MX")}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-600">Confirmadas</p>
            <p className="text-2xl font-bold">
              {ventas.filter((v) => v.estado_venta === "confirmada").length}
            </p>
          </div>
        </div>

        {/* Sales List */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Folio
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Cliente / Destino
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Fecha Viaje
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Total
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Pagado / Pendiente
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {ventas.map((venta) => {
                const paymentStatus = getPaymentStatus(venta);
                return (
                  <tr key={venta.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <p className="font-mono text-sm font-medium">
                        {venta.folio_venta}
                      </p>
                      <p className="text-xs text-gray-500">
                        {venta.cotizaciones?.folio}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-medium">
                        {venta.cotizaciones?.cliente_nombre}
                      </p>
                      <p className="text-sm text-gray-600">
                        📍 {venta.cotizaciones?.destino}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1 text-sm">
                        <Calendar size={14} className="text-gray-400" />
                        {new Date(venta.fecha_viaje).toLocaleDateString(
                          "es-MX"
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-bold text-primary">
                        $
                        {parseFloat(venta.precio_total).toLocaleString("es-MX")}
                      </p>
                      <p className="text-xs text-gray-500">{venta.divisa}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1 text-sm">
                          <CheckCircle size={14} className="text-green-600" />
                          <span className="text-green-600">
                            $
                            {parseFloat(venta.monto_pagado || 0).toLocaleString(
                              "es-MX"
                            )}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-sm">
                          <AlertCircle size={14} className="text-red-600" />
                          <span className="text-red-600">
                            $
                            {parseFloat(
                              venta.monto_pendiente || 0
                            ).toLocaleString("es-MX")}
                          </span>
                        </div>
                      </div>
                      {/* Progress bar */}
                      <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                        <div
                          className="bg-green-500 h-1.5 rounded-full"
                          style={{
                            width: `${(venta.monto_pagado / venta.precio_total) * 100}%`,
                          }}
                        />
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(venta.estado_venta)}`}
                      >
                        {venta.estado_venta}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => setSelectedVenta(venta)}
                        className="flex items-center gap-2 px-3 py-1.5 bg-primary text-white rounded hover:bg-primary/90 text-sm"
                      >
                        <Eye size={16} />
                        Ver Pagos
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {ventas.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              No hay ventas registradas
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
