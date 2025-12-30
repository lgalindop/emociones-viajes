import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import {
  ArrowLeft,
  Edit2,
  Calendar,
  User,
  DollarSign,
  Eye,
} from "lucide-react";
import GrupoModal from "../components/grupos/GrupoModal";
import DetallesVenta from "./DetallesVenta";
import DetallesCotizacion from "./DetallesCotizacion";

export default function GrupoDetalle() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [grupo, setGrupo] = useState(null);
  const [cotizaciones, setCotizaciones] = useState([]);
  const [ventas, setVentas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [viewingVentaId, setViewingVentaId] = useState(null);
  const [viewingCotizacionId, setViewingCotizacionId] = useState(null);
  const [activeTab, setActiveTab] = useState("ventas");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch grupo
      const { data: grupoData, error: grupoError } = await supabase
        .from("grupos")
        .select("*")
        .eq("id", id)
        .single();

      if (grupoError) throw grupoError;
      if (!grupoData) {
        navigate("/grupos");
        return;
      }
      setGrupo(grupoData);

      // Fetch cotizaciones (exclude converted ones)
      const { data: cotData, error: cotError } = await supabase
        .from("cotizaciones")
        .select(
          `
          *,
          ventas(id)
        `
        )
        .eq("grupo_id", id)
        .order("created_at", { ascending: false });

      if (cotError) throw cotError;
      // Filter out cotizaciones that have been converted to ventas
      const unconvertedCotizaciones =
        cotData?.filter((cot) => !cot.ventas || cot.ventas.length === 0) || [];
      setCotizaciones(unconvertedCotizaciones);

      // Fetch ventas - get all ventas for this grupo
      const { data: ventasData, error: ventasError } = await supabase
        .from("ventas")
        .select(
          `
          *,
          cotizaciones (
            cliente_nombre,
            destino,
            num_adultos,
            num_ninos,
            grupo_id
          )
        `
        )
        .eq("grupo_id", id)
        .order("created_at", { ascending: false });

      if (ventasError) throw ventasError;

      // Also fetch ventas where cotizacion has this grupo_id but venta doesn't
      const { data: orphanedVentas, error: orphanError } = await supabase
        .from("ventas")
        .select(
          `
          *,
          cotizaciones!inner (
            cliente_nombre,
            destino,
            num_adultos,
            num_ninos,
            grupo_id
          )
        `
        )
        .eq("cotizaciones.grupo_id", id)
        .is("grupo_id", null)
        .order("created_at", { ascending: false });

      if (orphanError) throw orphanError;

      // Merge both results
      const allVentas = [...(ventasData || []), ...(orphanedVentas || [])];
      setVentas(allVentas);
    } catch (error) {
      console.error("Error:", error);
      alert("Error al cargar grupo: " + error.message);
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (viewingVentaId) {
    return (
      <DetallesVenta
        ventaId={viewingVentaId}
        onBack={() => {
          setViewingVentaId(null);
          fetchData();
        }}
      />
    );
  }

  if (viewingCotizacionId) {
    return (
      <DetallesCotizacion
        cotizacionId={viewingCotizacionId}
        onBack={() => {
          setViewingCotizacionId(null);
          fetchData();
        }}
      />
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600">Cargando...</div>
      </div>
    );
  }

  if (!grupo) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600">Grupo no encontrado</div>
      </div>
    );
  }

  const tipoLabels = {
    boda: "Boda",
    torneo: "Torneo",
    corporativo: "Corporativo",
    otro: "Otro",
  };

  const tipoColors = {
    boda: "bg-pink-100 text-pink-800",
    torneo: "bg-blue-100 text-blue-800",
    corporativo: "bg-purple-100 text-purple-800",
    otro: "bg-gray-100 text-gray-800",
  };

  const totalVentasAmount = ventas.reduce(
    (sum, v) => sum + parseFloat(v.precio_total || 0),
    0
  );
  const totalPagado = ventas.reduce(
    (sum, v) => sum + parseFloat(v.monto_pagado || 0),
    0
  );
  const totalPendiente = ventas.reduce(
    (sum, v) => sum + parseFloat(v.monto_pendiente || 0),
    0
  );

  return (
    <div className="p-4 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/app/grupos")}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-primary">{grupo.nombre}</h1>
            <span
              className={`inline-block px-3 py-1 text-xs font-semibold rounded-full mt-2 ${
                tipoColors[grupo.tipo] || tipoColors.otro
              }`}
            >
              {tipoLabels[grupo.tipo] || "Otro"}
            </span>
          </div>
        </div>
        <button
          onClick={() => setShowEditModal(true)}
          className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          <Edit2 size={18} />
          Editar
        </button>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {/* Event Info */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="font-semibold text-gray-900 mb-4">
            Información del Evento
          </h3>
          {grupo.fecha_evento && (
            <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
              <Calendar size={16} />
              <span>
                {new Date(grupo.fecha_evento + "T00:00:00").toLocaleDateString(
                  "es-MX",
                  {
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                  }
                )}
              </span>
            </div>
          )}
          {grupo.coordinador_nombre && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <User size={16} />
              <div>
                <div>{grupo.coordinador_nombre}</div>
                {grupo.coordinador_telefono && (
                  <div className="text-xs">{grupo.coordinador_telefono}</div>
                )}
                {grupo.coordinador_email && (
                  <div className="text-xs">{grupo.coordinador_email}</div>
                )}
              </div>
            </div>
          )}
          {grupo.notas && (
            <div className="mt-3 text-sm text-gray-600 border-t pt-3">
              <span className="font-medium">Notas:</span> {grupo.notas}
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Estadísticas</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Cotizaciones:</span>
              <span className="font-semibold">{cotizaciones.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Ventas:</span>
              <span className="font-semibold text-green-600">
                {ventas.length}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Total Viajeros:</span>
              <span className="font-semibold">
                {ventas.reduce(
                  (sum, v) =>
                    sum +
                    (v.cotizaciones?.num_adultos || 0) +
                    (v.cotizaciones?.num_ninos || 0),
                  0
                )}
              </span>
            </div>
          </div>
        </div>

        {/* Financial */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <DollarSign size={18} />
            Resumen Financiero
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Total Ventas:</span>
              <span className="font-semibold">
                ${totalVentasAmount.toLocaleString("es-MX")}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Pagado:</span>
              <span className="font-semibold text-green-600">
                ${totalPagado.toLocaleString("es-MX")}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Pendiente:</span>
              <span className="font-semibold text-red-600">
                ${totalPendiente.toLocaleString("es-MX")}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs: Cotizaciones / Ventas */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b">
          <nav className="flex">
            <button
              onClick={() => setActiveTab("ventas")}
              className={`px-6 py-3 border-b-2 font-medium transition-colors ${
                activeTab === "ventas"
                  ? "border-primary text-primary"
                  : "border-transparent text-gray-600 hover:text-gray-900"
              }`}
            >
              Ventas ({ventas.length})
            </button>
            <button
              onClick={() => setActiveTab("cotizaciones")}
              className={`px-6 py-3 border-b-2 font-medium transition-colors ${
                activeTab === "cotizaciones"
                  ? "border-primary text-primary"
                  : "border-transparent text-gray-600 hover:text-gray-900"
              }`}
            >
              Cotizaciones ({cotizaciones.length})
            </button>
          </nav>
        </div>

        <div className="p-6">
          {activeTab === "ventas" ? (
            ventas.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                No hay ventas en este grupo
              </div>
            ) : (
              <div className="overflow-x-auto">
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
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {ventas.map((venta) => (
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
                            $
                            {parseFloat(venta.precio_total).toLocaleString(
                              "es-MX"
                            )}
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
                            {parseFloat(
                              venta.monto_pendiente || 0
                            ).toLocaleString("es-MX")}
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
            )
          ) : cotizaciones.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              No hay cotizaciones pendientes en este grupo
            </div>
          ) : (
            <div className="overflow-x-auto">
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
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Presupuesto
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {cotizaciones.map((cot) => (
                    <tr key={cot.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-mono font-medium text-gray-900">
                          {cot.folio}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-900">
                          {cot.cliente_nombre}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-600">
                          {cot.destino}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-600">
                          {cot.num_adultos + cot.num_ninos}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-600">
                          $
                          {parseFloat(
                            cot.presupuesto_aprox || 0
                          ).toLocaleString("es-MX")}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <button
                          onClick={() => setViewingCotizacionId(cot.id)}
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
      </div>

      {showEditModal && (
        <GrupoModal
          grupo={grupo}
          onClose={() => setShowEditModal(false)}
          onSuccess={() => {
            setShowEditModal(false);
            fetchData();
          }}
        />
      )}
    </div>
  );
}
