import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../contexts/AuthContext";
import { X, Calendar, DollarSign, CheckCircle } from "lucide-react";

export default function ConvertToSale({ cotizacion, onClose, onSuccess }) {
  const [opciones, setOpciones] = useState([]);
  const [selectedOption, setSelectedOption] = useState(null);
  const [formData, setFormData] = useState({
    precio_total: '',
    deposito: '',
    numero_pagos: 2,
    fecha_viaje: cotizacion.fecha_salida || '',
    notas: '',
  });
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    fetchOpciones();
  }, []);

  async function fetchOpciones() {
    try {
      const { data, error } = await supabase
        .from('opciones_cotizacion')
        .select('*')
        .eq('cotizacion_id', cotizacion.id);

      if (error) throw error;
      setOpciones(data || []);
      
      // Auto-select if only one option
      if (data?.length === 1) {
        setSelectedOption(data[0]);
        setFormData(prev => ({
          ...prev,
          precio_total: data[0].precio_total,
        }));
      }
    } catch (error) {
      console.error('Error:', error);
    }
  }

  function handleOptionSelect(opcion) {
    setSelectedOption(opcion);
    setFormData(prev => ({
      ...prev,
      precio_total: opcion.precio_total,
    }));
  }

  function generatePaymentSchedule() {
    const total = parseFloat(formData.precio_total);
    const deposito = parseFloat(formData.deposito) || 0;
    const remaining = total - deposito;
    const numPagos = parseInt(formData.numero_pagos);
    
    if (isNaN(total) || isNaN(numPagos) || numPagos < 1) return [];

    const pagos = [];
    
    // First payment (deposit)
    if (deposito > 0) {
      pagos.push({
        numero_pago: 1,
        monto: deposito,
        fecha_programada: new Date().toISOString().split('T')[0],
        descripcion: 'Depósito inicial',
      });
    }

    // Remaining payments
    const montoPorPago = remaining / (numPagos - (deposito > 0 ? 1 : 0));
    const fechaViaje = new Date(formData.fecha_viaje);
    const diasEntre = Math.floor(
      (fechaViaje - new Date()) / (1000 * 60 * 60 * 24) / (numPagos - (deposito > 0 ? 1 : 0))
    );

    for (let i = (deposito > 0 ? 2 : 1); i <= numPagos; i++) {
      const fecha = new Date();
      fecha.setDate(fecha.getDate() + diasEntre * (i - (deposito > 0 ? 1 : 0)));
      
      pagos.push({
        numero_pago: i,
        monto: montoPorPago,
        fecha_programada: fecha.toISOString().split('T')[0],
        descripcion: `Pago ${i}${i === numPagos ? ' (Final)' : ''}`,
      });
    }

    return pagos;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    
    if (!selectedOption) {
      alert('Selecciona un paquete');
      return;
    }

    if (!formData.precio_total || !formData.fecha_viaje) {
      alert('Completa todos los campos requeridos');
      return;
    }

    setLoading(true);

    try {
      // 1. Create venta
      const { data: venta, error: ventaError } = await supabase
        .from('ventas')
        .insert({
          cotizacion_id: cotizacion.id,
          selected_option_id: selectedOption.id,
          precio_total: parseFloat(formData.precio_total),
          divisa: cotizacion.divisa || 'MXN',
          fecha_viaje: formData.fecha_viaje,
          notas: formData.notas,
          created_by: user.id,
        })
        .select()
        .single();

      if (ventaError) throw ventaError;

      // 2. Create payment schedule
      const pagos = generatePaymentSchedule();
      if (pagos.length > 0) {
        const { error: pagosError } = await supabase
          .from('pagos')
          .insert(
            pagos.map(p => ({
              venta_id: venta.id,
              numero_pago: p.numero_pago,
              monto: p.monto,
              fecha_programada: p.fecha_programada,
              registrado_por: user.id,
              notas: p.descripcion,
            }))
          );

        if (pagosError) throw pagosError;
      }

      // 3. Update cotización
      const { error: cotError } = await supabase
        .from('cotizaciones')
        .update({
          pipeline_stage: 'booking_confirmed',
          probability: 90,
          conversion_date: new Date().toISOString(),
        })
        .eq('id', cotizacion.id);

      if (cotError) throw cotError;

      // 4. Log activity
      await supabase.from('actividades').insert({
        cotizacion_id: cotizacion.id,
        venta_id: venta.id,
        tipo: 'status_change',
        asunto: 'Convertido a venta',
        descripcion: `Venta creada: ${venta.folio_venta}. Monto: $${formData.precio_total}`,
        created_by: user.id,
      });

      alert(`✅ Venta creada: ${venta.folio_venta}`);
      onSuccess();
    } catch (error) {
      console.error('Error:', error);
      alert('Error al crear venta: ' + error.message);
    } finally {
      setLoading(false);
    }
  }

  const paymentSchedule = generatePaymentSchedule();

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-primary">Convertir a Venta</h2>
            <p className="text-sm text-gray-600">
              {cotizacion.folio} - {cotizacion.cliente_nombre}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Select Package */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Paquete Seleccionado *
            </label>
            <div className="space-y-2">
              {opciones.length === 0 && (
                <p className="text-sm text-gray-500">No hay opciones disponibles</p>
              )}
              {opciones.map(opcion => (
                <div
                  key={opcion.id}
                  onClick={() => handleOptionSelect(opcion)}
                  className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                    selectedOption?.id === opcion.id
                      ? 'border-primary bg-primary/5'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{opcion.nombre_paquete}</p>
                      <p className="text-sm text-gray-600">
                        {opcion.num_adultos || 0} adultos, {opcion.num_ninos || 0} niños
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-primary">
                        ${parseFloat(opcion.precio_total).toLocaleString('es-MX')}
                      </p>
                      {selectedOption?.id === opcion.id && (
                        <CheckCircle className="text-primary ml-auto mt-1" size={20} />
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Precio Total */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Precio Total * (MXN)
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-3 text-gray-400" size={20} />
              <input
                type="number"
                step="0.01"
                required
                value={formData.precio_total}
                onChange={(e) => setFormData({ ...formData, precio_total: e.target.value })}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="0.00"
              />
            </div>
          </div>

          {/* Deposito */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Depósito Inicial (MXN)
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-3 text-gray-400" size={20} />
              <input
                type="number"
                step="0.01"
                value={formData.deposito}
                onChange={(e) => setFormData({ ...formData, deposito: e.target.value })}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="0.00"
              />
            </div>
          </div>

          {/* Number of Payments */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Número de Pagos
            </label>
            <select
              value={formData.numero_pagos}
              onChange={(e) => setFormData({ ...formData, numero_pagos: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              {[1, 2, 3, 4, 5, 6].map(n => (
                <option key={n} value={n}>{n} pago{n > 1 ? 's' : ''}</option>
              ))}
            </select>
          </div>

          {/* Travel Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fecha de Viaje *
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-3 text-gray-400" size={20} />
              <input
                type="date"
                required
                value={formData.fecha_viaje}
                onChange={(e) => setFormData({ ...formData, fecha_viaje: e.target.value })}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
          </div>

          {/* Payment Schedule Preview */}
          {paymentSchedule.length > 0 && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold mb-3">Calendario de Pagos</h3>
              <div className="space-y-2">
                {paymentSchedule.map(pago => (
                  <div key={pago.numero_pago} className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">
                      {pago.descripcion} - {new Date(pago.fecha_programada).toLocaleDateString('es-MX')}
                    </span>
                    <span className="font-medium">
                      ${pago.monto.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notas
            </label>
            <textarea
              value={formData.notas}
              onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="Información adicional sobre la venta..."
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 justify-end pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || !selectedOption}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {loading ? 'Creando...' : 'Crear Venta'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
