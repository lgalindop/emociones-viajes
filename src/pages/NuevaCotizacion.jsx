// pages/NuevaCotizacion.jsx
import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import useMoneyInput from "../hooks/useMoneyInput";
import { formatMoneyDisplay, parseMoneyToNumber } from "../lib/money";

export default function NuevaCotizacion({ onBack, onSuccess }) {
  const [step, setStep] = useState(1);
  const [operadores, setOperadores] = useState([]);

  // presupuesto usa hook (editable)
  const presupuesto = useMoneyInput("");

  const [formData, setFormData] = useState({
    cliente_nombre: "",
    cliente_telefono: "",
    cliente_email: "",
    origen_lead: "WhatsApp",
    destino: "",
    fecha_salida: "",
    fecha_regreso: "",
    num_adultos: 2,
    num_ninos: 0,
    requerimientos: "",
    notas: "",
    divisa: "MXN",
    estatus: "nueva",
  });

  // opciones: precio_por_persona_raw / precio_total_raw para inputs editables
  const [opciones, setOpciones] = useState([]);
  const [currentOpcion, setCurrentOpcion] = useState({
    operador_id: "",
    nombre_paquete: "",
    precio_por_persona_raw: "",
    precio_total_raw: "",
    incluye: [],
    no_incluye: [],
    disponibilidad: "",
    link_paquete: "",
    notas: "",
  });

  const [incluyeText, setIncluyeText] = useState("");
  const [noIncluyeText, setNoIncluyeText] = useState("");

  useEffect(() => {
    fetchOperadores();
    // keep presupuesto currency in sync on currency change
    // presupuesto.setCurrency(formData.divisa) // optional if hook supports
  }, []);

  async function fetchOperadores() {
    const { data, error } = await supabase
      .from("operadores")
      .select("*")
      .eq("activo", true)
      .order("nombre");
    if (error) console.error(error);
    else setOperadores(data || []);
  }

  function addOpcion() {
    if (
      !currentOpcion.operador_id ||
      !currentOpcion.nombre_paquete ||
      !currentOpcion.precio_total_raw
    ) {
      alert("Completa los campos obligatorios de la opción");
      return;
    }

    const incluye = incluyeText
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const no_incluye = noIncluyeText
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    setOpciones((prev) => [
      ...prev,
      {
        ...currentOpcion,
        incluye,
        no_incluye,
        temp_id: Date.now(),
      },
    ]);

    setCurrentOpcion({
      operador_id: "",
      nombre_paquete: "",
      precio_por_persona_raw: "",
      precio_total_raw: "",
      incluye: [],
      no_incluye: [],
      disponibilidad: "",
      link_paquete: "",
      notas: "",
    });
    setIncluyeText("");
    setNoIncluyeText("");
  }

  function removeOpcion(tempId) {
    setOpciones((prev) => prev.filter((o) => o.temp_id !== tempId));
  }

  function formatDateString(d) {
    if (!d) return "";
    try {
      return new Date(d).toLocaleDateString("es-MX", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return d;
    }
  }

  // prepare DB payload
  function normalizeForDb() {
    return {
      ...formData,
      presupuesto_aprox: presupuesto.getNumber(),
      num_adultos: Number(formData.num_adultos) || 0,
      num_ninos: Number(formData.num_ninos) || 0,
    };
  }

  async function guardarCotizacion() {
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
      alert("Agrega al menos una opción");
      return;
    }

    try {
      const toInsert = normalizeForDb();
      const { data: cot, error: cotError } = await supabase
        .from("cotizaciones")
        .insert([toInsert])
        .select()
        .single();
      if (cotError) throw cotError;

      const opcionesToInsert = opciones.map((op) => ({
        cotizacion_id: cot.id,
        operador_id: op.operador_id,
        nombre_paquete: op.nombre_paquete,
        precio_por_persona: parseMoneyToNumber(op.precio_por_persona_raw),
        precio_total: parseMoneyToNumber(op.precio_total_raw),
        incluye: Array.isArray(op.incluye) ? op.incluye : [],
        no_incluye: Array.isArray(op.no_incluye) ? op.no_incluye : [],
        disponibilidad: op.disponibilidad || "",
        link_paquete: op.link_paquete || "",
        notas: op.notas || "",
      }));

      const { error: optsError } = await supabase
        .from("opciones_cotizacion")
        .insert(opcionesToInsert);
      if (optsError) throw optsError;

      alert(`Cotización creada: ${cot.folio || cot.id}`);
      onSuccess && onSuccess();
    } catch (err) {
      console.error("Error creando cotización:", err);
      alert(
        "Error al crear cotización: " + (err.message || JSON.stringify(err))
      );
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft size={20} /> Regresar
        </button>

        <h1 className="text-3xl font-bold text-primary mb-6">
          Nueva Cotización
        </h1>

        {/* Steps */}
        <div className="flex items-center justify-center mb-6">
          <div className="flex items-center gap-4">
            <div
              className={`w-9 h-9 rounded-full flex items-center justify-center ${step >= 1 ? "bg-primary text-white" : "bg-gray-200"}`}
            >
              1
            </div>
            <div
              className={`h-1 w-12 ${step >= 2 ? "bg-primary" : "bg-gray-200"}`}
            />
            <div
              className={`w-9 h-9 rounded-full flex items-center justify-center ${step >= 2 ? "bg-primary text-white" : "bg-gray-200"}`}
            >
              2
            </div>
            <div
              className={`h-1 w-12 ${step >= 3 ? "bg-primary" : "bg-gray-200"}`}
            />
            <div
              className={`w-9 h-9 rounded-full flex items-center justify-center ${step >= 3 ? "bg-primary text-white" : "bg-gray-200"}`}
            >
              3
            </div>
          </div>
        </div>

        {/* STEP 1 */}
        {step === 1 && (
          <div className="bg-white rounded-lg shadow p-6 space-y-4">
            <h2 className="text-xl font-semibold">Paso 1 — Cliente y Viaje</h2>

            <div className="grid grid-cols-1 gap-3">
              <label className="text-sm font-medium">
                Nombre del cliente *
              </label>
              <input
                placeholder="Ej. Juan Pérez"
                value={formData.cliente_nombre}
                onChange={(e) =>
                  setFormData({ ...formData, cliente_nombre: e.target.value })
                }
                className="border rounded px-3 py-2"
              />

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium">Teléfono</label>
                  <input
                    placeholder="55 1234 5678"
                    value={formData.cliente_telefono}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        cliente_telefono: e.target.value,
                      })
                    }
                    className="border rounded px-3 py-2"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Email</label>
                  <input
                    placeholder="cliente@ejemplo.com"
                    value={formData.cliente_email}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        cliente_email: e.target.value,
                      })
                    }
                    className="border rounded px-3 py-2"
                  />
                </div>
              </div>

              <label className="text-sm font-medium">Destino *</label>
              <input
                placeholder="Ej. Cancún, Riviera Maya"
                value={formData.destino}
                onChange={(e) =>
                  setFormData({ ...formData, destino: e.target.value })
                }
                className="border rounded px-3 py-2"
              />

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium">
                    Fecha de salida *
                  </label>
                  <input
                    type="date"
                    value={formData.fecha_salida}
                    onChange={(e) =>
                      setFormData({ ...formData, fecha_salida: e.target.value })
                    }
                    className="border rounded px-3 py-2"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">
                    Fecha de regreso *
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
                    className="border rounded px-3 py-2"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 items-end">
                <div>
                  <label className="text-sm font-medium">Adultos</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.num_adultos}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        num_adultos: Number(e.target.value),
                      })
                    }
                    className="border rounded px-3 py-2"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Niños</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.num_ninos}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        num_ninos: Number(e.target.value),
                      })
                    }
                    className="border rounded px-3 py-2"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Divisa</label>
                  <select
                    value={formData.divisa}
                    onChange={(e) =>
                      setFormData({ ...formData, divisa: e.target.value })
                    }
                    className="border rounded px-3 py-2"
                  >
                    <option value="MXN">MXN (Pesos)</option>
                    <option value="USD">USD (Dólares)</option>
                    <option value="EUR">EUR (Euros)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">
                  Presupuesto aproximado
                </label>
                <input
                  placeholder="12000.00"
                  value={presupuesto.raw}
                  onChange={presupuesto.onChange}
                  onBlur={presupuesto.onBlur}
                  className="border rounded px-3 py-2"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Ejemplo:{" "}
                  {formatMoneyDisplay(
                    presupuesto.getNumber() || 12000,
                    formData.divisa
                  )}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium">Requerimientos</label>
                <textarea
                  placeholder="Vuelos, hotel 4 estrellas, traslado privado..."
                  value={formData.requerimientos}
                  onChange={(e) =>
                    setFormData({ ...formData, requerimientos: e.target.value })
                  }
                  className="border rounded px-3 py-2"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Notas</label>
                <textarea
                  placeholder="Notas internas o para el cliente"
                  value={formData.notas}
                  onChange={(e) =>
                    setFormData({ ...formData, notas: e.target.value })
                  }
                  className="border rounded px-3 py-2"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setStep(2)}
                className="px-4 py-2 bg-primary text-white rounded"
              >
                Siguiente
              </button>
            </div>
          </div>
        )}

        {/* STEP 2 */}
        {step === 2 && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-3">Paso 2 — Opciones</h2>

              <div className="grid grid-cols-1 gap-4">
                {/* operador */}
                <div className="flex flex-col">
                  <label className="text-sm font-medium mb-1">Operador *</label>
                  <select
                    className="border rounded px-3 py-2"
                    value={currentOpcion.operador_id}
                    onChange={(e) =>
                      setCurrentOpcion({
                        ...currentOpcion,
                        operador_id: e.target.value,
                      })
                    }
                  >
                    <option value="">Selecciona operador</option>
                    {operadores.map((op) => (
                      <option key={op.id} value={op.id}>
                        {op.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                {/* nombre paquete */}
                <div className="flex flex-col">
                  <label className="text-sm font-medium mb-1">
                    Nombre del paquete *
                  </label>
                  <input
                    className="border rounded px-3 py-2"
                    placeholder="Ej. Paquete Riviera Maya - Todo Incluido"
                    value={currentOpcion.nombre_paquete}
                    onChange={(e) =>
                      setCurrentOpcion({
                        ...currentOpcion,
                        nombre_paquete: e.target.value,
                      })
                    }
                  />
                </div>

                {/* precios */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col">
                    <label className="text-sm font-medium mb-1">
                      Precio por persona
                    </label>
                    <input
                      className="border rounded px-3 py-2"
                      placeholder="6000.00"
                      value={currentOpcion.precio_por_persona_raw}
                      onChange={(e) => {
                        if (
                          /^[0-9]*\.?[0-9]*$/.test(e.target.value) ||
                          e.target.value === ""
                        )
                          setCurrentOpcion({
                            ...currentOpcion,
                            precio_por_persona_raw: e.target.value,
                          });
                      }}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {currentOpcion.precio_por_persona_raw
                        ? formatMoneyDisplay(
                            parseMoneyToNumber(
                              currentOpcion.precio_por_persona_raw
                            ),
                            formData.divisa
                          )
                        : ""}
                    </p>
                  </div>

                  <div className="flex flex-col">
                    <label className="text-sm font-medium mb-1">
                      Precio total *
                    </label>
                    <input
                      className="border rounded px-3 py-2"
                      placeholder="12000.00"
                      value={currentOpcion.precio_total_raw}
                      onChange={(e) => {
                        if (
                          /^[0-9]*\.?[0-9]*$/.test(e.target.value) ||
                          e.target.value === ""
                        )
                          setCurrentOpcion({
                            ...currentOpcion,
                            precio_total_raw: e.target.value,
                          });
                      }}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {currentOpcion.precio_total_raw
                        ? formatMoneyDisplay(
                            parseMoneyToNumber(currentOpcion.precio_total_raw),
                            formData.divisa
                          )
                        : ""}
                    </p>
                  </div>
                </div>

                {/* incluye / no incluye */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col">
                    <label className="text-sm font-medium mb-1">
                      Incluye (separado por comas)
                    </label>
                    <textarea
                      rows={3}
                      className="border rounded px-3 py-2"
                      placeholder="Vuelos, Hotel, Traslados"
                      value={incluyeText}
                      onChange={(e) => setIncluyeText(e.target.value)}
                    />
                  </div>

                  <div className="flex flex-col">
                    <label className="text-sm font-medium mb-1">
                      No incluye (separado por comas)
                    </label>
                    <textarea
                      rows={3}
                      className="border rounded px-3 py-2"
                      placeholder="Propinas, bebidas premium"
                      value={noIncluyeText}
                      onChange={(e) => setNoIncluyeText(e.target.value)}
                    />
                  </div>
                </div>

                {/* disponibilidad / link / notas */}
                <div className="grid grid-cols-1 gap-3">
                  <div className="flex flex-col">
                    <label className="text-sm font-medium mb-1">
                      Disponibilidad
                    </label>
                    <input
                      className="border rounded px-3 py-2"
                      placeholder="Sujeto a disponibilidad"
                      value={currentOpcion.disponibilidad}
                      onChange={(e) =>
                        setCurrentOpcion({
                          ...currentOpcion,
                          disponibilidad: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="flex flex-col">
                    <label className="text-sm font-medium mb-1">
                      Link del paquete
                    </label>
                    <input
                      className="border rounded px-3 py-2"
                      placeholder="https://..."
                      value={currentOpcion.link_paquete}
                      onChange={(e) =>
                        setCurrentOpcion({
                          ...currentOpcion,
                          link_paquete: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>

                <div className="flex gap-2 mt-2">
                  <button
                    onClick={addOpcion}
                    className="bg-green-600 text-white px-4 py-2 rounded flex items-center gap-2"
                  >
                    <Plus size={16} /> Agregar opción
                  </button>
                  <button
                    onClick={() => {
                      setCurrentOpcion({
                        operador_id: "",
                        nombre_paquete: "",
                        precio_por_persona_raw: "",
                        precio_total_raw: "",
                        incluye: [],
                        no_incluye: [],
                        disponibilidad: "",
                        link_paquete: "",
                        notas: "",
                      });
                      setIncluyeText("");
                      setNoIncluyeText("");
                    }}
                    className="bg-gray-200 px-4 py-2 rounded"
                  >
                    Limpiar
                  </button>
                </div>
              </div>
            </div>

            {opciones.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="font-semibold mb-3">
                  Opciones agregadas ({opciones.length})
                </h3>
                <div className="space-y-3">
                  {opciones.map((op) => (
                    <div
                      key={op.temp_id}
                      className="border rounded p-3 flex justify-between items-start"
                    >
                      <div>
                        <p className="font-medium">{op.nombre_paquete}</p>
                        <p className="text-sm text-gray-600">
                          {
                            operadores.find((x) => x.id === op.operador_id)
                              ?.nombre
                          }
                        </p>
                        <p className="text-sm font-semibold">
                          {formData.divisa}{" "}
                          {formatMoneyDisplay(
                            parseMoneyToNumber(op.precio_total_raw) ??
                              op.precio_total_raw,
                            formData.divisa
                          )}
                        </p>
                        {op.incluye && op.incluye.length > 0 && (
                          <p className="text-sm text-gray-600">
                            Incluye: {op.incluye.join(", ")}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => removeOpcion(op.temp_id)}
                        className="text-red-600 p-2 rounded hover:bg-red-50"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-4">
              <button
                onClick={() => setStep(1)}
                className="bg-gray-200 px-4 py-2 rounded"
              >
                Anterior
              </button>
              <button
                onClick={() => setStep(3)}
                disabled={opciones.length === 0}
                className="bg-primary text-white px-4 py-2 rounded disabled:bg-gray-300"
              >
                Siguiente
              </button>
            </div>
          </div>
        )}

        {/* STEP 3 */}
        {step === 3 && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">
              Paso 3 — Revisar y Guardar
            </h2>

            <div className="space-y-4">
              <div>
                <h3 className="font-semibold">Cliente</h3>
                <p>{formData.cliente_nombre}</p>
                {formData.cliente_telefono && (
                  <p className="text-sm text-gray-600">
                    {formData.cliente_telefono}
                  </p>
                )}
                {formData.cliente_email && (
                  <p className="text-sm text-gray-600">
                    {formData.cliente_email}
                  </p>
                )}
              </div>

              <div>
                <h3 className="font-semibold">Viaje</h3>
                <p>{formData.destino}</p>
                <p className="text-sm text-gray-600">
                  {formatDateString(formData.fecha_salida)} →{" "}
                  {formatDateString(formData.fecha_regreso)}
                </p>
                <p className="text-sm text-gray-600">
                  {formData.num_adultos} adultos, {formData.num_ninos} niños
                </p>
                <p className="text-sm text-gray-600">
                  Presupuesto: {formData.divisa}{" "}
                  {formatMoneyDisplay(
                    presupuesto.getNumber() ?? 0,
                    formData.divisa
                  )}
                </p>
              </div>

              <div>
                <h3 className="font-semibold">Opciones ({opciones.length})</h3>
                {opciones.map((op, idx) => (
                  <div key={op.temp_id} className="mt-2 p-3 bg-gray-50 rounded">
                    <p className="font-medium">
                      Opción {idx + 1}: {op.nombre_paquete}
                    </p>
                    <p className="text-sm text-gray-600">
                      {operadores.find((x) => x.id === op.operador_id)?.nombre}
                    </p>
                    <p className="text-sm font-semibold text-primary">
                      {formData.divisa}{" "}
                      {formatMoneyDisplay(
                        parseMoneyToNumber(op.precio_total_raw) ?? 0,
                        formData.divisa
                      )}
                    </p>
                    {op.incluye && op.incluye.length > 0 && (
                      <p className="text-sm text-gray-600">
                        Incluye: {op.incluye.join(", ")}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-4 mt-6">
              <button
                onClick={() => setStep(2)}
                className="bg-gray-200 px-6 py-2 rounded"
              >
                Anterior
              </button>
              <button
                onClick={guardarCotizacion}
                className="bg-green-600 text-white px-6 py-2 rounded"
              >
                Guardar Cotización
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
