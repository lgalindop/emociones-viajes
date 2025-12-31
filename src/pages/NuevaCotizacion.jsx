import { useState, useEffect, useRef } from "react";
import { supabase } from "../lib/supabase";
import { ArrowLeft, Plus, Trash2, Check, X } from "lucide-react";
import LeadOriginIcon from "../components/LeadOriginIcon";
import HotelAutocomplete from "../components/HotelAutocomplete";

export default function NuevaCotizacion({ onBack, onSuccess }) {
  const [step, setStep] = useState(1);
  const [operadores, setOperadores] = useState([]);
  const [grupos, setGrupos] = useState([]);
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
    num_habitaciones: 1,
    tipo_habitacion: "",
    personas_por_habitacion: "",
    presupuesto_aprox: "",
    notas: "",
    divisa: "MXN",
    vigente_hasta: "",
    grupo_id: null,
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
    hotel_id: null,
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

  useEffect(() => {
    fetchOperadores();
    fetchGrupos();
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

  // Customer search
  useEffect(() => {
    if (customerSearch.length > 2) {
      searchCustomers();
    } else {
      setCustomerMatches([]);
      setShowCustomerDropdown(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customerSearch]);

  // Auto-populate vuelo dates from formData when entering Step 3
  useEffect(() => {
    if (step === 3 && formData.fecha_salida && formData.fecha_regreso) {
      setCurrentOpcion((prev) => ({
        ...prev,
        vuelo_ida_fecha: formData.fecha_salida,
        vuelo_regreso_fecha: formData.fecha_regreso,
      }));
    }
  }, [step, formData.fecha_salida, formData.fecha_regreso]);

  async function fetchOperadores() {
    try {
      const { data, error } = await supabase
        .from("operadores")
        .select("*")
        .eq("activo", true)
        .order("nombre");

      if (error) throw error;
      setOperadores(data || []);
    } catch (error) {
      console.error("Error fetching operadores:", error);
    }
  }

  async function fetchGrupos() {
    try {
      const { data, error } = await supabase
        .from("grupos")
        .select("*")
        .order("nombre");
      if (error) throw error;
      setGrupos(data || []);
    } catch (error) {
      console.error("Error fetching grupos:", error);
    }
  }

  async function searchCustomers() {
    try {
      const { data, error } = await supabase
        .from("cotizaciones")
        .select("cliente_nombre, cliente_telefono, cliente_email")
        .or(
          `cliente_nombre.ilike.%${customerSearch}%,cliente_telefono.ilike.%${customerSearch}%`
        )
        .limit(5);

      if (error) throw error;

      // Remove duplicates based on phone or email
      const unique = [];
      const seen = new Set();

      for (const customer of data || []) {
        const key = `${customer.cliente_telefono}-${customer.cliente_email}`;
        if (!seen.has(key) && customer.cliente_nombre) {
          seen.add(key);
          unique.push(customer);
        }
      }

      setCustomerMatches(unique);
      setShowCustomerDropdown(unique.length > 0);
    } catch (error) {
      console.error("Error searching customers:", error);
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

  function handlePriceChange(field, value) {
    const updated = { ...currentOpcion, [field]: value };

    // Auto-calculate precio_total when price fields change
    if (["precio_adulto", "precio_menor", "precio_infante"].includes(field)) {
      const adultos =
        parseFloat(updated.precio_adulto || 0) * formData.num_adultos;
      const menores =
        parseFloat(updated.precio_menor || 0) * formData.num_ninos;
      const infantes =
        parseFloat(updated.precio_infante || 0) * (formData.num_infantes || 0);
      updated.precio_total = (adultos + menores + infantes).toFixed(2);
    }

    setCurrentOpcion(updated);
  }

  function handleAddOpcion() {
    if (
      (!currentOpcion.operador_id || currentOpcion.operador_id === "otro") &&
      !currentOpcion.precio_total
    ) {
      alert("Completa el precio total de la opción");
      return;
    }

    setOpciones([...opciones, { ...currentOpcion }]);
    setCurrentOpcion({
      operador_id: "",
      nombre_paquete: "",
      servicio_descripcion: "",
      hotel_nombre: "",
      hotel_id: null,
      ocupacion: "",
      vuelo_ida_fecha: formData.fecha_salida || "",
      vuelo_ida_horario: "",
      vuelo_ida_ruta: "",
      vuelo_ida_directo: false,
      vuelo_regreso_fecha: formData.fecha_regreso || "",
      vuelo_regreso_horario: "",
      vuelo_regreso_ruta: "",
      vuelo_regreso_directo: false,
      precio_adulto: "",
      precio_menor: "",
      precio_infante: "",
      precio_total: "",
      incluye: [],
      no_incluye: [],
      link_paquete: "",
      tour_link: "",
    });
    setIncluye("");
    setNoIncluye("");
  }

  function handleRemoveOpcion(index) {
    setOpciones(opciones.filter((_, i) => i !== index));
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

  function addNoIncluye() {
    if (noIncluye.trim()) {
      setCurrentOpcion({
        ...currentOpcion,
        no_incluye: [...currentOpcion.no_incluye, noIncluye.trim()],
      });
      setNoIncluye("");
    }
  }

  function removeIncluye(index) {
    setCurrentOpcion({
      ...currentOpcion,
      incluye: currentOpcion.incluye.filter((_, i) => i !== index),
    });
  }

  function removeNoIncluye(index) {
    setCurrentOpcion({
      ...currentOpcion,
      no_incluye: currentOpcion.no_incluye.filter((_, i) => i !== index),
    });
  }

  async function handleSubmit() {
    try {
      if (!formData.cliente_nombre || !formData.destino) {
        alert("Completa los campos obligatorios");
        return;
      }

      // Insert cotización
      const { data: cotizacion, error: cotError } = await supabase
        .from("cotizaciones")
        .insert({
          ...formData,
          fecha_salida: formData.fecha_salida
            ? formData.fecha_salida + "T12:00:00"
            : null,
          fecha_regreso: formData.fecha_regreso
            ? formData.fecha_regreso + "T12:00:00"
            : null,
          vigente_hasta: formData.vigente_hasta
            ? formData.vigente_hasta + "T12:00:00"
            : null,
          pipeline_stage: "lead",
        })
        .select()
        .single();

      if (cotError) throw cotError;

      // Insert opciones
      if (opciones.length > 0) {
        const opcionesData = opciones.map((op) => ({
          cotizacion_id: cotizacion.id,
          operador_id: op.operador_id === "otro" ? null : op.operador_id,
          nombre_paquete: op.nombre_paquete || null,
          servicio_descripcion: op.servicio_descripcion || null,
          hotel_nombre: op.hotel_nombre || null,
          hotel_id: op.hotel_id || null,
          ocupacion: op.ocupacion || null,
          vuelo_ida_fecha: op.vuelo_ida_fecha
            ? op.vuelo_ida_fecha + "T12:00:00"
            : null,
          vuelo_ida_horario: op.vuelo_ida_horario || null,
          vuelo_ida_ruta: op.vuelo_ida_ruta || null,
          vuelo_ida_directo: op.vuelo_ida_directo || false,
          vuelo_regreso_fecha: op.vuelo_regreso_fecha
            ? op.vuelo_regreso_fecha + "T12:00:00"
            : null,
          vuelo_regreso_horario: op.vuelo_regreso_horario || null,
          vuelo_regreso_ruta: op.vuelo_regreso_ruta || null,
          vuelo_regreso_directo: op.vuelo_regreso_directo || false,
          precio_adulto: op.precio_adulto ? parseFloat(op.precio_adulto) : null,
          precio_menor: op.precio_menor ? parseFloat(op.precio_menor) : null,
          precio_infante: op.precio_infante
            ? parseFloat(op.precio_infante)
            : null,
          precio_total: parseFloat(op.precio_total),
          incluye: op.incluye,
          no_incluye: op.no_incluye,
          link_paquete: op.link_paquete || null,
          tour_link: op.tour_link || null,
        }));

        const { error: opError } = await supabase
          .from("opciones_cotizacion")
          .insert(opcionesData);

        if (opError) throw opError;
      }

      alert("✅ Cotización creada exitosamente");
      onSuccess();
    } catch (error) {
      console.error("Error:", error);
      alert("Error al crear cotización: " + error.message);
    }
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
            Volver
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Nueva Cotización</h1>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-center gap-4">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                    s === step
                      ? "bg-primary text-white"
                      : s < step
                        ? "bg-green-500 text-white"
                        : "bg-gray-300 text-gray-600"
                  }`}
                >
                  {s < step ? <Check size={20} /> : s}
                </div>
                {s < 3 && (
                  <div
                    className={`w-20 h-1 mx-2 ${
                      s < step ? "bg-green-500" : "bg-gray-300"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-center mt-2">
            <p className="text-sm text-gray-600">
              {step === 1 && "Información del Cliente"}
              {step === 2 && "Detalles del Viaje"}
              {step === 3 && "Opciones de Paquetes"}
            </p>
          </div>
        </div>

        {/* Step 1: Client Info */}
        {step === 1 && (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="space-y-6">
              <div className="relative" ref={customerDropdownRef}>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Nombre del Cliente *
                </label>
                <input
                  type="text"
                  required
                  value={customerSearch || formData.cliente_nombre}
                  onChange={(e) => {
                    const value = e.target.value;
                    setCustomerSearch(value);
                    setFormData({ ...formData, cliente_nombre: value });
                  }}
                  onFocus={() => {
                    if (customerMatches.length > 0) {
                      setShowCustomerDropdown(true);
                    }
                  }}
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                  placeholder="Empieza a escribir para buscar..."
                />

                {/* Customer Dropdown */}
                {showCustomerDropdown && customerMatches.length > 0 && (
                  <div className="absolute z-50 w-full mt-1 bg-white border-2 border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {customerMatches.map((customer, index) => (
                      <div
                        key={index}
                        onClick={() => selectCustomer(customer)}
                        className="px-4 py-3 hover:bg-primary/10 cursor-pointer border-b last:border-b-0"
                      >
                        <p className="font-medium text-gray-900">
                          {customer.cliente_nombre}
                        </p>
                        {customer.cliente_telefono && (
                          <p className="text-sm text-gray-600">
                            {customer.cliente_telefono}
                          </p>
                        )}
                        {customer.cliente_email && (
                          <p className="text-sm text-gray-500">
                            {customer.cliente_email}
                          </p>
                        )}
                      </div>
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
                  Grupo (Opcional)
                </label>
                <select
                  value={formData.grupo_id || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      grupo_id: e.target.value || null,
                    })
                  }
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                >
                  <option value="">Sin grupo</option>
                  {grupos.map((grupo) => (
                    <option key={grupo.id} value={grupo.id}>
                      {grupo.nombre}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Asigna esta cotización a un grupo de viajeros (bodas, torneos,
                  etc.)
                </p>
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
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">
                      Fecha de Creación
                    </label>
                    <input
                      type="text"
                      value={new Date().toLocaleDateString("es-MX")}
                      disabled
                      className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 bg-gray-100 text-gray-600"
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
                  required
                  value={formData.destino}
                  onChange={(e) =>
                    setFormData({ ...formData, destino: e.target.value })
                  }
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                  placeholder="Ej: Cancún, Riviera Maya"
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
                      setFormData({ ...formData, fecha_salida: e.target.value })
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

              <div className="grid grid-cols-4 gap-4">
                <div className="col-span-1">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Adultos
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.num_adultos}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        num_adultos: parseInt(e.target.value),
                      })
                    }
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                  />
                </div>

                <div className="col-span-1">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Menores
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.num_ninos}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        num_ninos: parseInt(e.target.value),
                      })
                    }
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                  />
                </div>

                <div className="col-span-1">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Infantes
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.num_infantes}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        num_infantes: parseInt(e.target.value),
                      })
                    }
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                  />
                </div>

                <div className="col-span-1">
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
                    <option value="EUR">EUR</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Número de Habitaciones
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.num_habitaciones}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        num_habitaciones: parseInt(e.target.value) || 1,
                      })
                    }
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                  />
                </div>

                {formData.num_habitaciones > 1 && (
                  <>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Tipo de Habitación
                      </label>
                      <input
                        type="text"
                        value={formData.tipo_habitacion}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            tipo_habitacion: e.target.value,
                          })
                        }
                        className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                        placeholder="Ej: Doble, King, Suite"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Personas por Habitación
                      </label>
                      <input
                        type="text"
                        value={formData.personas_por_habitacion}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            personas_por_habitacion: e.target.value,
                          })
                        }
                        className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                        placeholder="Ej: 2 adultos, 2+1"
                      />
                    </div>
                  </>
                )}
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
                <h3 className="font-semibold text-lg mb-4">
                  Opciones Agregadas ({opciones.length})
                </h3>
                <div className="space-y-4">
                  {opciones.map((opcion, index) => {
                    const operador = operadores.find(
                      (op) => op.id === opcion.operador_id
                    );
                    return (
                      <div
                        key={index}
                        className="border-2 border-gray-200 rounded-xl p-4"
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <p className="font-semibold text-primary">
                              {opcion.operador_id === "otro"
                                ? "Otro"
                                : operador?.nombre}
                            </p>
                            {opcion.nombre_paquete && (
                              <p className="text-lg font-bold">
                                {opcion.nombre_paquete}
                              </p>
                            )}
                            {opcion.hotel_nombre && (
                              <p className="text-sm text-gray-600">
                                🏨 {opcion.hotel_nombre}
                              </p>
                            )}
                            <p className="text-2xl font-bold text-primary mt-2">
                              $
                              {parseFloat(opcion.precio_total).toLocaleString()}
                            </p>
                            {opcion.disponibilidad && (
                              <p className="text-sm text-gray-600 mt-1">
                                {opcion.disponibilidad}
                              </p>
                            )}
                          </div>
                          <button
                            onClick={() => handleRemoveOpcion(index)}
                            className="text-red-600 hover:bg-red-50 p-2 rounded-lg"
                          >
                            <Trash2 size={20} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Add New Option Form */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="font-semibold text-lg mb-4">Agregar Opción</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Operador
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
                  />
                </div>

                {/* NEW PROFESSIONAL FIELDS */}
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
                    rows="2"
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                    placeholder="PAQUETE VACACIONAL A CANCUN, INCLUYE..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Hotel
                    </label>
                    <HotelAutocomplete
                      value={currentOpcion.hotel_nombre}
                      hotelId={currentOpcion.hotel_id}
                      onChange={(nombre, id) =>
                        setCurrentOpcion({
                          ...currentOpcion,
                          hotel_nombre: nombre,
                          hotel_id: id,
                        })
                      }
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
                      placeholder="DOUBLE DBL"
                    />
                  </div>
                </div>

                {/* Flight Info */}
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <div className="flex items-center justify-between mb-3">
                    <label className="block text-sm font-semibold text-green-900">
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
                        placeholder="08:30 - 12:40"
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
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary focus:border-primary transition-all bg-yellow-50"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Auto-calculado: {formData.num_adultos} adultos +{" "}
                    {formData.num_ninos} menores + {formData.num_infantes || 0}{" "}
                    infantes
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Incluye
                  </label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {[
                      "Vuelos",
                      "Hospedaje",
                      "Hospedaje todo incluido",
                      "Traslados Aeropuerto-Hotel-Aeropuerto",
                      "Traslados",
                    ].map((item) => (
                      <button
                        key={item}
                        type="button"
                        onClick={() => {
                          if (!currentOpcion.incluye.includes(item)) {
                            setCurrentOpcion({
                              ...currentOpcion,
                              incluye: [...currentOpcion.incluye, item],
                            });
                          }
                        }}
                        className="text-xs px-3 py-1 bg-green-50 hover:bg-green-100 text-green-700 rounded-full transition-all"
                      >
                        + {item}
                      </button>
                    ))}
                  </div>
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

                <button
                  type="button"
                  onClick={handleAddOpcion}
                  className="w-full px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 font-semibold transition-all"
                >
                  Agregar Opción
                </button>
              </div>
            </div>

            {/* General Notes for all options */}
            <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Notas Generales
              </label>
              <textarea
                value={formData.notas}
                onChange={(e) =>
                  setFormData({ ...formData, notas: e.target.value })
                }
                rows="3"
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                placeholder="Notas internas para toda la cotización..."
              />
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
