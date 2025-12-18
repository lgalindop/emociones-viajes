import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import {
  X,
  Search,
  Plus,
  Trash2,
  ArrowRight,
  ArrowLeft,
  Eye,
} from "lucide-react";
import ReceiptGenerator from "../components/receipts/ReceiptGenerator";

export default function ReceiptWizard({ onClose, onSuccess }) {
  const [step, setStep] = useState(1);
  const [template, setTemplate] = useState("informal");
  const [searchTerm, setSearchTerm] = useState("");
  const [ventas, setVentas] = useState([]);
  const [selectedVenta, setSelectedVenta] = useState(null);
  const [ventaToUse, setVentaToUse] = useState(null);
  const [pagoToUse, setPagoToUse] = useState(null);
  const [formData, setFormData] = useState({
    client_name: "",
    folio_reference: "",
    amount: "",
    payment_date: new Date().toISOString().split("T")[0],
    payment_method: "Efectivo",
    custom_text: "",
    total_price: "",
    previous_payments: "",
    balance: "",
    fecha_viaje: "",
    line_items: [],
    comision: "",
    no_folio_reserva: "",
    fecha_hora_reserva: "",
    total_reserva: "",
    fecha_limite_pago: "",
    show_comision: false,
    show_fechas: true,
    show_reserva_info: true,
  });
  const [showPreview, setShowPreview] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (searchTerm.length > 2) {
      searchVentas();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm]);

  async function searchVentas() {
    try {
      // Search by folio
      const { data: byFolio } = await supabase
        .from("ventas")
        .select(
          `
          *,
          cotizaciones!inner (
            folio,
            cliente_nombre,
            cliente_telefono,
            destino,
            fecha_salida
          )
        `
        )
        .ilike("folio_venta", `%${searchTerm}%`)
        .limit(5);

      // Search by client name in cotizaciones
      const { data: byClient } = await supabase
        .from("cotizaciones")
        .select(
          `
          ventas (
            *,
            cotizaciones (
              folio,
              cliente_nombre,
              cliente_telefono,
              destino,
              fecha_salida
            )
          )
        `
        )
        .ilike("cliente_nombre", `%${searchTerm}%`)
        .not("ventas", "is", null)
        .limit(5);

      // Flatten byClient results
      const clientVentas = (byClient || [])
        .flatMap((cot) => cot.ventas || [])
        .filter((v) => v);

      // Combine and deduplicate
      const allVentas = [...(byFolio || []), ...clientVentas];
      const unique = Array.from(
        new Map(allVentas.map((v) => [v.id, v])).values()
      );

      setVentas(unique.slice(0, 10));
    } catch (error) {
      console.error("Error searching ventas:", error);
      setVentas([]);
    }
  }

  function selectVenta(venta) {
    setSelectedVenta(venta);
    setFormData({
      client_name: venta.cotizaciones.cliente_nombre,
      folio_reference: venta.folio_venta,
      amount: "",
      payment_date: new Date().toISOString().split("T")[0],
      payment_method: "Efectivo",
      custom_text: "",
      total_price: venta.precio_total,
      previous_payments: venta.monto_pagado || 0,
      balance: venta.monto_pendiente || 0,
      fecha_viaje: venta.fecha_viaje || "",
      line_items: [],
      comision: "",
      no_folio_reserva: "",
      fecha_hora_reserva: "",
      total_reserva: "",
      fecha_limite_pago: venta.fecha_limite_pago || "",
      show_comision: false,
      show_fechas: true,
      show_reserva_info: true,
    });
    setSearchTerm("");
    setVentas([]);
  }

  function addLineItem() {
    setFormData({
      ...formData,
      line_items: [...formData.line_items, { label: "", amount: "" }],
    });
  }

  function updateLineItem(index, field, value) {
    const newItems = [...formData.line_items];
    newItems[index][field] = value;
    setFormData({ ...formData, line_items: newItems });
  }

  function removeLineItem(index) {
    setFormData({
      ...formData,
      line_items: formData.line_items.filter((_, i) => i !== index),
    });
  }

  function generateCustomText() {
    const amountText = formData.amount
      ? `$${parseFloat(formData.amount).toLocaleString("es-MX")}`
      : "[monto]";
    const text = `Se recibió un pago de ${amountText} como abono para la reservación${formData.folio_reference ? ` de folio ${formData.folio_reference}` : ""}${formData.client_name ? `, a nombre de ${formData.client_name}` : ""}${formData.fecha_viaje ? `, con fecha de viaje del ${new Date(formData.fecha_viaje).toLocaleDateString("es-MX")}` : ""}.`;

    setFormData({ ...formData, custom_text: text });
  }

  async function handleGenerate() {
    // Validate required fields
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      alert("Por favor ingresa un monto válido");
      return;
    }

    if (!formData.client_name) {
      alert("Por favor ingresa el nombre del cliente");
      return;
    }

    let ventaToUse = selectedVenta;
    let pagoToUse = null;

    // If no venta selected, create a temporary manual venta
    if (!selectedVenta) {
      try {
        // Create a temporary cotizacion first
        const { data: tempCot, error: cotError } = await supabase
          .from("cotizaciones")
          .insert({
            cliente_nombre: formData.client_name,
            cliente_telefono: "",
            destino: "Manual",
            created_by: user.id,
            pipeline_stage: "booking_confirmed",
            is_manual: true,
          })
          .select()
          .single();

        if (cotError) throw cotError;

        // Create a temporary venta
        const { data: tempVenta, error: ventaError } = await supabase
          .from("ventas")
          .insert({
            cotizacion_id: tempCot.id,
            precio_total:
              parseFloat(formData.total_price) || parseFloat(formData.amount),
            fecha_viaje: formData.fecha_viaje || null,
            created_by: user.id,
            is_manual: true,
          })
          .select()
          .single();

        if (ventaError) throw ventaError;

        // Create a manual pago
        const { data: tempPago, error: pagoError } = await supabase
          .from("pagos")
          .insert({
            venta_id: tempVenta.id,
            numero_pago: 1,
            monto: parseFloat(formData.amount),
            fecha_programada: formData.payment_date,
            fecha_pagado: formData.payment_date,
            metodo_pago: formData.payment_method,
            estado: "pagado",
            registrado_por: user.id,
          })
          .select()
          .single();

        if (pagoError) throw pagoError;

        ventaToUse = {
          ...tempVenta,
          cotizaciones: tempCot,
        };
        pagoToUse = tempPago;
        setVentaToUse(ventaToUse);
        setPagoToUse(pagoToUse);
      } catch (error) {
        console.error("Error creating manual venta:", error);
        alert("Error al crear registro temporal: " + error.message);
        return;
      }
    } else {
      // Use existing venta, create a new pago entry
      try {
        const { data: newPago, error: pagoError } = await supabase
          .from("pagos")
          .insert({
            venta_id: selectedVenta.id,
            numero_pago: 999, // Manual entry marker
            monto: parseFloat(formData.amount),
            fecha_programada: formData.payment_date,
            fecha_pagado: formData.payment_date,
            metodo_pago: formData.payment_method,
            estado: "pagado",
            registrado_por: user.id,
            notas: "Pago manual desde wizard de recibos",
          })
          .select()
          .single();

        if (pagoError) throw pagoError;
        pagoToUse = newPago;
        setVentaToUse(selectedVenta);
        setPagoToUse(pagoToUse);
      } catch (error) {
        console.error("Error creating pago:", error);
        alert("Error al crear registro de pago: " + error.message);
        return;
      }
    }

    // Open preview with actual venta/pago
    setShowPreview(true);
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
        <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[95vh] overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between z-10">
            <div>
              <h2 className="text-2xl font-bold text-primary">
                Generar Recibo
              </h2>
              <p className="text-sm text-gray-600">Paso {step} de 2</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <X size={24} />
            </button>
          </div>

          <div className="p-6">
            {/* Step 1: Template & Source */}
            {step === 1 && (
              <div className="space-y-6">
                {/* Template Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Tipo de Recibo
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={() => setTemplate("informal")}
                      className={`p-4 border-2 rounded-lg text-left transition-all ${
                        template === "informal"
                          ? "border-primary bg-primary/5"
                          : "border-gray-300 hover:border-primary/50"
                      }`}
                    >
                      <div className="font-semibold">Informal</div>
                      <div className="text-sm text-gray-600">
                        Nota simple con texto personalizado
                      </div>
                    </button>

                    <button
                      onClick={() => setTemplate("professional")}
                      className={`p-4 border-2 rounded-lg text-left transition-all ${
                        template === "professional"
                          ? "border-primary bg-primary/5"
                          : "border-gray-300 hover:border-primary/50"
                      }`}
                    >
                      <div className="font-semibold">Profesional</div>
                      <div className="text-sm text-gray-600">
                        Formato completo con detalles (+ PDF)
                      </div>
                    </button>
                  </div>
                </div>

                {/* Search Existing Sale */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Buscar Venta Existente (Opcional)
                  </label>
                  <div className="relative">
                    <Search
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                      size={20}
                    />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Buscar por folio o cliente..."
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  {ventas.length > 0 && (
                    <div className="mt-2 border rounded-lg max-h-48 overflow-y-auto">
                      {ventas.map((venta) => (
                        <button
                          key={venta.id}
                          onClick={() => selectVenta(venta)}
                          className="w-full p-3 text-left hover:bg-gray-50 border-b last:border-b-0 transition-colors"
                        >
                          <div className="font-medium">{venta.folio_venta}</div>
                          <div className="text-sm text-gray-600">
                            {venta.cotizaciones.cliente_nombre} - $
                            {venta.precio_total.toLocaleString("es-MX")}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  {selectedVenta && (
                    <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-green-900">
                            {selectedVenta.folio_venta}
                          </div>
                          <div className="text-sm text-green-700">
                            {selectedVenta.cotizaciones.cliente_nombre}
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            setSelectedVenta(null);
                            setFormData({
                              client_name: "",
                              folio_reference: "",
                              amount: "",
                              payment_date: new Date()
                                .toISOString()
                                .split("T")[0],
                              payment_method: "Efectivo",
                              custom_text: "",
                              total_price: "",
                              previous_payments: "",
                              balance: "",
                              fecha_viaje: "",
                              line_items: [],
                              comision: "",
                              no_folio_reserva: "",
                              fecha_hora_reserva: "",
                              total_reserva: "",
                              fecha_limite_pago: "",
                              show_comision: false,
                              show_fechas: true,
                              show_reserva_info: true,
                            });
                          }}
                          className="text-red-600 hover:bg-red-100 p-2 rounded"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Navigation */}
                <div className="flex justify-end gap-3">
                  <button
                    onClick={onClose}
                    className="px-6 py-3 border-2 border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={() => setStep(2)}
                    className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 font-medium"
                  >
                    Siguiente
                    <ArrowRight size={20} />
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Receipt Details */}
            {step === 2 && (
              <div className="space-y-6">
                {/* Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Cliente *
                    </label>
                    <input
                      type="text"
                      value={formData.client_name}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          client_name: e.target.value,
                        })
                      }
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                      placeholder="Nombre del cliente"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Folio / Referencia
                    </label>
                    <input
                      type="text"
                      value={formData.folio_reference}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          folio_reference: e.target.value,
                        })
                      }
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                      placeholder="Folio de referencia"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Monto del Pago *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.amount}
                      onChange={(e) =>
                        setFormData({ ...formData, amount: e.target.value })
                      }
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                      placeholder="0.00"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Fecha de Pago
                    </label>
                    <input
                      type="date"
                      value={formData.payment_date}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          payment_date: e.target.value,
                        })
                      }
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Método de Pago
                    </label>
                    <select
                      value={formData.payment_method}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          payment_method: e.target.value,
                        })
                      }
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                    >
                      <option>Efectivo</option>
                      <option>Transferencia</option>
                      <option>Tarjeta de Crédito</option>
                      <option>Tarjeta de Débito</option>
                      <option>Depósito</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Fecha de Viaje
                    </label>
                    <input
                      type="date"
                      value={formData.fecha_viaje}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          fecha_viaje: e.target.value,
                        })
                      }
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>

                {/* Financial Summary (Professional Template) */}
                {template === "professional" && (
                  <>
                    {/* Visibility Controls */}
                    <div className="border-2 border-gray-200 bg-gray-50 rounded-lg p-4 mb-4">
                      <h3 className="font-semibold text-gray-900 mb-3">
                        Mostrar en Recibo
                      </h3>
                      <div className="flex flex-wrap gap-4">
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={formData.show_comision}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                show_comision: e.target.checked,
                              })
                            }
                            className="w-4 h-4"
                          />
                          <span className="text-sm">Comisión</span>
                        </label>
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={formData.show_fechas}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                show_fechas: e.target.checked,
                              })
                            }
                            className="w-4 h-4"
                          />
                          <span className="text-sm">
                            Fechas (próximo abono/límite)
                          </span>
                        </label>
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={formData.show_reserva_info}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                show_reserva_info: e.target.checked,
                              })
                            }
                            className="w-4 h-4"
                          />
                          <span className="text-sm">Info de Reservación</span>
                        </label>
                      </div>
                    </div>

                    <div className="border-2 border-blue-200 bg-blue-50 rounded-lg p-4">
                      <h3 className="font-semibold text-blue-900 mb-3">
                        Resumen Financiero
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Precio Total
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            value={formData.total_price}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                total_price: e.target.value,
                              })
                            }
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                            placeholder="0.00"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Pagos Anteriores
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            value={formData.previous_payments}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                previous_payments: e.target.value,
                              })
                            }
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                            placeholder="0.00"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Saldo Pendiente
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            value={formData.balance}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                balance: e.target.value,
                              })
                            }
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                            placeholder="0.00"
                          />
                        </div>

                        {formData.show_comision && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Comisión
                            </label>
                            <input
                              type="number"
                              step="0.01"
                              value={formData.comision}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  comision: e.target.value,
                                })
                              }
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                              placeholder="0.00"
                            />
                          </div>
                        )}

                        {formData.show_fechas && (
                          <>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Fecha Límite Pago
                              </label>
                              <input
                                type="date"
                                value={formData.fecha_limite_pago}
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    fecha_limite_pago: e.target.value,
                                  })
                                }
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                              />
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </>
                )}

                {/* Custom Line Items (Professional Template) */}
                {template === "professional" && (
                  <div className="border-2 border-purple-200 bg-purple-50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-purple-900">
                        Conceptos Adicionales
                      </h3>
                      <button
                        onClick={addLineItem}
                        className="flex items-center gap-1 px-3 py-1.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm"
                      >
                        <Plus size={16} />
                        Agregar
                      </button>
                    </div>

                    {formData.line_items.length === 0 && (
                      <p className="text-sm text-gray-600 text-center py-4">
                        No hay conceptos adicionales. Haz clic en "Agregar" para
                        añadir.
                      </p>
                    )}

                    <div className="space-y-2">
                      {formData.line_items.map((item, index) => (
                        <div key={index} className="flex gap-2">
                          <input
                            type="text"
                            value={item.label}
                            onChange={(e) =>
                              updateLineItem(index, "label", e.target.value)
                            }
                            placeholder="Concepto"
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                          />
                          <input
                            type="number"
                            step="0.01"
                            value={item.amount}
                            onChange={(e) =>
                              updateLineItem(index, "amount", e.target.value)
                            }
                            placeholder="0.00"
                            className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                          />
                          <button
                            onClick={() => removeLineItem(index)}
                            className="p-2 text-red-600 hover:bg-red-100 rounded-lg"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Custom Text (Informal Template) */}
                {template === "informal" && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Descripción del Pago
                      </label>
                      <button
                        onClick={generateCustomText}
                        className="text-sm text-primary hover:underline"
                      >
                        Generar automático
                      </button>
                    </div>
                    <textarea
                      value={formData.custom_text}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          custom_text: e.target.value,
                        })
                      }
                      rows={4}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                      placeholder="Descripción detallada del pago..."
                    />
                  </div>
                )}

                {/* Navigation */}
                <div className="flex justify-between gap-3">
                  <button
                    onClick={() => setStep(1)}
                    className="flex items-center gap-2 px-6 py-3 border-2 border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
                  >
                    <ArrowLeft size={20} />
                    Anterior
                  </button>

                  <div className="flex gap-3">
                    <button
                      onClick={onClose}
                      className="px-6 py-3 border-2 border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleGenerate}
                      className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
                    >
                      <Eye size={20} />
                      Generar Recibo
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      {showPreview && ventaToUse && pagoToUse && (
        <ReceiptGenerator
          venta={ventaToUse}
          pago={pagoToUse}
          customData={{
            template_type: template,
            custom_text: formData.custom_text,
            line_items: formData.line_items,
            show_comision: formData.show_comision,
            show_fechas: formData.show_fechas,
            show_reserva_info: formData.show_reserva_info,
            comision: formData.comision,
            fecha_limite_pago: formData.fecha_limite_pago,
          }}
          onClose={() => setShowPreview(false)}
          onSuccess={(receipt) => {
            setShowPreview(false);
            onClose();
            onSuccess(receipt);
          }}
        />
      )}
    </>
  );
}
