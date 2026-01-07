import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../hooks/useAuth";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, FileText } from "lucide-react";

// Helper function for number to words conversion
function convertNumberToWords(num) {
  const units = [
    "",
    "un",
    "dos",
    "tres",
    "cuatro",
    "cinco",
    "seis",
    "siete",
    "ocho",
    "nueve",
  ];
  const tens = [
    "",
    "",
    "veinte",
    "treinta",
    "cuarenta",
    "cincuenta",
    "sesenta",
    "setenta",
    "ochenta",
    "noventa",
  ];
  const hundreds = [
    "",
    "cien",
    "doscientos",
    "trescientos",
    "cuatrocientos",
    "quinientos",
    "seiscientos",
    "setecientos",
    "ochocientos",
    "novecientos",
  ];

  if (num === 0) return "cero";
  if (num >= 1000000)
    return Math.floor(num / 1000).toLocaleString("es-MX") + " mil";
  if (num >= 1000) {
    const thousand = Math.floor(num / 1000);
    const remainder = num % 1000;
    return (
      (thousand === 1 ? "mil" : units[thousand] + " mil") +
      (remainder > 0 ? " " + convertNumberToWords(remainder) : "")
    );
  }
  if (num >= 100) {
    const hundred = Math.floor(num / 100);
    const remainder = num % 100;
    return (
      hundreds[hundred] +
      (remainder > 0 ? " " + convertNumberToWords(remainder) : "")
    );
  }
  if (num >= 20) {
    const ten = Math.floor(num / 10);
    const unit = num % 10;
    return tens[ten] + (unit > 0 ? " y " + units[unit] : "");
  }
  if (num >= 10) {
    const specials = [
      "diez",
      "once",
      "doce",
      "trece",
      "catorce",
      "quince",
      "dieciséis",
      "diecisiete",
      "dieciocho",
      "diecinueve",
    ];
    return specials[num - 10];
  }
  return units[num];
}

