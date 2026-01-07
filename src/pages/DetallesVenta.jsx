import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import {
  ArrowLeft,
  Calendar,
  DollarSign,
  User,
  MapPin,
  Trash2,
} from "lucide-react";

export default function DetallesVenta({ ventaId, onBack }) {
  const [venta, setVenta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    async function fetchVenta() {
      try {
        const { data, error } = await supabase
          .from("ventas")
          .select(
            `
            *,
            cotizaciones!ventas_cotizacion_id_fkey (
              id,
              folio,
              cliente_nombre,
              cliente_telefono,
              cliente_email,
              destino,
              fecha_salida,
              fecha_regreso,
              num_adultos,
              num_ninos,
              pipeline_stage
            ),
            opciones_cotizacion!ventas_selected_option_id_fkey (
              nombre_paquete,
              precio_total
            ),
            pagos!pagos_venta_id_fkey (
              id,
              numero_pago,
              monto,
              fecha_programada,
              fecha_pagado,
              estado,
              metodo_pago
            )
          `
          )
          .eq("id", ventaId)
          .single();

        if (error) throw error;
        setVenta(data);
      } catch (error) {
        console.error("Error:", error);
        alert("Error al cargar venta");
      } finally {
        setLoading(false);
      }
    }

    fetchVenta();
  }, [ventaId]);

  async function handleDeleteVenta() {
    setDeleting(true);
    try {
      // 1. Delete all receipts associated with this venta
      const { error: receiptsError } = await supabase
        .from("receipts")
        .delete()
        .eq("venta_id", ventaId);

      if (receiptsError) throw receiptsError;

      // 2. Delete all pagos associated with this venta
      const { error: pagosError } = await supabase
        .from("pagos")
        .delete()
        .eq("venta_id", ventaId);

      if (pagosError) throw pagosError;

      // 3. Reset cotización to negotiation stage
      if (venta.cotizaciones?.id) {
        const { error: cotError } = await supabase
          .from("cotizaciones")
          .update({
            pipeline_stage: "negotiation",
            probability: 50,
            conversion_date: null,
            last_stage_change_at: new Date().toISOString(),
          })
          .eq("id", venta.cotizaciones.id);

        if (cotError) throw cotError;

        // 4. Delete conversion history entry
        const { error: historyError } = await supabase
          .from("cotizacion_stage_history")
          .delete()
          .match({
            cotizacion_id: venta.cotizaciones.id,
            to_stage: "booking_confirmed",
          });

        if (historyError) throw historyError;
      }

      // 5. Delete the venta itself
      const { error: ventaError } = await supabase
        .from("ventas")
        .delete()
        .eq("id", ventaId);

      if (ventaError) throw ventaError;

      alert("Venta eliminada correctamente");
      onBack();
    } catch (error) {
      console.error("Error:", error);
      alert("Error al eliminar venta: " + error.message);
    } finally {
      setDeleting(false);
    }
  }

  if (loading) {
    return <div className="p-8">Cargando...</div>;
  }

  if (!venta) {
    return <div className="p-8">Venta no encontrada</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-primary hover:text-primary/80 mb-4"
          >
            <ArrowLeft size={20} />
            Volver a Ventas
          </button>
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-gray-900">
              {venta.folio_venta}
            </h1>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors"
            >
              <Trash2 size={18} />
              Eliminar Venta
            </button>
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <Trash2 size={24} className="text-red-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">
                  ¿Eliminar Venta?
                </h3>
              </div>

              <div className="mb-6 space-y-3">
                <p className="text-gray-700 font-medium">
                  Esta acción eliminará permanentemente:
                </p>
                <ul className="list-disc list-inside text-sm text-gray-600 space-y-1 ml-2">
                  <li>La venta {venta.folio_venta}</li>
                  <li>
                    Todos los recibos asociados ({venta.pagos?.length || 0}{" "}
                    pagos)
                  </li>
                  <li>Todos los pagos registrados</li>
                </ul>
                <p className="text-sm text-gray-600 mt-3">
                  La cotización{" "}
                  <span className="font-mono font-semibold">
                    {venta.cotizaciones?.folio}
                  </span>{" "}
                  se restaurará al estado "Negociación".
                </p>
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mt-4">
                  <p className="text-sm text-amber-800 font-medium">
                    ⚠️ Solo elimine una venta si fue creada por error. Esta
                    acción no se puede deshacer.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={deleting}
                  className="flex-1 px-4 py-2 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleDeleteVenta}
                  disabled={deleting}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 font-medium"
                >
                  {deleting ? "Eliminando..." : "Eliminar Venta"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Client Info Card */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <User size={20} />
            Información del Cliente
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Nombre</p>
              <p className="font-medium">{venta.cotizaciones.cliente_nombre}</p>
            </div>
            {venta.cotizaciones.cliente_telefono && (
              <div>
                <p className="text-sm text-gray-600">Teléfono</p>
                <p className="font-medium">
                  {venta.cotizaciones.cliente_telefono}
                </p>
              </div>
            )}
            {venta.cotizaciones.cliente_email && (
              <div>
                <p className="text-sm text-gray-600">Email</p>
                <p className="font-medium">
                  {venta.cotizaciones.cliente_email}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Trip Info Card */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <MapPin size={20} />
            Información del Viaje
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Destino</p>
              <p className="font-medium">{venta.cotizaciones.destino}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Viajeros</p>
              <p className="font-medium">
                {venta.cotizaciones.num_adultos + venta.cotizaciones.num_ninos}{" "}
                personas
              </p>
            </div>
            {venta.fecha_viaje && (
              <div>
                <p className="text-sm text-gray-600">Fecha de Viaje</p>
                <p className="font-medium">
                  {new Date(venta.fecha_viaje + "T00:00:00").toLocaleDateString(
                    "es-MX"
                  )}
                </p>
              </div>
            )}
            {venta.fecha_limite_pago && (
              <div>
                <p className="text-sm text-gray-600">Fecha Límite de Pago</p>
                <p className="font-medium text-red-600">
                  {new Date(
                    venta.fecha_limite_pago + "T00:00:00"
                  ).toLocaleDateString("es-MX")}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Package Info */}
        {venta.opciones_cotizacion && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Paquete Seleccionado</h2>
            <p className="font-medium text-lg">
              {venta.opciones_cotizacion.nombre_paquete}
            </p>
          </div>
        )}

        {/* Financial Summary */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <DollarSign size={20} />
            Resumen Financiero
          </h2>
          <div className="space-y-3">
            <div className="flex justify-between py-2 border-b">
              <span className="text-gray-600">Precio Total</span>
              <span className="font-bold text-lg">
                ${parseFloat(venta.precio_total).toLocaleString("es-MX")}
              </span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="text-gray-600">Monto Pagado</span>
              <span className="font-semibold text-green-600">
                ${parseFloat(venta.monto_pagado || 0).toLocaleString("es-MX")}
              </span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-gray-600">Saldo Pendiente</span>
              <span className="font-semibold text-red-600">
                $
                {parseFloat(venta.monto_pendiente || 0).toLocaleString("es-MX")}
              </span>
            </div>
          </div>
        </div>

        {/* Payments */}
        {venta.pagos && venta.pagos.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Calendar size={20} />
              Historial de Pagos
            </h2>
            <div className="space-y-3">
              {venta.pagos.map((pago) => (
                <div
                  key={pago.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div>
                    <p className="font-medium">Pago #{pago.numero_pago}</p>
                    <p className="text-sm text-gray-600">
                      {pago.metodo_pago} •{" "}
                      {pago.fecha_pagado
                        ? new Date(
                            pago.fecha_pagado + "T00:00:00"
                          ).toLocaleDateString("es-MX")
                        : new Date(
                            pago.fecha_programada + "T00:00:00"
                          ).toLocaleDateString("es-MX")}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg">
                      ${parseFloat(pago.monto).toLocaleString("es-MX")}
                    </p>
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        pago.estado === "pagado"
                          ? "bg-green-100 text-green-700"
                          : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {pago.estado}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
