import { useState } from "react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../contexts/AuthContext";
import { X } from "lucide-react";

export default function ConvertToSale({
  cotizacion,
  opciones,
  operadores,
  onClose,
  onSuccess,
}) {
  const { user } = useAuth();
  const [selectedOption, setSelectedOption] = useState(null);
  const [formData, setFormData] = useState({
    precio_total: "",
    fecha_viaje: "",
    pago_inicial: "0",
    fecha_limite: "",
    notas: "",
  });
  const [loading, setLoading] = useState(false);

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
          divisa: cotizacion.divisa || "MXN",
          fecha_viaje: formData.fecha_viaje,
          fecha_limite_pago: formData.fecha_limite,
          notas: formData.notas,
          created_by: user.id,
        })
        .select()
        .single();

      if (ventaError) throw ventaError;

      // 2. Create initial payment if > 0
      const pagoInicial = parseFloat(formData.pago_inicial);
      if (pagoInicial > 0) {
        const { error: pagoError } = await supabase.from("pagos").insert({
          venta_id: venta.id,
          numero_pago: 1,
          monto: pagoInicial,
          fecha_programada: new Date().toISOString().split("T")[0],
          fecha_pagado: new Date().toISOString().split("T")[0],
          estado: "pagado",
          metodo_pago: "Pendiente",
          registrado_por: user.id,
          notas: "Pago inicial",
        });

        if (pagoError) throw pagoError;
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

      onSuccess();
    } catch (error) {
      console.error("Error:", error);
      alert("Error al crear venta: " + error.message);
    } finally {
      setLoading(false);
    }
  }

  function getOperadorNombre(operadorId) {
    const op = operadores.find((o) => o.id === operadorId);
    return op?.nombre || "Desconocido";
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