export default function ReceiptWizard() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const editMode = location.state?.editMode || false;
  const receiptId = location.state?.receiptId;
  const ventaIdFromNav = location.state?.ventaId;

  const [step, setStep] = useState(1);
  const [mode, setMode] = useState(ventaIdFromNav ? "from-sale" : null);
  const [ventas, setVentas] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedVenta, setSelectedVenta] = useState(null);
  const [loading, setLoading] = useState(false);
  const [existingReceipt, setExistingReceipt] = useState(null);

  const [receiptData, setReceiptData] = useState({
    clientName: "",
    clientPhone: "",
    clientEmail: "",
    destination: "",
    travelers: "",
    amountPaid: "",
    paymentMethod: "Efectivo",
    paymentDate: new Date().toISOString().split("T")[0],
    receiptNumber: "",
    notes: "",
    templateType: "professional",
    folioVenta: "",
  });

  useEffect(() => {
    if (editMode && receiptId) {
      loadReceiptForEdit();
    } else if (mode === "from-sale") {
      fetchSales();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editMode, receiptId, mode]);

  useEffect(() => {
    if (ventaIdFromNav && ventas.length > 0) {
      const venta = ventas.find((v) => v.id === ventaIdFromNav);
      if (venta) {
        handleVentaSelect(venta);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ventaIdFromNav, ventas]);

  // Auto-generate custom text when template type changes to informal
  useEffect(() => {
    if (
      receiptData.templateType === "informal" &&
      selectedVenta &&
      receiptData.amountPaid &&
      !receiptData.notes
    ) {
      const amountText = convertNumberToWords(
        parseFloat(receiptData.amountPaid)
      );
      const defaultText = `Se recibió un pago de $${parseFloat(
        receiptData.amountPaid
      ).toLocaleString("es-MX", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })} (${amountText} pesos 00/100 M.N.) como abono para la reservación de ${receiptData.destination || "viaje"}, a nombre de ${receiptData.clientName}, con fecha de viaje del ${selectedVenta.fecha_viaje ? new Date(selectedVenta.fecha_viaje).toLocaleDateString("es-MX", { day: "2-digit", month: "long", year: "numeric" }) : "por confirmar"}.`;

      setReceiptData({
        ...receiptData,
        notes: defaultText,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [receiptData.templateType, selectedVenta, receiptData.amountPaid]);

  async function loadReceiptForEdit() {
    try {
      setLoading(true);
      const { data: receipt, error } = await supabase
        .from("receipts")
        .select(
          `
          *,
          ventas!receipts_venta_id_fkey (
            id,
            folio_venta,
            precio_total,
            monto_pagado,
            fecha_limite_pago,
            cotizaciones!ventas_cotizacion_id_fkey (
              cliente_nombre,
              cliente_telefono,
              cliente_email,
              destino,
              num_adultos,
              num_ninos
            )
          )
        `
        )
        .eq("id", receiptId)
        .single();

      if (error) throw error;

      setExistingReceipt(receipt);
      setSelectedVenta(receipt.ventas);
      setMode(receipt.venta_id ? "from-sale" : "standalone");

      // Populate form with existing data
      setReceiptData({
        clientName: receipt.client_name || "",
        clientPhone: receipt.client_phone || "",
        clientEmail: receipt.client_email || "",
        destination: receipt.destination || "",
        travelers: receipt.travelers?.toString() || "",
        amountPaid: receipt.amount?.toString() || "",
        paymentMethod: receipt.payment_method || "Efectivo",
        paymentDate:
          receipt.payment_date || new Date().toISOString().split("T")[0],
        receiptNumber: receipt.receipt_number || "",
        notes: receipt.notes || "",
        templateType: receipt.template_type || "professional",
        folioVenta: receipt.ventas?.folio_venta || "",
      });

      setStep(2);
    } catch (error) {
      console.error("Error:", error);
      alert("Error al cargar recibo: " + error.message);
      navigate("/app/receipts");
    } finally {
      setLoading(false);
    }
  }

  async function fetchSales() {
    try {
      const { data, error } = await supabase
        .from("ventas")
        .select(
          `
          *,
          cotizaciones!ventas_cotizacion_id_fkey (
            folio,
            cliente_nombre,
            cliente_telefono,
            cliente_email,
            destino,
            num_adultos,
            num_ninos
          )
        `
        )
        .order("created_at", { ascending: false });

      if (error) throw error;
      setVentas(data || []);
    } catch (error) {
      console.error("Error:", error);
      alert("Error al cargar ventas");
    }
  }

  async function generateNextReceiptNumber() {
    try {
      const year = new Date().getFullYear();
      const { data, error } = await supabase
        .from("receipts")
        .select("receipt_number")
        .like("receipt_number", `REC-${year}-%`)
        .order("receipt_number", { ascending: false })
        .limit(1);

      if (error) throw error;

      if (data && data.length > 0) {
        const lastNumber = data[0].receipt_number;
        const match = lastNumber.match(/REC-\d{4}-(\d+)/);
        if (match) {
          const nextNum = parseInt(match[1]) + 1;
          return `REC-${year}-${String(nextNum).padStart(5, "0")}`;
        }
      }

      return `REC-${year}-00001`;
    } catch (error) {
      console.error("Error:", error);
      const year = new Date().getFullYear();
      return `REC-${year}-00001`;
    }
  }

  async function handleVentaSelect(venta) {
    setSelectedVenta(venta);
    const travelers =
      venta.cotizaciones.num_adultos + venta.cotizaciones.num_ninos;

    // Generate sequential receipt number
    const receiptNum =
      existingReceipt?.receipt_number || (await generateNextReceiptNumber());

    setReceiptData({
      ...receiptData,
      clientName: venta.cotizaciones.cliente_nombre,
      clientPhone: venta.cotizaciones.cliente_telefono || "",
      clientEmail: venta.cotizaciones.cliente_email || "",
      destination: venta.cotizaciones.destino,
      travelers: travelers.toString(),
      receiptNumber: receiptNum,
      folioVenta: venta.folio_venta,
    });
    setStep(2);
  }

  async function handleGenerateReceipt(imageBlob) {
    try {
      setLoading(true);

      // Upload image to Supabase Storage
      const fileName = `receipt-${receiptData.receiptNumber}-${Date.now()}.png`;
      const { error: uploadError } = await supabase.storage
        .from("receipts")
        .upload(fileName, imageBlob, {
          contentType: "image/png",
          upsert: false,
        });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("receipts")
        .getPublicUrl(fileName);

      const imageUrl = urlData.publicUrl;

      if (editMode && existingReceipt) {
        // EDIT MODE: Update existing receipt and cascade changes
        await handleEditReceipt(imageUrl);
      } else {
        // CREATE MODE: New receipt
        await handleCreateReceipt(imageUrl);
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Error al procesar recibo: " + error.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateReceipt(imageUrl) {
    const amountPaid = parseFloat(receiptData.amountPaid);

    // Calculate financial data for receipt display
    let receiptDisplayData = {
      total_price: amountPaid,
      previous_payments: 0,
      balance: 0,
      show_fechas: false,
      fecha_limite_pago: null,
    };

    if (selectedVenta) {
      const totalPrice = parseFloat(selectedVenta.precio_total);
      const previousPayments = parseFloat(selectedVenta.monto_pagado || 0);
      const newBalance = totalPrice - previousPayments - amountPaid;

      receiptDisplayData = {
        total_price: totalPrice,
        previous_payments: previousPayments,
        balance: newBalance,
        show_fechas: newBalance > 0,
        fecha_limite_pago:
          newBalance > 0 ? selectedVenta.fecha_limite_pago : null,
      };
    }

    // Insert new receipt
    const { data: receipt, error: receiptError } = await supabase
      .from("receipts")
      .insert({
        venta_id: selectedVenta?.id || null,
        receipt_number: receiptData.receiptNumber,
        client_name: receiptData.clientName,
        client_phone: receiptData.clientPhone || null,
        client_email: receiptData.clientEmail || null,
        destination: receiptData.destination,
        travelers: parseInt(receiptData.travelers) || null,
        amount: amountPaid,
        payment_method: receiptData.paymentMethod,
        payment_date: receiptData.paymentDate,
        notes: receiptData.notes || null,
        template_type: receiptData.templateType,
        image_url: imageUrl,
        receipt_stage: "generated",
        created_by: user.id,
        folio_venta: receiptData.folioVenta || null,
        // Store calculated financial data for receipt
        total_price: receiptDisplayData.total_price,
        previous_payments: receiptDisplayData.previous_payments,
        balance: receiptDisplayData.balance,
      })
      .select()
      .single();

    if (receiptError) throw receiptError;

    // If from sale, update venta and create pago
    if (selectedVenta) {
      const currentPagado = parseFloat(selectedVenta.monto_pagado || 0);
      const newMontoPagado = currentPagado + amountPaid;
      const newMontoPendiente =
        parseFloat(selectedVenta.precio_total) - newMontoPagado;

      // Update venta
      const { error: ventaError } = await supabase
        .from("ventas")
        .update({
          monto_pagado: newMontoPagado,
          monto_pendiente: newMontoPendiente,
        })
        .eq("id", selectedVenta.id);

      if (ventaError) throw ventaError;

      // Create pago record
      const { data: existingPagos } = await supabase
        .from("pagos")
        .select("numero_pago")
        .eq("venta_id", selectedVenta.id)
        .order("numero_pago", { ascending: false })
        .limit(1);

      const nextNumero =
        existingPagos?.length > 0 ? existingPagos[0].numero_pago + 1 : 1;

      const { data: pago, error: pagoError } = await supabase
        .from("pagos")
        .insert({
          venta_id: selectedVenta.id,
          numero_pago: nextNumero,
          monto: amountPaid,
          fecha_programada: receiptData.paymentDate,
          fecha_pagado: receiptData.paymentDate,
          estado: "pagado",
          metodo_pago: receiptData.paymentMethod,
          registrado_por: user.id,
          notas: `Recibo ${receiptData.receiptNumber}`,
        })
        .select()
        .single();

      if (pagoError) throw pagoError;

      // Link pago to receipt
      await supabase
        .from("receipts")
        .update({ pago_id: pago.id })
        .eq("id", receipt.id);
    }

    alert("Recibo generado exitosamente");
    navigate("/app/receipts");
  }

  async function handleEditReceipt(imageUrl) {
    const oldAmount = parseFloat(existingReceipt.amount);
    const newAmount = parseFloat(receiptData.amountPaid);
    const amountDifference = newAmount - oldAmount;

    // Calculate financial data for receipt display
    let receiptDisplayData = {
      total_price: newAmount,
      previous_payments: 0,
      balance: 0,
      show_fechas: false,
      fecha_limite_pago: null,
    };

    // If linked to venta, cascade financial updates
    if (existingReceipt.venta_id) {
      // Get current venta balances
      const { data: venta, error: ventaError } = await supabase
        .from("ventas")
        .select(
          "monto_pagado, monto_pendiente, precio_total, fecha_limite_pago"
        )
        .eq("id", existingReceipt.venta_id)
        .single();

      if (ventaError) throw ventaError;

      // Calculate new balances
      const newMontoPagado =
        parseFloat(venta.monto_pagado || 0) + amountDifference;
      const newMontoPendiente = parseFloat(venta.precio_total) - newMontoPagado;

      // Calculate what other receipts paid (excluding this one)
      const previousPayments = newMontoPagado - newAmount;

      receiptDisplayData = {
        total_price: parseFloat(venta.precio_total),
        previous_payments: previousPayments,
        balance: newMontoPendiente,
        show_fechas: newMontoPendiente > 0,
        fecha_limite_pago:
          newMontoPendiente > 0 ? venta.fecha_limite_pago : null,
      };

      // Update venta balances
      const { error: updateVentaError } = await supabase
        .from("ventas")
        .update({
          monto_pagado: newMontoPagado,
          monto_pendiente: newMontoPendiente,
        })
        .eq("id", existingReceipt.venta_id);

      if (updateVentaError) throw updateVentaError;

      // Update linked pago if exists
      if (existingReceipt.pago_id) {
        const { error: pagoError } = await supabase
          .from("pagos")
          .update({
            monto: newAmount,
            fecha_pagado: receiptData.paymentDate,
            metodo_pago: receiptData.paymentMethod,
            notas: `Recibo ${receiptData.receiptNumber} (editado)`,
          })
          .eq("id", existingReceipt.pago_id);

        if (pagoError) throw pagoError;
      }
    }

    // Update receipt with new financial data
    const { error: updateReceiptError } = await supabase
      .from("receipts")
      .update({
        client_name: receiptData.clientName,
        client_phone: receiptData.clientPhone || null,
        client_email: receiptData.clientEmail || null,
        destination: receiptData.destination,
        travelers: parseInt(receiptData.travelers) || null,
        amount: newAmount,
        payment_method: receiptData.paymentMethod,
        payment_date: receiptData.paymentDate,
        notes: receiptData.notes || null,
        template_type: receiptData.templateType,
        image_url: imageUrl,
        // Update calculated financial data for receipt
        total_price: receiptDisplayData.total_price,
        previous_payments: receiptDisplayData.previous_payments,
        balance: receiptDisplayData.balance,
      })
      .eq("id", receiptId);

    if (updateReceiptError) throw updateReceiptError;

    alert("Recibo actualizado y finanzas sincronizadas");
    navigate("/app/receipts");
  }

  if (loading && step === 1) {
    return <div className="p-8">Cargando...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() =>
              step === 1 ? navigate("/app/receipts") : setStep(1)
            }
            className="flex items-center gap-2 text-primary hover:text-primary/80 mb-4"
          >
            <ArrowLeft size={20} />
            {step === 1 ? "Volver a Recibos" : "Volver a Selección"}
          </button>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <FileText size={32} />
            {editMode ? "Editar Recibo" : "Nuevo Recibo"}
          </h1>
        </div>

        {/* Step 1: Mode Selection */}
        {step === 1 && !editMode && (
          <div className="space-y-4">
            <div
              onClick={() => {
                setMode("from-sale");
                fetchSales();
              }}
              className="bg-white rounded-lg shadow-lg p-6 cursor-pointer hover:shadow-xl transition-shadow border-2 border-transparent hover:border-primary"
            >
              <h3 className="text-xl font-bold mb-2">Desde una Venta</h3>
              <p className="text-gray-600">
                Generar recibo para una venta existente
              </p>
            </div>

            <div
              onClick={async () => {
                setMode("standalone");
                const receiptNum = await generateNextReceiptNumber();
                setReceiptData({
                  ...receiptData,
                  receiptNumber: receiptNum,
                });
                setStep(2);
              }}
              className="bg-white rounded-lg shadow-lg p-6 cursor-pointer hover:shadow-xl transition-shadow border-2 border-transparent hover:border-primary"
            >
              <h3 className="text-xl font-bold mb-2">Recibo Independiente</h3>
              <p className="text-gray-600">
                Crear recibo sin vincular a una venta
              </p>
            </div>
          </div>
        )}

        {/* Sale Selection (if from-sale mode and not edit) */}
        {step === 1 && mode === "from-sale" && !editMode && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold mb-4">Selecciona una Venta</h2>

            {/* Search */}
            <div className="mb-4">
              <input
                type="text"
                placeholder="Buscar por folio, cliente o destino..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary"
              />
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto">
              {ventas
                .filter((v) => {
                  const term = searchTerm.toLowerCase();
                  return (
                    v.folio_venta?.toLowerCase().includes(term) ||
                    v.cotizaciones?.cliente_nombre
                      ?.toLowerCase()
                      .includes(term) ||
                    v.cotizaciones?.destino?.toLowerCase().includes(term)
                  );
                })
                .map((venta) => (
                  <div
                    key={venta.id}
                    onClick={() => handleVentaSelect(venta)}
                    className="p-4 border-2 rounded-lg cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-bold text-lg">{venta.folio_venta}</p>
                        <p className="text-gray-700">
                          {venta.cotizaciones.cliente_nombre}
                        </p>
                        <p className="text-sm text-gray-600">
                          {venta.cotizaciones.destino} •{" "}
                          {venta.cotizaciones.num_adultos +
                            venta.cotizaciones.num_ninos}{" "}
                          viajeros
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-green-600">
                          $
                          {parseFloat(venta.precio_total).toLocaleString(
                            "es-MX"
                          )}
                        </p>
                        <p className="text-sm text-gray-600">
                          Pagado: $
                          {parseFloat(venta.monto_pagado || 0).toLocaleString(
                            "es-MX"
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Step 2: Receipt Form */}
        {step === 2 && (
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-2xl mx-auto">
            <h2 className="text-xl font-bold mb-4">Datos del Recibo</h2>

            {selectedVenta && (
              <div className="bg-blue-50 rounded-lg p-3 mb-4 text-sm">
                <p className="font-semibold text-gray-900">
                  Venta: {selectedVenta.folio_venta}
                </p>
                <p className="text-gray-600">
                  Total: $
                  {parseFloat(selectedVenta.precio_total).toLocaleString(
                    "es-MX"
                  )}{" "}
                  • Pagado: $
                  {parseFloat(selectedVenta.monto_pagado || 0).toLocaleString(
                    "es-MX"
                  )}
                </p>
              </div>
            )}

            <form className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Número de Recibo *
                  </label>
                  <input
                    type="text"
                    value={receiptData.receiptNumber}
                    onChange={(e) =>
                      setReceiptData({
                        ...receiptData,
                        receiptNumber: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary text-sm"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Tipo de Template
                  </label>
                  <select
                    value={receiptData.templateType}
                    onChange={(e) =>
                      setReceiptData({
                        ...receiptData,
                        templateType: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary text-sm"
                  >
                    <option value="professional">Profesional</option>
                    <option value="informal">Informal</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Cliente *
                </label>
                <input
                  type="text"
                  value={receiptData.clientName}
                  onChange={(e) =>
                    setReceiptData({
                      ...receiptData,
                      clientName: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary text-sm"
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Teléfono
                  </label>
                  <input
                    type="tel"
                    value={receiptData.clientPhone}
                    onChange={(e) =>
                      setReceiptData({
                        ...receiptData,
                        clientPhone: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary text-sm"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={receiptData.clientEmail}
                    onChange={(e) =>
                      setReceiptData({
                        ...receiptData,
                        clientEmail: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Destino *
                  </label>
                  <input
                    type="text"
                    value={receiptData.destination}
                    onChange={(e) =>
                      setReceiptData({
                        ...receiptData,
                        destination: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Viajeros
                  </label>
                  <input
                    type="number"
                    value={receiptData.travelers}
                    onChange={(e) =>
                      setReceiptData({
                        ...receiptData,
                        travelers: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Monto *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={receiptData.amountPaid}
                    onChange={(e) =>
                      setReceiptData({
                        ...receiptData,
                        amountPaid: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Método *
                  </label>
                  <select
                    value={receiptData.paymentMethod}
                    onChange={(e) =>
                      setReceiptData({
                        ...receiptData,
                        paymentMethod: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary text-sm"
                  >
                    <option value="Efectivo">Efectivo</option>
                    <option value="Transferencia">Transferencia</option>
                    <option value="Tarjeta">Tarjeta</option>
                    <option value="Cheque">Cheque</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Fecha *
                  </label>
                  <input
                    type="date"
                    value={receiptData.paymentDate}
                    onChange={(e) =>
                      setReceiptData({
                        ...receiptData,
                        paymentDate: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary text-sm"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Notas</label>
                <textarea
                  value={receiptData.notes}
                  onChange={(e) =>
                    setReceiptData({ ...receiptData, notes: e.target.value })
                  }
                  rows={3}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary text-sm"
                />
              </div>

              <div className="pt-4">
                <button
                  type="button"
                  onClick={async () => {
                    if (
                      !receiptData.clientName ||
                      !receiptData.amountPaid ||
                      !receiptData.destination
                    ) {
                      alert("Completa todos los campos requeridos");
                      return;
                    }

                    // Check for overpayment if linked to sale
                    if (selectedVenta) {
                      const amountPaid = parseFloat(
                        receiptData.amountPaid || 0
                      );
                      const totalPrice = parseFloat(selectedVenta.precio_total);
                      const previousPayments = parseFloat(
                        selectedVenta.monto_pagado || 0
                      );
                      const remainingBalance = totalPrice - previousPayments;

                      if (amountPaid > remainingBalance) {
                        const overpayment = amountPaid - remainingBalance;
                        const confirmed = confirm(
                          `⚠️ SOBREPAGO DETECTADO\n\n` +
                            `Saldo pendiente: $${remainingBalance.toLocaleString("es-MX")}\n` +
                            `Monto a pagar: $${amountPaid.toLocaleString("es-MX")}\n` +
                            `Sobrepago: $${overpayment.toLocaleString("es-MX")}\n\n` +
                            `¿Estás seguro de continuar con este pago?`
                        );

                        if (!confirmed) {
                          return;
                        }
                      }
                    }

                    setLoading(true);
                    try {
                      // Create hidden div for receipt rendering
                      const { default: html2canvas } =
                        await import("html2canvas");
                      const ProfessionalReceipt = (
                        await import("../components/receipts/ProfessionalReceipt")
                      ).default;
                      const InformalReceipt = (
                        await import("../components/receipts/InformalReceipt")
                      ).default;
                      const { createElement } = await import("react");
                      const { createRoot } = await import("react-dom/client");

                      const tempDiv = document.createElement("div");
                      tempDiv.style.position = "absolute";
                      tempDiv.style.left = "-9999px";
                      tempDiv.style.top = "0";
                      document.body.appendChild(tempDiv);

                      const amountPaid = parseFloat(
                        receiptData.amountPaid || 0
                      );

                      // Calculate financial data
                      let totalPrice = amountPaid;
                      let previousPayments = 0;
                      let balance = 0;
                      let showFechas = false;
                      let fechaLimitePago = null;

                      if (selectedVenta) {
                        totalPrice = parseFloat(selectedVenta.precio_total);
                        previousPayments = parseFloat(
                          selectedVenta.monto_pagado || 0
                        );
                        balance = totalPrice - previousPayments - amountPaid;
                        showFechas = balance > 0;
                        fechaLimitePago =
                          balance > 0 ? selectedVenta.fecha_limite_pago : null;
                      }

                      const formattedData = {
                        receipt_number: receiptData.receiptNumber,
                        amount: amountPaid,
                        payment_date: receiptData.paymentDate,
                        payment_method: receiptData.paymentMethod,
                        client_name: receiptData.clientName,
                        destination: receiptData.destination,
                        travelers: receiptData.travelers
                          ? parseInt(receiptData.travelers)
                          : null,
                        custom_text:
                          receiptData.notes ||
                          `Pago recibido por concepto de viaje a ${receiptData.destination}.`,
                        folio_venta: receiptData.folioVenta || "",
                        total_price: totalPrice,
                        previous_payments: previousPayments,
                        balance: balance,
                        show_fechas: showFechas,
                        fecha_limite_pago: fechaLimitePago,
                        show_reserva_info: true,
                        fecha_viaje: selectedVenta?.fecha_viaje || null,
                        destino: receiptData.destination,
                      };

                      const ReceiptComponent =
                        receiptData.templateType === "professional"
                          ? ProfessionalReceipt
                          : InformalReceipt;

                      const root = createRoot(tempDiv);
                      root.render(
                        createElement(ReceiptComponent, { data: formattedData })
                      );

                      setTimeout(async () => {
                        const canvas = await html2canvas(tempDiv.firstChild, {
                          scale: 2,
                          backgroundColor: "#ffffff",
                        });

                        canvas.toBlob((blob) => {
                          document.body.removeChild(tempDiv);
                          if (blob) {
                            handleGenerateReceipt(blob);
                          } else {
                            setLoading(false);
                            alert("Error al generar imagen");
                          }
                        }, "image/png");
                      }, 500);
                    } catch (error) {
                      setLoading(false);
                      console.error("Error:", error);
                      alert("Error al generar recibo: " + error.message);
                    }
                  }}
                  disabled={loading}
                  className="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 font-medium"
                >
                  {loading
                    ? "Generando..."
                    : editMode
                      ? "Actualizar Recibo"
                      : "Generar Recibo"}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
