import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { ArrowLeft, Calendar, DollarSign, User, MapPin } from "lucide-react";

export default function DetallesVenta({ ventaId, onBack }) {
  const [venta, setVenta] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchVenta() {
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
              cliente_email,
              destino,
              fecha_salida,
              fecha_regreso,
              num_adultos,
              num_ninos
            ),
            opciones_cotizacion (
              nombre_paquete,
              precio_total
            ),
            pagos (
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
          <h1 className="text-3xl font-bold text-gray-900">
            {venta.folio_venta}
          </h1>
        </div>

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
                  {new Date(venta.fecha_viaje).toLocaleDateString("es-MX")}
                </p>
              </div>
            )}
            {venta.fecha_limite_pago && (
              <div>
                <p className="text-sm text-gray-600">Fecha Límite de Pago</p>
                <p className="font-medium text-red-600">
                  {new Date(venta.fecha_limite_pago).toLocaleDateString(
                    "es-MX"
                  )}
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
                        ? new Date(pago.fecha_pagado).toLocaleDateString(
                            "es-MX"
                          )
                        : new Date(pago.fecha_programada).toLocaleDateString(
                            "es-MX"
                          )}
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
