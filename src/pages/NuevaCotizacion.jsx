import { useState, useEffect } from "react";
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
    presupuesto_aprox: "",
    requerimientos: "",
    notas: "",
  });
  const [opciones, setOpciones] = useState([]);
  const [currentOpcion, setCurrentOpcion] = useState({
    operador_id: "",
    nombre_paquete: "",
    precio_por_persona: "",
    precio_total: "",
    incluye: [],
    no_incluye: [],
    disponibilidad: "",
    link_paquete: "",
    notas: "",
  });
  const [incluye, setIncluye] = useState("");
  const [noIncluye, setNoIncluye] = useState("");

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

  function addRequerimiento(req) {
    const current = formData.requerimientos;
    if (current) {
      setFormData({ ...formData, requerimientos: current + ", " + req });
    } else {
      setFormData({ ...formData, requerimientos: req });
    }
  }

  function handleAddOpcion() {
    if (
      !currentOpcion.operador_id ||
      !currentOpcion.nombre_paquete ||
      !currentOpcion.precio_total
    ) {
      alert("Completa los campos obligatorios de la opción");
      return;
    }

    const incluyeArray = incluye
      .split(",")
      .map((i) => i.trim())
      .filter(Boolean);
    const noIncluyeArray = noIncluye
      .split(",")
      .map((i) => i.trim())
      .filter(Boolean);

    setOpciones([
      ...opciones,
      {
        ...currentOpcion,
        incluye: incluyeArray,
        no_incluye: noIncluyeArray,
        temp_id: Date.now(),
      },
    ]);

    setCurrentOpcion({
      operador_id: "",
      nombre_paquete: "",
      precio_por_persona: "",
      precio_total: "",
      incluye: [],
      no_incluye: [],
      disponibilidad: "",
      link_paquete: "",
      notas: "",
    });
    setIncluye("");
    setNoIncluye("");

    // Scroll to top to see added option
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleRemoveOpcion(tempId) {
    setOpciones(opciones.filter((op) => op.temp_id !== tempId));
  }

  async function handleSubmit() {
    if (!formData.cliente_nombre || !formData.destino) {
      alert("Completa los campos obligatorios");
      return;
    }

    try {
      const cotizacionData = {
        ...formData,
        presupuesto_aprox: formData.presupuesto_aprox
          ? parseFloat(formData.presupuesto_aprox)
          : null,
      };

      const result = await supabase
        .from("cotizaciones")
        .insert([cotizacionData])
        .select();

      if (result.error) throw result.error;

      const cotizacionId = result.data[0].id;

      if (opciones.length > 0) {
        const opcionesData = opciones.map((op) => ({
          cotizacion_id: cotizacionId,
          operador_id: op.operador_id,
          nombre_paquete: op.nombre_paquete,
          precio_por_persona: parseFloat(op.precio_por_persona) || null,
          precio_total: parseFloat(op.precio_total),
          incluye: op.incluye,
          no_incluye: op.no_incluye,
          disponibilidad: op.disponibilidad || null,
          link_paquete: op.link_paquete || null,
          notas: op.notas || null,
        }));

        const opcionesResult = await supabase
          .from("opciones_cotizacion")
          .insert(opcionesData);

        if (opcionesResult.error) throw opcionesResult.error;
      }

      onSuccess();
    } catch (error) {
      console.error("Error:", error);
      alert("Error al crear cotización: " + error.message);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 sm:p-6 md:p-8 pb-24 md:pb-8">
      <div className="max-w-5xl mx-auto">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-primary hover:text-primary/80 mb-6 transition-colors font-medium"
        >
          <ArrowLeft size={20} />
          Volver a Cotizaciones
        </button>

        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Header with gradient */}
          <div className="bg-gradient-to-r from-primary to-secondary p-6 sm:p-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
              Nueva Cotización
            </h1>
            <p className="text-white/90 text-sm">
              Crea una cotización personalizada para tu cliente
            </p>
          </div>

          <div className="p-6 sm:p-8">
            {/* Progress Steps */}
            <div className="mb-8">
              <div className="flex items-center justify-between max-w-md mx-auto">
                <div className="flex flex-col items-center flex-1">
                  <div
                    className={`flex items-center justify-center w-12 h-12 rounded-full font-semibold transition-all ${
                      step >= 1
                        ? "bg-primary text-white shadow-lg scale-110"
                        : "bg-gray-200 text-gray-500"
                    }`}
                  >
                    {step > 1 ? <Check size={24} /> : "1"}
                  </div>
                  <span className="text-xs mt-2 font-medium">Información</span>
                </div>

                <div
                  className={`h-1 flex-1 mx-2 rounded-full transition-all ${step >= 2 ? "bg-primary" : "bg-gray-200"}`}
                ></div>

                <div className="flex flex-col items-center flex-1">
                  <div
                    className={`flex items-center justify-center w-12 h-12 rounded-full font-semibold transition-all ${
                      step >= 2
                        ? "bg-primary text-white shadow-lg scale-110"
                        : "bg-gray-200 text-gray-500"
                    }`}
                  >
                    {step > 2 ? <Check size={24} /> : "2"}
                  </div>
                  <span className="text-xs mt-2 font-medium">Opciones</span>
                </div>

                <div
                  className={`h-1 flex-1 mx-2 rounded-full transition-all ${step >= 3 ? "bg-primary" : "bg-gray-200"}`}
                ></div>

                <div className="flex flex-col items-center flex-1">
                  <div
                    className={`flex items-center justify-center w-12 h-12 rounded-full font-semibold transition-all ${
                      step >= 3
                        ? "bg-primary text-white shadow-lg scale-110"
                        : "bg-gray-200 text-gray-500"
                    }`}
                  >
                    3
                  </div>
                  <span className="text-xs mt-2 font-medium">Revisar</span>
                </div>
              </div>
            </div>

            {/* PASO 1 */}
            {step === 1 && (
              <div className="space-y-8">
                {/* Cliente Section */}
                <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-xl p-6 border border-blue-200">
                  <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <span className="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center text-sm">
                      1
                    </span>
                    Datos del Cliente
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Nombre completo <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.cliente_nombre}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            cliente_nombre: e.target.value,
                          })
                        }
                        className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                        placeholder="Ej: María García López"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                          placeholder="614-123-4567"
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
                          placeholder="cliente@email.com"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        ¿Cómo nos contactó?
                      </label>
                      <div className="relative">
                        <select
                          value={formData.origen_lead}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              origen_lead: e.target.value,
                            })
                          }
                          className="w-full border-2 border-gray-200 rounded-xl pl-12 pr-4 py-3 focus:ring-2 focus:ring-primary focus:border-primary transition-all bg-white appearance-none cursor-pointer"
                        >
                          {leadOrigins.map((origin) => (
                            <option key={origin.value} value={origin.value}>
                              {origin.label}
                            </option>
                          ))}
                        </select>
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                          <LeadOriginIcon
                            origen={formData.origen_lead}
                            size={20}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Viaje Section */}
                <div className="bg-gradient-to-br from-purple-50 to-purple-100/50 rounded-xl p-6 border border-purple-200">
                  <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <span className="w-8 h-8 bg-secondary text-white rounded-full flex items-center justify-center text-sm">
                      2
                    </span>
                    Detalles del Viaje
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Destino <span className="text-red-500">*</span>
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

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Fecha de salida{" "}
                          <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="date"
                          required
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
                          Fecha de regreso{" "}
                          <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="date"
                          required
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

                    <div className="grid grid-cols-2 gap-4">
                      <div>
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

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Niños
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
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Presupuesto aproximado (MXN)
                      </label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
                          $
                        </span>
                        <input
                          type="number"
                          value={formData.presupuesto_aprox}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              presupuesto_aprox: e.target.value,
                            })
                          }
                          className="w-full border-2 border-gray-200 rounded-xl pl-8 pr-4 py-3 focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                          placeholder="20,000"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Requerimientos especiales
                      </label>
                      <textarea
                        value={formData.requerimientos}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            requerimientos: e.target.value,
                          })
                        }
                        rows={3}
                        className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                        placeholder="Habitación con vista al mar, cuna para bebé..."
                      />
                      {/* Suggestions */}
                      <div className="mt-2 flex flex-wrap gap-2">
                        {requerimientosSuggestions.map((req, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => addRequerimiento(req)}
                            className="px-3 py-1 text-xs bg-gray-100 hover:bg-primary hover:text-white rounded-full transition-colors"
                          >
                            + {req}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Notas internas
                      </label>
                      <textarea
                        value={formData.notas}
                        onChange={(e) =>
                          setFormData({ ...formData, notas: e.target.value })
                        }
                        rows={2}
                        className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                        placeholder="Notas para uso interno..."
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={() => setStep(2)}
                    className="px-8 py-3 bg-primary text-white rounded-xl hover:bg-primary/90 transition-all font-semibold"
                  >
                    Siguiente: Agregar Opciones →
                  </button>
                </div>
              </div>
            )}

            {/* PASO 2 */}
            {step === 2 && (
              <div>
                <h2 className="text-xl font-bold mb-6 text-gray-800">
                  Opciones de Paquetes (Opcional)
                </h2>

                {/* Show added options at TOP */}
                {opciones.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-sm font-semibold text-gray-700 mb-3">
                      Opciones agregadas ({opciones.length})
                    </h3>
                    <div className="space-y-3">
                      {opciones.map((opcion) => {
                        const operador = operadores.find(
                          (op) => op.id === opcion.operador_id
                        );
                        return (
                          <div
                            key={opcion.temp_id}
                            className="border-2 border-green-200 bg-green-50 rounded-xl p-4"
                          >
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <h3 className="font-bold text-gray-900">
                                  {opcion.nombre_paquete}
                                </h3>
                                <p className="text-sm text-gray-600 mt-1">
                                  {operador?.nombre || "Operador desconocido"}
                                </p>
                                <p className="text-xl font-bold text-primary mt-2">
                                  $
                                  {parseFloat(
                                    opcion.precio_total
                                  ).toLocaleString()}{" "}
                                  MXN
                                </p>
                              </div>
                              <button
                                onClick={() =>
                                  handleRemoveOpcion(opcion.temp_id)
                                }
                                className="text-red-600 hover:text-red-700 hover:bg-red-100 p-2 rounded-lg transition-colors"
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

                <p className="text-sm text-gray-600 mb-6">
                  Agrega una o más opciones de paquetes. Puedes hacerlo ahora o
                  más tarde desde los detalles de la cotización.
                </p>

                {/* Add option form at BOTTOM */}
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 bg-gray-50/50">
                  <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <Plus size={20} className="text-primary" />
                    Agregar Nueva Opción
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
                        <option value="">Selecciona un operador...</option>
                        {operadores.map((op) => (
                          <option key={op.id} value={op.id}>
                            {op.nombre}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Nombre del paquete *
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

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Precio por persona (MXN)
                        </label>
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
                            $
                          </span>
                          <input
                            type="number"
                            value={currentOpcion.precio_por_persona}
                            onChange={(e) =>
                              setCurrentOpcion({
                                ...currentOpcion,
                                precio_por_persona: e.target.value,
                              })
                            }
                            className="w-full border-2 border-gray-200 rounded-xl pl-8 pr-4 py-3 focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Precio total (MXN) *
                        </label>
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
                            $
                          </span>
                          <input
                            type="number"
                            value={currentOpcion.precio_total}
                            onChange={(e) =>
                              setCurrentOpcion({
                                ...currentOpcion,
                                precio_total: e.target.value,
                              })
                            }
                            className="w-full border-2 border-gray-200 rounded-xl pl-8 pr-4 py-3 focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Incluye (separado por comas)
                      </label>
                      <textarea
                        value={incluye}
                        onChange={(e) => setIncluye(e.target.value)}
                        rows={3}
                        className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                        placeholder="Vuelos, Hospedaje, Alimentos, Tours..."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        No incluye (separado por comas)
                      </label>
                      <textarea
                        value={noIncluye}
                        onChange={(e) => setNoIncluye(e.target.value)}
                        rows={2}
                        className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                        placeholder="Bebidas, Propinas, Tours opcionales..."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Link del paquete
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

                    <button
                      onClick={handleAddOpcion}
                      className="w-full py-3 border-2 border-primary text-primary rounded-xl hover:bg-primary hover:text-white transition-all flex items-center justify-center gap-2 font-semibold"
                    >
                      <Plus size={20} />
                      Agregar esta Opción
                    </button>
                  </div>
                </div>

                <div className="flex justify-between mt-8">
                  <button
                    onClick={() => setStep(1)}
                    className="px-6 py-3 border-2 border-gray-300 rounded-xl hover:bg-gray-50 transition-all font-semibold"
                  >
                    ← Anterior
                  </button>
                  <button
                    onClick={() => setStep(3)}
                    className="px-8 py-3 bg-primary text-white rounded-xl hover:bg-primary/90 transition-all font-semibold"
                  >
                    Siguiente: Revisar →
                  </button>
                </div>
              </div>
            )}

            {/* PASO 3 */}
            {step === 3 && (
              <div>
                <h2 className="text-xl font-bold mb-6 text-gray-800">
                  Revisar y Confirmar
                </h2>

                <div className="space-y-6">
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-xl p-6 border border-blue-200">
                    <h3 className="font-bold text-gray-800 mb-3">Cliente</h3>
                    <p>
                      <strong>Nombre:</strong> {formData.cliente_nombre}
                    </p>
                    {formData.cliente_telefono && (
                      <p>
                        <strong>Teléfono:</strong> {formData.cliente_telefono}
                      </p>
                    )}
                    {formData.cliente_email && (
                      <p>
                        <strong>Email:</strong> {formData.cliente_email}
                      </p>
                    )}
                    <p className="flex items-center gap-2">
                      <strong>Contactó por:</strong>
                      <LeadOriginIcon origen={formData.origen_lead} size={18} />
                      <span>
                        {
                          leadOrigins.find(
                            (o) => o.value === formData.origen_lead
                          )?.label
                        }
                      </span>
                    </p>
                  </div>

                  <div className="bg-gradient-to-br from-purple-50 to-purple-100/50 rounded-xl p-6 border border-purple-200">
                    <h3 className="font-bold text-gray-800 mb-3">Viaje</h3>
                    <p>
                      <strong>Destino:</strong> {formData.destino}
                    </p>
                    <p>
                      <strong>Fechas:</strong> {formData.fecha_salida} -{" "}
                      {formData.fecha_regreso}
                    </p>
                    <p>
                      <strong>Viajeros:</strong> {formData.num_adultos} adultos,{" "}
                      {formData.num_ninos} niños
                    </p>
                    {formData.presupuesto_aprox && (
                      <p>
                        <strong>Presupuesto:</strong> $
                        {parseFloat(
                          formData.presupuesto_aprox
                        ).toLocaleString()}
                      </p>
                    )}
                    {formData.requerimientos && (
                      <p>
                        <strong>Requerimientos:</strong>{" "}
                        {formData.requerimientos}
                      </p>
                    )}
                    {formData.notas && (
                      <p>
                        <strong>Notas:</strong> {formData.notas}
                      </p>
                    )}
                  </div>

                  {opciones.length > 0 && (
                    <div className="bg-gradient-to-br from-green-50 to-green-100/50 rounded-xl p-6 border border-green-200">
                      <h3 className="font-bold text-gray-800 mb-3">
                        Opciones de Paquetes ({opciones.length})
                      </h3>
                      <div className="space-y-3">
                        {opciones.map((op) => {
                          const operador = operadores.find(
                            (o) => o.id === op.operador_id
                          );
                          return (
                            <div
                              key={op.temp_id}
                              className="border-2 border-green-300 rounded-lg p-4 bg-white"
                            >
                              <p className="font-bold text-lg">
                                {op.nombre_paquete}
                              </p>
                              <p className="text-sm text-gray-600">
                                {operador?.nombre}
                              </p>
                              <p className="text-xl font-bold text-primary mt-2">
                                ${parseFloat(op.precio_total).toLocaleString()}{" "}
                                MXN
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex justify-between mt-8">
                  <button
                    onClick={() => setStep(2)}
                    className="px-6 py-3 border-2 border-gray-300 rounded-xl hover:bg-gray-50 transition-all font-semibold"
                  >
                    ← Anterior
                  </button>
                  <button
                    onClick={handleSubmit}
                    className="px-8 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all flex items-center gap-2 font-semibold"
                  >
                    <Check size={20} />
                    Crear Cotización
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
