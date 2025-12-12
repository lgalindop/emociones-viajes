import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../contexts/AuthContext";
import { 
  ArrowLeft, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Calendar,
  DollarSign,
  Upload,
  Check
} from "lucide-react";

export default function PaymentSchedule({ venta, onBack, onUpdate }) {
  const [pagos, setPagos] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    fetchPagos();
  }, [venta.id]);

  async function fetchPagos() {
    try {
      const { data, error } = await supabase
        .from('pagos')
        .select('*')
        .eq('venta_id', venta.id)
        .order('numero_pago');

      if (error) throw error;
      setPagos(data || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  }

  async function markAsPaid(pago) {
    if (!confirm('¿Marcar este pago como recibido?')) return;

    try {
      const { error } = await supabase
        .from('pagos')
        .update({
          estado: 'pagado',
          fecha_pagado: new Date().toISOString(),
          registrado_por: user.id,
        })
        .eq('id', pago.id);

      if (error) throw error;

      // Log activity
      await supabase.from('actividades').insert({
        venta_id: venta.id,
        tipo: 'payment',
        asunto: `Pago ${pago.numero_pago} recibido`,
        descripcion: `Monto: $${pago.monto}`,
        created_by: user.id,
      });

      fetchPagos();
      onUpdate();
      alert('✅ Pago registrado');
    } catch (error) {
      console.error('Error:', error);
      alert('Error al registrar pago');
    }
  }

  function getEstadoIcon(estado) {
    const icons = {
      pagado: <CheckCircle className="text-green-600" size={20} />,
      pendiente: <Clock className="text-yellow-600" size={20} />,
      vencido: <XCircle className="text-red-600" size={20} />,
      cancelado: <XCircle className="text-gray-400" size={20} />,
    };
    return icons[estado] || <Clock className="text-gray-400" size={20} />;
  }

  function getEstadoBadge(estado) {
    const colors = {
      pagado: 'bg-green-100 text-green-800',
      pendiente: 'bg-yellow-100 text-yellow-800',
      vencido: 'bg-red-100 text-red-800',
      cancelado: 'bg-gray-100 text-gray-800',
    };
    return colors[estado] || 'bg-gray-100 text-gray-800';
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-600">Cargando...</div>
      </div>
    );
  }

  const totalPagado = pagos
    .filter(p => p.estado === 'pagado')
    .reduce((sum, p) => sum + parseFloat(p.monto), 0);
  
  const totalPendiente = pagos
    .filter(p => p.estado !== 'pagado' && p.estado !== 'cancelado')
    .reduce((sum, p) => sum + parseFloat(p.monto), 0);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-gray-600 hover:text-primary mb-6"
        >
          <ArrowLeft size={20} />
          <span className="font-medium">Regresar a Ventas</span>
        </button>

        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {/* Venta Info */}
          <div className="bg-gradient-to-r from-primary to-primary-light p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-2xl font-bold">{venta.folio_venta}</h1>
                <p className="opacity-90">{venta.cotizaciones?.cliente_nombre}</p>
              </div>
              <div className="text-right">
                <p className="text-sm opacity-90">Total</p>
                <p className="text-3xl font-bold">
                  ${parseFloat(venta.precio_total).toLocaleString('es-MX')}
                </p>
              </div>
            </div>
            <div className="flex gap-6 text-sm">
              <div>
                <p className="opacity-75">Destino</p>
                <p className="font-medium">📍 {venta.cotizaciones?.destino}</p>
              </div>
              <div>
                <p className="opacity-75">Fecha Viaje</p>
                <p className="font-medium">
                  {new Date(venta.fecha_viaje).toLocaleDateString('es-MX')}
                </p>
              </div>
            </div>
          </div>

          {/* Payment Summary */}
          <div className="p-6 border-b bg-gray-50">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total</p>
                <p className="text-xl font-bold">
                  ${parseFloat(venta.precio_total).toLocaleString('es-MX')}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Pagado</p>
                <p className="text-xl font-bold text-green-600">
                  ${totalPagado.toLocaleString('es-MX')}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Pendiente</p>
                <p className="text-xl font-bold text-red-600">
                  ${totalPendiente.toLocaleString('es-MX')}
                </p>
              </div>
            </div>
            
            {/* Progress bar */}
            <div className="mt-4">
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-green-500 h-3 rounded-full transition-all"
                  style={{ 
                    width: `${(totalPagado / venta.precio_total * 100)}%` 
                  }}
                />
              </div>
              <p className="text-xs text-gray-600 mt-1 text-right">
                {((totalPagado / venta.precio_total) * 100).toFixed(1)}% completado
              </p>
            </div>
          </div>

          {/* Payment Timeline */}
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-6">Calendario de Pagos</h2>
            
            {pagos.length === 0 && (
              <p className="text-center text-gray-500 py-8">
                No hay pagos programados
              </p>
            )}

            <div className="space-y-4">
              {pagos.map(pago => {
                const isPastDue = pago.estado === 'pendiente' && 
                  new Date(pago.fecha_programada) < new Date();
                const isToday = new Date(pago.fecha_programada).toDateString() === 
                  new Date().toDateString();

                return (
                  <div
                    key={pago.id}
                    className={`border-2 rounded-lg p-4 ${
                      pago.estado === 'pagado'
                        ? 'border-green-200 bg-green-50'
                        : isPastDue
                        ? 'border-red-200 bg-red-50'
                        : isToday
                        ? 'border-yellow-200 bg-yellow-50'
                        : 'border-gray-200'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        {getEstadoIcon(pago.estado)}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold">
                              Pago {pago.numero_pago}
                            </h3>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getEstadoBadge(pago.estado)}`}>
                              {pago.estado}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                            <div className="flex items-center gap-1">
                              <Calendar size={14} />
                              <span>
                                {new Date(pago.fecha_programada).toLocaleDateString('es-MX', {
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric'
                                })}
                              </span>
                            </div>
                            {pago.fecha_pagado && (
                              <div className="flex items-center gap-1 text-green-600">
                                <Check size={14} />
                                <span>
                                  Pagado: {new Date(pago.fecha_pagado).toLocaleDateString('es-MX')}
                                </span>
                              </div>
                            )}
                          </div>

                          {pago.metodo_pago && (
                            <p className="text-sm text-gray-600">
                              Método: {pago.metodo_pago}
                            </p>
                          )}
                          {pago.referencia && (
                            <p className="text-sm text-gray-600">
                              Ref: {pago.referencia}
                            </p>
                          )}
                          {pago.notas && (
                            <p className="text-sm text-gray-600 mt-1 italic">
                              {pago.notas}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="text-right">
                        <p className="text-2xl font-bold text-primary mb-2">
                          ${parseFloat(pago.monto).toLocaleString('es-MX')}
                        </p>
                        
                        {pago.estado === 'pendiente' && (
                          <button
                            onClick={() => markAsPaid(pago)}
                            className="flex items-center gap-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                          >
                            <CheckCircle size={16} />
                            Marcar Pagado
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
