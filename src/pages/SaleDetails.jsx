import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../hooks/useAuth";
import {
  ArrowLeft,
  Calendar,
  DollarSign,
  User,
  MapPin,
  Trash2,
  Receipt,
  Eye,
  Plus,
  Edit,
  Save,
  Plane,
  X,
} from "lucide-react";
import Toast from "../components/ui/Toast";
import TravelersManager from "../components/customers/TravelersManager";
import ReceiptGenerator from "../components/receipts/ReceiptGenerator";

export default function SaleDetails({ saleId, onBack }) {
  const { user, canEdit } = useAuth();
  const [venta, setVenta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState(null);

  // Viajeros state
  const [viajeros, setViajeros] = useState([]);
  const [loadingViajeros, setLoadingViajeros] = useState(false);
  const [editingViajeros, setEditingViajeros] = useState(false);
  const [editViajeros, setEditViajeros] = useState([]);
  const [savingViajeros, setSavingViajeros] = useState(false);

  // Receipts state
  const [receipts, setReceipts] = useState([]);
  const [showReceiptPreview, setShowReceiptPreview] = useState(null);
  const [showReceiptGenerator, setShowReceiptGenerator] = useState(false);
  const [selectedPago, setSelectedPago] = useState(null);

  useEffect(() => {
    fetchSale();
  }, [saleId]);

  useEffect(() => {
    if (venta) {
      fetchViajeros();
      fetchReceipts();
    }
  }, [venta?.id]);

  async function fetchSale() {
    try {
      const { data, error } = await supabase
        .from("ventas")
        .select(
          `
          *,
          cotizaciones!ventas_cotizacion_id_fkey (
            id,
            folio,
            cliente_id,
            cliente_nombre,
            cliente_telefono,
            cliente_email,
            destino,
            fecha_salida,
            fecha_regreso,
            num_adultos,
            num_ninos,
            num_infantes,
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
        .eq("id", saleId)
        .single();

      if (error) throw error;
      setVenta(data);
    } catch (error) {
      console.error("Error:", error);
      setToast({ message: "Error al cargar venta", type: "error" });
    } finally {
      setLoading(false);
    }
  }

  async function fetchViajeros() {
    setLoadingViajeros(true);
    try {
      const { data, error } = await supabase
        .from("viajeros")
        .select("*")
        .eq("venta_id", saleId)
        .order("es_titular", { ascending: false });

      if (error) throw error;
      setViajeros(data || []);
    } catch (error) {
      console.error("Error fetching viajeros:", error);
    } finally {
      setLoadingViajeros(false);
    }
  }

  async function fetchReceipts() {
    try {
      const { data, error } = await supabase
        .from("receipts")
        .select("*")
        .eq("venta_id", saleId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setReceipts(data || []);
    } catch (error) {
      console.error("Error fetching receipts:", error);
    }
  }

  function startEditingViajeros() {
    setEditViajeros(
      viajeros.map((v) => ({ ...v, id: v.id || crypto.randomUUID() }))
    );
    setEditingViajeros(true);
  }

  async function saveViajeros() {
    setSavingViajeros(true);
    try {
      // Delete existing viajeros
      await supabase.from("viajeros").delete().eq("venta_id", saleId);

      // Insert new viajeros
      if (editViajeros.length > 0) {
        const viajerosData = editViajeros.map((v) => ({
          venta_id: saleId,
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

        const { error } = await supabase.from("viajeros").insert(viajerosData);

        if (error) throw error;
      }

      setToast({ message: "Viajeros guardados", type: "success" });
      setEditingViajeros(false);
      fetchViajeros();
    } catch (error) {
      console.error("Error saving viajeros:", error);
      setToast({
        message: "Error al guardar viajeros: " + error.message,
        type: "error",
      });
    } finally {
      setSavingViajeros(false);
    }
  }

  function getReceiptForPago(pagoId) {
    return receipts.find((r) => r.pago_id === pagoId);
  }

  async function handleDeleteSale() {
    setDeleting(true);
    try {
      // 1. Delete all receipts associated with this venta
      const { error: receiptsError } = await supabase
        .from("receipts")
        .delete()
        .eq("venta_id", saleId);

      if (receiptsError) throw receiptsError;

      // 2. Delete all pagos associated with this venta
      const { error: pagosError } = await supabase
        .from("pagos")
        .delete()
        .eq("venta_id", saleId);

      if (pagosError) throw pagosError;

      // 3. Delete viajeros
      const { error: viajerosError } = await supabase
        .from("viajeros")
        .delete()
        .eq("venta_id", saleId);

      if (viajerosError) throw viajerosError;

      // 4. Reset cotización to negotiation stage
      if (venta.cotizaciones?.id) {
        const { error: cotError } = await supabase
          .from("cotizaciones")
          .update({
            pipeline_stage: "negotiation",
            probability: 50,
            conversion_date: null,
            last_stage_change_at: new Date().toISOString(),
            updated_by: user?.id,
          })
          .eq("id", venta.cotizaciones.id);

        if (cotError) throw cotError;

        // 5. Delete conversion history entry
        const { error: historyError } = await supabase
          .from("cotizacion_stage_history")
          .delete()
          .match({
            cotizacion_id: venta.cotizaciones.id,
            to_stage: "booking_confirmed",
          });

        if (historyError) throw historyError;
      }

      // 6. Delete the venta itself
      const { error: ventaError } = await supabase
        .from("ventas")
        .delete()
        .eq("id", saleId);

      if (ventaError) throw ventaError;

      setToast({ message: "Venta eliminada correctamente", type: "success" });
      setTimeout(() => onBack(), 1500);
    } catch (error) {
      console.error("Error:", error);
      setToast({
        message: "Error al eliminar venta: " + error.message,
        type: "error",
      });
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
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
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
                  <li>Todos los viajeros registrados</li>
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
                  onClick={handleDeleteSale}
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
                {(venta.cotizaciones.num_adultos || 0) +
                  (venta.cotizaciones.num_ninos || 0) +
                  (venta.cotizaciones.num_infantes || 0)}{" "}
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

        {/* Viajeros Card */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Plane size={20} />
              Viajeros
              <span className="text-sm font-normal text-gray-500">
                ({viajeros.length} de{" "}
                {(venta.cotizaciones.num_adultos || 0) +
                  (venta.cotizaciones.num_ninos || 0) +
                  (venta.cotizaciones.num_infantes || 0)}
                )
              </span>
            </h2>
            {canEdit() && !editingViajeros && (
              <button
                onClick={startEditingViajeros}
                className="flex items-center gap-2 px-3 py-1.5 text-sm bg-primary text-white rounded-lg hover:bg-primary/90"
              >
                <Edit size={14} />
                Editar
              </button>
            )}
          </div>

          {loadingViajeros ? (
            <div className="text-center py-4">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
            </div>
          ) : editingViajeros ? (
            <>
              <TravelersManager
                viajeros={editViajeros}
                onChange={setEditViajeros}
                numAdultos={venta.cotizaciones.num_adultos || 0}
                numMenores={venta.cotizaciones.num_ninos || 0}
                numInfantes={venta.cotizaciones.num_infantes || 0}
                clienteId={venta.cotizaciones.cliente_id}
              />
              <div className="flex gap-2 mt-4 justify-end">
                <button
                  onClick={() => setEditingViajeros(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Cancelar
                </button>
                <button
                  onClick={saveViajeros}
                  disabled={savingViajeros}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
                >
                  {savingViajeros ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    <>
                      <Save size={16} />
                      Guardar
                    </>
                  )}
                </button>
              </div>
            </>
          ) : viajeros.length === 0 ? (
            <div className="text-center py-6 text-gray-500">
              <Plane size={32} className="mx-auto mb-2 text-gray-400" />
              <p>No hay viajeros registrados</p>
              {canEdit() && (
                <button
                  onClick={startEditingViajeros}
                  className="text-primary hover:text-primary/80 text-sm mt-2"
                >
                  + Agregar viajeros
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {viajeros.map((viajero) => (
                <div
                  key={viajero.id}
                  className={`flex items-center justify-between p-3 rounded-lg ${
                    viajero.es_titular
                      ? "bg-green-50 border border-green-200"
                      : "bg-gray-50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        viajero.tipo_viajero === "menor"
                          ? "bg-blue-100 text-blue-600"
                          : viajero.tipo_viajero === "infante"
                            ? "bg-pink-100 text-pink-600"
                            : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      <User size={16} />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {viajero.nombre_completo}
                        {viajero.es_titular && (
                          <span className="ml-2 text-xs px-2 py-0.5 bg-green-200 text-green-800 rounded-full">
                            Titular
                          </span>
                        )}
                      </p>
                      <p className="text-sm text-gray-500 capitalize">
                        {viajero.tipo_viajero}
                        {viajero.pasaporte_numero &&
                          ` • Pasaporte: ${viajero.pasaporte_numero}`}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
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
              {venta.pagos.map((pago) => {
                const pagoReceipt = getReceiptForPago(pago.id);
                return (
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
                              pago.fecha_pagado.split("T")[0] + "T00:00:00"
                            ).toLocaleDateString("es-MX")
                          : new Date(
                              pago.fecha_programada + "T00:00:00"
                            ).toLocaleDateString("es-MX")}
                      </p>
                      {pagoReceipt && (
                        <p className="text-xs text-blue-600 mt-1">
                          Recibo: {pagoReceipt.receipt_number}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
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

                      {/* Receipt Actions */}
                      {pago.estado === "pagado" && (
                        <div className="flex gap-1">
                          {pagoReceipt ? (
                            <button
                              onClick={() => setShowReceiptPreview(pagoReceipt)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Ver recibo"
                            >
                              <Eye size={18} />
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                setSelectedPago(pago);
                                setShowReceiptGenerator(true);
                              }}
                              className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                              title="Generar recibo"
                            >
                              <Receipt size={18} />
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Receipt Preview Modal */}
      {showReceiptPreview && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[95vh] overflow-hidden flex flex-col">
            {/* Header - Fixed */}
            <div className="flex items-center justify-between p-4 border-b flex-shrink-0">
              <h3 className="text-lg font-semibold">
                Recibo {showReceiptPreview.receipt_number}
              </h3>
              <button
                onClick={() => setShowReceiptPreview(null)}
                className="p-1 text-gray-500 hover:text-gray-700 rounded"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content - Scrollable */}
            <div className="flex-1 overflow-y-auto p-4">
              {showReceiptPreview.image_url ? (
                <img
                  src={showReceiptPreview.image_url}
                  alt={`Recibo ${showReceiptPreview.receipt_number}`}
                  className="w-full h-auto rounded-lg"
                />
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Receipt size={48} className="mx-auto mb-2 text-gray-400" />
                  <p>No hay imagen del recibo disponible</p>
                </div>
              )}
            </div>

            {/* Footer - Fixed */}
            <div className="flex gap-2 p-4 border-t flex-shrink-0">
              {showReceiptPreview.image_url && (
                <a
                  href={showReceiptPreview.image_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-center hover:bg-blue-700"
                >
                  Abrir en nueva pestaña
                </a>
              )}
              <button
                onClick={() => setShowReceiptPreview(null)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Receipt Generator Modal */}
      {showReceiptGenerator && selectedPago && (
        <ReceiptGenerator
          venta={venta}
          pago={selectedPago}
          onClose={() => {
            setShowReceiptGenerator(false);
            setSelectedPago(null);
          }}
          onSuccess={() => {
            fetchReceipts();
            setShowReceiptGenerator(false);
            setSelectedPago(null);
            setToast({
              message: "Recibo generado correctamente",
              type: "success",
            });
          }}
        />
      )}
    </div>
  );
}
