import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase";
import { ArrowLeft, Edit2, Trash2, Save, X, Plus } from "lucide-react";
import ExportToWhatsApp from "../components/export/ExportToWhatsApp";
import ExportToPDF from "../components/export/ExportToPDF";

export default function DetallesCotizacion({
  cotizacionId,
  onBack,
  onDeleted,
}) {
  const [cotizacion, setCotizacion] = useState(null);
  const [opciones, setOpciones] = useState([]);
  const [operadores, setOperadores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState(null);
  const [editingOpciones, setEditingOpciones] = useState([]);
  const [newOpcion, setNewOpcion] = useState({
    operador_id: "",
    nombre_paquete: "",
    precio_por_persona: "",
    precio_total: "",
    incluye: "",
    no_incluye: "",
    disponibilidad: "",
    link_paquete: "",
  });
  const [showAddOpcion, setShowAddOpcion] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const result1 = await supabase
        .from("cotizaciones")
        .select("*")
        .eq("id", cotizacionId)
        .single();
      if (result1.error) throw result1.error;
      setCotizacion(result1.data);
      setEditData(result1.data);

      const result2 = await supabase
        .from("opciones_cotizacion")
        .select("*")
        .eq("cotizacion_id", cotizacionId);
      if (result2.error) throw result2.error;
      setOpciones(result2.data || []);
      setEditingOpciones(result2.data || []);

      const result3 = await supabase
        .from("operadores")
        .select("*")
        .eq("activo", true);
      if (result3.error) throw result3.error;
      setOperadores(result3.data || []);
    } catch (error) {
      console.error("Error:", error);
      alert("Error al cargar cotización");
    } finally {
      setLoading(false);
    }
  }, [cotizacionId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function handleSave() {
    try {
      const result = await supabase
        .from("cotizaciones")
        .update(editData)
        .eq("id", cotizacionId);
      if (result.error) throw result.error;

      const opcionesIdsActuales = editingOpciones
        .filter((op) => op.id)
        .map((op) => op.id);
      const opcionesOriginales = opciones.map((op) => op.id);
      const opcionesAEliminar = opcionesOriginales.filter(
        (id) => !opcionesIdsActuales.includes(id)
      );

      if (opcionesAEliminar.length > 0) {
        const deleteResult = await supabase
          .from("opciones_cotizacion")
          .delete()
          .in("id", opcionesAEliminar);
        if (deleteResult.error) throw deleteResult.error;
      }

      for (const op of editingOpciones) {
        const opcionData = {
          cotizacion_id: cotizacionId,
          operador_id: op.operador_id,
          nombre_paquete: op.nombre_paquete,
          precio_por_persona: parseFloat(op.precio_por_persona) || 0,
          precio_total: parseFloat(op.precio_total),
          incluye:
            typeof op.incluye === "string"
              ? op.incluye.split(",").map((i) => i.trim())
              : op.incluye,
          no_incluye:
            typeof op.no_incluye === "string"
              ? op.no_incluye.split(",").map((i) => i.trim())
              : op.no_incluye,
          disponibilidad: op.disponibilidad,
          link_paquete: op.link_paquete,
        };

        if (op.id) {
          const updateResult = await supabase
            .from("opciones_cotizacion")
            .update(opcionData)
            .eq("id", op.id);
          if (updateResult.error) throw updateResult.error;
        } else {
          const insertResult = await supabase
            .from("opciones_cotizacion")
            .insert([opcionData]);
          if (insertResult.error) throw insertResult.error;
        }
      }

      setCotizacion(editData);
      setEditing(false);
      setShowAddOpcion(false);
      alert("Cotización actualizada");
      fetchData();
    } catch (error) {
      console.error("Error:", error);
      alert("Error al actualizar: " + error.message);
    }
  }

  async function handleDelete() {
    if (!confirm("¿Seguro que quieres eliminar esta cotización?")) return;

    try {
      const result = await supabase
        .from("cotizaciones")
        .delete()
        .eq("id", cotizacionId);
      if (result.error) throw result.error;
      alert("Cotización eliminada");
      onDeleted();
    } catch (error) {
      console.error("Error:", error);
      alert("Error al eliminar");
    }
  }

  function handleRemoveOpcion(index) {
    const updated = editingOpciones.filter((_, i) => i !== index);
    setEditingOpciones(updated);
  }

  function handleAddOpcion() {
    if (
      !newOpcion.operador_id ||
      !newOpcion.nombre_paquete ||
      !newOpcion.precio_total
    ) {
      alert("Completa los campos obligatorios");
      return;
    }
    setEditingOpciones([
      ...editingOpciones,
      { ...newOpcion, temp_id: Date.now() },
    ]);
    setNewOpcion({
      operador_id: "",
      nombre_paquete: "",
      precio_por_persona: "",
      precio_total: "",
      incluye: "",
      no_incluye: "",
      disponibilidad: "",
      link_paquete: "",
    });
    setShowAddOpcion(false);
  }

  function handleUpdateOpcion(index, field, value) {
    const updated = [...editingOpciones];
    updated[index] = { ...updated[index], [field]: value };
    setEditingOpciones(updated);
  }

  function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString("es-MX", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  function getOperadorNombre(operadorId) {
    const op = operadores.find((o) => o.id === operadorId);
    return op?.nombre || "Desconocido";
  }

  if (loading) return <div className="p-8">Cargando...</div>;
  if (!cotizacion) return <div className="p-8">Cotización no encontrada</div>;

  const presupuesto = parseFloat(cotizacion.presupuesto_aprox) || 0;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-gray-600 hover:text-primary mb-6"
        >
          <ArrowLeft size={20} />
          Regresar
        </button>

        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-3xl font-bold text-primary">
                {cotizacion.folio}
              </h1>
              <p className="text-gray-600 mt-1">
                Creada el {formatDate(cotizacion.created_at)}
              </p>
            </div>

            <div className="flex gap-2">
              {!editing && (
                <>
                  <button
                    onClick={() => setEditing(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    <Edit2 size={18} />
                    Editar
                  </button>
                  <ExportToWhatsApp
                    cotizacion={cotizacion}
                    opciones={opciones}
                    operadores={operadores}
                  />
                  <ExportToPDF
                    cotizacion={cotizacion}
                    opciones={opciones}
                    operadores={operadores}
                  />
                  <button
                    onClick={handleDelete}
                    className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                  >
                    <Trash2 size={18} />
                    Eliminar
                  </button>
                </>
              )}

              {editing && (
                <>
                  <button
                    onClick={handleSave}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    <Save size={18} />
                    Guardar
                  </button>
                  <button
                    onClick={() => {
                      setEditing(false);
                      setEditData(cotizacion);
                      setEditingOpciones(opciones);
                      setShowAddOpcion(false);
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                  >
                    <X size={18} />
                    Cancelar
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="border-l-4 border-primary pl-4">
              <h3 className="font-semibold text-gray-700 mb-4">
                Datos del Cliente
              </h3>
              {!editing ? (
                <div className="space-y-2 text-sm">
                  <p>
                    <span className="font-medium">Nombre:</span>{" "}
                    {cotizacion.cliente_nombre}
                  </p>
                  {cotizacion.cliente_telefono && (
                    <p>
                      <span className="font-medium">Teléfono:</span>{" "}
                      {cotizacion.cliente_telefono}
                    </p>
                  )}
                  {cotizacion.cliente_email && (
                    <p>
                      <span className="font-medium">Email:</span>{" "}
                      {cotizacion.cliente_email}
                    </p>
                  )}
                  <p>
                    <span className="font-medium">Contactó por:</span>{" "}
                    {cotizacion.origen_lead}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <input
                    type="text"
                    value={editData.cliente_nombre}
                    onChange={(e) =>
                      setEditData({
                        ...editData,
                        cliente_nombre: e.target.value,
                      })
                    }
                    className="w-full border rounded-lg px-4 py-2"
                    placeholder="Nombre"
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <input
                      type="tel"
                      value={editData.cliente_telefono || ""}
                      onChange={(e) =>
                        setEditData({
                          ...editData,
                          cliente_telefono: e.target.value,
                        })
                      }
                      className="w-full border rounded-lg px-4 py-2"
                      placeholder="Teléfono"
                    />
                    <input
                      type="email"
                      value={editData.cliente_email || ""}
                      onChange={(e) =>
                        setEditData({
                          ...editData,
                          cliente_email: e.target.value,
                        })
                      }
                      className="w-full border rounded-lg px-4 py-2"
                      placeholder="Email"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="border-l-4 border-primary-light pl-4">
              <h3 className="font-semibold text-gray-700 mb-4">
                Detalles del Viaje
              </h3>
              {!editing ? (
                <div className="space-y-2 text-sm">
                  <p>
                    <span className="font-medium">Destino:</span>{" "}
                    {cotizacion.destino}
                  </p>
                  <p>
                    <span className="font-medium">Fechas:</span>{" "}
                    {formatDate(cotizacion.fecha_salida)} -{" "}
                    {formatDate(cotizacion.fecha_regreso)}
                  </p>
                  <p>
                    <span className="font-medium">Viajeros:</span>{" "}
                    {cotizacion.num_adultos} adulto(s), {cotizacion.num_ninos}{" "}
                    niño(s)
                  </p>
                  {cotizacion.presupuesto_aprox && (
                    <p>
                      <span className="font-medium">Presupuesto:</span> $
                      {presupuesto.toLocaleString("es-MX")}
                    </p>
                  )}
                  {cotizacion.requerimientos && (
                    <p>
                      <span className="font-medium">Requerimientos:</span>{" "}
                      {cotizacion.requerimientos}
                    </p>
                  )}
                  {cotizacion.notas && (
                    <p>
                      <span className="font-medium">Notas:</span>{" "}
                      {cotizacion.notas}
                    </p>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <input
                    type="text"
                    value={editData.destino}
                    onChange={(e) =>
                      setEditData({ ...editData, destino: e.target.value })
                    }
                    className="w-full border rounded-lg px-4 py-2"
                    placeholder="Destino"
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <input
                      type="date"
                      value={editData.fecha_salida}
                      onChange={(e) =>
                        setEditData({
                          ...editData,
                          fecha_salida: e.target.value,
                        })
                      }
                      className="w-full border rounded-lg px-4 py-2"
                    />
                    <input
                      type="date"
                      value={editData.fecha_regreso}
                      onChange={(e) =>
                        setEditData({
                          ...editData,
                          fecha_regreso: e.target.value,
                        })
                      }
                      className="w-full border rounded-lg px-4 py-2"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <input
                      type="number"
                      value={editData.num_adultos}
                      onChange={(e) =>
                        setEditData({
                          ...editData,
                          num_adultos: parseInt(e.target.value),
                        })
                      }
                      className="w-full border rounded-lg px-4 py-2"
                      placeholder="Adultos"
                    />
                    <input
                      type="number"
                      value={editData.num_ninos}
                      onChange={(e) =>
                        setEditData({
                          ...editData,
                          num_ninos: parseInt(e.target.value),
                        })
                      }
                      className="w-full border rounded-lg px-4 py-2"
                      placeholder="Niños"
                    />
                    <input
                      type="number"
                      value={editData.presupuesto_aprox || ""}
                      onChange={(e) =>
                        setEditData({
                          ...editData,
                          presupuesto_aprox: e.target.value,
                        })
                      }
                      className="w-full border rounded-lg px-4 py-2"
                      placeholder="Presupuesto"
                    />
                  </div>
                  <textarea
                    value={editData.requerimientos || ""}
                    onChange={(e) =>
                      setEditData({
                        ...editData,
                        requerimientos: e.target.value,
                      })
                    }
                    className="w-full border rounded-lg px-4 py-2"
                    rows="2"
                    placeholder="Requerimientos"
                  />
                  <textarea
                    value={editData.notas || ""}
                    onChange={(e) =>
                      setEditData({ ...editData, notas: e.target.value })
                    }
                    className="w-full border rounded-lg px-4 py-2"
                    rows="2"
                    placeholder="Notas internas"
                  />
                </div>
              )}
            </div>

            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-gray-700">
                  Opciones de Paquetes (
                  {editing ? editingOpciones.length : opciones.length})
                </h3>
                {editing && (
                  <button
                    onClick={() => setShowAddOpcion(!showAddOpcion)}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                  >
                    <Plus size={16} />
                    Agregar Opción
                  </button>
                )}
              </div>

              {editing && showAddOpcion && (
                <div className="bg-blue-50 border-2 border-dashed border-blue-300 rounded-lg p-6 mb-4">
                  <h4 className="font-semibold mb-4">Nueva Opción</h4>
                  <div className="space-y-4">
                    <select
                      value={newOpcion.operador_id}
                      onChange={(e) =>
                        setNewOpcion({
                          ...newOpcion,
                          operador_id: e.target.value,
                        })
                      }
                      className="w-full border rounded-lg px-4 py-2"
                    >
                      <option value="">Selecciona operador</option>
                      {operadores.map((op) => (
                        <option key={op.id} value={op.id}>
                          {op.nombre}
                        </option>
                      ))}
                    </select>
                    <input
                      type="text"
                      value={newOpcion.nombre_paquete}
                      onChange={(e) =>
                        setNewOpcion({
                          ...newOpcion,
                          nombre_paquete: e.target.value,
                        })
                      }
                      className="w-full border rounded-lg px-4 py-2"
                      placeholder="Nombre del paquete"
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <input
                        type="number"
                        value={newOpcion.precio_por_persona}
                        onChange={(e) =>
                          setNewOpcion({
                            ...newOpcion,
                            precio_por_persona: e.target.value,
                          })
                        }
                        className="w-full border rounded-lg px-4 py-2"
                        placeholder="Precio por persona"
                      />
                      <input
                        type="number"
                        value={newOpcion.precio_total}
                        onChange={(e) =>
                          setNewOpcion({
                            ...newOpcion,
                            precio_total: e.target.value,
                          })
                        }
                        className="w-full border rounded-lg px-4 py-2"
                        placeholder="Precio total"
                      />
                    </div>
                    <input
                      type="text"
                      value={newOpcion.incluye}
                      onChange={(e) =>
                        setNewOpcion({ ...newOpcion, incluye: e.target.value })
                      }
                      className="w-full border rounded-lg px-4 py-2"
                      placeholder="Incluye (separado por comas)"
                    />
                    <input
                      type="text"
                      value={newOpcion.no_incluye}
                      onChange={(e) =>
                        setNewOpcion({
                          ...newOpcion,
                          no_incluye: e.target.value,
                        })
                      }
                      className="w-full border rounded-lg px-4 py-2"
                      placeholder="No incluye (separado por comas)"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={handleAddOpcion}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                      >
                        Agregar
                      </button>
                      <button
                        onClick={() => setShowAddOpcion(false)}
                        className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                {(editing ? editingOpciones : opciones).map((op, idx) => {
                  const precioOpcion = parseFloat(op.precio_total);
                  const diferencia = presupuesto - precioOpcion;
                  const incluyeArray =
                    typeof op.incluye === "string"
                      ? op.incluye.split(",")
                      : op.incluye || [];
                  const noIncluyeArray =
                    typeof op.no_incluye === "string"
                      ? op.no_incluye.split(",")
                      : op.no_incluye || [];

                  return (
                    <div
                      key={op.id || op.temp_id || idx}
                      className="border rounded-lg p-6 bg-gray-50"
                    >
                      {presupuesto > 0 && !editing && (
                        <div className="bg-blue-50 border-l-4 border-blue-500 p-3 mb-4 text-sm">
                          <div className="grid grid-cols-3 gap-2">
                            <div>
                              <p className="text-gray-600 text-xs">
                                Presupuesto:
                              </p>
                              <p className="font-bold">
                                ${presupuesto.toLocaleString("es-MX")}
                              </p>
                            </div>
                            <div>
                              <p className="text-gray-600 text-xs">
                                Esta opción:
                              </p>
                              <p className="font-bold text-primary">
                                ${precioOpcion.toLocaleString("es-MX")}
                              </p>
                            </div>
                            <div>
                              <p className="text-gray-600 text-xs">
                                Diferencia:
                              </p>
                              <p
                                className={`font-bold ${diferencia >= 0 ? "text-green-600" : "text-red-600"}`}
                              >
                                {diferencia >= 0 ? "-" : "+"} $
                                {Math.abs(diferencia).toLocaleString("es-MX")}
                              </p>
                              {diferencia >= 0 ? (
                                <p className="text-xs text-green-600">
                                  Dentro de presupuesto
                                </p>
                              ) : (
                                <p className="text-xs text-red-600">
                                  Excede{" "}
                                  {(
                                    (Math.abs(diferencia) / presupuesto) *
                                    100
                                  ).toFixed(1)}
                                  %
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      {editing ? (
                        <div className="space-y-4">
                          <div className="flex justify-between items-start">
                            <h4 className="font-semibold text-lg">
                              Opción {idx + 1}
                            </h4>
                            <button
                              onClick={() => handleRemoveOpcion(idx)}
                              className="text-red-600 hover:bg-red-50 p-2 rounded"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                          <select
                            value={op.operador_id}
                            onChange={(e) =>
                              handleUpdateOpcion(
                                idx,
                                "operador_id",
                                e.target.value
                              )
                            }
                            className="w-full border rounded-lg px-4 py-2"
                          >
                            <option value="">Selecciona operador</option>
                            {operadores.map((operador) => (
                              <option key={operador.id} value={operador.id}>
                                {operador.nombre}
                              </option>
                            ))}
                          </select>
                          <input
                            type="text"
                            value={op.nombre_paquete}
                            onChange={(e) =>
                              handleUpdateOpcion(
                                idx,
                                "nombre_paquete",
                                e.target.value
                              )
                            }
                            className="w-full border rounded-lg px-4 py-2"
                            placeholder="Nombre del paquete"
                          />
                          <div className="grid grid-cols-2 gap-4">
                            <input
                              type="number"
                              value={op.precio_por_persona}
                              onChange={(e) =>
                                handleUpdateOpcion(
                                  idx,
                                  "precio_por_persona",
                                  e.target.value
                                )
                              }
                              className="w-full border rounded-lg px-4 py-2"
                              placeholder="Precio por persona"
                            />
                            <input
                              type="number"
                              value={op.precio_total}
                              onChange={(e) =>
                                handleUpdateOpcion(
                                  idx,
                                  "precio_total",
                                  e.target.value
                                )
                              }
                              className="w-full border rounded-lg px-4 py-2"
                              placeholder="Precio total"
                            />
                          </div>
                          <input
                            type="text"
                            value={
                              typeof op.incluye === "string"
                                ? op.incluye
                                : op.incluye?.join(", ") || ""
                            }
                            onChange={(e) =>
                              handleUpdateOpcion(idx, "incluye", e.target.value)
                            }
                            className="w-full border rounded-lg px-4 py-2"
                            placeholder="Incluye (separado por comas)"
                          />
                          <input
                            type="text"
                            value={
                              typeof op.no_incluye === "string"
                                ? op.no_incluye
                                : op.no_incluye?.join(", ") || ""
                            }
                            onChange={(e) =>
                              handleUpdateOpcion(
                                idx,
                                "no_incluye",
                                e.target.value
                              )
                            }
                            className="w-full border rounded-lg px-4 py-2"
                            placeholder="No incluye (separado por comas)"
                          />
                        </div>
                      ) : (
                        <>
                          <div className="flex justify-between items-start mb-4">
                            <h4 className="font-semibold text-lg">
                              Opción {idx + 1}
                            </h4>
                            <span className="text-2xl font-bold text-primary">
                              ${precioOpcion.toLocaleString("es-MX")}
                            </span>
                          </div>
                          <p className="font-medium text-gray-900">
                            {op.nombre_paquete}
                          </p>
                          <p className="text-sm text-gray-600 mt-1">
                            Operador: {getOperadorNombre(op.operador_id)}
                          </p>

                          {op.precio_por_persona > 0 && (
                            <p className="text-sm text-gray-600 mt-2">
                              Precio por persona: $
                              {parseFloat(op.precio_por_persona).toLocaleString(
                                "es-MX"
                              )}
                            </p>
                          )}

                          {incluyeArray.length > 0 && (
                            <div className="mt-4">
                              <p className="text-sm font-medium text-gray-700">
                                Incluye:
                              </p>
                              <ul className="text-sm text-gray-600 ml-4 mt-1 list-disc">
                                {incluyeArray.map((item, i) => (
                                  <li key={i}>{item.trim()}</li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {noIncluyeArray.length > 0 && (
                            <div className="mt-3">
                              <p className="text-sm font-medium text-gray-700">
                                No incluye:
                              </p>
                              <ul className="text-sm text-gray-600 ml-4 mt-1 list-disc">
                                {noIncluyeArray.map((item, i) => (
                                  <li key={i}>{item.trim()}</li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {op.disponibilidad && (
                            <p className="text-sm text-gray-500 mt-3 italic">
                              {op.disponibilidad}
                            </p>
                          )}

                          {op.link_paquete && (
                            <a
                              href={op.link_paquete}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-blue-600 hover:underline mt-2 inline-block"
                            >
                              Ver paquete original
                            </a>
                          )}
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
