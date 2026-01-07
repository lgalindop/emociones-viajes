import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../hooks/useAuth";
import { 
  ArrowLeft, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Calendar,
  DollarSign,
  Check,
  Receipt,
  Eye,
  Send,
  Download
} from "lucide-react";
import ReceiptGenerator from "../receipts/ReceiptGenerator";

export default function PaymentSchedule({ venta, onBack, onUpdate }) {
  const [pagos, setPagos] = useState([]);
  const [receipts, setReceipts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showReceiptGenerator, setShowReceiptGenerator] = useState(false);
  const [selectedPago, setSelectedPago] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    fetchPagos();
    fetchReceipts();
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

  async function fetchReceipts() {
    try {
      const { data, error } = await supabase
        .from('receipts')
        .select('*')
        .eq('venta_id', venta.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReceipts(data || []);
    } catch (error) {
      console.error('Error fetching receipts:', error);
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

      await fetchPagos();
      onUpdate();
      alert('✅ Pago registrado');
      
      // Ask if they want to generate receipt
      if (confirm('¿Deseas generar un recibo para este pago?')) {
        const updatedPagos = await supabase
          .from('pagos')
          .select('*')
          .eq('id', pago.id)
          .single();
        
        if (updatedPagos.data) {
          setSelectedPago(updatedPagos.data);
          setShowReceiptGenerator(true);
        }
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error al registrar pago');
    }
  }

  async function shareViaWhatsApp(receipt) {
    const message = encodeURIComponent(
      `Recibo de pago ${receipt.receipt_number}\nFolio: ${venta.folio_venta}\nMonto: $${receipt.amount.toLocaleString('es-MX')}`
    );

    // Try native share first (mobile)
    if (navigator.share) {
      try {
        const response = await fetch(receipt.image_url);
        const blob = await response.blob();
        const file = new File([blob], `${receipt.receipt_number}.jpg`, { type: 'image/jpeg' });

        await navigator.share({
          title: 'Recibo de Pago',
          text: `Recibo ${receipt.receipt_number}`,
          files: [file]
        });

        await supabase
          .from('receipts')
          .update({ 
            sent_via_whatsapp: true, 
            sent_at: new Date().toISOString() 
          })
          .eq('id', receipt.id);

        fetchReceipts();
        return;
      } catch (error) {
        console.log('Native share failed, falling back to WhatsApp Web');
      }
    }

    // Fallback: WhatsApp Web
    const phone = venta.cotizaciones.cliente_telefono?.replace(/\D/g, '');
    if (phone) {
      const whatsappUrl = `https://wa.me/${phone}?text=${message}`;
      window.open(whatsappUrl, '_blank');

      await supabase
        .from('receipts')
        .update({ 
          sent_via_whatsapp: true, 
          sent_at: new Date().toISOString() 
        })
        .eq('id', receipt.id);

      fetchReceipts();
    } else {
      alert('No hay número de teléfono registrado');
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
    <>
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <button
              onClick={onBack}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
            >
              <ArrowLeft size={20} />
              Volver a Ventas
            </button>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h1 className="text-2xl font-bold text-primary">
                    {venta.folio_venta}
                  </h1>
                  <p className="text-gray-600">
                    {venta.cotizaciones.cliente_nombre}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600 mb-1">Total Venta</p>
                  <p className="text-3xl font-bold text-primary">
                    ${parseFloat(venta.precio_total).toLocaleString('es-MX')}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-4">
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
          </div>

          {/* Payment Timeline */}
          <div className="bg-white rounded-lg shadow p-6">
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
                const pagoReceipts = receipts.filter(r => r.pago_id === pago.id);

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
                          {pago.notas && (
                            <p className="text-sm text-gray-600 mt-1 italic">
                              {pago.notas}
                            </p>
                          )}

                          {/* Receipts for this payment */}
                          {pagoReceipts.length > 0 && (
                            <div className="mt-3 pt-3 border-t border-gray-200">
                              <div className="text-sm font-medium text-gray-700 mb-2">
                                Recibos:
                              </div>
                              <div className="space-y-2">
                                {pagoReceipts.map(receipt => (
                                  <div key={receipt.id} className="flex items-center gap-2 text-sm">
                                    <Receipt size={14} className="text-blue-500" />
                                    <span className="font-mono">{receipt.receipt_number}</span>
                                    <button
                                      onClick={() => window.open(receipt.image_url, '_blank')}
                                      className="p-1 text-blue-600 hover:bg-blue-100 rounded"
                                      title="Ver recibo"
                                    >
                                      <Eye size={14} />
                                    </button>
                                    <button
                                      onClick={() => shareViaWhatsApp(receipt)}
                                      className="p-1 text-green-600 hover:bg-green-100 rounded"
                                      title="Enviar por WhatsApp"
                                    >
                                      <Send size={14} />
                                    </button>
                                    {receipt.sent_via_whatsapp && (
                                      <span className="text-xs text-green-600">✓ Enviado</span>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
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

                        {pago.estado === 'pagado' && pagoReceipts.length === 0 && (
                          <button
                            onClick={() => {
                              setSelectedPago(pago);
                              setShowReceiptGenerator(true);
                            }}
                            className="flex items-center gap-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm mt-2"
                          >
                            <Receipt size={16} />
                            Generar Recibo
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

      {/* Receipt Generator Modal */}
      {showReceiptGenerator && selectedPago && (
        <ReceiptGenerator
          venta={venta}
          pago={selectedPago}
          onClose={() => {
            setShowReceiptGenerator(false);
            setSelectedPago(null);
          }}
          onSuccess={(receipt) => {
            fetchReceipts();
            setShowReceiptGenerator(false);
            setSelectedPago(null);
          }}
        />
      )}
    </>
  );
}
