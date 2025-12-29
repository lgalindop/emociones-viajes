import { useState, useEffect, useRef } from "react";
import { supabase } from "../lib/supabase";
import { ArrowLeft, Plus, Trash2, Check, X } from "lucide-react";
import LeadOriginIcon from "../components/LeadOriginIcon";

export default function NuevaCotizacion({ onBack, onSuccess }) {
  const [step, setStep] = useState(1);
  const [operadores, setOperadores] = useState([]);
  const [formData, setFormData] = useState({
    cliente_nombre: "",
    cliente_telefono: "",
    cliente_email: "",
    origen_lead: "whatsapp",
    destino: "",
    fecha_salida: "",
    fecha_regreso: "",
    num_adultos: 2,
    num_ninos: 0,
    num_infantes: 0,
    presupuesto_aprox: "",
    requerimientos: "",
    notas: "",
    divisa: "MXN",
    fecha_registro: new Date().toISOString().split("T")[0],
    fecha_reserva: "",
    vigente_hasta: "",
    disclaimer_green:
      "TODOS LOS HOTELES EN QUINTANA ROO, COBRAN UN IMPUESTO DE SANEAMIENTO AMBIENTAL, QUE DEBE DE PAGARSE EN DESTINO",
    disclaimer_blue: "POR PROXIMIDAD SE PAGA AL RESERVAR.",
  });
  const [opciones, setOpciones] = useState([]);
  const [currentOpcion, setCurrentOpcion] = useState({
    operador_id: "",
    nombre_paquete: "",
    servicio_descripcion: "",
    hotel_nombre: "",
    ocupacion: "",
    vuelo_ida_fecha: "",
    vuelo_ida_horario: "",
    vuelo_ida_ruta: "",
    vuelo_ida_directo: false,
    vuelo_regreso_fecha: "",
    vuelo_regreso_horario: "",
    vuelo_regreso_ruta: "",
    vuelo_regreso_directo: false,
    precio_adulto: "",
    precio_menor: "",
    precio_infante: "",
    precio_total: "",
    incluye: [],
    no_incluye: [],
    disponibilidad: "",
    notas: "",
    link_paquete: "",
    tour_link: "",
  });
  const [incluye, setIncluye] = useState("");
  const [noIncluye, setNoIncluye] = useState("");

  // Customer search states
  const [customerSearch, setCustomerSearch] = useState("");
  const [customerMatches, setCustomerMatches] = useState([]);
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const customerDropdownRef = useRef(null);

  const leadOrigins = [
    { value: "whatsapp", label: "WhatsApp" },
    { value: "instagram", label: "Instagram" },
    { value: "facebook", label: "Facebook" },
    { value: "referido", label: "Referido" },
    { value: "web", label: "Web" },
    { value: "otro", label: "Otro" },
  ];

  const requerimientosSuggestions = [
    "Vista al mar",
    "Camas separadas",
    "Cama king",
    "Piso alto",
    "Cuna para bebé",
    "Acceso para silla de ruedas",
    "Habitación contigua",
    "Check-in temprano",
    "Check-out tardío",
    "Todo incluido",
    "Solo hospedaje",
    "Wifi incluido",
  ];

  useEffect(() => {
    fetchOperadores();
  }, []);

  // Click outside handler for customer dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (
        customerDropdownRef.current &&
        !customerDropdownRef.current.contains(event.target)
      ) {
        setShowCustomerDropdown(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function fetchOperadores() {
    const { data } = await supabase
      .from("operadores")
      .select("*")
      .order("nombre");
    setOperadores(data || []);
  }

  function handlePriceChange(field, value) {
    const numValue = parseFloat(value) || 0;
    const updates = { [field]: value };

    if (
      field === "precio_adulto" ||
      field === "precio_menor" ||
      field === "precio_infante"
    ) {
      const adultos =
        field === "precio_adulto"
          ? numValue
          : parseFloat(currentOpcion.precio_adulto) || 0;
      const menores =
        field === "precio_menor"
          ? numValue
          : parseFloat(currentOpcion.precio_menor) || 0;
      const infantes =
        field === "precio_infante"
          ? numValue
          : parseFloat(currentOpcion.precio_infante) || 0;

      const totalAdultos = adultos * (formData.num_adultos || 0);
      const totalMenores = menores * (formData.num_ninos || 0);
      const totalInfantes = infantes * (formData.num_infantes || 0);

      updates.precio_total = (
        totalAdultos +
        totalMenores +
        totalInfantes
      ).toFixed(2);
    }

    setCurrentOpcion({ ...currentOpcion, ...updates });
  }

  function addIncluye() {
    if (incluye.trim()) {
      setCurrentOpcion({
        ...currentOpcion,
        incluye: [...currentOpcion.incluye, incluye.trim()],
      });
      setIncluye("");
    }
  }

  function removeIncluye(index) {
    setCurrentOpcion({
      ...currentOpcion,
      incluye: currentOpcion.incluye.filter((_, i) => i !== index),
    });
  }

  function addNoIncluye() {
    if (noIncluye.trim()) {
      setCurrentOpcion({
        ...currentOpcion,
        no_incluye: [...currentOpcion.no_incluye, noIncluye.trim()],
      });
      setNoIncluye("");
    }
  }

  function removeNoIncluye(index) {
    setCurrentOpcion({
      ...currentOpcion,
      no_incluye: currentOpcion.no_incluye.filter((_, i) => i !== index),
    });
  }

  function handleAddOpcion() {
    if (!currentOpcion.operador_id || !currentOpcion.precio_total) {
      alert("Completa los campos obligatorios");
      return;
    }
    setOpciones([...opciones, { ...currentOpcion, id: Date.now() }]);
    setCurrentOpcion({
      operador_id: "",
      nombre_paquete: "",
      servicio_descripcion: "",
      hotel_nombre: "",
      ocupacion: "",
      vuelo_ida_fecha: "",
      vuelo_ida_horario: "",
      vuelo_ida_ruta: "",
      vuelo_ida_directo: false,
      vuelo_regreso_fecha: "",
      vuelo_regreso_horario: "",
      vuelo_regreso_ruta: "",
      vuelo_regreso_directo: false,
      precio_adulto: "",
      precio_menor: "",
      precio_infante: "",
      precio_total: "",
      incluye: [],
      no_incluye: [],
      disponibilidad: "",
      notas: "",
      link_paquete: "",
      tour_link: "",
    });
    setIncluye("");
    setNoIncluye("");
  }

  function removeOpcion(id) {
    setOpciones(opciones.filter((op) => op.id !== id));
  }

  async function handleSubmit() {
    if (!formData.cliente_nombre || !formData.destino) {
      alert("Completa los campos obligatorios");
      return;
    }

    try {
      const folio = `COT-${Date.now()}`;

      const { data: cotizacion, error: cotError } = await supabase
        .from("cotizaciones")
        .insert({
          folio,
          cliente_nombre: formData.cliente_nombre,
          cliente_telefono: formData.cliente_telefono,
          cliente_email: formData.cliente_email,
          origen_lead: formData.origen_lead,
          destino: formData.destino,
          fecha_salida: formData.fecha_salida,
          fecha_regreso: formData.fecha_regreso,
          num_adultos: formData.num_adultos,
          num_ninos: formData.num_ninos,
          num_infantes: formData.num_infantes,
          presupuesto_aprox: formData.presupuesto_aprox,
          requerimientos: formData.requerimientos,
          notas: formData.notas,
          divisa: formData.divisa,
          fecha_registro: formData.fecha_registro,
          fecha_reserva: formData.fecha_reserva,
          vigente_hasta: formData.vigente_hasta,
          disclaimer_green: formData.disclaimer_green,
          disclaimer_blue: formData.disclaimer_blue,
        })
        .select()
        .single();

      if (cotError) throw cotError;

      if (opciones.length > 0) {
        const opcionesData = opciones.map((op) => ({
          cotizacion_id: cotizacion.id,
          operador_id: op.operador_id,
          nombre_paquete: op.nombre_paquete,
          servicio_descripcion: op.servicio_descripcion,
          hotel_nombre: op.hotel_nombre,
          ocupacion: op.ocupacion,
          vuelo_ida_fecha: op.vuelo_ida_fecha || null,
          vuelo_ida_horario: op.vuelo_ida_horario,
          vuelo_ida_ruta: op.vuelo_ida_ruta,
          vuelo_ida_directo: op.vuelo_ida_directo,
          vuelo_regreso_fecha: op.vuelo_regreso_fecha || null,
          vuelo_regreso_horario: op.vuelo_regreso_horario,
          vuelo_regreso_ruta: op.vuelo_regreso_ruta,
          vuelo_regreso_directo: op.vuelo_regreso_directo,
          precio_adulto: op.precio_adulto === "" ? null : op.precio_adulto,
          precio_menor: op.precio_menor === "" ? null : op.precio_menor,
          precio_infante: op.precio_infante === "" ? null : op.precio_infante,
          precio_total: op.precio_total === "" ? null : op.precio_total,
          incluye: op.incluye,
          no_incluye: op.no_incluye,
          disponibilidad: op.disponibilidad,
          notas: op.notas,
          link_paquete: op.link_paquete,
          tour_link: op.tour_link,
        }));

        const { error: opError } = await supabase
          .from("opciones_cotizacion")
          .insert(opcionesData);

        if (opError) throw opError;
      }

      onSuccess?.();
    } catch (error) {
      console.error("Error:", error);
      console.error("Error details:", error.message, error.details, error.hint);
      alert(
        "Error al crear la cotización: " +
          (error.message || JSON.stringify(error))
      );
    }
  }

  // Customer search functions
  async function searchCustomers(query) {
    if (!query || query.length < 2) {
      setCustomerMatches([]);
      setShowCustomerDropdown(false);
      return;
    }

    const { data } = await supabase
      .from("cotizaciones")
      .select("cliente_nombre, cliente_telefono, cliente_email")
      .ilike("cliente_nombre", `%${query}%`)
      .order("created_at", { ascending: false })
      .limit(5);

    if (data && data.length > 0) {
      const unique = data.reduce((acc, curr) => {
        const key = curr.cliente_nombre.toLowerCase();
        if (!acc.find((item) => item.cliente_nombre.toLowerCase() === key)) {
          acc.push(curr);
        }
        return acc;
      }, []);
      setCustomerMatches(unique);
      setShowCustomerDropdown(true);
    } else {
      setCustomerMatches([]);
      setShowCustomerDropdown(false);
    }
  }

  function selectCustomer(customer) {
    setFormData({
      ...formData,
      cliente_nombre: customer.cliente_nombre,
      cliente_telefono: customer.cliente_telefono || "",
      cliente_email: customer.cliente_email || "",
    });
    setCustomerSearch(customer.cliente_nombre);
    setShowCustomerDropdown(false);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft size={20} />
            <span className="font-medium">Volver</span>
          </button>
          <div className="text-sm text-gray-600 font-medium">
            Paso {step} de 3
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span
              className={`text-sm font-semibold ${
                step >= 1 ? "text-primary" : "text-gray-400"
              }`}
            >
              Información del Cliente
            </span>
            <span
              className={`text-sm font-semibold ${
                step >= 2 ? "text-primary" : "text-gray-400"
              }`}
            >
              Detalles del Viaje
            </span>
            <span
              className={`text-sm font-semibold ${
                step >= 3 ? "text-primary" : "text-gray-400"
              }`}
            >
              Opciones de Paquetes
            </span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${(step / 3) * 100}%` }}
            />
          </div>
        </div>

        {/* Step 1: Client Info */}
        {step === 1 && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold mb-6 text-gray-800">
              Información del Cliente
            </h2>
            <div className="space-y-6">
              <div className="relative" ref={customerDropdownRef}>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Nombre Completo del Cliente *
                </label>
                <input
                  type="text"
                  value={customerSearch || formData.cliente_nombre}
                  onChange={(e) => {
                    const value = e.target.value;
                    setCustomerSearch(value);
                    setFormData({ ...formData, cliente_nombre: value });
                    searchCustomers(value);
                  }}
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                  placeholder="Buscar cliente existente o ingresar nuevo"
                />

                {showCustomerDropdown && customerMatches.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border-2 border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    {customerMatches.map((customer, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => selectCustomer(customer)}
                        className="w-full text-left px-4 py-3 hover:bg-blue-50 border-b border-gray-100 last:border-b-0 transition-colors"
                      >
                        <div className="font-semibold text-gray-800">
                          {customer.cliente_nombre}
                        </div>
                        {customer.cliente_telefono && (
                          <div className="text-sm text-gray-600">
                            {customer.cliente_telefono}
                          </div>
                        )}
                        {customer.cliente_email && (
                          <div className="text-sm text-gray-600">
                            {customer.cliente_email}
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Teléfono
                  </label>
                  <input
                    type="tel"
                    value={formData.cliente_telefono}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        cliente_telefono: e.target.value,
                      })
                    }
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.cliente_email}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        cliente_email: e.target.value,
                      })
                    }
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Origen del Lead
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {leadOrigins.map((origin) => (
                    <button
                      key={origin.value}
                      type="button"
                      onClick={() =>
                        setFormData({ ...formData, origen_lead: origin.value })
                      }
                      className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 transition-all ${
                        formData.origen_lead === origin.value
                          ? "border-primary bg-primary/10 text-primary font-semibold"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <LeadOriginIcon origen={origin.value} size={20} />
                      {origin.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end mt-6">
              <button
                onClick={() => setStep(2)}
                disabled={!formData.cliente_nombre}
                className="px-6 py-3 bg-primary text-white rounded-xl hover:bg-primary/90 disabled:bg-gray-300 disabled:cursor-not-allowed font-semibold transition-all"
              >
                Siguiente
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Trip Details */}
        {step === 2 && (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="space-y-6">
              {/* Cotización Dates - NEW FIELDS */}
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <label className="block text-sm font-semibold text-blue-900 mb-3">
                  Fechas de Cotización
                </label>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">
                      Fecha Registro
                    </label>
                    <input
                      type="date"
                      value={formData.fecha_registro}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          fecha_registro: e.target.value,
                        })
                      }
                      className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">
                      Fecha Reserva
                    </label>
                    <input
                      type="date"
                      value={formData.fecha_reserva}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          fecha_reserva: e.target.value,
                        })
                      }
                      className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">
                      Vigente Hasta
                    </label>
                    <input
                      type="date"
                      value={formData.vigente_hasta}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          vigente_hasta: e.target.value,
                        })
                      }
                      className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Destino *
                </label>
                <input
                  type="text"
                  value={formData.destino}
                  onChange={(e) =>
                    setFormData({ ...formData, destino: e.target.value })
                  }
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                  placeholder="Ej: Cancún, Playa del Carmen"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Fecha de Salida
                  </label>
                  <input
                    type="date"
                    value={formData.fecha_salida}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        fecha_salida: e.target.value,
                      })
                    }
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Fecha de Regreso
                  </label>
                  <input
                    type="date"
                    value={formData.fecha_regreso}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        fecha_regreso: e.target.value,
                      })
                    }
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Número de Adultos
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.num_adultos}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        num_adultos: parseInt(e.target.value) || 0,
                      })
                    }
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Número de Niños
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.num_ninos}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        num_ninos: parseInt(e.target.value) || 0,
                      })
                    }
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Número de Infantes
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.num_infantes}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        num_infantes: parseInt(e.target.value) || 0,
                      })
                    }
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Presupuesto Aproximado
                </label>
                <input
                  type="number"
                  value={formData.presupuesto_aprox}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      presupuesto_aprox: e.target.value,
                    })
                  }
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                  placeholder="$"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Requerimientos Especiales
                </label>
                <textarea
                  value={formData.requerimientos}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      requerimientos: e.target.value,
                    })
                  }
                  rows="3"
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                  placeholder="Cualquier requerimiento especial..."
                />
                <div className="flex flex-wrap gap-2 mt-2">
                  {requerimientosSuggestions.map((req) => (
                    <button
                      key={req}
                      type="button"
                      onClick={() => {
                        const current = formData.requerimientos;
                        const newReq = current ? `${current}, ${req}` : req;
                        setFormData({
                          ...formData,
                          requerimientos: newReq,
                        });
                      }}
                      className="text-xs px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-full transition-all"
                    >
                      + {req}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Notas
                </label>
                <textarea
                  value={formData.notas}
                  onChange={(e) =>
                    setFormData({ ...formData, notas: e.target.value })
                  }
                  rows="3"
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                  placeholder="Notas internas..."
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Divisa
                </label>
                <select
                  value={formData.divisa}
                  onChange={(e) =>
                    setFormData({ ...formData, divisa: e.target.value })
                  }
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                >
                  <option value="MXN">MXN</option>
                  <option value="USD">USD</option>
                </select>
              </div>
            </div>

            <div className="flex justify-between mt-6">
              <button
                onClick={() => setStep(1)}
                className="px-6 py-3 border-2 border-gray-300 rounded-xl hover:bg-gray-50 font-semibold transition-all"
              >
                Anterior
              </button>
              <button
                onClick={() => setStep(3)}
                disabled={!formData.destino}
                className="px-6 py-3 bg-primary text-white rounded-xl hover:bg-primary/90 disabled:bg-gray-300 disabled:cursor-not-allowed font-semibold transition-all"
              >
                Siguiente
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Package Options */}
        {step === 3 && (
          <div className="space-y-6">
            {/* Disclaimers Section */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-bold mb-4 text-gray-800">
                Avisos y Disclaimers para PDF
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-green-700 mb-2">
                    Aviso Verde (opcional)
                  </label>
                  <textarea
                    value={formData.disclaimer_green}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        disclaimer_green: e.target.value,
                      })
                    }
                    rows="2"
                    className="w-full border-2 border-green-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                    placeholder="Deja en blanco si no deseas incluir este aviso"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-blue-700 mb-2">
                    Aviso Azul (opcional)
                  </label>
                  <textarea
                    value={formData.disclaimer_blue}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        disclaimer_blue: e.target.value,
                      })
                    }
                    rows="2"
                    className="w-full border-2 border-blue-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    placeholder="Deja en blanco si no deseas incluir este aviso"
                  />
                </div>

                <div className="bg-red-50 p-3 rounded-lg border border-red-200">
                  <p className="text-sm text-red-700 font-semibold italic">
                    Nota: El aviso rojo "LOS PRECIOS ESTÁN SUJETOS A CAMBIO SIN
                    PREVIO AVISO" siempre aparecerá al final del PDF
                  </p>
                </div>
              </div>
            </div>

            {/* Added Options */}
            {opciones.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-bold mb-4 text-gray-800">
                  Opciones Agregadas ({opciones.length})
                </h3>
                <div className="space-y-3">
                  {opciones.map((opcion) => (
                    <div
                      key={opcion.id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200"
                    >
                      <div className="flex-1">
                        <div className="font-semibold text-gray-800">
                          {opcion.nombre_paquete || "Sin nombre"}
                        </div>
                        <div className="text-sm text-gray-600">
                          {operadores.find((op) => op.id === opcion.operador_id)
                            ?.nombre || "Operador"}{" "}
                          - ${parseFloat(opcion.precio_total).toLocaleString()}
                        </div>
                      </div>
                      <button
                        onClick={() => removeOpcion(opcion.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Add New Option Form */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-bold mb-4 text-gray-800">
                {opciones.length === 0
                  ? "Agregar Primera Opción"
                  : "Agregar Otra Opción"}
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Operador *
                  </label>
                  <select
                    value={currentOpcion.operador_id}
                    onChange={(e) =>
                      setCurrentOpcion({
                        ...currentOpcion,
                        operador_id: e.target.value,
                      })
                    }
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                  >
                    <option value="">Selecciona un operador</option>
                    {operadores.map((op) => (
                      <option key={op.id} value={op.id}>
                        {op.nombre}
                      </option>
                    ))}
                    <option value="otro">Otro</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Nombre del Paquete
                  </label>
                  <input
                    type="text"
                    value={currentOpcion.nombre_paquete}
                    onChange={(e) =>
                      setCurrentOpcion({
                        ...currentOpcion,
                        nombre_paquete: e.target.value,
                      })
                    }
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                    placeholder="Ej: Todo Incluido - Hotel Riu Cancún"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Descripción del Servicio
                  </label>
                  <textarea
                    value={currentOpcion.servicio_descripcion}
                    onChange={(e) =>
                      setCurrentOpcion({
                        ...currentOpcion,
                        servicio_descripcion: e.target.value,
                      })
                    }
                    rows="3"
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                    placeholder="Detalla el servicio completo..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Nombre del Hotel
                    </label>
                    <input
                      type="text"
                      value={currentOpcion.hotel_nombre}
                      onChange={(e) =>
                        setCurrentOpcion({
                          ...currentOpcion,
                          hotel_nombre: e.target.value,
                        })
                      }
                      className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                      placeholder="Ej: Hotel Riu Cancún"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Ocupación
                    </label>
                    <input
                      type="text"
                      value={currentOpcion.ocupacion}
                      onChange={(e) =>
                        setCurrentOpcion({
                          ...currentOpcion,
                          ocupacion: e.target.value,
                        })
                      }
                      className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                      placeholder="Ej: Doble, Sencilla"
                    />
                  </div>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <div className="flex items-center justify-between mb-3">
                    <label className="block text-sm font-semibold text-blue-900">
                      ✈️ Vuelo de Ida
                    </label>
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={currentOpcion.vuelo_ida_directo || false}
                        onChange={(e) =>
                          setCurrentOpcion({
                            ...currentOpcion,
                            vuelo_ida_directo: e.target.checked,
                          })
                        }
                        className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                      />
                      <span className="text-gray-700">Vuelo Directo</span>
                    </label>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">
                        Fecha
                      </label>
                      <input
                        type="date"
                        value={currentOpcion.vuelo_ida_fecha}
                        onChange={(e) =>
                          setCurrentOpcion({
                            ...currentOpcion,
                            vuelo_ida_fecha: e.target.value,
                          })
                        }
                        className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">
                        Horario
                      </label>
                      <input
                        type="text"
                        value={currentOpcion.vuelo_ida_horario}
                        onChange={(e) =>
                          setCurrentOpcion({
                            ...currentOpcion,
                            vuelo_ida_horario: e.target.value,
                          })
                        }
                        className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                        placeholder="08:00 - 10:15"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">
                        Ruta
                      </label>
                      <input
                        type="text"
                        value={currentOpcion.vuelo_ida_ruta}
                        onChange={(e) =>
                          setCurrentOpcion({
                            ...currentOpcion,
                            vuelo_ida_ruta: e.target.value,
                          })
                        }
                        className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                        placeholder="CUU-CUN"
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <div className="flex items-center justify-between mb-3">
                    <label className="block text-sm font-semibold text-blue-900">
                      ✈️ Vuelo de Regreso
                    </label>
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={currentOpcion.vuelo_regreso_directo || false}
                        onChange={(e) =>
                          setCurrentOpcion({
                            ...currentOpcion,
                            vuelo_regreso_directo: e.target.checked,
                          })
                        }
                        className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                      />
                      <span className="text-gray-700">Vuelo Directo</span>
                    </label>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">
                        Fecha
                      </label>
                      <input
                        type="date"
                        value={currentOpcion.vuelo_regreso_fecha}
                        onChange={(e) =>
                          setCurrentOpcion({
                            ...currentOpcion,
                            vuelo_regreso_fecha: e.target.value,
                          })
                        }
                        className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">
                        Horario
                      </label>
                      <input
                        type="text"
                        value={currentOpcion.vuelo_regreso_horario}
                        onChange={(e) =>
                          setCurrentOpcion({
                            ...currentOpcion,
                            vuelo_regreso_horario: e.target.value,
                          })
                        }
                        className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                        placeholder="13:25 - 15:40"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">
                        Ruta
                      </label>
                      <input
                        type="text"
                        value={currentOpcion.vuelo_regreso_ruta}
                        onChange={(e) =>
                          setCurrentOpcion({
                            ...currentOpcion,
                            vuelo_regreso_ruta: e.target.value,
                          })
                        }
                        className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                        placeholder="CUN-CUU"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Precio por Adulto
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={currentOpcion.precio_adulto}
                      onChange={(e) =>
                        handlePriceChange("precio_adulto", e.target.value)
                      }
                      className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Precio por Menor
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={currentOpcion.precio_menor}
                      onChange={(e) =>
                        handlePriceChange("precio_menor", e.target.value)
                      }
                      className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Precio por Infante
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={currentOpcion.precio_infante}
                      onChange={(e) =>
                        handlePriceChange("precio_infante", e.target.value)
                      }
                      className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Precio Total * (editable)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={currentOpcion.precio_total}
                    onChange={(e) =>
                      setCurrentOpcion({
                        ...currentOpcion,
                        precio_total: e.target.value,
                      })
                    }
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Incluye
                  </label>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={incluye}
                      onChange={(e) => setIncluye(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && addIncluye()}
                      className="flex-1 border-2 border-gray-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                      placeholder="Presiona Enter para agregar"
                    />
                    <button
                      type="button"
                      onClick={addIncluye}
                      className="px-4 py-2 bg-primary text-white rounded-xl hover:bg-primary/90"
                    >
                      <Plus size={20} />
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {currentOpcion.incluye.map((item, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm"
                      >
                        {item}
                        <button
                          type="button"
                          onClick={() => removeIncluye(index)}
                          className="hover:bg-green-200 rounded-full p-0.5"
                        >
                          <X size={14} />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    No Incluye
                  </label>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={noIncluye}
                      onChange={(e) => setNoIncluye(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && addNoIncluye()}
                      className="flex-1 border-2 border-gray-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                      placeholder="Presiona Enter para agregar"
                    />
                    <button
                      type="button"
                      onClick={addNoIncluye}
                      className="px-4 py-2 bg-primary text-white rounded-xl hover:bg-primary/90"
                    >
                      <Plus size={20} />
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {currentOpcion.no_incluye.map((item, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm"
                      >
                        {item}
                        <button
                          type="button"
                          onClick={() => removeNoIncluye(index)}
                          className="hover:bg-red-200 rounded-full p-0.5"
                        >
                          <X size={14} />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Link del Paquete
                    </label>
                    <input
                      type="url"
                      value={currentOpcion.link_paquete}
                      onChange={(e) =>
                        setCurrentOpcion({
                          ...currentOpcion,
                          link_paquete: e.target.value,
                        })
                      }
                      className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                      placeholder="https://..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Link de Tours
                    </label>
                    <input
                      type="url"
                      value={currentOpcion.tour_link}
                      onChange={(e) =>
                        setCurrentOpcion({
                          ...currentOpcion,
                          tour_link: e.target.value,
                        })
                      }
                      className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                      placeholder="https://..."
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Disponibilidad
                  </label>
                  <input
                    type="text"
                    value={currentOpcion.disponibilidad}
                    onChange={(e) =>
                      setCurrentOpcion({
                        ...currentOpcion,
                        disponibilidad: e.target.value,
                      })
                    }
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                    placeholder="Ej: Disponible hasta fin de mes"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Notas
                  </label>
                  <textarea
                    value={currentOpcion.notas}
                    onChange={(e) =>
                      setCurrentOpcion({
                        ...currentOpcion,
                        notas: e.target.value,
                      })
                    }
                    rows="2"
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleAddOpcion}
                  className="w-full px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 font-semibold transition-all"
                >
                  Agregar Opción
                </button>
              </div>
            </div>

            {/* Navigation */}
            <div className="flex justify-between">
              <button
                onClick={() => setStep(2)}
                className="px-6 py-3 border-2 border-gray-300 rounded-xl hover:bg-gray-50 font-semibold transition-all"
              >
                Anterior
              </button>
              <button
                onClick={handleSubmit}
                className="px-6 py-3 bg-primary text-white rounded-xl hover:bg-primary/90 font-semibold transition-all"
              >
                Crear Cotización
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
