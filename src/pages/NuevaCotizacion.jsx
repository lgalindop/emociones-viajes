import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { ArrowLeft, Plus, Trash2, Check } from "lucide-react";

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
  }

  function handleRemoveOpcion(tempId) {
    setOpciones(opciones.filter((op) => op.temp_id !== tempId));
  }

  async function handleSubmit() {
    if (
      !formData.cliente_nombre ||
      !formData.destino ||
      !formData.fecha_salida ||
      !formData.fecha_regreso
    ) {
      alert("Completa los campos obligatorios");
      return;
    }

    if (opciones.length === 0) {
      alert("Agrega al menos una opción de paquete");
      return;
    }

    try {
      const { data: cotizacion, error: cotError } = await supabase
        .from("cotizaciones")
        .insert([formData])
        .select()
        .single();

      if (cotError) throw cotError;

      const opcionesConCotizacionId = opciones.map((op) => ({
        cotizacion_id: cotizacion.id,
        operador_id: op.operador_id,
        nombre_paquete: op.nombre_paquete,
        precio_por_persona: parseFloat(op.precio_por_persona) || 0,
        precio_total: parseFloat(op.precio_total),
        incluye: op.incluye,
        no_incluye: op.no_incluye,
        disponibilidad: op.disponibilidad,
        link_paquete: op.link_paquete,
        notas: op.notas,
      }));

      const { error: opcionesError } = await supabase
        .from("opciones_cotizacion")
        .insert(opcionesConCotizacionId);

      if (opcionesError) throw opcionesError;

      alert("✅ Cotización creada: " + cotizacion.folio);
      onSuccess();
    } catch (error) {
      console.error("Error:", error);
      alert("❌ Error: " + error.message);
    }
  }

  function canGoToStep2() {
    return (
      formData.cliente_nombre &&
      formData.destino &&
      formData.fecha_salida &&
      formData.fecha_regreso
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-gray-600 hover:text-primary mb-6 transition-colors"
        >
          <ArrowLeft size={20} />
          <span className="font-medium">Regresar</span>
        </button>

        <div className="bg-white rounded-xl shadow-lg p-8">
          <h1 className="text-3xl font-bold text-primary mb-2">
            Nueva Cotización
          </h1>
          <p className="text-gray-600 mb-8">Paso {step} de 3</p>

          {/* Steps */}
          <div className="flex items-center justify-center mb-10">
            <div className="flex items-center gap-3">
              <div className="flex flex-col items-center">
                <div
                  className={`flex items-center justify-center w-12 h-12 rounded-full font-semibold ${
                    step >= 1 ? "bg-primary text-white" : "bg-gray-200"
                  }`}
                >
                  {step > 1 ? <Check size={24} /> : "1"}
                </div>
                <span className="text-xs mt-2">Cliente</span>
              </div>

              <div
                className={`h-1 w-20 ${step >= 2 ? "bg-primary" : "bg-gray-200"}`}
              ></div>

              <div className="flex flex-col items-center">
                <div
                  className={`flex items-center justify-center w-12 h-12 rounded-full font-semibold ${
                    step >= 2 ? "bg-primary text-white" : "bg-gray-200"
                  }`}
                >
                  {step > 2 ? <Check size={24} /> : "2"}
                </div>
                <span className="text-xs mt-2">Opciones</span>
              </div>

              <div
                className={`h-1 w-20 ${step >= 3 ? "bg-primary" : "bg-gray-200"}`}
              ></div>

              <div className="flex flex-col items-center">
                <div
                  className={`flex items-center justify-center w-12 h-12 rounded-full font-semibold ${
                    step >= 3 ? "bg-primary text-white" : "bg-gray-200"
                  }`}
                >
                  3
                </div>
                <span className="text-xs mt-2">Revisar</span>
              </div>
            </div>
          </div>
          {/* PASO 1 */}
          {step === 1 && (
            <div>
              <h2 className="text-xl font-semibold mb-6">
                Información del Cliente y Viaje
              </h2>

              <div className="space-y-6">
                <div className="border-l-4 border-primary pl-4">
                  <h3 className="font-semibold text-gray-700 mb-4">
                    Datos del Cliente
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
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
                        className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary focus:border-transparent"
                        placeholder="Ej: Juan Pérez García"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
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
                          className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary focus:border-transparent"
                          placeholder="614-123-4567"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
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
                          className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary focus:border-transparent"
                          placeholder="ejemplo@email.com"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        ¿Cómo nos contactó?
                      </label>
                      <select
                        value={formData.origen_lead}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            origen_lead: e.target.value,
                          })
                        }
                        className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary focus:border-transparent bg-white"
                      >
                        <option value="whatsapp">💬 WhatsApp</option>
                        <option value="instagram">📷 Instagram</option>
                        <option value="facebook">👥 Facebook</option>
                        <option value="referido">🤝 Referido</option>
                        <option value="web">🌐 Web</option>
                        <option value="otro">📋 Otro</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="border-l-4 border-primary-light pl-4">
                  <h3 className="font-semibold text-gray-700 mb-4">
                    Detalles del Viaje
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Destino <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.destino}
                        onChange={(e) =>
                          setFormData({ ...formData, destino: e.target.value })
                        }
                        className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary focus:border-transparent"
                        placeholder="Ej: Cancún, Riviera Maya"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
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
                          className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary focus:border-transparent"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
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
                          className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary focus:border-transparent"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Adultos
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
                          className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary focus:border-transparent"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Niños
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
                          className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary focus:border-transparent"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Presupuesto aproximado (MXN)
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
                        className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary focus:border-transparent"
                        placeholder="Ej: 50000"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Requerimientos
                      </label>
                      <textarea
                        value={formData.requerimientos}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            requerimientos: e.target.value,
                          })
                        }
                        className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary focus:border-transparent"
                        rows="3"
                        placeholder="Vuelos, hotel, tours, etc."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Notas internas
                      </label>
                      <textarea
                        value={formData.notas}
                        onChange={(e) =>
                          setFormData({ ...formData, notas: e.target.value })
                        }
                        className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary focus:border-transparent"
                        rows="2"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 flex justify-end">
                <button
                  onClick={() =>
                    canGoToStep2()
                      ? setStep(2)
                      : alert("Completa los campos obligatorios (*)")
                  }
                  className={`px-8 py-3 rounded-lg font-medium ${
                    canGoToStep2()
                      ? "bg-primary text-white hover:bg-primary/90"
                      : "bg-gray-300 text-gray-500 cursor-not-allowed"
                  }`}
                >
                  Siguiente →
                </button>
              </div>
            </div>
          )}

          {/* PASO 2 */}
          {step === 2 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold">
                Agregar Opciones de Paquetes
              </h2>

              <div className="bg-gray-50 rounded-lg p-6 border-2 border-dashed border-gray-300">
                <h3 className="font-semibold mb-4">Nueva Opción</h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Operador <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={currentOpcion.operador_id}
                      onChange={(e) =>
                        setCurrentOpcion({
                          ...currentOpcion,
                          operador_id: e.target.value,
                        })
                      }
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary focus:border-transparent bg-white"
                    >
                      <option value="">Selecciona un operador</option>
                      {operadores.map((op) => (
                        <option key={op.id} value={op.id}>
                          {op.nombre}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nombre del paquete <span className="text-red-500">*</span>
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
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary focus:border-transparent"
                      placeholder="Ej: Riviera Maya 5 días"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Precio por persona
                      </label>
                      <input
                        type="number"
                        value={currentOpcion.precio_por_persona}
                        onChange={(e) =>
                          setCurrentOpcion({
                            ...currentOpcion,
                            precio_por_persona: e.target.value,
                          })
                        }
                        className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary focus:border-transparent"
                        placeholder="MXN"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Precio total <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        value={currentOpcion.precio_total}
                        onChange={(e) =>
                          setCurrentOpcion({
                            ...currentOpcion,
                            precio_total: e.target.value,
                          })
                        }
                        className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary focus:border-transparent"
                        placeholder="MXN"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Incluye (separado por comas)
                    </label>
                    <textarea
                      value={incluye}
                      onChange={(e) => setIncluye(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary focus:border-transparent"
                      rows="2"
                      placeholder="Vuelos, Hotel, Transporte, Desayunos"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      No incluye (separado por comas)
                    </label>
                    <textarea
                      value={noIncluye}
                      onChange={(e) => setNoIncluye(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary focus:border-transparent"
                      rows="2"
                      placeholder="Propinas, Bebidas"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
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
                        className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Link
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
                        className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary focus:border-transparent"
                      />
                    </div>
                  </div>

                  <button
                    onClick={handleAddOpcion}
                    className="w-full flex items-center justify-center gap-2 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 font-medium"
                  >
                    <Plus size={20} />
                    Agregar Opción
                  </button>
                </div>
              </div>

              {opciones.length > 0 && (
                <div className="bg-white rounded-lg border-2 border-primary/20 p-6">
                  <h3 className="font-semibold mb-4">
                    Opciones agregadas ({opciones.length})
                  </h3>
                  <div className="space-y-3">
                    {opciones.map((op) => {
                      const operador = operadores.find(
                        (o) => o.id === op.operador_id
                      );
                      return (
                        <div
                          key={op.temp_id}
                          className="border rounded-lg p-4 bg-gray-50"
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <p className="font-medium">{op.nombre_paquete}</p>
                              <p className="text-sm text-gray-600">
                                {operador?.nombre}
                              </p>
                              <p className="text-lg font-bold text-primary mt-2">
                                $
                                {parseFloat(op.precio_total).toLocaleString(
                                  "es-MX"
                                )}
                              </p>
                            </div>
                            <button
                              onClick={() => handleRemoveOpcion(op.temp_id)}
                              className="text-red-600 hover:bg-red-50 p-2 rounded"
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

              <div className="flex gap-4">
                <button
                  onClick={() => setStep(1)}
                  className="px-8 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  ← Anterior
                </button>
                <button
                  onClick={() =>
                    opciones.length > 0
                      ? setStep(3)
                      : alert("Agrega al menos una opción")
                  }
                  disabled={opciones.length === 0}
                  className={`flex-1 px-8 py-3 rounded-lg font-medium ${
                    opciones.length > 0
                      ? "bg-primary text-white hover:bg-primary/90"
                      : "bg-gray-300 text-gray-500 cursor-not-allowed"
                  }`}
                >
                  Siguiente →
                </button>
              </div>
            </div>
          )}

          {/* PASO 3 */}
          {step === 3 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold">Revisar y Guardar</h2>

              <div className="space-y-6">
                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="font-semibold mb-3">👤 Cliente</h3>
                  <div className="space-y-2 text-sm">
                    <p>
                      <span className="font-medium">Nombre:</span>{" "}
                      {formData.cliente_nombre}
                    </p>
                    {formData.cliente_telefono && (
                      <p>
                        <span className="font-medium">Teléfono:</span>{" "}
                        {formData.cliente_telefono}
                      </p>
                    )}
                    {formData.cliente_email && (
                      <p>
                        <span className="font-medium">Email:</span>{" "}
                        {formData.cliente_email}
                      </p>
                    )}
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="font-semibold mb-3">✈️ Viaje</h3>
                  <div className="space-y-2 text-sm">
                    <p>
                      <span className="font-medium">Destino:</span>{" "}
                      {formData.destino}
                    </p>
                    <p>
                      <span className="font-medium">Fechas:</span>{" "}
                      {formData.fecha_salida} a {formData.fecha_regreso}
                    </p>
                    <p>
                      <span className="font-medium">Viajeros:</span>{" "}
                      {formData.num_adultos} adulto(s), {formData.num_ninos}{" "}
                      niño(s)
                    </p>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="font-semibold mb-3">
                    📋 Opciones ({opciones.length})
                  </h3>
                  <div className="space-y-3">
                    {opciones.map((op, idx) => {
                      const operador = operadores.find(
                        (o) => o.id === op.operador_id
                      );
                      return (
                        <div
                          key={op.temp_id}
                          className="bg-white border rounded-lg p-4"
                        >
                          <p className="font-medium">
                            Opción {idx + 1}: {op.nombre_paquete}
                          </p>
                          <p className="text-sm text-gray-600">
                            {operador?.nombre}
                          </p>
                          <p className="text-lg font-bold text-primary mt-2">
                            $
                            {parseFloat(op.precio_total).toLocaleString(
                              "es-MX"
                            )}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => setStep(2)}
                  className="px-8 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  ← Anterior
                </button>
                <button
                  onClick={handleSubmit}
                  className="flex-1 px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-center gap-2"
                >
                  <Check size={20} />
                  Guardar Cotización
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
