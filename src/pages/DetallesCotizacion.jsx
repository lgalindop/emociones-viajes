import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase";
import {
  ArrowLeft,
  Edit2,
  Trash2,
  Save,
  X,
  Plus,
  Calendar,
  Plane,
} from "lucide-react";
import LeadOriginIcon from "../components/LeadOriginIcon";
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
    incluye: "",
    no_incluye: "",
    link_paquete: "",
    tour_link: "",
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

  // Recalculate all option totals when viajeros counts change
  useEffect(() => {
    if (!editing || !editData) return;

    const recalculated = editingOpciones.map((op) => {
      const adulto = parseFloat(op.precio_adulto) || 0;
      const menor = parseFloat(op.precio_menor) || 0;
      const infante = parseFloat(op.precio_infante) || 0;
      const total =
        adulto * (editData.num_adultos || 0) +
        menor * (editData.num_ninos || 0) +
        infante * (editData.num_infantes || 0);

      return { ...op, precio_total: total.toString() };
    });

    setEditingOpciones(recalculated);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editData?.num_adultos, editData?.num_ninos, editData?.num_infantes]);

  async function handleSave() {
    try {
      const result = await supabase
        .from("cotizaciones")
        .update({
          ...editData,
          fecha_salida: editData.fecha_salida
            ? editData.fecha_salida + "T12:00:00"
            : null,
          fecha_regreso: editData.fecha_regreso
            ? editData.fecha_regreso + "T12:00:00"
            : null,
          vigente_hasta: editData.vigente_hasta
            ? editData.vigente_hasta + "T12:00:00"
            : null,
        })
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
          servicio_descripcion: op.servicio_descripcion,
          hotel_nombre: op.hotel_nombre,
          ocupacion: op.ocupacion,
          vuelo_ida_fecha: op.vuelo_ida_fecha
            ? op.vuelo_ida_fecha + "T12:00:00"
            : null,
          vuelo_ida_horario: op.vuelo_ida_horario,
          vuelo_ida_ruta: op.vuelo_ida_ruta,
          vuelo_ida_directo: op.vuelo_ida_directo || false,
          vuelo_regreso_fecha: op.vuelo_regreso_fecha
            ? op.vuelo_regreso_fecha + "T12:00:00"
            : null,
          vuelo_regreso_horario: op.vuelo_regreso_horario,
          vuelo_regreso_ruta: op.vuelo_regreso_ruta,
          vuelo_regreso_directo: op.vuelo_regreso_directo || false,
          precio_adulto: parseFloat(op.precio_adulto) || 0,
          precio_menor: parseFloat(op.precio_menor) || 0,
          precio_infante: parseFloat(op.precio_infante) || 0,
          precio_total: parseFloat(op.precio_total),
          incluye:
            typeof op.incluye === "string"
              ? op.incluye.split(",").map((i) => i.trim())
              : op.incluye,
          no_incluye:
            typeof op.no_incluye === "string"
              ? op.no_incluye.split(",").map((i) => i.trim())
              : op.no_incluye,
          link_paquete: op.link_paquete,
          tour_link: op.tour_link,
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
      incluye: "",
      no_incluye: "",
      link_paquete: "",
      tour_link: "",
    });
    setShowAddOpcion(false);
  }

  function handleUpdateOpcion(index, field, value) {
    const updated = [...editingOpciones];
    updated[index] = { ...updated[index], [field]: value };
    setEditingOpciones(updated);
  }

  function formatDate(dateString) {
    if (!dateString) return "";
    // Check if it's a date-only string (YYYY-MM-DD) or a full timestamp
    if (dateString.includes("T") || dateString.length > 10) {
      // Full timestamp - use normal Date parsing
      const date = new Date(dateString);
      return date.toLocaleDateString("es-MX", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } else {
      // Date-only string - parse in local timezone
      const parts = dateString.split("-");
      const [year, month, day] = parts.map(Number);
      const date = new Date(year, month - 1, day);
      return date.toLocaleDateString("es-MX", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    }
  }

  function getOperadorNombre(operadorId) {
    const op = operadores.find((o) => o.id === operadorId);
    return op?.nombre || "Desconocido";
  }

  if (loading) return <div className="p-8">Cargando...</div>;
  if (!cotizacion) return <div className="p-8">Cotización no encontrada</div>;

  const presupuesto = parseFloat(cotizacion.presupuesto_aprox) || 0;

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8 pb-24 md:pb-8">
      <div className="max-w-6xl mx-auto">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft size={20} />
          Volver
        </button>

        {/* Header Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold text-gray-900">
                  {cotizacion.folio}
                </h1>
                <LeadOriginIcon origin={cotizacion.origen} />
              </div>
              <p className="text-gray-600">{cotizacion.cliente_nombre}</p>
            </div>

            <div className="flex flex-wrap gap-2">
              <ExportToPDF
                cotizacion={cotizacion}
                opciones={opciones}
                operadores={operadores}
              />
              {!editing ? (
                <>
                  <button
                    onClick={() => setEditing(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    <Edit2 size={18} />
                    Editar
                  </button>
                  <button
                    onClick={handleDelete}
                    className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                  >
                    <Trash2 size={18} />
                    Eliminar
                  </button>
                </>
              ) : (
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
                      setEditingOpciones(
                        opciones.map((op) => ({
                          ...op,
                          precio_por_persona: op.precio_por_persona ?? "",
                          vuelo_ida_fecha: op.vuelo_ida_fecha ?? "",
                          vuelo_ida_horario: op.vuelo_ida_horario ?? "",
                          vuelo_ida_ruta: op.vuelo_ida_ruta ?? "",
                          vuelo_regreso_fecha: op.vuelo_regreso_fecha ?? "",
                          vuelo_regreso_horario: op.vuelo_regreso_horario ?? "",
                          vuelo_regreso_ruta: op.vuelo_regreso_ruta ?? "",
                        }))
                      );
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

          {/* Cotización Dates - Professional Display */}
          <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <p className="text-xs font-semibold text-blue-700 mb-1">
                  Fecha de Creación
                </p>
                <p className="text-sm text-gray-900">
                  {cotizacion.created_at
                    ? formatDate(cotizacion.created_at)
                    : "No especificada"}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold text-blue-700 mb-1">
                  Vigente Hasta
                </p>
                <p className="text-sm text-gray-900">
                  {cotizacion.vigente_hasta
                    ? formatDate(cotizacion.vigente_hasta)
                    : "No especificada"}
                </p>
              </div>
            </div>
          </div>

          {/* Edit Mode for Dates */}
          {editing && (
            <div className="mb-6 inline-block">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Vigente Hasta
                </label>
                <input
                  type="date"
                  value={editData.vigente_hasta || ""}
                  onChange={(e) =>
                    setEditData({ ...editData, vigente_hasta: e.target.value })
                  }
                  className="w-full border rounded-lg px-3 py-2"
                />
              </div>
            </div>
          )}

          {/* Status */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-600">Estatus:</span>
            <span
              className={`px-3 py-1 rounded-full text-xs font-medium ${
                cotizacion.pipeline_stage === "lead"
                  ? "bg-gray-100 text-gray-800"
                  : cotizacion.pipeline_stage === "qualification"
                    ? "bg-blue-100 text-blue-800"
                    : cotizacion.pipeline_stage === "quote_sent"
                      ? "bg-purple-100 text-purple-800"
                      : cotizacion.pipeline_stage === "negotiation"
                        ? "bg-yellow-100 text-yellow-800"
                        : cotizacion.pipeline_stage === "booking_confirmed"
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
              }`}
            >
              {cotizacion.pipeline_stage === "lead"
                ? "Lead"
                : cotizacion.pipeline_stage === "qualification"
                  ? "En Cotización"
                  : cotizacion.pipeline_stage === "quote_sent"
                    ? "Cotización Enviada"
                    : cotizacion.pipeline_stage === "negotiation"
                      ? "Negociación"
                      : cotizacion.pipeline_stage === "booking_confirmed"
                        ? "Ganada"
                        : "Perdida"}
            </span>
          </div>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Client Info */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Información del Cliente
            </h2>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-gray-500 mb-1">Nombre</p>
                {editing ? (
                  <input
                    type="text"
                    value={editData.cliente_nombre}
                    onChange={(e) =>
                      setEditData({
                        ...editData,
                        cliente_nombre: e.target.value,
                      })
                    }
                    className="w-full border rounded-lg px-3 py-2"
                  />
                ) : (
                  <p className="text-sm font-medium text-gray-900">
                    {cotizacion.cliente_nombre}
                  </p>
                )}
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Teléfono</p>
                {editing ? (
                  <input
                    type="text"
                    value={editData.cliente_telefono || ""}
                    onChange={(e) =>
                      setEditData({
                        ...editData,
                        cliente_telefono: e.target.value,
                      })
                    }
                    className="w-full border rounded-lg px-3 py-2"
                  />
                ) : (
                  <p className="text-sm text-gray-700">
                    {cotizacion.cliente_telefono || "N/A"}
                  </p>
                )}
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Email</p>
                {editing ? (
                  <input
                    type="email"
                    value={editData.cliente_email || ""}
                    onChange={(e) =>
                      setEditData({
                        ...editData,
                        cliente_email: e.target.value,
                      })
                    }
                    className="w-full border rounded-lg px-3 py-2"
                  />
                ) : (
                  <p className="text-sm text-gray-700">
                    {cotizacion.cliente_email || "N/A"}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Trip Details */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Detalles del Viaje
            </h2>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-gray-500 mb-1">Destino</p>
                {editing ? (
                  <input
                    type="text"
                    value={editData.destino}
                    onChange={(e) =>
                      setEditData({ ...editData, destino: e.target.value })
                    }
                    className="w-full border rounded-lg px-3 py-2"
                  />
                ) : (
                  <p className="text-sm font-medium text-gray-900">
                    {cotizacion.destino}
                  </p>
                )}
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Fechas</p>
                {editing ? (
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="date"
                      value={editData.fecha_salida}
                      onChange={(e) =>
                        setEditData({
                          ...editData,
                          fecha_salida: e.target.value,
                        })
                      }
                      className="border rounded-lg px-3 py-2"
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
                      className="border rounded-lg px-3 py-2"
                    />
                  </div>
                ) : (
                  <p className="text-sm text-gray-700">
                    {formatDate(cotizacion.fecha_salida)} -{" "}
                    {formatDate(cotizacion.fecha_regreso)}
                  </p>
                )}
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Viajeros</p>
                {editing ? (
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="text-xs text-gray-600 block mb-1">
                        Adultos
                      </label>
                      <input
                        type="number"
                        value={editData.num_adultos || 0}
                        onChange={(e) =>
                          setEditData({
                            ...editData,
                            num_adultos: parseInt(e.target.value) || 0,
                          })
                        }
                        className="w-full border rounded-lg px-3 py-2"
                        min="0"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-600 block mb-1">
                        Niños
                      </label>
                      <input
                        type="number"
                        value={editData.num_ninos || 0}
                        onChange={(e) =>
                          setEditData({
                            ...editData,
                            num_ninos: parseInt(e.target.value) || 0,
                          })
                        }
                        className="w-full border rounded-lg px-3 py-2"
                        min="0"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-600 block mb-1">
                        Infantes
                      </label>
                      <input
                        type="number"
                        value={editData.num_infantes || 0}
                        onChange={(e) =>
                          setEditData({
                            ...editData,
                            num_infantes: parseInt(e.target.value) || 0,
                          })
                        }
                        className="w-full border rounded-lg px-3 py-2"
                        min="0"
                      />
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-700">
                    {cotizacion.num_adultos} adulto(s), {cotizacion.num_ninos}{" "}
                    niño(s), {cotizacion.num_infantes || 0} infante(s)
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Budget */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Presupuesto
            </h2>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-gray-500 mb-1">
                  Presupuesto Aproximado
                </p>
                {editing ? (
                  <input
                    type="number"
                    value={editData.presupuesto_aprox || ""}
                    onChange={(e) =>
                      setEditData({
                        ...editData,
                        presupuesto_aprox: e.target.value,
                      })
                    }
                    className="w-full border rounded-lg px-3 py-2"
                    step="0.01"
                  />
                ) : (
                  <p className="text-2xl font-bold text-gray-900">
                    ${presupuesto.toLocaleString("es-MX")} {cotizacion.divisa}
                  </p>
                )}
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Divisa</p>
                {editing ? (
                  <select
                    value={editData.divisa}
                    onChange={(e) =>
                      setEditData({ ...editData, divisa: e.target.value })
                    }
                    className="w-full border rounded-lg px-3 py-2"
                  >
                    <option value="MXN">MXN</option>
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                  </select>
                ) : (
                  <p className="text-sm text-gray-700">{cotizacion.divisa}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Package Options */}
        <div className="mt-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                Opciones de Paquetes
              </h2>
              {editing && (
                <button
                  onClick={() => {
                    // Pre-fill vuelo dates from cotizacion
                    setNewOpcion({
                      ...newOpcion,
                      vuelo_ida_fecha:
                        cotizacion.fecha_salida?.split("T")[0] || "",
                      vuelo_regreso_fecha:
                        cotizacion.fecha_regreso?.split("T")[0] || "",
                    });
                    setShowAddOpcion(!showAddOpcion);
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <Plus size={18} />
                  Agregar Opción
                </button>
              )}
            </div>

            {/* Add New Option Form */}
            {editing && showAddOpcion && (
              <div className="mb-6 p-6 border-2 border-blue-300 rounded-lg bg-blue-50">
                <h3 className="font-semibold mb-4 text-lg">Nueva Opción</h3>
                <div className="space-y-4">
                  {/* Operador */}
                  <select
                    value={newOpcion.operador_id}
                    onChange={(e) =>
                      setNewOpcion({
                        ...newOpcion,
                        operador_id: e.target.value,
                      })
                    }
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                  >
                    <option value="">Selecciona operador</option>
                    {operadores.map((op) => (
                      <option key={op.id} value={op.id}>
                        {op.nombre}
                      </option>
                    ))}
                    <option value="otro">Otro</option>
                  </select>

                  {/* Nombre Paquete */}
                  <input
                    type="text"
                    value={newOpcion.nombre_paquete}
                    onChange={(e) =>
                      setNewOpcion({
                        ...newOpcion,
                        nombre_paquete: e.target.value,
                      })
                    }
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-3"
                    placeholder="Nombre del paquete"
                  />

                  {/* Descripción */}
                  <textarea
                    value={newOpcion.servicio_descripcion}
                    onChange={(e) =>
                      setNewOpcion({
                        ...newOpcion,
                        servicio_descripcion: e.target.value,
                      })
                    }
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-3"
                    placeholder="Descripción del servicio"
                    rows="2"
                  />

                  {/* Hotel + Ocupación */}
                  <div className="grid grid-cols-2 gap-4">
                    <input
                      type="text"
                      value={newOpcion.hotel_nombre}
                      onChange={(e) =>
                        setNewOpcion({
                          ...newOpcion,
                          hotel_nombre: e.target.value,
                        })
                      }
                      className="border-2 border-gray-200 rounded-xl px-4 py-3"
                      placeholder="Hotel"
                    />
                    <input
                      type="text"
                      value={newOpcion.ocupacion}
                      onChange={(e) =>
                        setNewOpcion({
                          ...newOpcion,
                          ocupacion: e.target.value,
                        })
                      }
                      className="border-2 border-gray-200 rounded-xl px-4 py-3"
                      placeholder="Ocupación (ej: DOUBLE DBL)"
                    />
                  </div>

                  {/* Vuelo Ida */}
                  <div className="bg-white p-4 rounded-xl border border-gray-200">
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      ✈️ Vuelo de Ida
                    </label>
                    <div className="grid grid-cols-3 gap-4 mb-2">
                      <input
                        type="date"
                        value={newOpcion.vuelo_ida_fecha}
                        onChange={(e) =>
                          setNewOpcion({
                            ...newOpcion,
                            vuelo_ida_fecha: e.target.value,
                          })
                        }
                        className="border-2 border-gray-200 rounded-xl px-4 py-3"
                      />
                      <input
                        type="text"
                        value={newOpcion.vuelo_ida_horario}
                        onChange={(e) =>
                          setNewOpcion({
                            ...newOpcion,
                            vuelo_ida_horario: e.target.value,
                          })
                        }
                        className="border-2 border-gray-200 rounded-xl px-4 py-3"
                        placeholder="Horario (ej: 08:30 - 12:40)"
                      />
                      <input
                        type="text"
                        value={newOpcion.vuelo_ida_ruta}
                        onChange={(e) =>
                          setNewOpcion({
                            ...newOpcion,
                            vuelo_ida_ruta: e.target.value,
                          })
                        }
                        className="border-2 border-gray-200 rounded-xl px-4 py-3"
                        placeholder="Ruta (ej: CUU-CUN)"
                      />
                    </div>
                    <label className="flex items-center gap-2 text-sm text-gray-600">
                      <input
                        type="checkbox"
                        checked={newOpcion.vuelo_ida_directo || false}
                        onChange={(e) =>
                          setNewOpcion({
                            ...newOpcion,
                            vuelo_ida_directo: e.target.checked,
                          })
                        }
                        className="rounded"
                      />
                      Vuelo directo
                    </label>
                  </div>

                  {/* Vuelo Regreso */}
                  <div className="bg-white p-4 rounded-xl border border-gray-200">
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      ✈️ Vuelo de Regreso
                    </label>
                    <div className="grid grid-cols-3 gap-4 mb-2">
                      <input
                        type="date"
                        value={newOpcion.vuelo_regreso_fecha}
                        onChange={(e) =>
                          setNewOpcion({
                            ...newOpcion,
                            vuelo_regreso_fecha: e.target.value,
                          })
                        }
                        className="border-2 border-gray-200 rounded-xl px-4 py-3"
                      />
                      <input
                        type="text"
                        value={newOpcion.vuelo_regreso_horario}
                        onChange={(e) =>
                          setNewOpcion({
                            ...newOpcion,
                            vuelo_regreso_horario: e.target.value,
                          })
                        }
                        className="border-2 border-gray-200 rounded-xl px-4 py-3"
                        placeholder="Horario (ej: 13:25 - 15:40)"
                      />
                      <input
                        type="text"
                        value={newOpcion.vuelo_regreso_ruta}
                        onChange={(e) =>
                          setNewOpcion({
                            ...newOpcion,
                            vuelo_regreso_ruta: e.target.value,
                          })
                        }
                        className="border-2 border-gray-200 rounded-xl px-4 py-3"
                        placeholder="Ruta (ej: CUN-CUU)"
                      />
                    </div>
                    <label className="flex items-center gap-2 text-sm text-gray-600">
                      <input
                        type="checkbox"
                        checked={newOpcion.vuelo_regreso_directo || false}
                        onChange={(e) =>
                          setNewOpcion({
                            ...newOpcion,
                            vuelo_regreso_directo: e.target.checked,
                          })
                        }
                        className="rounded"
                      />
                      Vuelo directo
                    </label>
                  </div>

                  {/* Precios */}
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="text-xs text-gray-600 mb-1 block">
                        Precio Adulto
                      </label>
                      <input
                        type="number"
                        value={newOpcion.precio_adulto || ""}
                        onChange={(e) => {
                          const newVal = e.target.value;
                          const adulto = parseFloat(newVal) || 0;
                          const menor = parseFloat(newOpcion.precio_menor) || 0;
                          const infante =
                            parseFloat(newOpcion.precio_infante) || 0;
                          const total =
                            adulto * (editData.num_adultos || 0) +
                            menor * (editData.num_ninos || 0) +
                            infante * (editData.num_infantes || 0);
                          setNewOpcion({
                            ...newOpcion,
                            precio_adulto: newVal,
                            precio_total: total.toString(),
                          });
                        }}
                        className="w-full border-2 border-gray-200 rounded-xl px-4 py-3"
                        placeholder="0.00"
                        step="0.01"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-600 mb-1 block">
                        Precio Menor
                      </label>
                      <input
                        type="number"
                        value={newOpcion.precio_menor || ""}
                        onChange={(e) => {
                          const newVal = e.target.value;
                          const adulto =
                            parseFloat(newOpcion.precio_adulto) || 0;
                          const menor = parseFloat(newVal) || 0;
                          const infante =
                            parseFloat(newOpcion.precio_infante) || 0;
                          const total =
                            adulto * (editData.num_adultos || 0) +
                            menor * (editData.num_ninos || 0) +
                            infante * (editData.num_infantes || 0);
                          setNewOpcion({
                            ...newOpcion,
                            precio_menor: newVal,
                            precio_total: total.toString(),
                          });
                        }}
                        className="w-full border-2 border-gray-200 rounded-xl px-4 py-3"
                        placeholder="0.00"
                        step="0.01"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-600 mb-1 block">
                        Precio Infante
                      </label>
                      <input
                        type="number"
                        value={newOpcion.precio_infante || ""}
                        onChange={(e) => {
                          const newVal = e.target.value;
                          const adulto =
                            parseFloat(newOpcion.precio_adulto) || 0;
                          const menor = parseFloat(newOpcion.precio_menor) || 0;
                          const infante = parseFloat(newVal) || 0;
                          const total =
                            adulto * (editData.num_adultos || 0) +
                            menor * (editData.num_ninos || 0) +
                            infante * (editData.num_infantes || 0);
                          setNewOpcion({
                            ...newOpcion,
                            precio_infante: newVal,
                            precio_total: total.toString(),
                          });
                        }}
                        className="w-full border-2 border-gray-200 rounded-xl px-4 py-3"
                        placeholder="0.00"
                        step="0.01"
                      />
                    </div>
                  </div>

                  {/* Precio Total */}
                  <div>
                    <label className="text-xs text-gray-600 mb-1 block">
                      Precio Total (Auto-calculado: {editData?.num_adultos || 0}{" "}
                      adultos + {editData?.num_ninos || 0} menores +{" "}
                      {editData?.num_infantes || 0} infantes)
                    </label>
                    <input
                      type="number"
                      value={newOpcion.precio_total || ""}
                      readOnly
                      className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 bg-gray-100"
                      placeholder="0.00"
                    />
                  </div>

                  {/* Incluye */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Incluye
                    </label>
                    <input
                      type="text"
                      value={newOpcion.incluye}
                      onChange={(e) =>
                        setNewOpcion({
                          ...newOpcion,
                          incluye: e.target.value,
                        })
                      }
                      className="w-full border-2 border-gray-200 rounded-xl px-4 py-3"
                      placeholder="Separado por comas"
                    />
                  </div>

                  {/* No Incluye */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      No Incluye
                    </label>
                    <input
                      type="text"
                      value={newOpcion.no_incluye}
                      onChange={(e) =>
                        setNewOpcion({
                          ...newOpcion,
                          no_incluye: e.target.value,
                        })
                      }
                      className="w-full border-2 border-gray-200 rounded-xl px-4 py-3"
                      placeholder="Separado por comas"
                    />
                  </div>

                  {/* Links */}
                  <div className="grid grid-cols-2 gap-4">
                    <input
                      type="url"
                      value={newOpcion.link_paquete}
                      onChange={(e) =>
                        setNewOpcion({
                          ...newOpcion,
                          link_paquete: e.target.value,
                        })
                      }
                      className="border-2 border-gray-200 rounded-xl px-4 py-3"
                      placeholder="Link del paquete"
                    />
                    <input
                      type="url"
                      value={newOpcion.tour_link}
                      onChange={(e) =>
                        setNewOpcion({
                          ...newOpcion,
                          tour_link: e.target.value,
                        })
                      }
                      className="border-2 border-gray-200 rounded-xl px-4 py-3"
                      placeholder="Link de tours"
                    />
                  </div>

                  {/* Buttons */}
                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={handleAddOpcion}
                      className="px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 font-semibold transition-all"
                    >
                      Agregar Opción
                    </button>
                    <button
                      onClick={() => setShowAddOpcion(false)}
                      className="px-6 py-3 bg-gray-200 rounded-xl hover:bg-gray-300 font-semibold transition-all"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Options List */}
            <div className="space-y-4">
              {(editing ? editingOpciones : opciones).map((op, idx) => {
                const precioOpcion = parseFloat(op.precio_total) || 0;
                const diferencia = presupuesto - precioOpcion;
                const incluyeArray = Array.isArray(op.incluye)
                  ? op.incluye
                  : typeof op.incluye === "string"
                    ? op.incluye.split(",")
                    : [];
                const noIncluyeArray = Array.isArray(op.no_incluye)
                  ? op.no_incluye.filter((item) => item && item.trim())
                  : typeof op.no_incluye === "string"
                    ? op.no_incluye
                        .split(",")
                        .filter((item) => item && item.trim())
                    : [];

                return (
                  <div
                    key={op.id || op.temp_id}
                    className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
                  >
                    {/* Budget Comparison */}
                    {presupuesto > 0 && !editing && (
                      <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="text-xs text-gray-500 mb-1">
                              Comparación con presupuesto
                            </p>
                            <p
                              className={`text-lg font-bold ${
                                diferencia >= 0
                                  ? "text-green-600"
                                  : "text-red-600"
                              }`}
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
                          value={op.operador_id || ""}
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

                        <textarea
                          value={op.servicio_descripcion || ""}
                          onChange={(e) =>
                            handleUpdateOpcion(
                              idx,
                              "servicio_descripcion",
                              e.target.value
                            )
                          }
                          className="w-full border rounded-lg px-4 py-2"
                          placeholder="Descripción del servicio"
                          rows="2"
                        />

                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="text"
                            value={op.hotel_nombre || ""}
                            onChange={(e) =>
                              handleUpdateOpcion(
                                idx,
                                "hotel_nombre",
                                e.target.value
                              )
                            }
                            className="border rounded-lg px-4 py-2"
                            placeholder="Hotel"
                          />
                          <input
                            type="text"
                            value={op.ocupacion || ""}
                            onChange={(e) =>
                              handleUpdateOpcion(
                                idx,
                                "ocupacion",
                                e.target.value
                              )
                            }
                            className="border rounded-lg px-4 py-2"
                            placeholder="Ocupación"
                          />
                        </div>

                        <div className="p-3 bg-gray-50 rounded">
                          <label className="text-sm font-medium text-gray-700 block mb-2">
                            <Plane size={16} className="inline mr-1" />
                            Vuelo de Ida
                          </label>
                          <div className="grid grid-cols-3 gap-2 mb-2">
                            <input
                              type="date"
                              value={op.vuelo_ida_fecha || ""}
                              onChange={(e) =>
                                handleUpdateOpcion(
                                  idx,
                                  "vuelo_ida_fecha",
                                  e.target.value
                                )
                              }
                              className="border rounded-lg px-3 py-2"
                            />
                            <input
                              type="text"
                              value={op.vuelo_ida_horario || ""}
                              onChange={(e) =>
                                handleUpdateOpcion(
                                  idx,
                                  "vuelo_ida_horario",
                                  e.target.value
                                )
                              }
                              className="border rounded-lg px-3 py-2"
                              placeholder="08:30 - 12:40"
                            />
                            <input
                              type="text"
                              value={op.vuelo_ida_ruta || ""}
                              onChange={(e) =>
                                handleUpdateOpcion(
                                  idx,
                                  "vuelo_ida_ruta",
                                  e.target.value
                                )
                              }
                              className="border rounded-lg px-3 py-2"
                              placeholder="CUU-CUN"
                            />
                          </div>
                          <label className="flex items-center gap-2 text-sm text-gray-600">
                            <input
                              type="checkbox"
                              checked={op.vuelo_ida_directo || false}
                              onChange={(e) =>
                                handleUpdateOpcion(
                                  idx,
                                  "vuelo_ida_directo",
                                  e.target.checked
                                )
                              }
                              className="rounded"
                            />
                            Vuelo directo
                          </label>
                        </div>

                        <div className="p-3 bg-gray-50 rounded">
                          <label className="text-sm font-medium text-gray-700 block mb-2">
                            <Plane size={16} className="inline mr-1" />
                            Vuelo de Regreso
                          </label>
                          <div className="grid grid-cols-3 gap-2 mb-2">
                            <input
                              type="date"
                              value={op.vuelo_regreso_fecha || ""}
                              onChange={(e) =>
                                handleUpdateOpcion(
                                  idx,
                                  "vuelo_regreso_fecha",
                                  e.target.value
                                )
                              }
                              className="border rounded-lg px-3 py-2"
                            />
                            <input
                              type="text"
                              value={op.vuelo_regreso_horario || ""}
                              onChange={(e) =>
                                handleUpdateOpcion(
                                  idx,
                                  "vuelo_regreso_horario",
                                  e.target.value
                                )
                              }
                              className="border rounded-lg px-3 py-2"
                              placeholder="13:25 - 15:40"
                            />
                            <input
                              type="text"
                              value={op.vuelo_regreso_ruta || ""}
                              onChange={(e) =>
                                handleUpdateOpcion(
                                  idx,
                                  "vuelo_regreso_ruta",
                                  e.target.value
                                )
                              }
                              className="border rounded-lg px-3 py-2"
                              placeholder="CUN-CUU"
                            />
                          </div>
                          <label className="flex items-center gap-2 text-sm text-gray-600">
                            <input
                              type="checkbox"
                              checked={op.vuelo_regreso_directo || false}
                              onChange={(e) =>
                                handleUpdateOpcion(
                                  idx,
                                  "vuelo_regreso_directo",
                                  e.target.checked
                                )
                              }
                              className="rounded"
                            />
                            Vuelo directo
                          </label>
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <label className="text-xs text-gray-600 mb-1 block">
                              Precio Adulto
                            </label>
                            <input
                              type="number"
                              value={op.precio_adulto || ""}
                              onChange={(e) => {
                                const newVal = e.target.value;
                                const adulto = parseFloat(newVal) || 0;
                                const menor = parseFloat(op.precio_menor) || 0;
                                const infante =
                                  parseFloat(op.precio_infante) || 0;
                                const total =
                                  adulto * (editData.num_adultos || 0) +
                                  menor * (editData.num_ninos || 0) +
                                  infante * (editData.num_infantes || 0);

                                const updated = [...editingOpciones];
                                updated[idx] = {
                                  ...updated[idx],
                                  precio_adulto: newVal,
                                  precio_total: total.toString(),
                                };
                                setEditingOpciones(updated);
                              }}
                              className="w-full border rounded-lg px-4 py-2"
                              placeholder="0.00"
                              step="0.01"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-gray-600 mb-1 block">
                              Precio Menor
                            </label>
                            <input
                              type="number"
                              value={op.precio_menor || ""}
                              onChange={(e) => {
                                const newVal = e.target.value;
                                const adulto =
                                  parseFloat(op.precio_adulto) || 0;
                                const menor = parseFloat(newVal) || 0;
                                const infante =
                                  parseFloat(op.precio_infante) || 0;
                                const total =
                                  adulto * (editData.num_adultos || 0) +
                                  menor * (editData.num_ninos || 0) +
                                  infante * (editData.num_infantes || 0);

                                const updated = [...editingOpciones];
                                updated[idx] = {
                                  ...updated[idx],
                                  precio_menor: newVal,
                                  precio_total: total.toString(),
                                };
                                setEditingOpciones(updated);
                              }}
                              className="w-full border rounded-lg px-4 py-2"
                              placeholder="0.00"
                              step="0.01"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-gray-600 mb-1 block">
                              Precio Infante
                            </label>
                            <input
                              type="number"
                              value={op.precio_infante || ""}
                              onChange={(e) => {
                                const newVal = e.target.value;
                                const adulto =
                                  parseFloat(op.precio_adulto) || 0;
                                const menor = parseFloat(op.precio_menor) || 0;
                                const infante = parseFloat(newVal) || 0;
                                const total =
                                  adulto * (editData.num_adultos || 0) +
                                  menor * (editData.num_ninos || 0) +
                                  infante * (editData.num_infantes || 0);

                                const updated = [...editingOpciones];
                                updated[idx] = {
                                  ...updated[idx],
                                  precio_infante: newVal,
                                  precio_total: total.toString(),
                                };
                                setEditingOpciones(updated);
                              }}
                              className="w-full border rounded-lg px-4 py-2"
                              placeholder="0.00"
                              step="0.01"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="text-xs text-gray-600 mb-1 block">
                            Precio Total (Auto-calculado: {editData.num_adultos}{" "}
                            adultos + {editData.num_ninos} menores +{" "}
                            {editData.num_infantes || 0} infantes)
                          </label>
                          <input
                            type="number"
                            value={op.precio_total || ""}
                            readOnly
                            className="w-full border rounded-lg px-4 py-2 bg-gray-100"
                            placeholder="0.00"
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

                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="url"
                            value={op.link_paquete || ""}
                            onChange={(e) =>
                              handleUpdateOpcion(
                                idx,
                                "link_paquete",
                                e.target.value
                              )
                            }
                            className="border rounded-lg px-4 py-2"
                            placeholder="Link del paquete"
                          />
                          <input
                            type="url"
                            value={op.tour_link || ""}
                            onChange={(e) =>
                              handleUpdateOpcion(
                                idx,
                                "tour_link",
                                e.target.value
                              )
                            }
                            className="border rounded-lg px-4 py-2"
                            placeholder="Link de tours"
                          />
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex justify-between items-start mb-4">
                          <h4 className="font-semibold text-lg">
                            Opción {idx + 1}
                          </h4>
                          <span className="text-2xl font-bold text-primary">
                            ${precioOpcion.toLocaleString("es-MX")}{" "}
                            {cotizacion.divisa}
                          </span>
                        </div>

                        <p className="font-medium text-gray-900 mb-2">
                          {op.nombre_paquete}
                        </p>

                        {op.servicio_descripcion && (
                          <p className="text-sm text-gray-600 mb-3 bg-gray-50 p-3 rounded">
                            {op.servicio_descripcion}
                          </p>
                        )}

                        {op.hotel_nombre && (
                          <div className="mb-3 p-3 bg-blue-50 rounded">
                            <p className="text-sm font-medium text-blue-900">
                              🏨 {op.hotel_nombre}
                            </p>
                            {op.ocupacion && (
                              <p className="text-xs text-blue-700 mt-1">
                                Ocupación: {op.ocupacion}
                              </p>
                            )}
                          </div>
                        )}

                        {(op.vuelo_ida_fecha || op.vuelo_regreso_fecha) && (
                          <div className="mb-3 p-3 bg-green-50 rounded space-y-2">
                            {op.vuelo_ida_fecha && (
                              <div>
                                <p className="text-xs font-medium text-green-700">
                                  ✈️ Vuelo de Ida
                                </p>
                                <p className="text-sm text-gray-900">
                                  {formatDate(op.vuelo_ida_fecha)}
                                  {op.vuelo_ida_horario &&
                                    ` • ${op.vuelo_ida_horario}`}
                                  {op.vuelo_ida_ruta &&
                                    ` • ${op.vuelo_ida_ruta}`}
                                </p>
                              </div>
                            )}
                            {op.vuelo_regreso_fecha && (
                              <div>
                                <p className="text-xs font-medium text-green-700">
                                  ✈️ Vuelo de Regreso
                                </p>
                                <p className="text-sm text-gray-900">
                                  {formatDate(op.vuelo_regreso_fecha)}
                                  {op.vuelo_regreso_horario &&
                                    ` • ${op.vuelo_regreso_horario}`}
                                  {op.vuelo_regreso_ruta &&
                                    ` • ${op.vuelo_regreso_ruta}`}
                                </p>
                              </div>
                            )}
                          </div>
                        )}

                        <p className="text-sm text-gray-600 mb-2">
                          Operador: {getOperadorNombre(op.operador_id)}
                        </p>

                        <p className="text-sm text-gray-600 mb-2">
                          <strong>Viajeros:</strong>{" "}
                          {cotizacion.num_adultos + cotizacion.num_ninos}{" "}
                          persona(s)
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

                        <div className="mt-3 flex gap-2">
                          {op.link_paquete && (
                            <a
                              href={op.link_paquete}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-blue-600 hover:underline"
                            >
                              Ver paquete original
                            </a>
                          )}
                          {op.tour_link && (
                            <a
                              href={op.tour_link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-purple-600 hover:underline"
                            >
                              Ver tours disponibles
                            </a>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Notes */}
        {cotizacion.notas && !editing && (
          <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <h3 className="font-semibold text-gray-900 mb-2">Notas</h3>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">
              {cotizacion.notas}
            </p>
          </div>
        )}

        {editing && (
          <div className="mt-6 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-2">Notas</h3>
            <textarea
              value={editData.notas || ""}
              onChange={(e) =>
                setEditData({ ...editData, notas: e.target.value })
              }
              className="w-full border rounded-lg px-4 py-2"
              rows="4"
              placeholder="Notas adicionales..."
            />
          </div>
        )}
      </div>
    </div>
  );
}
