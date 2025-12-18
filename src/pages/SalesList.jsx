import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { Eye, Search, Calendar, DollarSign, X } from "lucide-react";
import DetallesVenta from "./DetallesVenta";

export default function SalesList() {
  const [ventas, setVentas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");
  const [viewingVentaId, setViewingVentaId] = useState(null);

  useEffect(() => {
    fetchVentas();
  }, []);

  // If viewing a venta, show details
  if (viewingVentaId) {
    return (
      <DetallesVenta
        ventaId={viewingVentaId}
        onBack={() => {
          setViewingVentaId(null);
          fetchVentas();
        }}
      />
    );
  }

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
            cliente_telefono,
            destino,
            num_adultos,
            num_ninos
          ),
          opciones_cotizacion (
            nombre_paquete
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

  const filteredVentas = ventas.filter((v) => {
    const matchesSearch =
      v.folio_venta?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.cotizaciones?.cliente_nombre
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      v.cotizaciones?.destino?.toLowerCase().includes(searchTerm.toLowerCase());

    const ventaDate = new Date(v.created_at);
    const matchesDateFrom =
      !filterDateFrom || ventaDate >= new Date(filterDateFrom);
    const matchesDateTo =
      !filterDateTo || ventaDate <= new Date(filterDateTo + "T23:59:59");

    return matchesSearch && matchesDateFrom && matchesDateTo;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600">Cargando ventas...</div>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold text-primary mb-6">Ventas</h1>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6 space-y-4">
        {/* Search */}
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              size={20}
            />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por folio, cliente o destino..."
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        {/* Date Range */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm text-gray-600 mb-1">
              <Calendar size={14} className="inline mr-1" />
              Desde
            </label>
            <input
              type="date"
              value={filterDateFrom}
              onChange={(e) => setFilterDateFrom(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="flex-1">
            <label className="block text-sm text-gray-600 mb-1">
              <Calendar size={14} className="inline mr-1" />
              Hasta
            </label>
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
              className="self-end px-4 py-2 text-sm text-gray-600 hover:text-gray-900 border rounded-lg hover:bg-gray-50"
            >
              <X size={16} className="inline mr-1" />
              Limpiar fechas
            </button>
          )}
        </div>

        {/* Results count */}
        <div className="text-sm text-gray-600">
          Mostrando {filteredVentas.length} de {ventas.length} ventas
        </div>
      </div>

      {/* Ventas Table */}
      {filteredVentas.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <DollarSign size={48} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-600">
            {searchTerm || filterDateFrom || filterDateTo
              ? "No se encontraron ventas con los filtros aplicados"
              : "No hay ventas registradas"}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Folio
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Cliente
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Destino
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Viajeros
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Total
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Pagado
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Saldo
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                  Estado
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredVentas.map((venta) => (
                <tr key={venta.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-mono font-medium text-gray-900">
                      {venta.folio_venta}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-900">
                      {venta.cotizaciones?.cliente_nombre || "Sin nombre"}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-600">
                      {venta.cotizaciones?.destino}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-600">
                      {venta.cotizaciones
                        ? venta.cotizaciones.num_adultos +
                          venta.cotizaciones.num_ninos
                        : "-"}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <span className="text-sm font-medium text-gray-900">
                      ${parseFloat(venta.precio_total).toLocaleString("es-MX")}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <span className="text-sm font-medium text-green-600">
                      $
                      {parseFloat(venta.monto_pagado || 0).toLocaleString(
                        "es-MX"
                      )}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <span className="text-sm font-medium text-red-600">
                      $
                      {parseFloat(venta.monto_pendiente || 0).toLocaleString(
                        "es-MX"
                      )}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        venta.monto_pendiente <= 0
                          ? "bg-green-100 text-green-800"
                          : venta.monto_pagado > 0
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {venta.monto_pendiente <= 0
                        ? "Pagado"
                        : venta.monto_pagado > 0
                          ? "Parcial"
                          : "Pendiente"}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <button
                      onClick={() => setViewingVentaId(venta.id)}
                      className="inline-flex items-center gap-1 px-3 py-1 text-sm bg-blue-50 text-blue-700 rounded hover:bg-blue-100"
                    >
                      <Eye size={14} />
                      Ver
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
