import { useState } from "react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../hooks/useAuth";
import { X, Users } from "lucide-react";
import ReceiptGenerator from "../receipts/ReceiptGenerator";
import ViajerosManager from "../clientes/ViajerosManager";

export default function ConvertToSale({
  cotizacion,
  opciones,
  onClose,
  onSuccess,
}) {
  const { user } = useAuth();
  const [selectedOption, setSelectedOption] = useState(null);
  const [formData, setFormData] = useState({
    precio_total: "",
    fecha_viaje: "",
    pago_inicial: "0",
    metodo_pago: "Transferencia",
    fecha_limite: "",
    notas: "",
  });
  const [loading, setLoading] = useState(false);
  const [showReceiptPrompt, setShowReceiptPrompt] = useState(false);
  const [showReceiptGenerator, setShowReceiptGenerator] = useState(false);
  const [createdVenta, setCreatedVenta] = useState(null);
  const [createdPago, setCreatedPago] = useState(null);
  const [viajeros, setViajeros] = useState([]);
  const [showViajeros, setShowViajeros] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();

    if (!selectedOption) {
      alert("Selecciona un paquete");
      return;
    }

    if (
      !formData.precio_total ||
      !formData.fecha_viaje ||
      !formData.fecha_limite
    ) {
      alert("Completa todos los campos requeridos");
      return;
    }

    setLoading(true);

    try {
      // 1. Create venta
      const { data: venta, error: ventaError } = await supabase
        .from("ventas")
        .insert({
          cotizacion_id: cotizacion.id,
          selected_option_id: selectedOption.id,
          precio_total: parseFloat(formData.precio_total),
          monto_pagado: parseFloat(formData.pago_inicial) || 0,
          monto_pendiente:
            parseFloat(formData.precio_total) -
            (parseFloat(formData.pago_inicial) || 0),
          divisa: cotizacion.divisa || "MXN",
          fecha_viaje: formData.fecha_viaje,
          fecha_limite_pago: formData.fecha_limite,
          notas: formData.notas,
          grupo_id: cotizacion.grupo_id,
          created_by: user.id,
        })
        .select(
          `
          *,
          cotizaciones!ventas_cotizacion_id_fkey (
            cliente_nombre,
            cliente_telefono,
            cliente_email,
            destino,
            num_adultos,
            num_ninos
          )
        `
        )
        .single();

      if (ventaError) throw ventaError;

      // 2. Save viajeros if any
      if (viajeros.length > 0) {
        const viajerosData = viajeros.map(v => ({
          venta_id: venta.id,
          cliente_id: v.cliente_id || null,
          nombre_completo: v.nombre_completo,
          tipo_viajero: v.tipo_viajero,
          es_titular: v.es_titular || false,
          fecha_nacimiento: v.fecha_nacimiento || null,
          nacionalidad: v.nacionalidad || null,
          pasaporte_numero: v.pasaporte_numero || null,
          pasaporte_vencimiento: v.pasaporte_vencimiento || null,
          telefono: v.telefono || null,
          email: v.email || null,
          requerimientos_especiales: v.requerimientos_especiales || null,
        }));

        const { error: viajerosError } = await supabase
          .from("viajeros")
          .insert(viajerosData);

        if (viajerosError) {
          console.error("Error saving viajeros:", viajerosError);
          // Don't fail the sale, just log the error
        }
      }

      // 3. Create initial payment if > 0
      const pagoInicial = parseFloat(formData.pago_inicial);
      if (pagoInicial > 0) {
        const { data: newPago, error: pagoError } = await supabase
          .from("pagos")
          .insert({
            venta_id: venta.id,
            numero_pago: 1,
            monto: pagoInicial,
            fecha_programada: new Date().toISOString().split("T")[0],
            fecha_pagado: new Date().toISOString().split("T")[0],
            estado: "pagado",
            metodo_pago: formData.metodo_pago,
            registrado_por: user.id,
            notas: "Pago inicial",
          })
          .select()
          .single();

        if (pagoError) throw pagoError;

        // Store venta (already has cotizaciones data) and pago for receipt generation
        setCreatedVenta(venta);
        setCreatedPago(newPago);
      }

      // 3. Update cotización stage
      const { error: cotError } = await supabase
        .from("cotizaciones")
        .update({
          pipeline_stage: "booking_confirmed",
          probability: 90,
          conversion_date: new Date().toISOString(),
          last_stage_change_by: user.id,
          last_stage_change_at: new Date().toISOString(),
          updated_by: user.id,
        })
        .eq("id", cotizacion.id);

      if (cotError) throw cotError;

      // 4. Log stage change
      await supabase.from("cotizacion_stage_history").insert({
        cotizacion_id: cotizacion.id,
        from_stage: cotizacion.pipeline_stage,
        to_stage: "booking_confirmed",
        changed_by: user.id,
        notes: "Convertido a venta",
      });

      // Check if payment was made and prompt for receipt
      if (parseFloat(formData.pago_inicial) > 0) {
        setShowReceiptPrompt(true);
      } else {
        onSuccess();
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Error al crear venta: " + error.message);
    } finally {
      setLoading(false);
    }
  }

  // Show receipt generator if prompted
  if (showReceiptPrompt && createdVenta && createdPago) {
    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">
            ¿Generar Recibo?
          </h3>
          <p className="text-gray-600 mb-6">
            Se registró un pago inicial de $
            {parseFloat(formData.pago_inicial).toLocaleString("es-MX")}. ¿Deseas
            generar un recibo para este pago ahora?
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => onSuccess()}
              className="flex-1 px-4 py-2 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Ahora No
            </button>
            <button
              onClick={() => {
                setShowReceiptPrompt(false);
                setShowReceiptGenerator(true);
              }}
              className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
            >
              Generar Recibo
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show receipt generator
  if (showReceiptGenerator && createdVenta && createdPago) {
    return (
      <ReceiptGenerator
        venta={createdVenta}
        pago={createdPago}
        onClose={() => onSuccess()}
        onSuccess={() => onSuccess()}
      />
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-green-600">
            Convertir a Venta
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6">
          <div className="bg-blue-50 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-gray-900 mb-2">Cliente</h3>
            <p className="text-gray-700">{cotizacion.cliente_nombre}</p>
            <p className="text-sm text-gray-600">
              {cotizacion.destino} •{" "}
              {cotizacion.num_adultos + cotizacion.num_ninos} viajeros
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Package Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Paquete Seleccionado *
              </label>
              <select
                value={selectedOption?.id || ""}
                onChange={(e) => {
                  const opt = opciones.find((o) => o.id === e.target.value);
                  setSelectedOption(opt);
                  if (opt) {
                    setFormData({
                      ...formData,
                      precio_total: opt.precio_total,
                    });
                  }
                }}
                required
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary"
              >
                <option value="">Selecciona un paquete</option>
                {opciones.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.nombre_paquete} - $
                    {parseFloat(opt.precio_total).toLocaleString("es-MX")}(
                    {cotizacion.num_adultos + cotizacion.num_ninos} viajeros)
                  </option>
                ))}
              </select>
            </div>

            {/* Price and Travel Date */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Precio Total *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.precio_total}
                  onChange={(e) =>
                    setFormData({ ...formData, precio_total: e.target.value })
                  }
                  required
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha de Viaje *
                </label>
                <input
                  type="date"
                  value={formData.fecha_viaje}
                  onChange={(e) =>
                    setFormData({ ...formData, fecha_viaje: e.target.value })
                  }
                  required
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            {/* Payment Configuration */}
            <div className="bg-yellow-50 rounded-lg p-4 space-y-4 border-2 border-yellow-200">
              <h3 className="font-semibold text-gray-900">
                Configuración de Pago
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Pago Inicial (puede ser $0)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.pago_inicial}
                    onChange={(e) =>
                      setFormData({ ...formData, pago_inicial: e.target.value })
                    }
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary"
                    placeholder="0.00"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Opcional: Depósito o anticipo
                  </p>
                </div>

                {parseFloat(formData.pago_inicial) > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Método de Pago *
                    </label>
                    <select
                      value={formData.metodo_pago}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          metodo_pago: e.target.value,
                        })
                      }
                      required
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary"
                    >
                      <option value="Transferencia">Transferencia</option>
                      <option value="Efectivo">Efectivo</option>
                      <option value="Tarjeta">Tarjeta</option>
                      <option value="Cheque">Cheque</option>
                      <option value="Depósito">Depósito</option>
                      <option value="Pendiente">Pendiente</option>
                    </select>
                    <p className="text-xs text-gray-500 mt-1">
                      Forma de pago del anticipo
                    </p>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha Límite de Pago *
                </label>
                <input
                  type="date"
                  value={formData.fecha_limite}
                  onChange={(e) =>
                    setFormData({ ...formData, fecha_limite: e.target.value })
                  }
                  required
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Fecha tope para liquidar
                </p>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notas
              </label>
              <textarea
                value={formData.notas}
                onChange={(e) =>
                  setFormData({ ...formData, notas: e.target.value })
                }
                rows={3}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary"
                placeholder="Notas adicionales sobre la venta..."
              />
            </div>

            {/* Viajeros Section */}
            <div className="border-2 border-gray-200 rounded-lg overflow-hidden">
              <button
                type="button"
                onClick={() => setShowViajeros(!showViajeros)}
                className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Users size={20} className="text-gray-500" />
                  <span className="font-medium text-gray-700">
                    Viajeros / Pasajeros
                  </span>
                  {viajeros.length > 0 && (
                    <span className="px-2 py-0.5 bg-primary/10 text-primary text-sm rounded-full">
                      {viajeros.length} registrados
                    </span>
                  )}
                </div>
                <span className="text-sm text-gray-500">
                  {showViajeros ? "Ocultar" : "Mostrar"} (opcional)
                </span>
              </button>

              {showViajeros && (
                <div className="p-4 border-t">
                  <ViajerosManager
                    viajeros={viajeros}
                    onChange={setViajeros}
                    numAdultos={cotizacion.num_adultos || 0}
                    numMenores={cotizacion.num_ninos || 0}
                    numInfantes={cotizacion.num_infantes || 0}
                    clienteId={cotizacion.cliente_id}
                  />
                  <p className="text-xs text-gray-500 mt-3">
                    Puedes agregar los datos de los viajeros ahora o más tarde desde los detalles de la venta.
                    {cotizacion.cliente_id && " Los familiares registrados del cliente aparecerán para agregar rápidamente."}
                  </p>
                </div>
              )}
            </div>

            {/* Submit */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-6 py-3 border-2 border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 font-medium"
              >
                {loading ? "Creando Venta..." : "Crear Venta"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
